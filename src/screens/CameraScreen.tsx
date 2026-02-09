import React, { useState } from "react";
import { View, Text, TextInput, Alert, StatusBar } from "react-native";
import { CameraView } from "expo-camera";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useCamera } from "../hooks/useCamera";
import { useVerification } from "../hooks/useVerification";
import { useWallet } from "../hooks/useWallet";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { VerificationBadge } from "../components/VerificationBadge";
import { AnimatedPressable } from "../components/ui/AnimatedPressable";
import { colors } from "../theme/colors";

export function CameraScreen() {
  const insets = useSafeAreaInsets();
  const {
    cameraRef,
    permission,
    requestPermission,
    isCapturing,
    lastCapture,
    capture,
    clearCapture,
  } = useCamera();
  const { verifyAndUpload, isVerifying, error } = useVerification();
  const { connected } = useWallet();
  const [caption, setCaption] = useState("");
  const [includeLocation, setIncludeLocation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Ring pulse animation values
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);

  const ringPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const handleCapture = async () => {
    // Trigger ring pulse
    ringScale.value = 1;
    ringOpacity.value = 0.6;
    ringScale.value = withSpring(1.8, { damping: 20, stiffness: 80 });
    ringOpacity.value = withTiming(0, { duration: 500 });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await capture(includeLocation);
  };

  // Permission: loading
  if (!permission) {
    return <View className="flex-1 bg-background" />;
  }

  // Permission: denied
  if (!permission.granted) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8 gap-4">
        <Text className="text-text-primary text-lg font-display-bold text-center">
          Camera Access Required
        </Text>
        <Text className="text-text-tertiary text-sm text-center leading-5">
          Candor needs your camera to capture and verify photos on-chain.
        </Text>
        <AnimatedPressable
          haptic="light"
          onPress={requestPermission}
          className="bg-primary rounded-2xl px-8 py-4 mt-2"
        >
          <Text className="text-background font-display-semibold text-base">
            Grant Permission
          </Text>
        </AnimatedPressable>
      </View>
    );
  }

  // ─── Post-capture review ────────────────────────────────────────────
  if (lastCapture) {
    return (
      <View className="flex-1 bg-background">
        <StatusBar barStyle="light-content" />

        {/* Preview image — full bleed */}
        <Image
          source={{ uri: lastCapture.imageUri }}
          style={{ flex: 1, width: "100%" }}
          contentFit="cover"
          transition={200}
        />

        {/* Success overlay */}
        {showSuccess && (
          <View className="absolute inset-0 bg-black/70 items-center justify-center">
            <VerificationBadge size="lg" animate />
            <Text className="text-text-primary font-display-bold text-xl mt-4">
              Verified & Posted
            </Text>
          </View>
        )}

        {/* Bottom controls — floating over preview */}
        {!showSuccess && (
          <View
            className="absolute bottom-0 left-0 right-0"
            style={{ paddingBottom: insets.bottom + 12 }}
          >
            {/* Smooth gradient backdrop */}
            <View className="absolute inset-0" pointerEvents="none">
              <View style={{ flex: 1, backgroundColor: "rgba(10,10,10,0)" }} />
              <View style={{ flex: 0.5, backgroundColor: "rgba(10,10,10,0.1)" }} />
              <View style={{ flex: 0.5, backgroundColor: "rgba(10,10,10,0.25)" }} />
              <View style={{ flex: 0.8, backgroundColor: "rgba(10,10,10,0.45)" }} />
              <View style={{ flex: 1, backgroundColor: "rgba(10,10,10,0.65)" }} />
              <View style={{ flex: 2, backgroundColor: "rgba(10,10,10,0.88)" }} />
            </View>

            <View className="px-5 pt-12 gap-4">
              {/* Caption input */}
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Add a caption..."
                placeholderTextColor={colors.textTertiary}
                className="rounded-2xl px-4 py-3.5 text-text-primary text-base"
                style={{ backgroundColor: "rgba(26,26,26,0.9)" }}
                maxLength={200}
                multiline
              />

              {/* Hero CTA — Verify & Post */}
              <AnimatedPressable
                haptic="medium"
                onPress={async () => {
                  const result = await verifyAndUpload(lastCapture, caption);
                  if (result) {
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Success
                    );
                    setShowSuccess(true);
                    setTimeout(() => {
                      setShowSuccess(false);
                      clearCapture();
                      setCaption("");
                    }, 2000);
                  } else if (error) {
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Error
                    );
                    Alert.alert("Verification Failed", error);
                  }
                }}
                disabled={isVerifying || !connected}
                style={!connected ? { opacity: 0.4 } : undefined}
                className={`rounded-2xl py-4.5 items-center ${
                  connected ? "bg-primary" : "bg-surface-raised"
                }`}
              >
                <Text
                  className={`text-base font-display-semibold ${
                    connected ? "text-background" : "text-text-tertiary"
                  }`}
                >
                  {isVerifying
                    ? "Verifying..."
                    : connected
                      ? "Verify & Post"
                      : "Connect Wallet"}
                </Text>
              </AnimatedPressable>

              {/* Secondary — Retake */}
              <AnimatedPressable
                haptic="light"
                onPress={() => {
                  clearCapture();
                  setCaption("");
                }}
                className="items-center py-2"
              >
                <Text className="text-text-tertiary text-sm font-medium">
                  Retake
                </Text>
              </AnimatedPressable>
            </View>
          </View>
        )}

        <LoadingOverlay visible={isVerifying} />
      </View>
    );
  }

  // ─── Camera viewfinder ──────────────────────────────────────────────
  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="light-content" />
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
        {/* GPS floating pill — top right */}
        <AnimatedPressable
          haptic="light"
          scaleValue={0.92}
          onPress={() => setIncludeLocation((v) => !v)}
          style={{ position: "absolute", top: insets.top + 12, right: 16 }}
        >
          <View
            className="flex-row items-center rounded-full px-3 py-2"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <View
              className="rounded-full mr-2"
              style={{
                width: 6,
                height: 6,
                backgroundColor: includeLocation
                  ? colors.success
                  : colors.textTertiary,
              }}
            />
            <Text className="text-text-primary text-xs">
              {includeLocation ? "GPS On" : "GPS Off"}
            </Text>
          </View>
        </AnimatedPressable>

        {/* Bottom gradient + shutter */}
        <View className="absolute bottom-0 left-0 right-0 items-center">
          {/* Gradient backdrop strips */}
          <View
            className="absolute bottom-0 left-0 right-0"
            pointerEvents="none"
          >
            <View
              style={{ height: 60, backgroundColor: "rgba(0,0,0,0)" }}
            />
            <View
              style={{ height: 40, backgroundColor: "rgba(0,0,0,0.15)" }}
            />
            <View
              style={{ height: 40, backgroundColor: "rgba(0,0,0,0.35)" }}
            />
            <View
              style={{ height: 60, backgroundColor: "rgba(0,0,0,0.55)" }}
            />
          </View>

          {/* Shutter area */}
          <View
            className="items-center"
            style={{ paddingBottom: insets.bottom + 24 }}
          >
            {/* Capturing indicator */}
            {isCapturing && (
              <Text className="text-text-secondary text-xs mb-3">
                Processing...
              </Text>
            )}

            {/* Shutter button with ring pulse */}
            <View className="items-center justify-center">
              {/* Expanding ring pulse */}
              <Animated.View
                pointerEvents="none"
                style={[
                  ringPulseStyle,
                  {
                    position: "absolute",
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    borderWidth: 2,
                    borderColor: "#FFFFFF",
                  },
                ]}
              />

              {/* Shutter button */}
              <AnimatedPressable
                haptic="none"
                scaleValue={0.88}
                onPress={handleCapture}
                disabled={isCapturing}
                style={isCapturing ? { opacity: 0.5 } : undefined}
              >
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    borderWidth: 4,
                    borderColor: "#FFFFFF",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                </View>
              </AnimatedPressable>
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
}
