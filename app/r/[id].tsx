import { View, Text, Pressable, Linking } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
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
          Ce résultat n'existe plus
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
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-xl font-bold text-gray-900 mb-6">
          Résultat partagé
        </Text>
        <Compass
          userPosition={data.position}
          parties={data.showParties && data.topParty ? [data.topParty] : []}
        />
        <Text className="text-gray-500 mt-4 text-center">
          D'après {data.answeredCount} votes réels au Parlement
        </Text>
        <Pressable
          onPress={handleStartQuiz}
          className="mt-8 bg-indigo-500 px-8 py-4 rounded-full active:bg-indigo-600"
        >
          <Text className="text-white font-bold text-base">
            Et toi, tu es où ? Fais le test →
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
