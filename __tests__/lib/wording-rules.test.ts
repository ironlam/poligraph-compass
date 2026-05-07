import { describe, it, expect } from "vitest";
import {
  NEUTRAL_FALLBACKS,
  ALLOWED_PHRASES,
  AVOID_PHRASES,
} from "@/lib/wording-rules";

describe("wording-rules", () => {
  it("provides neutral fallbacks for POUR/CONTRE/ABSTENTION", () => {
    expect(NEUTRAL_FALLBACKS.POUR).toContain("en faveur de la proposition");
    expect(NEUTRAL_FALLBACKS.CONTRE).toContain("contre la proposition");
    expect(NEUTRAL_FALLBACKS.ABSTENTION).toContain("Ne pas se prononcer");
  });

  it("declares ideologically loaded phrases as avoid", () => {
    expect(AVOID_PHRASES).toContain("défendre les travailleurs");
    expect(AVOID_PHRASES).toContain("protéger la France");
    expect(AVOID_PHRASES).toContain("être de gauche");
  });

  it("declares neutral phrasing as allowed", () => {
    expect(ALLOWED_PHRASES).toContain("Ce vote porte sur");
    expect(ALLOWED_PHRASES).toContain("La proposition vise à");
  });
});
