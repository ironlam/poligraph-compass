import { View, Text } from "react-native";

interface Props {
  current: number;
  total: number;
  light?: boolean;
}

export function ProgressBar({ current, total, light }: Props) {
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <View className="flex-row items-center gap-3">
      <View
        className={`flex-1 h-1.5 rounded-full overflow-hidden ${light ? "bg-indigo-900" : "bg-gray-200"}`}
      >
        <View
          className={`h-full rounded-full ${light ? "bg-amber-500" : "bg-indigo-500"}`}
          style={{ width: `${progress}%` }}
        />
      </View>
      <Text className={`text-sm font-semibold ${light ? "text-indigo-300" : "text-gray-400"}`}>
        {current}/{total}
      </Text>
    </View>
  );
}
