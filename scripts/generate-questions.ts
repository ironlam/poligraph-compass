import fs from "fs";
import path from "path";

const SCRUTINS_PATH = path.join(__dirname, "..", "data", "scrutins.json");
const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

async function reformulateQuestion(scrutinTitle: string): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("MISTRAL_API_KEY not set");

  const response = await fetch(MISTRAL_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      messages: [
        {
          role: "system",
          content:
            "Tu reformules des titres de scrutins parlementaires français en questions simples pour des citoyens. La question doit être : neutre (pas de formulation orientée), courte (une phrase, 15 mots max), compréhensible sans contexte politique. Réponds uniquement avec la question, sans guillemets.",
        },
        { role: "user", content: scrutinTitle },
      ],
      max_tokens: 100,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

const POLIGRAPH_API = process.env.POLIGRAPH_API_URL || "https://poligraph.fr/api";

async function fetchScrutinTitle(scrutinId: string): Promise<string | null> {
  try {
    const response = await fetch(`${POLIGRAPH_API}/votes/${scrutinId}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.title || data.name || null;
  } catch {
    return null;
  }
}

async function main() {
  const scrutins = JSON.parse(fs.readFileSync(SCRUTINS_PATH, "utf-8"));
  let updated = 0;

  for (const scrutin of scrutins) {
    if (scrutin.question && scrutin.question.length > 0) {
      console.log(`  Already has question: ${scrutin.scrutinId}`);
      continue;
    }

    console.log(`Reformulating: ${scrutin.scrutinId}...`);

    // Fetch the scrutin title from Poligraph API
    const title = await fetchScrutinTitle(scrutin.scrutinId);
    if (!title) {
      console.log(`  Skipped (could not fetch title from Poligraph)`);
      continue;
    }

    console.log(`  Title: ${title}`);
    const question = await reformulateQuestion(title);
    console.log(`  Question: ${question}`);

    scrutin.question = question;
    updated++;
  }

  fs.writeFileSync(SCRUTINS_PATH, JSON.stringify(scrutins, null, 2) + "\n");
  console.log(`\nDone. Updated ${updated} questions.`);
  console.log("IMPORTANT: review all generated questions before committing.");
}

main().catch(console.error);
