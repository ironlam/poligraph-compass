/**
 * Use Mistral API to draft question text, educational summary, and classification
 * for each candidate scrutin.
 *
 * Usage: MISTRAL_API_KEY=... npx tsx scripts/pipeline/draft-questions.ts [--max 30]
 *
 * Input: data/pipeline/candidates.json
 * Output: data/pipeline/drafts.json
 */

import {
  CANDIDATES_PATH,
  DRAFTS_PATH,
  VALID_THEMES,
  loadEnv,
  readJsonFile,
  writeJsonFile,
  type Candidate,
  type Draft,
} from "./shared";

loadEnv();

// --- Config ---

const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
const MODEL = "mistral-small-latest";
const MAX_CANDIDATES_DEFAULT = 30;
const DELAY_MS = 500; // rate limit courtesy

// --- CLI args ---

function parseArgs() {
  const args = process.argv.slice(2);
  let max = MAX_CANDIDATES_DEFAULT;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--max" && args[i + 1]) {
      max = parseInt(args[i + 1], 10);
      i++;
    }
  }

  return { max };
}

// --- System prompt ---

const SYSTEM_PROMPT = `Tu es un expert en science politique qui aide a construire des questions pour une boussole politique. Tu produis des questions neutres a partir de scrutins parlementaires francais.

REGLES DE NEUTRALITE :
- Decris le MECANISME (ce que la loi fait concretement), pas l'ASPIRATION (ce que ses auteurs esperent)
- Pas de langage charge : pas de "proteger", "garantir", "renforcer" dans la question (sauf si c'est exactement le mecanisme)
- La question doit permettre de repondre POUR ou CONTRE sans orientation
- Formulation : "Faut-il [mecanisme] ?" ou "L'Etat doit-il [mecanisme] ?"
- 15 mots maximum pour la question

REGLES POUR LE RESUME PEDAGOGIQUE :
- 3-4 phrases maximum
- Phrase 1 : contexte concret (chiffres, situation actuelle)
- Phrase 2 : ce que la loi propose concretement
- Phrase 3 : ce que "voter POUR" signifie et pourquoi certains le soutiennent
- Phrase 4 : ce que "voter CONTRE" signifie et pourquoi certains s'y opposent
- Pas de jargon juridique

CLASSIFICATION AXE/POLARITE :
- Axe "economy" : intervention de l'Etat vs liberalisme economique
  - polarity -1 : POUR = plus d'intervention etatique (regulation, depenses publiques, nationalisations)
  - polarity 1 : POUR = plus de liberalisme (deregulation, privatisation, moins de depenses)
- Axe "society" : conservateur vs progressiste
  - polarity -1 : POUR = position plus conservatrice/securitaire/restrictive
  - polarity 1 : POUR = position plus progressiste/libertaire/inclusive

CLASSIFICATION THEME :
Choisis UN theme parmi : ${VALID_THEMES.join(", ")}

Reponds en JSON strict, pas de markdown :
{
  "question": "...",
  "summary": "...",
  "axis": "economy" | "society",
  "polarity": 1 | -1,
  "theme": "..."
}`;

// --- Draft generation ---

