import React from "react";
import { Pressable, PressableProps, ViewStyle, StyleProp } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

interface AnimatedPressableProps extends Omit<PressableProps, "style"> {
  haptic?: "light" | "medium" | "heavy" | "none";
  scaleValue?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function AnimatedPressable({
  haptic = "light",
  scaleValue = 0.96,
  onPressIn,
  onPressOut,
  onPress,
  style,
  children,
  ...rest
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: any) => {
    scale.value = withSpring(scaleValue, { damping: 15, stiffness: 200 });
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    onPressOut?.(e);
  };

  const handlePress = (e: any) => {
    if (haptic !== "none") {
      const feedbackStyle =
        haptic === "heavy"
          ? Haptics.ImpactFeedbackStyle.Heavy
          : haptic === "medium"
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Light;
      Haptics.impactAsync(feedbackStyle);
    }
    onPress?.(e);
  };

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
