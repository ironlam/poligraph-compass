# UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the austere prototype into a bold, credible, educational political compass app.

**Architecture:** Four progressive chunks: (1) ranking visual overhaul with photos and party colors, (2) new politician detail screen with per-theme breakdown, (3) quiz and compass polish, (4) share card and educational bottom sheet. Each chunk is independently deployable and adds visible value.

**Tech Stack:** Expo/React Native, NativeWind v4 + Tailwind CSS v3, react-native-reanimated, react-native-gesture-handler, react-native-svg

---

## File Structure

### Modified files
- `lib/schemas.ts` — add partyColor field to ConcordanceEntry
- `app/quiz.tsx` — pass partyColor during computation
- `app/api/compute+api.ts` — pass partyColor in server computation
- `components/RankingItem.tsx` — full redesign with photos, party accent, concordance bar
- `components/RankingList.tsx` — hero card for #1, improved tabs
- `components/QuizCard.tsx` — answer feedback animation
- `components/Compass.tsx` — colored quadrant zones
- `components/ProgressBar.tsx` — colored dot indicators
- `components/SharePreview.tsx` — bold redesign with gradient and top 3 parties
- `data/scrutins.json` — add context fields per scrutin

### New files
- `components/HeroCard.tsx` — large card for #1 match
- `components/ConcordanceBar.tsx` — reusable horizontal concordance bar
- `components/VoteBadge.tsx` — colored POUR/CONTRE/ABSTENTION badge
- `components/ThemeBreakdown.tsx` — per-theme concordance bars
- `components/VoteComparison.tsx` — single vote comparison row
- `components/ScrutinBottomSheet.tsx` — educational bottom sheet for quiz
- `lib/theme-concordance.ts` — per-theme concordance computation
- `__tests__/lib/theme-concordance.test.ts` — tests for per-theme computation
- `app/politician/[id].tsx` — politician detail screen

---

## Chunk 1: Ranking Visual Overhaul

### Task 1: Add partyColor to ConcordanceEntry

The `ConcordanceEntry` type currently lacks party color. The `Party` schema has a `color` field, but it's not passed through to results.

**Files:**
- Modify: `lib/schemas.ts:71-83`
- Modify: `app/quiz.tsx:70-76` (politician mapping)
- Modify: `app/quiz.tsx:78-84` (party mapping)
- Modify: `app/api/compute+api.ts:32-42` (politician mapping)
- Modify: `app/api/compute+api.ts:48-58` (party mapping)

- [ ] **Step 1: Add partyColor to ConcordanceEntrySchema**

In `lib/schemas.ts`, add `partyColor` to ConcordanceEntrySchema:

```typescript
export const ConcordanceEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().optional(),
  photoUrl: z.string().nullable().optional(),
  partyShortName: z.string().nullable().optional(),
  partyColor: z.string().nullable().optional(),  // NEW
  concordance: z.number().min(0).max(100),
  score: z.number().min(0).max(100),
  agree: z.number(),
  disagree: z.number(),
  partial: z.number(),
  overlap: z.number(),
});
```

- [ ] **Step 2: Pass partyColor in quiz.tsx politician mapping**

In `app/quiz.tsx`, the politician mapping around line 70-76. Add partyColor by looking up the party:

```typescript
const politicians = pack.politicians
  .map((pol) => {
    const r = computePoliticianConcordance(pol.id, answers, pack.voteMatrix, minOverlap, weights);
    const party = pack.parties.find((p) => p.id === pol.partyId);
    return {
      id: pol.id,
      name: pol.fullName,
      slug: pol.slug,
      photoUrl: pol.photoUrl,
      partyShortName: pol.partyShortName,
      partyColor: party?.color ?? null,
      ...r,
    };
  })
```

- [ ] **Step 3: Pass partyColor in quiz.tsx party mapping**

In `app/quiz.tsx`, the party mapping around line 78-84:

```typescript
const parties = pack.parties
  .map((party) => {
    const r = computePartyConcordance(party.id, answers, pack.partyMajorities, minOverlap, weights);
    return {
      id: party.id,
      name: party.name,
      partyShortName: party.shortName,
      partyColor: party.color ?? null,
      photoUrl: null,
      ...r,
    };
  })
```

- [ ] **Step 4: Mirror changes in compute+api.ts**

Same changes in `app/api/compute+api.ts` for both politician (line 32-42) and party (line 48-58) mappings.

- [ ] **Step 5: Run tests**

Run: `npx vitest run`
Expected: All existing tests pass (schema change is additive/optional)

- [ ] **Step 6: Commit**

```bash
git add lib/schemas.ts app/quiz.tsx app/api/compute+api.ts
git commit -m "feat: add partyColor to concordance entries"
```

---

### Task 2: ConcordanceBar component

A reusable horizontal bar showing the concordance score visually.

**Files:**
- Create: `components/ConcordanceBar.tsx`

- [ ] **Step 1: Create ConcordanceBar**

