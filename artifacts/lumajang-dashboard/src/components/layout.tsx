import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, RefreshCw, Menu, BarChart2, Download,
  Bell, ChevronRight,
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

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/analytics", label: "Analisa Detail", icon: BarChart2 },
  { path: "/export", label: "Export / Import", icon: Download },
  { path: "/notifications", label: "Notifikasi", icon: Bell },
];

function SidebarContent({ currentLocation, onClose }: { currentLocation: string; onClose?: () => void }) {
  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      <div className="p-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-sidebar-foreground/40" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="rounded-lg bg-sidebar-accent/30 p-3">
          <p className="text-xs text-sidebar-foreground/60 leading-relaxed text-center">
            Data diambil langsung dari<br />
            <span className="font-semibold text-sidebar-foreground/80">SIKUMBANG Tapera</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: summary } = useGetLumajangSummary({
    query: {
      refetchInterval: (query) => {
        const data = query.state.data;
        return data?.scraping?.inProgress ? 3000 : false;
      },
    },
  });

  const refreshMutation = useRefreshLumajangData({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetLumajangSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLumajangKecamatanQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLumajangDevelopersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLumajangListingsQueryKey() });
        toast({
          title: "Refresh dimulai",
          description: "Data sedang diambil dari SIKUMBANG di background. Interface tetap aktif.",
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
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshMutation.mutate()}
              disabled={isRefreshing || isScrapingBg}
              className="gap-2"
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
    </div>
  );
}
