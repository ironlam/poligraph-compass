import { View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useQuizStore } from "@/lib/store";
import { QuizCard } from "@/components/QuizCard";
import { ProgressBar } from "@/components/ProgressBar";
import type { QuizPack, UserAnswer } from "@/lib/types";
import { computeCompassPosition } from "@/lib/compass";
import { computePoliticianConcordance, computePartyConcordance } from "@/lib/concordance";

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

  // Store quiz pack when loaded
  if (data && !quizPack) {
    setQuizPack(data);
  }

  const pack = quizPack || data;
  if (isLoading || !pack) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <View className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </SafeAreaView>
    );
  }

  const questions = pack.questions.filter((q) =>
    phase === "essential" ? q.tier === "essential" : q.tier === "refine"
  );
  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) {
    // Quiz complete: compute results locally
    const position = computeCompassPosition(answers, pack.axes);

    const politicians = pack.politicians
      .map((pol) => {
        const r = computePoliticianConcordance(pol.id, answers, pack.voteMatrix);
        return { id: pol.id, name: pol.fullName, slug: pol.slug, photoUrl: pol.photoUrl, partyShortName: pol.partyShortName, ...r };
      })
      .filter((r) => r.concordance >= 0)
      .sort((a, b) => b.concordance - a.concordance);

    const parties = pack.parties
      .map((party) => {
        const r = computePartyConcordance(party.id, answers, pack.partyMajorities);
        return { id: party.id, name: party.name, partyShortName: party.shortName, photoUrl: null, ...r };
      })
      .filter((r) => r.concordance >= 0)
      .sort((a, b) => b.concordance - a.concordance);

    const answeredCount = Object.values(answers).filter((a) => a !== "SKIP").length;

    // Compute party compass positions (same algo applied to party majority votes)
    const partyPos: Record<string, any> = {};
    for (const party of pack.parties) {
      const partyVotes: Record<string, string> = {};
      for (const [scrutinId, partyVotesMap] of Object.entries(pack.partyMajorities)) {
        const pos = (partyVotesMap as Record<string, string>)[party.id];
        if (pos) partyVotes[scrutinId] = pos;
      }
      partyPos[party.id] = computeCompassPosition(partyVotes, pack.axes);
    }

    setResults({
      position,
      politicians,
      parties,
      answeredCount,
      totalQuestions: questions.length,
    });
    setPartyPositions(partyPos);

    // Fire-and-forget: store result on server for shareable link
    fetch("/api/compute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.shareId) useQuizStore.getState().setShareId(data.shareId);
      })
      .catch(() => {}); // sharing is optional, don't block on failure

    router.replace("/results");
    return null;
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
