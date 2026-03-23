import { View, Text, Pressable, Modal, ScrollView } from "react-native";
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
      <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10 max-h-[75%]">
        <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-4" />

        <ScrollView showsVerticalScrollIndicator={false}>
          <ThemeBadge theme={question.theme} />

          <Text className="text-lg font-extrabold text-gray-900 mt-3">
            Comprendre ce vote
          </Text>

          {/* Full educational summary with POUR/CONTRE arguments */}
          {question.summary && (
            <Text className="text-sm text-gray-700 mt-3 leading-5">
              {question.summary}
            </Text>
          )}

          {/* Vote result */}
          {question.result && (
            <View className="mt-4 bg-slate-50 rounded-xl p-3">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Résultat du vote
              </Text>
              <View className="flex-row items-center gap-2">
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
            </View>
          )}

          {/* Official title as reference, deemphasized */}
          {question.officialTitle && (
            <View className="mt-4">
              <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Intitulé officiel
              </Text>
              <Text className="text-xs text-gray-400 leading-4">
                {question.officialTitle}
              </Text>
            </View>
          )}
        </ScrollView>

        <Pressable
          onPress={onClose}
          className="mt-4 py-3 bg-gray-100 rounded-2xl items-center active:bg-gray-200"
        >
          <Text className="text-sm font-bold text-gray-700">Fermer</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
