import { describe, it, expect } from "vitest";
import {
  classifyVotePair,
  computePoliticianConcordance,
  computePartyConcordance,
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

describe("computePoliticianConcordance", () => {
  // 6 scrutins to exceed MIN_OVERLAP=5
  const voteMatrix: Record<string, Record<string, string>> = {
    s1: { pol1: "POUR", pol2: "CONTRE", pol3: "ABSTENTION" },
    s2: { pol1: "CONTRE", pol2: "POUR", pol3: "POUR" },
    s3: { pol1: "POUR", pol2: "POUR", pol3: "ABSENT" },
    s4: { pol1: "CONTRE", pol2: "CONTRE", pol3: "POUR" },
    s5: { pol1: "POUR", pol2: "CONTRE", pol3: "CONTRE" },
    s6: { pol1: "CONTRE", pol2: "POUR", pol3: "POUR" },
  };

  it("returns 100% when all answers match", () => {
    const answers = { s1: "POUR", s2: "CONTRE", s3: "POUR", s4: "CONTRE", s5: "POUR", s6: "CONTRE" } as Record<string, any>;
    const result = computePoliticianConcordance("pol1", answers, voteMatrix);
    expect(result.concordance).toBe(100);
    expect(result.agree).toBe(6);
    expect(result.disagree).toBe(0);
    expect(result.overlap).toBe(6);
  });

  it("returns 0% when all answers oppose", () => {
    const answers = { s1: "CONTRE", s2: "POUR", s3: "CONTRE", s4: "POUR", s5: "CONTRE", s6: "POUR" } as Record<string, any>;
    const result = computePoliticianConcordance("pol1", answers, voteMatrix);
    expect(result.concordance).toBe(0);
    expect(result.disagree).toBe(6);
  });

  it("excludes skipped questions from total", () => {
    const answers = { s1: "POUR", s2: "SKIP", s3: "POUR", s4: "CONTRE", s5: "POUR", s6: "SKIP" } as Record<string, any>;
    const result = computePoliticianConcordance("pol1", answers, voteMatrix);
    // 4 comparable votes, but below MIN_OVERLAP=5 when 2 are skipped
    // s1: agree, s3: agree, s4: agree, s5: agree = 4 total
    // overlap=4 < MIN_OVERLAP=5, so concordance=-1
    expect(result.agree).toBe(4);
    expect(result.concordance).toBe(-1);
    expect(result.overlap).toBe(4);
  });

  it("excludes absent politicians from total", () => {
    // pol3 is ABSENT on s3, so only 5 comparable votes
    const answers = { s1: "POUR", s2: "POUR", s3: "POUR", s4: "POUR", s5: "POUR", s6: "POUR" } as Record<string, any>;
    const result = computePoliticianConcordance("pol3", answers, voteMatrix);
    // s1: ABSTENTION vs POUR = partial, s2: POUR=agree, s3: ABSENT=skip,
    // s4: POUR=agree, s5: CONTRE=disagree, s6: POUR=agree
    expect(result.agree).toBe(3);
    expect(result.partial).toBe(1);
    expect(result.disagree).toBe(1);
    expect(result.overlap).toBe(5);
    expect(result.concordance).toBe(60); // 3/5
  });

  it("returns -1 concordance when no comparable votes", () => {
    const answers = { s1: "SKIP", s2: "SKIP", s3: "SKIP", s4: "SKIP", s5: "SKIP", s6: "SKIP" } as Record<string, any>;
    const result = computePoliticianConcordance("pol1", answers, voteMatrix);
    expect(result.concordance).toBe(-1);
  });

  it("returns -1 when overlap is below minimum threshold", () => {
    // Only 3 scrutins available for pol4
    const smallMatrix: Record<string, Record<string, string>> = {
      s1: { pol4: "POUR" },
      s2: { pol4: "POUR" },
      s3: { pol4: "POUR" },
    };
    const answers = { s1: "POUR", s2: "POUR", s3: "POUR" } as Record<string, any>;
    const result = computePoliticianConcordance("pol4", answers, smallMatrix);
    expect(result.agree).toBe(3);
    expect(result.overlap).toBe(3);
    expect(result.concordance).toBe(-1); // below MIN_OVERLAP=5
  });
});

describe("computePartyConcordance", () => {
  it("computes concordance against party majority positions", () => {
    const partyMajorities: Record<string, Record<string, string>> = {
      s1: { party1: "POUR", party2: "CONTRE" },
      s2: { party1: "CONTRE", party2: "POUR" },
      s3: { party1: "POUR", party2: "CONTRE" },
      s4: { party1: "CONTRE", party2: "POUR" },
      s5: { party1: "POUR", party2: "CONTRE" },
    };
    const answers = { s1: "POUR", s2: "POUR", s3: "POUR", s4: "POUR", s5: "POUR" } as Record<string, any>;

    const result1 = computePartyConcordance("party1", answers, partyMajorities);
    expect(result1.concordance).toBe(60); // 3 agree, 2 disagree

    const result2 = computePartyConcordance("party2", answers, partyMajorities);
    expect(result2.concordance).toBe(40); // 2 agree, 3 disagree
  });
});
