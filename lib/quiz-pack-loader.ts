import scrutinsConfig from "@/data/scrutins.json";
import type { QuizPack } from "./types";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

let cachedQuizPack: QuizPack | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const SYNCED_DATA_PATH = join(process.cwd(), "data", "synced-data.json");

interface SyncedData {
  voteMatrix: Record<string, Record<string, string>>;
  politicians: Array<{
    id: string;
    fullName: string;
    slug: string;
    photoUrl: string | null;
    partyShortName: string | null;
    partyId: string | null;
    mandateType: string;
  }>;
  parties: Array<{
    id: string;
    name: string;
    shortName: string;
    color: string | null;
  }>;
  partyMajorities: Record<string, Record<string, string>>;
  syncedAt: string;
}

function loadSyncedData(): SyncedData | null {
  try {
    if (existsSync(SYNCED_DATA_PATH)) {
      const raw = readFileSync(SYNCED_DATA_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch {
    console.warn("Could not load synced data, using defaults");
  }
  return null;
}

export async function loadQuizPackData(): Promise<QuizPack> {
  const now = Date.now();
  if (cachedQuizPack && now - cacheTimestamp < CACHE_TTL) {
    return cachedQuizPack;
  }

  const synced = loadSyncedData();

  const questions = scrutinsConfig
    .sort((a, b) => a.order - b.order)
    .map((s) => ({
      scrutinId: s.scrutinId,
      question: s.question,
      theme: s.theme,
      tier: s.tier as "essential" | "refine",
      order: s.order,
      votingDate: "",
      chamber: "AN",
    }));

  const axes = {
    economy: {
      scrutinIds: scrutinsConfig.filter((s) => s.axis === "economy").map((s) => s.scrutinId),
      polarities: Object.fromEntries(
        scrutinsConfig.filter((s) => s.axis === "economy").map((s) => [s.scrutinId, s.polarity])
      ) as Record<string, 1 | -1>,
    },
    society: {
      scrutinIds: scrutinsConfig.filter((s) => s.axis === "society").map((s) => s.scrutinId),
      polarities: Object.fromEntries(
        scrutinsConfig.filter((s) => s.axis === "society").map((s) => [s.scrutinId, s.polarity])
      ) as Record<string, 1 | -1>,
    },
  };

  const quizPack: QuizPack = {
    questions,
    voteMatrix: synced?.voteMatrix ?? {},
    politicians: synced?.politicians ?? [],
    parties: synced?.parties ?? [],
    partyMajorities: synced?.partyMajorities ?? {},
    axes,
    generatedAt: synced?.syncedAt ?? new Date().toISOString(),
  };

  cachedQuizPack = quizPack;
  cacheTimestamp = now;

  return quizPack;
}

export function invalidateCache() {
  cachedQuizPack = null;
  cacheTimestamp = 0;
}
