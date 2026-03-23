import React from "react";
import { View, Text, Switch } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Compass } from "./Compass";
import { useQuizStore } from "@/lib/store";
import { getQuadrantLabel } from "@/lib/theme-labels";

interface Props {
  captureRef?: React.RefObject<View | null>;
}

export function SharePreview({ captureRef }: Props) {
  const { results, showPartiesOnShare, toggleShowPartiesOnShare, partyPositions } = useQuizStore();

  if (!results) return null;

  const { position, parties } = results;
  const hasValidPosition = position.xValid && position.yValid;
  const quadrantLabel = hasValidPosition ? getQuadrantLabel(position.x, position.y) : null;
  const topParties = parties.slice(0, 3);

  return (
    <View className="mx-6">
      <View ref={captureRef} collapsable={false} className="rounded-2xl overflow-hidden">
        <LinearGradient
          colors={["#1e1b4b", "#0f0a2e", "#000000"]}
          style={{ padding: 24, alignItems: "center" }}
        >
          <Text className="text-sm text-indigo-400 font-semibold mb-4">
            Ma Boussole Politique
          </Text>

          <Compass
            userPosition={position}
            parties={showPartiesOnShare ? parties : []}
            partyPositions={showPartiesOnShare ? (partyPositions ?? undefined) : undefined}
          />

          {quadrantLabel && (
            <Text className="text-white text-center mt-4 font-extrabold text-xl">
              {quadrantLabel}
            </Text>
          )}

          {topParties.length > 0 && (
            <View className="mt-4 gap-1">
              {topParties.map((party, i) => (
                <Text key={party.id} className="text-indigo-300 text-xs text-center">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}{" "}
                  {party.name} ({party.score}%)
                </Text>
              ))}
            </View>
          )}

          <Text className="text-indigo-200 text-center mt-6 font-bold text-lg">
            Et toi, tu es où ?
          </Text>
          <Text className="text-indigo-500 text-xs mt-1">
            poligraph.fr
          </Text>
        </LinearGradient>
      </View>

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
