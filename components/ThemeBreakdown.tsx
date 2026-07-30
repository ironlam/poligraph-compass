import { View, Text } from "react-native";
import { ConcordanceBar } from "./ConcordanceBar";
import { concordanceDisplay } from "@/lib/concordance-display";
import { THEME_LABELS } from "@/lib/theme-labels";

interface ThemeData {
  theme: string;
  agree: number;
  total: number;
  percentage: number;
}

interface Props {
  themes: ThemeData[];
}

export function ThemeBreakdown({ themes }: Props) {
  if (themes.length === 0) return null;

  return (
    <View className="gap-3">
      {themes.map((t) => {
        const config = THEME_LABELS[t.theme] || {
          label: t.theme,
          color: "#6366f1",
        };
        const color = concordanceDisplay(t.percentage).color;
        return (
          <View key={t.theme}>
            <View className="flex-row justify-between mb-1">
              <Text className="text-sm font-body-700 text-ink">
                {config.label}
              </Text>
              <Text className="text-sm font-display" style={{ color }}>
                {t.percentage}%
              </Text>
            </View>
            <ConcordanceBar score={t.percentage} color={color} height={6} />
            <Text className="text-xs font-body text-gray-400 mt-0.5">
              {t.agree}/{t.total} votes
            </Text>
          </View>
        );
      })}
    </View>
  );
}
