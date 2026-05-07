import type { BoussoleProfile } from "./profile";

const POLIGRAPH_BASE =
  process.env.EXPO_PUBLIC_POLIGRAPH_BASE ?? "https://poligraph.fr";

export interface SubscribeResponse {
  success: boolean;
  alreadyConfirmed?: boolean;
  alreadyPending?: boolean;
  message?: string;
  error?: string;
}

export interface SubscribePayload {
  email: string;
  postalCode?: string;
  deputySlug?: string;
  boussoleProfile: BoussoleProfile;
}

export async function subscribeToPoligraphNewsletter(
  payload: SubscribePayload,
): Promise<SubscribeResponse> {
  try {
    const res = await fetch(`${POLIGRAPH_BASE}/api/newsletter/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, source: "BOUSSOLE" }),
    });
    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}` };
    }
    return res.json();
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "network-error",
    };
  }
}
