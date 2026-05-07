import type { UserAnswer } from "./types";

export interface QuizButtonConfig {
  value: UserAnswer;
  label: string;
  ariaLabel: string;
  variant: "primary-pour" | "primary-contre" | "secondary" | "tertiary";
}

export const QUIZ_BUTTONS: readonly QuizButtonConfig[] = [
  {
    value: "POUR",
    label: "Pour",
    ariaLabel: "Pour",
    variant: "primary-pour",
  },
  {
    value: "CONTRE",
    label: "Contre",
    ariaLabel: "Contre",
    variant: "primary-contre",
  },
  {
    value: "ABSTENTION",
    label: "Je ne sais pas / pas assez informé",
    ariaLabel: "Je ne sais pas, pas assez informé",
    variant: "secondary",
  },
  {
    value: "SKIP",
    label: "Passer",
    ariaLabel: "Passer cette question",
    variant: "tertiary",
  },
] as const;
