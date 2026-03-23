import { useEffect, useRef } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useQuizStore } from "@/lib/store";
import { QuizCard } from "@/components/QuizCard";
import { ProgressBar } from "@/components/ProgressBar";
import type { QuizPack, UserAnswer, CompassPosition } from "@/lib/types";
import { computeCompassPosition } from "@/lib/compass";
import { computePoliticianConcordance, computePartyConcordance, computeMinOverlap, computeScrutinWeights } from "@/lib/concordance";

export default function Quiz() {
  const router = useRouter();
  const {
    answers,
    setAnswer,
    currentIndex,
    setCurrentIndex,
    phase,
    quizPack,
    setQuizPack,
    setResults,
    setPartyPositions,
  } = useQuizStore();

  const { data, isLoading } = useQuery<QuizPack>({
    queryKey: ["quiz-pack"],
    queryFn: async () => {
      const res = await fetch("/api/quiz-pack");
      return res.json();
    },
    staleTime: 24 * 60 * 60 * 1000,
  });

  // Store quiz pack when loaded (in useEffect to avoid render-time state mutation)
  useEffect(() => {
    if (data && !quizPack) {
      setQuizPack(data);
    }
  }, [data, quizPack, setQuizPack]);

  const pack = quizPack || data;

  const questions = pack?.questions.filter((q) =>
    phase === "essential" ? q.tier === "essential" : q.tier === "refine"
  ) ?? [];
  const currentQuestion = questions[currentIndex];
  const noQuestionsForPhase = !!pack && questions.length === 0;
  const quizComplete = pack && !currentQuestion && questions.length > 0;
  const hasNavigated = useRef(false);

  // If no questions for current phase (e.g., no refine questions in seed data), redirect
  useEffect(() => {
    if (noQuestionsForPhase) {
      router.replace("/results");
    }
  }, [noQuestionsForPhase, router]);

  // Handle quiz completion in useEffect (not during render)
  useEffect(() => {
    if (!quizComplete || !pack || hasNavigated.current) return;
    hasNavigated.current = true;

    const position = computeCompassPosition(answers, pack.axes);
    const answeredCount = Object.values(answers).filter((a) => a !== "SKIP").length;
    const minOverlap = computeMinOverlap(answeredCount);
    const weights = computeScrutinWeights(pack.partyMajorities, pack.parties);

    const politicians = pack.politicians
      .map((pol) => {
        const r = computePoliticianConcordance(pol.id, answers, pack.voteMatrix, minOverlap, weights);
        const party = pack.parties.find((p) => p.id === pol.partyId);
        return { id: pol.id, name: pol.fullName, slug: pol.slug, photoUrl: pol.photoUrl, partyShortName: pol.partyShortName, partyColor: party?.color ?? null, ...r };
      })
      .filter((r) => r.concordance >= 0)
      .sort((a, b) => b.score - a.score);

    const parties = pack.parties
      .map((party) => {
        const r = computePartyConcordance(party.id, answers, pack.partyMajorities, minOverlap, weights);
        return { id: party.id, name: party.name, partyShortName: party.shortName, photoUrl: null, partyColor: party.color ?? null, ...r };
      })
      .filter((r) => r.concordance >= 0)
      .sort((a, b) => b.score - a.score);

    // Compute party compass positions
    const partyPos: Record<string, CompassPosition> = {};
    for (const party of pack.parties) {
      const partyVotes: Record<string, string> = {};
      for (const [scrutinId, partyVotesMap] of Object.entries(pack.partyMajorities)) {
        const pos = partyVotesMap[party.id];
        if (pos) partyVotes[scrutinId] = pos;
      }
      partyPos[party.id] = computeCompassPosition(partyVotes, pack.axes);
    }

    setResults({
      position,
      politicians,
      parties,
      answeredCount,
      totalQuestions: pack.questions.length,
    });
    setPartyPositions(partyPos);

    // Fire-and-forget: store result on server for shareable link
    fetch("/api/compute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    })
      .then((res) => res.json())
      .then((serverData) => {
        if (serverData.shareId) useQuizStore.getState().setShareId(serverData.shareId);
      })
      .catch(() => {});

    router.replace("/results");
  }, [quizComplete, pack, answers, phase, setResults, setPartyPositions, router]);

  if (isLoading || !pack) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <View className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </SafeAreaView>
    );
  }

  if (noQuestionsForPhase) {
    // Waiting for useEffect to redirect
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <View className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </SafeAreaView>
    );
  }

  if (quizComplete) {
    // Waiting for useEffect to navigate
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <View className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </SafeAreaView>
    );
  }

  function handleAnswer(answer: UserAnswer) {
    setAnswer(currentQuestion.scrutinId, answer);
    setCurrentIndex(currentIndex + 1);
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-4">
        <ProgressBar current={currentIndex + 1} total={questions.length} />
      </View>
      <QuizCard
        key={currentQuestion.scrutinId}
        question={currentQuestion}
        onAnswer={handleAnswer}
      />
    </SafeAreaView>
  );
}
