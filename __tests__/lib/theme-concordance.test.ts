import { describe, it, expect } from "vitest";
import { computeThemeConcordances } from "@/lib/theme-concordance";

describe("computeThemeConcordances", () => {
  const questions = [
    { scrutinId: "s1", theme: "ECONOMIE_BUDGET" },
    { scrutinId: "s2", theme: "ECONOMIE_BUDGET" },
    { scrutinId: "s3", theme: "SECURITE_JUSTICE" },
    { scrutinId: "s4", theme: "SANTE" },
  ];

  const userAnswers: Record<string, string> = {
    s1: "POUR", s2: "CONTRE", s3: "POUR", s4: "POUR",
  };

  const voteMatrix: Record<string, Record<string, string>> = {
    s1: { pol1: "POUR" },
    s2: { pol1: "CONTRE" },
    s3: { pol1: "CONTRE" },
    s4: { pol1: "POUR" },
  };

  it("groups concordance by theme", () => {
    const result = computeThemeConcordances("pol1", userAnswers, voteMatrix, questions);
    expect(result).toHaveLength(3);
  });

  it("computes correct percentage per theme", () => {
    const result = computeThemeConcordances("pol1", userAnswers, voteMatrix, questions);
    const economy = result.find((t) => t.theme === "ECONOMIE_BUDGET");
    expect(economy?.agree).toBe(2);
    expect(economy?.total).toBe(2);
    expect(economy?.percentage).toBe(100);
  });

  it("handles themes with disagreements", () => {
    const result = computeThemeConcordances("pol1", userAnswers, voteMatrix, questions);
    const security = result.find((t) => t.theme === "SECURITE_JUSTICE");
    expect(security?.agree).toBe(0);
    expect(security?.total).toBe(1);
    expect(security?.percentage).toBe(0);
  });

  it("skips scrutins where politician has no vote", () => {
    const sparse: Record<string, Record<string, string>> = {
      s1: { pol1: "POUR" },
    };
    const result = computeThemeConcordances("pol1", userAnswers, sparse, questions);
    expect(result.find((t) => t.theme === "ECONOMIE_BUDGET")?.total).toBe(1);
  });

  it("sorts by total votes descending", () => {
    const result = computeThemeConcordances("pol1", userAnswers, voteMatrix, questions);
    expect(result[0].total).toBeGreaterThanOrEqual(result[result.length - 1].total);
  });

  it("skips SKIP answers", () => {
    const withSkip = { ...userAnswers, s1: "SKIP" };
    const result = computeThemeConcordances("pol1", withSkip, voteMatrix, questions);
    const economy = result.find((t) => t.theme === "ECONOMIE_BUDGET");
    expect(economy?.total).toBe(1);
  });
});
