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
import { computePoliticianConcordance, computeScrutinWeights } from "@/lib/concordance";

export default function Results() {
  const router = useRouter();
  const { results, phase, partyPositions, quizPack, answers, challengeContext } = useQuizStore();

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

  // Compute concordance for the selected deputy.
  // Use a low fixed threshold (5) instead of the dynamic minOverlap:
  // the user explicitly selected this deputy, so we always show them
  // even if their overlap is below the stricter dynamic threshold.
  const deputyConcordance = (() => {
    if (!selectedDeputy || !quizPack || !answers) return null;

    const weights = computeScrutinWeights(quizPack.partyMajorities, quizPack.parties);
    const r = computePoliticianConcordance(
      selectedDeputy.id,
      answers as Record<string, string>,
      quizPack.voteMatrix as Record<string, Record<string, string>>,
      5,
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
            Ta position
          </Text>
          <Text className="text-sm text-gray-400 mt-1">
            D'après tes réponses à {answeredCount} votes réels
          </Text>
        </View>

        {/* Compass */}
        <View className="mt-6 items-center">
          {hasValidPosition ? (
            <Compass userPosition={position} parties={parties} partyPositions={partyPositions ?? undefined} challengerPosition={challengeContext?.challengerPosition} />
          ) : (
            <View className="h-48 items-center justify-center">
              <Text className="text-gray-400 text-center px-8">
                Pas assez de réponses pour afficher la boussole.{"\n"}
                Réponds à plus de questions pour voir ta position.
              </Text>
            </View>
          )}
        </View>

        {/* Quadrant label */}
        {quadrantLabel && (
          <View className="mx-6 mt-4 p-4 bg-indigo-50 rounded-xl">
            <Text className="text-sm text-indigo-700 text-center">
              Tu es plutôt{" "}
              <Text className="font-bold">{quadrantLabel}</Text>
            </Text>
          </View>
        )}

        {/* Challenge comparison */}
        {challengeContext && (
          <View className="mx-6 mt-4 p-4 bg-indigo-50 rounded-xl gap-3">
            <Text className="text-sm font-bold text-indigo-900 text-center">
              Comparaison avec le challenger
            </Text>
            <View className="items-center">
              {(() => {
                const dx = position.x - challengeContext.challengerPosition.x;
                const dy = position.y - challengeContext.challengerPosition.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const similarity = Math.max(0, Math.round((1 - distance / 2.83) * 100));
                return (
                  <Text className="text-2xl font-extrabold text-indigo-700">
                    {similarity}% similaires
                  </Text>
                );
              })()}
            </View>
            {challengeContext.challengerTopParties.length > 0 && (
              <View className="gap-1">
                <View className="flex-row justify-between">
                  <Text className="text-xs text-gray-500">Toi</Text>
                  <Text className="text-xs text-gray-500">Challenger</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-sm font-bold text-gray-900">
                    {parties[0]?.partyShortName ?? parties[0]?.name ?? "---"}
                  </Text>
                  <Text className="text-sm font-bold text-indigo-700">
                    {challengeContext.challengerTopParties[0]?.shortName ?? "---"}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Deputy banner */}
        <DeputyBanner />

        {/* Action buttons */}
        <View className="flex-row gap-3 mx-6 mt-6">
          <Pressable
            onPress={() => router.push("/share")}
            accessibilityRole="button"
            accessibilityLabel="Partager mes résultats"
            className="flex-1 py-3 bg-indigo-500 rounded-xl items-center active:bg-indigo-600"
            style={{ minHeight: 48 }}
          >
            <Text className="text-white font-bold">Partager</Text>
          </Pressable>
          {getNextPhase(phase) && (
            <Pressable
              onPress={handleRefine}
              accessibilityRole="button"
              accessibilityLabel="Répondre à plus de questions pour affiner les résultats"
              className="flex-1 py-3 bg-gray-100 rounded-xl items-center border border-gray-200 active:bg-gray-200"
              style={{ minHeight: 48 }}
            >
              <Text className="text-gray-700 font-bold">Plus de questions ↓</Text>
            </Pressable>
          )}
        </View>

        {/* Ranking */}
        <RankingList politicians={politicians} parties={parties} pinnedDeputy={deputyConcordance} />

        {/* Methodology link */}
        <Pressable
          onPress={() => router.push("/methodology")}
          accessibilityRole="link"
          accessibilityLabel="Comment ça marche ? Voir la méthodologie"
          className="mx-6 mt-6 py-3 items-center"
          style={{ minHeight: 44 }}
        >
          <Text className="text-sm text-gray-400 underline">
            Comment ça marche ?
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
