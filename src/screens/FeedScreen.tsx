import React, { useCallback, useState } from "react";
import { View, Text, FlatList, RefreshControl, Dimensions, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { PhotoCard } from "../components/PhotoCard";
import { FeedMap } from "../components/FeedMap";
import { AnimatedPressable } from "../components/ui/AnimatedPressable";
import { SkeletonLoader } from "../components/ui/SkeletonLoader";
import { useFeedPhotos, useRefreshFeed, useUserVouchedPhotoIds } from "../hooks/usePhotos";
import { useVouch } from "../hooks/useVouch";
import { useWallet } from "../hooks/useWallet";
import { Photo, RootStackParamList } from "../types";
import { formatSOL } from "../utils/format";
import { colors } from "../theme/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_SKELETON_WIDTH = SCREEN_WIDTH - 64; // 16px screen + 16px card padding on each side

function FeedSkeletonCard() {
  return (
    <View className="bg-surface rounded-2xl p-4 gap-3 mb-4">
      <SkeletonLoader
        width={IMAGE_SKELETON_WIDTH}
        height={IMAGE_SKELETON_WIDTH * 0.75}
        borderRadius={12}
      />
      <View className="flex-row items-center justify-between">
        <SkeletonLoader width={120} height={16} borderRadius={8} />
        <SkeletonLoader width={40} height={12} borderRadius={6} />
      </View>
      <SkeletonLoader width="80%" height={14} borderRadius={8} />
      <SkeletonLoader width={100} height={32} borderRadius={16} />
    </View>
  );
}

function FeedSkeleton() {
  return (
    <View className="px-4 pt-4">
      <FeedSkeletonCard />
      <FeedSkeletonCard />
      <FeedSkeletonCard />
    </View>
  );
}

type FeedView = "list" | "map";

export function FeedScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data: photos, isLoading, isRefetching } = useFeedPhotos();
  const refreshFeed = useRefreshFeed();
  const { vouch, isVouching, defaultAmount } = useVouch();
  const { walletAddress } = useWallet();
  const { data: vouchedPhotoIds } = useUserVouchedPhotoIds(walletAddress);
  const [vouchingPhotoId, setVouchingPhotoId] = useState<string | null>(null);
  const [feedView, setFeedView] = useState<FeedView>("list");

  const handleVouch = useCallback(
    (photo: Photo) => {
      Alert.alert(
        "Vouch for this photo?",
        `This will send ${formatSOL(defaultAmount)} to the creator.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Vouch",
            onPress: async () => {
              setVouchingPhotoId(photo.id);
              await vouch(
                photo.id,
                photo.creator_wallet,
                photo.image_hash,
                defaultAmount
              );
              setVouchingPhotoId(null);
              refreshFeed();
            },
          },
        ]
      );
    },
    [vouch, defaultAmount, refreshFeed]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Photo; index: number }) => (
      <PhotoCard
        photo={item}
        index={index}
        onPress={() =>
          navigation.navigate("PhotoDetail", { photoId: item.id })
        }
        onVouch={() => handleVouch(item)}
        isVouching={vouchingPhotoId === item.id && isVouching}
        hasVouched={vouchedPhotoIds?.has(item.id) ?? false}
        vouchAmount={defaultAmount}
      />
    ),
    [navigation, handleVouch, vouchingPhotoId, isVouching, defaultAmount, vouchedPhotoIds]
  );

  if (isLoading) {
    return (
      <View
        className="flex-1 bg-background"
        style={{ paddingTop: insets.top }}
      >
        <FeedSkeleton />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* View toggle */}
      <View className="flex-row items-center justify-end px-4 py-2">
        <View
          className="flex-row rounded-full overflow-hidden"
          style={{ backgroundColor: colors.surface }}
        >
          <AnimatedPressable
            haptic="light"
            scaleValue={1}
            onPress={() => setFeedView("list")}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              backgroundColor:
                feedView === "list" ? colors.surfaceRaised : "transparent",
              borderRadius: 20,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color:
                  feedView === "list" ? colors.textPrimary : colors.textTertiary,
              }}
            >
              {"☰ Feed"}
            </Text>
          </AnimatedPressable>
          <AnimatedPressable
            haptic="light"
            scaleValue={1}
            onPress={() => setFeedView("map")}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              backgroundColor:
                feedView === "map" ? colors.surfaceRaised : "transparent",
              borderRadius: 20,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color:
                  feedView === "map" ? colors.textPrimary : colors.textTertiary,
              }}
            >
              {"◎ Map"}
            </Text>
          </AnimatedPressable>
        </View>
      </View>

      {/* Content */}
      {feedView === "map" ? (
        <FeedMap photos={photos ?? []} />
      ) : (
        <FlatList
          data={photos}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refreshFeed}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.surface}
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-8 pt-32 gap-4">
              <Text className="text-text-primary text-lg font-display-semibold text-center">
                No photos yet
              </Text>
              <Text className="text-text-tertiary text-sm text-center leading-5">
                Be the first to capture a verified moment.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
