import { describe, it, expect } from "vitest";
import {
  ScrutinConfigSchema,
  QuizPackSchema,
  UserAnswerSchema,
  ComputeRequestSchema,
  ComputeResultSchema,
  ShareResultSchema,
} from "@/lib/schemas";

describe("ScrutinConfigSchema", () => {
  const base = {
    scrutinId: "VTANR6L16V4217",
    order: 1,
    axis: "society",
    polarity: 1,
    theme: "ENVIRONNEMENT_ENERGIE",
    question: "Faut-il interdire le glyphosate en agriculture ?",
  };

  it("validates a valid scrutin config entry", () => {
    const valid = { ...base, tier: "core" };
    expect(ScrutinConfigSchema.parse(valid)).toEqual(valid);
  });

  it("accepts all 4 tier values", () => {
    for (const tier of ["core", "refine-1", "refine-2", "refine-3"]) {
      expect(() => ScrutinConfigSchema.parse({ ...base, tier })).not.toThrow();
    }
  });

  it("rejects old tier values", () => {
    expect(() => ScrutinConfigSchema.parse({ ...base, tier: "essential" })).toThrow();
    expect(() => ScrutinConfigSchema.parse({ ...base, tier: "refine" })).toThrow();
  });

  it("rejects invalid polarity", () => {
    const invalid = { ...base, tier: "core", polarity: 2 };
    expect(() => ScrutinConfigSchema.parse(invalid)).toThrow();
  });

  it("rejects missing question", () => {
    const { question, ...noQuestion } = base;
    const invalid = { ...noQuestion, tier: "core" };
    expect(() => ScrutinConfigSchema.parse(invalid)).toThrow();
  });
});

describe("UserAnswerSchema", () => {
  it("validates POUR/CONTRE/ABSTENTION/SKIP", () => {
    expect(UserAnswerSchema.parse("POUR")).toBe("POUR");
    expect(UserAnswerSchema.parse("CONTRE")).toBe("CONTRE");
    expect(UserAnswerSchema.parse("ABSTENTION")).toBe("ABSTENTION");
    expect(UserAnswerSchema.parse("SKIP")).toBe("SKIP");
  });

  it("rejects invalid answer", () => {
    expect(() => UserAnswerSchema.parse("MAYBE")).toThrow();
  });
});

describe("ComputeRequestSchema", () => {
  it("validates a valid request", () => {
    const valid = {
      answers: { "VTANR6L16V4217": "POUR", "VTANR6L16V1234": "CONTRE" },
    };
    expect(ComputeRequestSchema.parse(valid)).toEqual(valid);
  });
});
