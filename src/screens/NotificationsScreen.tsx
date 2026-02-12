import React, { useCallback } from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";
import { useNotifications, useMarkNotificationsRead } from "../hooks/useNotifications";
import { useWallet } from "../hooks/useWallet";
import { Avatar } from "../components/ui/Avatar";
import { AnimatedPressable } from "../components/ui/AnimatedPressable";
import { SkeletonLoader } from "../components/ui/SkeletonLoader";
import { timeAgo, truncateAddress, formatSOL } from "../utils/format";
import { colors } from "../theme/colors";
import { Notification, RootStackParamList } from "../types";

export function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { walletAddress } = useWallet();
  const { data: notifications, isLoading, isRefetching } = useNotifications(walletAddress);
  const { markRead } = useMarkNotificationsRead();
  const queryClient = useQueryClient();

  // Mark all as read on screen focus
  useFocusEffect(
    useCallback(() => {
      if (walletAddress) {
        markRead(walletAddress);
      }
    }, [walletAddress, markRead])
  );

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const handlePress = (notification: Notification) => {
    if (notification.type === "vouch" && notification.photo_id) {
      navigation.navigate("PhotoDetail", { photoId: notification.photo_id });
    } else if (notification.type === "follow") {
      navigation.navigate("UserProfile", { walletAddress: notification.actor_wallet });
    }
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const actorName =
      item.actor?.display_name || truncateAddress(item.actor_wallet);
    const message =
      item.type === "vouch"
        ? `vouched ${formatSOL(item.amount_lamports ?? 0)} on your photo`
        : "followed you";

    return (
      <AnimatedPressable haptic="light" onPress={() => handlePress(item)}>
        <View
          className="flex-row items-center px-4 py-3 gap-3"
          style={{
            backgroundColor: item.read ? "transparent" : "rgba(232,168,56,0.05)",
          }}
        >
          <Avatar
            uri={item.actor?.avatar_url}
            name={actorName}
            size="md"
          />
          <View className="flex-1">
            <Text className="text-text-primary text-sm" numberOfLines={2}>
              <Text style={{ fontWeight: "700" }}>{actorName}</Text>
              {" "}{message}
            </Text>
            <Text className="text-text-tertiary text-xs mt-0.5">
              {timeAgo(item.created_at)}
            </Text>
          </View>
        </View>
      </AnimatedPressable>
    );
  };

  if (isLoading) {
    return (
      <View
        className="flex-1 bg-background"
        style={{ paddingTop: insets.top }}
      >
        <View className="px-4 pt-4">
          <Text className="text-text-primary font-display-bold text-xl mb-4">
            Notifications
          </Text>
        </View>
        <View className="px-4 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} className="flex-row items-center gap-3">
              <SkeletonLoader width={36} height={36} borderRadius={18} />
              <View className="flex-1 gap-1.5">
                <SkeletonLoader width="80%" height={14} borderRadius={7} />
                <SkeletonLoader width={60} height={10} borderRadius={5} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="px-4 pt-4 pb-2">
        <Text className="text-text-primary font-display-bold text-xl">
          Notifications
        </Text>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        }
        ItemSeparatorComponent={() => (
          <View className="border-b border-border mx-4" />
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-8 pt-32 gap-4">
            <Text className="text-text-primary text-lg font-display-semibold text-center">
              No notifications yet
            </Text>
            <Text className="text-text-tertiary text-sm text-center leading-5">
              When someone vouches or follows you, it'll show up here.
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}
