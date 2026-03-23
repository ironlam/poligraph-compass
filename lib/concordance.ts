import type { UserAnswer, VotePosition } from "./types";

type PairResult = "agree" | "disagree" | "partial" | "skip";

export function classifyVotePair(
  userAnswer: UserAnswer | string,
  politicianVote: VotePosition | string
): PairResult {
  if (userAnswer === "SKIP") return "skip";
  if (politicianVote === "ABSENT" || politicianVote === "NON_VOTANT") return "skip";

  if (userAnswer === politicianVote) return "agree";

  const active = ["POUR", "CONTRE"];
  if (active.includes(userAnswer) && active.includes(politicianVote)) {
    return "disagree";
  }

  return "partial";
}

const DEFAULT_MIN_OVERLAP = 5;
const MIN_OVERLAP_RATIO = 0.4;
const COVERAGE_TARGET = 0.7;

export function computeMinOverlap(totalAnswered: number): number {
  return Math.max(DEFAULT_MIN_OVERLAP, Math.ceil(totalAnswered * MIN_OVERLAP_RATIO));
}

export function computeConfidenceScore(
  concordance: number,
  overlap: number,
  totalAnswered: number
): number {
  if (concordance < 0) return -1;
  const target = totalAnswered * COVERAGE_TARGET;
  const factor = Math.min(1, overlap / target);
  return Math.round(concordance * factor);
}

interface ConcordanceResult {
  concordance: number;
  score: number;
  agree: number;
  disagree: number;
  partial: number;
  overlap: number;
}

export function computePoliticianConcordance(
  politicianId: string,
  answers: Record<string, string>,
  voteMatrix: Record<string, Record<string, string>>,
  minOverlap?: number
): ConcordanceResult {
  let agree = 0;
  let disagree = 0;
  let partial = 0;

  for (const [scrutinId, userAnswer] of Object.entries(answers)) {
    const politicianVote = voteMatrix[scrutinId]?.[politicianId];
    if (!politicianVote) continue;

    const result = classifyVotePair(userAnswer, politicianVote);
    if (result === "agree") agree++;
    else if (result === "disagree") disagree++;
    else if (result === "partial") partial++;
  }

  const total = agree + disagree + partial;
  const threshold = minOverlap ?? DEFAULT_MIN_OVERLAP;
  const concordance = total < threshold ? -1 : Math.round((agree / total) * 100);
  const totalAnswered = Object.values(answers).filter((a) => a !== "SKIP").length;
  const score = computeConfidenceScore(concordance, total, totalAnswered);

  return { concordance, score, agree, disagree, partial, overlap: total };
}

export function computePartyConcordance(
  partyId: string,
  answers: Record<string, string>,
  partyMajorities: Record<string, Record<string, string>>,
  minOverlap?: number
): ConcordanceResult {
  let agree = 0;
  let disagree = 0;
  let partial = 0;

  for (const [scrutinId, userAnswer] of Object.entries(answers)) {
    const partyPosition = partyMajorities[scrutinId]?.[partyId];
    if (!partyPosition) continue;

    const result = classifyVotePair(userAnswer, partyPosition);
    if (result === "agree") agree++;
    else if (result === "disagree") disagree++;
    else if (result === "partial") partial++;
  }

  const total = agree + disagree + partial;
  const threshold = minOverlap ?? DEFAULT_MIN_OVERLAP;
  const concordance = total < threshold ? -1 : Math.round((agree / total) * 100);
  const totalAnswered = Object.values(answers).filter((a) => a !== "SKIP").length;
  const score = computeConfidenceScore(concordance, total, totalAnswered);

  return { concordance, score, agree, disagree, partial, overlap: total };
}
