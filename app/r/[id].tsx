import { View, Text, Pressable, Linking } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import Head from "expo-router/head";
import { Compass } from "@/components/Compass";
import type { ShareResult } from "@/lib/types";

export default function SharedResult() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading, error } = useQuery<ShareResult>({
    queryKey: ["share", id],
    queryFn: async () => {
      const res = await fetch(`/api/share/${id}`);
      if (!res.ok) throw new Error("Result not found");
      return res.json();
    },
  });

  function handleStartQuiz() {
    Linking.openURL("https://boussole.poligraph.fr");
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
          Ce resultat n'existe plus
        </Text>
        <Pressable
          onPress={handleStartQuiz}
          className="mt-6 bg-amber-500 px-8 py-3 rounded-full"
        >
          <Text className="font-bold text-indigo-950">Faire le quiz</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Head>
        <title>Ma Boussole Parlementaire</title>
        <meta property="og:title" content="Ma Boussole Parlementaire" />
        <meta property="og:description" content={`Decouvre ma position politique, d'apres ${data.answeredCount} votes reels au Parlement.`} />
        <meta property="og:image" content={`https://boussole.poligraph.fr/api/og/${id}`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-xl font-bold text-gray-900 mb-6">
            Resultat partage
          </Text>
          <Compass
            userPosition={data.position}
            parties={data.topParties?.length ? data.topParties.map((p) => ({
              id: p.id,
              name: p.name,
              partyShortName: p.shortName,
              partyColor: p.color,
              concordance: p.score,
              score: p.score,
              agree: 0,
              disagree: 0,
              partial: 0,
              overlap: 0,
              photoUrl: null,
            })) : []}
          />
          <Text className="text-gray-500 mt-4 text-center">
            D'apres {data.answeredCount} votes reels au Parlement
          </Text>
          <Pressable
            onPress={handleStartQuiz}
            className="mt-8 bg-indigo-500 px-8 py-4 rounded-full active:bg-indigo-600"
          >
            <Text className="text-white font-bold text-base">
              Et toi, tu es ou ? Fais le test
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </>
  );
}
