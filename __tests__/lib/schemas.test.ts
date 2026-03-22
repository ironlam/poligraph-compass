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
  it("validates a valid scrutin config entry", () => {
    const valid = {
      scrutinId: "VTANR6L16V4217",
      order: 1,
      tier: "essential",
      axis: "society",
      polarity: 1,
      theme: "ENVIRONNEMENT_ENERGIE",
      question: "Faut-il interdire le glyphosate en agriculture ?",
    };
    expect(ScrutinConfigSchema.parse(valid)).toEqual(valid);
  });

  it("rejects invalid polarity", () => {
    const invalid = {
      scrutinId: "VTANR6L16V4217",
      order: 1,
      tier: "essential",
      axis: "society",
      polarity: 2,
      theme: "ENVIRONNEMENT_ENERGIE",
      question: "Test?",
    };
    expect(() => ScrutinConfigSchema.parse(invalid)).toThrow();
  });

  it("rejects missing question", () => {
    const invalid = {
      scrutinId: "VTANR6L16V4217",
      order: 1,
      tier: "essential",
      axis: "society",
      polarity: 1,
      theme: "ENVIRONNEMENT_ENERGIE",
    };
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
