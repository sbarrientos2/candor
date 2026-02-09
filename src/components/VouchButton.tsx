import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { AnimatedPressable } from "./ui/AnimatedPressable";
import { formatSOL } from "../utils/format";
import { colors } from "../theme/colors";

interface VouchButtonProps {
  amountLamports: number;
  vouchCount: number;
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  hasVouched?: boolean;
}

export function VouchButton({
  amountLamports,
  vouchCount,
  onPress,
  disabled = false,
  isLoading = false,
  hasVouched = false,
}: VouchButtonProps) {
  const rotation = useSharedValue(0);

  const wiggleStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotation.value}deg` }],
  }));

  const handlePress = () => {
    if (disabled || isLoading || hasVouched) return;

    // Wiggle on success
    rotation.value = withSequence(
      withTiming(-3, { duration: 50 }),
      withTiming(3, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Animated.View style={wiggleStyle}>
      <AnimatedPressable
        haptic="none"
        scaleValue={0.92}
        onPress={handlePress}
        disabled={disabled || isLoading || hasVouched}
      >
        <View
          className={`flex-row items-center rounded-full px-3.5 py-2 ${
            hasVouched
              ? "border border-primary/40"
              : "bg-primary"
          }`}
          style={hasVouched ? { backgroundColor: "rgba(232,168,56,0.1)" } : undefined}
        >
          {isLoading ? (
            <ActivityIndicator
              size="small"
              color={hasVouched ? colors.primary : colors.background}
            />
          ) : (
            <>
              <Text
                className={`text-xs font-display-semibold ${
                  hasVouched ? "text-primary" : "text-background"
                }`}
              >
                {hasVouched ? "Vouched" : `Vouch ${formatSOL(amountLamports)}`}
              </Text>
              {vouchCount > 0 && (
                <View
                  className="rounded-full ml-2 items-center justify-center"
                  style={{
                    width: 20,
                    height: 20,
                    backgroundColor: hasVouched
                      ? "rgba(232,168,56,0.2)"
                      : "rgba(10,10,10,0.2)",
                  }}
                >
                  <Text
                    className={`text-xs font-display-bold ${
                      hasVouched ? "text-primary" : "text-background"
                    }`}
                    style={{ fontSize: 10 }}
                  >
                    {vouchCount}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}
