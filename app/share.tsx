import { useRef } from "react";
import { View, Text, Pressable, Alert, Share } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { useQuizStore } from "@/lib/store";
import { SharePreview } from "@/components/SharePreview";
import * as Clipboard from "expo-clipboard";

export default function ShareScreen() {
  const router = useRouter();
  const { shareId, reset } = useQuizStore();
  const shareUrl = shareId ? `https://boussole.poligraph.fr/r/${shareId}` : null;
  const previewRef = useRef<View>(null);

  async function handleShare() {
    try {
      // Capture preview as PNG image
      const uri = await captureRef(previewRef, { format: "png", quality: 1 });
      // Share via native share sheet
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Partager ma boussole politique",
      });
    } catch (error) {
      // Fallback to text share if image capture fails
      await Share.share({
        message: shareUrl
          ? `Découvre ma position politique ! ${shareUrl}`
          : "Découvre ta position politique sur Ma Boussole Politique !",
      });
    }
  }

  async function handleCopyLink() {
    if (shareUrl) {
      await Clipboard.setStringAsync(shareUrl);
      Alert.alert("Lien copié !");
    }
  }

  function handleRestart() {
    reset();
    router.replace("/");
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 pt-6">
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

          <Pressable
            onPress={handleRestart}
            className="py-3 items-center"
          >
            <Text className="text-gray-400">Recommencer</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
