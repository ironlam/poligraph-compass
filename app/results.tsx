import { useEffect } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useQuizStore } from "@/lib/store";
import { Compass } from "@/components/Compass";
import { RankingList } from "@/components/RankingList";
import { DeputyBanner } from "@/components/DeputyBanner";
import { NewsletterCapture } from "@/components/NewsletterCapture";
import {
  SparklesIcon,
  CompassIcon,
  Share2Icon,
  PlusIcon,
} from "@/components/icons";
import { getQuadrantLabel } from "@/lib/theme-labels";
import { getNextPhase } from "@/lib/phases";
import { useDeputyStore } from "@/lib/deputy-store";
import {
  computePoliticianConcordance,
  computeScrutinWeights,
} from "@/lib/concordance";

export default function Results() {
  const router = useRouter();
  const {
    results,
    phase,
    partyPositions,
    quizPack,
    answers,
    challengeContext,
    profile,
  } = useQuizStore();

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

  const { selectedDeputy, codePostal } = useDeputyStore();

  // Compute concordance for the selected deputy.
  // Use a low fixed threshold (5) instead of the dynamic minOverlap:
  // the user explicitly selected this deputy, so we always show them
  // even if their overlap is below the stricter dynamic threshold.
  const deputyConcordance = (() => {
    if (!selectedDeputy || !quizPack || !answers) return null;

    const weights = computeScrutinWeights(
      quizPack.partyMajorities,
      quizPack.parties,
    );
    const r = computePoliticianConcordance(
      selectedDeputy.id,
      answers as Record<string, string>,
      quizPack.voteMatrix as Record<string, Record<string, string>>,
      5,
      weights,
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

  const canRefine = Boolean(getNextPhase(phase));

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Header */}
        <View className="px-6" style={{ paddingTop: 8 }}>
          <View
            className="flex-row items-center self-start"
            style={{
              gap: 7,
              backgroundColor: "#eef2ff",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
            }}
          >
            <SparklesIcon size={14} color="#4f46e5" />
            <Text
              className="font-body-700"
              style={{
                color: "#4f46e5",
                fontSize: 12,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              Ton résultat
            </Text>
          </View>
          <Text
            className="font-display text-ink"
            style={{ fontSize: 30, marginTop: 14 }}
          >
            Ta position
          </Text>
          <Text
            className="font-body"
            style={{ color: "#6b7280", fontSize: 14.5, marginTop: 2 }}
          >
            D'après tes réponses à{" "}
            <Text className="font-body-700 text-ink">
              {answeredCount} votes réels
            </Text>
          </Text>
        </View>

        {/* Compass card */}
        {hasValidPosition ? (
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 18,
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "#e8eaf0",
              borderRadius: 26,
              paddingTop: 18,
              paddingHorizontal: 16,
              paddingBottom: 14,
              shadowColor: "#1e1b4b",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.15,
              shadowRadius: 18,
              elevation: 2,
            }}
          >
            <Compass
              userPosition={position}
              parties={parties}
              partyPositions={partyPositions ?? undefined}
              challengerPosition={challengeContext?.challengerPosition}
            />
          </View>
        ) : (
          <View className="h-48 items-center justify-center px-8">
            <Text
              className="font-body text-center"
              style={{ color: "#9aa0ae" }}
            >
              Pas assez de réponses pour afficher la boussole.{"\n"}
              Réponds à plus de questions pour voir ta position.
            </Text>
          </View>
        )}

        {/* Quadrant verdict card */}
        {quadrantLabel && (
          <LinearGradient
            colors={["#4f46e5", "#6366f1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              marginHorizontal: 20,
              marginTop: 16,
              borderRadius: 20,
              paddingVertical: 18,
              paddingHorizontal: 20,
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
            }}
          >
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                backgroundColor: "rgba(255,255,255,0.16)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CompassIcon size={24} color="#fff" />
            </View>
            <View className="flex-1">
              <Text
                className="font-body"
                style={{ color: "#d7d9fb", fontSize: 12.5 }}
              >
                Tu es plutôt
              </Text>
              <Text
                className="font-display text-white"
                style={{ fontSize: 20, lineHeight: 23, marginTop: 2 }}
              >
                {quadrantLabel}
              </Text>
            </View>
          </LinearGradient>
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
                const similarity = Math.max(
                  0,
                  Math.round((1 - distance / 2.83) * 100),
                );
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
                    {challengeContext.challengerTopParties[0]?.shortName ??
                      "---"}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Deputy banner */}
        <DeputyBanner />

        {/* Newsletter capture (optional, non-blocking) */}
        {profile && (
          <NewsletterCapture
            profile={profile}
            deputyName={selectedDeputy?.fullName ?? null}
            deputySlug={selectedDeputy?.slug ?? null}
            postalCode={codePostal ?? null}
          />
        )}

        {/* Action buttons */}
        <View
          className="flex-row"
          style={{ gap: 12, marginHorizontal: 20, marginTop: 22 }}
        >
          <Pressable
            onPress={() => router.push("/share")}
            accessibilityRole="button"
            accessibilityLabel="Partager mes résultats"
            className="flex-1 flex-row items-center justify-center active:opacity-90"
            style={{
              height: 54,
              borderRadius: 18,
              gap: 8,
              backgroundColor: "#4f46e5",
              shadowColor: "#4f46e5",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.5,
              shadowRadius: 16,
              elevation: 4,
            }}
          >
            <Share2Icon size={19} color="#fff" />
            <Text className="font-display text-white" style={{ fontSize: 16 }}>
              Partager
            </Text>
          </Pressable>
          {canRefine && (
            <Pressable
              onPress={handleRefine}
              accessibilityRole="button"
              accessibilityLabel="Répondre à plus de questions pour affiner les résultats"
              className="flex-1 flex-row items-center justify-center active:opacity-80"
              style={{
                height: 54,
                borderRadius: 18,
                gap: 8,
                backgroundColor: "#f0f1f6",
              }}
            >
              <PlusIcon size={19} color="#1f2430" />
              <Text className="font-display text-ink" style={{ fontSize: 16 }}>
                Plus
              </Text>
            </Pressable>
          )}
        </View>

        {/* Ranking */}
        <RankingList
          politicians={politicians}
          parties={parties}
          pinnedDeputy={deputyConcordance}
        />

        {/* Methodology link */}
        <Pressable
          onPress={() => router.push("/methodology")}
          accessibilityRole="link"
          accessibilityLabel="Comment ça marche ? Voir la méthodologie"
          className="items-center"
          style={{
            marginHorizontal: 24,
            marginTop: 20,
            minHeight: 44,
            justifyContent: "center",
          }}
        >
          <Text
            className="font-body underline"
            style={{ color: "#6b7280", fontSize: 13 }}
          >
            Comment ça marche ?
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
