import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuizStore } from "@/lib/store";

export default function Refine() {
  const router = useRouter();
  const setPhase = useQuizStore((s) => s.setPhase);

  function handleContinue() {
    setPhase("refine");
    router.push("/quiz");
  }

  function handleSkip() {
    router.push("/share");
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-5xl mb-6">🎯</Text>
        <Text className="text-2xl font-bold text-gray-900 text-center">
          Affiner votre position
        </Text>
        <Text className="text-base text-gray-500 text-center mt-4 leading-6">
          10 questions supplémentaires pour un résultat plus précis
        </Text>
        <Text className="text-sm text-gray-400 mt-2">
          Environ 4 minutes
        </Text>

        <Pressable
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityLabel="Continuer avec les questions supplémentaires"
          className="mt-10 bg-indigo-500 px-10 py-4 rounded-full active:bg-indigo-600"
          style={{ minHeight: 48 }}
        >
          <Text className="text-lg font-bold text-white">Continuer</Text>
        </Pressable>

        <Pressable
          onPress={handleSkip}
          accessibilityRole="button"
          className="mt-4 py-3"
        >
          <Text className="text-sm text-gray-400">Non merci, partager mes résultats</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
