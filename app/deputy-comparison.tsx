import { useEffect } from "react";
import { View, Text, ScrollView, Pressable, Image, Linking } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuizStore } from "@/lib/store";
import { useDeputyStore } from "@/lib/deputy-store";
import {
  classifyVotePair,
  computePoliticianConcordance,
  computeMinOverlap,
  computeScrutinWeights,
} from "@/lib/concordance";
import { computeThemeConcordances } from "@/lib/theme-concordance";
import { ThemeBreakdown } from "@/components/ThemeBreakdown";
import { VoteComparison } from "@/components/VoteComparison";
import { Compass } from "@/components/Compass";

function getConcordanceColor(value: number): string {
  if (value >= 60) return "#10b981";
  if (value >= 40) return "#f59e0b";
  return "#ef4444";
}

export default function DeputyComparisonScreen() {
  const router = useRouter();
  const { results, quizPack, answers, partyPositions } = useQuizStore();
  const { selectedDeputy } = useDeputyStore();

  useEffect(() => {
    if (!results || !quizPack || !selectedDeputy) {
      router.replace("/results");
    }
  }, [results, quizPack, selectedDeputy, router]);

  if (!results || !quizPack || !selectedDeputy) return null;

  const id = selectedDeputy.id;

  // Compute concordance
  const answeredCount = Object.values(answers).filter(
    (a) => a !== "SKIP"
  ).length;
  const minOverlap = computeMinOverlap(answeredCount);
  const weights = computeScrutinWeights(
    quizPack.partyMajorities,
    quizPack.parties
  );
  const concordanceResult = computePoliticianConcordance(
    id,
    answers as Record<string, string>,
    quizPack.voteMatrix as Record<string, Record<string, string>>,
    minOverlap,
    weights
  );

  const party = quizPack.parties.find((p) => p.id === selectedDeputy.partyId);
  const partyColor = party?.color || "#9ca3af";
  const scoreColor = getConcordanceColor(concordanceResult.score);

  // Per-theme breakdown
  const themes = computeThemeConcordances(
    id,
    answers as Record<string, string>,
    quizPack.voteMatrix as Record<string, Record<string, string>>,
    quizPack.questions
  );

  // Vote-by-vote comparison
  const comparisons = quizPack.questions
    .filter((q) => {
      const userAnswer = answers[q.scrutinId];
      const polVote = quizPack.voteMatrix[q.scrutinId]?.[id];
      return (
        userAnswer &&
        userAnswer !== "SKIP" &&
        polVote &&
        polVote !== "ABSENT" &&
        polVote !== "NON_VOTANT"
      );
    })
    .map((q) => {
      const userAnswer = answers[q.scrutinId];
      const polVote = quizPack.voteMatrix[q.scrutinId]?.[id];
      const pair = classifyVotePair(userAnswer, polVote);
      return {
        scrutinId: q.scrutinId,
        question: q.question,
        userVote: userAnswer,
        politicianVote: polVote,
        isAgreement: pair === "agree",
      };
    });

  const agreeCount = comparisons.filter((c) => c.isAgreement).length;
  const disagreeCount = comparisons.filter((c) => !c.isAgreement).length;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerClassName="pb-16">
        {/* Back button */}
        <Pressable onPress={() => router.back()} className="px-6 pt-4 mb-2">
          <Text className="text-sm text-indigo-500 font-semibold">
            {"<-"} Resultats
          </Text>
        </Pressable>

        {/* Badge */}
        <View className="px-6">
          <View className="bg-indigo-500 self-start px-3 py-1 rounded-full mb-3">
            <Text className="text-xs font-bold text-white">
              Votre depute(e)
            </Text>
          </View>
        </View>

        {/* Header */}
        <View className="px-6 flex-row items-center gap-4">
          {selectedDeputy.photoUrl ? (
            <Image
              source={{ uri: selectedDeputy.photoUrl }}
              className="w-20 h-20 rounded-full"
              style={{ borderWidth: 3, borderColor: partyColor }}
            />
          ) : (
            <View
              className="w-20 h-20 rounded-full bg-gray-200 items-center justify-center"
              style={{ borderWidth: 3, borderColor: partyColor }}
            >
              <Text className="text-2xl text-gray-400 font-bold">
                {selectedDeputy.fullName.charAt(0)}
              </Text>
            </View>
          )}
          <View className="flex-1">
            <Text className="text-xl font-extrabold text-gray-900">
              {selectedDeputy.fullName}
            </Text>
            {selectedDeputy.partyShortName && (
              <Text
                className="text-sm font-bold mt-0.5"
                style={{ color: partyColor }}
              >
                {selectedDeputy.partyShortName}
              </Text>
            )}
            {selectedDeputy.circonscription && (
              <Text className="text-xs text-gray-400 mt-0.5">
                {selectedDeputy.circonscription}
              </Text>
            )}
          </View>
          <View className="items-center">
            <Text
              className="text-3xl font-extrabold"
              style={{ color: scoreColor }}
            >
              {concordanceResult.score >= 0
                ? `${concordanceResult.score}%`
                : "N/A"}
            </Text>
            <Text className="text-xs text-gray-400">concordance</Text>
          </View>
        </View>

        {/* Summary stats */}
        <View className="mx-6 mt-4 p-4 bg-gray-50 rounded-2xl">
          <Text className="text-sm text-gray-700">
            D'accord sur{" "}
            <Text className="font-bold">{agreeCount} votes</Text> sur{" "}
            <Text className="font-bold">{comparisons.length}</Text> en commun.
          </Text>
          {disagreeCount > 0 && (
            <Text className="text-sm text-gray-500 mt-1">
              En desaccord sur{" "}
              <Text className="font-bold">{disagreeCount} votes</Text>.
            </Text>
          )}
        </View>

        {/* Compass overlay */}
        {results.position.xValid && results.position.yValid && (
          <View className="mt-6 items-center">
            <Text className="text-lg font-extrabold text-gray-900 px-6 mb-2 self-start">
              Sur la boussole
            </Text>
            <Compass
              userPosition={results.position}
              parties={results.parties}
              partyPositions={partyPositions ?? undefined}
            />
          </View>
        )}

        {/* Theme breakdown */}
        <View className="px-6 mt-6">
          <Text className="text-lg font-extrabold text-gray-900 mb-4">
            Par theme
          </Text>
          <ThemeBreakdown themes={themes} />
        </View>

        {/* Vote by vote */}
        <View className="px-6 mt-8">
          <Text className="text-lg font-extrabold text-gray-900 mb-2">
            Vote par vote
          </Text>
          <Text className="text-xs text-gray-400 mb-4">
            {comparisons.length} votes en commun
          </Text>
          {comparisons.map((c) => (
            <VoteComparison
              key={c.scrutinId}
              question={c.question}
              userVote={c.userVote}
              politicianVote={c.politicianVote}
              isAgreement={c.isAgreement}
            />
          ))}
        </View>

        {/* External link */}
        {selectedDeputy.slug && (
          <Pressable
            onPress={() =>
              Linking.openURL(
                `https://poligraph.fr/politiques/${selectedDeputy.slug}`
              )
            }
            className="mx-6 mt-8 py-3 bg-indigo-500 rounded-2xl items-center active:bg-indigo-600"
          >
            <Text className="text-white font-bold">
              Voir son profil complet sur Poligraph
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
