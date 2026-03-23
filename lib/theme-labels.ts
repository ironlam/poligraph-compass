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

const CENTER_THRESHOLD = 0.15;

export function getQuadrantLabel(x: number, y: number): string {
  const xCenter = Math.abs(x) < CENTER_THRESHOLD;
  const yCenter = Math.abs(y) < CENTER_THRESHOLD;

  if (xCenter && yCenter) return "Au centre";

  const xLabel = xCenter ? null : x > 0 ? AXIS_LABELS.economy.positive : AXIS_LABELS.economy.negative;
  const yLabel = yCenter ? null : y > 0 ? AXIS_LABELS.society.positive : AXIS_LABELS.society.negative;

  if (xLabel && yLabel) return `${yLabel}, ${xLabel.toLowerCase()}`;
  return xLabel ?? yLabel!;
}
