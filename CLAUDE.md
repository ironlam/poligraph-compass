# Ma Boussole Politique

## Project

Mobile-first political compass app (Expo/React Native) that matches French citizens with elected officials based on real parliamentary votes. Deployed under poligraph.fr.

## Stack

- Expo SDK 55, React Native 0.83, Expo Router (file-based routing)
- NativeWind v4 + Tailwind CSS v3 (NOT v4)
- Zustand (state), TanStack Query (data fetching)
- react-native-svg (compass visualization)
- Vitest (testing)

## Architecture

- Concordance computation happens **client-side** in `app/quiz.tsx`, NOT via the API
- `POST /api/compute` is fire-and-forget for shareId only
- Any change to concordance logic must update BOTH `app/quiz.tsx` AND `app/api/compute+api.ts`
- Vote data is exported from politic-tracker via Prisma script, stored in `data/synced-data.json` (gitignored)

## Concordance Algorithm

Three layers work together to produce reliable rankings:

### 1. Discriminating power weights

Each scrutin is weighted by how well it separates left from right parties.
Computed from `partyMajorities` at runtime via `computeScrutinWeights()`.

- `weight = |leftPourRatio - rightPourRatio|`
- Left parties: LFI, PCF, EELV, PS
- Right parties: LR, RN
- Center parties (RE, MoDem, HOR) are excluded from the calculation

Examples:
- Unanimous vote (everyone POUR): weight = 0 (no signal)
- Clear left-right split: weight = 1 (maximum signal)
- Opposition convergence (LFI and RN both CONTRE): weight ~ 0.3

### 2. Wilson score lower bound

Ranking uses the Wilson confidence interval (Edwin Wilson, 1927) on weighted counts.
Same approach Reddit uses for comment ranking.

- `score = wilsonScore(weightedAgree, weightedPartial, weightedTotal) * 100`
- Partial votes (ABSTENTION matches) count as half agreement
- z = 1.64 (90% confidence interval)
- Naturally penalizes matches based on sparse data

### 3. Dynamic minimum overlap

- `minOverlap = max(5, ceil(totalAnswered * 0.4))`
- Filters results with too few comparable votes (concordance = -1)

### Display

- Main number: Wilson score (confidence-adjusted, used for ranking)
- Secondary: raw concordance % + vote count (for transparency)

### Known biases (mitigated)

1. **Opposition bias**: extremes (far-left, far-right) both vote CONTRE on government bills for opposite reasons. **Mitigated** by discriminating power weights.
2. **Text vs idea gap**: deputies vote on legal texts (with amendments, articles), not abstract ideas. A CONTRE vote may mean "not enough" rather than "disagree". **Mitigated** by question curation and audit script.
3. **Coverage bias**: deputies absent on many votes produce unreliable concordances. **Mitigated** by Wilson score + dynamic MIN_OVERLAP.

### Scrutin curation rules

Only include scrutins where POUR/CONTRE clearly maps to an ideological position. Exclude:
- Procedural/technical votes
- Budget amendments with complex trade-offs
- Texts where major parties voted CONTRE for opposing reasons
- Run `scripts/audit-scrutins.ts` (via Mistral) to evaluate each scrutin

## Commands

```bash
npm run dev          # Start Expo dev server
npm run sync         # Export vote data from politic-tracker (requires DB access)
npx vitest run       # Run tests
npx tsx scripts/audit-scrutins.ts   # Audit scrutins via Mistral (needs .env)
```

## Git

- Never include "Co-Authored-By" lines mentioning Claude or Anthropic
- Never mention AI assistants in commit messages
