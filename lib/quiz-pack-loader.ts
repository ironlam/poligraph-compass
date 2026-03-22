import scrutinsConfig from "@/data/scrutins.json";
import type { QuizPack } from "./types";

let cachedQuizPack: QuizPack | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function loadQuizPackData(): Promise<QuizPack> {
  const now = Date.now();
  if (cachedQuizPack && now - cacheTimestamp < CACHE_TTL) {
    return cachedQuizPack;
  }

  // Build quiz pack from config + synced data
  // TODO: replace with actual synced data from Vercel KV once cron is implemented
  const questions = scrutinsConfig
    .sort((a, b) => a.order - b.order)
    .map((s) => ({
      scrutinId: s.scrutinId,
      question: s.question,
      theme: s.theme,
      tier: s.tier as "essential" | "refine",
      order: s.order,
      votingDate: "", // filled by sync
      chamber: "AN", // filled by sync
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
    voteMatrix: {}, // populated by sync cron
    politicians: [], // populated by sync cron
    parties: [], // populated by sync cron
    partyMajorities: {}, // populated by sync cron
    axes,
    generatedAt: new Date().toISOString(),
  };

  cachedQuizPack = quizPack;
  cacheTimestamp = now;

  return quizPack;
}

export function invalidateCache() {
  cachedQuizPack = null;
  cacheTimestamp = 0;
}
