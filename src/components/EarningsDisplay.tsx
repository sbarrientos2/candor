import React from "react";
import { View, Text } from "react-native";
import { formatSOL, formatUSD, lamportsToSOL } from "../utils/format";
import { useSolPrice } from "../hooks/useEarnings";

interface EarningsDisplayProps {
  totalEarnedLamports: number;
  totalVouches: number;
  compact?: boolean;
}

export function EarningsDisplay({
  totalEarnedLamports,
  totalVouches,
  compact = false,
}: EarningsDisplayProps) {
  const { data: solPrice } = useSolPrice();

  if (compact) {
    return (
      <View className="flex-row items-center">
        <Text className="text-primary font-bold text-sm">
          {formatSOL(totalEarnedLamports)}
        </Text>
        {solPrice && solPrice > 0 && (
          <Text className="text-text-tertiary text-xs ml-1">
            ({formatUSD(totalEarnedLamports, solPrice)})
          </Text>
        )}
      </View>
    );
  }

  return (
    <View className="bg-surface-raised rounded-xl p-4">
      <Text className="text-text-secondary text-xs uppercase tracking-wider mb-1">
        Total Earned
      </Text>
      <Text className="text-primary font-bold text-2xl">
        {formatSOL(totalEarnedLamports)}
      </Text>
      {solPrice && solPrice > 0 && (
        <Text className="text-text-tertiary text-sm">
          ≈ {formatUSD(totalEarnedLamports, solPrice)}
        </Text>
      )}
      <View className="flex-row mt-3">
        <View className="mr-6">
          <Text className="text-text-primary font-bold text-lg">
            {totalVouches}
          </Text>
          <Text className="text-text-tertiary text-xs">vouches</Text>
        </View>
        <View>
          <Text className="text-text-primary font-bold text-lg">
            {lamportsToSOL(totalEarnedLamports).toFixed(4)}
          </Text>
          <Text className="text-text-tertiary text-xs">SOL</Text>
        </View>
      </View>
    </View>
  );
}
