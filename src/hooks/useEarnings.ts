import { useQuery } from "@tanstack/react-query";
import { supabase } from "../services/supabase";

interface EarningsData {
  totalEarnedLamports: number;
  totalVouches: number;
  photoCount: number;
}

export function useEarnings(walletAddress: string | null) {
  return useQuery({
    queryKey: ["earnings", walletAddress],
    queryFn: async (): Promise<EarningsData> => {
      if (!walletAddress) {
        return { totalEarnedLamports: 0, totalVouches: 0, photoCount: 0 };
      }

      const { data, error } = await supabase
        .from("photos")
        .select("total_earned_lamports, vouch_count")
        .eq("creator_wallet", walletAddress);

      if (error) throw error;

      const photos = data ?? [];
      return {
        totalEarnedLamports: photos.reduce(
          (sum, p) => sum + (p.total_earned_lamports || 0),
          0
        ),
        totalVouches: photos.reduce(
          (sum, p) => sum + (p.vouch_count || 0),
          0
        ),
        photoCount: photos.length,
      };
    },
    enabled: !!walletAddress,
    staleTime: 15_000, // 15 seconds
  });
}

export function useSolPrice() {
  return useQuery({
    queryKey: ["sol-price"],
    queryFn: async (): Promise<number> => {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
        );
        const data = await response.json();
        return data.solana?.usd ?? 0;
      } catch {
        return 0;
      }
    },
    staleTime: 60_000, // 1 minute
  });
}
