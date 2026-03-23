export interface DeputyInfo {
  id: string;
  fullName: string;
  slug: string;
  photoUrl: string | null;
  partyShortName: string | null;
  partyId: string | null;
  circonscription: string | null;
}

/**
 * Validates a French postal code (5 digits, not starting with 00).
 */
export function isValidCodePostal(code: string): boolean {
  return /^(?!00)\d{5}$/.test(code);
}

/**
 * Parses the raw API response into a typed DeputyInfo, or null if invalid.
 */
export function parseDeputyResponse(data: unknown): DeputyInfo | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  if (!obj.id || typeof obj.id !== "string") return null;
  if (!obj.fullName || typeof obj.fullName !== "string") return null;

  return {
    id: obj.id as string,
    fullName: obj.fullName as string,
    slug: (obj.slug as string) || "",
    photoUrl: (obj.photoUrl as string | null) ?? null,
    partyShortName: (obj.partyShortName as string | null) ?? null,
    partyId: (obj.partyId as string | null) ?? null,
    circonscription: (obj.circonscription as string | null) ?? null,
  };
}

/**
 * Fetches the deputy for a given postal code from the app's API route.
 * Returns null if no deputy found or on network error.
 */
export async function fetchDeputyByCodePostal(
  codePostal: string
): Promise<DeputyInfo | null> {
  if (!isValidCodePostal(codePostal)) return null;

  try {
    const res = await fetch(`/api/deputy-lookup?codePostal=${codePostal}`);
    if (!res.ok) return null;
    const json = await res.json();
    return parseDeputyResponse(json.deputy);
  } catch {
    return null;
  }
}
