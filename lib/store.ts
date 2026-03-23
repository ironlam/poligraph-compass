import { create } from "zustand";
import type { QuizPack, ComputeResult, UserAnswer, CompassPosition, ChallengeContext } from "./types";
import type { Phase } from "./phases";

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
  phase: Phase;
  setPhase: (phase: Phase) => void;

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

  // Challenge
  challengeContext: ChallengeContext | null;
  setChallengeContext: (ctx: ChallengeContext) => void;
  clearChallengeContext: () => void;

  // Reset
  reset: () => void;
}

const initialState = {
  quizPack: null,
  answers: {},
  currentIndex: 0,
  phase: "core" as const,
  results: null,
  partyPositions: null,
  shareId: null,
  showPartiesOnShare: false,
  challengeContext: null,
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

  setChallengeContext: (ctx) => set({ challengeContext: ctx }),
  clearChallengeContext: () => set({ challengeContext: null }),

  reset: () => set(initialState),
}));
