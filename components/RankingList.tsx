import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { HeroCard } from "./HeroCard";
import { RankingItem } from "./RankingItem";
import { DeputyPinnedCard } from "./DeputyPinnedCard";
import type { ConcordanceEntry } from "@/lib/types";

interface Props {
  politicians: ConcordanceEntry[];
  parties: ConcordanceEntry[];
  pinnedDeputy?: ConcordanceEntry | null;
}

export function RankingList({ politicians, parties, pinnedDeputy }: Props) {
  const [tab, setTab] = useState<"politicians" | "parties">("politicians");
  const data = tab === "politicians" ? politicians : parties;
  const [first, ...rest] = data;

  return (
    <View className="mt-8">
      <Text className="text-xl font-extrabold text-gray-900 px-6 mb-4">
        Les députés qui votent comme toi
      </Text>

      {/* Tabs */}
      <View className="flex-row mx-6 mb-5 gap-4" accessibilityRole="tablist">
        <Pressable
          onPress={() => setTab("politicians")}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === "politicians" }}
          accessibilityLabel="Classement des élus"
          style={{ minHeight: 44 }}
        >
          <Text
            className={`text-sm font-bold pb-2 ${
              tab === "politicians"
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-400"
            }`}
          >
            Élus
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab("parties")}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === "parties" }}
          accessibilityLabel="Classement des partis"
          style={{ minHeight: 44 }}
        >
          <Text
            className={`text-sm font-bold pb-2 ${
              tab === "parties"
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-400"
            }`}
          >
            Partis
          </Text>
        </Pressable>
      </View>

      {data.length === 0 ? (
        <View className="px-6 py-8 items-center">
          <Text className="text-gray-400 text-sm text-center">
            Données non disponibles.{"\n"}
            Les résultats apparaîtront après synchronisation.
          </Text>
        </View>
      ) : (
        <View className="px-6 gap-2">
          {pinnedDeputy && tab === "politicians" && (
            <View className="mb-2">
              <DeputyPinnedCard entry={pinnedDeputy} />
            </View>
          )}
          {first && <HeroCard entry={first} />}
          {rest.slice(0, 19).map((entry, index) => (
            <RankingItem key={entry.id} entry={entry} rank={index + 2} />
          ))}
        </View>
      )}
    </View>
  );
}
