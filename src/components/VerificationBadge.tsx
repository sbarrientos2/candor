import React from "react";
import { View, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withDelay,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

interface VerificationBadgeProps {
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

const sizes = {
  sm: { container: "h-5 w-5", icon: 10 },
  md: { container: "h-7 w-7", icon: 14 },
  lg: { container: "h-9 w-9", icon: 18 },
};

export function VerificationBadge({
  size = "md",
  animate = false,
}: VerificationBadgeProps) {
  const scale = useSharedValue(animate ? 0 : 1);
  const opacity = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (animate) {
      opacity.value = withDelay(200, withTiming(1, { duration: 300 }));
      scale.value = withDelay(
        200,
        withSpring(1, { damping: 8, stiffness: 150 })
      );
    }
  }, [animate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const sizeConfig = sizes[size];

  return (
    <Animated.View
      style={animatedStyle}
      className={`${sizeConfig.container} rounded-full bg-primary items-center justify-center`}
    >
      <Text
        style={{ fontSize: sizeConfig.icon }}
        className="text-background font-display-bold"
      >
        ✓
      </Text>
    </Animated.View>
  );
}
