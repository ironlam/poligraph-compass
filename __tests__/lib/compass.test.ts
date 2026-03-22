import { describe, it, expect } from "vitest";
import { computeAxisPosition, computeCompassPosition } from "@/lib/compass";

describe("computeAxisPosition", () => {
  const polarities = { s1: 1, s2: 1, s3: -1 } as Record<string, 1 | -1>;

  it("returns +1 when all votes align with positive polarity", () => {
    const answers = { s1: "POUR", s2: "POUR", s3: "CONTRE" } as Record<string, any>;
    const result = computeAxisPosition(answers, ["s1", "s2", "s3"], polarities);
    expect(result.score).toBe(1);
    expect(result.valid).toBe(true);
  });

  it("returns -1 when all votes oppose polarity", () => {
    const answers = { s1: "CONTRE", s2: "CONTRE", s3: "POUR" } as Record<string, any>;
    const result = computeAxisPosition(answers, ["s1", "s2", "s3"], polarities);
    expect(result.score).toBe(-1);
    expect(result.valid).toBe(true);
  });

  it("returns 0 for mixed or all abstention", () => {
    const answers = { s1: "ABSTENTION", s2: "ABSTENTION", s3: "ABSTENTION" } as Record<string, any>;
    const result = computeAxisPosition(answers, ["s1", "s2", "s3"], polarities);
    expect(result.score).toBe(0);
  });

  it("ignores skipped questions and marks invalid when fewer than 3 answers", () => {
    const answers = { s1: "POUR", s2: "SKIP", s3: "SKIP" } as Record<string, any>;
    const result = computeAxisPosition(answers, ["s1", "s2", "s3"], polarities);
    expect(result.score).toBe(1); // only s1 counts, polarity +1, POUR = +1
    expect(result.answeredCount).toBe(1);
    expect(result.valid).toBe(false); // only 1 answer, below MIN_ANSWERS_PER_AXIS = 3
  });

  it("returns valid when 3+ answers", () => {
    const answers = { s1: "POUR", s2: "CONTRE", s3: "POUR" } as Record<string, any>;
    const result = computeAxisPosition(answers, ["s1", "s2", "s3"], polarities);
    expect(result.valid).toBe(true);
  });
});

describe("computeCompassPosition", () => {
  const axes = {
    economy: {
      scrutinIds: ["e1", "e2"],
      polarities: { e1: 1, e2: 1 } as Record<string, 1 | -1>,
    },
    society: {
      scrutinIds: ["s1", "s2"],
      polarities: { s1: 1, s2: -1 } as Record<string, 1 | -1>,
    },
  };

  it("computes both axes from user answers", () => {
    const answers = { e1: "POUR", e2: "POUR", s1: "POUR", s2: "CONTRE" } as Record<string, any>;
    const result = computeCompassPosition(answers, axes);
    expect(result.x).toBe(1); // economy: both aligned
    expect(result.y).toBe(1); // society: both aligned
  });

  it("marks axis invalid when insufficient answers", () => {
    const answers = { e1: "POUR", s1: "SKIP", s2: "SKIP" } as Record<string, any>;
    const result = computeCompassPosition(answers, axes);
    expect(result.xValid).toBe(false); // only 1 economy answer
    expect(result.yValid).toBe(false); // 0 society answers
  });
});
