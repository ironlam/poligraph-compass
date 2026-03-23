import { classifyVotePair } from "./concordance";

interface ThemeConcordance {
  theme: string;
  agree: number;
  disagree: number;
  partial: number;
  total: number;
  percentage: number;
}

export function computeThemeConcordances(
  politicianId: string,
  userAnswers: Record<string, string>,
  voteMatrix: Record<string, Record<string, string>>,
  questions: Array<{ scrutinId: string; theme: string }>
): ThemeConcordance[] {
  const byTheme = new Map<string, { agree: number; disagree: number; partial: number }>();

  for (const q of questions) {
    const userAnswer = userAnswers[q.scrutinId];
    if (!userAnswer || userAnswer === "SKIP") continue;

    const politicianVote = voteMatrix[q.scrutinId]?.[politicianId];
    if (!politicianVote) continue;

    const result = classifyVotePair(userAnswer, politicianVote);
    if (result === "skip") continue;

    if (!byTheme.has(q.theme)) {
      byTheme.set(q.theme, { agree: 0, disagree: 0, partial: 0 });
    }
    const counts = byTheme.get(q.theme)!;

    if (result === "agree") counts.agree++;
    else if (result === "disagree") counts.disagree++;
    else if (result === "partial") counts.partial++;
  }

  return Array.from(byTheme.entries())
    .map(([theme, counts]) => {
      const total = counts.agree + counts.disagree + counts.partial;
      const percentage = total > 0 ? Math.round((counts.agree / total) * 100) : 0;
      return { theme, ...counts, total, percentage };
    })
    .sort((a, b) => b.total - a.total);
}
