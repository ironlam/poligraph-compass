import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  FadeInRight,
  FadeOutLeft,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { ThemeBadge } from "./ThemeBadge";
import { ScrutinBottomSheet } from "./ScrutinBottomSheet";
import type { QuizQuestion, UserAnswer } from "@/lib/types";

interface Props {
  question: QuizQuestion;
  onAnswer: (answer: UserAnswer) => void;
}

const SWIPE_THRESHOLD = 100;

const ANSWER_COLORS: Record<string, string> = {
  POUR: "rgba(16, 185, 129, 0.12)",
  CONTRE: "rgba(239, 68, 68, 0.12)",
  ABSTENTION: "rgba(156, 163, 175, 0.12)",
};

const BUTTONS: { answer: UserAnswer; label: string; className: string }[] = [
  { answer: "POUR", label: "Pour", className: "bg-emerald-500 active:bg-emerald-600" },
  { answer: "CONTRE", label: "Contre", className: "bg-red-500 active:bg-red-600" },
  { answer: "ABSTENTION", label: "Sans avis", className: "bg-gray-200 active:bg-gray-300" },
];

export function QuizCard({ question, onAnswer }: Props) {
  const translateX = useSharedValue(0);
  const bgOpacity = useSharedValue(0);
  const [flashColor, setFlashColor] = useState("transparent");
  const [showContext, setShowContext] = useState(false);
  const hasContext = question.officialTitle || question.summary;

  function handleAnswer(answer: UserAnswer) {
    const color = ANSWER_COLORS[answer] || "transparent";
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
      }
      translateX.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedFlashStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        entering={FadeInRight.duration(300)}
        exiting={FadeOutLeft.duration(200)}
        style={animatedStyle}
        className="flex-1 px-6 pt-4 pb-8"
      >
        <Animated.View
          style={[
            animatedFlashStyle,
            {
              ...StyleSheet.absoluteFillObject,
              backgroundColor: flashColor,
              borderRadius: 16,
            },
          ]}
          pointerEvents="none"
        />
        <ThemeBadge theme={question.theme} />

        <Text className="text-xl font-bold text-gray-900 mt-4 leading-7">
          {question.question}
        </Text>

        <Text className="text-sm text-gray-400 mt-2">
          {question.chamber === "AN" ? "Voté à l'Assemblée nationale" : "Voté au Sénat"}
          {question.votingDate ? ` le ${question.votingDate}` : ""}
        </Text>

        {hasContext && (
          <Pressable onPress={() => setShowContext(true)} className="mt-3">
            <Text className="text-sm text-indigo-500 font-semibold">
              {"Comprendre ce vote \u2192"}
            </Text>
          </Pressable>
        )}

        <ScrutinBottomSheet
          question={question}
          visible={showContext}
          onClose={() => setShowContext(false)}
        />

        <View className="mt-auto gap-3">
          {BUTTONS.map(({ answer, label, className }) => (
            <Pressable
              key={answer}
              onPress={() => handleAnswer(answer)}
              accessibilityRole="button"
              accessibilityLabel={label}
              className={`py-4 rounded-xl items-center ${className}`}
              style={{ minHeight: 48 }}
            >
              <Text
                className={`text-base font-bold ${answer === "ABSTENTION" ? "text-gray-500" : "text-white"}`}
              >
                {label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => onAnswer("SKIP")}
            accessibilityRole="button"
            accessibilityLabel="Passer cette question"
            className="py-2 items-center"
          >
            <Text className="text-sm text-gray-400">Passer</Text>
          </Pressable>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}
