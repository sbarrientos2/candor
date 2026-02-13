import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-60);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // Only treat explicit false as offline (null = unknown/loading)
      setIsOffline(state.isConnected === false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOffline) {
      setShouldRender(true);
      translateY.value = withTiming(0, { duration: 300 });
    } else {
      translateY.value = withTiming(-60, { duration: 300 }, () => {
        runOnJS(setShouldRender)(false);
      });
    }
  }, [isOffline]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!shouldRender) return null;

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
