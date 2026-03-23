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

Uses **Wilson score lower bound** (binomial proportion confidence interval) for ranking politicians/parties by agreement with user answers. This is the same approach Reddit uses for comment ranking.

Key parameters:
- `MIN_OVERLAP_RATIO = 0.4` : dynamic minimum overlap threshold (40% of answered questions)
- `DEFAULT_MIN_OVERLAP = 5` : absolute minimum regardless of quiz length
- Wilson z = 1.64 (90% confidence interval)

### Known biases

1. **Opposition bias**: extremes (far-left, far-right) both vote CONTRE on government bills for opposite reasons, creating false concordance matches
2. **Text vs idea gap**: deputies vote on legal texts (with amendments, articles), not on abstract ideas. A CONTRE vote may mean "not enough" rather than "disagree". Questions must be carefully curated to account for this.
3. **Coverage bias**: deputies absent on many votes produce unreliable concordances from sparse data. Wilson score handles this naturally.

### Scrutin curation rules

Only include scrutins where POUR/CONTRE clearly maps to an ideological position. Exclude:
- Procedural/technical votes
- Budget amendments with complex trade-offs
- Texts where major parties voted CONTRE for opposing reasons

## Commands

```bash
npm run dev          # Start Expo dev server
npm run sync         # Export vote data from politic-tracker (requires DB access)
npx vitest run       # Run tests
```

## Git

- Never include "Co-Authored-By" lines mentioning Claude or Anthropic
- Never mention AI assistants in commit messages
