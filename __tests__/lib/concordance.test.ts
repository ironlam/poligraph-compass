import { describe, it, expect } from "vitest";
import {
  classifyVotePair,
  computePoliticianConcordance,
  computePartyConcordance,
  computeMinOverlap,
  wilsonScore,
} from "@/lib/concordance";

describe("classifyVotePair", () => {
  it("returns agree when both POUR", () => {
    expect(classifyVotePair("POUR", "POUR")).toBe("agree");
  });

  it("returns agree when both CONTRE", () => {
    expect(classifyVotePair("CONTRE", "CONTRE")).toBe("agree");
  });

  it("returns disagree when opposite", () => {
    expect(classifyVotePair("POUR", "CONTRE")).toBe("disagree");
    expect(classifyVotePair("CONTRE", "POUR")).toBe("disagree");
  });

  it("returns partial when one is ABSTENTION", () => {
    expect(classifyVotePair("POUR", "ABSTENTION")).toBe("partial");
    expect(classifyVotePair("ABSTENTION", "CONTRE")).toBe("partial");
  });

  it("returns agree when both ABSTENTION", () => {
    expect(classifyVotePair("ABSTENTION", "ABSTENTION")).toBe("agree");
  });

  it("returns skip when user skipped", () => {
    expect(classifyVotePair("SKIP", "POUR")).toBe("skip");
  });

  it("returns skip when politician absent", () => {
    expect(classifyVotePair("POUR", "ABSENT")).toBe("skip");
    expect(classifyVotePair("POUR", "NON_VOTANT")).toBe("skip");
  });
});

describe("computeMinOverlap", () => {
  it("returns 5 for small quiz (10 questions)", () => {
    expect(computeMinOverlap(10)).toBe(5);
  });

  it("returns proportional threshold for larger quiz", () => {
    expect(computeMinOverlap(20)).toBe(8);
  });

  it("returns 5 minimum even for tiny quiz", () => {
    expect(computeMinOverlap(3)).toBe(5);
  });
});

describe("wilsonScore", () => {
  it("returns 0 when no observations", () => {
    expect(wilsonScore(0, 0, 0)).toBe(0);
  });

  it("returns low score for few observations even with high raw rate", () => {
    // 4 agree, 0 partial, 6 total = 67% raw
    const score = wilsonScore(4, 0, 6);
    expect(score).toBeGreaterThan(0.3);
    expect(score).toBeLessThan(0.5);
  });

  it("returns score close to raw rate for many observations", () => {
    // 80 agree, 0 partial, 100 total = 80% raw
    const score = wilsonScore(80, 0, 100);
    expect(score).toBeGreaterThan(0.72);
    expect(score).toBeLessThan(0.80);
  });

  it("gives partial votes half credit", () => {
    // 4 agree, 2 partial, 8 total: positives = 4 + 1 = 5, p = 5/8 = 62.5%
    const withPartial = wilsonScore(4, 2, 8);
    // 5 agree, 0 partial, 8 total: positives = 5, p = 5/8 = 62.5%
    const withoutPartial = wilsonScore(5, 0, 8);
    expect(withPartial).toBeCloseTo(withoutPartial, 5);
  });

  it("penalizes sparse data more than dense data", () => {
    // Same raw 60% agreement, different sample sizes
    const sparse = wilsonScore(3, 0, 5);   // 60% on 5 votes
    const dense = wilsonScore(12, 0, 20);  // 60% on 20 votes
    expect(dense).toBeGreaterThan(sparse);
  });

  it("ranks high-overlap moderate agreement above low-overlap high agreement", () => {
    // The key property: 55% on 18 votes should rank above 67% on 6 votes
    const highOverlap = wilsonScore(10, 0, 18);  // ~55%
    const lowOverlap = wilsonScore(4, 0, 6);      // ~67%
    expect(highOverlap).toBeGreaterThan(lowOverlap);
  });
});

