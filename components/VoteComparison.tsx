import { View, Text } from "react-native";
import { VoteBadge } from "./VoteBadge";

interface Props {
  question: string;
  userVote: string;
  politicianVote: string;
  isAgreement: boolean;
}

export function VoteComparison({ question, userVote, politicianVote, isAgreement }: Props) {
  return (
    <View className="py-3 border-b border-gray-100">
      <Text className="text-sm text-gray-900 font-medium mb-2">
        {question}
      </Text>
      <View className="flex-row items-center gap-2">
        <Text className="text-xs text-gray-400 w-10">Toi</Text>
        <VoteBadge vote={userVote} />
        <Text className="text-xs text-gray-300 mx-1">vs</Text>
        <VoteBadge vote={politicianVote} />
        <View className="flex-1" />
        <Text className={`text-sm ${isAgreement ? "text-emerald-500" : "text-red-400"}`}>
          {isAgreement ? "✓" : "✗"}
        </Text>
      </View>
    </View>
  );
}
