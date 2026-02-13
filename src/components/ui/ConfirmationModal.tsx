import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { AnimatedPressable } from "./AnimatedPressable";
import { colors } from "../../theme/colors";

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  visible,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 18, stiffness: 140 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.9, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} className="items-center justify-center px-8">
      {/* Backdrop */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onCancel}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.8)" }, backdropStyle]}
        />
      </Pressable>

      {/* Card */}
      <Animated.View style={[{ width: "100%", maxWidth: 320 }, cardStyle]}>
        <View
          className="bg-surface rounded-2xl p-6"
          style={{ borderWidth: 1, borderColor: "rgba(232,168,56,0.15)" }}
        >
          <Text className="text-text-primary font-display-bold text-lg mb-2">
            {title}
          </Text>
          <Text className="text-text-secondary text-sm leading-5 mb-6">
            {message}
          </Text>

          {/* Actions */}
          <View className="flex-row gap-3">
            <AnimatedPressable
              haptic="light"
              scaleValue={0.96}
              onPress={onCancel}
              style={{ flex: 1 }}
            >
              <View className="items-center rounded-full py-3 bg-surface-raised border border-border">
                <Text className="text-text-secondary text-sm font-display-semibold">
                  Cancel
                </Text>
              </View>
            </AnimatedPressable>

            <AnimatedPressable
              haptic="light"
              scaleValue={0.96}
              onPress={onConfirm}
              style={{ flex: 1 }}
            >
              <View className="items-center rounded-full py-3 bg-primary">
                <Text className="text-background text-sm font-display-bold">
                  {confirmLabel}
                </Text>
              </View>
            </AnimatedPressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
