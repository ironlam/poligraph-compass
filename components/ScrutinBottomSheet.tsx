import { View, Text, Pressable, Modal } from "react-native";
import { ThemeBadge } from "./ThemeBadge";
import type { QuizQuestion } from "@/lib/types";

interface Props {
  question: QuizQuestion;
  visible: boolean;
  onClose: () => void;
}

export function ScrutinBottomSheet({ question, visible, onClose }: Props) {
  const hasContext = question.officialTitle || question.summary;

  if (!hasContext) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10">
        <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-4" />

        <ThemeBadge theme={question.theme} />

        {question.officialTitle && (
          <Text className="text-base font-extrabold text-gray-900 mt-3">
            {question.officialTitle}
          </Text>
        )}

        {question.summary && (
          <Text className="text-sm text-gray-600 mt-3 leading-5">
            {question.summary}
          </Text>
        )}

        {question.result && (
          <View className="mt-4 flex-row items-center gap-2">
            <View className={`px-3 py-1 rounded-full ${question.result === "adopte" ? "bg-emerald-100" : "bg-red-100"}`}>
              <Text className={`text-xs font-bold ${question.result === "adopte" ? "text-emerald-700" : "text-red-700"}`}>
                {question.result === "adopte" ? "Adopté" : "Rejeté"}
              </Text>
            </View>
            {question.voteCount && (
              <Text className="text-xs text-gray-400">
                {question.voteCount.pour} pour · {question.voteCount.contre} contre · {question.voteCount.abstention} abs.
              </Text>
            )}
          </View>
        )}

        <Pressable
          onPress={onClose}
          className="mt-6 py-3 bg-gray-100 rounded-2xl items-center active:bg-gray-200"
        >
          <Text className="text-sm font-bold text-gray-700">Fermer</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
