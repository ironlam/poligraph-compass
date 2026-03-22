import React from "react";
import { View, Text, Switch } from "react-native";
import { Compass } from "./Compass";
import { useQuizStore } from "@/lib/store";

interface Props {
  captureRef?: React.RefObject<View | null>;
}

export function SharePreview({ captureRef }: Props) {
  const { results, showPartiesOnShare, toggleShowPartiesOnShare, partyPositions } = useQuizStore();

  if (!results) return null;

  return (
    <View className="mx-6">
      {/* Preview card (captured by view-shot) */}
      <View ref={captureRef} collapsable={false} className="bg-indigo-950 rounded-2xl p-6 items-center">
        <Text className="text-sm text-indigo-300 mb-4">Ma Boussole Politique</Text>
        <Compass
          userPosition={results.position}
          parties={showPartiesOnShare ? results.parties : []}
          partyPositions={showPartiesOnShare ? (partyPositions ?? undefined) : undefined}
        />
        <Text className="text-white text-center mt-4 font-bold text-lg">
          Et toi, tu es où ?
        </Text>
        <Text className="text-indigo-400 text-xs mt-2">
          D'après les votes réels des élus
        </Text>
      </View>

      {/* Toggle parties */}
      <View className="flex-row items-center justify-between mt-4 px-2">
        <Text className="text-sm text-gray-600">Afficher les partis proches</Text>
        <Switch
          value={showPartiesOnShare}
          onValueChange={toggleShowPartiesOnShare}
          trackColor={{ false: "#e2e8f0", true: "#818cf8" }}
          thumbColor={showPartiesOnShare ? "#6366f1" : "#f4f4f5"}
        />
      </View>
    </View>
  );
}
