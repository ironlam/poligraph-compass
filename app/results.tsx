import { useEffect } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuizStore } from "@/lib/store";
import { Compass } from "@/components/Compass";
import { RankingList } from "@/components/RankingList";
import { DeputyBanner } from "@/components/DeputyBanner";
import { getQuadrantLabel } from "@/lib/theme-labels";
import { getNextPhase } from "@/lib/phases";
import { useDeputyStore } from "@/lib/deputy-store";
import { computePoliticianConcordance, computeMinOverlap, computeScrutinWeights } from "@/lib/concordance";

export default function Results() {
  const router = useRouter();
  const { results, phase, partyPositions, quizPack, answers } = useQuizStore();

  useEffect(() => {
    if (!results) {
      router.replace("/");
    }
  }, [results, router]);

  if (!results) {
    return null;
  }

  const { position, politicians, parties, answeredCount } = results;
  const hasValidPosition = position.xValid && position.yValid;
  const quadrantLabel = hasValidPosition
    ? getQuadrantLabel(position.x, position.y)
    : null;

  const { selectedDeputy } = useDeputyStore();

  // Compute concordance for the selected deputy
  const deputyConcordance = (() => {
    if (!selectedDeputy || !quizPack || !answers) return null;

    const answeredCount = Object.values(answers).filter((a) => a !== "SKIP").length;
    const minOverlap = computeMinOverlap(answeredCount);
    const weights = computeScrutinWeights(quizPack.partyMajorities, quizPack.parties);
    const r = computePoliticianConcordance(
      selectedDeputy.id,
      answers as Record<string, string>,
      quizPack.voteMatrix as Record<string, Record<string, string>>,
      minOverlap,
      weights
    );

    if (r.concordance < 0) return null;

    const party = quizPack.parties.find((p) => p.id === selectedDeputy.partyId);
    return {
      id: selectedDeputy.id,
      name: selectedDeputy.fullName,
      slug: selectedDeputy.slug,
      photoUrl: selectedDeputy.photoUrl,
      partyShortName: selectedDeputy.partyShortName,
      partyColor: party?.color ?? null,
      ...r,
    };
  })();

  function handleRefine() {
    router.push("/refine");
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerClassName="pb-12">
        <View className="px-6 pt-6">
          <Text className="text-2xl font-bold text-gray-900">
            Votre position
          </Text>
          <Text className="text-sm text-gray-400 mt-1">
            D'après vos réponses à {answeredCount} votes réels
          </Text>
        </View>

        {/* Compass */}
        <View className="mt-6 items-center">
          {hasValidPosition ? (
            <Compass userPosition={position} parties={parties} partyPositions={partyPositions ?? undefined} />
          ) : (
            <View className="h-48 items-center justify-center">
              <Text className="text-gray-400 text-center px-8">
                Pas assez de réponses pour afficher la boussole.{"\n"}
                Répondez à plus de questions pour voir votre position.
              </Text>
            </View>
          )}
        </View>

        {/* Quadrant label */}
        {quadrantLabel && (
          <View className="mx-6 mt-4 p-4 bg-indigo-50 rounded-xl">
            <Text className="text-sm text-indigo-700 text-center">
              Vous êtes plutôt{" "}
              <Text className="font-bold">{quadrantLabel}</Text>
            </Text>
          </View>
        )}

        {/* Deputy banner */}
        <DeputyBanner />

        {/* Action buttons */}
        <View className="flex-row gap-3 mx-6 mt-6">
          <Pressable
            onPress={() => router.push("/share")}
            className="flex-1 py-3 bg-indigo-500 rounded-xl items-center active:bg-indigo-600"
          >
            <Text className="text-white font-bold">Partager</Text>
          </Pressable>
          {getNextPhase(phase) && (
            <Pressable
              onPress={handleRefine}
              className="flex-1 py-3 bg-gray-100 rounded-xl items-center border border-gray-200 active:bg-gray-200"
            >
              <Text className="text-gray-700 font-bold">Affiner ↓</Text>
            </Pressable>
          )}
        </View>

        {/* Ranking */}
        <RankingList politicians={politicians} parties={parties} pinnedDeputy={deputyConcordance} />

        {/* Methodology link */}
        <Pressable
          onPress={() => router.push("/methodology")}
          className="mx-6 mt-6 py-3 items-center"
        >
          <Text className="text-sm text-gray-400 underline">
            Comment ça marche ?
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
