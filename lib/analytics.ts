import { Platform } from "react-native";

type AnalyticsEvent =
  | { name: "quiz_started" }
  | { name: "phase_completed"; data: { phase: string; questionsAnswered: number } }
  | { name: "phase_continued"; data: { fromPhase: string; toPhase: string } }
  | { name: "phase_stopped"; data: { phase: string; questionsAnswered: number } }
  | { name: "deputy_searched"; data: { hasResult: boolean } }
  | { name: "deputy_compared"; data: { concordanceScore: number } }
  | { name: "result_shared"; data: { method: "image" | "link" } }
  | { name: "challenge_created" }
  | { name: "challenge_accepted" };

declare global {
  interface Window {
    umami?: {
      track: (name: string, data?: Record<string, unknown>) => void;
    };
  }
}

export function track(event: AnalyticsEvent): void {
  if (Platform.OS !== "web") return;
  if (typeof window === "undefined" || !window.umami) return;

  const { name, ...rest } = event;
  const data = "data" in rest ? rest.data : undefined;
  window.umami.track(name, data as Record<string, unknown> | undefined);
}
