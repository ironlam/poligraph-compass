import { View, Text } from "react-native";

interface Props {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: Props) {
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <View className="flex-row items-center gap-3">
      <View className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
        <View
          className="h-full bg-indigo-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </View>
      <Text className="text-sm text-gray-400">
        {current}/{total}
      </Text>
    </View>
  );
}