```tsx
import { View } from "react-native";

interface Props {
  score: number; // 0-100
  color: string;
  height?: number;
}

export function ConcordanceBar({ score, color, height = 4 }: Props) {
  return (
    <View
      className="w-full rounded-full overflow-hidden bg-gray-200"
      style={{ height }}
    >
      <View
        className="h-full rounded-full"
        style={{ width: `${score}%`, backgroundColor: color }}
      />
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ConcordanceBar.tsx
git commit -m "feat: add ConcordanceBar component"
```

---

### Task 3: Redesign RankingItem

Replace the austere listing with photos, party color accent, and concordance bar.

**Files:**
- Modify: `components/RankingItem.tsx` (full rewrite)

- [ ] **Step 1: Rewrite RankingItem**

```tsx
import { View, Text, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { ConcordanceBar } from "./ConcordanceBar";
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
  const router = useRouter();
  const color = getConcordanceColor(entry.score);
  const partyColor = entry.partyColor || "#9ca3af";

  function handlePress() {
    if (entry.slug) {
      router.push(`/politician/${entry.id}`);
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 active:bg-gray-100"
      style={{ borderLeftWidth: 3, borderLeftColor: partyColor }}
    >
      <Text className="text-sm font-extrabold text-gray-300 w-6 text-center">
        {rank}
      </Text>

      {entry.photoUrl ? (
        <Image
          source={{ uri: entry.photoUrl }}
          className="w-10 h-10 rounded-full"
          style={{ borderWidth: 2, borderColor: partyColor }}
        />
      ) : (
        <View
          className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center"
          style={{ borderWidth: 2, borderColor: partyColor }}
        >
          <Text className="text-xs text-gray-400">
            {entry.name.charAt(0)}
          </Text>
        </View>
      )}

      <View className="flex-1">
        <Text className="text-sm font-bold text-gray-900">{entry.name}</Text>
        {entry.partyShortName && (
          <Text className="text-xs font-semibold" style={{ color: partyColor }}>
            {entry.partyShortName}
          </Text>
        )}
        <View className="mt-1">
          <ConcordanceBar score={entry.score} color={color} />
        </View>
      </View>

      <View className="items-end">
        <Text className="text-lg font-extrabold" style={{ color }}>
          {entry.score}%
        </Text>
        <Text className="text-xs text-gray-400">
          {entry.overlap} votes
        </Text>
      </View>
    </Pressable>
  );
}
```

- [ ] **Step 2: Verify visually**

