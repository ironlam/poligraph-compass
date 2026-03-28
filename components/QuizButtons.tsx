import { View, Text, Pressable } from "react-native";
import type { UserAnswer } from "@/lib/types";

interface Props {
  onAnswer: (answer: UserAnswer) => void;
}

export function QuizButtons({ onAnswer }: Props) {
  return (
    <View className="px-5 pb-4 pt-3 gap-2">
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => onAnswer("POUR")}
          accessibilityRole="button"
          accessibilityLabel="Pour"
          className="flex-1 py-3.5 rounded-2xl items-center bg-emerald-600 active:bg-emerald-700"
          style={{ minHeight: 48 }}
        >
          <Text className="text-base font-bold text-white tracking-wide">Pour</Text>
        </Pressable>
        <Pressable
          onPress={() => onAnswer("CONTRE")}
          accessibilityRole="button"
          accessibilityLabel="Contre"
          className="flex-1 py-3.5 rounded-2xl items-center bg-red-600 active:bg-red-700"
          style={{ minHeight: 48 }}
        >
          <Text className="text-base font-bold text-white tracking-wide">Contre</Text>
        </Pressable>
      </View>
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => onAnswer("ABSTENTION")}
          accessibilityRole="button"
          accessibilityLabel="Sans avis"
          className="flex-1 py-3 rounded-2xl items-center border border-indigo-400/30 active:bg-indigo-900/50"
          style={{ minHeight: 44 }}
        >
          <Text className="text-sm font-semibold text-indigo-300 tracking-wide">Sans avis</Text>
        </Pressable>
        <Pressable
          onPress={() => onAnswer("SKIP")}
          accessibilityRole="button"
          accessibilityLabel="Passer cette question"
          className="flex-1 py-3 rounded-2xl items-center active:bg-indigo-900/50"
          style={{ minHeight: 44 }}
        >
          <Text className="text-sm text-indigo-400">Passer</Text>
        </Pressable>
      </View>
    </View>
  );
}
