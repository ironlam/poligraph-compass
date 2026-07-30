import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { Outfit_800ExtraBold } from "@expo-google-fonts/outfit";
import {
  AtkinsonHyperlegible_400Regular,
  AtkinsonHyperlegible_700Bold,
} from "@expo-google-fonts/atkinson-hyperlegible";
import { rehydrateDeputyStore } from "@/lib/deputy-store";

const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync().catch(() => {
  // no-op: preventAutoHideAsync throws if the splash screen is already hidden
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Outfit_800ExtraBold,
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
  });

  useEffect(() => {
    rehydrateDeputyStore();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Keep the splash up until fonts resolve. On error we still render (the OS
  // falls back to the system font) rather than blocking the whole app.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
