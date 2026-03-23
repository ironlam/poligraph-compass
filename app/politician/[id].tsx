import { useEffect } from "react";
import { View, Text, ScrollView, Pressable, Image, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuizStore } from "@/lib/store";
import { classifyVotePair } from "@/lib/concordance";
import { computeThemeConcordances } from "@/lib/theme-concordance";
import { ThemeBreakdown } from "@/components/ThemeBreakdown";
import { VoteComparison } from "@/components/VoteComparison";

function getConcordanceColor(value: number): string {
  if (value >= 60) return "#10b981";
  if (value >= 40) return "#f59e0b";
  return "#ef4444";
}

export default function PoliticianDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { results, quizPack, answers } = useQuizStore();

  useEffect(() => {
    if (!results || !quizPack) {
      router.replace("/");
    }
  }, [results, quizPack, router]);

  if (!results || !quizPack || !id) return null;

  const politician = results.politicians.find((p) => p.id === id);
  if (!politician) return null;

  const polData = quizPack.politicians.find((p) => p.id === id);
  const partyColor = politician.partyColor || "#9ca3af";
  const scoreColor = getConcordanceColor(politician.score);

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
      return userAnswer && userAnswer !== "SKIP" && polVote && polVote !== "ABSENT" && polVote !== "NON_VOTANT";
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

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerClassName="pb-16">
        {/* Back button */}
        <Pressable onPress={() => router.back()} className="px-6 pt-4 mb-2">
          <Text className="text-sm text-indigo-500 font-semibold">← Résultats</Text>
        </Pressable>

        {/* Header */}
        <View className="px-6 flex-row items-center gap-4">
          {politician.photoUrl ? (
            <Image
              source={{ uri: politician.photoUrl }}
              className="w-20 h-20 rounded-full"
              style={{ borderWidth: 3, borderColor: partyColor }}
            />
          ) : (
            <View
              className="w-20 h-20 rounded-full bg-gray-200 items-center justify-center"
              style={{ borderWidth: 3, borderColor: partyColor }}
            >
              <Text className="text-2xl text-gray-400 font-bold">
                {politician.name.charAt(0)}
              </Text>
            </View>
          )}
          <View className="flex-1">
            <Text className="text-xl font-extrabold text-gray-900">
              {politician.name}
            </Text>
            {politician.partyShortName && (
              <Text className="text-sm font-bold mt-0.5" style={{ color: partyColor }}>
                {politician.partyShortName}
              </Text>
            )}
          </View>
          <View className="items-center">
            <Text className="text-3xl font-extrabold" style={{ color: scoreColor }}>
              {politician.score}%
            </Text>
            <Text className="text-xs text-gray-400">concordance</Text>
          </View>
        </View>

        {/* Summary */}
        <View className="mx-6 mt-4 p-4 bg-gray-50 rounded-2xl">
          <Text className="text-sm text-gray-700">
            Vous êtes d'accord sur{" "}
            <Text className="font-bold">{politician.agree} votes</Text> sur{" "}
            <Text className="font-bold">{politician.overlap}</Text> en commun.
          </Text>
        </View>

        {/* Theme breakdown */}
        <View className="px-6 mt-6">
          <Text className="text-lg font-extrabold text-gray-900 mb-4">
            Par thème
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
        {polData?.slug && (
          <Pressable
            onPress={() => Linking.openURL(`https://poligraph.fr/politiques/${polData.slug}`)}
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
