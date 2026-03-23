import { View, Text } from "react-native";
import { ConcordanceBar } from "./ConcordanceBar";
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

function getBarColor(pct: number): string {
  if (pct >= 60) return "#10b981";
  if (pct >= 40) return "#f59e0b";
  return "#ef4444";
}

export function ThemeBreakdown({ themes }: Props) {
  if (themes.length === 0) return null;

  return (
    <View className="gap-3">
      {themes.map((t) => {
        const config = THEME_LABELS[t.theme] || { label: t.theme, color: "#6366f1" };
        return (
          <View key={t.theme}>
            <View className="flex-row justify-between mb-1">
              <Text className="text-sm font-semibold text-gray-700">
                {config.label}
              </Text>
              <Text className="text-sm font-bold" style={{ color: getBarColor(t.percentage) }}>
                {t.percentage}%
              </Text>
            </View>
            <ConcordanceBar score={t.percentage} color={getBarColor(t.percentage)} height={6} />
            <Text className="text-xs text-gray-400 mt-0.5">
              {t.agree}/{t.total} votes
            </Text>
          </View>
        );
      })}
    </View>
  );
}
