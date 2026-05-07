import { describe, it, expect, vi, beforeEach } from "vitest";
import { subscribeToPoligraphNewsletter } from "@/lib/subscribe-api";
import type { BoussoleProfile } from "@/lib/profile";

const fixtureProfile: BoussoleProfile = {
  answers: [{ scrutinId: "a", position: "POUR" }],
  topPartyMatches: [{ partyId: "rn", score: 80 }],
  profileHash: "abc123",
  computedAt: "2026-05-07T10:00:00.000Z",
  boussoleVersion: "1.0",
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("subscribeToPoligraphNewsletter", () => {
  it("POSTs JSON to /api/newsletter/subscribe with source=BOUSSOLE", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: "ok" }),
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const result = await subscribeToPoligraphNewsletter({
      email: "test@example.fr",
      boussoleProfile: fixtureProfile,
    });

    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(callArgs[1].body as string);
    expect(body.source).toBe("BOUSSOLE");
    expect(body.email).toBe("test@example.fr");
    expect(body.boussoleProfile).toEqual(fixtureProfile);
  });

  it("returns success=false on HTTP error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: "bad" }),
      } as Response),
    );

    const result = await subscribeToPoligraphNewsletter({
      email: "test@example.fr",
      boussoleProfile: fixtureProfile,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("400");
  });

  it("returns success=false on network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const result = await subscribeToPoligraphNewsletter({
      email: "test@example.fr",
      boussoleProfile: fixtureProfile,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("offline");
  });

  it("forwards optional postalCode and deputySlug", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    await subscribeToPoligraphNewsletter({
      email: "x@y.fr",
      postalCode: "75001",
      deputySlug: "marine-le-pen",
      boussoleProfile: fixtureProfile,
    });

    const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(callArgs[1].body as string);
    expect(body.postalCode).toBe("75001");
    expect(body.deputySlug).toBe("marine-le-pen");
  });
});
