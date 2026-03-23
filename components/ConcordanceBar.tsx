import { View } from "react-native";

interface Props {
  score: number; // 0-100
  color: string;
  height?: number;
}

export function ConcordanceBar({ score, color, height = 4 }: Props) {
  return (
    <View
      className="w-full rounded-full overflow-hidden bg-gray-200"
      style={{ height }}
    >
      <View
        className="h-full rounded-full"
        style={{ width: `${score}%`, backgroundColor: color }}
      />
    </View>
  );
}
