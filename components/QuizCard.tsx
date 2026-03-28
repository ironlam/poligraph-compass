import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { ThemeBadge } from "./ThemeBadge";
import { ScrutinBottomSheet } from "./ScrutinBottomSheet";
import { THEME_LABELS } from "@/lib/theme-labels";
import type { QuizQuestion } from "@/lib/types";

interface Props {
  question: QuizQuestion;
}

export function QuizCard({ question }: Props) {
  const [showContext, setShowContext] = useState(false);

  const themeConfig = THEME_LABELS[question.theme] || { label: question.theme, color: "#6366f1" };
  const hasFullContext = question.officialTitle || question.voteCount;
  const shortSummary = question.summary?.split(/(?<=[.!?])\s/)[0] || null;

  return (
    <>
      <Animated.View
        entering={FadeIn.duration(250)}
        exiting={FadeOut.duration(150)}
        style={{ flex: 1 }}
      >
        <View className="flex-1 mx-5 mt-4 rounded-2xl shadow-sm overflow-hidden" style={{ backgroundColor: "#FAFAF8" }}>
          <ScrollView className="flex-1" bounces={false} showsVerticalScrollIndicator={false}>
            {/* Themed header area */}
            <View style={{ backgroundColor: themeConfig.color + "12" }} className="px-5 pt-5 pb-4">
              <ThemeBadge theme={question.theme} />
              <Text className="text-2xl font-black text-gray-900 mt-3 leading-8">
                {question.question}
              </Text>
              <Text className="text-xs text-gray-400 mt-2 tracking-wide uppercase">
                {question.chamber === "AN" ? "Assemblée nationale" : "Sénat"}
                {question.votingDate ? ` · ${question.votingDate}` : ""}
              </Text>
            </View>

            {/* Context area */}
            {shortSummary ? (
              <Pressable
                onPress={() => setShowContext(true)}
                accessibilityRole="button"
                accessibilityLabel="En savoir plus sur ce vote"
                className="mx-4 mt-3 mb-3 bg-white rounded-xl p-3 border border-slate-100"
              >
                <Text className="text-xs text-slate-500 leading-4">
                  {shortSummary}
                </Text>
                <Text className="text-xs text-indigo-500 font-semibold mt-2">
                  {"En savoir plus \u2192"}
                </Text>
              </Pressable>
            ) : hasFullContext ? (
              <Pressable
                onPress={() => setShowContext(true)}
                accessibilityRole="button"
                accessibilityLabel="Comprendre ce vote"
                className="mx-4 mt-3 mb-3"
              >
                <Text className="text-xs text-indigo-500 font-semibold">
                  {"Comprendre ce vote \u2192"}
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </View>
      </Animated.View>

      <ScrutinBottomSheet
        question={question}
        visible={showContext}
        onClose={() => setShowContext(false)}
      />
    </>
  );
}
