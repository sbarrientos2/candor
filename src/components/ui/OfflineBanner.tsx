import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetInfo } from "@react-native-community/netinfo";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";

export function OfflineBanner() {
  const { isConnected } = useNetInfo();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-60);

  const isOffline = isConnected === false;

  useEffect(() => {
    translateY.value = withTiming(isOffline ? 0 : -60, { duration: 300 });
  }, [isOffline]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          paddingTop: insets.top,
          backgroundColor: colors.error,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 6,
          gap: 6,
        }}
      >
        <Ionicons name="cloud-offline-outline" size={14} color={colors.textPrimary} />
        <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: "600" }}>
          No connection
        </Text>
      </View>
    </Animated.View>
  );
}
