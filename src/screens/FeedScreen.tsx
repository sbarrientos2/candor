import React, { useCallback, useState } from "react";
import { View, Text, FlatList, RefreshControl, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { PhotoCard } from "../components/PhotoCard";
import { SkeletonLoader } from "../components/ui/SkeletonLoader";
import { useFeedPhotos, useRefreshFeed } from "../hooks/usePhotos";
import { useVouch } from "../hooks/useVouch";
import { useWallet } from "../hooks/useWallet";
import { Photo, RootStackParamList } from "../types";
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

export function FeedScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data: photos, isLoading, isRefetching } = useFeedPhotos();
  const refreshFeed = useRefreshFeed();
  const { vouch, isVouching, defaultAmount } = useVouch();
  const { walletAddress } = useWallet();
  const [vouchingPhotoId, setVouchingPhotoId] = useState<string | null>(null);

  const handleVouch = useCallback(
    async (photo: Photo) => {
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
        hasVouched={false}
        vouchAmount={defaultAmount}
      />
    ),
    [navigation, handleVouch, vouchingPhotoId, isVouching, defaultAmount]
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
      <FlatList
        data={photos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}
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
    </View>
  );
}
