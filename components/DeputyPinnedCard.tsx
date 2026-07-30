import { View, Text, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { ConcordanceBar } from "./ConcordanceBar";
import { concordanceDisplay } from "@/lib/concordance-display";
import type { ConcordanceEntry } from "@/lib/types";

interface Props {
  entry: ConcordanceEntry;
}

export function DeputyPinnedCard({ entry }: Props) {
  const router = useRouter();
  const { color, bg, label } = concordanceDisplay(entry.score);
  const partyColor = entry.partyColor || "#9ca3af";

  function handlePress() {
    router.push("/deputy-comparison");
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Ton député ${entry.name}, ${entry.partyShortName ?? ""}, ${entry.score}% de concordance. Voir la comparaison détaillée`}
      className="rounded-2xl bg-indigo-50 p-5 active:bg-indigo-100"
      style={{
        borderWidth: 2,
        borderColor: "#6366f1",
        shadowColor: "#6366f1",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      {/* Badge */}
      <View className="bg-indigo-500 self-start px-2.5 py-0.5 rounded-full mb-3">
        <Text className="text-xs font-body-700 text-white">Ton député(e)</Text>
      </View>

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
            className="w-16 h-16 rounded-full items-center justify-center"
            style={{
              backgroundColor: partyColor,
              borderWidth: 3,
              borderColor: partyColor,
            }}
          >
            <Text className="text-lg font-display text-white">
              {entry.name.charAt(0)}
            </Text>
          </View>
        )}

        <View className="flex-1">
          <Text className="text-base font-display text-ink">{entry.name}</Text>
          {entry.partyShortName && (
            <Text
              className="text-sm font-body-700 mt-0.5"
              style={{ color: partyColor }}
            >
              {entry.partyShortName}
            </Text>
          )}
          <Text className="text-xs font-body text-gray-400 mt-1">
            D'accord sur {entry.agree} votes sur {entry.overlap}
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-2xl font-display" style={{ color }}>
            {entry.score}%
          </Text>
          <View
            style={{
              backgroundColor: bg,
              borderRadius: 999,
              paddingHorizontal: 9,
              paddingVertical: 2,
              marginTop: 4,
            }}
          >
            <Text className="font-body-700" style={{ color, fontSize: 11 }}>
              {label}
            </Text>
          </View>
        </View>
      </View>

      <View className="mt-3">
        <ConcordanceBar score={entry.score} color={color} height={6} />
      </View>

      <Text className="text-xs font-body-700 text-indigo-400 text-center mt-3">
        Voir la comparaison détaillée
      </Text>
    </Pressable>
  );
}
