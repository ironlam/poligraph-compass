// Single source of truth for how a concordance score is presented.
// Colour is always paired with a text label (Proche / Moyen / Éloigné) so the
// meaning never relies on colour alone (colour-blindness, anxiety).

export interface ConcordanceDisplay {
  /** Foreground colour for the score and the bar fill. */
  color: string;
  /** Pale background for the label pill. */
  bg: string;
  /** Human-readable tier label. */
  label: "Proche" | "Moyen" | "Éloigné";
}

export function concordanceDisplay(score: number): ConcordanceDisplay {
  if (score >= 60) return { color: "#0e9f6e", bg: "#e7f7f0", label: "Proche" };
  if (score >= 40) return { color: "#d97706", bg: "#fcf2e2", label: "Moyen" };
  return { color: "#e5484d", bg: "#fdecec", label: "Éloigné" };
}

/** Legend rows for the three concordance tiers, in display order. */
export const CONCORDANCE_LEGEND: Array<ConcordanceDisplay & { range: string }> =
  [
    { ...concordanceDisplay(60), range: "60%+" },
    { ...concordanceDisplay(40), range: "40-59%" },
    { ...concordanceDisplay(0), range: "<40%" },
  ];
