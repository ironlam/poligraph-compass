import { describe, it, expect } from "vitest";
import {
  PHASES,
  PHASE_ORDER,
  getNextPhase,
  getPhaseLabel,
  getPhaseDuration,
  getCompletedPhases,
} from "@/lib/phases";

describe("PHASE_ORDER", () => {
  it("lists all 4 phases in order", () => {
    expect(PHASE_ORDER).toEqual(["core", "refine-1", "refine-2", "refine-3"]);
  });
});

describe("getNextPhase", () => {
  it("returns refine-1 after core", () => {
    expect(getNextPhase("core")).toBe("refine-1");
  });

  it("returns refine-2 after refine-1", () => {
    expect(getNextPhase("refine-1")).toBe("refine-2");
  });

  it("returns refine-3 after refine-2", () => {
    expect(getNextPhase("refine-2")).toBe("refine-3");
  });

  it("returns null after refine-3 (last phase)", () => {
    expect(getNextPhase("refine-3")).toBeNull();
  });
});

describe("getPhaseLabel", () => {
  it("returns CTA label for each phase transition", () => {
    expect(getPhaseLabel("refine-1")).toBe("Affiner (10 questions, 2 min)");
    expect(getPhaseLabel("refine-2")).toBe("Encore plus précis (10 questions)");
    expect(getPhaseLabel("refine-3")).toBe("Dernière série (10 questions)");
  });

  it("returns null for core (no CTA needed)", () => {
    expect(getPhaseLabel("core")).toBeNull();
  });
});

describe("getPhaseDuration", () => {
  it("returns 20 for core", () => {
    expect(getPhaseDuration("core")).toBe(20);
  });

  it("returns 10 for all refine phases", () => {
    expect(getPhaseDuration("refine-1")).toBe(10);
    expect(getPhaseDuration("refine-2")).toBe(10);
    expect(getPhaseDuration("refine-3")).toBe(10);
  });
});

describe("getCompletedPhases", () => {
  it("returns empty array for core", () => {
    expect(getCompletedPhases("core")).toEqual([]);
  });

  it("returns [core] for refine-1", () => {
    expect(getCompletedPhases("refine-1")).toEqual(["core"]);
  });

  it("returns [core, refine-1, refine-2] for refine-3", () => {
    expect(getCompletedPhases("refine-3")).toEqual([
      "core",
      "refine-1",
      "refine-2",
    ]);
  });
});
