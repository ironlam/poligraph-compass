import { View, Text, Pressable, Linking } from "react-native";
import type { ConcordanceEntry } from "@/lib/types";

interface Props {
  entry: ConcordanceEntry;
  rank: number;
}

function getConcordanceColor(value: number): string {
  if (value >= 60) return "#10b981";
  if (value >= 40) return "#f59e0b";
  return "#ef4444";
}

export function RankingItem({ entry, rank }: Props) {
  const color = getConcordanceColor(entry.score);

  function handlePress() {
    if (entry.slug) {
      Linking.openURL(`https://poligraph.fr/politiques/${entry.slug}`);
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      className={`flex-row items-center gap-3 px-4 py-3 rounded-xl ${rank === 1 ? "bg-emerald-50" : "bg-gray-50"}`}
    >
      <Text className="text-base font-bold text-gray-400 w-6 text-center">
        {rank}
      </Text>
      <View className="w-8 h-8 bg-gray-200 rounded-full" />
      <View className="flex-1">
        <Text className="text-sm font-bold text-gray-900">{entry.name}</Text>
        {entry.partyShortName && (
          <Text className="text-xs text-gray-400">{entry.partyShortName}</Text>
        )}
      </View>
      <View className="items-end">
        <Text className="text-base font-bold" style={{ color }}>
          {entry.score}%
        </Text>
        <Text className="text-xs text-gray-400">
          sur {entry.overlap} votes
        </Text>
      </View>
    </Pressable>
  );
}
