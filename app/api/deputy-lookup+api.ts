import { loadQuizPackData } from "@/lib/quiz-pack-loader";

const POLIGRAPH_API =
  process.env.POLIGRAPH_API_URL || "https://poligraph.fr/api";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const codePostal = url.searchParams.get("codePostal");

  if (!codePostal || !/^(?!00)\d{5}$/.test(codePostal)) {
    return Response.json(
      { error: "Invalid postal code. Must be 5 digits." },
      { status: 400 }
    );
  }

  try {
    // Query Poligraph API for deputies matching this postal code
    const res = await fetch(
      `${POLIGRAPH_API}/politiques?mandateType=DEPUTE&codePostal=${codePostal}&limit=1`
    );

    if (!res.ok) {
      return Response.json(
        { error: "Upstream API error", deputy: null },
        { status: 502 }
      );
    }

    const json = await res.json();
    const results = json.data || json.results || json;

    if (!Array.isArray(results) || results.length === 0) {
      return Response.json({ deputy: null });
    }

    const pol = results[0];

    // Verify this politician exists in our synced vote data
    const quizPack = await loadQuizPackData();
    const knownPol = quizPack.politicians.find((p) => p.id === pol.id);

    const deputy = {
      id: pol.id,
      fullName: pol.fullName,
      slug: pol.slug,
      photoUrl: pol.blobPhotoUrl || pol.photoUrl || null,
      partyShortName: pol.partyShortName || null,
      partyId: pol.partyId || null,
      circonscription: pol.circonscription || null,
      hasVoteData: !!knownPol,
    };

    return Response.json(
      { deputy },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=3600",
        },
      }
    );
  } catch (err) {
    console.error("Deputy lookup failed:", err);
    return Response.json(
      { error: "Internal error", deputy: null },
      { status: 500 }
    );
  }
}
