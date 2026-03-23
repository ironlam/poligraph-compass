import { describe, it, expect } from "vitest";
import {
  isValidCodePostal,
  parseDeputyResponse,
} from "@/lib/deputy-lookup";

describe("isValidCodePostal", () => {
  it("accepts 5-digit French postal codes", () => {
    expect(isValidCodePostal("75001")).toBe(true);
    expect(isValidCodePostal("93200")).toBe(true);
    expect(isValidCodePostal("01000")).toBe(true);
  });

  it("rejects invalid codes", () => {
    expect(isValidCodePostal("7500")).toBe(false);
    expect(isValidCodePostal("750011")).toBe(false);
    expect(isValidCodePostal("ABCDE")).toBe(false);
    expect(isValidCodePostal("")).toBe(false);
    expect(isValidCodePostal("7500A")).toBe(false);
  });

  it("rejects codes starting with 00", () => {
    expect(isValidCodePostal("00100")).toBe(false);
  });
});

describe("parseDeputyResponse", () => {
  it("parses a valid API response into DeputyInfo", () => {
    const apiResponse = {
      id: "cmkjnz3eg001cvtv57zxc028k",
      fullName: "Jean Dupont",
      slug: "jean-dupont",
      photoUrl: "https://example.com/photo.jpg",
      partyShortName: "RE",
      partyId: "party-re",
      circonscription: "Paris (1re)",
    };

    const result = parseDeputyResponse(apiResponse);
    expect(result).toEqual({
      id: "cmkjnz3eg001cvtv57zxc028k",
      fullName: "Jean Dupont",
      slug: "jean-dupont",
      photoUrl: "https://example.com/photo.jpg",
      partyShortName: "RE",
      partyId: "party-re",
      circonscription: "Paris (1re)",
    });
  });

  it("returns null for empty or missing data", () => {
    expect(parseDeputyResponse(null)).toBeNull();
    expect(parseDeputyResponse(undefined)).toBeNull();
    expect(parseDeputyResponse({})).toBeNull();
  });

  it("returns null when id is missing", () => {
    expect(parseDeputyResponse({ fullName: "Test" })).toBeNull();
  });

  it("handles null photoUrl", () => {
    const result = parseDeputyResponse({
      id: "test-id",
      fullName: "Test",
      slug: "test",
      photoUrl: null,
      partyShortName: "LFI",
      partyId: "party-lfi",
      circonscription: "Seine-Saint-Denis (1re)",
    });
    expect(result?.photoUrl).toBeNull();
  });
});
