# Ma Boussole Politique Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first political compass app that lets citizens discover which elected officials vote like them, based on real parliamentary votes.

**Architecture:** Expo/React Native app with Vercel serverless backend. Core computation (concordance + 2D compass) lives in a shared `lib/` folder usable by both client and server. Quiz data comes from a static `data/scrutins.json` config file. Backend syncs vote matrices from Poligraph API daily via Vercel cron.

**Tech Stack:** Expo SDK 55, React Native 0.83, Expo Router, NativeWind v5, Reanimated 4, Zustand, TanStack Query, D3.js + react-native-svg, Vercel Serverless Functions, Vercel KV, @vercel/og, Zod, Vitest

---

## File Map

### Data
- `data/scrutins.json` — Editorial selection of 25 scrutins with questions, axes, polarity

### Shared Library (`lib/`)
- `lib/schemas.ts` — Zod schemas shared between client and server (QuizPack, UserAnswers, ComputeResult, ShareResult)
- `lib/concordance.ts` — Concordance algorithm (agree/disagree/partial scoring)
- `lib/compass.ts` — 2D compass positioning (axis scores from answers + polarity)
- `lib/types.ts` — TypeScript types derived from Zod schemas
- `lib/theme-labels.ts` — Human-readable theme labels and colors mapping
- `lib/quiz-pack-loader.ts` — Shared quiz-pack data loader (used by quiz-pack and compute endpoints)

### State (`lib/store.ts`)
- `lib/store.ts` — Zustand store (quiz answers, current question index, results)

### API Routes (`app/api/`)
- `app/api/quiz-pack+api.ts` — GET: serve quiz questions + vote matrix (cached 24h)
- `app/api/compute+api.ts` — POST: server-side concordance computation, store result in KV
- `app/api/share/[id]+api.ts` — GET: return stored result for shared link
- `app/api/og/[id]+api.ts` — GET: generate OG image via @vercel/og
- `app/api/cron/sync+api.ts` — Cron: fetch vote data from Poligraph API

### App Screens (`app/`)
- `app/_layout.tsx` — Root layout (fonts, providers, TanStack QueryClient)
- `app/index.tsx` — Home screen (hero, CTA)
- `app/quiz.tsx` — Quiz screen (swipable cards, progress bar)
- `app/results.tsx` — Results screen (compass 2D + ranking list)
- `app/share.tsx` — Share screen (image preview, toggle, share actions)
- `app/r/[id].tsx` — Shared result web page (shows result + invite to quiz)
- `app/refine.tsx` — Refine transition screen (Écran 5: "15 questions de plus")

### Components (`components/`)
- `components/Compass.tsx` — 2D compass SVG visualization
- `components/QuizCard.tsx` — Single quiz question card (swipable)
- `components/ProgressBar.tsx` — Quiz progress indicator
- `components/RankingList.tsx` — Politician/party ranking with tabs
- `components/RankingItem.tsx` — Single ranking entry row
- `components/ThemeBadge.tsx` — Colored theme label badge
- `components/SharePreview.tsx` — Share image preview with toggle

### Scripts (`scripts/`)
- `scripts/generate-questions.ts` — CLI: reformulate scrutin titles via Mistral Small 4

### Config
- `app.json` — Expo configuration
- `vercel.json` — Vercel crons + config
- `global.css` — Tailwind CSS entry point (NativeWind)
- `metro.config.js` — Metro bundler config with NativeWind transformer
- `tailwind.config.ts` — NativeWind/Tailwind theme
- `vitest.config.ts` — Test configuration

### Tests (`__tests__/`)
- `__tests__/lib/concordance.test.ts` — Concordance algorithm unit tests
- `__tests__/lib/compass.test.ts` — Compass positioning unit tests
- `__tests__/lib/schemas.test.ts` — Schema validation tests
- `__tests__/api/quiz-pack.test.ts` — Quiz-pack API tests
- `__tests__/api/compute.test.ts` — Compute API tests

---

## Chunk 1: Project Setup + Core Logic

### Task 1: Expo Project Init

**Files:**
- Create: `package.json`, `app.json`, `tsconfig.json`, `app/_layout.tsx`, `app/index.tsx`
- Create: `vercel.json`, `tailwind.config.ts`, `vitest.config.ts`
- Create: `global.css`, `metro.config.js`
- Create: `.gitignore`, `.env.example`

- [ ] **Step 1: Init Expo project**

Run:
```bash
cd /home/ldiaby/projects/boussole-politique
npx create-expo-app@latest . --template blank-typescript
```

If the directory is not empty, init in a temp directory and move files.

- [ ] **Step 2: Install core dependencies**

Run:
```bash
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar expo-clipboard
npm install nativewind@next tailwindcss @tailwindcss/postcss
npm install zustand @tanstack/react-query zod
npm install react-native-reanimated react-native-gesture-handler
npm install react-native-svg d3-scale d3-shape
npm install expo-sharing react-native-view-shot
npm install @vercel/kv
npm install -D vitest @testing-library/react-native @types/d3-scale @types/d3-shape
```

- [ ] **Step 3: Configure Expo Router**

Update `app.json`:
```json
{
  "expo": {
    "name": "Ma Boussole Politique",
    "slug": "boussole-politique",
    "scheme": "boussole",
    "version": "1.0.0",
    "platforms": ["ios", "android", "web"],
    "web": {
      "bundler": "metro",
      "output": "server"
    },
    "plugins": [
      "expo-router"
    ]
  }
}
```

- [ ] **Step 4: Configure NativeWind**

Create `tailwind.config.ts`:
```typescript
import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        pour: "#10b981",
        contre: "#ef4444",
        abstention: "#94a3b8",
        compass: {
          bg: "#f8fafc",
          axis: "#e2e8f0",
          user: "#6366f1",
        },
      },
    },
  },
} satisfies Config;
```

- [ ] **Step 4b: Create global.css**

Create `global.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4c: Create metro.config.js for NativeWind**

Create `metro.config.js`:
```javascript
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
```

- [ ] **Step 5: Configure Vitest**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
```

Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`

- [ ] **Step 6: Create root layout**

Create `app/_layout.tsx`:
```tsx
import "../global.css";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 7: Create placeholder home screen**

Create `app/index.tsx`:
```tsx
import { View, Text } from "react-native";

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold">Ma Boussole Politique</Text>
    </View>
  );
}
```

- [ ] **Step 8: Create Vercel config**

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/sync",
      "schedule": "0 6 * * *"
    }
  ]
}
```

- [ ] **Step 9: Create env example**

Create `.env.example`:
```
# Poligraph API (public, no auth)
POLIGRAPH_API_URL=https://poligraph.fr/api

# Vercel KV (for shared results)
KV_REST_API_URL=
KV_REST_API_TOKEN=

# Mistral AI (for question reformulation only)
MISTRAL_API_KEY=

# Vercel Cron secret (auto-set by Vercel)
CRON_SECRET=

# Umami Analytics
EXPO_PUBLIC_UMAMI_WEBSITE_ID=
EXPO_PUBLIC_UMAMI_URL=
```

- [ ] **Step 10: Verify project runs**

Run: `npx expo start --web`
Expected: App loads in browser with "Ma Boussole Politique" text.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: init Expo project with Router, NativeWind, TanStack Query"
```

---

### Task 2: Zod Schemas + Types

**Files:**
- Create: `lib/schemas.ts`
- Create: `lib/types.ts`
- Test: `__tests__/lib/schemas.test.ts`

- [ ] **Step 1: Write schema validation tests**

