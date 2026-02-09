import React from "react";
import { View, Text, ActivityIndicator, Modal } from "react-native";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
} from "react-native-reanimated";
import { useEffect } from "react";

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  subMessage?: string;
}

export function LoadingOverlay({
  visible,
  message = "Verifying...",
  subMessage = "Hashing image and recording on-chain",
}: LoadingOverlayProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 2000 }),
        -1,
        false
      );
    } else {
      rotation.value = 0;
    }
  }, [visible]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotation.value}deg` }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/80 items-center justify-center px-8">
        <View className="bg-surface rounded-2xl p-8 items-center w-full max-w-xs">
          <Animated.View
            style={spinStyle}
            className="h-12 w-12 rounded-full border-4 border-border border-t-primary mb-4"
          />
          <Text className="text-text-primary font-display-bold text-lg mb-1">
            {message}
          </Text>
          <Text className="text-text-secondary text-sm text-center">
            {subMessage}
          </Text>
        </View>
      </View>
    </Modal>
  );
}
