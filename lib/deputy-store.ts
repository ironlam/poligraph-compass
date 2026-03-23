import { create } from "zustand";
import type { DeputyInfo } from "./deputy-lookup";

interface DeputyState {
  selectedDeputy: DeputyInfo | null;
  codePostal: string | null;
  isLoading: boolean;
  error: string | null;

  setDeputy: (deputy: DeputyInfo, codePostal: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  clear: () => void;
}

const initialState = {
  selectedDeputy: null,
  codePostal: null,
  isLoading: false,
  error: null,
};

export const useDeputyStore = create<DeputyState>((set) => ({
  ...initialState,

  setDeputy: (deputy, codePostal) =>
    set({ selectedDeputy: deputy, codePostal, error: null, isLoading: false }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error, isLoading: false }),

  clear: () => set(initialState),
}));

// --- AsyncStorage persistence ---

const STORAGE_KEY = "deputy-selection";

export async function rehydrateDeputyStore(): Promise<void> {
  try {
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const { selectedDeputy, codePostal } = JSON.parse(raw);
      if (selectedDeputy && codePostal) {
        useDeputyStore.setState({ selectedDeputy, codePostal });
      }
    }
  } catch {
    // Silently fail: persistence is best-effort
  }
}

export async function persistDeputyStore(): Promise<void> {
  try {
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    const { selectedDeputy, codePostal } = useDeputyStore.getState();
    if (selectedDeputy && codePostal) {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ selectedDeputy, codePostal })
      );
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Silently fail
  }
}
