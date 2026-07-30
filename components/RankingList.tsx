import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { HeroCard } from "./HeroCard";
import { RankingItem } from "./RankingItem";
import { DeputyPinnedCard } from "./DeputyPinnedCard";
import { CONCORDANCE_LEGEND } from "@/lib/concordance-display";
import type { ConcordanceEntry } from "@/lib/types";

interface Props {
  politicians: ConcordanceEntry[];
  parties: ConcordanceEntry[];
  pinnedDeputy?: ConcordanceEntry | null;
}

function Tab({
  label,
  active,
  onPress,
  a11yLabel,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  a11yLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={a11yLabel}
      style={{ minHeight: 44 }}
    >
      <Text
        className="font-body-700"
        style={{
          fontSize: 15,
          paddingBottom: 12,
          color: active ? "#1f2430" : "#9aa0ae",
          borderBottomWidth: 3,
          borderBottomColor: active ? "#f59e0b" : "transparent",
          marginBottom: -1,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function RankingList({ politicians, parties, pinnedDeputy }: Props) {
  const [tab, setTab] = useState<"politicians" | "parties">("politicians");
  const data = tab === "politicians" ? politicians : parties;
  const [first, ...rest] = data;

  return (
    <View style={{ marginTop: 26 }}>
      <Text className="font-display text-ink px-6" style={{ fontSize: 21 }}>
        Les élus qui votent comme toi
      </Text>

      {/* Tabs */}
      <View
        className="flex-row mx-6"
        style={{
          gap: 22,
          marginTop: 14,
          borderBottomWidth: 1,
          borderBottomColor: "#e8eaf0",
        }}
        accessibilityRole="tablist"
      >
        <Tab
          label="Élus"
          active={tab === "politicians"}
          onPress={() => setTab("politicians")}
          a11yLabel="Classement des élus"
        />
        <Tab
          label="Partis"
          active={tab === "parties"}
          onPress={() => setTab("parties")}
          a11yLabel="Classement des partis"
        />
      </View>

      {/* Concordance legend — colour is always paired with a text label */}
      <View className="flex-row mx-5" style={{ gap: 8, marginTop: 14 }}>
        {CONCORDANCE_LEGEND.map((tier) => (
          <View
            key={tier.label}
            className="flex-row items-center"
            style={{
              flex: 1,
              gap: 5,
              paddingVertical: 7,
              paddingHorizontal: 8,
              borderRadius: 12,
              backgroundColor: tier.bg,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: tier.color,
              }}
            />
            <Text
              className="font-body-700"
              style={{ color: tier.color, fontSize: 10.5 }}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {tier.label} {tier.range}
            </Text>
          </View>
        ))}
      </View>

      {data.length === 0 ? (
        <View className="px-6 py-8 items-center">
          <Text
            className="font-body text-center"
            style={{ color: "#9aa0ae", fontSize: 14 }}
          >
            Données non disponibles.{"\n"}
            Les résultats apparaîtront après synchronisation.
          </Text>
        </View>
      ) : (
        <View className="px-5" style={{ gap: 10, marginTop: 14 }}>
          {pinnedDeputy && tab === "politicians" && (
            <View style={{ marginBottom: 2 }}>
              <DeputyPinnedCard entry={pinnedDeputy} />
            </View>
          )}
          {first && <HeroCard entry={first} />}
          {rest.slice(0, 19).map((entry, index) => (
            <RankingItem key={entry.id} entry={entry} rank={index + 2} />
          ))}
        </View>
      )}
    </View>
  );
}
