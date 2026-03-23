import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuizStore } from "@/lib/store";
import { getNextPhase, getPhaseLabel } from "@/lib/phases";

export default function RefineGate() {
  const router = useRouter();
  const { phase, setPhase } = useQuizStore();
  const nextPhase = getNextPhase(phase);

  if (!nextPhase) {
    router.replace("/share");
    return null;
  }

  const label = getPhaseLabel(nextPhase);

  function handleContinue() {
    setPhase(nextPhase!);
    router.push("/quiz");
  }

  function handleSkip() {
    router.push("/share");
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-5xl mb-6">{"🎯"}</Text>
        <Text className="text-xl font-extrabold text-gray-900 text-center">
          Envie d'aller plus loin ?
        </Text>
        <Text className="text-sm text-gray-500 text-center mt-3 leading-5">
          {label}
          {"\n"}Vos résultats seront encore plus précis.
        </Text>

        <View className="w-full mt-10 gap-3">
          <Pressable
            onPress={handleContinue}
            accessibilityRole="button"
            accessibilityLabel="Continuer avec les questions supplémentaires"
            className="py-4 bg-indigo-600 rounded-2xl items-center active:bg-indigo-700"
            style={{ minHeight: 48 }}
          >
            <Text className="text-white font-bold text-base">Continuer</Text>
          </Pressable>
          <Pressable
            onPress={handleSkip}
            accessibilityRole="button"
            className="py-3 items-center"
          >
            <Text className="text-gray-400 text-sm">
              Non merci, partager mes résultats
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
