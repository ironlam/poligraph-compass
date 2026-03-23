/**
 * Validate pipeline output against the ScrutinConfig Zod schema.
 * Can validate either drafts.json or the full scrutins.json.
 *
 * Usage:
 *   npx tsx scripts/pipeline/validate.ts                  # validate scrutins.json
 *   npx tsx scripts/pipeline/validate.ts --drafts          # validate drafts.json as if merged
 */

import { z } from "zod";
import {
  SCRUTINS_PATH,
  DRAFTS_PATH,
  VALID_THEMES,
  readJsonFile,
  type Draft,
} from "./shared";

// Mirror of ScrutinConfigSchema with the 4-tier system
// (avoids importing from lib/ which uses module aliases)
const ScrutinEntrySchema = z.object({
  scrutinId: z.string().min(1),
  order: z.number().int().positive(),
  tier: z.enum(["core", "refine-1", "refine-2", "refine-3"]),
  axis: z.enum(["economy", "society"]),
  polarity: z.union([z.literal(1), z.literal(-1)]),
  theme: z.enum(VALID_THEMES as unknown as [string, ...string[]]),
  question: z.string().min(10, "Question too short"),
  officialTitle: z.string().optional(),
  summary: z.string().min(50, "Summary too short").optional(),
  result: z.enum(["adopte", "rejete"]).optional(),
  voteCount: z
    .object({
      pour: z.number().nonnegative(),
      contre: z.number().nonnegative(),
      abstention: z.number().nonnegative(),
    })
    .optional(),
});

const ScrutinsArraySchema = z.array(ScrutinEntrySchema);

// --- Consistency checks beyond schema ---

interface ConsistencyIssue {
  scrutinId: string;
  issue: string;
}

function checkConsistency(
  entries: z.infer<typeof ScrutinsArraySchema>
): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];

  // Check for duplicate scrutinIds
  const idCounts = new Map<string, number>();
  for (const entry of entries) {
    idCounts.set(entry.scrutinId, (idCounts.get(entry.scrutinId) || 0) + 1);
  }
  for (const [id, count] of idCounts) {
    if (count > 1) {
      issues.push({
        scrutinId: id,
        issue: `Duplicate scrutinId (appears ${count} times)`,
      });
    }
  }

  // Check for duplicate order numbers within same tier
  const ordersByTier = new Map<string, Set<number>>();
  for (const entry of entries) {
    if (!ordersByTier.has(entry.tier)) {
      ordersByTier.set(entry.tier, new Set());
    }
    const orders = ordersByTier.get(entry.tier)!;
    if (orders.has(entry.order)) {
      issues.push({
        scrutinId: entry.scrutinId,
        issue: `Duplicate order ${entry.order} in tier "${entry.tier}"`,
      });
    }
    orders.add(entry.order);
  }

  // Check tier counts
  const tierCounts = new Map<string, number>();
  for (const entry of entries) {
    tierCounts.set(entry.tier, (tierCounts.get(entry.tier) || 0) + 1);
  }
  const expectedCounts: Record<string, number> = {
    core: 20,
    "refine-1": 10,
    "refine-2": 10,
    "refine-3": 10,
  };
  for (const [tier, expected] of Object.entries(expectedCounts)) {
    const actual = tierCounts.get(tier) || 0;
    if (actual !== expected) {
      issues.push({
        scrutinId: "-",
        issue: `Tier "${tier}" has ${actual} entries, expected ${expected}`,
      });
    }
  }

  // Check axis balance (soft warning)
  const axisCounts = { economy: 0, society: 0 };
  for (const entry of entries) {
    axisCounts[entry.axis]++;
  }
  const ratio = axisCounts.economy / (axisCounts.economy + axisCounts.society);
  if (ratio < 0.35 || ratio > 0.65) {
    issues.push({
      scrutinId: "-",
      issue: `Axis imbalance: ${axisCounts.economy} economy vs ${axisCounts.society} society (ratio ${(ratio * 100).toFixed(0)}%)`,
    });
  }

  return issues;
}

// --- Main ---

function main() {
  const isDrafts = process.argv.includes("--drafts");

  if (isDrafts) {
    console.log("=== Validating Drafts ===\n");

    const drafts: Draft[] = readJsonFile(DRAFTS_PATH);
    const approved = drafts.filter(
      (d) => d.status === "approved" || d.status === "edited"
    );
    console.log(`Total drafts: ${drafts.length}`);
    console.log(`Approved/edited: ${approved.length}`);
    console.log(
      `Pending: ${drafts.filter((d) => d.status === "pending").length}`
    );
    console.log(
      `Rejected: ${drafts.filter((d) => d.status === "rejected").length}\n`
    );

    let errors = 0;
    for (const draft of approved) {
      const mockEntry = {
        scrutinId: draft.scrutinId,
        order: 99,
        tier: "refine-2" as const,
        axis: draft.axis,
        polarity: draft.polarity,
        theme: draft.theme,
        question: draft.question,
        officialTitle: draft.officialTitle,
        summary: draft.summary,
        result: draft.result,
        voteCount: draft.voteCount,
      };

      const result = ScrutinEntrySchema.safeParse(mockEntry);
      if (!result.success) {
        errors++;
        console.log(`INVALID: ${draft.scrutinId}`);
        for (const issue of result.error.issues) {
          console.log(`  ${issue.path.join(".")}: ${issue.message}`);
        }
      }
    }

    if (errors === 0) {
      console.log("All approved drafts pass schema validation.");
    } else {
      console.log(`\n${errors} draft(s) have validation errors.`);
      process.exit(1);
    }
  } else {
    console.log("=== Validating scrutins.json ===\n");

    const entries = readJsonFile<unknown[]>(SCRUTINS_PATH);
    console.log(`Total entries: ${entries.length}\n`);

    const result = ScrutinsArraySchema.safeParse(entries);
    if (!result.success) {
      console.log("SCHEMA VALIDATION FAILED:\n");
      for (const issue of result.error.issues) {
        console.log(`  [${issue.path.join(".")}] ${issue.message}`);
      }
      process.exit(1);
    }

    console.log("Schema validation: PASS\n");

    const issues = checkConsistency(result.data);
    if (issues.length > 0) {
      console.log("CONSISTENCY ISSUES:");
      for (const issue of issues) {
        const prefix =
          issue.scrutinId === "-" ? "GLOBAL" : issue.scrutinId.slice(0, 12);
        console.log(`  [${prefix}] ${issue.issue}`);
      }
    } else {
      console.log("Consistency checks: PASS");
    }

    // Print tier breakdown
    const tierCounts = new Map<string, number>();
    for (const entry of result.data) {
      tierCounts.set(entry.tier, (tierCounts.get(entry.tier) || 0) + 1);
    }
    console.log("\nTier breakdown:");
    for (const [tier, count] of tierCounts) {
      console.log(`  ${tier}: ${count} questions`);
    }
  }
}

main();
