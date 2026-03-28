import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuizStore } from "@/lib/store";
import { track } from "@/lib/analytics";
import { Logo } from "@/components/Logo";

export default function Home() {
  const router = useRouter();
  const reset = useQuizStore((s) => s.reset);

  function handleStart() {
    track({ name: "quiz_started" });
    reset();
    router.push("/quiz");
  }

  return (
    <SafeAreaView className="flex-1 bg-indigo-950">
      <View className="flex-1 items-center justify-center px-8">
        <Logo size={120} transparent />
        <Text className="text-3xl font-bold text-white text-center mt-4">
          Ma Boussole{"\n"}Parlementaire
        </Text>
        <Text className="text-sm text-indigo-400 mt-1">par Poligraph</Text>
        <Text className="text-base text-indigo-300 text-center mt-4 leading-6">
          Découvrez quels élus votent comme vous
        </Text>

        <View className="mt-6 gap-2">
          <Text className="text-sm text-indigo-400 text-center">
            Basé sur les votes réels au Parlement
          </Text>
          <Text className="text-sm text-indigo-400 text-center">
            Comparez-vous à votre député
          </Text>
          <Text className="text-sm text-indigo-400 text-center">
            Résultats instantanés
          </Text>
        </View>

        <Pressable
          onPress={handleStart}
          accessibilityRole="button"
          accessibilityLabel="Commencer le quiz"
          className="mt-10 bg-amber-500 px-10 py-4 rounded-full active:bg-amber-600"
          style={{ minHeight: 48 }}
        >
          <Text className="text-lg font-bold text-indigo-950">
            Commencer
          </Text>
        </Pressable>

        <Text className="text-sm text-indigo-400 mt-4">
          2 min · 20 questions
        </Text>

        <Pressable
          onPress={() => router.push("/methodology")}
          className="mt-16"
        >
          <Text className="text-xs text-indigo-600 text-center">
            Basé sur les votes réels au Parlement{"\n"}
            Données Poligraph · Association Sankofa
          </Text>
          <Text className="text-xs text-indigo-400 text-center mt-2 underline">
            Notre méthodologie
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