describe("computePoliticianConcordance", () => {
  // 10 scrutins for robust testing
  const voteMatrix: Record<string, Record<string, string>> = {
    s1:  { pol1: "POUR",   pol2: "CONTRE", pol3: "ABSTENTION" },
    s2:  { pol1: "CONTRE", pol2: "POUR",   pol3: "POUR" },
    s3:  { pol1: "POUR",   pol2: "POUR",   pol3: "ABSENT" },
    s4:  { pol1: "CONTRE", pol2: "CONTRE", pol3: "POUR" },
    s5:  { pol1: "POUR",   pol2: "CONTRE", pol3: "CONTRE" },
    s6:  { pol1: "CONTRE", pol2: "POUR",   pol3: "POUR" },
    s7:  { pol1: "POUR",   pol2: "CONTRE", pol3: "POUR" },
    s8:  { pol1: "CONTRE", pol2: "POUR",   pol3: "CONTRE" },
    s9:  { pol1: "POUR",   pol2: "CONTRE", pol3: "POUR" },
    s10: { pol1: "CONTRE", pol2: "POUR",   pol3: "ABSENT" },
  };

  const allAnswers = {
    s1: "POUR", s2: "CONTRE", s3: "POUR", s4: "CONTRE", s5: "POUR",
    s6: "CONTRE", s7: "POUR", s8: "CONTRE", s9: "POUR", s10: "CONTRE",
  } as Record<string, any>;

  it("returns 100% concordance when all answers match", () => {
    const result = computePoliticianConcordance("pol1", allAnswers, voteMatrix);
    expect(result.concordance).toBe(100);
    expect(result.agree).toBe(10);
    expect(result.overlap).toBe(10);
  });

  it("wilson score is below raw concordance", () => {
    const result = computePoliticianConcordance("pol1", allAnswers, voteMatrix);
    expect(result.score).toBeLessThanOrEqual(result.concordance);
    expect(result.score).toBeGreaterThan(0);
  });

  it("returns 0% when all answers oppose", () => {
    const opposite = {
      s1: "CONTRE", s2: "POUR", s3: "CONTRE", s4: "POUR", s5: "CONTRE",
      s6: "POUR", s7: "CONTRE", s8: "POUR", s9: "CONTRE", s10: "POUR",
    } as Record<string, any>;
    const result = computePoliticianConcordance("pol1", opposite, voteMatrix);
    expect(result.concordance).toBe(0);
    expect(result.score).toBe(0);
    expect(result.disagree).toBe(10);
  });

  it("uses dynamic minOverlap when provided", () => {
    const result = computePoliticianConcordance("pol3", allAnswers, voteMatrix, 8);
    expect(result.overlap).toBe(8);
    expect(result.concordance).toBeGreaterThanOrEqual(0);
  });

  it("filters out when overlap below dynamic minOverlap", () => {
    const smallAnswers = { s1: "POUR", s2: "POUR", s3: "POUR", s4: "POUR", s5: "POUR" } as Record<string, any>;
    const result = computePoliticianConcordance("pol3", smallAnswers, voteMatrix, 5);
    expect(result.overlap).toBe(4);
    expect(result.concordance).toBe(-1);
    expect(result.score).toBe(-1);
  });

  it("excludes skipped questions from total", () => {
    const withSkips = {
      s1: "POUR", s2: "SKIP", s3: "POUR", s4: "SKIP", s5: "POUR",
      s6: "SKIP", s7: "POUR", s8: "SKIP", s9: "POUR", s10: "SKIP",
    } as Record<string, any>;
    const result = computePoliticianConcordance("pol1", withSkips, voteMatrix);
    expect(result.overlap).toBe(5);
    expect(result.concordance).toBe(100);
  });

  it("returns -1 concordance and score when no comparable votes", () => {
    const allSkips = {
      s1: "SKIP", s2: "SKIP", s3: "SKIP", s4: "SKIP", s5: "SKIP",
      s6: "SKIP", s7: "SKIP", s8: "SKIP", s9: "SKIP", s10: "SKIP",
    } as Record<string, any>;
    const result = computePoliticianConcordance("pol1", allSkips, voteMatrix);
    expect(result.concordance).toBe(-1);
    expect(result.score).toBe(-1);
  });
});

describe("computePartyConcordance", () => {
  const partyMajorities: Record<string, Record<string, string>> = {
    s1: { party1: "POUR", party2: "CONTRE" },
    s2: { party1: "CONTRE", party2: "POUR" },
    s3: { party1: "POUR", party2: "CONTRE" },
    s4: { party1: "CONTRE", party2: "POUR" },
    s5: { party1: "POUR", party2: "CONTRE" },
  };
  const answers = { s1: "POUR", s2: "POUR", s3: "POUR", s4: "POUR", s5: "POUR" } as Record<string, any>;

  it("computes concordance against party majority positions", () => {
    const result1 = computePartyConcordance("party1", answers, partyMajorities);
    expect(result1.concordance).toBe(60);

    const result2 = computePartyConcordance("party2", answers, partyMajorities);
    expect(result2.concordance).toBe(40);
  });

  it("wilson score is below or equal to raw concordance", () => {
    const result = computePartyConcordance("party1", answers, partyMajorities);
    expect(result.score).toBeLessThanOrEqual(result.concordance);
    expect(result.score).toBeGreaterThan(0);
  });
});
