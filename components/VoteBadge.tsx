import { View, Text } from "react-native";

const VOTE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  POUR: { label: "Pour", bg: "bg-emerald-100", text: "text-emerald-700" },
  CONTRE: { label: "Contre", bg: "bg-red-100", text: "text-red-700" },
  ABSTENTION: { label: "Abstention", bg: "bg-gray-100", text: "text-gray-500" },
  ABSENT: { label: "Absent", bg: "bg-gray-100", text: "text-gray-400" },
  NON_VOTANT: { label: "Non votant", bg: "bg-gray-100", text: "text-gray-400" },
  SKIP: { label: "Passé", bg: "bg-gray-100", text: "text-gray-400" },
};

export function VoteBadge({ vote }: { vote: string }) {
  const config = VOTE_CONFIG[vote] || VOTE_CONFIG.ABSENT;
  return (
    <View className={`px-2 py-0.5 rounded ${config.bg}`}>
      <Text className={`text-xs font-semibold ${config.text}`}>
        {config.label}
      </Text>
    </View>
  );
}
