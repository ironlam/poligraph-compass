import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuizStore } from "@/lib/store";
import { getNextPhase, getPhaseLabel } from "@/lib/phases";
import { track } from "@/lib/analytics";

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
    track({
      name: "phase_continued",
      data: { fromPhase: phase, toPhase: nextPhase! },
    });
    setPhase(nextPhase!);
    router.push("/quiz");
  }

  function handleSkip() {
    track({
      name: "phase_stopped",
      data: {
        phase,
        questionsAnswered: useQuizStore.getState().results?.answeredCount ?? 0,
      },
    });
    router.push("/share");
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <Text
          className="font-display text-ink text-center"
          style={{ fontSize: 22 }}
        >
          Envie d'aller plus loin ?
        </Text>
        <Text
          className="font-body text-center mt-3"
          style={{ color: "#6b7280", fontSize: 14, lineHeight: 21 }}
        >
          {label}
          {"\n"}Tes résultats seront encore plus précis.
        </Text>

        <View className="w-full mt-10 gap-3">
          <Pressable
            onPress={handleContinue}
            accessibilityRole="button"
            accessibilityLabel="Continuer avec les questions supplémentaires"
            className="items-center justify-center active:opacity-90"
            style={{
              height: 54,
              borderRadius: 18,
              backgroundColor: "#4f46e5",
              shadowColor: "#4f46e5",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
              elevation: 4,
            }}
          >
            <Text className="text-white font-display" style={{ fontSize: 16 }}>
              Continuer
            </Text>
          </Pressable>
          <Pressable
            onPress={handleSkip}
            accessibilityRole="button"
            className="items-center"
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Text
              className="font-body"
              style={{ color: "#9aa0ae", fontSize: 14 }}
            >
              Non merci, partager mes résultats
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