Create `__tests__/lib/schemas.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import {
  ScrutinConfigSchema,
  QuizPackSchema,
  UserAnswerSchema,
  ComputeRequestSchema,
  ComputeResultSchema,
  ShareResultSchema,
} from "@/lib/schemas";

describe("ScrutinConfigSchema", () => {
  it("validates a valid scrutin config entry", () => {
    const valid = {
      scrutinId: "VTANR6L16V4217",
      order: 1,
      tier: "essential",
      axis: "society",
      polarity: 1,
      theme: "ENVIRONNEMENT_ENERGIE",
      question: "Faut-il interdire le glyphosate en agriculture ?",
    };
    expect(ScrutinConfigSchema.parse(valid)).toEqual(valid);
  });

  it("rejects invalid polarity", () => {
    const invalid = {
      scrutinId: "VTANR6L16V4217",
      order: 1,
      tier: "essential",
      axis: "society",
      polarity: 2,
      theme: "ENVIRONNEMENT_ENERGIE",
      question: "Test?",
    };
    expect(() => ScrutinConfigSchema.parse(invalid)).toThrow();
  });

  it("rejects missing question", () => {
    const invalid = {
      scrutinId: "VTANR6L16V4217",
      order: 1,
      tier: "essential",
      axis: "society",
      polarity: 1,
      theme: "ENVIRONNEMENT_ENERGIE",
    };
    expect(() => ScrutinConfigSchema.parse(invalid)).toThrow();
  });
});

describe("UserAnswerSchema", () => {
  it("validates POUR/CONTRE/ABSTENTION/SKIP", () => {
    expect(UserAnswerSchema.parse("POUR")).toBe("POUR");
    expect(UserAnswerSchema.parse("CONTRE")).toBe("CONTRE");
    expect(UserAnswerSchema.parse("ABSTENTION")).toBe("ABSTENTION");
    expect(UserAnswerSchema.parse("SKIP")).toBe("SKIP");
  });

  it("rejects invalid answer", () => {
    expect(() => UserAnswerSchema.parse("MAYBE")).toThrow();
  });
});

describe("ComputeRequestSchema", () => {
  it("validates a valid request", () => {
    const valid = {
      answers: { "VTANR6L16V4217": "POUR", "VTANR6L16V1234": "CONTRE" },
    };
    expect(ComputeRequestSchema.parse(valid)).toEqual(valid);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/lib/schemas.test.ts`
Expected: FAIL (modules not found)

- [ ] **Step 3: Implement schemas**

Create `lib/schemas.ts`:
```typescript
import { z } from "zod";

// --- Data Config ---

export const ScrutinConfigSchema = z.object({
  scrutinId: z.string(),
  order: z.number().int().positive(),
  tier: z.enum(["essential", "refine"]),
  axis: z.enum(["economy", "society"]),
  polarity: z.union([z.literal(1), z.literal(-1)]),
  theme: z.string(),
  question: z.string().min(1),
});

// --- User Input ---

export const UserAnswerSchema = z.enum(["POUR", "CONTRE", "ABSTENTION", "SKIP"]);

export const ComputeRequestSchema = z.object({
  answers: z.record(z.string(), UserAnswerSchema),
});

// --- Vote Data ---

export const VotePositionSchema = z.enum(["POUR", "CONTRE", "ABSTENTION", "ABSENT", "NON_VOTANT"]);

export const PoliticianSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  slug: z.string(),
  photoUrl: z.string().nullable(),
  partyShortName: z.string().nullable(),
  partyId: z.string().nullable(),
  mandateType: z.string(),
});

export const PartySchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string(),
  color: z.string().nullable(),
});

// --- Quiz Pack (served by API) ---

export const QuizQuestionSchema = z.object({
  scrutinId: z.string(),
  question: z.string(),
  theme: z.string(),
  tier: z.enum(["essential", "refine"]),
  order: z.number(),
  votingDate: z.string(),
  chamber: z.string(),
});

export const QuizPackSchema = z.object({
  questions: z.array(QuizQuestionSchema),
  voteMatrix: z.record(z.string(), z.record(z.string(), VotePositionSchema)),
  politicians: z.array(PoliticianSchema),
  parties: z.array(PartySchema),
  partyMajorities: z.record(z.string(), z.record(z.string(), VotePositionSchema)),
  axes: z.object({
    economy: z.object({ scrutinIds: z.array(z.string()), polarities: z.record(z.string(), z.union([z.literal(1), z.literal(-1)])) }),
    society: z.object({ scrutinIds: z.array(z.string()), polarities: z.record(z.string(), z.union([z.literal(1), z.literal(-1)])) }),
  }),
  generatedAt: z.string(),
});

// --- Compute Result ---

export const ConcordanceEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().optional(),
  photoUrl: z.string().nullable().optional(),
  partyShortName: z.string().nullable().optional(),
  concordance: z.number().min(0).max(100),
  agree: z.number(),
  disagree: z.number(),
  partial: z.number(),
});

export const CompassPositionSchema = z.object({
  x: z.number().min(-1).max(1),
  y: z.number().min(-1).max(1),
  xValid: z.boolean(),
  yValid: z.boolean(),
});

export const ComputeResultSchema = z.object({
  position: CompassPositionSchema,
  politicians: z.array(ConcordanceEntrySchema),
  parties: z.array(ConcordanceEntrySchema),
  answeredCount: z.number(),
  totalQuestions: z.number(),
});

// --- Share Result (stored in KV) ---

export const ShareResultSchema = z.object({
  id: z.string(),
  position: CompassPositionSchema,
  topParty: ConcordanceEntrySchema.nullable(),
  showParties: z.boolean(),
  answeredCount: z.number(),
  createdAt: z.string(),
});
```

- [ ] **Step 4: Create types file**

Create `lib/types.ts`:
```typescript
import { z } from "zod";
import {
  ScrutinConfigSchema,
  QuizPackSchema,
  UserAnswerSchema,
  ComputeRequestSchema,
  ComputeResultSchema,
  ShareResultSchema,
  PoliticianSchema,
  PartySchema,
  VotePositionSchema,
  CompassPositionSchema,
  ConcordanceEntrySchema,
  QuizQuestionSchema,
} from "./schemas";

export type ScrutinConfig = z.infer<typeof ScrutinConfigSchema>;
export type QuizPack = z.infer<typeof QuizPackSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type UserAnswer = z.infer<typeof UserAnswerSchema>;
export type ComputeRequest = z.infer<typeof ComputeRequestSchema>;
export type ComputeResult = z.infer<typeof ComputeResultSchema>;
export type ShareResult = z.infer<typeof ShareResultSchema>;
export type Politician = z.infer<typeof PoliticianSchema>;
export type Party = z.infer<typeof PartySchema>;
export type VotePosition = z.infer<typeof VotePositionSchema>;
export type CompassPosition = z.infer<typeof CompassPositionSchema>;
export type ConcordanceEntry = z.infer<typeof ConcordanceEntrySchema>;
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run __tests__/lib/schemas.test.ts`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add lib/schemas.ts lib/types.ts __tests__/lib/schemas.test.ts
git commit -m "feat: add Zod schemas and TypeScript types for quiz data model"
```

---

### Task 3: Concordance Algorithm

**Files:**
- Create: `lib/concordance.ts`
- Test: `__tests__/lib/concordance.test.ts`

- [ ] **Step 1: Write concordance tests**

Create `__tests__/lib/concordance.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import {
  classifyVotePair,
  computePoliticianConcordance,
  computePartyConcordance,
} from "@/lib/concordance";

describe("classifyVotePair", () => {
  it("returns agree when both POUR", () => {
    expect(classifyVotePair("POUR", "POUR")).toBe("agree");
  });

  it("returns agree when both CONTRE", () => {
    expect(classifyVotePair("CONTRE", "CONTRE")).toBe("agree");
  });

  it("returns disagree when opposite", () => {
    expect(classifyVotePair("POUR", "CONTRE")).toBe("disagree");
    expect(classifyVotePair("CONTRE", "POUR")).toBe("disagree");
  });

  it("returns partial when one is ABSTENTION", () => {
    expect(classifyVotePair("POUR", "ABSTENTION")).toBe("partial");
    expect(classifyVotePair("ABSTENTION", "CONTRE")).toBe("partial");
  });

  it("returns agree when both ABSTENTION", () => {
    expect(classifyVotePair("ABSTENTION", "ABSTENTION")).toBe("agree");
  });

  it("returns skip when user skipped", () => {
    expect(classifyVotePair("SKIP", "POUR")).toBe("skip");
  });

  it("returns skip when politician absent", () => {
    expect(classifyVotePair("POUR", "ABSENT")).toBe("skip");
    expect(classifyVotePair("POUR", "NON_VOTANT")).toBe("skip");
  });
});

