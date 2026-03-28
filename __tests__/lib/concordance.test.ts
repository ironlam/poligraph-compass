import { describe, it, expect } from "vitest";
import {
  classifyVotePair,
  computePoliticianConcordance,
  computePartyConcordance,
  computeMinOverlap,
  computeScrutinWeights,
  computeGroupDiscordance,
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

describe("computeScrutinWeights", () => {
  const parties = [
    { id: "lfi", shortName: "LFI" },
    { id: "ps", shortName: "PS" },
    { id: "lr", shortName: "LR" },
    { id: "rn", shortName: "RN" },
    { id: "re", shortName: "RE" },
  ];

  it("gives weight 1 when left and right vote opposite", () => {
    const majorities = {
      s1: { lfi: "POUR", ps: "POUR", lr: "CONTRE", rn: "CONTRE", re: "CONTRE" },
    };
    const weights = computeScrutinWeights(majorities, parties);
    expect(weights.s1).toBe(1);
  });

  it("gives weight 0 when left and right vote the same", () => {
    const majorities = {
      s1: { lfi: "CONTRE", ps: "CONTRE", lr: "CONTRE", rn: "CONTRE", re: "POUR" },
    };
    const weights = computeScrutinWeights(majorities, parties);
    expect(weights.s1).toBe(0);
  });

  it("gives weight 0 when everyone votes POUR (unanimous)", () => {
    const majorities = {
      s1: { lfi: "POUR", ps: "POUR", lr: "POUR", rn: "POUR", re: "POUR" },
    };
    const weights = computeScrutinWeights(majorities, parties);
    expect(weights.s1).toBe(0);
  });

  it("gives intermediate weight for mixed votes", () => {
    // LFI CONTRE (outlier), PS POUR, LR POUR, RN POUR
    const majorities = {
      s1: { lfi: "CONTRE", ps: "POUR", lr: "POUR", rn: "POUR", re: "POUR" },
    };
    const weights = computeScrutinWeights(majorities, parties);
    // left: 1 POUR, 1 CONTRE → ratio 0.5. right: 2 POUR → ratio 1.0
    // weight = |0.5 - 1.0| = 0.5
    expect(weights.s1).toBe(0.5);
  });

  it("ignores abstentions in weight calculation", () => {
    const majorities = {
      s1: { lfi: "POUR", ps: "ABSTENTION", lr: "CONTRE", rn: "CONTRE", re: "ABSTENTION" },
    };
    const weights = computeScrutinWeights(majorities, parties);
    // left: only LFI counts (POUR), ratio=1.0. right: LR+RN CONTRE, ratio=0.0
    expect(weights.s1).toBe(1);
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

  it("penalizes sparse data more than dense data", () => {
    // Same raw 60% agreement, different sample sizes
    const sparse = wilsonScore(3, 0, 5);   // 60% on 5 votes
    const dense = wilsonScore(12, 0, 20);  // 60% on 20 votes
    expect(dense).toBeGreaterThan(sparse);
  });

  it("gives partial votes half credit", () => {
    // 4 agree, 2 partial, 8 total: positives = 4 + 1 = 5, p = 5/8 = 62.5%
    const withPartial = wilsonScore(4, 2, 8);
    // 5 agree, 0 partial, 8 total: positives = 5, p = 5/8 = 62.5%
    const withoutPartial = wilsonScore(5, 0, 8);
    expect(withPartial).toBeCloseTo(withoutPartial, 5);
  });

  it("ranks high-overlap moderate agreement above low-overlap high agreement", () => {
    // The key property: 55% on 18 votes should rank above 67% on 6 votes
    const highOverlap = wilsonScore(10, 0, 18);  // ~55%
    const lowOverlap = wilsonScore(4, 0, 6);      // ~67%
    expect(highOverlap).toBeGreaterThan(lowOverlap);
  });
});

describe("computePoliticianConcordance", () => {
  const voteMatrix: Record<string, Record<string, string>> = {
    s1:  { pol1: "POUR",   pol2: "CONTRE" },
    s2:  { pol1: "CONTRE", pol2: "POUR" },
    s3:  { pol1: "POUR",   pol2: "POUR" },
    s4:  { pol1: "CONTRE", pol2: "CONTRE" },
    s5:  { pol1: "POUR",   pol2: "CONTRE" },
    s6:  { pol1: "CONTRE", pol2: "POUR" },
    s7:  { pol1: "POUR",   pol2: "CONTRE" },
    s8:  { pol1: "CONTRE", pol2: "POUR" },
    s9:  { pol1: "POUR",   pol2: "CONTRE" },
    s10: { pol1: "CONTRE", pol2: "POUR" },
  };

  const allAnswers = {
    s1: "POUR", s2: "CONTRE", s3: "POUR", s4: "CONTRE", s5: "POUR",
    s6: "CONTRE", s7: "POUR", s8: "CONTRE", s9: "POUR", s10: "CONTRE",
  } as Record<string, any>;

  it("returns 100% when all answers match (no weights)", () => {
    const result = computePoliticianConcordance("pol1", allAnswers, voteMatrix);
    expect(result.concordance).toBe(100);
    expect(result.agree).toBe(10);
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

  it("concordance reflects weights when provided", () => {
    // s1-s5 have weight 1, s6-s10 have weight 0 (non-discriminating)
    const weights: Record<string, number> = {
      s1: 1, s2: 1, s3: 1, s4: 1, s5: 1,
      s6: 0, s7: 0, s8: 0, s9: 0, s10: 0,
    };
    // pol1 matches all 10 answers, but only s1-s5 have weight
    const result = computePoliticianConcordance("pol1", allAnswers, voteMatrix, undefined, weights);
    // weighted: 5 agree out of 5 total weight → 100%
    expect(result.concordance).toBe(100);
    expect(result.overlap).toBe(10); // raw overlap still counts all
  });

  it("low-weight agreements reduce concordance", () => {
    // User agrees with pol2 on s3 and s4 (weight 0), disagrees on s1,s2,s5 (weight 1)
    const answers2 = {
      s1: "POUR", s2: "POUR", s3: "POUR", s4: "CONTRE", s5: "POUR",
      s6: "POUR", s7: "POUR", s8: "POUR", s9: "POUR", s10: "POUR",
    } as Record<string, any>;
    const noWeights = computePoliticianConcordance("pol2", answers2, voteMatrix);
    const withWeights = computePoliticianConcordance("pol2", answers2, voteMatrix, undefined, {
      s1: 1, s2: 1, s3: 0, s4: 0, s5: 1, s6: 1, s7: 1, s8: 1, s9: 1, s10: 1,
    });
    // With weights, the agreements on s3/s4 (weight 0) don't count
    expect(withWeights.concordance).toBeLessThanOrEqual(noWeights.concordance);
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

  it("returns -1 when overlap below threshold", () => {
    const small = { s1: "POUR", s2: "POUR", s3: "POUR" } as Record<string, any>;
    const result = computePoliticianConcordance("pol1", small, voteMatrix, 5);
    expect(result.concordance).toBe(-1);
    expect(result.score).toBe(-1);
  });

  it("returns -1 when all skipped", () => {
    const allSkips = Object.fromEntries(
      Object.keys(allAnswers).map((k) => [k, "SKIP"])
    ) as Record<string, any>;
    const result = computePoliticianConcordance("pol1", allSkips, voteMatrix);
    expect(result.concordance).toBe(-1);
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

  it("accepts weights parameter", () => {
    const weights = { s1: 1, s2: 0, s3: 1, s4: 0, s5: 1 };
    const result = computePartyConcordance("party1", answers, partyMajorities, undefined, weights);
    // Only s1, s3, s5 count (all agree) → 100%
    expect(result.concordance).toBe(100);
  });
});

describe("computeGroupDiscordance", () => {
  const voteMatrix: Record<string, Record<string, string>> = {
    s1: { dep1: "POUR", dep2: "POUR" },
    s2: { dep1: "CONTRE", dep2: "POUR" },
    s3: { dep1: "POUR", dep2: "POUR" },
    s4: { dep1: "CONTRE", dep2: "CONTRE" },
    s5: { dep1: "ABSENT", dep2: "POUR" },
  };
  const partyMajorities: Record<string, Record<string, string>> = {
    s1: { groupA: "POUR" },
    s2: { groupA: "POUR" },
    s3: { groupA: "POUR" },
    s4: { groupA: "CONTRE" },
    s5: { groupA: "POUR" },
  };

  it("computes discordance correctly", () => {
    // dep1: s1=POUR vs POUR (agree), s2=CONTRE vs POUR (diverge),
    //        s3=POUR vs POUR (agree), s4=CONTRE vs CONTRE (agree),
    //        s5=ABSENT (skip)
    const result = computeGroupDiscordance("dep1", "groupA", voteMatrix, partyMajorities);
    expect(result.comparable).toBe(4);
    expect(result.divergent).toBe(1);
    expect(result.discordance).toBe(25);
  });

  it("returns 0% for a fully loyal deputy", () => {
    const result = computeGroupDiscordance("dep2", "groupA", voteMatrix, partyMajorities);
    expect(result.divergent).toBe(0);
    expect(result.discordance).toBe(0);
  });

  it("returns -1 when fewer than 3 comparable votes", () => {
    const sparse: Record<string, Record<string, string>> = {
      s1: { dep3: "POUR" },
      s2: { dep3: "ABSENT" },
    };
    const result = computeGroupDiscordance("dep3", "groupA", sparse, partyMajorities);
    expect(result.discordance).toBe(-1);
  });

  it("skips scrutins where group has no data", () => {
    const result = computeGroupDiscordance("dep1", "unknownGroup", voteMatrix, partyMajorities);
    expect(result.comparable).toBe(0);
    expect(result.discordance).toBe(-1);
  });
});
