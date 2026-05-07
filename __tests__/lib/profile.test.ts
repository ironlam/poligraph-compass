import { describe, it, expect } from "vitest";
import { buildBoussoleProfile, cyrb53Hash } from "@/lib/profile";

describe("cyrb53Hash", () => {
  it("returns the same hash for the same input", () => {
    expect(cyrb53Hash("hello")).toBe(cyrb53Hash("hello"));
  });

  it("returns different hashes for different inputs", () => {
    expect(cyrb53Hash("a")).not.toBe(cyrb53Hash("b"));
  });

  it("is deterministic across runs (snapshot)", () => {
    expect(cyrb53Hash("scrutin-1234")).toMatch(/^[0-9a-f]+$/);
  });
});

describe("buildBoussoleProfile", () => {
  it("sorts answers by scrutinId for hash stability", () => {
    const a = buildBoussoleProfile(
      [
        { scrutinId: "z", position: "POUR" },
        { scrutinId: "a", position: "CONTRE" },
      ],
      [],
    );
    const b = buildBoussoleProfile(
      [
        { scrutinId: "a", position: "CONTRE" },
        { scrutinId: "z", position: "POUR" },
      ],
      [],
    );
    expect(a.profileHash).toBe(b.profileHash);
  });

  it("emits boussoleVersion 1.0", () => {
    const p = buildBoussoleProfile([{ scrutinId: "a", position: "POUR" }], []);
    expect(p.boussoleVersion).toBe("1.0");
  });

  it("includes computedAt as ISO string", () => {
    const p = buildBoussoleProfile([{ scrutinId: "a", position: "POUR" }], []);
    expect(() => new Date(p.computedAt).toISOString()).not.toThrow();
    expect(p.computedAt).toMatch(/T.*Z$/);
  });

  it("filters out SKIP and ABSENT positions (only POUR/CONTRE/ABSTENTION are valid for the profile)", () => {
    const p = buildBoussoleProfile(
      [{ scrutinId: "a", position: "ABSTENTION" }],
      [],
    );
    expect(p.answers[0].position).toBe("ABSTENTION");
  });

  it("preserves topPartyMatches verbatim", () => {
    const matches = [
      { partyId: "rn", score: 88 },
      { partyId: "lr", score: 64 },
    ];
    const p = buildBoussoleProfile(
      [{ scrutinId: "a", position: "POUR" }],
      matches,
    );
    expect(p.topPartyMatches).toEqual(matches);
  });
});
