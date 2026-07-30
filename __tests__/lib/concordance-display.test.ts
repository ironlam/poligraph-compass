import { describe, it, expect } from "vitest";
import {
  concordanceDisplay,
  CONCORDANCE_LEGEND,
} from "@/lib/concordance-display";

describe("concordanceDisplay", () => {
  it("returns Proche (green) at or above 60", () => {
    expect(concordanceDisplay(60).label).toBe("Proche");
    expect(concordanceDisplay(87).label).toBe("Proche");
    expect(concordanceDisplay(100)).toEqual({
      color: "#0e9f6e",
      bg: "#e7f7f0",
      label: "Proche",
    });
  });

  it("returns Moyen (amber) between 40 and 59", () => {
    expect(concordanceDisplay(40).label).toBe("Moyen");
    expect(concordanceDisplay(59).label).toBe("Moyen");
    expect(concordanceDisplay(50).color).toBe("#d97706");
  });

  it("returns Éloigné (red) below 40", () => {
    expect(concordanceDisplay(39).label).toBe("Éloigné");
    expect(concordanceDisplay(0)).toEqual({
      color: "#e5484d",
      bg: "#fdecec",
      label: "Éloigné",
    });
  });

  it("exposes a three-tier legend in descending order", () => {
    expect(CONCORDANCE_LEGEND.map((l) => l.label)).toEqual([
      "Proche",
      "Moyen",
      "Éloigné",
    ]);
    expect(CONCORDANCE_LEGEND.map((l) => l.range)).toEqual([
      "60%+",
      "40-59%",
      "<40%",
    ]);
  });
});
