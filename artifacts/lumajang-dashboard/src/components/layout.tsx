import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, RefreshCw, Menu } from "lucide-react";
import { useRefreshLumajangData, useGetLumajangSummary, getGetLumajangSummaryQueryKey, getGetLumajangKecamatanQueryKey, getGetLumajangDevelopersQueryKey, getGetLumajangListingsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
];

function SidebarContent({ currentLocation }: { currentLocation: string }) {
  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold">
            L
          </div>
          <div>
            <h2 className="text-sm font-bold text-sidebar-foreground">Dashboard Perumahan</h2>
            <p className="text-xs text-sidebar-foreground/70">Kab. Lumajang</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentLocation === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/50 text-center">
          Data diambil langsung dari<br />SIKUMBANG Tapera
        </p>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: summary } = useGetLumajangSummary();

  const refreshMutation = useRefreshLumajangData({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetLumajangSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLumajangKecamatanQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLumajangDevelopersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLumajangListingsQueryKey() });
        toast({
          title: "Refresh dimulai",
          description: "Data sedang diambil dari SIKUMBANG. Penjualan baru akan tercatat otomatis.",
        });
      },
      onError: () => {
        toast({
          title: "Gagal memperbarui data",
          description: "Terjadi kesalahan saat mengambil data terbaru.",
          variant: "destructive",
        });
      }
    }
  });

  const isRefreshing = refreshMutation.isPending;

  return (
    <div className="min-h-screen bg-background flex w-full">
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50">
        <SidebarContent currentLocation={location} />
      </div>

      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 border-r-0">
                <SidebarContent currentLocation={location} />
              </SheetContent>
            </Sheet>

            <div className="hidden sm:block">
              {summary?.lastUpdated && (
                <p className="text-sm text-muted-foreground">
                  Terakhir diperbarui: {format(new Date(summary.lastUpdated), "dd MMM yyyy, HH:mm", { locale: id })}
                </p>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshMutation.mutate()}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </Button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
