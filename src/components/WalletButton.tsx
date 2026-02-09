import React from "react";
import { View, Text } from "react-native";
import { AnimatedPressable } from "./ui/AnimatedPressable";
import { truncateAddress } from "../utils/format";
import { colors } from "../theme/colors";

interface WalletButtonProps {
  connected: boolean;
  walletAddress: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting?: boolean;
}

export function WalletButton({
  connected,
  walletAddress,
  onConnect,
  onDisconnect,
  isConnecting = false,
}: WalletButtonProps) {
  if (isConnecting) {
    return (
      <View className="flex-row items-center bg-surface rounded-2xl px-5 py-3">
        <View
          className="h-2 w-2 rounded-full mr-2.5"
          style={{ backgroundColor: colors.primary }}
        />
        <Text className="text-text-secondary text-sm">Connecting...</Text>
      </View>
    );
  }

  if (connected && walletAddress) {
    return (
      <AnimatedPressable
        haptic="light"
        onPress={onDisconnect}
        className="flex-row items-center bg-surface rounded-2xl px-5 py-3 border border-border"
      >
        <View className="h-2 w-2 rounded-full bg-success mr-2.5" />
        <Text className="text-text-primary text-sm font-medium">
          {truncateAddress(walletAddress)}
        </Text>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      haptic="medium"
      onPress={onConnect}
      className="bg-primary rounded-2xl px-6 py-3 items-center"
    >
      <Text className="text-background font-display-semibold text-sm">
        Connect Wallet
      </Text>
    </AnimatedPressable>
  );
}
