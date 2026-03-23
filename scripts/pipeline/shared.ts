import path from "path";
import fs from "fs";

// --- File Paths ---

export const DATA_DIR = path.join(__dirname, "..", "..", "data");
export const PIPELINE_DIR = path.join(DATA_DIR, "pipeline");
export const SCRUTINS_PATH = path.join(DATA_DIR, "scrutins.json");
export const CANDIDATES_PATH = path.join(PIPELINE_DIR, "candidates.json");
export const DRAFTS_PATH = path.join(PIPELINE_DIR, "drafts.json");

// --- Poligraph API ---

export const POLIGRAPH_API =
  process.env.POLIGRAPH_API_URL || "https://poligraph.fr/api";

// --- Valid Themes (from lib/theme-labels.ts) ---

export const VALID_THEMES = [
  "ECONOMIE_BUDGET",
  "SOCIAL_TRAVAIL",
  "SECURITE_JUSTICE",
  "ENVIRONNEMENT_ENERGIE",
  "SANTE",
  "EDUCATION_CULTURE",
  "INSTITUTIONS",
  "AFFAIRES_ETRANGERES_DEFENSE",
  "NUMERIQUE_TECH",
  "IMMIGRATION",
  "AGRICULTURE_ALIMENTATION",
  "LOGEMENT_URBANISME",
  "TRANSPORTS",
] as const;

export type Theme = (typeof VALID_THEMES)[number];

// --- Types ---

/** Raw scrutin from the Poligraph API */
export interface ApiScrutin {
  id: string;
  externalId: string;
  title: string;
  votingDate: string;
  legislature: number;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  result: string;
  sourceUrl: string;
  totalVotes: number;
}

/** Candidate scrutin after filtering */
export interface Candidate {
  scrutinId: string;
  officialTitle: string;
  votingDate: string;
  result: "adopte" | "rejete";
  voteCount: {
    pour: number;
    contre: number;
    abstention: number;
  };
  totalVotes: number;
  /** Why this candidate was selected (for reviewer context) */
  selectionReason: string;
}

/** Draft question produced by Claude */
export interface Draft {
  scrutinId: string;
  officialTitle: string;
  question: string;
  summary: string;
  axis: "economy" | "society";
  polarity: 1 | -1;
  theme: Theme;
  result: "adopte" | "rejete";
  voteCount: {
    pour: number;
    contre: number;
    abstention: number;
  };
  /** Human review status: pending, approved, rejected, edited */
  status: "pending" | "approved" | "rejected" | "edited";
  /** Optional reviewer notes */
  reviewNotes?: string;
}

// --- Env loading (no dotenv dependency) ---

export function loadEnv(): void {
  try {
    const envPath = path.join(__dirname, "..", "..", ".env");
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
}

// --- Helpers ---

export function readJsonFile<T>(filePath: string): T {
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content);
}

export function writeJsonFile(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}
