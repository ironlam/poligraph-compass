import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { RankingItem } from "./RankingItem";
import type { ConcordanceEntry } from "@/lib/types";

interface Props {
  politicians: ConcordanceEntry[];
  parties: ConcordanceEntry[];
}

export function RankingList({ politicians, parties }: Props) {
  const [tab, setTab] = useState<"politicians" | "parties">("politicians");
  const data = tab === "politicians" ? politicians : parties;

  return (
    <View className="mt-6">
      <Text className="text-lg font-bold text-gray-900 px-6 mb-3">
        Les élus qui votent comme vous
      </Text>

      <View className="flex-row border-b-2 border-gray-200 mx-6 mb-4">
        <Pressable
          onPress={() => setTab("politicians")}
          className={`pb-2 mr-6 ${tab === "politicians" ? "border-b-2 border-indigo-500" : ""}`}
        >
          <Text className={`text-sm font-semibold ${tab === "politicians" ? "text-indigo-500" : "text-gray-400"}`}>
            Élus
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab("parties")}
          className={`pb-2 ${tab === "parties" ? "border-b-2 border-indigo-500" : ""}`}
        >
          <Text className={`text-sm font-semibold ${tab === "parties" ? "text-indigo-500" : "text-gray-400"}`}>
            Partis
          </Text>
        </Pressable>
      </View>

      <View className="px-6 gap-2">
        {data.slice(0, 20).map((entry, index) => (
          <RankingItem key={entry.id} entry={entry} rank={index + 1} />
        ))}
      </View>
    </View>
  );
}
