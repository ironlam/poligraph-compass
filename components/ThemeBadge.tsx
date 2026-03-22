import { View, Text } from "react-native";
import { THEME_LABELS } from "@/lib/theme-labels";

export function ThemeBadge({ theme }: { theme: string }) {
  const config = THEME_LABELS[theme] || { label: theme, color: "#6366f1" };

  return (
    <View
      className="self-start px-3 py-1 rounded-full"
      style={{ backgroundColor: config.color + "20" }}
    >
      <Text className="text-xs font-semibold" style={{ color: config.color }}>
        {config.label}
      </Text>
    </View>
  );
}
