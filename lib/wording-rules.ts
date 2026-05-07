export const NEUTRAL_FALLBACKS = {
  POUR: "Se prononcer en faveur de la proposition soumise au vote.",
  CONTRE: "Se prononcer contre la proposition soumise au vote.",
  ABSTENTION: "Ne pas se prononcer sur la proposition soumise au vote.",
} as const;

export const ALLOWED_PHRASES = [
  "Ce vote porte sur",
  "La proposition vise à",
  "Se prononcer en faveur de la proposition",
  "Se prononcer contre la proposition",
  "Le scrutin concerne",
] as const;

export const AVOID_PHRASES = [
  "défendre les travailleurs",
  "favoriser les entreprises",
  "protéger la France",
  "affaiblir l'État",
  "choisir le marché",
  "être progressiste",
  "être conservateur",
  "être de gauche",
  "être de droite",
] as const;
