import { useRef } from "react";
import { View, Text, Pressable, Alert, Share, ScrollView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { useQuizStore } from "@/lib/store";
import { SharePreview } from "@/components/SharePreview";
import * as Clipboard from "expo-clipboard";
import { track } from "@/lib/analytics";

export default function ShareScreen() {
  const router = useRouter();
  const { shareId, reset } = useQuizStore();
  const shareUrl = shareId ? `https://boussole.poligraph.fr/r/${shareId}` : null;
  const challengeUrl = shareId ? `https://boussole.poligraph.fr/challenge/${shareId}` : null;
  const previewRef = useRef<View>(null);

  async function handleShare() {
    try {
      if (Platform.OS === "web") {
        // react-native-view-shot's captureRef calls findNodeHandle which
        // is unsupported on web. Use html-to-image which handles inline
        // SVGs (the Compass component) natively.
        const { toBlob } = await import("html-to-image");
        const node = (previewRef.current as unknown as HTMLElement);
        if (!node) throw new Error("Preview ref not ready");
        const blob = await toBlob(node, {
          pixelRatio: 2,
          cacheBust: true,
        });
        if (!blob) throw new Error("toBlob returned null");
        const file = new File([blob], "ma-boussole-parlementaire.png", { type: "image/png" });

        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file] });
        } else {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "ma-boussole-parlementaire.png";
          a.click();
          URL.revokeObjectURL(a.href);
        }
      } else {
        const uri = await captureRef(previewRef, { format: "png", quality: 1 });
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Partager ma boussole parlementaire",
        });
      }
      track({ name: "result_shared", data: { method: "image" } });
    } catch {
      Alert.alert("Erreur", "Impossible de générer l'image.");
    }
  }

  async function handleCopyLink() {
    if (shareUrl) {
      await Clipboard.setStringAsync(shareUrl);
      track({ name: "result_shared", data: { method: "link" } });
      Alert.alert("Lien copié !");
    }
  }

  async function handleChallenge() {
    if (challengeUrl) {
      await Share.share({
        message: `Compare ta position parlementaire avec la mienne : ${challengeUrl}`,
      });
      track({ name: "challenge_created" });
    }
  }

  function handleRestart() {
    if (Platform.OS === "web") {
      window.location.href = "/";
      return;
    }
    reset();
    router.replace("/");
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerClassName="pb-12 pt-6">
        <SharePreview captureRef={previewRef} />

        <View className="mx-6 mt-8 gap-3">
          <Pressable
            onPress={handleShare}
            className="py-4 bg-gray-900 rounded-xl items-center active:bg-gray-800"
          >
            <Text className="text-white font-bold">Partager l'image</Text>
          </Pressable>

          {shareUrl && (
            <Pressable
              onPress={handleCopyLink}
              className="py-4 bg-gray-100 rounded-xl items-center active:bg-gray-200"
            >
              <Text className="text-gray-700 font-bold">Copier le lien</Text>
            </Pressable>
          )}

          {challengeUrl && (
            <Pressable
              onPress={handleChallenge}
              className="py-4 bg-indigo-500 rounded-xl items-center active:bg-indigo-600"
            >
              <Text className="text-white font-bold">Défier un ami</Text>
            </Pressable>
          )}

          <Pressable
            onPress={handleRestart}
            className="py-3 items-center"
          >
            <Text className="text-gray-400">Recommencer</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
