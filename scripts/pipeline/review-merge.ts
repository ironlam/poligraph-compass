/**
 * Merge human-reviewed drafts into scrutins.json.
 * Only drafts with status "approved" or "edited" are merged.
 * Assigns tier and order based on current dataset state.
 *
 * Usage: npx tsx scripts/pipeline/review-merge.ts [--dry-run] [--tier refine-2]
 *
 * Workflow:
 * 1. Run pipeline:draft to generate drafts.json
 * 2. Open data/pipeline/drafts.json in your editor
 * 3. For each entry, set "status" to "approved", "edited", or "rejected"
 * 4. Optionally add "reviewNotes" for context
 * 5. Run this script to merge approved entries into scrutins.json
 */

import {
  SCRUTINS_PATH,
  DRAFTS_PATH,
  readJsonFile,
  writeJsonFile,
  type Draft,
} from "./shared";

type Tier = "core" | "refine-1" | "refine-2" | "refine-3";

interface ScrutinEntry {
  scrutinId: string;
  order: number;
  tier: Tier;
  axis: "economy" | "society";
  polarity: 1 | -1;
  theme: string;
  question: string;
  officialTitle: string;
  summary: string;
  result: "adopte" | "rejete";
  voteCount: {
    pour: number;
    contre: number;
    abstention: number;
  };
}

const TIER_CAPACITY: Record<Tier, number> = {
  core: 20,
  "refine-1": 10,
  "refine-2": 10,
  "refine-3": 10,
};

// --- CLI args ---

function parseArgs() {
  const args = process.argv.slice(2);
  let dryRun = false;
  let forceTier: Tier | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dry-run") {
      dryRun = true;
    }
    if (args[i] === "--tier" && args[i + 1]) {
      forceTier = args[i + 1] as Tier;
      i++;
    }
  }

  return { dryRun, forceTier };
}

// --- Tier assignment ---

function getNextAvailableTier(
  currentCounts: Record<Tier, number>,
  forceTier: Tier | null
): Tier | null {
  if (forceTier) {
    if (currentCounts[forceTier] < TIER_CAPACITY[forceTier]) {
      return forceTier;
    }
    return null;
  }

  // Fill tiers in order: refine-2, then refine-3
  // (core and refine-1 are assumed already complete)
  const fillOrder: Tier[] = ["refine-2", "refine-3"];
  for (const tier of fillOrder) {
    if (currentCounts[tier] < TIER_CAPACITY[tier]) {
      return tier;
    }
  }
  return null;
}

// --- Main ---

function main() {
  const { dryRun, forceTier } = parseArgs();

  console.log("=== Merge Approved Drafts ===");
  if (dryRun) console.log("(DRY RUN: no files will be modified)\n");
  else console.log();

  // Load current data
  const scrutins: ScrutinEntry[] = readJsonFile(SCRUTINS_PATH);
  const drafts: Draft[] = readJsonFile(DRAFTS_PATH);

  const existingIds = new Set(scrutins.map((s) => s.scrutinId));

  // Count current tier distribution
  const tierCounts: Record<Tier, number> = {
    core: 0,
    "refine-1": 0,
    "refine-2": 0,
    "refine-3": 0,
  };
  for (const s of scrutins) {
    const tier = s.tier as Tier;
    if (tier in tierCounts) tierCounts[tier]++;
  }

  console.log("Current tier counts:");
  for (const [tier, count] of Object.entries(tierCounts)) {
    console.log(`  ${tier}: ${count}/${TIER_CAPACITY[tier as Tier]}`);
  }

  // Filter approved drafts
  const approved = drafts.filter(
    (d) =>
      (d.status === "approved" || d.status === "edited") &&
      !existingIds.has(d.scrutinId)
  );

  const skippedDuplicates = drafts.filter(
    (d) =>
      (d.status === "approved" || d.status === "edited") &&
      existingIds.has(d.scrutinId)
  );

  console.log(`\nApproved drafts: ${approved.length}`);
  if (skippedDuplicates.length > 0) {
    console.log(`Skipped (already in dataset): ${skippedDuplicates.length}`);
  }

  // Find max order
  let maxOrder = Math.max(0, ...scrutins.map((s) => s.order));

  // Merge
  const merged: ScrutinEntry[] = [];

  for (const draft of approved) {
    const tier = getNextAvailableTier(tierCounts, forceTier);
    if (!tier) {
      console.log(`  SKIPPED (no tier capacity): ${draft.question}`);
      continue;
    }

    maxOrder++;
    tierCounts[tier]++;

    const entry: ScrutinEntry = {
      scrutinId: draft.scrutinId,
      order: maxOrder,
      tier,
      axis: draft.axis,
      polarity: draft.polarity,
      theme: draft.theme,
      question: draft.question,
      officialTitle: draft.officialTitle,
      summary: draft.summary,
      result: draft.result,
      voteCount: draft.voteCount,
    };

    merged.push(entry);
    console.log(`  [${tier}] #${maxOrder}: ${draft.question}`);
  }

  console.log(`\nMerged: ${merged.length} new entries`);

  // Final tier counts
  console.log("\nFinal tier counts:");
  for (const [tier, count] of Object.entries(tierCounts)) {
    const cap = TIER_CAPACITY[tier as Tier];
    const status = count === cap ? "FULL" : `${cap - count} remaining`;
    console.log(`  ${tier}: ${count}/${cap} (${status})`);
  }

  if (!dryRun && merged.length > 0) {
    const updated = [...scrutins, ...merged];
    writeJsonFile(SCRUTINS_PATH, updated);
    console.log(
      `\nWritten to ${SCRUTINS_PATH} (${updated.length} total entries)`
    );
    console.log("\nNext steps:");
    console.log("  1. Run: npm run pipeline:validate");
    console.log("  2. Run: npm run pipeline:audit");
    console.log("  3. Run: npm run sync (to fetch vote data for new scrutins)");
  } else if (dryRun) {
    console.log("\n(Dry run complete, no files modified)");
  } else {
    console.log("\nNothing to merge.");
  }
}

main();
