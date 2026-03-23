/**
 * Audit des scrutins : analyse chaque scrutin via Mistral pour détecter
 * les biais (opposition, texte vs idée) et évaluer la qualité des questions.
 *
 * Usage: MISTRAL_API_KEY=... npx tsx scripts/audit-scrutins.ts
 *
 * Produit un rapport dans data/audit-report.json
 */

import fs from "fs";
import path from "path";

const SCRUTINS_PATH = path.join(__dirname, "..", "data", "scrutins.json");
const DETAILS_PATH = path.join(__dirname, "..", "data", "scrutin-details.json");
const REPORT_PATH = path.join(__dirname, "..", "data", "audit-report.json");
const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

// Load .env manually (no dependency needed)
try {
  const envPath = path.join(__dirname, "..", ".env");
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value.trim();
      }
    }
  }
} catch {}

interface ScrutinConfig {
  scrutinId: string;
  order: number;
  tier: string;
  axis: string;
  polarity: number;
  theme: string;
  question: string;
}

interface ScrutinDetails {
  title: string;
  summary: string | null;
  citizenImpact: string | null;
  result: string;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  votingDate: string;
}

interface AuditResult {
  scrutinId: string;
  order: number;
  currentQuestion: string;
  scrutinTitle: string;
  axis: string;
  polarity: number;
  theme: string;
  voteResult: string;
  analysis: {
    ideologicalClarity: "clear" | "ambiguous" | "problematic";
    oppositionBiasRisk: "low" | "medium" | "high";
    questionQuality: "good" | "needs_improvement" | "misleading";
    issues: string[];
    suggestedQuestion: string;
    reasoning: string;
  };
}

// Load scrutin details exported from politic-tracker via Prisma
// Run: cd ../politic-tracker && npx tsx scripts/export-scrutin-details.ts
let scrutinDetailsCache: Record<string, ScrutinDetails> | null = null;

function loadScrutinDetails(): Record<string, ScrutinDetails> {
  if (scrutinDetailsCache) return scrutinDetailsCache;
  try {
    const raw = JSON.parse(fs.readFileSync(DETAILS_PATH, "utf-8"));
    scrutinDetailsCache = raw;
    return raw;
  } catch {
    console.error(`Could not read ${DETAILS_PATH}`);
    console.error("Run first: cd ../politic-tracker && npx tsx scripts/export-scrutin-details.ts");
    process.exit(1);
  }
}

function fetchScrutinDetails(scrutinId: string): ScrutinDetails | null {
  const all = loadScrutinDetails();
  const data = all[scrutinId];
  if (!data) return null;
  return {
    title: data.title || "",
    summary: data.summary || null,
    citizenImpact: data.citizenImpact || null,
    result: data.result || "UNKNOWN",
    votesFor: data.votesFor || 0,
    votesAgainst: data.votesAgainst || 0,
    votesAbstain: data.votesAbstain || 0,
    votingDate: data.votingDate || "",
  };
}

async function analyzeWithMistral(
  scrutin: ScrutinConfig,
  details: ScrutinDetails
): Promise<AuditResult["analysis"]> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("MISTRAL_API_KEY not set");

  const prompt = `Tu es un expert en science politique française. Analyse ce scrutin parlementaire pour un outil de "boussole politique" qui compare les réponses des citoyens avec les votes des députés.

SCRUTIN :
- Titre officiel : ${details.title}
- Date : ${details.votingDate}
- Résultat : ${details.result} (Pour: ${details.votesFor}, Contre: ${details.votesAgainst}, Abstentions: ${details.votesAbstain})
${details.summary ? `- Résumé : ${details.summary}` : ""}
${details.citizenImpact ? `- Impact citoyen : ${details.citizenImpact}` : ""}

CONFIGURATION ACTUELLE :
- Question posée au citoyen : "${scrutin.question}"
- Axe : ${scrutin.axis} (economy = intervention État ↔ libéralisme, society = progressiste ↔ conservateur)
- Polarité : ${scrutin.polarity} (1 = POUR correspond à progressiste/libéral, -1 = POUR correspond à conservateur/interventionniste)

PROBLÈME CONNU : Un député peut voter CONTRE un texte non pas parce qu'il est contre l'idée, mais parce que le texte ne va pas assez loin, ou qu'un article spécifique lui pose problème. Le citoyen, lui, répond sur l'IDÉE générale.

Analyse en JSON strict (pas de markdown, pas de backticks) :
{
  "ideologicalClarity": "clear|ambiguous|problematic",
  "oppositionBiasRisk": "low|medium|high",
  "questionQuality": "good|needs_improvement|misleading",
  "issues": ["liste des problèmes identifiés, vide si aucun"],
  "suggestedQuestion": "question reformulée si amélioration possible, sinon la question actuelle",
  "reasoning": "explication courte (2-3 phrases) de ton analyse"
}`;

  const res = await fetch(MISTRAL_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Mistral API error ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  const content = data.choices[0].message.content.trim();

  try {
    // Strip markdown code fences if present
    const cleaned = content.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    return JSON.parse(cleaned);
  } catch {
    console.error(`  Failed to parse Mistral response: ${content}`);
    return {
      ideologicalClarity: "ambiguous" as const,
      oppositionBiasRisk: "medium" as const,
      questionQuality: "needs_improvement" as const,
      issues: ["Erreur de parsing de la réponse Mistral"],
      suggestedQuestion: scrutin.question,
      reasoning: content,
    };
  }
}