Run: `npm run dev`
Navigate to results. Check that:
- Photos appear (or initial letter fallback)
- Party color shows as left border and photo border
- Concordance bar renders below the name
- Tapping navigates to politician detail (will 404 until Task 6, that's OK)

- [ ] **Step 3: Commit**

```bash
git add components/RankingItem.tsx
git commit -m "feat: redesign RankingItem with photos, party colors, concordance bars"
```

---

### Task 4: HeroCard for #1 match

The top match gets a larger, more prominent card.

**Files:**
- Create: `components/HeroCard.tsx`
- Modify: `components/RankingList.tsx`

- [ ] **Step 1: Create HeroCard**

```tsx
import { View, Text, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { ConcordanceBar } from "./ConcordanceBar";
import type { ConcordanceEntry } from "@/lib/types";

interface Props {
  entry: ConcordanceEntry;
}

function getConcordanceColor(value: number): string {
  if (value >= 60) return "#10b981";
  if (value >= 40) return "#f59e0b";
  return "#ef4444";
}

export function HeroCard({ entry }: Props) {
  const router = useRouter();
  const color = getConcordanceColor(entry.score);
  const partyColor = entry.partyColor || "#9ca3af";

  function handlePress() {
    if (entry.slug) {
      router.push(`/politician/${entry.id}`);
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      className="rounded-2xl bg-gray-50 p-5 active:bg-gray-100"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: partyColor,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      <View className="flex-row items-center gap-4">
        {entry.photoUrl ? (
          <Image
            source={{ uri: entry.photoUrl }}
            className="w-16 h-16 rounded-full"
            style={{ borderWidth: 3, borderColor: partyColor }}
          />
        ) : (
          <View
            className="w-16 h-16 rounded-full bg-gray-200 items-center justify-center"
            style={{ borderWidth: 3, borderColor: partyColor }}
          >
            <Text className="text-lg text-gray-400 font-bold">
              {entry.name.charAt(0)}
            </Text>
          </View>
        )}

        <View className="flex-1">
          <View className="flex-row items-baseline gap-2">
            <Text className="text-base font-extrabold text-gray-900">
              {entry.name}
            </Text>
          </View>
          {entry.partyShortName && (
            <Text className="text-sm font-semibold mt-0.5" style={{ color: partyColor }}>
              {entry.partyShortName}
            </Text>
          )}
          <Text className="text-xs text-gray-400 mt-1">
            D'accord sur {entry.agree} votes sur {entry.overlap}
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-2xl font-extrabold" style={{ color }}>
            {entry.score}%
          </Text>
        </View>
      </View>

      <View className="mt-3">
        <ConcordanceBar score={entry.score} color={color} height={6} />
      </View>
    </Pressable>
  );
}
```

- [ ] **Step 2: Update RankingList to use HeroCard for #1**

Rewrite `components/RankingList.tsx`:

```tsx
import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { HeroCard } from "./HeroCard";
import { RankingItem } from "./RankingItem";
import type { ConcordanceEntry } from "@/lib/types";

interface Props {
  politicians: ConcordanceEntry[];
  parties: ConcordanceEntry[];
}

export function RankingList({ politicians, parties }: Props) {
  const [tab, setTab] = useState<"politicians" | "parties">("politicians");
  const data = tab === "politicians" ? politicians : parties;
  const [first, ...rest] = data;

  return (
    <View className="mt-8">
      <Text className="text-xl font-extrabold text-gray-900 px-6 mb-4">
        Les élus qui votent comme vous
      </Text>

      {/* Tabs */}
      <View className="flex-row mx-6 mb-5 gap-4">
        <Pressable onPress={() => setTab("politicians")}>
          <Text
            className={`text-sm font-bold pb-2 ${
              tab === "politicians"
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-400"
            }`}
          >
            Élus
          </Text>
        </Pressable>
        <Pressable onPress={() => setTab("parties")}>
          <Text
            className={`text-sm font-bold pb-2 ${
              tab === "parties"
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-400"
            }`}
          >
            Partis
          </Text>
        </Pressable>
      </View>

      {data.length === 0 ? (
        <View className="px-6 py-8 items-center">
          <Text className="text-gray-400 text-sm text-center">
            Données non disponibles.{"\n"}
            Les résultats apparaîtront après synchronisation.
          </Text>
        </View>
      ) : (
        <View className="px-6 gap-2">
          {first && <HeroCard entry={first} />}
          {rest.slice(0, 19).map((entry, index) => (
            <RankingItem key={entry.id} entry={entry} rank={index + 2} />
          ))}
        </View>
      )}
    </View>
  );
}
```

- [ ] **Step 3: Verify visually**

Check results page: #1 should appear as a large card with bigger photo, the rest as compact items.

- [ ] **Step 4: Commit**

```bash
git add components/HeroCard.tsx components/RankingList.tsx
git commit -m "feat: add hero card for #1 match, improve tab styling"
```

---

## Chunk 2: Politician Detail Screen

### Task 5: Per-theme concordance utility

Compute concordance breakdown by theme (Economy, Society, Security...).

**Files:**
- Create: `lib/theme-concordance.ts`
- Create: `__tests__/lib/theme-concordance.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// __tests__/lib/theme-concordance.test.ts
import { describe, it, expect } from "vitest";
import { computeThemeConcordances } from "@/lib/theme-concordance";

describe("computeThemeConcordances", () => {
  const questions = [
    { scrutinId: "s1", theme: "ECONOMIE_BUDGET" },
    { scrutinId: "s2", theme: "ECONOMIE_BUDGET" },
    { scrutinId: "s3", theme: "SECURITE_JUSTICE" },
    { scrutinId: "s4", theme: "SANTE" },
  ];

  const userAnswers: Record<string, string> = {
    s1: "POUR", s2: "CONTRE", s3: "POUR", s4: "POUR",
  };

  const voteMatrix: Record<string, Record<string, string>> = {
    s1: { pol1: "POUR" },   // agree
    s2: { pol1: "CONTRE" }, // agree
    s3: { pol1: "CONTRE" }, // disagree
    s4: { pol1: "POUR" },   // agree
  };

  it("groups concordance by theme", () => {
    const result = computeThemeConcordances("pol1", userAnswers, voteMatrix, questions);
    expect(result).toHaveLength(3);
  });

  it("computes correct percentage per theme", () => {
    const result = computeThemeConcordances("pol1", userAnswers, voteMatrix, questions);
    const economy = result.find((t) => t.theme === "ECONOMIE_BUDGET");
    expect(economy?.agree).toBe(2);
    expect(economy?.total).toBe(2);
    expect(economy?.percentage).toBe(100);
  });

  it("handles themes with disagreements", () => {
    const result = computeThemeConcordances("pol1", userAnswers, voteMatrix, questions);
    const security = result.find((t) => t.theme === "SECURITE_JUSTICE");
    expect(security?.agree).toBe(0);
    expect(security?.total).toBe(1);
    expect(security?.percentage).toBe(0);
  });

  it("skips scrutins where politician has no vote", () => {
    const sparse: Record<string, Record<string, string>> = {
      s1: { pol1: "POUR" },
      // s2, s3, s4 missing
    };
    const result = computeThemeConcordances("pol1", userAnswers, sparse, questions);
    expect(result.find((t) => t.theme === "ECONOMIE_BUDGET")?.total).toBe(1);
  });

  it("sorts by total votes descending", () => {
    const result = computeThemeConcordances("pol1", userAnswers, voteMatrix, questions);
    expect(result[0].total).toBeGreaterThanOrEqual(result[result.length - 1].total);
  });

  it("skips SKIP answers", () => {
    const withSkip = { ...userAnswers, s1: "SKIP" };
    const result = computeThemeConcordances("pol1", withSkip, voteMatrix, questions);
    const economy = result.find((t) => t.theme === "ECONOMIE_BUDGET");
    expect(economy?.total).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/lib/theme-concordance.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement theme-concordance.ts**

```typescript
// lib/theme-concordance.ts
import { classifyVotePair } from "./concordance";

interface ThemeConcordance {
  theme: string;
  agree: number;
  disagree: number;
  partial: number;
  total: number;
  percentage: number;
}

export function computeThemeConcordances(
  politicianId: string,
  userAnswers: Record<string, string>,
  voteMatrix: Record<string, Record<string, string>>,
  questions: Array<{ scrutinId: string; theme: string }>
): ThemeConcordance[] {
  const byTheme = new Map<string, { agree: number; disagree: number; partial: number }>();

  for (const q of questions) {
    const userAnswer = userAnswers[q.scrutinId];
    if (!userAnswer || userAnswer === "SKIP") continue;

    const politicianVote = voteMatrix[q.scrutinId]?.[politicianId];
    if (!politicianVote) continue;

    const result = classifyVotePair(userAnswer, politicianVote);
    if (result === "skip") continue;

    if (!byTheme.has(q.theme)) {
      byTheme.set(q.theme, { agree: 0, disagree: 0, partial: 0 });
    }
    const counts = byTheme.get(q.theme)!;

    if (result === "agree") counts.agree++;
    else if (result === "disagree") counts.disagree++;
    else if (result === "partial") counts.partial++;
  }

  return Array.from(byTheme.entries())
    .map(([theme, counts]) => {
      const total = counts.agree + counts.disagree + counts.partial;
      const percentage = total > 0 ? Math.round((counts.agree / total) * 100) : 0;
      return { theme, ...counts, total, percentage };
    })
    .sort((a, b) => b.total - a.total);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/lib/theme-concordance.test.ts`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/theme-concordance.ts __tests__/lib/theme-concordance.test.ts
git commit -m "feat: add per-theme concordance computation"
```

---

### Task 6: VoteBadge and VoteComparison components

Small reusable components for the detail screen.

**Files:**
- Create: `components/VoteBadge.tsx`
- Create: `components/VoteComparison.tsx`

- [ ] **Step 1: Create VoteBadge**

```tsx
import { View, Text } from "react-native";

const VOTE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  POUR: { label: "Pour", bg: "bg-emerald-100", text: "text-emerald-700" },
  CONTRE: { label: "Contre", bg: "bg-red-100", text: "text-red-700" },
  ABSTENTION: { label: "Abstention", bg: "bg-gray-100", text: "text-gray-500" },
  ABSENT: { label: "Absent", bg: "bg-gray-100", text: "text-gray-400" },
  NON_VOTANT: { label: "Non votant", bg: "bg-gray-100", text: "text-gray-400" },
  SKIP: { label: "Passé", bg: "bg-gray-100", text: "text-gray-400" },
};

export function VoteBadge({ vote }: { vote: string }) {
  const config = VOTE_CONFIG[vote] || VOTE_CONFIG.ABSENT;
  return (
    <View className={`px-2 py-0.5 rounded ${config.bg}`}>
      <Text className={`text-xs font-semibold ${config.text}`}>
        {config.label}
      </Text>
    </View>
  );
}
```

- [ ] **Step 2: Create VoteComparison**

```tsx
import { View, Text } from "react-native";
import { VoteBadge } from "./VoteBadge";

interface Props {
  question: string;
  userVote: string;
  politicianVote: string;
  isAgreement: boolean;
}

export function VoteComparison({ question, userVote, politicianVote, isAgreement }: Props) {
  return (
    <View className="py-3 border-b border-gray-100">
      <Text className="text-sm text-gray-900 font-medium mb-2">
        {question}
      </Text>
      <View className="flex-row items-center gap-2">
        <Text className="text-xs text-gray-400 w-10">Vous</Text>
        <VoteBadge vote={userVote} />
        <Text className="text-xs text-gray-300 mx-1">vs</Text>
        <VoteBadge vote={politicianVote} />
        <View className="flex-1" />
        <Text className={`text-sm ${isAgreement ? "text-emerald-500" : "text-red-400"}`}>
          {isAgreement ? "✓" : "✗"}
        </Text>
      </View>
    </View>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/VoteBadge.tsx components/VoteComparison.tsx
git commit -m "feat: add VoteBadge and VoteComparison components"
```

---

### Task 7: ThemeBreakdown component

Per-theme concordance bars for the politician detail screen.

**Files:**
- Create: `components/ThemeBreakdown.tsx`

- [ ] **Step 1: Create ThemeBreakdown**

```tsx
import { View, Text } from "react-native";
import { ConcordanceBar } from "./ConcordanceBar";
import { THEME_LABELS } from "@/lib/theme-labels";

interface ThemeData {
  theme: string;
  agree: number;
  total: number;
  percentage: number;
}

interface Props {
  themes: ThemeData[];
}

function getBarColor(pct: number): string {
  if (pct >= 60) return "#10b981";
  if (pct >= 40) return "#f59e0b";
  return "#ef4444";
}

export function ThemeBreakdown({ themes }: Props) {
  if (themes.length === 0) return null;

  return (
    <View className="gap-3">
      {themes.map((t) => {
        const config = THEME_LABELS[t.theme] || { label: t.theme, color: "#6366f1" };
        return (
          <View key={t.theme}>
            <View className="flex-row justify-between mb-1">
              <Text className="text-sm font-semibold text-gray-700">
                {config.label}
              </Text>
              <Text className="text-sm font-bold" style={{ color: getBarColor(t.percentage) }}>
                {t.percentage}%
              </Text>
            </View>
            <ConcordanceBar score={t.percentage} color={getBarColor(t.percentage)} height={6} />
            <Text className="text-xs text-gray-400 mt-0.5">
              {t.agree}/{t.total} votes
            </Text>
          </View>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ThemeBreakdown.tsx
git commit -m "feat: add ThemeBreakdown component"
```

---

### Task 8: Politician detail screen

The main new screen. Accessible by tapping a politician in the ranking.

**Files:**
- Create: `app/politician/[id].tsx`

- [ ] **Step 1: Create the screen**

```tsx
import { useEffect } from "react";
import { View, Text, ScrollView, Pressable, Image, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuizStore } from "@/lib/store";
import { classifyVotePair } from "@/lib/concordance";
import { computeThemeConcordances } from "@/lib/theme-concordance";
import { ThemeBreakdown } from "@/components/ThemeBreakdown";
import { VoteComparison } from "@/components/VoteComparison";

function getConcordanceColor(value: number): string {
  if (value >= 60) return "#10b981";
  if (value >= 40) return "#f59e0b";
  return "#ef4444";
}

export default function PoliticianDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { results, quizPack, answers } = useQuizStore();

  useEffect(() => {
    if (!results || !quizPack) {
      router.replace("/");
    }
  }, [results, quizPack, router]);

  if (!results || !quizPack || !id) return null;

  const politician = results.politicians.find((p) => p.id === id);
  if (!politician) return null;

  const polData = quizPack.politicians.find((p) => p.id === id);
  const partyColor = politician.partyColor || "#9ca3af";
  const scoreColor = getConcordanceColor(politician.score);

  // Per-theme breakdown
  const themes = computeThemeConcordances(
    id,
    answers as Record<string, string>,
    quizPack.voteMatrix as Record<string, Record<string, string>>,
    quizPack.questions
  );

  // Vote-by-vote comparison
  const comparisons = quizPack.questions
    .filter((q) => {
      const userAnswer = answers[q.scrutinId];
      const polVote = quizPack.voteMatrix[q.scrutinId]?.[id];
      return userAnswer && userAnswer !== "SKIP" && polVote && polVote !== "ABSENT" && polVote !== "NON_VOTANT";
    })
    .map((q) => {
      const userAnswer = answers[q.scrutinId];
      const polVote = quizPack.voteMatrix[q.scrutinId]?.[id];
      const pair = classifyVotePair(userAnswer, polVote);
      return {
        scrutinId: q.scrutinId,
        question: q.question,
        userVote: userAnswer,
        politicianVote: polVote,
        isAgreement: pair === "agree",
      };
    });

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerClassName="pb-16">
        {/* Back button */}
        <Pressable onPress={() => router.back()} className="px-6 pt-4 mb-2">
          <Text className="text-sm text-indigo-500 font-semibold">← Résultats</Text>
        </Pressable>

        {/* Header */}
        <View className="px-6 flex-row items-center gap-4">
          {politician.photoUrl ? (
            <Image
              source={{ uri: politician.photoUrl }}
              className="w-20 h-20 rounded-full"
              style={{ borderWidth: 3, borderColor: partyColor }}
            />
          ) : (
            <View
              className="w-20 h-20 rounded-full bg-gray-200 items-center justify-center"
              style={{ borderWidth: 3, borderColor: partyColor }}
            >
              <Text className="text-2xl text-gray-400 font-bold">
                {politician.name.charAt(0)}
              </Text>
            </View>
          )}
          <View className="flex-1">
            <Text className="text-xl font-extrabold text-gray-900">
              {politician.name}
            </Text>
            {politician.partyShortName && (
              <Text className="text-sm font-bold mt-0.5" style={{ color: partyColor }}>
                {politician.partyShortName}
              </Text>
            )}
          </View>
          <View className="items-center">
            <Text className="text-3xl font-extrabold" style={{ color: scoreColor }}>
              {politician.score}%
            </Text>
            <Text className="text-xs text-gray-400">concordance</Text>
          </View>
        </View>

        {/* Summary */}
        <View className="mx-6 mt-4 p-4 bg-gray-50 rounded-2xl">
          <Text className="text-sm text-gray-700">
            Vous êtes d'accord sur{" "}
            <Text className="font-bold">{politician.agree} votes</Text> sur{" "}
            <Text className="font-bold">{politician.overlap}</Text> en commun.
          </Text>
        </View>

        {/* Theme breakdown */}
        <View className="px-6 mt-6">
          <Text className="text-lg font-extrabold text-gray-900 mb-4">
            Par thème
          </Text>
          <ThemeBreakdown themes={themes} />
        </View>

        {/* Vote by vote */}
        <View className="px-6 mt-8">
          <Text className="text-lg font-extrabold text-gray-900 mb-2">
            Vote par vote
          </Text>
          <Text className="text-xs text-gray-400 mb-4">
            {comparisons.length} votes en commun
          </Text>
          {comparisons.map((c) => (
            <VoteComparison
              key={c.scrutinId}
              question={c.question}
              userVote={c.userVote}
              politicianVote={c.politicianVote}
              isAgreement={c.isAgreement}
            />
          ))}
        </View>

        {/* External link */}
        {polData?.slug && (
          <Pressable
            onPress={() => Linking.openURL(`https://poligraph.fr/politiques/${polData.slug}`)}
            className="mx-6 mt-8 py-3 bg-indigo-500 rounded-2xl items-center active:bg-indigo-600"
          >
            <Text className="text-white font-bold">
              Voir son profil complet sur Poligraph
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Verify visually**

Run the app, complete the quiz, tap on a politician in the ranking. Verify:
- Header shows photo, name, party, score
- Theme breakdown shows bars per theme
- Vote comparison shows each common vote with badges
- Back button returns to results
- "Voir son profil" opens Poligraph

- [ ] **Step 3: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add app/politician/[id].tsx
git commit -m "feat: add politician detail screen with theme breakdown and vote comparison"
```

---

## Chunk 3: Quiz & Compass Polish

### Task 9: Quiz card answer feedback

Flash of color when the user answers.

**Files:**
- Modify: `components/QuizCard.tsx`

- [ ] **Step 1: Add feedback animation**

Replace the QuizCard with version that uses background color flash on answer:

```tsx
import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  FadeInRight,
  FadeOutLeft,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
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

const ANSWER_COLORS: Record<string, string> = {
  POUR: "rgba(16, 185, 129, 0.12)",      // emerald flash
  CONTRE: "rgba(239, 68, 68, 0.12)",      // red flash
  ABSTENTION: "rgba(156, 163, 175, 0.12)", // gray flash
};

const BUTTONS: { answer: UserAnswer; label: string; className: string }[] = [
  { answer: "POUR", label: "Pour", className: "bg-emerald-500 active:bg-emerald-600" },
  { answer: "CONTRE", label: "Contre", className: "bg-red-500 active:bg-red-600" },
  { answer: "ABSTENTION", label: "Sans avis", className: "bg-gray-200 active:bg-gray-300" },
];

export function QuizCard({ question, onAnswer }: Props) {
  const translateX = useSharedValue(0);
  const bgOpacity = useSharedValue(0);
  const [flashColor, setFlashColor] = useState("transparent");

  function handleAnswer(answer: UserAnswer) {
    const color = ANSWER_COLORS[answer] || "transparent";
    setFlashColor(color);
    bgOpacity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(0, { duration: 200 })
    );
    // Delay the actual answer to let the flash show
    setTimeout(() => onAnswer(answer), 200);
  }

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        runOnJS(handleAnswer)("POUR");
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        runOnJS(handleAnswer)("CONTRE");
      }
      translateX.value = withSpring(0);
    });

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedFlashStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        entering={FadeInRight.duration(300)}
        exiting={FadeOutLeft.duration(200)}
        style={animatedCardStyle}
        className="flex-1 px-6 pt-4 pb-8"
      >
        {/* Flash overlay */}
        <Animated.View
          style={[
            animatedFlashStyle,
            {
              ...StyleSheet.absoluteFillObject,
              backgroundColor: flashColor,
              borderRadius: 16,
            },
          ]}
          pointerEvents="none"
        />

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
              onPress={() => handleAnswer(answer)}
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

