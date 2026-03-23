import { describe, it, expect } from "vitest";
import {
  classifyVotePair,
  computePoliticianConcordance,
  computePartyConcordance,
  computeMinOverlap,
  computeConfidenceScore,
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
    expect(computeMinOverlap(10)).toBe(5); // max(5, ceil(10*0.4)) = max(5,4) = 5
  });

  it("returns proportional threshold for larger quiz", () => {
    expect(computeMinOverlap(20)).toBe(8); // max(5, ceil(20*0.4)) = max(5,8) = 8
  });

  it("returns 5 minimum even for tiny quiz", () => {
    expect(computeMinOverlap(3)).toBe(5);
  });
});

describe("computeConfidenceScore", () => {
  it("returns full score at high coverage", () => {
    // 14/20 answered, target = 20*0.7 = 14, factor = 14/14 = 1.0
    expect(computeConfidenceScore(80, 14, 20)).toBe(80);
  });

  it("caps factor at 1 when coverage exceeds target", () => {
    // 18/20 answered, target = 14, factor = min(1, 18/14) = 1.0
    expect(computeConfidenceScore(60, 18, 20)).toBe(60);
  });

  it("penalizes low coverage", () => {
    // 6/20 answered, target = 14, factor = 6/14 ≈ 0.43
    // 67 * 0.43 ≈ 29
    expect(computeConfidenceScore(67, 6, 20)).toBe(29);
  });

  it("returns -1 when concordance is negative", () => {
    expect(computeConfidenceScore(-1, 3, 20)).toBe(-1);
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

  it("returns 100% concordance and score when all answers match", () => {
    const result = computePoliticianConcordance("pol1", allAnswers, voteMatrix);
    expect(result.concordance).toBe(100);
    expect(result.score).toBe(100);
    expect(result.agree).toBe(10);
    expect(result.overlap).toBe(10);
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
    // pol3 is ABSENT on s3 and s10, so only 8 comparable votes
    // With minOverlap=8 (from 20 answered), this passes
    const result = computePoliticianConcordance("pol3", allAnswers, voteMatrix, 8);
    expect(result.overlap).toBe(8);
    expect(result.concordance).toBeGreaterThanOrEqual(0);
  });

  it("filters out when overlap below dynamic minOverlap", () => {
    // Only 5 scrutins, pol3 absent on s3 → 4 overlap
    const smallAnswers = { s1: "POUR", s2: "POUR", s3: "POUR", s4: "POUR", s5: "POUR" } as Record<string, any>;
    const result = computePoliticianConcordance("pol3", smallAnswers, voteMatrix, 5);
    // pol3: s1=partial, s2=agree, s3=ABSENT(skip), s4=disagree, s5=disagree → overlap=4
    expect(result.overlap).toBe(4);
    expect(result.concordance).toBe(-1);
  });

  it("confidence score penalizes low coverage", () => {
    // User answers 20 questions but politician only voted on 6
    const manyAnswers: Record<string, any> = {};
    for (let i = 1; i <= 20; i++) manyAnswers[`s${i}`] = "POUR";
    // pol1 only has votes for s1-s10, and user answers POUR for all
    // pol1 votes: s1=POUR(agree), s2=CONTRE(disagree), s3=POUR(agree),
    // s4=CONTRE(disagree), s5=POUR(agree), s6=CONTRE(disagree),
    // s7=POUR(agree), s8=CONTRE(disagree), s9=POUR(agree), s10=CONTRE(disagree)
    // overlap=10, concordance=50%, totalAnswered=20
    // target=20*0.7=14, factor=10/14≈0.71, score=50*0.71≈36
    const result = computePoliticianConcordance("pol1", manyAnswers, voteMatrix);
    expect(result.concordance).toBe(50);
    expect(result.score).toBe(36); // penalized for only 10/20 coverage
  });

  it("excludes skipped questions from total", () => {
    const withSkips = {
      s1: "POUR", s2: "SKIP", s3: "POUR", s4: "SKIP", s5: "POUR",
      s6: "SKIP", s7: "POUR", s8: "SKIP", s9: "POUR", s10: "SKIP",
    } as Record<string, any>;
    const result = computePoliticianConcordance("pol1", withSkips, voteMatrix);
    // 5 comparable, default minOverlap=5, passes threshold
    expect(result.overlap).toBe(5);
    expect(result.concordance).toBe(100);
  });

  it("returns -1 concordance when no comparable votes", () => {
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
    expect(result1.concordance).toBe(60); // 3 agree, 2 disagree

    const result2 = computePartyConcordance("party2", answers, partyMajorities);
    expect(result2.concordance).toBe(40); // 2 agree, 3 disagree
  });

  it("includes confidence score", () => {
    const result = computePartyConcordance("party1", answers, partyMajorities);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(result.concordance);
  });
});
