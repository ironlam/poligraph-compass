import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { ThemeBadge } from "./ThemeBadge";
import { ScrutinBottomSheet } from "./ScrutinBottomSheet";
import { NeutralPositionHelp } from "./NeutralPositionHelp";
import { THEME_LABELS } from "@/lib/theme-labels";
import type { QuizQuestion } from "@/lib/types";

interface Props {
  question: QuizQuestion;
}

const SUMMARY_TRUNCATE_THRESHOLD = 180;

export function QuizCard({ question }: Props) {
  const [showContext, setShowContext] = useState(false);

  const themeConfig = THEME_LABELS[question.theme] || {
    label: question.theme,
    color: "#6366f1",
  };
  const hasFullContext = question.officialTitle || question.voteCount;
  const shortSummary = question.summary
    ? question.summary.length > SUMMARY_TRUNCATE_THRESHOLD
      ? question.summary.split(/(?<=[.!?])\s/)[0] || question.summary
      : question.summary
    : null;

  return (
    <>
      <Animated.View
        entering={FadeIn.duration(250)}
        exiting={FadeOut.duration(150)}
        style={{ flex: 1 }}
      >
        <View
          className="flex-1 mx-5 mt-4 overflow-hidden"
          style={{
            backgroundColor: "#fff",
            borderRadius: 22,
            borderWidth: 1,
            borderColor: "#e8eaf0",
            shadowColor: "#1e1b4b",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.15,
            shadowRadius: 18,
            elevation: 2,
          }}
        >
          <ScrollView
            className="flex-1"
            bounces={false}
            showsVerticalScrollIndicator={false}
          >
            {/* Themed header area */}
            <View
              style={{ backgroundColor: themeConfig.color + "12" }}
              className="px-5 pt-5 pb-4"
            >
              <ThemeBadge theme={question.theme} />
              <Text
                className="font-display text-ink mt-3"
                style={{ fontSize: 24, lineHeight: 30 }}
              >
                {question.question}
              </Text>
              <Text
                className="font-body mt-2 uppercase"
                style={{ color: "#9aa0ae", fontSize: 11, letterSpacing: 0.5 }}
              >
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
                className="mx-4 mt-3 mb-3 rounded-xl p-3"
                style={{
                  backgroundColor: "#f6f7fb",
                  borderWidth: 1,
                  borderColor: "#e8eaf0",
                }}
              >
                <Text
                  className="font-body"
                  style={{ color: "#6b7280", fontSize: 12.5, lineHeight: 18 }}
                >
                  {shortSummary}
                </Text>
                <Text
                  className="font-body-700 mt-2"
                  style={{ color: "#4f46e5", fontSize: 12.5 }}
                >
                  {"En savoir plus →"}
                </Text>
              </Pressable>
            ) : hasFullContext ? (
              <Pressable
                onPress={() => setShowContext(true)}
                accessibilityRole="button"
                accessibilityLabel="Comprendre ce vote"
                className="mx-4 mt-3 mb-3"
              >
                <Text
                  className="font-body-700"
                  style={{ color: "#4f46e5", fontSize: 12.5 }}
                >
                  {"Comprendre ce vote →"}
                </Text>
              </Pressable>
            ) : null}

            {/* Ce vote concerne — metadata row */}
            <View className="mx-4 mt-3 mb-1">
              <Text
                className="font-body uppercase"
                style={{ color: "#9aa0ae", fontSize: 10, letterSpacing: 0.6 }}
              >
                Ce vote concerne
              </Text>
              <Text
                className="font-body mt-0.5"
                style={{ color: "#6b7280", fontSize: 12 }}
              >
                {[
                  themeConfig.label,
                  question.chamber === "AN" ? "Assemblée nationale" : "Sénat",
                  question.votingDate,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </View>

            {/* Aide neutre Pour / Contre, fallback ou positionHelp si présent */}
            <View className="mx-4 mb-4">
              <NeutralPositionHelp help={question.positionHelp} />
            </View>
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
