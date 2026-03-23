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

const MIN_OVERLAP = 5;

interface ConcordanceResult {
  concordance: number;
  agree: number;
  disagree: number;
  partial: number;
  overlap: number;
}

export function computePoliticianConcordance(
  politicianId: string,
  answers: Record<string, string>,
  voteMatrix: Record<string, Record<string, string>>
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
    // skip: don't count
  }

  const total = agree + disagree + partial;
  const concordance = total < MIN_OVERLAP ? -1 : Math.round((agree / total) * 100);

  return { concordance, agree, disagree, partial, overlap: total };
}

export function computePartyConcordance(
  partyId: string,
  answers: Record<string, string>,
  partyMajorities: Record<string, Record<string, string>>
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
  const concordance = total < MIN_OVERLAP ? -1 : Math.round((agree / total) * 100);

  return { concordance, agree, disagree, partial, overlap: total };
}
