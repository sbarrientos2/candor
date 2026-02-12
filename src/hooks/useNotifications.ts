import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { Notification } from "../types";

export function useNotifications(walletAddress: string | null) {
  return useQuery({
    queryKey: ["notifications", walletAddress],
    queryFn: async (): Promise<Notification[]> => {
      if (!walletAddress) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*, actor:users!actor_id(*)")
        .eq("recipient_wallet", walletAddress)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!walletAddress,
    staleTime: 30_000,
  });
}

export function useUnreadCount(walletAddress: string | null) {
  return useQuery({
    queryKey: ["notifications", "unread", walletAddress],
    queryFn: async (): Promise<number> => {
      if (!walletAddress) return 0;
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("recipient_wallet", walletAddress)
        .eq("read", false);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!walletAddress,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  const markRead = useCallback(
    async (walletAddress: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("recipient_wallet", walletAddress)
        .eq("read", false);

      if (error) {
        console.error("Failed to mark notifications as read:", error);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    [queryClient]
  );

  return { markRead };
}
