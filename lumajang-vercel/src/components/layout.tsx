import { useState, useCallback, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building, Map, Users, LayoutDashboard, RefreshCw, Menu, TrendingUp, Loader2, X, Wifi, WifiOff
} from "lucide-react";
import { api } from "@/lib/api";
import { useRealtimeData } from "@/hooks/useRealtimeData";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/kecamatan", label: "Analisis Kecamatan", icon: Map },
  { path: "/developer", label: "Data Developer", icon: Users },
  { path: "/listing", label: "Listing Perumahan", icon: Building },
  { path: "/penjualan", label: "Unit per Periode", icon: TrendingUp },
];

const CHUNK_SIZE = 20;

function SidebarContent({ currentPath, onClose }: { currentPath: string; onClose?: () => void }) {
  return (
    <div className="flex flex-col h-full bg-[hsl(222,47%,11%)] border-r border-[hsl(217,33%,17%)]">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-sm">L</div>
          <div>
            <h2 className="text-sm font-bold text-white">Dashboard Perumahan</h2>
            <p className="text-xs text-white/60">Kab. Lumajang</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/60 hover:text-white md:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[hsl(217,33%,20%)] text-white"
                  : "text-white/60 hover:bg-[hsl(217,33%,18%)] hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-[hsl(217,33%,17%)]">
        <p className="text-xs text-white/40 text-center">
          Data diambil langsung dari<br />SIKUMBANG Tapera
        </p>
      </div>
    </div>
  );
}

/**
 * Jalankan loop scraping dari halaman `startPage` sampai selesai.
 * Dipakai baik untuk mulai baru maupun resume setelah tab ditutup (Bug #4).
 */
async function runScrapeLoop(
  startPage: number,
  totalPages: number,
  onStatus: (msg: string) => void,
  onChunkDone: () => void,
): Promise<void> {
  let currentStart = startPage;

  while (currentStart <= totalPages) {
    const currentEnd = Math.min(currentStart + CHUNK_SIZE - 1, totalPages);
    onStatus(`Scraping halaman ${currentStart}–${currentEnd} dari ${totalPages}...`);
    const result = await api.scrapeChunk(currentStart, currentEnd);
    onChunkDone();
    if (result.isDone || result.nextStart === null) break;
    currentStart = result.nextStart;
  }
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<string | null>(null);

  // Bug #7 — Supabase Realtime menggantikan polling saat env vars tersedia
  const { realtimeEnabled } = useRealtimeData();

  const { data: summary } = useQuery({
    queryKey: ["summary"],
    queryFn: api.summary,
    // Polling tetap aktif sebagai fallback jika Realtime tidak tersedia,
    // atau saat scraping sedang berjalan (update progress cepat)
    refetchInterval: (q) => {
      const d = q.state.data;
      if (d?.scraping?.inProgress) return 3000;
      return realtimeEnabled ? false : 30000;
    },
  });

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["summary"] });
    queryClient.invalidateQueries({ queryKey: ["kecamatan"] });
    queryClient.invalidateQueries({ queryKey: ["developers"] });
    queryClient.invalidateQueries({ queryKey: ["listings"] });
    queryClient.invalidateQueries({ queryKey: ["penjualan"] });
  }, [queryClient]);

  /**
   * Bug #4 — Auto-resume scraping yang terputus
   *
   * Saat halaman dibuka, cek scrape_progress di Supabase.
   * Jika ada scraping yang masih `in_progress: true` (artinya tab ditutup di tengah),
   * lanjutkan otomatis dari halaman terakhir yang sudah di-scrape.
   */
  useEffect(() => {
    let cancelled = false;

    async function checkAndResume() {
      try {
        const progress = await api.getProgress();
        if (cancelled) return;

        if (
          progress.inProgress &&
          progress.pagesScraped > 0 &&
          progress.totalPages > 0 &&
          progress.pagesScraped < progress.totalPages
        ) {
          const resumeFrom = progress.pagesScraped + 1;
          setIsRefreshing(true);
          setRefreshStatus(`Melanjutkan scraping dari halaman ${resumeFrom}...`);

          await runScrapeLoop(
            resumeFrom,
            progress.totalPages,
            setRefreshStatus,
            invalidateAll,
          );

          if (!cancelled) {
            setRefreshStatus("Mengambil detail unit...");
            let enrichDone = false;
            while (!enrichDone && !cancelled) {
              const enrichResult = await api.scrapeEnrich();
              enrichDone = enrichResult.done;
              if (!enrichDone) {
                setRefreshStatus(`Enrich ${enrichResult.remaining} listing tersisa...`);
              }
            }

            if (!cancelled) {
              setRefreshStatus("Menyimpan snapshot...");
              await api.saveSnapshot();
              invalidateAll();
              setRefreshStatus(null);
            }
          }
        }
      } catch {
        // Gagal cek progress — abaikan saja, user bisa trigger manual
      } finally {
        if (!cancelled) setIsRefreshing(false);
      }
    }

    checkAndResume();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshStatus("Memulai scraping...");

    try {
      const init = await api.refresh();

      await runScrapeLoop(
        1,
        init.totalPages,
        setRefreshStatus,
        invalidateAll,
      );

      setRefreshStatus("Mengambil detail unit...");
      let enrichDone = false;
      while (!enrichDone) {
        const enrichResult = await api.scrapeEnrich();
        enrichDone = enrichResult.done;
        if (!enrichDone) {
          setRefreshStatus(`Enrich ${enrichResult.remaining} listing tersisa...`);
        }
      }

      setRefreshStatus("Menyimpan snapshot bulanan...");
      await api.saveSnapshot();

      invalidateAll();
      setRefreshStatus(null);
    } catch (err) {
      console.error(err);
      setRefreshStatus("Gagal — coba lagi");
      setTimeout(() => setRefreshStatus(null), 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col md:hidden transition-transform duration-200 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <SidebarContent currentPath={location} onClose={() => setMobileOpen(false)} />
      </div>

      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50">
        <SidebarContent currentPath={location} />
      </div>

      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:block">
              {summary?.lastUpdated && !refreshStatus && (
                <p className="text-sm text-gray-500">
                  Terakhir diperbarui: {format(new Date(summary.lastUpdated), "dd MMM yyyy, HH:mm", { locale: id })}
                </p>
              )}
              {refreshStatus && (
                <p className="text-sm text-blue-600 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {refreshStatus}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Indikator status Realtime */}
            <span
              title={realtimeEnabled ? "Supabase Realtime aktif" : "Mode polling (set VITE_SUPABASE_ANON_KEY untuk Realtime)"}
              className={`hidden sm:flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                realtimeEnabled
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {realtimeEnabled
                ? <><Wifi className="h-3 w-3" /> Realtime</>
                : <><WifiOff className="h-3 w-3" /> Polling</>
              }
            </span>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
