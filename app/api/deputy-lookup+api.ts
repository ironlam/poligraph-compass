import { loadQuizPackData } from "@/lib/quiz-pack-loader";

const POLIGRAPH_API =
  process.env.POLIGRAPH_API_URL || "https://poligraph.fr/api";
const GEO_API = "https://geo.api.gouv.fr";

interface Commune {
  nom: string;
  code: string;
  codeDepartement: string;
  population: number;
}

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
    // 1. Resolve postal code to INSEE commune code via geo.api.gouv.fr
    const geoRes = await fetch(
      `${GEO_API}/communes?codePostal=${codePostal}&fields=nom,code,codeDepartement,population`
    );

    if (!geoRes.ok) {
      return Response.json(
        { error: "Geo API error", deputy: null },
        { status: 502 }
      );
    }

    const communes: Commune[] = await geoRes.json();
    if (!Array.isArray(communes) || communes.length === 0) {
      return Response.json({ deputy: null });
    }

    // Pick the most populous commune for this postal code
    const commune = communes.sort((a, b) => b.population - a.population)[0];

    // 2. Look up deputy via Poligraph by-commune endpoint
    const deputyRes = await fetch(
      `${POLIGRAPH_API}/deputies/by-commune?inseeCode=${commune.code}`
    );

    if (!deputyRes.ok) {
      return Response.json(
        { error: "Upstream API error", deputy: null },
        { status: 502 }
      );
    }

    const data = await deputyRes.json();

    if (!data.deputy) {
      return Response.json({ deputy: null });
    }

    const pol = data.deputy;

    // Verify this politician exists in our synced vote data
    const quizPack = await loadQuizPackData();
    const knownPol = quizPack.politicians.find((p) => p.id === pol.id);

    const deputy = {
      id: pol.id,
      fullName: pol.fullName,
      slug: pol.slug,
      photoUrl: pol.photoUrl || null,
      partyShortName: pol.party?.shortName || null,
      partyId: null as string | null,
      circonscription: pol.constituency || null,
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
