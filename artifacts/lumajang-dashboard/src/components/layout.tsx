import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, RefreshCw, Menu, BarChart2, Download,
  ChevronRight, Bell, X, CheckCheck,
} from "lucide-react";
import {
  useRefreshLumajangData,
  useGetLumajangSummary,
  getGetLumajangSummaryQueryKey,
  getGetLumajangKecamatanQueryKey,
  getGetLumajangDevelopersQueryKey,
  getGetLumajangListingsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast as sonnerToast } from "sonner";

interface SaleEventItem {
  id: string;
  recordedAt: string;
  listingChanges: Array<{
    idLokasi: string;
    namaPerumahan: string;
    namaDeveloper: string;
    kecamatan: string;
    unitLaku: number;
    unitSebelum: number;
    unitSesudah: number;
  }>;
  totalLaku: number;
}

interface InAppNotification {
  id: string;
  eventId: string;
  recordedAt: string;
  message: string;
  detail: string;
  namaPerumahan: string;
  unitLaku: number;
  kecamatan: string;
}

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/analytics", label: "Analisa Detail", icon: BarChart2 },
  { path: "/export", label: "Export / Import", icon: Download },
];

const LAST_SEEN_KEY = "lumajang-notif-last-seen-at";

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { data } = useQuery<{ notifications: InAppNotification[]; total: number }>({
    queryKey: ["in-app-notifications"],
    queryFn: async () => {
      const res = await fetch("/api/lumajang/in-app-notifications");
      if (!res.ok) throw new Error("Gagal");
      return res.json();
    },
    refetchInterval: 60000,
  });

  const notifications = data?.notifications ?? [];

  return (
    <div className="absolute right-0 top-10 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-semibold">Notifikasi Penjualan</span>
          {notifications.length > 0 && (
            <Badge variant="secondary" className="text-xs">{notifications.length}</Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
            <Bell className="h-8 w-8 opacity-30" />
            <div className="text-center">
              <p className="text-sm font-medium">Belum ada notifikasi</p>
              <p className="text-xs mt-0.5">Penjualan akan muncul otomatis</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCheck className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight truncate">{n.message}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{n.detail}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(n.recordedAt), "dd MMM yyyy, HH:mm", { locale: id })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-border bg-muted/20 text-center">
        <p className="text-xs text-muted-foreground">Data penjualan 30 hari terakhir</p>
      </div>
    </div>
  );
}

function SidebarContent({ currentLocation, onClose }: { currentLocation: string; onClose?: () => void }) {
  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      <div className="p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            L
          </div>
          <div>
            <h2 className="text-sm font-bold text-sidebar-foreground leading-tight">Dashboard Perumahan</h2>
            <p className="text-xs text-sidebar-foreground/60">Kab. Lumajang</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5">
        <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-3 py-2">Menu</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path === "/"
            ? currentLocation === "/"
            : currentLocation.startsWith(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900 p-3">
          <p className="text-xs text-sidebar-foreground/60 leading-relaxed text-center">
            Data diambil langsung dari<br />
            <span className="font-semibold text-blue-600 dark:text-blue-400">SIKUMBANG Tapera</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const prevEventCountRef = useRef<number | null>(null);
  const lastSeenAtRef = useRef<string>(
    localStorage.getItem(LAST_SEEN_KEY) ?? new Date(0).toISOString()
  );

  const { data: summary } = useGetLumajangSummary({
    query: {
      refetchInterval: (query) => {
        const data = query.state.data;
        return data?.scraping?.inProgress ? 3000 : false;
      },
    },
  });

  const { data: saleEventsData } = useQuery<{ events: SaleEventItem[]; totalLaku: number; count: number }>({
    queryKey: ["sale-events-layout"],
    queryFn: async () => {
      const res = await fetch("/api/lumajang/sale-events");
      if (!res.ok) throw new Error("Gagal");
      return res.json();
    },
    refetchInterval: 60000,
    placeholderData: (prev) => prev,
  });

  const { data: notifData } = useQuery<{ notifications: InAppNotification[]; total: number }>({
    queryKey: ["in-app-notifications"],
    queryFn: async () => {
      const res = await fetch("/api/lumajang/in-app-notifications");
      if (!res.ok) throw new Error("Gagal");
      return res.json();
    },
    refetchInterval: 60000,
    placeholderData: (prev) => prev,
  });

  const notifications = notifData?.notifications ?? [];
  const unreadCount = notifications.filter(
    (n) => n.recordedAt > lastSeenAtRef.current
  ).length;

  useEffect(() => {
    const events = saleEventsData?.events ?? [];
    const currentCount = events.length;

    if (prevEventCountRef.current !== null && currentCount > prevEventCountRef.current) {
      const newEvents = events.slice(0, currentCount - prevEventCountRef.current);
      for (const ev of newEvents) {
        for (const c of ev.listingChanges) {
          const tgl = format(new Date(ev.recordedAt), "dd MMMM yyyy", { locale: id });
          sonnerToast.success(`${c.namaPerumahan} Terjual ${c.unitLaku} unit`, {
            description: `${c.kecamatan} · ${tgl}`,
            duration: 8000,
          });
        }
      }
      queryClient.invalidateQueries({ queryKey: ["in-app-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["sale-events"] });
    }

    prevEventCountRef.current = currentCount;
  }, [saleEventsData?.events?.length]);

  const handleOpenNotif = () => {
    setNotifOpen((v) => !v);
    const now = new Date().toISOString();
    lastSeenAtRef.current = now;
    localStorage.setItem(LAST_SEEN_KEY, now);
  };

  const refreshMutation = useRefreshLumajangData({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetLumajangSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLumajangKecamatanQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLumajangDevelopersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLumajangListingsQueryKey() });
        toast({
          title: "Refresh dimulai",
          description: "Data sedang diambil dari SIKUMBANG di background.",
        });
      },
      onError: () => {
        toast({
          title: "Gagal memperbarui data",
          description: "Terjadi kesalahan saat mengambil data terbaru.",
          variant: "destructive",
        });
      },
    },
  });

  const isRefreshing = refreshMutation.isPending;
  const isScrapingBg = summary?.scraping?.inProgress ?? false;

  const currentNavLabel = navItems.find((n) =>
    n.path === "/" ? location === "/" : location.startsWith(n.path)
  )?.label ?? "Dashboard";

  return (
    <div className="min-h-screen bg-background flex w-full">
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50">
        <SidebarContent currentLocation={location} />
      </div>

      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <header className="h-16 border-b border-border bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 border-r-0">
                <SidebarContent currentLocation={location} onClose={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            <div>
              <p className="text-sm font-semibold hidden sm:block">{currentNavLabel}</p>
              {summary?.lastUpdated && (
                <p className="text-xs text-muted-foreground">
                  Update: {format(new Date(summary.lastUpdated), "dd MMM yyyy, HH:mm", { locale: id })}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isScrapingBg && (
              <Badge variant="secondary" className="text-xs hidden sm:flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                Scraping...
              </Badge>
            )}

            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleOpenNotif}
                className="relative"
                title="Notifikasi Penjualan"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold leading-none" style={{ fontSize: "9px" }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
              {notifOpen && (
                <NotificationPanel onClose={() => setNotifOpen(false)} />
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshMutation.mutate()}
              disabled={isRefreshing || isScrapingBg}
              className="gap-2 bg-blue-600 text-white hover:bg-blue-700 border-blue-600 hover:border-blue-700"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing || isScrapingBg ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">
                {isScrapingBg ? "Scraping..." : "Refresh Data"}
              </span>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {notifOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
      )}
    </div>
  );
}
