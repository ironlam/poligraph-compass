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
      const uri = await captureRef(previewRef, { format: "png", quality: 1 });
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Partager ma boussole politique",
      });
      track({ name: "result_shared", data: { method: "image" } });
    } catch (error) {
      await Share.share({
        message: shareUrl
          ? `Découvre ma position politique ! ${shareUrl}`
          : "Découvre ta position politique sur Ma Boussole Politique !",
      });
      track({ name: "result_shared", data: { method: "link" } });
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
        message: `Je te defie de faire le quiz politique ! Compare ta position avec la mienne : ${challengeUrl}`,
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
              <Text className="text-white font-bold">Defier un ami</Text>
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