describe("computePoliticianConcordance", () => {
  const voteMatrix: Record<string, Record<string, string>> = {
    scrutin1: { pol1: "POUR", pol2: "CONTRE", pol3: "ABSTENTION" },
    scrutin2: { pol1: "CONTRE", pol2: "POUR", pol3: "POUR" },
    scrutin3: { pol1: "POUR", pol2: "POUR", pol3: "ABSENT" },
  };

  it("returns 100% when all answers match", () => {
    const answers = { scrutin1: "POUR", scrutin2: "CONTRE", scrutin3: "POUR" } as Record<string, any>;
    const result = computePoliticianConcordance("pol1", answers, voteMatrix);
    expect(result.concordance).toBe(100);
    expect(result.agree).toBe(3);
    expect(result.disagree).toBe(0);
  });

  it("returns 0% when all answers oppose", () => {
    const answers = { scrutin1: "CONTRE", scrutin2: "POUR", scrutin3: "CONTRE" } as Record<string, any>;
    const result = computePoliticianConcordance("pol1", answers, voteMatrix);
    expect(result.concordance).toBe(0);
    expect(result.disagree).toBe(3);
  });

  it("excludes skipped questions from total", () => {
    const answers = { scrutin1: "POUR", scrutin2: "SKIP", scrutin3: "POUR" } as Record<string, any>;
    const result = computePoliticianConcordance("pol1", answers, voteMatrix);
    expect(result.agree).toBe(2);
    expect(result.concordance).toBe(100);
  });

  it("excludes absent politicians from total", () => {
    const answers = { scrutin1: "POUR", scrutin2: "POUR", scrutin3: "POUR" } as Record<string, any>;
    const result = computePoliticianConcordance("pol3", answers, voteMatrix);
    // scrutin1: ABSTENTION vs POUR = partial, scrutin2: POUR vs POUR = agree, scrutin3: ABSENT = skip
    expect(result.agree).toBe(1);
    expect(result.partial).toBe(1);
    expect(result.concordance).toBe(50); // 1 / (1+0+1)
  });

  it("returns -1 concordance when no comparable votes", () => {
    const answers = { scrutin1: "SKIP", scrutin2: "SKIP", scrutin3: "SKIP" } as Record<string, any>;
    const result = computePoliticianConcordance("pol1", answers, voteMatrix);
    expect(result.concordance).toBe(-1);
  });
});

