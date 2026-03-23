/**
 * Sync vote data from Poligraph API.
 * Usage: npx tsx scripts/sync-data.ts
 *
 * Fetches all deputies and their votes, then builds the vote matrix
 * for the scrutins defined in data/scrutins.json.
 */

import { writeFileSync } from "fs";
import { join } from "path";

const POLIGRAPH_API = process.env.POLIGRAPH_API_URL || "https://poligraph.fr/api";
const OUTPUT_PATH = join(process.cwd(), "data", "synced-data.json");
const CONCURRENCY = 10; // parallel requests

interface Politician {
  id: string;
  slug: string;
  fullName: string;
  photoUrl: string | null;
  blobPhotoUrl?: string | null;
  partyId: string | null;
  partyShortName: string | null;
  partyName: string | null;
  partyColor?: string | null;
}

interface Vote {
  id: string;
  position: string;
  scrutin: { id: string };
}

async function fetchAllPages<T>(baseUrl: string): Promise<T[]> {
  const items: T[] = [];
  let page = 1;

  while (true) {
    const separator = baseUrl.includes("?") ? "&" : "?";
    const url = `${baseUrl}${separator}page=${page}&limit=100`;
    const res = await fetch(url);

    if (!res.ok) {
      console.error(`Failed to fetch ${url}: ${res.status}`);
      break;
    }

    const json = await res.json();
    const pageItems: T[] = json.data || json.results || json;

    if (!Array.isArray(pageItems) || pageItems.length === 0) break;
    items.push(...pageItems);
    if (pageItems.length < 100) break;
    page++;
  }

  return items;
}

async function processInBatches<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((item, j) => fn(item, i + j))
    );
    results.push(...batchResults);
  }
  return results;
}

async function main() {
  // Load scrutin config
  const scrutinsConfig = JSON.parse(
    require("fs").readFileSync(join(process.cwd(), "data", "scrutins.json"), "utf-8")
  );
  const scrutinIds = new Set<string>(scrutinsConfig.map((s: any) => s.scrutinId));
  console.log(`Syncing data for ${scrutinIds.size} scrutins...`);

  // 1. Fetch all deputies
  console.log("Fetching deputies...");
  const politicians = await fetchAllPages<Politician>(
    `${POLIGRAPH_API}/politiques?mandateType=DEPUTE`
  );
  console.log(`Found ${politicians.length} deputies`);

  // 2. Build vote matrix
  const voteMatrix: Record<string, Record<string, string>> = {};
  for (const scrutinId of scrutinIds) {
    voteMatrix[scrutinId] = {};
  }

  let processed = 0;
  let failed = 0;

  await processInBatches(
    politicians,
    async (pol, index) => {
      try {
        const votes = await fetchAllPages<Vote>(
          `${POLIGRAPH_API}/politiques/${pol.slug}/votes`
        );
        for (const vote of votes) {
          const sid = vote.scrutin?.id;
          if (sid && scrutinIds.has(sid)) {
            voteMatrix[sid][pol.id] = vote.position;
          }
        }
        processed++;
        if (processed % 50 === 0) {
          console.log(`  ${processed}/${politicians.length} deputies processed`);
        }
      } catch (err) {
        failed++;
        console.error(`  Failed: ${pol.slug}`);
      }
    },
    CONCURRENCY
  );

  console.log(`Processed ${processed} deputies (${failed} failed)`);

  // 3. Build parties
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
  console.log(`Found ${parties.length} parties`);

  // 4. Build party majorities
  const partyMajorities: Record<string, Record<string, string>> = {};
  for (const scrutinId of scrutinIds) {
    partyMajorities[scrutinId] = {};
    const votesForScrutin = voteMatrix[scrutinId];

    for (const [partyId] of partyMap) {
      const partyPols = politicians.filter((p) => p.partyId === partyId);
      const counts: Record<string, number> = {};

      for (const pol of partyPols) {
        const position = votesForScrutin[pol.id];
        if (position && position !== "ABSENT" && position !== "NON_VOTANT") {
          counts[position] = (counts[position] || 0) + 1;
        }
      }

      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) {
        partyMajorities[scrutinId][partyId] = sorted[0][0];
      }
    }
  }

  // 5. Write output
  const politicianData = politicians.map((pol) => ({
    id: pol.id,
    fullName: pol.fullName,
    slug: pol.slug,
    photoUrl: pol.blobPhotoUrl || pol.photoUrl || null,
    partyShortName: pol.partyShortName || null,
    partyId: pol.partyId || null,
    mandateType: "DEPUTE",
  }));

  const syncedData = {
    voteMatrix,
    politicians: politicianData,
    parties,
    partyMajorities,
    syncedAt: new Date().toISOString(),
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(syncedData, null, 2), "utf-8");

  // Stats
  const totalVotes = Object.values(voteMatrix).reduce(
    (sum, votes) => sum + Object.keys(votes).length, 0
  );
  console.log(`\nSync complete:`);
  console.log(`  ${politicianData.length} politicians`);
  console.log(`  ${parties.length} parties`);
  console.log(`  ${totalVotes} votes across ${scrutinIds.size} scrutins`);
  console.log(`  Written to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
