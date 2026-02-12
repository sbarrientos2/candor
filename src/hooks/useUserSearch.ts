import { useQuery } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { User } from "../types";

export function useUserSearch(query: string) {
  return useQuery({
    queryKey: ["users", "search", query],
    queryFn: async (): Promise<User[]> => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .ilike("display_name", `%${query}%`)
        .limit(20);

      if (error) throw error;
      return data ?? [];
    },
    enabled: query.length >= 2,
    staleTime: 60_000,
  });
}
