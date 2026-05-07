import { describe, it, expect } from "vitest";
import { QUIZ_BUTTONS } from "@/lib/quiz-button-config";

describe("QUIZ_BUTTONS", () => {
  it("declares exactly 4 buttons with the canonical answer values", () => {
    expect(QUIZ_BUTTONS).toHaveLength(4);
    expect(QUIZ_BUTTONS.map((b) => b.value)).toEqual([
      "POUR",
      "CONTRE",
      "ABSTENTION",
      "SKIP",
    ]);
  });

  it("renames the ABSTENTION visible label to a long form (UI-only)", () => {
    const abst = QUIZ_BUTTONS.find((b) => b.value === "ABSTENTION");
    expect(abst).toBeDefined();
    expect(abst!.label).toBe("Je ne sais pas / pas assez informé");
  });

  it("keeps Pour / Contre concise primary labels", () => {
    expect(QUIZ_BUTTONS.find((b) => b.value === "POUR")!.label).toBe("Pour");
    expect(QUIZ_BUTTONS.find((b) => b.value === "CONTRE")!.label).toBe(
      "Contre",
    );
  });

  it("uses the visible label 'Passer' for SKIP", () => {
    expect(QUIZ_BUTTONS.find((b) => b.value === "SKIP")!.label).toBe("Passer");
  });

  it("declares variants that map answer semantics to visual hierarchy", () => {
    const variants = QUIZ_BUTTONS.map((b) => b.variant);
    expect(variants).toContain("primary-pour");
    expect(variants).toContain("primary-contre");
    expect(variants).toContain("secondary");
    expect(variants).toContain("tertiary");
  });
});
