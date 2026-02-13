import React, { useEffect, useCallback } from "react";
import { View, Text, Dimensions, Pressable } from "react-native";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { VerificationBadge } from "./VerificationBadge";
import { VouchButton } from "./VouchButton";
import { Avatar } from "./ui/Avatar";
import { AnimatedPressable } from "./ui/AnimatedPressable";
import { Photo, RootStackParamList } from "../types";
import { timeAgo, truncateAddress, formatSOL } from "../utils/format";
import { colors } from "../theme/colors";
import { useDoubleTap } from "../hooks/useDoubleTap";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SCREEN_PADDING = 16;
const IMAGE_WIDTH = SCREEN_WIDTH - SCREEN_PADDING * 2;

interface PhotoCardProps {
  photo: Photo;
  index: number;
  onPress: () => void;
  onVouch: () => void;
  isVouching?: boolean;
  hasVouched?: boolean;
  isOwnPhoto?: boolean;
  vouchAmount?: number;
  showDoubleTapHint?: boolean;
  onHintShown?: () => void;
}

export function PhotoCard({
  photo,
  index,
  onPress,
  onVouch,
  isVouching = false,
  hasVouched = false,
  isOwnPhoto = false,
  vouchAmount = 5_000_000,
  showDoubleTapHint = false,
  onHintShown,
}: PhotoCardProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const creatorName =
    photo.creator?.display_name || truncateAddress(photo.creator_wallet);

  // Staggered entrance animation
  const translateY = useSharedValue(24);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const delay = index * 60;
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 16, stiffness: 110 })
    );
    opacity.value = withDelay(delay, withTiming(1, { duration: 350 }));
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  // Double-tap hint overlay
  const hintOpacity = useSharedValue(showDoubleTapHint ? 1 : 0);

  useEffect(() => {
    if (showDoubleTapHint) {
      hintOpacity.value = withTiming(1, { duration: 400 });
      const timer = setTimeout(() => {
        hintOpacity.value = withTiming(0, { duration: 400 });
        onHintShown?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showDoubleTapHint]);

  const hintStyle = useAnimatedStyle(() => ({
    opacity: hintOpacity.value,
  }));

  // Double-tap vouch animation
  const vouchIconScale = useSharedValue(0);
  const vouchIconOpacity = useSharedValue(0);

  const vouchIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: vouchIconScale.value }],
    opacity: vouchIconOpacity.value,
  }));

  const handleDoubleTapVouch = useCallback(() => {
    if (isOwnPhoto || hasVouched || isVouching) return;

    // Trigger visual feedback immediately
    vouchIconScale.value = 0;
    vouchIconOpacity.value = 1;
    vouchIconScale.value = withSequence(
      withSpring(1.3, { damping: 8, stiffness: 120 }),
      withSpring(1, { damping: 12, stiffness: 100 })
    );
    vouchIconOpacity.value = withDelay(
      500,
      withTiming(0, { duration: 300 })
    );

    onVouch();
  }, [isOwnPhoto, hasVouched, isVouching, onVouch]);

  const { handlePress: handleImagePress } = useDoubleTap({
    onDoubleTap: handleDoubleTapVouch,
    onSingleTap: onPress,
  });

  return (
    <Animated.View style={entranceStyle} className="mb-4">
      <AnimatedPressable haptic="light" scaleValue={0.98} onPress={onPress}>
        <View className="bg-surface rounded-2xl overflow-hidden">
          {/* Photo — full card width */}
          <Pressable onPress={handleImagePress}>
            <Image
              source={{ uri: photo.image_url }}
              style={{ width: IMAGE_WIDTH, aspectRatio: 4 / 5 }}
              contentFit="cover"
              transition={200}
            />
            {/* Double-tap vouch visual feedback */}
            <Animated.View
              pointerEvents="none"
              style={[
                vouchIconStyle,
                {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: "center",
                  justifyContent: "center",
                },
              ]}
            >
              <View style={{
                shadowColor: "#E8A838",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 20,
                elevation: 10,
              }}>
                <Ionicons name="checkmark-circle" size={72} color={colors.primary} />
              </View>
            </Animated.View>
            {/* Double-tap discovery hint */}
            {showDoubleTapHint && (
              <Animated.View
                pointerEvents="none"
                style={[
                  hintStyle,
                  {
                    position: "absolute",
                    bottom: 16,
                    left: 0,
                    right: 0,
                    alignItems: "center",
                  },
                ]}
              >
                <View
                  style={{
                    backgroundColor: "rgba(0,0,0,0.7)",
                    borderRadius: 20,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Ionicons name="hand-left-outline" size={14} color={colors.primary} />
                  <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: "600" }}>
                    Double-tap to vouch
                  </Text>
                </View>
              </Animated.View>
            )}
          </Pressable>

          {/* Metadata below photo */}
          <View className="px-4 pt-3 pb-4 gap-2.5">
            {/* Creator row: avatar + name + badge + timestamp */}
            <View className="flex-row items-center">
              <AnimatedPressable
                haptic="light"
                onPress={() =>
                  navigation.navigate("UserProfile", {
                    walletAddress: photo.creator_wallet,
                  })
                }
                className="flex-row items-center"
              >
                <View style={{ marginRight: 6 }}>
                  <Avatar
                    uri={photo.creator?.avatar_url}
                    name={creatorName}
                    size="sm"
                  />
                </View>
                <Text className="text-text-primary font-display-semibold text-sm">
                  {creatorName}
                </Text>
                {photo.verification_tx && (
                  <View className="ml-1.5">
                    <VerificationBadge size="sm" />
                  </View>
                )}
              </AnimatedPressable>
              <View className="flex-1" />
              <Text className="text-text-tertiary text-xs">
                {timeAgo(photo.created_at)}
              </Text>
            </View>

            {/* Caption */}
            {photo.caption && (
              <Text className="text-text-secondary text-sm" numberOfLines={2}>
                {photo.caption}
              </Text>
            )}

            {/* Actions row: vouch button + earnings */}
            <View className="flex-row items-center justify-between">
              {!isOwnPhoto && (
                <VouchButton
                  amountLamports={vouchAmount}
                  vouchCount={photo.vouch_count}
                  onPress={onVouch}
                  isLoading={isVouching}
                  hasVouched={hasVouched}
                />
              )}
              {photo.total_earned_lamports > 0 && (
                <Text className="text-primary text-xs font-semibold">
                  {formatSOL(photo.total_earned_lamports)} earned
                </Text>
              )}
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}
