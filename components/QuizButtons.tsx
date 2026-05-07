import { View, Text, Pressable } from "react-native";
import { QUIZ_BUTTONS, type QuizButtonConfig } from "@/lib/quiz-button-config";
import type { UserAnswer } from "@/lib/types";

interface Props {
  onAnswer: (answer: UserAnswer) => void;
}

const VARIANT_CONTAINER: Record<QuizButtonConfig["variant"], string> = {
  "primary-pour":
    "flex-1 py-3.5 rounded-2xl items-center bg-emerald-600 active:bg-emerald-700",
  "primary-contre":
    "flex-1 py-3.5 rounded-2xl items-center bg-red-600 active:bg-red-700",
  secondary:
    "flex-1 py-3 rounded-2xl items-center justify-center border border-indigo-400/30 active:bg-indigo-900/50",
  tertiary:
    "flex-1 py-3 rounded-2xl items-center justify-center active:bg-indigo-900/50",
};

const VARIANT_TEXT: Record<QuizButtonConfig["variant"], string> = {
  "primary-pour": "text-base font-bold text-white tracking-wide",
  "primary-contre": "text-base font-bold text-white tracking-wide",
  secondary: "text-sm font-semibold text-indigo-300 tracking-wide text-center",
  tertiary: "text-sm text-indigo-400",
};

const VARIANT_MIN_HEIGHT: Record<QuizButtonConfig["variant"], number> = {
  "primary-pour": 48,
  "primary-contre": 48,
  secondary: 56,
  tertiary: 44,
};

export function QuizButtons({ onAnswer }: Props) {
  const [pour, contre, abstention, skip] = QUIZ_BUTTONS;

  return (
    <View className="px-5 pb-4 pt-3 gap-2">
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => onAnswer(pour.value)}
          accessibilityRole="button"
          accessibilityLabel={pour.ariaLabel}
          className={VARIANT_CONTAINER[pour.variant]}
          style={{ minHeight: VARIANT_MIN_HEIGHT[pour.variant] }}
        >
          <Text className={VARIANT_TEXT[pour.variant]}>{pour.label}</Text>
        </Pressable>
        <Pressable
          onPress={() => onAnswer(contre.value)}
          accessibilityRole="button"
          accessibilityLabel={contre.ariaLabel}
          className={VARIANT_CONTAINER[contre.variant]}
          style={{ minHeight: VARIANT_MIN_HEIGHT[contre.variant] }}
        >
          <Text className={VARIANT_TEXT[contre.variant]}>{contre.label}</Text>
        </Pressable>
      </View>
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => onAnswer(abstention.value)}
          accessibilityRole="button"
          accessibilityLabel={abstention.ariaLabel}
          className={VARIANT_CONTAINER[abstention.variant]}
          style={{ minHeight: VARIANT_MIN_HEIGHT[abstention.variant] }}
        >
          <Text
            className={VARIANT_TEXT[abstention.variant]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {abstention.label}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onAnswer(skip.value)}
          accessibilityRole="button"
          accessibilityLabel={skip.ariaLabel}
          className={VARIANT_CONTAINER[skip.variant]}
          style={{ minHeight: VARIANT_MIN_HEIGHT[skip.variant] }}
        >
          <Text className={VARIANT_TEXT[skip.variant]}>{skip.label}</Text>
        </Pressable>
      </View>
    </View>
  );
}