Note: Add `import { StyleSheet } from "react-native";` to the imports.

- [ ] **Step 2: Verify visually**

Tap Pour/Contre/Sans avis in the quiz. Should see a brief color flash on the card.

- [ ] **Step 3: Commit**

```bash
git add components/QuizCard.tsx
git commit -m "feat: add color flash feedback on quiz answer"
```

---

### Task 10: Compass with colored quadrant zones

Add subtle colored backgrounds to each quadrant.

**Files:**
- Modify: `components/Compass.tsx`

- [ ] **Step 1: Add quadrant rectangles to SVG**

In `components/Compass.tsx`, add four `Rect` elements inside the `<Svg>` before the grid lines:

```tsx
import Svg, { Circle, Line, Rect, Text as SvgText } from "react-native-svg";
```

Add after `<Svg>` opening tag, before grid lines:

```tsx
{/* Quadrant zones */}
<Rect x={PADDING} y={PADDING} width={RADIUS} height={RADIUS} fill="#dbeafe" opacity={0.3} />
<Rect x={CENTER} y={PADDING} width={RADIUS} height={RADIUS} fill="#ede9fe" opacity={0.3} />
<Rect x={PADDING} y={CENTER} width={RADIUS} height={RADIUS} fill="#fef3c7" opacity={0.3} />
<Rect x={CENTER} y={CENTER} width={RADIUS} height={RADIUS} fill="#fce7f3" opacity={0.3} />
```

