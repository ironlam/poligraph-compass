import { useState } from "react";
import { View, Text, Pressable } from "react-native";

interface PositionHelp {
  pour: string;
  contre: string;
  abstention?: string;
}

/**
 * Bloc expandable affichant les conséquences factuelles d'un vote Pour / Contre.
 * Rendu conditionnel à la présence de `help` : tant qu'aucune conséquence
 * concrète n'est renseignée sur la question, on ne rend rien (les anciens
 * fallbacks de NEUTRAL_FALLBACKS étaient tautologiques et sans valeur ajoutée).
 */
export function NeutralPositionHelp({ help }: { help?: PositionHelp }) {
  const [open, setOpen] = useState(false);

  if (!help) return null;

  return (
    <View
      className="mt-3 rounded-lg p-3"
      style={{ borderWidth: 1, borderColor: "#e8eaf0" }}
    >
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityLabel={open ? "Masquer l'aide" : "Afficher l'aide"}
      >
        <Text className="text-sm font-body-700 text-ink">
          {open ? "Masquer l'aide" : "Comprendre Pour / Contre"}
        </Text>
      </Pressable>
      {open && (
        <View className="mt-2 gap-2">
          <Text className="text-sm font-body" style={{ color: "#6b7280" }}>
            <Text className="font-body-700 text-ink">Pour :</Text> {help.pour}
          </Text>
          <Text className="text-sm font-body" style={{ color: "#6b7280" }}>
            <Text className="font-body-700 text-ink">Contre :</Text>{" "}
            {help.contre}
          </Text>
        </View>
      )}
    </View>
  );
}
