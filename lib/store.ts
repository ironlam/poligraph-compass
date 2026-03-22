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
