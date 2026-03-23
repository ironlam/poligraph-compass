import { ComputeRequestSchema } from "@/lib/schemas";
import { computePoliticianConcordance, computePartyConcordance, computeMinOverlap, computeScrutinWeights } from "@/lib/concordance";
import { computeCompassPosition } from "@/lib/compass";
import { loadQuizPackData } from "@/lib/quiz-pack-loader";
import type { ComputeResult, ConcordanceEntry } from "@/lib/types";

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
      return {
        id: pol.id,
        name: pol.fullName,
        slug: pol.slug,
        photoUrl: pol.photoUrl,
        partyShortName: pol.partyShortName,
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

  // Store result in KV for sharing (crypto.randomUUID is built-in, no extra dependency)
  const shareId = crypto.randomUUID().slice(0, 10);
  // TODO: store in Vercel KV once configured
  // await kv.set(`share:${shareId}`, JSON.stringify({...}), { ex: 90 * 24 * 60 * 60 });

  return Response.json({ ...result, shareId });
}
