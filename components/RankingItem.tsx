import { View, Text, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { ConcordanceBar } from "./ConcordanceBar";
import { concordanceDisplay } from "@/lib/concordance-display";
import type { ConcordanceEntry } from "@/lib/types";

interface Props {
  entry: ConcordanceEntry;
  rank: number;
}

export function RankingItem({ entry, rank }: Props) {
  const router = useRouter();
  const { color, label } = concordanceDisplay(entry.score);
  const partyColor = entry.partyColor || "#9ca3af";

  function handlePress() {
    router.push(`/politician/${entry.id}`);
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${rank}e, ${entry.name}, ${entry.partyShortName ?? ""}, ${entry.score}%, ${label}`}
      className="flex-row items-center active:opacity-90"
      style={{
        gap: 13,
        paddingVertical: 13,
        paddingHorizontal: 15,
        borderRadius: 18,
        backgroundColor: "#f6f7fb",
        borderLeftWidth: 4,
        borderLeftColor: partyColor,
        minHeight: 48,
      }}
    >
      <Text
        className="font-display text-center"
        style={{ color: "#b7bccb", fontSize: 15, width: 20 }}
        aria-hidden
      >
        {rank}
      </Text>

      {entry.photoUrl ? (
        <Image
          source={{ uri: entry.photoUrl }}
          accessibilityLabel={`Photo de ${entry.name}`}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            borderWidth: 2,
            borderColor: partyColor,
          }}
        />
      ) : (
        <View
          className="items-center justify-center"
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: partyColor,
            borderWidth: 2,
            borderColor: partyColor,
          }}
        >
          <Text
            className="font-display text-white"
            style={{ fontSize: 15 }}
            aria-hidden
          >
            {entry.name.charAt(0)}
          </Text>
        </View>
      )}

      <View className="flex-1">
        <Text className="font-body-700 text-ink" style={{ fontSize: 14.5 }}>
          {entry.name}
        </Text>
        {entry.partyShortName && (
          <Text
            className="font-body-700"
            style={{ color: partyColor, fontSize: 12 }}
          >
            {entry.partyShortName}
          </Text>
        )}
        <View style={{ marginTop: 8 }}>
          <ConcordanceBar score={entry.score} color={color} height={6} />
        </View>
      </View>

      <View className="items-end">
        <Text
          className="font-display"
          style={{ color, fontSize: 19, lineHeight: 21 }}
        >
          {entry.score}%
        </Text>
        <Text
          className="font-body"
          style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}
        >
          {entry.overlap} votes
        </Text>
      </View>
    </Pressable>
  );
}