async function main() {
  console.log("=== Audit des scrutins ===\n");

  const scrutins: ScrutinConfig[] = JSON.parse(fs.readFileSync(SCRUTINS_PATH, "utf-8"));
  const results: AuditResult[] = [];

  for (const scrutin of scrutins) {
    console.log(`[${scrutin.order}/${scrutins.length}] ${scrutin.question}`);

    const details = fetchScrutinDetails(scrutin.scrutinId);
    if (!details) {
      console.log("  ⚠ Impossible de récupérer les détails, skip\n");
      continue;
    }
    console.log(`  Titre: ${details.title}`);

    const analysis = await analyzeWithMistral(scrutin, details);

    const indicator =
      analysis.ideologicalClarity === "problematic" ? "🔴" :
      analysis.ideologicalClarity === "ambiguous" ? "🟡" : "🟢";
    console.log(`  ${indicator} Clarté: ${analysis.ideologicalClarity} | Biais opposition: ${analysis.oppositionBiasRisk} | Question: ${analysis.questionQuality}`);
    if (analysis.issues.length > 0) {
      for (const issue of analysis.issues) {
        console.log(`     → ${issue}`);
      }
    }
    console.log();

    results.push({
      scrutinId: scrutin.scrutinId,
      order: scrutin.order,
      currentQuestion: scrutin.question,
      scrutinTitle: details.title,
      axis: scrutin.axis,
      polarity: scrutin.polarity,
      theme: scrutin.theme,
      voteResult: details.result,
      analysis,
    });
  }

  // Summary
  const problematic = results.filter((r) => r.analysis.ideologicalClarity === "problematic");
  const ambiguous = results.filter((r) => r.analysis.ideologicalClarity === "ambiguous");
  const highBias = results.filter((r) => r.analysis.oppositionBiasRisk === "high");
  const badQuestions = results.filter((r) => r.analysis.questionQuality !== "good");

  console.log("=== RÉSUMÉ ===");
  console.log(`Total scrutins analysés: ${results.length}`);
  console.log(`🔴 Problématiques (clarté idéologique): ${problematic.length}`);
  console.log(`🟡 Ambigus: ${ambiguous.length}`);
  console.log(`⚠ Risque élevé de biais d'opposition: ${highBias.length}`);
  console.log(`📝 Questions à reformuler: ${badQuestions.length}`);

  if (problematic.length > 0) {
    console.log("\nScrutins à retirer ou remplacer :");
    for (const r of problematic) {
      console.log(`  - #${r.order} ${r.currentQuestion}`);
      console.log(`    Raison: ${r.analysis.reasoning}`);
    }
  }

  if (badQuestions.length > 0) {
    console.log("\nQuestions à reformuler :");
    for (const r of badQuestions) {
      console.log(`  - #${r.order} "${r.currentQuestion}"`);
      console.log(`    → "${r.analysis.suggestedQuestion}"`);
    }
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify(results, null, 2) + "\n");
  console.log(`\nRapport complet sauvé dans ${REPORT_PATH}`);
}

main().catch(console.error);
