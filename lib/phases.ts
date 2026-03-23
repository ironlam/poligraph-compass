export const PHASE_ORDER = [
  "core",
  "refine-1",
  "refine-2",
  "refine-3",
] as const;

export type Phase = (typeof PHASE_ORDER)[number];

export const PHASES = PHASE_ORDER;

const PHASE_CONFIG: Record<Phase, { label: string | null; duration: number }> =
  {
    core: { label: null, duration: 20 },
    "refine-1": { label: "Affiner (10 questions, 2 min)", duration: 10 },
    "refine-2": { label: "Encore plus précis (10 questions)", duration: 10 },
    "refine-3": { label: "Dernière série (10 questions)", duration: 10 },
  };

export function getNextPhase(current: Phase): Phase | null {
  const idx = PHASE_ORDER.indexOf(current);
  return idx < PHASE_ORDER.length - 1 ? PHASE_ORDER[idx + 1] : null;
}

export function getPhaseLabel(phase: Phase): string | null {
  return PHASE_CONFIG[phase].label;
}

export function getPhaseDuration(phase: Phase): number {
  return PHASE_CONFIG[phase].duration;
}

export function getCompletedPhases(current: Phase): Phase[] {
  const idx = PHASE_ORDER.indexOf(current);
  return PHASE_ORDER.slice(0, idx) as unknown as Phase[];
}
