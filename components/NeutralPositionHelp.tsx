import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { NEUTRAL_FALLBACKS } from "@/lib/wording-rules";

interface PositionHelp {
  pour: string;
  contre: string;
  abstention?: string;
}

export function NeutralPositionHelp({ help }: { help?: PositionHelp }) {
  const [open, setOpen] = useState(false);

  const pourText = help?.pour ?? NEUTRAL_FALLBACKS.POUR;
  const contreText = help?.contre ?? NEUTRAL_FALLBACKS.CONTRE;

  return (
    <View className="mt-3 rounded-lg border border-gray-200 p-3">
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityLabel={open ? "Masquer l'aide" : "Afficher l'aide"}
      >
        <Text className="text-sm font-medium">
          {open ? "Masquer l'aide" : "Comprendre Pour / Contre"}
        </Text>
      </Pressable>
      {open && (
        <View className="mt-2 space-y-2">
          <Text className="text-sm">
            <Text className="font-semibold">Pour :</Text> {pourText}
          </Text>
          <Text className="text-sm">
            <Text className="font-semibold">Contre :</Text> {contreText}
          </Text>
        </View>
      )}
    </View>
  );
}
