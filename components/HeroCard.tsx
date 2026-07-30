import { View, Text, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { ConcordanceBar } from "./ConcordanceBar";
import { concordanceDisplay } from "@/lib/concordance-display";
import type { ConcordanceEntry } from "@/lib/types";

interface Props {
  entry: ConcordanceEntry;
}

export function HeroCard({ entry }: Props) {
  const router = useRouter();
  const { color, bg, label } = concordanceDisplay(entry.score);
  const partyColor = entry.partyColor || "#9ca3af";

  function handlePress() {
    router.push(`/politician/${entry.id}`);
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${entry.name}, ${entry.partyShortName ?? ""}, ${entry.score}% de concordance, ${label}`}
      className="bg-white active:opacity-90"
      style={{
        borderRadius: 22,
        borderWidth: 1,
        borderColor: "#e8eaf0",
        borderLeftWidth: 5,
        borderLeftColor: partyColor,
        padding: 18,
        shadowColor: "#1e1b4b",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
        elevation: 3,
      }}
    >
      <View className="flex-row items-center" style={{ gap: 15 }}>
        {entry.photoUrl ? (
          <Image
            source={{ uri: entry.photoUrl }}
            accessibilityLabel={`Photo de ${entry.name}`}
            style={{
              width: 62,
              height: 62,
              borderRadius: 31,
              borderWidth: 3,
              borderColor: partyColor,
            }}
          />
        ) : (
          <View
            className="items-center justify-center"
            style={{
              width: 62,
              height: 62,
              borderRadius: 31,
              backgroundColor: partyColor,
              borderWidth: 3,
              borderColor: partyColor,
            }}
          >
            <Text className="font-display text-white" style={{ fontSize: 22 }}>
              {entry.name.charAt(0)}
            </Text>
          </View>
        )}

        <View className="flex-1">
          <Text className="font-display text-ink" style={{ fontSize: 18 }}>
            {entry.name}
          </Text>
          {entry.partyShortName && (
            <Text
              className="font-body-700"
              style={{ color: partyColor, fontSize: 13.5, marginTop: 1 }}
            >
              {entry.partyShortName}
            </Text>
          )}
          <Text
            className="font-body"
            style={{ color: "#6b7280", fontSize: 12.5, marginTop: 4 }}
          >
            D'accord sur {entry.agree} votes sur {entry.overlap}
          </Text>
        </View>

        <View className="items-end">
          <Text
            className="font-display"
            style={{ color, fontSize: 30, lineHeight: 32 }}
          >
            {entry.score}%
          </Text>
          <View
            style={{
              backgroundColor: bg,
              borderRadius: 999,
              paddingHorizontal: 9,
              paddingVertical: 2,
              marginTop: 5,
            }}
          >
            <Text className="font-body-700" style={{ color, fontSize: 11 }}>
              {label}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ marginTop: 14 }}>
        <ConcordanceBar score={entry.score} color={color} height={8} />
      </View>
    </Pressable>
  );
}
