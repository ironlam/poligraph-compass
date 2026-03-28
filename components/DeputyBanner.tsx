import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import {
  isValidCodePostal,
  fetchDeputyByCodePostal,
} from "@/lib/deputy-lookup";
import { useDeputyStore, persistDeputyStore } from "@/lib/deputy-store";
import { track } from "@/lib/analytics";

export function DeputyBanner() {
  const { selectedDeputy, codePostal, isLoading, error } = useDeputyStore();
  const { setDeputy, setLoading, setError, clear } = useDeputyStore();
  const [input, setInput] = useState(codePostal || "");
  const [isEditing, setIsEditing] = useState(false);

  async function handleSearch() {
    const trimmed = input.trim();
    if (!isValidCodePostal(trimmed)) {
      setError("Entre un code postal valide (5 chiffres)");
      return;
    }

    setLoading(true);
    const deputy = await fetchDeputyByCodePostal(trimmed);

    if (deputy) {
      setDeputy(deputy, trimmed);
      setIsEditing(false);
      persistDeputyStore();
      track({ name: "deputy_searched", data: { hasResult: true } });
    } else {
      setError("Aucun député trouvé pour ce code postal");
      track({ name: "deputy_searched", data: { hasResult: false } });
    }
  }

  function handleChange() {
    setIsEditing(true);
  }

  function handleClear() {
    clear();
    setInput("");
    setIsEditing(false);
    persistDeputyStore();
  }

  // State: deputy selected and not editing
  if (selectedDeputy && !isEditing) {
    return (
      <View className="mx-6 mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-xs text-indigo-400 font-semibold uppercase tracking-wide">
              Ton député(e)
            </Text>
            <Text className="text-base font-bold text-gray-900 mt-1">
              {selectedDeputy.fullName}
            </Text>
            {selectedDeputy.circonscription && (
              <Text className="text-xs text-gray-400 mt-0.5">
                {selectedDeputy.circonscription}
              </Text>
            )}
          </View>
          <Pressable
            onPress={handleChange}
            accessibilityRole="button"
            accessibilityLabel="Changer de député"
            className="px-3 py-1.5"
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Text className="text-xs text-indigo-500 font-semibold">
              Changer
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // State: no deputy or editing
  return (
    <View className="mx-6 mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
      <Text className="text-sm font-bold text-gray-900">
        Découvre comment ton député a voté
      </Text>
      <Text className="text-xs text-gray-400 mt-1 mb-3">
        Entre ton code postal pour le trouver
      </Text>

      <View className="flex-row gap-2">
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ex: 75001"
          accessibilityLabel="Code postal"
          accessibilityHint="Entre ton code postal pour trouver ton député"
          keyboardType="number-pad"
          maxLength={5}
          className="flex-1 bg-white rounded-xl px-4 py-2.5 text-sm text-gray-900 border border-gray-200"
          editable={!isLoading}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <Pressable
          onPress={handleSearch}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Rechercher le député"
          className="bg-indigo-500 rounded-xl px-5 items-center justify-center active:bg-indigo-600"
          style={{ minHeight: 44 }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-bold text-sm">OK</Text>
          )}
        </Pressable>
      </View>

      {error && <Text className="text-xs text-red-500 mt-2">{error}</Text>}

      {selectedDeputy && isEditing && (
        <Pressable
          onPress={handleClear}
          accessibilityRole="button"
          accessibilityLabel="Supprimer la sélection du député"
          className="mt-2"
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text className="text-xs text-gray-400 underline">
            Supprimer la sélection
          </Text>
        </Pressable>
      )}
    </View>
  );
}
