import { ComputeRequestSchema } from "@/lib/schemas";
import { computePoliticianConcordance, computePartyConcordance, computeMinOverlap, computeScrutinWeights } from "@/lib/concordance";
import { computeCompassPosition } from "@/lib/compass";
import { loadQuizPackData } from "@/lib/quiz-pack-loader";
import { storeShareResult } from "@/lib/kv";
import type { ComputeResult, ConcordanceEntry, ShareResult } from "@/lib/types";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ComputeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { answers } = parsed.data;
  const answeredCount = Object.values(answers).filter((a) => a !== "SKIP").length;
  const minOverlap = computeMinOverlap(answeredCount);

  // Load quiz pack data directly (shared loader, no self-fetch)
  const quizPack = await loadQuizPackData();
  const weights = computeScrutinWeights(quizPack.partyMajorities, quizPack.parties);

  // Compute politician concordances (sorted by confidence score, not raw %)
  const politicianResults: ConcordanceEntry[] = quizPack.politicians
    .map((pol) => {
      const r = computePoliticianConcordance(pol.id, answers, quizPack.voteMatrix, minOverlap, weights);
      const party = quizPack.parties.find((p) => p.id === pol.partyId);
      return {
        id: pol.id,
        name: pol.fullName,
        slug: pol.slug,
        photoUrl: pol.photoUrl,
        partyShortName: pol.partyShortName,
        partyColor: party?.color ?? null,
        ...r,
      };
    })
    .filter((r) => r.concordance >= 0)
    .sort((a, b) => b.score - a.score);

  // Compute party concordances (sorted by confidence score)
  const partyResults: ConcordanceEntry[] = quizPack.parties
    .map((party) => {
      const r = computePartyConcordance(party.id, answers, quizPack.partyMajorities, minOverlap, weights);
      return {
        id: party.id,
        name: party.name,
        slug: undefined,
        photoUrl: null,
        partyShortName: party.shortName,
        partyColor: party.color ?? null,
        ...r,
      };
    })
    .filter((r) => r.concordance >= 0)
    .sort((a, b) => b.score - a.score);

  // Compute compass position
  const position = computeCompassPosition(answers, quizPack.axes);

  const result: ComputeResult = {
    position,
    politicians: politicianResults,
    parties: partyResults,
    answeredCount,
    totalQuestions: Object.keys(answers).length,
  };

  // Store result in KV for sharing
  const shareId = crypto.randomUUID().slice(0, 10);
  const topParties = partyResults.slice(0, 3).map((p) => ({
    id: p.id,
    name: p.name,
    shortName: p.partyShortName ?? p.name,
    score: Math.round(p.concordance),
    color: p.partyColor ?? null,
  }));

  const sharePayload: ShareResult = {
    id: shareId,
    position,
    topParties,
    answeredCount,
    createdAt: new Date().toISOString(),
  };

  try {
    await storeShareResult(shareId, sharePayload);
  } catch (err) {
    // KV failure is non-blocking: user still gets results, just no share link
    console.error("Failed to store share result in KV:", err);
  }

  return Response.json({ ...result, shareId });
}