async function draftQuestion(
  apiKey: string,
  candidate: Candidate
): Promise<Pick<Draft, "question" | "summary" | "axis" | "polarity" | "theme">> {
  const userPrompt = `SCRUTIN :
- Titre officiel : ${candidate.officialTitle}
- Date du vote : ${candidate.votingDate}
- Resultat : ${candidate.result === "adopte" ? "Adopte" : "Rejete"}
- Votes : Pour ${candidate.voteCount.pour}, Contre ${candidate.voteCount.contre}, Abstention ${candidate.voteCount.abstention}

Genere la question, le resume pedagogique, et la classification.`;

  const res = await fetch(MISTRAL_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 600,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Mistral API error ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  const text = data.choices[0].message.content.trim();
  const cleaned = text
    .replace(/^```json?\n?/, "")
    .replace(/\n?```$/, "")
    .trim();

  const parsed = JSON.parse(cleaned);

  // Validate fields
  if (!parsed.question || typeof parsed.question !== "string") {
    throw new Error("Missing or invalid 'question' field");
  }
  if (!parsed.summary || typeof parsed.summary !== "string") {
    throw new Error("Missing or invalid 'summary' field");
  }
  if (!["economy", "society"].includes(parsed.axis)) {
    throw new Error(`Invalid axis: ${parsed.axis}`);
  }
  if (![1, -1].includes(parsed.polarity)) {
    throw new Error(`Invalid polarity: ${parsed.polarity}`);
  }
  if (!(VALID_THEMES as readonly string[]).includes(parsed.theme)) {
    throw new Error(`Invalid theme: ${parsed.theme}`);
  }

  return {
    question: parsed.question,
    summary: parsed.summary,
    axis: parsed.axis,
    polarity: parsed.polarity,
    theme: parsed.theme,
  };
}

// --- Main ---

async function main() {
  const { max } = parseArgs();

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    console.error("MISTRAL_API_KEY not set. Set it in .env or environment.");
    process.exit(1);
  }

  console.log("=== Draft Questions with Mistral ===\n");

  const candidates: Candidate[] = readJsonFile(CANDIDATES_PATH);
  console.log(`Loaded ${candidates.length} candidates from ${CANDIDATES_PATH}`);

  const toProcess = candidates.slice(0, max);
  console.log(`Processing ${toProcess.length} candidates (max: ${max})\n`);

  // Load existing drafts to support incremental runs
  let drafts: Draft[] = [];
  try {
    drafts = readJsonFile(DRAFTS_PATH);
    console.log(`Loaded ${drafts.length} existing drafts (incremental mode)\n`);
  } catch {
    console.log("No existing drafts, starting fresh\n");
  }

  const alreadyDrafted = new Set(drafts.map((d) => d.scrutinId));
  let newCount = 0;
  let errorCount = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const candidate = toProcess[i];

    if (alreadyDrafted.has(candidate.scrutinId)) {
      console.log(
        `[${i + 1}/${toProcess.length}] SKIP (already drafted): ${candidate.scrutinId}`
      );
      continue;
    }

    console.log(
      `[${i + 1}/${toProcess.length}] Drafting: ${candidate.officialTitle.slice(0, 80)}...`
    );

    try {
      const result = await draftQuestion(apiKey, candidate);

      const draft: Draft = {
        scrutinId: candidate.scrutinId,
        officialTitle: candidate.officialTitle,
        question: result.question,
        summary: result.summary,
        axis: result.axis,
        polarity: result.polarity,
        theme: result.theme,
        result: candidate.result,
        voteCount: candidate.voteCount,
        status: "pending",
      };

      drafts.push(draft);
      newCount++;

      console.log(`  Question: ${draft.question}`);
      console.log(
        `  Axis: ${draft.axis}, Polarity: ${draft.polarity}, Theme: ${draft.theme}`
      );
      console.log();

      // Save after each draft (incremental, resilient to crashes)
      writeJsonFile(DRAFTS_PATH, drafts);

      // Rate limit courtesy
      if (i < toProcess.length - 1) {
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    } catch (err) {
      errorCount++;
      console.error(
        `  ERROR: ${err instanceof Error ? err.message : err}\n`
      );
    }
  }

  console.log(`=== Drafting Complete ===`);
  console.log(`New drafts: ${newCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total drafts in file: ${drafts.length}`);
  console.log(`\nOutput: ${DRAFTS_PATH}`);
  console.log(`\nNext step: review drafts in ${DRAFTS_PATH}`);
  console.log(
    `Set "status" to "approved" or "rejected" for each entry, then run pipeline:merge`
  );
}

main().catch((err) => {
  console.error("Draft generation failed:", err);
  process.exit(1);
});
