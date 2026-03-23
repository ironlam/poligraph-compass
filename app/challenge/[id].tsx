import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import Head from "expo-router/head";
import { useQuizStore } from "@/lib/store";
import { Compass } from "@/components/Compass";
import { track } from "@/lib/analytics";
import type { ShareResult } from "@/lib/types";

function getQuadrantLabel(x: number, y: number): string {
  const threshold = 0.15;
  const xCenter = Math.abs(x) < threshold;
  const yCenter = Math.abs(y) < threshold;

  if (xCenter && yCenter) return "Au centre";

  const xLabel = xCenter ? null : x > 0 ? "Liberalisme economique" : "Intervention de l'Etat";
  const yLabel = yCenter ? null : y > 0 ? "Progressiste" : "Conservateur";

  if (xLabel && yLabel) return `${yLabel}, ${xLabel.toLowerCase()}`;
  return xLabel ?? yLabel!;
}

export default function ChallengePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { reset, setChallengeContext } = useQuizStore();

  const { data, isLoading, error } = useQuery<ShareResult>({
    queryKey: ["challenge", id],
    queryFn: async () => {
      const res = await fetch(`/api/share/${id}`);
      if (!res.ok) throw new Error("Challenge not found");
      return res.json();
    },
  });

  function handleAcceptChallenge() {
    if (!data) return;

    track({ name: "challenge_accepted" });
    reset();
    setChallengeContext({
      shareId: data.id,
      challengerPosition: data.position,
      challengerTopParties: data.topParties,
      challengerAnsweredCount: data.answeredCount,
    });
    router.replace("/quiz");
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-indigo-950 items-center justify-center">
        <Text className="text-indigo-300">Chargement...</Text>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView className="flex-1 bg-indigo-950 items-center justify-center px-8">
        <Text className="text-white text-xl font-bold text-center">
          Ce defi n'existe plus
        </Text>
        <Text className="text-indigo-400 text-center mt-3">
          Le lien a peut-etre expire ou est invalide.
        </Text>
        <Pressable
          onPress={() => router.replace("/")}
          className="mt-6 bg-amber-500 px-8 py-3 rounded-full active:bg-amber-600"
        >
          <Text className="font-bold text-indigo-950">Faire le quiz</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const quadrantLabel = (data.position.xValid && data.position.yValid)
    ? getQuadrantLabel(data.position.x, data.position.y)
    : null;

  return (
    <>
      <Head>
        <title>On t'a defie ! | Ma Boussole Politique</title>
        <meta property="og:title" content="On t'a defie ! Decouvre ta position politique" />
        <meta property="og:description" content="Compare ta boussole politique avec celle de ton ami. Base sur les votes reels au Parlement." />
        <meta property="og:image" content={`https://boussole.poligraph.fr/api/og/${id}`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <SafeAreaView className="flex-1 bg-indigo-950">
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-2xl font-extrabold text-white text-center">
            On t'a defie !
          </Text>
          <Text className="text-base text-indigo-300 text-center mt-3 leading-6">
            Quelqu'un veut comparer sa position politique avec la tienne.
            Fais le quiz et decouvre si vous etes d'accord !
          </Text>

          {/* Challenger's compass (preview) */}
          <View className="mt-6 opacity-70">
            <Compass
              userPosition={data.position}
              parties={[]}
            />
          </View>
          {quadrantLabel && (
            <Text className="text-indigo-400 text-sm mt-2 text-center">
              Position du challenger : {quadrantLabel}
            </Text>
          )}

          <Pressable
            onPress={handleAcceptChallenge}
            accessibilityRole="button"
            accessibilityLabel="Relever le defi"
            className="mt-8 bg-amber-500 px-10 py-4 rounded-full active:bg-amber-600"
            style={{ minHeight: 48 }}
          >
            <Text className="text-lg font-bold text-indigo-950">
              Relever le defi
            </Text>
          </Pressable>

          <Text className="text-sm text-indigo-500 mt-4">
            2 min, 20 questions
          </Text>
        </View>
      </SafeAreaView>
    </>
  );
}
