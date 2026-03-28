import { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { ThemeBadge } from "./ThemeBadge";
import { ScrutinBottomSheet } from "./ScrutinBottomSheet";
import { THEME_LABELS } from "@/lib/theme-labels";
import type { QuizQuestion, UserAnswer } from "@/lib/types";

interface Props {
  question: QuizQuestion;
  onAnswer: (answer: UserAnswer) => void;
}

const SWIPE_THRESHOLD = 100;

const FLASH_COLORS: Record<string, string> = {
  POUR: "rgba(16, 185, 129, 0.12)",
  CONTRE: "rgba(239, 68, 68, 0.12)",
  ABSTENTION: "rgba(156, 163, 175, 0.12)",
};

export function QuizCard({ question, onAnswer }: Props) {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const bgOpacity = useSharedValue(0);
  const [flashColor, setFlashColor] = useState("transparent");
  const [showContext, setShowContext] = useState(false);

  const themeConfig = THEME_LABELS[question.theme] || { label: question.theme, color: "#6366f1" };
  const hasFullContext = question.officialTitle || question.voteCount;
  // Card shows only the first sentence (context hook), bottom sheet shows the full explanation
  const shortSummary = question.summary?.split(/(?<=[.!?])\s/)[0] || null;

  function handleAnswer(answer: UserAnswer) {
    const color = FLASH_COLORS[answer] || "transparent";
    setFlashColor(color);
    bgOpacity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(0, { duration: 200 })
    );
    setTimeout(() => onAnswer(answer), 200);
  }

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        runOnJS(handleAnswer)("POUR");
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        runOnJS(handleAnswer)("CONTRE");
      } else if (Math.abs(event.translationX) > 20) {
        // Pulse effect: subtle squeeze when swipe doesn't reach threshold
        scale.value = withSequence(
          withTiming(0.97, { duration: 100 }),
          withTiming(1, { duration: 150 })
        );
      }
      translateX.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.quad) });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  const animatedFlashStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  return (
    <>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          entering={FadeIn.duration(250)}
          exiting={FadeOut.duration(150)}
          style={animatedStyle}
          className="flex-1 px-5 pt-4 pb-4"
        >
          {/* Card */}
          <View className="flex-1 rounded-2xl shadow-sm overflow-hidden" style={{ backgroundColor: "#FAFAF8" }}>
            {/* Flash overlay */}
            <Animated.View
              style={[
                animatedFlashStyle,
                {
                  ...StyleSheet.absoluteFillObject,
                  backgroundColor: flashColor,
                  zIndex: 10,
                },
              ]}
              pointerEvents="none"
            />

            {/* Scrollable content area */}
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

              {/* Context area: short hook on card, full explanation in bottom sheet */}
              {shortSummary ? (
                <Pressable onPress={() => setShowContext(true)} className="mx-4 mt-3 mb-3 bg-white rounded-xl p-3 border border-slate-100">
                  <Text className="text-xs text-slate-500 leading-4">
                    {shortSummary}
                  </Text>
                  <Text className="text-xs text-indigo-500 font-semibold mt-2">
                    {"En savoir plus \u2192"}
                  </Text>
                </Pressable>
              ) : hasFullContext ? (
                <Pressable onPress={() => setShowContext(true)} className="mx-4 mt-3 mb-3">
                  <Text className="text-xs text-indigo-500 font-semibold">
                    {"Comprendre ce vote \u2192"}
                  </Text>
                </Pressable>
              ) : null}
            </ScrollView>

            {/* Answer buttons — fixed at bottom of card */}
            <View className="px-4 pb-5 pt-2 gap-2.5">
              <Pressable
                onPress={() => handleAnswer("POUR")}
                accessibilityRole="button"
                accessibilityLabel="Pour"
                className="py-3.5 rounded-2xl items-center bg-emerald-600 active:bg-emerald-700"
                style={{ minHeight: 48 }}
              >
                <Text className="text-base font-bold text-white tracking-wide">Pour</Text>
              </Pressable>
              <Pressable
                onPress={() => handleAnswer("CONTRE")}
                accessibilityRole="button"
                accessibilityLabel="Contre"
                className="py-3.5 rounded-2xl items-center bg-red-600 active:bg-red-700"
                style={{ minHeight: 48 }}
              >
                <Text className="text-base font-bold text-white tracking-wide">Contre</Text>
              </Pressable>
              <Pressable
                onPress={() => handleAnswer("ABSTENTION")}
                accessibilityRole="button"
                accessibilityLabel="Sans avis"
                className="py-3.5 rounded-2xl items-center bg-white border border-slate-200 active:bg-slate-50"
                style={{ minHeight: 48 }}
              >
                <Text className="text-base font-semibold text-slate-400 tracking-wide">Sans avis</Text>
              </Pressable>
            </View>
          </View>

          {/* Skip below card */}
          <Pressable
            onPress={() => onAnswer("SKIP")}
            accessibilityRole="button"
            accessibilityLabel="Passer cette question"
            className="py-3 items-center mt-2"
          >
            <Text className="text-sm text-indigo-400">Passer</Text>
          </Pressable>
        </Animated.View>
      </GestureDetector>

      {/* Bottom sheet — must be outside the card's overflow-hidden container
          so Modal portals correctly on web */}
      <ScrutinBottomSheet
        question={question}
        visible={showContext}
        onClose={() => setShowContext(false)}
      />
    </>
  );
}
