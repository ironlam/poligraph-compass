import { Redis } from "@upstash/redis";
import type { ShareResult } from "./types";

const SHARE_PREFIX = "share:";
const TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    });
  }
  return redis;
}

export async function storeShareResult(
  shareId: string,
  data: ShareResult
): Promise<void> {
  await getRedis().set(`${SHARE_PREFIX}${shareId}`, JSON.stringify(data), {
    ex: TTL_SECONDS,
  });
}

export async function getShareResult(
  shareId: string
): Promise<ShareResult | null> {
  const raw = await getRedis().get<string>(`${SHARE_PREFIX}${shareId}`);
  if (!raw) return null;

  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as ShareResult;
    } catch {
      return null;
    }
  }

  // Upstash may auto-parse JSON
  return raw as unknown as ShareResult;
}
