import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useWallet } from "../hooks/useWallet";
import { useAuthStore } from "../stores/authStore";
import { supabase } from "../services/supabase";
import { AnimatedPressable } from "../components/ui/AnimatedPressable";
import { truncateAddress } from "../utils/format";
import { colors } from "../theme/colors";

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { connected, walletAddress, connectWallet, disconnectWallet } =
    useWallet();
  const { setDisplayName, setOnboarded } = useAuthStore();
  const [name, setName] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Entrance animations
  const heroOpacity = useSharedValue(0);
  const heroTranslateY = useSharedValue(16);
  const step1Opacity = useSharedValue(0);
  const step1TranslateY = useSharedValue(16);

  useEffect(() => {
    heroOpacity.value = withTiming(1, { duration: 500 });
    heroTranslateY.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
    step1Opacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    step1TranslateY.value = withDelay(
      200,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroTranslateY.value }],
  }));

  const step1Style = useAnimatedStyle(() => ({
    opacity: step1Opacity.value,
    transform: [{ translateY: step1TranslateY.value }],
  }));

  // Step 2 entrance when wallet connects
  const step2Opacity = useSharedValue(0);
  const step2TranslateY = useSharedValue(16);

  useEffect(() => {
    if (connected) {
      step2Opacity.value = withTiming(1, { duration: 400 });
      step2TranslateY.value = withTiming(0, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [connected]);

  const step2Style = useAnimatedStyle(() => ({
    opacity: step2Opacity.value,
    transform: [{ translateY: step2TranslateY.value }],
  }));

  // Debounced username availability check
  useEffect(() => {
    const trimmed = name.trim();
    setNameError(null);

    if (!trimmed || trimmed.length < 2) {
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    if (checkTimer.current) clearTimeout(checkTimer.current);

    checkTimer.current = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from("users")
          .select("wallet_address")
          .eq("display_name", trimmed)
          .maybeSingle();

        if (data && data.wallet_address !== walletAddress) {
          setNameError("Username already taken");
        }
      } catch {
        // Ignore check errors
      } finally {
        setIsChecking(false);
      }
    }, 500);

    return () => {
      if (checkTimer.current) clearTimeout(checkTimer.current);
    };
  }, [name, walletAddress]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connectWallet();
    } catch (error: any) {
      Alert.alert(
        "Connection Failed",
        error.message || "Could not connect wallet"
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleContinue = async () => {
    if (!walletAddress) return;
    if (nameError) return;

    setIsSaving(true);
    try {
      const trimmed = name.trim();
      const displayName = trimmed || truncateAddress(walletAddress, 4);

      if (trimmed) {
        const { data: existing } = await supabase
          .from("users")
          .select("wallet_address")
          .eq("display_name", trimmed)
          .maybeSingle();

        if (existing && existing.wallet_address !== walletAddress) {
          setNameError("Username already taken");
          setIsSaving(false);
          return;
        }
      }

      await supabase
        .from("users")
        .upsert(
          { wallet_address: walletAddress, display_name: displayName },
          { onConflict: "wallet_address" }
        );
      setDisplayName(displayName);
      setOnboarded(true);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View
      className="flex-1 bg-background px-6 justify-center"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* Logo / Title */}
      <Animated.View style={heroStyle} className="items-center mb-12">
        <Text className="text-primary font-display-bold text-4xl mb-2">
          Candor
        </Text>
        <Text className="text-text-secondary text-center text-base leading-6">
          Every photo verified. Every vouch costs real SOL.
        </Text>
      </Animated.View>

      {/* Step 1: Connect Wallet */}
      <Animated.View style={step1Style} className="mb-8">
        <Text className="text-text-primary font-display-semibold text-lg mb-4">
          {connected ? "\u2713 Wallet Connected" : "1. Connect Your Wallet"}
        </Text>
        {isConnecting ? (
          <View className="flex-row items-center bg-surface rounded-2xl px-5 py-3.5">
            <View
              className="h-2 w-2 rounded-full mr-2.5"
              style={{ backgroundColor: colors.primary }}
            />
            <Text className="text-text-secondary text-sm">Connecting...</Text>
          </View>
        ) : connected && walletAddress ? (
          <AnimatedPressable
            haptic="light"
            onPress={disconnectWallet}
            className="flex-row items-center bg-surface rounded-2xl px-5 py-3.5 border border-border"
          >
            <View className="h-2 w-2 rounded-full bg-success mr-2.5" />
            <Text className="text-text-primary text-sm font-medium">
              {truncateAddress(walletAddress)}
            </Text>
          </AnimatedPressable>
        ) : (
          <AnimatedPressable
            haptic="medium"
            onPress={handleConnect}
            className="bg-primary rounded-2xl py-4 items-center"
          >
            <Text className="text-background font-display-semibold text-base">
              Connect Wallet
            </Text>
          </AnimatedPressable>
        )}
      </Animated.View>

      {/* Step 2: Choose Display Name */}
      {connected && (
        <Animated.View style={step2Style} className="mb-8">
          <Text className="text-text-primary font-display-semibold text-lg mb-4">
            2. Pick a Username
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={
              walletAddress
                ? `Leave blank to use ${truncateAddress(walletAddress, 4)}`
                : "Enter a username"
            }
            placeholderTextColor={colors.textTertiary}
            className="bg-surface border border-border rounded-2xl px-4 py-3.5 text-text-primary text-base"
            maxLength={20}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {nameError && (
            <Text className="text-error text-sm mt-2">{nameError}</Text>
          )}
          {isChecking && (
            <Text className="text-text-tertiary text-sm mt-2">
              Checking availability...
            </Text>
          )}
          {name.trim().length >= 2 &&
            !nameError &&
            !isChecking && (
              <Text className="text-success text-sm mt-2">
                Username available
              </Text>
            )}
        </Animated.View>
      )}

      {/* Continue Button */}
      {connected && (
        <Animated.View style={step2Style}>
          <AnimatedPressable
            haptic="medium"
            onPress={handleContinue}
            disabled={isSaving || !!nameError || isChecking}
            className="bg-primary rounded-2xl py-4 items-center"
            style={
              isSaving || nameError || isChecking ? { opacity: 0.5 } : undefined
            }
          >
            <Text className="text-background font-display-semibold text-lg">
              {isSaving ? "Saving..." : "Start Capturing"}
            </Text>
          </AnimatedPressable>
        </Animated.View>
      )}

      {/* Footer */}
      <Text className="text-text-tertiary text-xs text-center mt-8">
        Built on Solana
      </Text>
    </View>
  );
}
