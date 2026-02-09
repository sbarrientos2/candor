import React, { useEffect } from "react";
import { View, Text, Dimensions } from "react-native";
import { Image } from "expo-image";
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { VerificationBadge } from "./VerificationBadge";
import { VouchButton } from "./VouchButton";
import { AnimatedPressable } from "./ui/AnimatedPressable";
import { Photo, RootStackParamList } from "../types";
import { timeAgo, truncateAddress, formatSOL } from "../utils/format";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_PADDING = 16;
const SCREEN_PADDING = 16;
const IMAGE_WIDTH = SCREEN_WIDTH - SCREEN_PADDING * 2 - CARD_PADDING * 2;

interface PhotoCardProps {
  photo: Photo;
  index: number;
  onPress: () => void;
  onVouch: () => void;
  isVouching?: boolean;
  hasVouched?: boolean;
  vouchAmount?: number;
}

export function PhotoCard({
  photo,
  index,
  onPress,
  onVouch,
  isVouching = false,
  hasVouched = false,
  vouchAmount = 5_000_000,
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
      withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) })
    );
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={entranceStyle} className="mb-4">
      <AnimatedPressable haptic="light" scaleValue={0.98} onPress={onPress}>
        <View className="bg-surface rounded-2xl p-4 gap-3">
          {/* Image */}
          <View className="rounded-xl overflow-hidden">
            <Image
              source={{ uri: photo.image_url }}
              style={{ width: IMAGE_WIDTH, height: IMAGE_WIDTH * 0.75 }}
              contentFit="cover"
              transition={200}
            />
          </View>

          {/* Creator row: name + badge + timestamp */}
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
            <VouchButton
              amountLamports={vouchAmount}
              vouchCount={photo.vouch_count}
              onPress={onVouch}
              isLoading={isVouching}
              hasVouched={hasVouched}
            />
            {photo.total_earned_lamports > 0 && (
              <Text className="text-primary text-xs font-semibold">
                {formatSOL(photo.total_earned_lamports)} earned
              </Text>
            )}
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}
