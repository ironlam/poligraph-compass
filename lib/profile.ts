export type Position = "POUR" | "CONTRE" | "ABSTENTION";

export interface UserAnswerForProfile {
  scrutinId: string;
  position: Position;
}

export interface PartyMatch {
  partyId: string;
  score: number;
}

export interface BoussoleProfile {
  answers: Array<{ scrutinId: string; position: Position }>;
  topPartyMatches: PartyMatch[];
  profileHash: string;
  computedAt: string;
  boussoleVersion: string;
}

// Hash non-cryptographique cyrb53. Suffisant pour la deduplication cote Poligraph.
// Ce n'est PAS un usage de securite.
export function cyrb53Hash(input: string, seed = 0): string {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

export function buildBoussoleProfile(
  answers: UserAnswerForProfile[],
  topPartyMatches: PartyMatch[],
): BoussoleProfile {
  const sortedAnswers = [...answers].sort((a, b) =>
    a.scrutinId.localeCompare(b.scrutinId),
  );
  const profileHash = cyrb53Hash(JSON.stringify(sortedAnswers));
  return {
    answers: sortedAnswers.map((a) => ({
      scrutinId: a.scrutinId,
      position: a.position,
    })),
    topPartyMatches,
    profileHash,
    computedAt: new Date().toISOString(),
    boussoleVersion: "1.0",
  };
}
