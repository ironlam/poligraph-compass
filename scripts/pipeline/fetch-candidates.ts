/**
 * Fetch candidate scrutins from the Poligraph API.
 * Filters out: procedural votes, unanimous votes, and scrutins already in scrutins.json.
 *
 * Usage: npx tsx scripts/pipeline/fetch-candidates.ts [--legislature 17] [--min-votes 200]
 */

import fs from "fs";
import {
  POLIGRAPH_API,
  SCRUTINS_PATH,
  CANDIDATES_PATH,
  PIPELINE_DIR,
  readJsonFile,
  writeJsonFile,
  type ApiScrutin,
  type Candidate,
} from "./shared";

// --- Config ---

const DEFAULT_LEGISLATURE = 17;
const DEFAULT_MIN_TOTAL_VOTES = 200;
const MIN_DISSENT_RATIO = 0.1; // At least 10% voted differently from the majority

// --- CLI args ---

function parseArgs() {
  const args = process.argv.slice(2);
  let legislature = DEFAULT_LEGISLATURE;
  let minVotes = DEFAULT_MIN_TOTAL_VOTES;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--legislature" && args[i + 1]) {
      legislature = parseInt(args[i + 1], 10);
      i++;
    }
    if (args[i] === "--min-votes" && args[i + 1]) {
      minVotes = parseInt(args[i + 1], 10);
      i++;
    }
  }

  return { legislature, minVotes };
}

// --- API fetching ---

interface ApiResponse {
  data: ApiScrutin[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function fetchScrutinPage(
  page: number,
  legislature: number
): Promise<ApiResponse> {
  const url = `${POLIGRAPH_API}/votes?legislature=${legislature}&page=${page}&limit=100`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function fetchAllScrutins(legislature: number): Promise<ApiScrutin[]> {
  const all: ApiScrutin[] = [];
  let page = 1;

  while (true) {
    console.log(`  Fetching page ${page}...`);
    const response = await fetchScrutinPage(page, legislature);
    all.push(...response.data);

    if (page >= response.pagination.totalPages) break;
    page++;
  }

  return all;
}

// --- Filtering ---

function isProcedural(title: string): boolean {
  const proceduralPatterns = [
    /motion de censure/i,
    /motion de rejet pr[eé]alable/i,
    /motion r[eé]f[eé]rendaire/i,
    /exception d'irrecevabilit[eé]/i,
    /question pr[eé]alable/i,
    /renvoi en commission/i,
    /demande de suspension/i,
    /rappel au r[eè]glement/i,
    /demande de v[eé]rification du quorum/i,
    /lev[eé]e de la s[eé]ance/i,
    /ordre du jour/i,
    /r[eé]solution.*r[eè]glement/i,
    /modification.*r[eè]glement.*assembl[eé]e/i,
  ];
  return proceduralPatterns.some((p) => p.test(title));
}

function isUnanimousOrNearUnanimous(scrutin: ApiScrutin): boolean {
  const total = scrutin.votesFor + scrutin.votesAgainst + scrutin.votesAbstain;
  if (total === 0) return true;

  const minority = Math.min(scrutin.votesFor, scrutin.votesAgainst);
  const dissentRatio = minority / total;

  return dissentRatio < MIN_DISSENT_RATIO;
}

function hasEnoughVotes(scrutin: ApiScrutin, minVotes: number): boolean {
  return scrutin.totalVotes >= minVotes;
}

// --- Main ---

async function main() {
  const { legislature, minVotes } = parseArgs();

  console.log(`=== Fetch Candidate Scrutins ===`);
  console.log(`Legislature: ${legislature}`);
  console.log(`Min total votes: ${minVotes}`);
  console.log(
    `Min dissent ratio: ${(MIN_DISSENT_RATIO * 100).toFixed(0)}%\n`
  );

  // Load existing scrutin IDs
  const existing: Array<{ scrutinId: string }> = readJsonFile(SCRUTINS_PATH);
  const existingIds = new Set(existing.map((s) => s.scrutinId));
  console.log(`Existing scrutins in dataset: ${existingIds.size}`);

  // Fetch all scrutins from API
  console.log(`\nFetching scrutins from Poligraph API...`);
  const allScrutins = await fetchAllScrutins(legislature);
  console.log(`Fetched ${allScrutins.length} scrutins total\n`);

  // Filter
  const candidates: Candidate[] = [];
  const stats = {
    alreadyInDataset: 0,
    procedural: 0,
    unanimousOrNear: 0,
    tooFewVotes: 0,
    selected: 0,
  };

  for (const scrutin of allScrutins) {
    if (existingIds.has(scrutin.id)) {
      stats.alreadyInDataset++;
      continue;
    }

    if (isProcedural(scrutin.title)) {
      stats.procedural++;
      continue;
    }

    if (!hasEnoughVotes(scrutin, minVotes)) {
      stats.tooFewVotes++;
      continue;
    }

    if (isUnanimousOrNearUnanimous(scrutin)) {
      stats.unanimousOrNear++;
      continue;
    }

    const total =
      scrutin.votesFor + scrutin.votesAgainst + scrutin.votesAbstain;
    const dissentRatio = Math.min(scrutin.votesFor, scrutin.votesAgainst) / total;

    candidates.push({
      scrutinId: scrutin.id,
      officialTitle: scrutin.title,
      votingDate: scrutin.votingDate,
      result: scrutin.result === "ADOPTED" ? "adopte" : "rejete",
      voteCount: {
        pour: scrutin.votesFor,
        contre: scrutin.votesAgainst,
        abstention: scrutin.votesAbstain,
      },
      totalVotes: scrutin.totalVotes,
      selectionReason: `Dissent ratio: ${(dissentRatio * 100).toFixed(1)}%, ${scrutin.totalVotes} total votes`,
    });
    stats.selected++;
  }

  // Sort by dissent ratio (most divisive first, better ideological signal)
  candidates.sort((a, b) => {
    const totalA =
      a.voteCount.pour + a.voteCount.contre + a.voteCount.abstention;
    const totalB =
      b.voteCount.pour + b.voteCount.contre + b.voteCount.abstention;
    const ratioA = Math.min(a.voteCount.pour, a.voteCount.contre) / totalA;
    const ratioB = Math.min(b.voteCount.pour, b.voteCount.contre) / totalB;
    return ratioB - ratioA;
  });

  // Write output
  if (!fs.existsSync(PIPELINE_DIR)) {
    fs.mkdirSync(PIPELINE_DIR, { recursive: true });
  }
  writeJsonFile(CANDIDATES_PATH, candidates);

  console.log(`=== Filter Results ===`);
  console.log(`Already in dataset: ${stats.alreadyInDataset}`);
  console.log(`Procedural (excluded): ${stats.procedural}`);
  console.log(`Unanimous/near-unanimous (excluded): ${stats.unanimousOrNear}`);
  console.log(`Too few votes (excluded): ${stats.tooFewVotes}`);
  console.log(`Selected candidates: ${stats.selected}`);
  console.log(`\nOutput: ${CANDIDATES_PATH}`);
}

main().catch((err) => {
  console.error("Fetch failed:", err);
  process.exit(1);
});
