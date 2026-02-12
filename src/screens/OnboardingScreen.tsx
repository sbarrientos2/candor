import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  FlatList,
  Dimensions,
  ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { useWallet } from "../hooks/useWallet";
import { useAuthStore } from "../stores/authStore";
import { supabase } from "../services/supabase";
import { AnimatedPressable } from "../components/ui/AnimatedPressable";
import { truncateAddress } from "../utils/format";
import { colors } from "../theme/colors";
import { goldGlow } from "../theme/shadows";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Welcome Slides ──────────────────────────────────────────────────

interface Slide {
  id: string;
  icon: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    id: "truth",
    icon: "shield-check",
    title: "Truth in every pixel",
    body: "In a world of AI fakes and manipulated media, Candor makes every photo cryptographically verifiable on Solana. If it's on Candor, it's real.",
  },
  {
    id: "sealed",
    icon: "camera-lock",
    title: "Sealed at capture",
    body: "The moment you tap the shutter, your photo is hashed and recorded on-chain. No filters, no edits, no tampering possible after the fact.",
  },
  {
    id: "location",
    icon: "map-marker-radius",
    title: "Your location, your choice",
    body: "Toggle GPS to prove where you were. Coordinates are fuzzed to ~100m — enough to verify the area, never your exact spot. Off by default.",
  },
  {
    id: "vouch",
    icon: "hand-coin",
    title: "Vouch with real SOL",
    body: "Love a photo? Vouch for it. Real SOL goes directly to the creator — no middlemen, no algorithms. Just people backing truth.",
  },
];

function WelcomeCarousel({ onComplete }: { onComplete: () => void }) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<Slide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isLastSlide = activeIndex === SLIDES.length - 1;

  // Entrance animation
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(20);

  useEffect(() => {
    contentOpacity.value = withTiming(1, { duration: 500 });
    contentTranslateY.value = withSpring(0, { damping: 20, stiffness: 130 });
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (isLastSlide) {
      onComplete();
    } else {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    }
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View
      style={{ width: SCREEN_WIDTH }}
      className="px-8 justify-center items-center"
    >
      {/* Icon — vector icon with gold circle background */}
      <View style={{
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "rgba(232,168,56,0.1)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
      }}>
        <MaterialCommunityIcons
          name={item.icon as any}
          size={40}
          color={colors.primary}
        />
      </View>

      {/* Title */}
      <Text className="text-text-primary font-display-bold text-2xl text-center mb-4">
        {item.title}
      </Text>

      {/* Body */}
      <Text className="text-text-secondary text-base text-center leading-6 px-2">
        {item.body}
      </Text>
    </View>
  );

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <Animated.View style={[entranceStyle, { flex: 1 }]}>
        {/* Skip button */}
        <View className="flex-row justify-end px-6 pt-4">
          <AnimatedPressable haptic="light" onPress={onComplete}>
            <Text className="text-text-tertiary text-sm">Skip</Text>
          </AnimatedPressable>
        </View>

        {/* Slides */}
        <View style={{ flex: 1, justifyContent: "center" }}>
          <FlatList
            ref={flatListRef}
            data={SLIDES}
            renderItem={renderSlide}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
          />
        </View>

        {/* Bottom: dots + button */}
        <View className="px-8 pb-6 gap-6">
          {/* Dot indicators */}
          <View className="flex-row justify-center gap-2">
            {SLIDES.map((_, i) => (
              <View
                key={i}
                className="rounded-full"
                style={{
                  width: i === activeIndex ? 24 : 8,
                  height: 8,
                  backgroundColor:
                    i === activeIndex ? colors.primary : colors.border,
                }}
              />
            ))}
          </View>

          {/* Next / Get Started */}
          <AnimatedPressable
            haptic="medium"
            onPress={handleNext}
            className="bg-primary rounded-2xl py-4 items-center"
            style={goldGlow}
          >
            <Text className="text-background font-display-semibold text-base">
              {isLastSlide ? "Get Started" : "Next"}
            </Text>
          </AnimatedPressable>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Setup Screen (wallet + username) ────────────────────────────────

function SetupScreen() {
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
    heroOpacity.value = withTiming(1, { duration: 450 });
    heroTranslateY.value = withSpring(0, { damping: 20, stiffness: 130 });
    step1Opacity.value = withDelay(200, withTiming(1, { duration: 350 }));
    step1TranslateY.value = withDelay(
      200,
      withSpring(0, { damping: 16, stiffness: 110 })
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
      step2Opacity.value = withTiming(1, { duration: 350 });
      step2TranslateY.value = withSpring(0, { damping: 16, stiffness: 110 });
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
        {/* Logo mark */}
        <Image
          source={require("../../assets/candor-logo.png")}
          style={{ width: 80, height: 80, marginBottom: 16 }}
          contentFit="contain"
        />

        {/* App name */}
        <Text className="text-primary font-display-bold text-4xl mb-2">
          Candor
        </Text>

        {/* Tagline */}
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
            style={goldGlow}
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
            style={[
              goldGlow,
              (isSaving || nameError || isChecking) ? { opacity: 0.5 } : undefined,
            ]}
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

// ─── Main Onboarding (carousel → setup) ─────────────────────────────

export function OnboardingScreen() {
  const [welcomeComplete, setWelcomeComplete] = useState(false);

  if (!welcomeComplete) {
    return <WelcomeCarousel onComplete={() => setWelcomeComplete(true)} />;
  }

  return <SetupScreen />;
}