Colors: top-left (progressive + state) = blue, top-right (progressive + liberal) = purple, bottom-left (conservative + state) = amber, bottom-right (conservative + liberal) = pink.

- [ ] **Step 2: Make axis labels bolder**

Change axis label text size from `text-xs` to `text-xs font-semibold` and color from `text-slate-400` to `text-slate-500`.

- [ ] **Step 3: Verify visually**

Check compass on results page: quadrants should have subtle colored backgrounds. Labels should be more readable.

- [ ] **Step 4: Commit**

```bash
git add components/Compass.tsx
git commit -m "feat: add colored quadrant zones and bolder labels to compass"
```

---

## Chunk 4: Share Card & Education

### Task 11: Share card redesign

Bold gradient, quadrant label, top 3 parties.

**Files:**
- Modify: `components/SharePreview.tsx`

- [ ] **Step 1: Rewrite SharePreview**

```tsx
import React from "react";
import { View, Text, Switch } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Compass } from "./Compass";
import { useQuizStore } from "@/lib/store";
import { getQuadrantLabel } from "@/lib/theme-labels";

interface Props {
  captureRef?: React.RefObject<View | null>;
}

export function SharePreview({ captureRef }: Props) {
  const { results, showPartiesOnShare, toggleShowPartiesOnShare, partyPositions } = useQuizStore();

  if (!results) return null;

  const { position, parties } = results;
  const hasValidPosition = position.xValid && position.yValid;
  const quadrantLabel = hasValidPosition ? getQuadrantLabel(position.x, position.y) : null;
  const topParties = parties.slice(0, 3);

  return (
    <View className="mx-6">
      <View ref={captureRef} collapsable={false} className="rounded-2xl overflow-hidden">
        <LinearGradient
          colors={["#1e1b4b", "#0f0a2e", "#000000"]}
          className="p-6 items-center"
        >
          <Text className="text-sm text-indigo-400 font-semibold mb-4">
            Ma Boussole Politique
          </Text>

          <Compass
            userPosition={position}
            parties={showPartiesOnShare ? parties : []}
            partyPositions={showPartiesOnShare ? (partyPositions ?? undefined) : undefined}
          />

          {quadrantLabel && (
            <Text className="text-white text-center mt-4 font-extrabold text-xl">
              {quadrantLabel}
            </Text>
          )}

          {topParties.length > 0 && (
            <View className="mt-4 gap-1">
              {topParties.map((party, i) => (
                <Text key={party.id} className="text-indigo-300 text-xs text-center">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}{" "}
                  {party.name} ({party.score}%)
                </Text>
              ))}
            </View>
          )}

          <Text className="text-indigo-200 text-center mt-6 font-bold text-lg">
            Et toi, tu es où ?
          </Text>
          <Text className="text-indigo-500 text-xs mt-1">
            poligraph.fr
          </Text>
        </LinearGradient>
      </View>

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

Note: This requires `expo-linear-gradient`. Check if already installed:

```bash
npx expo install expo-linear-gradient
```

- [ ] **Step 2: Verify visually**

Check share screen: should show gradient, quadrant label in bold, and top 3 parties with medals.

- [ ] **Step 3: Commit**

```bash
git add components/SharePreview.tsx package.json
git commit -m "feat: redesign share card with gradient, quadrant label, top 3 parties"
```

---

### Task 12: Enrich scrutins data with context

Add educational context to each scrutin for the bottom sheet.

**Files:**
- Modify: `data/scrutins.json`
- Modify: `lib/schemas.ts` (ScrutinConfigSchema)

- [ ] **Step 1: Add context fields to ScrutinConfigSchema**

In `lib/schemas.ts`, update ScrutinConfigSchema:

```typescript
export const ScrutinConfigSchema = z.object({
  scrutinId: z.string(),
  order: z.number().int().positive(),
  tier: z.enum(["essential", "refine"]),
  axis: z.enum(["economy", "society"]),
  polarity: z.union([z.literal(1), z.literal(-1)]),
  theme: z.string(),
  question: z.string().min(1),
  // Educational context (optional for backward compat)
  officialTitle: z.string().optional(),
  summary: z.string().optional(),
  result: z.enum(["adopte", "rejete"]).optional(),
  voteCount: z.object({
    pour: z.number(),
    contre: z.number(),
    abstention: z.number(),
  }).optional(),
});
```

Also update `QuizQuestionSchema` to include the same optional fields so they are available on the client:

```typescript
export const QuizQuestionSchema = z.object({
  scrutinId: z.string(),
  question: z.string(),
  theme: z.string(),
  tier: z.enum(["essential", "refine"]),
  order: z.number(),
  votingDate: z.string(),
  chamber: z.string(),
  officialTitle: z.string().optional(),
  summary: z.string().optional(),
  result: z.enum(["adopte", "rejete"]).optional(),
  voteCount: z.object({
    pour: z.number(),
    contre: z.number(),
    abstention: z.number(),
  }).optional(),
});
```

- [ ] **Step 2: Add context to first 5 essential scrutins in scrutins.json**

Add `officialTitle`, `summary`, `result`, and `voteCount` fields to the first 5 scrutins. The remaining can be filled in later. Example for scrutin #1:

```json
{
  "scrutinId": "cml2g74m4dv2eijv5yeaef1ml",
  "order": 1,
  "tier": "essential",
  "axis": "economy",
  "polarity": -1,
  "theme": "ECONOMIE_BUDGET",
  "question": "Faut-il nationaliser ArcelorMittal pour préserver la souveraineté industrielle ?",
  "officialTitle": "Proposition de loi visant à la nationalisation d'ArcelorMittal Florange",
  "summary": "Ce texte proposait de nationaliser le site sidérurgique de Florange (Moselle) menacé de fermeture par ArcelorMittal, au nom de la souveraineté industrielle et de l'emploi local.",
  "result": "rejete",
  "voteCount": { "pour": 79, "contre": 262, "abstention": 13 }
}
```

Use data from `data/scrutin-details.json` (already exported from politic-tracker) to fill in the details accurately.

- [ ] **Step 3: Run tests**

Run: `npx vitest run`
Expected: All tests pass (schema changes are optional/additive)

- [ ] **Step 4: Commit**

```bash
git add data/scrutins.json lib/schemas.ts
git commit -m "feat: enrich scrutins with educational context data"
```

---

### Task 13: ScrutinBottomSheet component

Educational bottom sheet triggered from quiz card.

**Files:**
- Create: `components/ScrutinBottomSheet.tsx`
- Modify: `components/QuizCard.tsx` (add "Comprendre ce vote" button)

- [ ] **Step 1: Create ScrutinBottomSheet**

```tsx
import { View, Text, Pressable, Modal } from "react-native";
import { ThemeBadge } from "./ThemeBadge";
import type { QuizQuestion } from "@/lib/types";

