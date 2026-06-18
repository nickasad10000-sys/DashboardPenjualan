import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabaseClient, realtimeEnabled } from "@/lib/supabase-client";

/**
 * Bug #7 fix — Supabase Realtime WebSocket subscription
 *
 * Menggantikan polling React Query yang menembak HTTP request tiap 3 detik.
 * Saat ada INSERT atau UPDATE di tabel listings/kecamatan_cache/scrape_progress,
 * semua query di-invalidate otomatis — data fresh tanpa polling.
 *
 * Syarat: VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY harus di-set di .env.
 * Jika tidak ada, hook ini no-op dan polling tetap berjalan sebagai fallback.
 */
export function useRealtimeData() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!realtimeEnabled || !supabaseClient) return;

    const channel = supabaseClient
      .channel("lumajang-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listings" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["listings"] });
          queryClient.invalidateQueries({ queryKey: ["developers"] });
          queryClient.invalidateQueries({ queryKey: ["summary"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kecamatan_cache" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["kecamatan"] });
          queryClient.invalidateQueries({ queryKey: ["summary"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scrape_progress" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["summary"] });
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [queryClient]);

  return { realtimeEnabled };
}
