import { View, Text, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { ConcordanceBar } from "./ConcordanceBar";
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
  const router = useRouter();
  const color = getConcordanceColor(entry.score);
  const partyColor = entry.partyColor || "#9ca3af";

  function handlePress() {
    router.push(`/politician/${entry.id}`);
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${rank}e, ${entry.name}, ${entry.partyShortName ?? ""}, ${entry.score}%`}
      className="flex-row items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 active:bg-gray-100"
      style={{ borderLeftWidth: 3, borderLeftColor: partyColor, minHeight: 48 }}
    >
      <Text className="text-sm font-extrabold text-gray-300 w-6 text-center" aria-hidden>
        {rank}
      </Text>

      {entry.photoUrl ? (
        <Image
          source={{ uri: entry.photoUrl }}
          accessibilityLabel={`Photo de ${entry.name}`}
          className="w-10 h-10 rounded-full"
          style={{ borderWidth: 2, borderColor: partyColor }}
        />
      ) : (
        <View
          className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center"
          style={{ borderWidth: 2, borderColor: partyColor }}
        >
          <Text className="text-xs text-gray-400" aria-hidden>
            {entry.name.charAt(0)}
          </Text>
        </View>
      )}

      <View className="flex-1">
        <Text className="text-sm font-bold text-gray-900">{entry.name}</Text>
        {entry.partyShortName && (
          <Text className="text-xs font-semibold" style={{ color: partyColor }}>
            {entry.partyShortName}
          </Text>
        )}
        <View className="mt-1">
          <ConcordanceBar score={entry.score} color={color} />
        </View>
      </View>

      <View className="items-end">
        <Text className="text-lg font-extrabold" style={{ color }}>
          {entry.score}%
        </Text>
        <Text className="text-xs text-gray-400">
          {entry.overlap} votes
        </Text>
      </View>
    </Pressable>
  );
}
