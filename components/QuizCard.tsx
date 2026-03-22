import { View, Text, Pressable } from "react-native";
import Animated, {
  FadeInRight,
  FadeOutLeft,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { ThemeBadge } from "./ThemeBadge";
import type { QuizQuestion, UserAnswer } from "@/lib/types";

interface Props {
  question: QuizQuestion;
  onAnswer: (answer: UserAnswer) => void;
}

const SWIPE_THRESHOLD = 100;

const BUTTONS: { answer: UserAnswer; label: string; className: string }[] = [
  { answer: "POUR", label: "Pour", className: "bg-emerald-500 active:bg-emerald-600" },
  { answer: "CONTRE", label: "Contre", className: "bg-red-500 active:bg-red-600" },
  { answer: "ABSTENTION", label: "Sans avis", className: "bg-gray-200 active:bg-gray-300" },
];

export function QuizCard({ question, onAnswer }: Props) {
  const translateX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        runOnJS(onAnswer)("POUR");
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        runOnJS(onAnswer)("CONTRE");
      }
      translateX.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        entering={FadeInRight.duration(300)}
        exiting={FadeOutLeft.duration(200)}
        style={animatedStyle}
        className="flex-1 px-6 pt-4 pb-8"
      >
        <ThemeBadge theme={question.theme} />

        <Text className="text-xl font-bold text-gray-900 mt-4 leading-7">
          {question.question}
        </Text>

        <Text className="text-sm text-gray-400 mt-2">
          {question.chamber === "AN" ? "Voté à l'Assemblée nationale" : "Voté au Sénat"}
          {question.votingDate ? ` le ${question.votingDate}` : ""}
        </Text>

        <View className="mt-auto gap-3">
          {BUTTONS.map(({ answer, label, className }) => (
            <Pressable
              key={answer}
              onPress={() => onAnswer(answer)}
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
