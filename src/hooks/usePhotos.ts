import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { Photo, User, Vouch } from "../types";

export function useFeedPhotos() {
  return useQuery({
    queryKey: ["photos", "feed"],
    queryFn: async (): Promise<Photo[]> => {
      const { data, error } = await supabase
        .from("photos")
        .select(
          `
          *,
          creator:users!creator_id(*)
        `
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useUserPhotos(walletAddress: string | null) {
  return useQuery({
    queryKey: ["photos", "user", walletAddress],
    queryFn: async (): Promise<Photo[]> => {
      if (!walletAddress) return [];
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("creator_wallet", walletAddress)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!walletAddress,
  });
}

export function usePhotoDetail(photoId: string) {
  return useQuery({
    queryKey: ["photos", "detail", photoId],
    queryFn: async (): Promise<Photo | null> => {
      const { data, error } = await supabase
        .from("photos")
        .select(
          `
          *,
          creator:users!creator_id(*)
        `
        )
        .eq("id", photoId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!photoId,
  });
}

export function usePhotoVouches(photoId: string) {
  return useQuery({
    queryKey: ["vouches", photoId],
    queryFn: async (): Promise<Vouch[]> => {
      const { data, error } = await supabase
        .from("vouches")
        .select(
          `
          *,
          voucher:users!voucher_id(*)
        `
        )
        .eq("photo_id", photoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!photoId,
  });
}

export function useUserInfo(walletAddress: string | null) {
  return useQuery({
    queryKey: ["user-info", walletAddress],
    queryFn: async (): Promise<User | null> => {
      if (!walletAddress) return null;
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("wallet_address", walletAddress)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!walletAddress,
  });
}

export function useRefreshFeed() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["photos", "feed"] });
}
