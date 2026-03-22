import type { CompassPosition } from "./types";

const MIN_ANSWERS_PER_AXIS = 3;

interface AxisResult {
  score: number;
  valid: boolean;
  answeredCount: number;
}

export function computeAxisPosition(
  answers: Record<string, string>,
  scrutinIds: string[],
  polarities: Record<string, 1 | -1>
): AxisResult {
  let sum = 0;
  let count = 0;

  for (const scrutinId of scrutinIds) {
    const answer = answers[scrutinId];
    if (!answer || answer === "SKIP") continue;

    const polarity = polarities[scrutinId];
    if (polarity === undefined) continue;

    let score: number;
    if (answer === "POUR") score = polarity;
    else if (answer === "CONTRE") score = -polarity;
    else score = 0; // ABSTENTION

    sum += score;
    count++;
  }

  const avgScore = count === 0 ? 0 : sum / count;
  const clamped = Math.max(-1, Math.min(1, avgScore));

  return {
    score: clamped,
    valid: count >= MIN_ANSWERS_PER_AXIS,
    answeredCount: count,
  };
}

export function computeCompassPosition(
  answers: Record<string, string>,
  axes: {
    economy: { scrutinIds: string[]; polarities: Record<string, 1 | -1> };
    society: { scrutinIds: string[]; polarities: Record<string, 1 | -1> };
  }
): CompassPosition {
  const economyResult = computeAxisPosition(
    answers,
    axes.economy.scrutinIds,
    axes.economy.polarities
  );
  const societyResult = computeAxisPosition(
    answers,
    axes.society.scrutinIds,
    axes.society.polarities
  );

  return {
    x: economyResult.score,
    y: societyResult.score,
    xValid: economyResult.valid,
    yValid: societyResult.valid,
  };
}
