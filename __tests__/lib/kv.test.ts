import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSet = vi.fn();
const mockGet = vi.fn();

vi.mock("@upstash/redis", () => {
  return {
    Redis: class MockRedis {
      set = mockSet;
      get = mockGet;
    },
  };
});

import { storeShareResult, getShareResult } from "@/lib/kv";

describe("storeShareResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores with share: prefix and 90-day TTL", async () => {
    const data = {
      id: "abc123",
      position: { x: 0.3, y: -0.2, xValid: true, yValid: true },
      topParties: [
        { id: "p1", name: "Parti A", shortName: "PA", score: 85, color: "#ff0000" },
      ],
      answeredCount: 10,
      createdAt: "2026-03-23T12:00:00Z",
    };

    await storeShareResult("abc123", data);

    expect(mockSet).toHaveBeenCalledWith(
      "share:abc123",
      JSON.stringify(data),
      { ex: 7_776_000 }
    );
  });
});

describe("getShareResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns parsed data when key exists", async () => {
    const stored = JSON.stringify({
      id: "abc123",
      position: { x: 0.3, y: -0.2, xValid: true, yValid: true },
      topParties: [],
      answeredCount: 10,
      createdAt: "2026-03-23T12:00:00Z",
    });
    mockGet.mockResolvedValue(stored);

    const result = await getShareResult("abc123");

    expect(mockGet).toHaveBeenCalledWith("share:abc123");
    expect(result).not.toBeNull();
    expect(result!.id).toBe("abc123");
  });

  it("returns null when key does not exist", async () => {
    mockGet.mockResolvedValue(null);

    const result = await getShareResult("nonexistent");

    expect(result).toBeNull();
  });
});
