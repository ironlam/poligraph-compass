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

// --- Configuration ---

const DEFAULT_MIN_OVERLAP = 5;
const MIN_OVERLAP_RATIO = 0.4;
const WILSON_Z = 1.64; // 90% confidence interval

// --- Wilson Score ---
//
// Lower bound of the Wilson confidence interval for a binomial proportion.
// Same approach used by Reddit for ranking comments (Evan Miller, 2009,
// based on Edwin Wilson, 1927).
//
// Answers the question: "Given the votes we observed, what is the LOWEST
// plausible true agreement rate?"
//
// With few observations, the lower bound drops significantly below the raw
// rate. With many observations, it converges to the raw rate. This naturally
// penalizes matches based on sparse data without arbitrary thresholds.
//
// Partial votes (ABSTENTION matches) count as half an agreement: the deputy
// didn't fully agree or disagree, so we give partial credit.

export function wilsonScore(
  agree: number,
  partial: number,
  total: number,
  z: number = WILSON_Z
): number {
  if (total === 0) return 0;
  const positives = agree + 0.5 * partial;
  const p = positives / total;
  const zz = z * z;
  const denominator = 1 + zz / total;
  const center = p + zz / (2 * total);
  const spread = z * Math.sqrt((p * (1 - p) + zz / (4 * total)) / total);
  return (center - spread) / denominator;
}

export function computeMinOverlap(totalAnswered: number): number {
  return Math.max(DEFAULT_MIN_OVERLAP, Math.ceil(totalAnswered * MIN_OVERLAP_RATIO));
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
  const score = concordance < 0 ? -1 : Math.round(wilsonScore(agree, partial, total) * 100);

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
  const score = concordance < 0 ? -1 : Math.round(wilsonScore(agree, partial, total) * 100);

  return { concordance, score, agree, disagree, partial, overlap: total };
}
