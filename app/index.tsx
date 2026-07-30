import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";
import { useQuizStore } from "@/lib/store";
import { track } from "@/lib/analytics";
import { Logo } from "@/components/Logo";
import {
  CheckCircleIcon,
  TimerIcon,
  ListChecksIcon,
  LockIcon,
  CompassIcon,
} from "@/components/icons";

const AMBER = "#f59e0b";

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View
      className="flex-row items-center rounded-full"
      style={{
        gap: 7,
        paddingVertical: 9,
        paddingHorizontal: 15,
        backgroundColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.14)",
      }}
    >
      {icon}
      <Text
        className="font-body-700"
        style={{ color: "#dfe2f7", fontSize: 13.5 }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function Home() {
  const router = useRouter();
  const reset = useQuizStore((s) => s.reset);

  function handleStart() {
    track({ name: "quiz_started" });
    reset();
    router.push("/quiz");
  }

  return (
    <View className="flex-1">
      {/* Hero background — linear approximation of the radial indigo gradient */}
      <LinearGradient
        colors={["#2b2769", "#1e1b4b", "#14122f"]}
        locations={[0, 0.55, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1">
        <View
          className="flex-1 items-center justify-center"
          style={{ paddingHorizontal: 30 }}
        >
          {/* Logo in a radial halo */}
          <View
            style={{
              width: 156,
              height: 156,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Svg width={156} height={156} style={{ position: "absolute" }}>
              <Defs>
                <RadialGradient id="halo" cx="50%" cy="40%" r="55%">
                  <Stop offset="0" stopColor="#818cf8" stopOpacity={0.35} />
                  <Stop offset="0.62" stopColor="#818cf8" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Rect x={0} y={0} width={156} height={156} fill="url(#halo)" />
            </Svg>
            <Logo size={132} transparent />
          </View>

          {/* Title */}
          <Text
            className="font-display text-white text-center"
            style={{ fontSize: 34, lineHeight: 37, marginTop: 8 }}
          >
            Ma Boussole{"\n"}Parlementaire
          </Text>

          {/* Sub-brand */}
          <View
            className="flex-row items-center"
            style={{ gap: 6, marginTop: 8 }}
          >
            <CheckCircleIcon size={15} color={AMBER} />
            <Text
              className="font-body"
              style={{ color: "#818cf8", fontSize: 14 }}
            >
              par Poligraph
            </Text>
          </View>

          {/* Hook */}
          <Text
            className="font-body text-center"
            style={{
              color: "#c7cbf0",
              fontSize: 17,
              lineHeight: 25,
              marginTop: 18,
              maxWidth: 300,
            }}
          >
            Découvre quels élus votent comme toi, à partir des{" "}
            <Text className="font-body-700 text-white">votes réels</Text> au
            Parlement.
          </Text>

          {/* Reassurance chips */}
          <View
            className="flex-row flex-wrap justify-center"
            style={{ gap: 8, marginTop: 22 }}
          >
            <Chip icon={<TimerIcon size={16} color={AMBER} />} label="2 min" />
            <Chip
              icon={<ListChecksIcon size={16} color={AMBER} />}
              label="20 questions"
            />
            <Chip icon={<LockIcon size={16} color={AMBER} />} label="Anonyme" />
          </View>

          {/* CTA */}
          <Pressable
            onPress={handleStart}
            accessibilityRole="button"
            accessibilityLabel="Commencer le quiz"
            className="w-full active:opacity-90"
            style={{ marginTop: 30, borderRadius: 20 }}
          >
            <LinearGradient
              colors={["#fbbf24", "#f59e0b"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{
                height: 62,
                borderRadius: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                shadowColor: "#f59e0b",
                shadowOffset: { width: 0, height: 14 },
                shadowOpacity: 0.5,
                shadowRadius: 20,
                elevation: 8,
              }}
            >
              <CompassIcon size={22} color="#1e1b4b" />
              <Text
                className="font-display"
                style={{ color: "#1e1b4b", fontSize: 20 }}
              >
                Commencer
              </Text>
            </LinearGradient>
          </Pressable>

          {/* Footer */}
          <Pressable
            onPress={() => router.push("/methodology")}
            accessibilityRole="link"
            accessibilityLabel="Voir notre méthodologie"
            style={{ marginTop: 28, minHeight: 44, justifyContent: "center" }}
          >
            <Text
              className="font-body text-center"
              style={{ color: "#818cf8", fontSize: 12.5, lineHeight: 20 }}
            >
              Basé sur les votes réels au Parlement{"\n"}Données Poligraph ·
              Association Sankofa
            </Text>
            <Text
              className="font-body-700 text-center underline"
              style={{ color: "#c7cbf0", fontSize: 12.5, marginTop: 4 }}
            >
              Notre méthodologie
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
