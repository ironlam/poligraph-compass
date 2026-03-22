import scrutinsConfig from "@/data/scrutins.json";
import { invalidateCache } from "@/lib/quiz-pack-loader";

const POLIGRAPH_API = process.env.POLIGRAPH_API_URL || "https://poligraph.fr/api";

async function fetchAllPages<T>(baseUrl: string): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const separator = baseUrl.includes("?") ? "&" : "?";
    const url = `${baseUrl}${separator}page=${page}&limit=100`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Sync: failed to fetch ${url}: ${response.status}`);
      break;
    }

    const data = await response.json();
    const pageItems = data.data || data.results || data;

    if (!Array.isArray(pageItems) || pageItems.length === 0) {
      hasMore = false;
    } else {
      items.push(...pageItems);
      page++;
      if (pageItems.length < 100) hasMore = false;
    }
  }

  return items;
}

export async function GET(request: Request) {
  // Verify cron secret in production
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scrutinIds = new Set(scrutinsConfig.map((s) => s.scrutinId));
  let failedPolCount = 0;

  try {
    // 1. Fetch all deputies
    const politicians = await fetchAllPages<any>(
      `${POLIGRAPH_API}/politiques?mandateType=DEPUTE`
    );
    console.log(`Sync: fetched ${politicians.length} politicians`);

    // 2. Build vote matrix for selected scrutins
    const voteMatrix: Record<string, Record<string, string>> = {};
    for (const scrutinId of scrutinIds) {
      voteMatrix[scrutinId] = {};
    }

    // Fetch votes per politician (expensive: see spec for /api/export/votes optimization)
    for (const pol of politicians) {
      try {
        const votes = await fetchAllPages<any>(
          `${POLIGRAPH_API}/politiques/${pol.slug}/votes`
        );
        for (const vote of votes) {
          if (scrutinIds.has(vote.scrutinId)) {
            voteMatrix[vote.scrutinId][pol.id] = vote.position;
          }
        }
      } catch (err) {
        console.error(`Sync: failed to fetch votes for ${pol.slug}:`, err);
        failedPolCount++;
      }
    }

    // 3. Build parties array from politicians (deduplicate)
    const partyMap = new Map<string, { id: string; name: string; shortName: string; color: string | null }>();
    for (const pol of politicians) {
      if (pol.partyId && !partyMap.has(pol.partyId)) {
        partyMap.set(pol.partyId, {
          id: pol.partyId,
          name: pol.partyName || pol.partyShortName || "Inconnu",
          shortName: pol.partyShortName || "?",
          color: pol.partyColor || null,
        });
      }
    }
    const parties = [...partyMap.values()];

    // 4. Build party majority positions per scrutin
    const partyMajorities: Record<string, Record<string, string>> = {};
    for (const scrutinId of scrutinIds) {
      partyMajorities[scrutinId] = {};
      const votesForScrutin = voteMatrix[scrutinId];

      for (const [partyId] of partyMap) {
        const partyPols = politicians.filter((p: any) => p.partyId === partyId);
        const positionCounts: Record<string, number> = {};

        for (const pol of partyPols) {
          const position = votesForScrutin[pol.id];
          if (position && position !== "ABSENT" && position !== "NON_VOTANT") {
            positionCounts[position] = (positionCounts[position] || 0) + 1;
          }
        }

        // Majority position = most common active vote
        const sorted = Object.entries(positionCounts).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) {
          partyMajorities[scrutinId][partyId] = sorted[0][0];
        }
      }
    }

    // 5. Store in KV for quiz-pack and compute endpoints to use
    // TODO: await kv.set("quiz-pack-data", JSON.stringify({ voteMatrix, politicians: politicianData, parties, partyMajorities }));

    invalidateCache();

    return Response.json({
      success: true,
      politiciansCount: politicians.length,
      partiesCount: parties.length,
      failedPolCount,
      scrutinsCount: scrutinIds.size,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Sync failed:", error);
    return Response.json(
      { error: "Sync failed", details: String(error) },
      { status: 500 }
    );
  }
}
