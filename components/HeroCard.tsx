import { View, Text, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { ConcordanceBar } from "./ConcordanceBar";
import type { ConcordanceEntry } from "@/lib/types";

interface Props {
  entry: ConcordanceEntry;
}

function getConcordanceColor(value: number): string {
  if (value >= 60) return "#10b981";
  if (value >= 40) return "#f59e0b";
  return "#ef4444";
}

export function HeroCard({ entry }: Props) {
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
      accessibilityLabel={`${entry.name}, ${entry.partyShortName ?? ""}, ${entry.score}% de concordance`}
      className="rounded-2xl bg-gray-50 p-5 active:bg-gray-100"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: partyColor,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      <View className="flex-row items-center gap-4">
        {entry.photoUrl ? (
          <Image
            source={{ uri: entry.photoUrl }}
            accessibilityLabel={`Photo de ${entry.name}`}
            className="w-16 h-16 rounded-full"
            style={{ borderWidth: 3, borderColor: partyColor }}
          />
        ) : (
          <View
            className="w-16 h-16 rounded-full bg-gray-200 items-center justify-center"
            style={{ borderWidth: 3, borderColor: partyColor }}
          >
            <Text className="text-lg text-gray-400 font-bold">
              {entry.name.charAt(0)}
            </Text>
          </View>
        )}

        <View className="flex-1">
          <Text className="text-base font-extrabold text-gray-900">
            {entry.name}
          </Text>
          {entry.partyShortName && (
            <Text className="text-sm font-semibold mt-0.5" style={{ color: partyColor }}>
              {entry.partyShortName}
            </Text>
          )}
          <Text className="text-xs text-gray-400 mt-1">
            D'accord sur {entry.agree} votes sur {entry.overlap}
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-2xl font-extrabold" style={{ color }}>
            {entry.score}%
          </Text>
        </View>
      </View>

      <View className="mt-3">
        <ConcordanceBar score={entry.score} color={color} height={6} />
      </View>
    </Pressable>
  );
}