describe("computePartyConcordance", () => {
  it("computes concordance against party majority positions", () => {
    const partyMajorities: Record<string, Record<string, string>> = {
      scrutin1: { party1: "POUR", party2: "CONTRE" },
      scrutin2: { party1: "CONTRE", party2: "POUR" },
    };
    const answers = { scrutin1: "POUR", scrutin2: "POUR" } as Record<string, any>;

    const result1 = computePartyConcordance("party1", answers, partyMajorities);
    expect(result1.concordance).toBe(50); // 1 agree, 1 disagree

    const result2 = computePartyConcordance("party2", answers, partyMajorities);
    expect(result2.concordance).toBe(50); // 1 disagree, 1 agree
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/lib/concordance.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement concordance algorithm**

Create `lib/concordance.ts`:
```typescript
import type { UserAnswer, VotePosition } from "./types";

type PairResult = "agree" | "disagree" | "partial" | "skip";

export function classifyVotePair(
  userAnswer: UserAnswer | string,
  politicianVote: VotePosition | string
): PairResult {
  if (userAnswer === "SKIP") return "skip";
  if (politicianVote === "ABSENT" || politicianVote === "NON_VOTANT") return "skip";

  if (userAnswer === politicianVote) return "agree";

  const active = ["POUR", "CONTRE"];
  if (active.includes(userAnswer) && active.includes(politicianVote)) {
    return "disagree";
  }

  return "partial";
}

interface ConcordanceResult {
  concordance: number;
  agree: number;
  disagree: number;
  partial: number;
}

export function computePoliticianConcordance(
  politicianId: string,
  answers: Record<string, string>,
  voteMatrix: Record<string, Record<string, string>>
): ConcordanceResult {
  let agree = 0;
  let disagree = 0;
  let partial = 0;

  for (const [scrutinId, userAnswer] of Object.entries(answers)) {
    const politicianVote = voteMatrix[scrutinId]?.[politicianId];
    if (!politicianVote) continue;

    const result = classifyVotePair(userAnswer, politicianVote);
    if (result === "agree") agree++;
    else if (result === "disagree") disagree++;
    else if (result === "partial") partial++;
    // skip: don't count
  }

  const total = agree + disagree + partial;
  const concordance = total === 0 ? -1 : Math.round((agree / total) * 100);

  return { concordance, agree, disagree, partial };
}

export function computePartyConcordance(
  partyId: string,
  answers: Record<string, string>,
  partyMajorities: Record<string, Record<string, string>>
): ConcordanceResult {
  let agree = 0;
  let disagree = 0;
  let partial = 0;

  for (const [scrutinId, userAnswer] of Object.entries(answers)) {
    const partyPosition = partyMajorities[scrutinId]?.[partyId];
    if (!partyPosition) continue;

    const result = classifyVotePair(userAnswer, partyPosition);
    if (result === "agree") agree++;
    else if (result === "disagree") disagree++;
    else if (result === "partial") partial++;
  }

  const total = agree + disagree + partial;
  const concordance = total === 0 ? -1 : Math.round((agree / total) * 100);

  return { concordance, agree, disagree, partial };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/lib/concordance.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add lib/concordance.ts __tests__/lib/concordance.test.ts
git commit -m "feat: implement concordance algorithm with politician and party support"
```

---

### Task 4: Compass Positioning Algorithm

**Files:**
- Create: `lib/compass.ts`
- Test: `__tests__/lib/compass.test.ts`

- [ ] **Step 1: Write compass tests**

Create `__tests__/lib/compass.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { computeAxisPosition, computeCompassPosition } from "@/lib/compass";

describe("computeAxisPosition", () => {
  const polarities = { s1: 1, s2: 1, s3: -1 } as Record<string, 1 | -1>;

  it("returns +1 when all votes align with positive polarity", () => {
    const answers = { s1: "POUR", s2: "POUR", s3: "CONTRE" } as Record<string, any>;
    const result = computeAxisPosition(answers, ["s1", "s2", "s3"], polarities);
    expect(result.score).toBe(1);
    expect(result.valid).toBe(true);
  });

  it("returns -1 when all votes oppose polarity", () => {
    const answers = { s1: "CONTRE", s2: "CONTRE", s3: "POUR" } as Record<string, any>;
    const result = computeAxisPosition(answers, ["s1", "s2", "s3"], polarities);
    expect(result.score).toBe(-1);
    expect(result.valid).toBe(true);
  });

  it("returns 0 for mixed or all abstention", () => {
    const answers = { s1: "ABSTENTION", s2: "ABSTENTION", s3: "ABSTENTION" } as Record<string, any>;
    const result = computeAxisPosition(answers, ["s1", "s2", "s3"], polarities);
    expect(result.score).toBe(0);
  });

  it("ignores skipped questions and marks invalid when fewer than 3 answers", () => {
    const answers = { s1: "POUR", s2: "SKIP", s3: "SKIP" } as Record<string, any>;
    const result = computeAxisPosition(answers, ["s1", "s2", "s3"], polarities);
    expect(result.score).toBe(1); // only s1 counts, polarity +1, POUR = +1
    expect(result.answeredCount).toBe(1);
    expect(result.valid).toBe(false); // only 1 answer, below MIN_ANSWERS_PER_AXIS = 3
  });

  it("returns valid when 3+ answers", () => {
    const answers = { s1: "POUR", s2: "CONTRE", s3: "POUR" } as Record<string, any>;
    const result = computeAxisPosition(answers, ["s1", "s2", "s3"], polarities);
    expect(result.valid).toBe(true);
  });
});

describe("computeCompassPosition", () => {
  const axes = {
    economy: {
      scrutinIds: ["e1", "e2"],
      polarities: { e1: 1, e2: 1 } as Record<string, 1 | -1>,
    },
    society: {
      scrutinIds: ["s1", "s2"],
      polarities: { s1: 1, s2: -1 } as Record<string, 1 | -1>,
    },
  };

  it("computes both axes from user answers", () => {
    const answers = { e1: "POUR", e2: "POUR", s1: "POUR", s2: "CONTRE" } as Record<string, any>;
    const result = computeCompassPosition(answers, axes);
    expect(result.x).toBe(1); // economy: both aligned
    expect(result.y).toBe(1); // society: both aligned
  });

  it("marks axis invalid when insufficient answers", () => {
    const answers = { e1: "POUR", s1: "SKIP", s2: "SKIP" } as Record<string, any>;
    const result = computeCompassPosition(answers, axes);
    expect(result.xValid).toBe(false); // only 1 economy answer
    expect(result.yValid).toBe(false); // 0 society answers
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/lib/compass.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement compass algorithm**

Create `lib/compass.ts`:
```typescript
import type { CompassPosition } from "./types";

const MIN_ANSWERS_PER_AXIS = 3;

interface AxisResult {
  score: number;
  valid: boolean;
  answeredCount: number;
}

export function computeAxisPosition(
  answers: Record<string, string>,
  scrutinIds: string[],
  polarities: Record<string, 1 | -1>
): AxisResult {
  let sum = 0;
  let count = 0;

  for (const scrutinId of scrutinIds) {
    const answer = answers[scrutinId];
    if (!answer || answer === "SKIP") continue;

    const polarity = polarities[scrutinId];
    if (polarity === undefined) continue;

    let score: number;
    if (answer === "POUR") score = polarity;
    else if (answer === "CONTRE") score = -polarity;
    else score = 0; // ABSTENTION

    sum += score;
    count++;
  }

  const avgScore = count === 0 ? 0 : sum / count;
  const clamped = Math.max(-1, Math.min(1, avgScore));

  return {
    score: clamped,
    valid: count >= MIN_ANSWERS_PER_AXIS,
    answeredCount: count,
  };
}

export function computeCompassPosition(
  answers: Record<string, string>,
  axes: {
    economy: { scrutinIds: string[]; polarities: Record<string, 1 | -1> };
    society: { scrutinIds: string[]; polarities: Record<string, 1 | -1> };
  }
): CompassPosition {
  const economyResult = computeAxisPosition(
    answers,
    axes.economy.scrutinIds,
    axes.economy.polarities
  );
  const societyResult = computeAxisPosition(
    answers,
    axes.society.scrutinIds,
    axes.society.polarities
  );

  return {
    x: economyResult.score,
    y: societyResult.score,
    xValid: economyResult.valid,
    yValid: societyResult.valid,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/lib/compass.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add lib/compass.ts __tests__/lib/compass.test.ts
git commit -m "feat: implement 2D compass positioning algorithm"
```

---

### Task 5: Seed Data + Theme Labels

**Files:**
- Create: `data/scrutins.json`
- Create: `lib/theme-labels.ts`

- [ ] **Step 1: Create seed scrutins config**

Create `data/scrutins.json` with 5 placeholder entries for development (real IDs to be filled editorially before launch):

```json
[
  {
    "scrutinId": "PLACEHOLDER_1",
    "order": 1,
    "tier": "essential",
    "axis": "society",
    "polarity": 1,
    "theme": "INSTITUTIONS",
    "question": "Faut-il passer au scrutin proportionnel pour les élections ?"
  },
  {
    "scrutinId": "PLACEHOLDER_2",
    "order": 2,
    "tier": "essential",
    "axis": "economy",
    "polarity": -1,
    "theme": "ECONOMIE_BUDGET",
    "question": "Faut-il baisser les impôts sur les entreprises ?"
  },
  {
    "scrutinId": "PLACEHOLDER_3",
    "order": 3,
    "tier": "essential",
    "axis": "society",
    "polarity": -1,
    "theme": "SECURITE_JUSTICE",
    "question": "Faut-il renforcer les peines pour les récidivistes ?"
  },
  {
    "scrutinId": "PLACEHOLDER_4",
    "order": 4,
    "tier": "essential",
    "axis": "economy",
    "polarity": 1,
    "theme": "SOCIAL_TRAVAIL",
    "question": "Faut-il augmenter le salaire minimum ?"
  },
  {
    "scrutinId": "PLACEHOLDER_5",
    "order": 5,
    "tier": "essential",
    "axis": "society",
    "polarity": 1,
    "theme": "IMMIGRATION",
    "question": "Faut-il faciliter la régularisation des sans-papiers ?"
  }
]
```

- [ ] **Step 2: Create theme labels**

Create `lib/theme-labels.ts`:
```typescript
export const THEME_LABELS: Record<string, { label: string; color: string }> = {
  ECONOMIE_BUDGET: { label: "Économie", color: "#f59e0b" },
  SOCIAL_TRAVAIL: { label: "Social", color: "#ec4899" },
  SECURITE_JUSTICE: { label: "Sécurité", color: "#ef4444" },
  ENVIRONNEMENT_ENERGIE: { label: "Environnement", color: "#10b981" },
  SANTE: { label: "Santé", color: "#06b6d4" },
  EDUCATION_CULTURE: { label: "Éducation", color: "#8b5cf6" },
  INSTITUTIONS: { label: "Institutions", color: "#6366f1" },
  AFFAIRES_ETRANGERES_DEFENSE: { label: "Défense", color: "#475569" },
  NUMERIQUE_TECH: { label: "Numérique", color: "#0ea5e9" },
  IMMIGRATION: { label: "Immigration", color: "#d946ef" },
  AGRICULTURE_ALIMENTATION: { label: "Agriculture", color: "#84cc16" },
  LOGEMENT_URBANISME: { label: "Logement", color: "#f97316" },
  TRANSPORTS: { label: "Transports", color: "#14b8a6" },
};

export const AXIS_LABELS = {
  economy: {
    name: "Économie",
    negative: "Intervention de l'État",
    positive: "Libéralisme économique",
  },
  society: {
    name: "Société",
    negative: "Conservateur",
    positive: "Progressiste",
  },
};

export function getQuadrantLabel(x: number, y: number): string {
  const xLabel = x >= 0 ? AXIS_LABELS.economy.positive : AXIS_LABELS.economy.negative;
  const yLabel = y >= 0 ? AXIS_LABELS.society.positive : AXIS_LABELS.society.negative;
  return `${yLabel}, ${xLabel.toLowerCase()}`;
}
```

- [ ] **Step 3: Commit**

```bash
git add data/scrutins.json lib/theme-labels.ts
git commit -m "feat: add seed scrutins config and theme labels"
```

---

### Task 6: Zustand Store

**Files:**
- Create: `lib/store.ts`

- [ ] **Step 1: Implement quiz store**

Create `lib/store.ts`:
```typescript
import { create } from "zustand";
import type { QuizPack, ComputeResult, UserAnswer, CompassPosition } from "./types";

interface QuizState {
  // Quiz pack from API
  quizPack: QuizPack | null;
  setQuizPack: (pack: QuizPack) => void;

  // User answers: scrutinId -> answer
  answers: Record<string, UserAnswer>;
  setAnswer: (scrutinId: string, answer: UserAnswer) => void;
  clearAnswers: () => void;

  // Quiz progress
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  phase: "essential" | "refine";
  setPhase: (phase: "essential" | "refine") => void;

  // Results
  results: ComputeResult | null;
  setResults: (results: ComputeResult) => void;
  partyPositions: Record<string, CompassPosition> | null;
  setPartyPositions: (positions: Record<string, CompassPosition>) => void;

  // Share
  shareId: string | null;
  setShareId: (id: string) => void;
  showPartiesOnShare: boolean;
  toggleShowPartiesOnShare: () => void;

  // Reset
  reset: () => void;
}

const initialState = {
  quizPack: null,
  answers: {},
  currentIndex: 0,
  phase: "essential" as const,
  results: null,
  partyPositions: null,
  shareId: null,
  showPartiesOnShare: false,
};

export const useQuizStore = create<QuizState>((set) => ({
  ...initialState,

  setQuizPack: (pack) => set({ quizPack: pack }),

  setAnswer: (scrutinId, answer) =>
    set((state) => ({
      answers: { ...state.answers, [scrutinId]: answer },
    })),
  clearAnswers: () => set({ answers: {} }),

  setCurrentIndex: (index) => set({ currentIndex: index }),
  setPhase: (phase) => set({ phase, currentIndex: 0 }),

  setResults: (results) => set({ results }),
  setPartyPositions: (positions) => set({ partyPositions: positions }),

  setShareId: (id) => set({ shareId: id }),
  toggleShowPartiesOnShare: () =>
    set((state) => ({ showPartiesOnShare: !state.showPartiesOnShare })),

  reset: () => set(initialState),
}));
```

- [ ] **Step 2: Commit**

```bash
git add lib/store.ts
git commit -m "feat: add Zustand quiz store"
```

---

## Chunk 2: Backend API

### Task 7: Quiz Pack API

**Files:**
- Create: `app/api/quiz-pack+api.ts`

- [ ] **Step 1: Create shared quiz-pack data loader**

Create `lib/quiz-pack-loader.ts`:
```typescript
import scrutinsConfig from "@/data/scrutins.json";
import type { QuizPack } from "./types";

let cachedQuizPack: QuizPack | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function loadQuizPackData(): Promise<QuizPack> {
  const now = Date.now();
  if (cachedQuizPack && now - cacheTimestamp < CACHE_TTL) {
    return cachedQuizPack;
  }

  // Build quiz pack from config + synced data
  // TODO: replace with actual synced data from Vercel KV once cron is implemented
  const questions = scrutinsConfig
    .sort((a, b) => a.order - b.order)
    .map((s) => ({
      scrutinId: s.scrutinId,
      question: s.question,
      theme: s.theme,
      tier: s.tier as "essential" | "refine",
      order: s.order,
      votingDate: "", // filled by sync
      chamber: "AN", // filled by sync
    }));

  const axes = {
    economy: {
      scrutinIds: scrutinsConfig.filter((s) => s.axis === "economy").map((s) => s.scrutinId),
      polarities: Object.fromEntries(
        scrutinsConfig.filter((s) => s.axis === "economy").map((s) => [s.scrutinId, s.polarity])
      ) as Record<string, 1 | -1>,
    },
    society: {
      scrutinIds: scrutinsConfig.filter((s) => s.axis === "society").map((s) => s.scrutinId),
      polarities: Object.fromEntries(
        scrutinsConfig.filter((s) => s.axis === "society").map((s) => [s.scrutinId, s.polarity])
      ) as Record<string, 1 | -1>,
    },
  };

  const quizPack: QuizPack = {
    questions,
    voteMatrix: {}, // populated by sync cron
    politicians: [], // populated by sync cron
    parties: [], // populated by sync cron
    partyMajorities: {}, // populated by sync cron
    axes,
    generatedAt: new Date().toISOString(),
  };

  cachedQuizPack = quizPack;
  cacheTimestamp = now;

  return quizPack;
}

export function invalidateCache() {
  cachedQuizPack = null;
  cacheTimestamp = 0;
}
```

- [ ] **Step 2: Implement quiz-pack endpoint**

Create `app/api/quiz-pack+api.ts`:
```typescript
import scrutinsConfig from "@/data/scrutins.json";
import { loadQuizPackData } from "@/lib/quiz-pack-loader";
import type { QuizPack } from "@/lib/types";

export async function GET(request: Request) {
  const quizPack = await loadQuizPackData();

  return Response.json(quizPack, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" },
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/quiz-pack-loader.ts app/api/quiz-pack+api.ts
git commit -m "feat: add quiz-pack data loader and API endpoint"
```

---

### Task 8: Compute API

**Files:**
- Create: `app/api/compute+api.ts`

- [ ] **Step 1: Implement compute endpoint**

Create `app/api/compute+api.ts`:
```typescript
import { ComputeRequestSchema } from "@/lib/schemas";
import { computePoliticianConcordance, computePartyConcordance } from "@/lib/concordance";
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

  // Load quiz pack data directly (shared loader, no self-fetch)
  const quizPack = await loadQuizPackData();

  // Compute politician concordances
  const politicianResults: ConcordanceEntry[] = quizPack.politicians
    .map((pol) => {
      const { concordance, agree, disagree, partial } = computePoliticianConcordance(
        pol.id,
        answers,
        quizPack.voteMatrix
      );
      return {
        id: pol.id,
        name: pol.fullName,
        slug: pol.slug,
        photoUrl: pol.photoUrl,
        partyShortName: pol.partyShortName,
        concordance,
        agree,
        disagree,
        partial,
      };
    })
    .filter((r) => r.concordance >= 0)
    .sort((a, b) => b.concordance - a.concordance);

  // Compute party concordances
  const partyResults: ConcordanceEntry[] = quizPack.parties
    .map((party) => {
      const { concordance, agree, disagree, partial } = computePartyConcordance(
        party.id,
        answers,
        quizPack.partyMajorities
      );
      return {
        id: party.id,
        name: party.name,
        slug: undefined,
        photoUrl: null,
        partyShortName: party.shortName,
        concordance,
        agree,
        disagree,
        partial,
      };
    })
    .filter((r) => r.concordance >= 0)
    .sort((a, b) => b.concordance - a.concordance);

  // Compute compass position
  const position = computeCompassPosition(answers, quizPack.axes);

  const answeredCount = Object.values(answers).filter((a) => a !== "SKIP").length;

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
```

- [ ] **Step 2: Commit**

```bash
git add app/api/compute+api.ts
git commit -m "feat: add compute API endpoint for concordance calculation"
```

---

### Task 9: Share + OG Image API

**Files:**
- Create: `app/api/share/[id]+api.ts`
- Create: `app/api/og/[id]+api.ts`

- [ ] **Step 1: Implement share endpoint**

Create `app/api/share/[id]+api.ts`:
```typescript
export async function GET(request: Request, { id }: Record<string, string>) {
  // TODO: fetch from Vercel KV
  // const result = await kv.get(`share:${id}`);

  // Placeholder response
  return Response.json(
    { error: "Share result not found" },
    { status: 404 }
  );
}
```

- [ ] **Step 2: Implement OG image endpoint**

Create `app/api/og/[id]+api.ts`:
```typescript
// This endpoint will use @vercel/og to generate OG images.
// @vercel/og only works in Vercel Edge Functions.
// For now, return a placeholder. Implementation requires Vercel deployment.

export async function GET(request: Request, { id }: Record<string, string>) {
  // TODO: implement with @vercel/og after Vercel deployment
  // import { ImageResponse } from "@vercel/og";
  // return new ImageResponse(<CompassOGImage position={...} />, { width: 1200, height: 630 });

  return Response.json(
    { error: "OG image generation requires Vercel deployment" },
    { status: 501 }
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/share/[id]+api.ts app/api/og/[id]+api.ts
git commit -m "feat: add share and OG image API endpoints (stubs)"
```

---

### Task 10: Cron Sync Endpoint

**Files:**
- Create: `app/api/cron/sync+api.ts`

- [ ] **Step 1: Implement sync cron**

Create `app/api/cron/sync+api.ts`:
```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add app/api/cron/sync+api.ts
git commit -m "feat: add Poligraph sync cron endpoint"
```

---

## Chunk 3: App Screens

### Task 11: Home Screen

**Files:**
- Create: `app/index.tsx` (replace placeholder)

- [ ] **Step 1: Implement home screen**

Update `app/index.tsx`:
```tsx
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuizStore } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const reset = useQuizStore((s) => s.reset);

  function handleStart() {
    reset();
    router.push("/quiz");
  }

  return (
    <SafeAreaView className="flex-1 bg-indigo-950">
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-5xl mb-4">🧭</Text>
        <Text className="text-3xl font-bold text-white text-center">
          Ma Boussole{"\n"}Politique
        </Text>
        <Text className="text-sm text-indigo-400 mt-1">par Poligraph</Text>
        <Text className="text-base text-indigo-300 text-center mt-4 leading-6">
          Découvrez quels élus votent comme vous
        </Text>

        <Pressable
          onPress={handleStart}
          accessibilityRole="button"
          accessibilityLabel="Commencer le quiz"
          className="mt-10 bg-amber-500 px-10 py-4 rounded-full active:bg-amber-600"
          style={{ minHeight: 48 }}
        >
          <Text className="text-lg font-bold text-indigo-950">
            Commencer
          </Text>
        </Pressable>

        <Text className="text-sm text-indigo-400 mt-4">
          2 minutes · 10 questions
        </Text>

        <Text className="text-xs text-indigo-600 mt-16 text-center">
          Basé sur les votes réels au Parlement{"\n"}
          Données Poligraph · Association Sankofa
        </Text>
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Verify screen renders**

Run: `npx expo start --web`
Navigate to `http://localhost:8081`. Expected: Dark indigo screen with title, CTA button.

- [ ] **Step 3: Commit**

```bash
git add app/index.tsx
git commit -m "feat: implement home screen with hero and CTA"
```

---

### Task 12: Quiz Screen

**Files:**
- Create: `app/quiz.tsx`
- Create: `components/QuizCard.tsx`
- Create: `components/ProgressBar.tsx`
- Create: `components/ThemeBadge.tsx`

- [ ] **Step 1: Create ThemeBadge component**

Create `components/ThemeBadge.tsx`:
```tsx
import { View, Text } from "react-native";
import { THEME_LABELS } from "@/lib/theme-labels";

export function ThemeBadge({ theme }: { theme: string }) {
  const config = THEME_LABELS[theme] || { label: theme, color: "#6366f1" };

  return (
    <View
      className="self-start px-3 py-1 rounded-full"
      style={{ backgroundColor: config.color + "20" }}
    >
      <Text className="text-xs font-semibold" style={{ color: config.color }}>
        {config.label}
      </Text>
    </View>
  );
}
```

- [ ] **Step 2: Create ProgressBar component**

Create `components/ProgressBar.tsx`:
```tsx
import { View, Text } from "react-native";

interface Props {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: Props) {
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <View className="flex-row items-center gap-3">
      <View className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
        <View
          className="h-full bg-indigo-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </View>
      <Text className="text-sm text-gray-400">
        {current}/{total}
      </Text>
    </View>
  );
}
```

- [ ] **Step 3: Create QuizCard component**

Create `components/QuizCard.tsx`:
```tsx
import { View, Text, Pressable } from "react-native";
import Animated, {
  FadeInRight,
  FadeOutLeft,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { ThemeBadge } from "./ThemeBadge";
import type { QuizQuestion, UserAnswer } from "@/lib/types";

interface Props {
  question: QuizQuestion;
  onAnswer: (answer: UserAnswer) => void;
}

const SWIPE_THRESHOLD = 100;

const BUTTONS: { answer: UserAnswer; label: string; className: string }[] = [
  { answer: "POUR", label: "Pour", className: "bg-emerald-500 active:bg-emerald-600" },
  { answer: "CONTRE", label: "Contre", className: "bg-red-500 active:bg-red-600" },
  { answer: "ABSTENTION", label: "Sans avis", className: "bg-gray-200 active:bg-gray-300" },
];

export function QuizCard({ question, onAnswer }: Props) {
  const translateX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        runOnJS(onAnswer)("POUR");
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        runOnJS(onAnswer)("CONTRE");
      }
      translateX.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        entering={FadeInRight.duration(300)}
        exiting={FadeOutLeft.duration(200)}
        style={animatedStyle}
        className="flex-1 px-6 pt-4 pb-8"
      >
        <ThemeBadge theme={question.theme} />

        <Text className="text-xl font-bold text-gray-900 mt-4 leading-7">
          {question.question}
        </Text>

        <Text className="text-sm text-gray-400 mt-2">
          {question.chamber === "AN" ? "Voté à l'Assemblée nationale" : "Voté au Sénat"}
          {question.votingDate ? ` le ${question.votingDate}` : ""}
        </Text>

        <View className="mt-auto gap-3">
          {BUTTONS.map(({ answer, label, className }) => (
            <Pressable
              key={answer}
              onPress={() => onAnswer(answer)}
              accessibilityRole="button"
              accessibilityLabel={label}
              className={`py-4 rounded-xl items-center ${className}`}
              style={{ minHeight: 48 }}
            >
              <Text
                className={`text-base font-bold ${answer === "ABSTENTION" ? "text-gray-500" : "text-white"}`}
              >
                {label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => onAnswer("SKIP")}
            accessibilityRole="button"
            accessibilityLabel="Passer cette question"
            className="py-2 items-center"
          >
            <Text className="text-sm text-gray-400">Passer</Text>
          </Pressable>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}
```

- [ ] **Step 4: Implement quiz screen**

Create `app/quiz.tsx`:
```tsx
import { View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useQuizStore } from "@/lib/store";
import { QuizCard } from "@/components/QuizCard";
import { ProgressBar } from "@/components/ProgressBar";
import type { QuizPack, UserAnswer } from "@/lib/types";
import { computeCompassPosition } from "@/lib/compass";
import { computePoliticianConcordance, computePartyConcordance } from "@/lib/concordance";

export default function Quiz() {
  const router = useRouter();
  const {
    answers,
    setAnswer,
    currentIndex,
    setCurrentIndex,
    phase,
    quizPack,
    setQuizPack,
    setResults,
    setPartyPositions,
  } = useQuizStore();

  const { data, isLoading } = useQuery<QuizPack>({
    queryKey: ["quiz-pack"],
    queryFn: async () => {
      const res = await fetch("/api/quiz-pack");
      return res.json();
    },
    staleTime: 24 * 60 * 60 * 1000,
  });

  // Store quiz pack when loaded
  if (data && !quizPack) {
    setQuizPack(data);
  }

  const pack = quizPack || data;
  if (isLoading || !pack) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <View className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </SafeAreaView>
    );
  }

  const questions = pack.questions.filter((q) =>
    phase === "essential" ? q.tier === "essential" : q.tier === "refine"
  );
  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) {
    // Quiz complete: compute results locally
    const position = computeCompassPosition(answers, pack.axes);

    const politicians = pack.politicians
      .map((pol) => {
        const r = computePoliticianConcordance(pol.id, answers, pack.voteMatrix);
        return { id: pol.id, name: pol.fullName, slug: pol.slug, photoUrl: pol.photoUrl, partyShortName: pol.partyShortName, ...r };
      })
      .filter((r) => r.concordance >= 0)
      .sort((a, b) => b.concordance - a.concordance);

    const parties = pack.parties
      .map((party) => {
        const r = computePartyConcordance(party.id, answers, pack.partyMajorities);
        return { id: party.id, name: party.name, partyShortName: party.shortName, photoUrl: null, ...r };
      })
      .filter((r) => r.concordance >= 0)
      .sort((a, b) => b.concordance - a.concordance);

    const answeredCount = Object.values(answers).filter((a) => a !== "SKIP").length;

    // Compute party compass positions (same algo applied to party majority votes)
    const partyPos: Record<string, any> = {};
    for (const party of pack.parties) {
      const partyVotes: Record<string, string> = {};
      for (const [scrutinId, partyVotesMap] of Object.entries(pack.partyMajorities)) {
        const pos = (partyVotesMap as Record<string, string>)[party.id];
        if (pos) partyVotes[scrutinId] = pos;
      }
      partyPos[party.id] = computeCompassPosition(partyVotes, pack.axes);
    }

    setResults({
      position,
      politicians,
      parties,
      answeredCount,
      totalQuestions: questions.length,
    });
    setPartyPositions(partyPos);

    // Fire-and-forget: store result on server for shareable link
    fetch("/api/compute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.shareId) useQuizStore.getState().setShareId(data.shareId);
      })
      .catch(() => {}); // sharing is optional, don't block on failure

    router.replace("/results");
    return null;
  }

  function handleAnswer(answer: UserAnswer) {
    setAnswer(currentQuestion.scrutinId, answer);
    setCurrentIndex(currentIndex + 1);
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-4">
        <ProgressBar current={currentIndex + 1} total={questions.length} />
      </View>
      <QuizCard
        key={currentQuestion.scrutinId}
        question={currentQuestion}
        onAnswer={handleAnswer}
      />
    </SafeAreaView>
  );
}
```

- [ ] **Step 5: Verify quiz flow**

Run: `npx expo start --web`
Navigate to home, tap "Commencer". Expected: quiz questions appear with progress bar, answer buttons work.

- [ ] **Step 6: Commit**

```bash
git add app/quiz.tsx components/QuizCard.tsx components/ProgressBar.tsx components/ThemeBadge.tsx
git commit -m "feat: implement quiz screen with swipable cards and progress bar"
```

---

### Task 13: Compass Component

**Files:**
- Create: `components/Compass.tsx`

- [ ] **Step 1: Implement compass visualization**

Create `components/Compass.tsx`:
```tsx
import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle, Line, Text as SvgText } from "react-native-svg";
import Animated, { FadeIn, useSharedValue, useAnimatedProps, withSpring } from "react-native-reanimated";
import { AXIS_LABELS } from "@/lib/theme-labels";
import type { CompassPosition, ConcordanceEntry } from "@/lib/types";

const SIZE = 300;
const PADDING = 40;
const CENTER = SIZE / 2;
const RADIUS = (SIZE - PADDING * 2) / 2;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  userPosition: CompassPosition;
  parties: ConcordanceEntry[];
  partyPositions?: Record<string, CompassPosition>;
}

function toPixel(value: number, axis: "x" | "y"): number {
  if (axis === "x") return CENTER + value * RADIUS;
  return CENTER - value * RADIUS; // Y is inverted in SVG
}

export function Compass({ userPosition, parties, partyPositions }: Props) {
  // Spring animation for user dot
  const userCx = useSharedValue(CENTER);
  const userCy = useSharedValue(CENTER);
  const userR = useSharedValue(0);

  React.useEffect(() => {
    if (userPosition.xValid && userPosition.yValid) {
      userCx.value = withSpring(toPixel(userPosition.x, "x"), { damping: 12 });
      userCy.value = withSpring(toPixel(userPosition.y, "y"), { damping: 12 });
      userR.value = withSpring(10, { damping: 8 });
    }
  }, [userPosition]);

  const animatedUserDot = useAnimatedProps(() => ({
    cx: userCx.value,
    cy: userCy.value,
    r: userR.value,
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      className="items-center"
      accessible
      accessibilityLabel={`Boussole politique. Votre position : économie ${userPosition.x.toFixed(1)}, société ${userPosition.y.toFixed(1)}`}
    >
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Grid lines */}
        <Line x1={PADDING} y1={CENTER} x2={SIZE - PADDING} y2={CENTER} stroke="#e2e8f0" strokeWidth={1} />
        <Line x1={CENTER} y1={PADDING} x2={CENTER} y2={SIZE - PADDING} stroke="#e2e8f0" strokeWidth={1} />

        {/* Axis labels */}
        <SvgText x={CENTER} y={PADDING - 8} textAnchor="middle" fontSize={10} fill="#94a3b8">
          {AXIS_LABELS.society.positive}
        </SvgText>
        <SvgText x={CENTER} y={SIZE - PADDING + 16} textAnchor="middle" fontSize={10} fill="#94a3b8">
          {AXIS_LABELS.society.negative}
        </SvgText>
        <SvgText x={PADDING - 4} y={CENTER + 4} textAnchor="end" fontSize={10} fill="#94a3b8">
          {AXIS_LABELS.economy.negative}
        </SvgText>
        <SvgText x={SIZE - PADDING + 4} y={CENTER + 4} textAnchor="start" fontSize={10} fill="#94a3b8">
          {AXIS_LABELS.economy.positive}
        </SvgText>

        {/* Party dots */}
        {partyPositions &&
          parties.map((party) => {
            const pos = partyPositions[party.id];
            if (!pos) return null;
            return (
              <Circle
                key={party.id}
                cx={toPixel(pos.x, "x")}
                cy={toPixel(pos.y, "y")}
                r={12}
                fill="#6366f1"
                opacity={0.2}
              />
            );
          })}

        {/* Party labels */}
        {partyPositions &&
          parties.slice(0, 8).map((party) => {
            const pos = partyPositions[party.id];
            if (!pos) return null;
            return (
              <SvgText
                key={`label-${party.id}`}
                x={toPixel(pos.x, "x")}
                y={toPixel(pos.y, "y") + 4}
                textAnchor="middle"
                fontSize={8}
                fill="#6366f1"
                opacity={0.6}
              >
                {party.partyShortName}
              </SvgText>
            );
          })}

        {/* User dot (spring animated) */}
        {userPosition.xValid && userPosition.yValid && (
          <AnimatedCircle
            animatedProps={animatedUserDot}
            fill="#6366f1"
            stroke="white"
            strokeWidth={3}
          />
        )}
      </Svg>
    </Animated.View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/Compass.tsx
git commit -m "feat: implement 2D compass SVG visualization"
```

---

### Task 14: Results Screen

**Files:**
- Create: `app/results.tsx`
- Create: `components/RankingList.tsx`
- Create: `components/RankingItem.tsx`

- [ ] **Step 1: Create RankingItem component**

Create `components/RankingItem.tsx`:
```tsx
import { View, Text, Pressable, Linking } from "react-native";
import type { ConcordanceEntry } from "@/lib/types";

interface Props {
  entry: ConcordanceEntry;
  rank: number;
}

function getConcordanceColor(value: number): string {
  if (value >= 60) return "#10b981";
  if (value >= 40) return "#f59e0b";
  return "#ef4444";
}

export function RankingItem({ entry, rank }: Props) {
  const color = getConcordanceColor(entry.concordance);

  function handlePress() {
    if (entry.slug) {
      Linking.openURL(`https://poligraph.fr/politiques/${entry.slug}`);
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      className={`flex-row items-center gap-3 px-4 py-3 rounded-xl ${rank === 1 ? "bg-emerald-50" : "bg-gray-50"}`}
    >
      <Text className="text-base font-bold text-gray-400 w-6 text-center">
        {rank}
      </Text>
      <View className="w-8 h-8 bg-gray-200 rounded-full" />
      <View className="flex-1">
        <Text className="text-sm font-bold text-gray-900">{entry.name}</Text>
        {entry.partyShortName && (
          <Text className="text-xs text-gray-400">{entry.partyShortName}</Text>
        )}
      </View>
      <Text className="text-base font-bold" style={{ color }}>
        {entry.concordance}%
      </Text>
    </Pressable>
  );
}
```

- [ ] **Step 2: Create RankingList component**

Create `components/RankingList.tsx`:
```tsx
import { useState } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { RankingItem } from "./RankingItem";
import type { ConcordanceEntry } from "@/lib/types";

interface Props {
  politicians: ConcordanceEntry[];
  parties: ConcordanceEntry[];
}

export function RankingList({ politicians, parties }: Props) {
  const [tab, setTab] = useState<"politicians" | "parties">("politicians");
  const data = tab === "politicians" ? politicians : parties;

  return (
    <View className="mt-6">
      <Text className="text-lg font-bold text-gray-900 px-6 mb-3">
        Les élus qui votent comme vous
      </Text>

      <View className="flex-row border-b-2 border-gray-200 mx-6 mb-4">
        <Pressable
          onPress={() => setTab("politicians")}
          className={`pb-2 mr-6 ${tab === "politicians" ? "border-b-2 border-indigo-500" : ""}`}
        >
          <Text className={`text-sm font-semibold ${tab === "politicians" ? "text-indigo-500" : "text-gray-400"}`}>
            Élus
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab("parties")}
          className={`pb-2 ${tab === "parties" ? "border-b-2 border-indigo-500" : ""}`}
        >
          <Text className={`text-sm font-semibold ${tab === "parties" ? "text-indigo-500" : "text-gray-400"}`}>
            Partis
          </Text>
        </Pressable>
      </View>

      <View className="px-6 gap-2">
        {data.slice(0, 20).map((entry, index) => (
          <RankingItem key={entry.id} entry={entry} rank={index + 1} />
        ))}
      </View>
    </View>
  );
}
```

- [ ] **Step 3: Implement results screen**

Create `app/results.tsx`:
```tsx
import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuizStore } from "@/lib/store";
import { Compass } from "@/components/Compass";
import { RankingList } from "@/components/RankingList";
import { getQuadrantLabel } from "@/lib/theme-labels";

export default function Results() {
  const router = useRouter();
  const { results, phase, partyPositions } = useQuizStore();

  if (!results) {
    router.replace("/");
    return null;
  }

  const { position, politicians, parties, answeredCount } = results;
  const hasValidPosition = position.xValid && position.yValid;
  const quadrantLabel = hasValidPosition
    ? getQuadrantLabel(position.x, position.y)
    : null;

  function handleRefine() {
    router.push("/refine");
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerClassName="pb-12">
        <View className="px-6 pt-6">
          <Text className="text-2xl font-bold text-gray-900">
            Votre position
          </Text>
          <Text className="text-sm text-gray-400 mt-1">
            D'après vos réponses à {answeredCount} votes réels
          </Text>
        </View>

        {/* Compass */}
        <View className="mt-6 items-center">
          {hasValidPosition ? (
            <Compass userPosition={position} parties={parties} partyPositions={partyPositions ?? undefined} />
          ) : (
            <View className="h-48 items-center justify-center">
              <Text className="text-gray-400 text-center px-8">
                Pas assez de réponses pour afficher la boussole.{"\n"}
                Répondez à plus de questions pour voir votre position.
              </Text>
            </View>
          )}
        </View>

        {/* Quadrant label */}
        {quadrantLabel && (
          <View className="mx-6 mt-4 p-4 bg-indigo-50 rounded-xl">
            <Text className="text-sm text-indigo-700 text-center">
              Vous êtes plutôt{" "}
              <Text className="font-bold">{quadrantLabel}</Text>
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View className="flex-row gap-3 mx-6 mt-6">
          <Pressable
            onPress={() => router.push("/share")}
            className="flex-1 py-3 bg-indigo-500 rounded-xl items-center active:bg-indigo-600"
          >
            <Text className="text-white font-bold">Partager</Text>
          </Pressable>
          {phase === "essential" && (
            <Pressable
              onPress={handleRefine}
              className="flex-1 py-3 bg-gray-100 rounded-xl items-center border border-gray-200 active:bg-gray-200"
            >
              <Text className="text-gray-700 font-bold">Affiner ↓</Text>
            </Pressable>
          )}
        </View>

        {/* Ranking */}
        <RankingList politicians={politicians} parties={parties} />
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 4: Verify results flow**

Run: `npx expo start --web`
Complete the quiz. Expected: compass displays with quadrant label, ranking list with tabs.

- [ ] **Step 5: Commit**

```bash
git add app/results.tsx components/RankingList.tsx components/RankingItem.tsx
git commit -m "feat: implement results screen with compass and ranking"
```

---

### Task 14b: Refine Transition Screen (Écran 5)

**Files:**
- Create: `app/refine.tsx`

- [ ] **Step 1: Implement refine transition screen**

Create `app/refine.tsx`:
```tsx
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuizStore } from "@/lib/store";

export default function Refine() {
  const router = useRouter();
  const setPhase = useQuizStore((s) => s.setPhase);

  function handleContinue() {
    setPhase("refine");
    router.push("/quiz");
  }

  function handleSkip() {
    router.push("/share");
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-5xl mb-6">🎯</Text>
        <Text className="text-2xl font-bold text-gray-900 text-center">
          Affiner votre position
        </Text>
        <Text className="text-base text-gray-500 text-center mt-4 leading-6">
          15 questions supplémentaires pour un résultat plus précis
        </Text>
        <Text className="text-sm text-gray-400 mt-2">
          Environ 4 minutes
        </Text>

        <Pressable
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityLabel="Continuer avec les questions supplémentaires"
          className="mt-10 bg-indigo-500 px-10 py-4 rounded-full active:bg-indigo-600"
          style={{ minHeight: 48 }}
        >
          <Text className="text-lg font-bold text-white">Continuer</Text>
        </Pressable>

        <Pressable
          onPress={handleSkip}
          accessibilityRole="button"
          className="mt-4 py-3"
        >
          <Text className="text-sm text-gray-400">Non merci, partager mes résultats</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/refine.tsx
git commit -m "feat: add refine transition screen"
```

---

### Task 15: Share Screen

**Files:**
- Create: `app/share.tsx`
- Create: `components/SharePreview.tsx`

- [ ] **Step 1: Create SharePreview component**

Create `components/SharePreview.tsx`:
```tsx
import React from "react";
import { View, Text, Switch } from "react-native";
import { Compass } from "./Compass";
import { useQuizStore } from "@/lib/store";

interface Props {
  captureRef?: React.RefObject<View>;
}

export function SharePreview({ captureRef }: Props) {
  const { results, showPartiesOnShare, toggleShowPartiesOnShare, partyPositions } = useQuizStore();

  if (!results) return null;

  return (
    <View className="mx-6">
      {/* Preview card (captured by view-shot) */}
      <View ref={captureRef} collapsable={false} className="bg-indigo-950 rounded-2xl p-6 items-center">
        <Text className="text-sm text-indigo-300 mb-4">Ma Boussole Politique</Text>
        <Compass
          userPosition={results.position}
          parties={showPartiesOnShare ? results.parties : []}
          partyPositions={showPartiesOnShare ? (partyPositions ?? undefined) : undefined}
        />
        <Text className="text-white text-center mt-4 font-bold text-lg">
          Et toi, tu es où ?
        </Text>
        <Text className="text-indigo-400 text-xs mt-2">
          D'après les votes réels des élus
        </Text>
      </View>

      {/* Toggle parties */}
      <View className="flex-row items-center justify-between mt-4 px-2">
        <Text className="text-sm text-gray-600">Afficher les partis proches</Text>
        <Switch
          value={showPartiesOnShare}
          onValueChange={toggleShowPartiesOnShare}
          trackColor={{ false: "#e2e8f0", true: "#818cf8" }}
          thumbColor={showPartiesOnShare ? "#6366f1" : "#f4f4f5"}
        />
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Implement share screen**

Create `app/share.tsx`:
```tsx
import { useRef } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { useQuizStore } from "@/lib/store";
import { SharePreview } from "@/components/SharePreview";
import * as Clipboard from "expo-clipboard";

export default function ShareScreen() {
  const router = useRouter();
  const { shareId, reset } = useQuizStore();
  const shareUrl = shareId ? `https://boussole.poligraph.fr/r/${shareId}` : null;
  const previewRef = useRef<View>(null);

  async function handleShare() {
    try {
      // Capture preview as PNG image
      const uri = await captureRef(previewRef, { format: "png", quality: 1 });
      // Share via native share sheet
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Partager ma boussole politique",
      });
    } catch (error) {
      // Fallback to text share if image capture fails
      const { Share } = require("react-native");
      await Share.share({
        message: shareUrl
          ? `Découvre ma position politique ! ${shareUrl}`
          : "Découvre ta position politique sur Ma Boussole Politique !",
      });
    }
  }

  async function handleCopyLink() {
    if (shareUrl) {
      await Clipboard.setStringAsync(shareUrl);
      Alert.alert("Lien copié !");
    }
  }

  function handleRestart() {
    reset();
    router.replace("/");
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 pt-6">
        <SharePreview captureRef={previewRef} />

        <View className="mx-6 mt-8 gap-3">
          <Pressable
            onPress={handleShare}
            className="py-4 bg-gray-900 rounded-xl items-center active:bg-gray-800"
          >
            <Text className="text-white font-bold">Partager l'image</Text>
          </Pressable>

          {shareUrl && (
            <Pressable
              onPress={handleCopyLink}
              className="py-4 bg-gray-100 rounded-xl items-center active:bg-gray-200"
            >
              <Text className="text-gray-700 font-bold">Copier le lien</Text>
            </Pressable>
          )}

          <Pressable
            onPress={handleRestart}
            className="py-3 items-center"
          >
            <Text className="text-gray-400">Recommencer</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: Install expo-clipboard**

Run: `npx expo install expo-clipboard`

- [ ] **Step 4: Verify share flow**

Run: `npx expo start --web`
Complete quiz, navigate to share. Expected: preview card with toggle, share buttons.

- [ ] **Step 5: Commit**

```bash
git add app/share.tsx components/SharePreview.tsx
git commit -m "feat: implement share screen with preview and party toggle"
```

---

### Task 16: Shared Result Web Page

**Files:**
- Create: `app/r/[id].tsx`

- [ ] **Step 1: Implement shared result page**

Create `app/r/[id].tsx`:
```tsx
import { View, Text, Pressable, Linking } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Compass } from "@/components/Compass";
import type { ShareResult } from "@/lib/types";

export default function SharedResult() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading, error } = useQuery<ShareResult>({
    queryKey: ["share", id],
    queryFn: async () => {
      const res = await fetch(`/api/share/${id}`);
      if (!res.ok) throw new Error("Result not found");
      return res.json();
    },
  });

  function handleStartQuiz() {
    Linking.openURL("https://boussole.poligraph.fr");
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-indigo-950 items-center justify-center">
        <Text className="text-indigo-300">Chargement...</Text>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView className="flex-1 bg-indigo-950 items-center justify-center px-8">
        <Text className="text-white text-xl font-bold text-center">
          Ce résultat n'existe plus
        </Text>
        <Pressable
          onPress={handleStartQuiz}
          className="mt-6 bg-amber-500 px-8 py-3 rounded-full"
        >
          <Text className="font-bold text-indigo-950">Faire le quiz</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-xl font-bold text-gray-900 mb-6">
          Résultat partagé
        </Text>
        <Compass
          userPosition={data.position}
          parties={data.showParties && data.topParty ? [data.topParty] : []}
        />
        <Text className="text-gray-500 mt-4 text-center">
          D'après {data.answeredCount} votes réels au Parlement
        </Text>
        <Pressable
          onPress={handleStartQuiz}
          className="mt-8 bg-indigo-500 px-8 py-4 rounded-full active:bg-indigo-600"
        >
          <Text className="text-white font-bold text-base">
            Et toi, tu es où ? Fais le test →
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/r/[id].tsx
git commit -m "feat: implement shared result page with CTA"
```

---

### Task 17: Question Generation Script

**Files:**
- Create: `scripts/generate-questions.ts`

- [ ] **Step 1: Implement generation script**

Create `scripts/generate-questions.ts`:
```typescript
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
```

- [ ] **Step 2: Add npm script**

Add to `package.json` scripts: `"generate:questions": "npx tsx scripts/generate-questions.ts"`

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-questions.ts
git commit -m "feat: add question generation script using Mistral Small 4"
```

---

### Task 18: Final Wiring + Verification

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass (schemas, concordance, compass)

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Verify full flow on web**

Run: `npx expo start --web`
1. Home screen loads (<1s), shows "Ma Boussole Politique" + "par Poligraph"
2. "Commencer" navigates to quiz
3. Answer 5 placeholder questions (verify swipe gesture works on mobile/touch)
4. Results screen shows compass with quadrant label + ranking with "Élus"/"Partis" tabs
5. "Affiner" navigates to refine transition screen with "15 questions supplémentaires"
6. "Partager" navigates to share screen
7. Share preview renders with "Afficher les partis proches" toggle
8. "Partager l'image" triggers native share sheet
9. Navigate to `/r/test-id` to verify shared result page renders (should show 404/error state)

- [ ] **Step 4: Verify accessibility basics**

Check on web:
1. All buttons have accessible labels (inspect DOM for aria-label)
2. Compass SVG has accessible description
3. Answer buttons have minimum 48px touch target

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: wire all screens and verify full quiz flow"
```

- [ ] **Step 5: Tag v0.1.0**

```bash
git tag v0.1.0
```
