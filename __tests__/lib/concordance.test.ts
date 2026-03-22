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
  const voteMatrix: Record<string, Record<string, string>> = {
    scrutin1: { pol1: "POUR", pol2: "CONTRE", pol3: "ABSTENTION" },
    scrutin2: { pol1: "CONTRE", pol2: "POUR", pol3: "POUR" },
    scrutin3: { pol1: "POUR", pol2: "POUR", pol3: "ABSENT" },
  };

  it("returns 100% when all answers match", () => {
    const answers = { scrutin1: "POUR", scrutin2: "CONTRE", scrutin3: "POUR" } as Record<string, any>;
    const result = computePoliticianConcordance("pol1", answers, voteMatrix);
    expect(result.concordance).toBe(100);
    expect(result.agree).toBe(3);
    expect(result.disagree).toBe(0);
  });

  it("returns 0% when all answers oppose", () => {
    const answers = { scrutin1: "CONTRE", scrutin2: "POUR", scrutin3: "CONTRE" } as Record<string, any>;
    const result = computePoliticianConcordance("pol1", answers, voteMatrix);
    expect(result.concordance).toBe(0);
    expect(result.disagree).toBe(3);
  });

  it("excludes skipped questions from total", () => {
    const answers = { scrutin1: "POUR", scrutin2: "SKIP", scrutin3: "POUR" } as Record<string, any>;
    const result = computePoliticianConcordance("pol1", answers, voteMatrix);
    expect(result.agree).toBe(2);
    expect(result.concordance).toBe(100);
  });

  it("excludes absent politicians from total", () => {
    const answers = { scrutin1: "POUR", scrutin2: "POUR", scrutin3: "POUR" } as Record<string, any>;
    const result = computePoliticianConcordance("pol3", answers, voteMatrix);
    // scrutin1: ABSTENTION vs POUR = partial, scrutin2: POUR vs POUR = agree, scrutin3: ABSENT = skip
    expect(result.agree).toBe(1);
    expect(result.partial).toBe(1);
    expect(result.concordance).toBe(50); // 1 / (1+0+1)
  });

  it("returns -1 concordance when no comparable votes", () => {
    const answers = { scrutin1: "SKIP", scrutin2: "SKIP", scrutin3: "SKIP" } as Record<string, any>;
    const result = computePoliticianConcordance("pol1", answers, voteMatrix);
    expect(result.concordance).toBe(-1);
  });
});

describe("computePartyConcordance", () => {
  it("computes concordance against party majority positions", () => {
    const partyMajorities: Record<string, Record<string, string>> = {
      scrutin1: { party1: "POUR", party2: "CONTRE" },
      scrutin2: { party1: "CONTRE", party2: "POUR" },
    };
    const answers = { scrutin1: "POUR", scrutin2: "POUR" } as Record<string, any>;

    const result1 = computePartyConcordance("party1", answers, partyMajorities);
    expect(result1.concordance).toBe(50); // 1 agree, 1 disagree

    const result2 = computePartyConcordance("party2", answers, partyMajorities);
    expect(result2.concordance).toBe(50); // 1 disagree, 1 agree
  });
});