interface Props {
  question: QuizQuestion;
  visible: boolean;
  onClose: () => void;
}

export function ScrutinBottomSheet({ question, visible, onClose }: Props) {
  const hasContext = question.officialTitle || question.summary;

  if (!hasContext) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10">
        <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-4" />

        <ThemeBadge theme={question.theme} />

        {question.officialTitle && (
          <Text className="text-base font-extrabold text-gray-900 mt-3">
            {question.officialTitle}
          </Text>
        )}

        {question.summary && (
          <Text className="text-sm text-gray-600 mt-3 leading-5">
            {question.summary}
          </Text>
        )}

        {question.result && (
          <View className="mt-4 flex-row items-center gap-2">
            <View className={`px-3 py-1 rounded-full ${question.result === "adopte" ? "bg-emerald-100" : "bg-red-100"}`}>
              <Text className={`text-xs font-bold ${question.result === "adopte" ? "text-emerald-700" : "text-red-700"}`}>
                {question.result === "adopte" ? "Adopté" : "Rejeté"}
              </Text>
            </View>
            {question.voteCount && (
              <Text className="text-xs text-gray-400">
                {question.voteCount.pour} pour · {question.voteCount.contre} contre · {question.voteCount.abstention} abs.
              </Text>
            )}
          </View>
        )}

        <Pressable
          onPress={onClose}
          className="mt-6 py-3 bg-gray-100 rounded-2xl items-center active:bg-gray-200"
        >
          <Text className="text-sm font-bold text-gray-700">Fermer</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
```

- [ ] **Step 2: Add "Comprendre ce vote" button to QuizCard**

In `components/QuizCard.tsx`, add state for bottom sheet and a button below the question text:

Add to imports:
```tsx
import { ScrutinBottomSheet } from "./ScrutinBottomSheet";
```

Add state inside `QuizCard`:
```tsx
const [showContext, setShowContext] = useState(false);
const hasContext = question.officialTitle || question.summary;
```

Add below the voting date text and above `<View className="mt-auto gap-3">`:
```tsx
{hasContext && (
  <Pressable onPress={() => setShowContext(true)} className="mt-3">
    <Text className="text-sm text-indigo-500 font-semibold">
      Comprendre ce vote →
    </Text>
  </Pressable>
)}

<ScrutinBottomSheet
  question={question}
  visible={showContext}
  onClose={() => setShowContext(false)}
/>
```

- [ ] **Step 3: Verify visually**

In the quiz, for scrutins that have context data, a "Comprendre ce vote" link should appear. Tapping it opens a bottom sheet with the official title, summary, and vote result.

For scrutins without context data, no link appears.

- [ ] **Step 4: Run tests**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add components/ScrutinBottomSheet.tsx components/QuizCard.tsx
git commit -m "feat: add educational bottom sheet for scrutin context in quiz"
```

---

## Verification

After all chunks are complete:

- [ ] Run: `npx vitest run` — all tests pass
- [ ] Run: `npm run dev` — app loads without errors
- [ ] Complete the quiz end-to-end and verify:
  - Quiz cards show color flash on answer
  - Scrutins with context show "Comprendre ce vote" link
  - Results show hero card for #1 with photo
  - Ranking items show photos, party colors, concordance bars
  - Tapping a politician opens the detail screen
  - Detail screen shows theme breakdown and vote-by-vote comparison
  - Share card shows gradient, quadrant label, top 3 parties
  - Compass shows colored quadrant zones
