import { useState, Fragment, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useGetLumajangSummary,
  useGetLumajangKecamatan,
  useGetLumajangListings,
  useGetLumajangDevelopers,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LabelList,
} from "recharts";
import {
  Building, MapPin, Package, Loader2, Activity,
  ChevronDown, ChevronRight, Search, TrendingDown, Home,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PerumahanMap, type PerumahanListing } from "@/components/perumahan-map";
import { format } from "date-fns";
import { id } from "date-fns/locale";

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

type RawListing = PerumahanListing & {
  jenisPerumahan?: string;
  kelurahan?: string | null;
  asosiasi?: string;
  foto?: string[];
};

function LokasiModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const { data: allListings, isLoading } = useGetLumajangListings(
    { page: 1, limit: 500 },
    { query: { enabled: open } }
  );

  const listings = (allListings?.data ?? []) as RawListing[];

  const filtered = listings.filter(
    (l) =>
      l.namaPerumahan.toLowerCase().includes(search.toLowerCase()) ||
      l.kecamatan.toLowerCase().includes(search.toLowerCase()) ||
      l.namaDeveloper.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl max-h-[92dvh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-4 sm:px-6 pt-5 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <MapPin className="h-5 w-5 text-blue-600 shrink-0" />
            {listings.length} Lokasi Perumahan — Kab. Lumajang
          </DialogTitle>
          <DialogDescription className="sr-only">Daftar semua lokasi perumahan subsidi di Kabupaten Lumajang</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="shrink-0" style={{ height: "260px" }}>
                <PerumahanMap listings={listings} height="260px" />
              </div>
              <div className="px-4 sm:px-6 py-4 border-t">
                <div className="text-xs text-muted-foreground mb-3 flex gap-3 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-full bg-blue-600" /> Lokasi GPS asli
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-full bg-slate-400" /> Estimasi kecamatan
                  </span>
                </div>
                <div className="relative mb-4">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari perumahan, kecamatan, atau developer..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[160px]">Nama Perumahan</TableHead>
                        <TableHead className="min-w-[140px]">Developer</TableHead>
                        <TableHead className="min-w-[100px]">Kecamatan</TableHead>
                        <TableHead className="text-right min-w-[80px]">Unit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((l) => (
                        <TableRow key={l.idLokasi}>
                          <TableCell className="font-medium text-sm">{l.namaPerumahan}</TableCell>
                          <TableCell className="text-sm">{l.namaDeveloper}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-normal text-xs">{l.kecamatan}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{l.jumlahUnit ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                      {filtered.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            Tidak ada hasil ditemukan
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeveloperModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { data: developers, isLoading } = useGetLumajangDevelopers({ query: { enabled: open } });

  const filtered = (developers ?? [])
    .filter(
      (d) =>
        d.namaDeveloper.toLowerCase().includes(search.toLowerCase()) ||
        d.asosiasi.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.totalUnit - a.totalUnit);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl max-h-[92dvh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-4 sm:px-6 pt-5 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Building className="h-5 w-5 text-blue-600 shrink-0" />
            {developers?.length ?? 0} Developer Aktif
          </DialogTitle>
          <DialogDescription className="sr-only">Daftar developer perumahan subsidi aktif di Kabupaten Lumajang</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari developer atau asosiasi..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead className="min-w-[160px]">Developer</TableHead>
                    <TableHead className="min-w-[100px]">Asosiasi</TableHead>
                    <TableHead className="text-right min-w-[60px]">Lokasi</TableHead>
                    <TableHead className="text-right min-w-[80px]">Total Unit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((dev) => (
                    <Fragment key={dev.namaDeveloper}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setExpanded((p) => ({ ...p, [dev.namaDeveloper]: !p[dev.namaDeveloper] }))}
                      >
                        <TableCell>
                          {expanded[dev.namaDeveloper]
                            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          }
                        </TableCell>
                        <TableCell className="font-bold text-sm">{dev.namaDeveloper}</TableCell>
                        <TableCell><Badge variant="outline" className="font-normal text-xs">{dev.asosiasi}</Badge></TableCell>
                        <TableCell className="text-right">{dev.jumlahLokasi}</TableCell>
                        <TableCell className="text-right font-semibold">{dev.totalUnit.toLocaleString()}</TableCell>
                      </TableRow>

                      {expanded[dev.namaDeveloper] && (
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={5} className="p-0">
                            <div className="p-4 pl-6 sm:pl-10">
                              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                                Perumahan ({dev.listings.length})
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {dev.listings.map((l: RawListing) => {
                                  const unit = l.jumlahUnit ? parseInt(l.jumlahUnit, 10) : 0;
                                  return (
                                    <div key={l.idLokasi} className="bg-background rounded border p-3">
                                      <div className="font-medium text-sm leading-tight">{l.namaPerumahan}</div>
                                      <div className="flex items-center justify-between mt-1">
                                        <span className="text-xs text-muted-foreground">{l.kecamatan}</span>
                                        <span className="text-xs text-blue-600 font-semibold">
                                          {unit > 0 ? `${unit.toLocaleString()} unit` : "—"}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Tidak ada data ditemukan.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StokModal({ open, onClose, summary }: {
  open: boolean;
  onClose: () => void;
  summary: { totalStok: number; totalDipilih: number; totalSisa: number } | undefined;
}) {
  const [search, setSearch] = useState("");
  const { data: listingsResp, isLoading: isListingsLoading } = useGetLumajangListings(
    { page: 1, limit: 500 },
    { query: { enabled: open } }
  );
  const { data: kecamatanData } = useGetLumajangKecamatan({ query: { enabled: open } });

  const listings = (listingsResp?.data ?? []) as RawListing[];

  const kecMap: Record<string, { supply: number; pilihan: number }> = {};
  for (const k of kecamatanData ?? []) {
    kecMap[k.namaWilayah?.toUpperCase()] = { supply: k.supply, pilihan: k.pilihan };
  }

  const withEstimate = listings
    .map((l) => {
      const unit = parseInt(l.jumlahUnit ?? "0", 10) || 0;
      const kec = kecMap[l.kecamatan?.toUpperCase()] ?? { supply: 0, pilihan: 0 };
      const estPilihan = kec.supply > 0 ? Math.round((unit / kec.supply) * kec.pilihan) : 0;
      const estSisa = Math.max(0, unit - estPilihan);
      return { ...l, unit, estPilihan, estSisa };
    })
    .filter((l) => l.unit > 0)
    .sort((a, b) => b.unit - a.unit);

  const filtered = withEstimate.filter(
    (l) =>
      l.namaPerumahan.toLowerCase().includes(search.toLowerCase()) ||
      l.kecamatan.toLowerCase().includes(search.toLowerCase()) ||
      l.namaDeveloper.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl max-h-[92dvh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-4 sm:px-6 pt-5 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Package className="h-5 w-5 text-blue-600 shrink-0" />
            Rincian Stok per Perumahan
          </DialogTitle>
          <DialogDescription className="sr-only">Rincian stok unit tersedia dan dipilih per perumahan di Kabupaten Lumajang</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          {summary && (
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5">
              <div className="rounded-xl border p-3 sm:p-4 text-center bg-gradient-to-br from-blue-50 to-white">
                <div className="text-lg sm:text-2xl font-bold text-blue-600">{(summary.totalStok ?? 0).toLocaleString()}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Total Stok</div>
              </div>
              <div className="rounded-xl border border-yellow-200 bg-gradient-to-br from-yellow-50 to-white p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-2xl font-bold text-yellow-600">{(summary.totalDipilih ?? 0).toLocaleString()}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Dipilih</div>
                <div className="text-xs text-yellow-600 mt-0.5">
                  {(summary.totalStok ?? 0) > 0 ? (((summary.totalDipilih ?? 0) / (summary.totalStok ?? 1)) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-2xl font-bold text-green-600">{(summary.totalSisa ?? 0).toLocaleString()}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Sisa Tersedia</div>
                <div className="text-xs text-green-600 mt-0.5">
                  {(summary.totalStok ?? 0) > 0 ? (((summary.totalSisa ?? 0) / (summary.totalStok ?? 1)) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
          )}

          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari perumahan, kecamatan, atau developer..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isListingsLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Perumahan</TableHead>
                      <TableHead className="min-w-[90px]">Kecamatan</TableHead>
                      <TableHead className="text-right min-w-[70px]">Total Stok</TableHead>
                      <TableHead className="text-right min-w-[90px]">Est. Terjual</TableHead>
                      <TableHead className="text-right min-w-[80px]">Sisa Tersedia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((l) => {
                      const pct = l.unit > 0 ? ((l.estPilihan / l.unit) * 100) : 0;
                      return (
                        <TableRow key={l.idLokasi}>
                          <TableCell>
                            <div className="font-medium text-sm leading-tight">{l.namaPerumahan}</div>
                            <div className="text-xs text-muted-foreground">{l.namaDeveloper}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-normal text-xs">{l.kecamatan}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{l.unit.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <span className={`font-semibold ${pct >= 80 ? "text-red-600" : pct >= 50 ? "text-yellow-600" : "text-green-600"}`}>
                              {l.estPilihan.toLocaleString()} unit
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-blue-600 font-semibold">{l.estSisa.toLocaleString()} unit</TableCell>
                        </TableRow>
                      );
                    })}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Tidak ada data ditemukan
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                * "Est. Terjual" = estimasi proporsional dari data dipilih per kecamatan · "Sisa Tersedia" = unit belum terjual
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ClickableStatCard({
  title, value, icon: Icon, description, sub, color = "blue", onClick,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  sub?: string;
  color?: "blue" | "green" | "purple" | "orange";
  onClick: () => void;
}) {
  const colorMap = {
    blue: "from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800",
    green: "from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800",
    purple: "from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800",
    orange: "from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
  };

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg active:scale-[0.98] bg-gradient-to-br ${colorMap[color]} text-white border-0`}
      onClick={onClick}
    >
      <CardContent className="px-5 py-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">{title}</p>
            <p className="text-3xl font-bold mt-1 text-white">{value}</p>
            {description && <p className="text-xs text-white/70 mt-1">{description}</p>}
            {sub && <p className="text-xs text-white/60 mt-0.5">{sub}</p>}
            <p className="text-xs text-white/80 mt-2 font-medium underline underline-offset-2">Klik untuk detail →</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MonthlyRankingItem {
  idLokasi: string;
  namaPerumahan: string;
  namaDeveloper: string;
  kecamatan: string;
  unitLaku: number;
}

interface MonthlyRankingData {
  bulan: string;
  events: number;
  totalLaku: number;
  ranking: MonthlyRankingItem[];
}

export default function Dashboard() {
  const [openModal, setOpenModal] = useState<"lokasi" | "developer" | "stok" | null>(null);

  const { data: summary, isLoading: isSummaryLoading } = useGetLumajangSummary({
    query: {
      refetchInterval: (query) => {
        const data = query.state.data;
        return data?.scraping?.inProgress ? 3000 : false;
      },
      placeholderData: (prev) => prev,
    },
  });
  const { data: kecamatan, isLoading: isKecamatanLoading } = useGetLumajangKecamatan({
    query: { placeholderData: (prev) => prev },
  });
  const { data: saleEventsData } = useQuery<{ events: SaleEventItem[]; totalLaku: number; count: number }>({
    queryKey: ["sale-events"],
    queryFn: async () => {
      const res = await fetch("/api/lumajang/sale-events");
      if (!res.ok) throw new Error("Gagal");
      return res.json();
    },
    refetchInterval: 60000,
    placeholderData: (prev) => prev,
  });
  const saleEvents = saleEventsData?.events ?? [];

  const isLoading = isSummaryLoading && !summary;
  const isKecLoading = isKecamatanLoading && !kecamatan;
  const isScrapingInProgress = summary?.scraping?.inProgress ?? false;
  const scrapingPct = summary?.scraping?.totalPages
    ? Math.round((summary.scraping.pagesScraped / summary.scraping.totalPages) * 100)
    : 0;

  const { data: monthlyRanking } = useQuery<MonthlyRankingData>({
    queryKey: ["sale-events-monthly"],
    queryFn: async () => {
      const res = await fetch("/api/lumajang/sale-events-monthly");
      if (!res.ok) throw new Error("Gagal");
      return res.json();
    },
    refetchInterval: 60000,
    placeholderData: (prev) => prev,
  });

  const monthlyRankingChartData = useMemo(() => {
    return (monthlyRanking?.ranking ?? []).map((r) => ({
      name: r.namaPerumahan.length > 24 ? r.namaPerumahan.slice(0, 24) + "…" : r.namaPerumahan,
      fullName: r.namaPerumahan,
      developer: r.namaDeveloper,
      kecamatan: r.kecamatan,
      unitLaku: r.unitLaku,
    }));
  }, [monthlyRanking]);

  const monthlyBulanLabel = useMemo(() => {
    if (!monthlyRanking?.bulan) {
      return new Date().toLocaleString("id-ID", { month: "long", year: "numeric" });
    }
    const [yr, mo] = monthlyRanking.bulan.split("-");
    return new Date(parseInt(yr), parseInt(mo) - 1, 1).toLocaleString("id-ID", { month: "long", year: "numeric" });
  }, [monthlyRanking]);

  if (isLoading || isKecLoading) {
    return (
      <div className="space-y-6 p-1">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-muted animate-pulse rounded-xl" />
          <div className="h-80 bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  if (!summary || !kecamatan) return null;

  const topKecamatan = [...kecamatan]
    .filter((k) => k.supply > 0)
    .sort((a, b) => b.supply - a.supply)
    .slice(0, 10)
    .map((k) => ({
      name: k.namaWilayah.replace(/^KEC\.?\s*/i, ""),
      "Total Stok": k.supply,
      "Sudah Dipilih": k.pilihan,
    }));

  const pieData = [
    { name: "Dipilih", value: summary.totalDipilih, color: "#eab308" },
    { name: "Sisa Tersedia", value: summary.totalSisa, color: "#22c55e" },
  ];

  const allSaleItems = saleEvents.flatMap((ev) =>
    ev.listingChanges.map((c) => ({ ...c, recordedAt: ev.recordedAt, eventId: ev.id }))
  ).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));

  return (
    <div className="space-y-5 p-1">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Ringkasan Eksekutif</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Status perumahan subsidi Kabupaten Lumajang — klik kartu untuk detail
        </p>
      </div>

      {isScrapingInProgress && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex items-start gap-3">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin mt-0.5 shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-blue-800 truncate">Mengambil data terbaru dari SIKUMBANG Tapera (background)...</p>
                  <span className="text-sm font-bold text-blue-700 shrink-0">{scrapingPct}%</span>
                </div>
                <Progress value={scrapingPct} className="h-2" />
                <p className="text-xs text-blue-600">
                  {summary.scraping.pagesScraped.toLocaleString()} dari {summary.scraping.totalPages.toLocaleString()} halaman
                  — {summary.totalLokasi} lokasi ditemukan · Data lama masih aktif selama proses berlangsung
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ClickableStatCard
          title="Total Lokasi"
          value={isScrapingInProgress ? `${summary.totalLokasi}…` : summary.totalLokasi}
          icon={MapPin}
          description="Lihat peta & daftar perumahan"
          color="blue"
          onClick={() => setOpenModal("lokasi")}
        />
        <ClickableStatCard
          title="Total Developer"
          value={summary.totalDeveloper}
          icon={Building}
          description="Lihat semua developer aktif"
          color="purple"
          onClick={() => setOpenModal("developer")}
        />
        <ClickableStatCard
          title="Total Stok"
          value={(summary.totalStok ?? 0).toLocaleString()}
          icon={Package}
          description={`${(summary.totalDipilih ?? 0).toLocaleString()} dipilih`}
          sub={`${(summary.totalSisa ?? 0).toLocaleString()} unit tersedia`}
          color="green"
          onClick={() => setOpenModal("stok")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base font-semibold">Supply vs Peminat per Kecamatan (Top 10)</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-[280px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topKecamatan} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Total Stok" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Sudah Dipilih" fill="#eab308" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base font-semibold">Proporsi Stok</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Legend verticalAlign="bottom" height={30} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-center">
              <div className="text-xs font-medium text-muted-foreground">Tingkat Dipilih</div>
              <div className="text-3xl font-bold mt-0.5 text-yellow-600">
                {summary.totalStok > 0
                  ? ((summary.totalDipilih / summary.totalStok) * 100).toFixed(1)
                  : "0.0"}%
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">dari total stok</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aktivitas Penjualan Terbaru */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-green-600" />
              </div>
              Aktivitas Penjualan Terbaru
            </CardTitle>
            {saleEventsData && saleEventsData.count > 0 && (
              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                {saleEventsData.totalLaku.toLocaleString()} unit terjual
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Tersimpan 30 hari · Terdeteksi otomatis saat stok berkurang · Tetap ada setelah refresh/tutup browser
          </p>
        </CardHeader>
        <CardContent>
          {allSaleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Home className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Belum ada penjualan terdeteksi</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tekan "Refresh Data" minimal 2x untuk mendeteksi perubahan stok
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {allSaleItems.slice(0, 10).map((c, idx) => (
                <div key={`${c.eventId}-${c.idLokasi}-${idx}`}
                  className="flex items-center justify-between rounded-xl border border-green-100 bg-gradient-to-r from-green-50/50 to-white p-3 gap-3 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                      <Home className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight truncate">{c.namaPerumahan}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.namaDeveloper} · {c.kecamatan}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-green-600">Terjual {c.unitLaku} unit</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(c.recordedAt), "dd MMM yyyy", { locale: id })}
                    </p>
                  </div>
                </div>
              ))}
              {allSaleItems.length > 10 && (
                <p className="text-xs text-center text-muted-foreground pt-1">
                  +{allSaleItems.length - 10} transaksi lainnya tercatat (lihat Export untuk data lengkap)
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ranking Penjualan Bulan Ini */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
                <Activity className="h-4 w-4 text-orange-500" />
              </div>
              Ranking Penjualan Bulan Ini — {monthlyBulanLabel}
            </CardTitle>
            {monthlyRanking && monthlyRanking.totalLaku > 0 && (
              <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs shrink-0">
                {monthlyRanking.totalLaku} unit terjual bulan ini
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Unit terjual yang terdeteksi bulan ini berdasarkan penurunan stok antar refresh
          </p>
        </CardHeader>
        <CardContent className="px-2 sm:px-4">
          {monthlyRankingChartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Activity className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Belum ada penjualan terdeteksi bulan ini</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tekan "Refresh Data" minimal 2x untuk mendeteksi perubahan stok
                </p>
              </div>
            </div>
          ) : (
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyRankingChartData}
                  layout="vertical"
                  margin={{ top: 4, right: 48, left: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={135} />
                  <Tooltip
                    formatter={(v: number) => [`${v} unit terjual`, "Unit Terjual Bulan Ini"]}
                    labelFormatter={(_, payload) => {
                      const p = payload?.[0]?.payload;
                      return p ? `${p.fullName} · ${p.kecamatan}` : "";
                    }}
                    contentStyle={{ fontSize: 11 }}
                  />
                  <Bar dataKey="unitLaku" name="Unit Terjual" fill="#f97316" radius={[0, 3, 3, 0]}>
                    <LabelList dataKey="unitLaku" position="right" style={{ fontSize: 10, fill: "#374151", fontWeight: "700" }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <LokasiModal open={openModal === "lokasi"} onClose={() => setOpenModal(null)} />
      <DeveloperModal open={openModal === "developer"} onClose={() => setOpenModal(null)} />
      <StokModal open={openModal === "stok"} onClose={() => setOpenModal(null)} summary={summary} />
    </div>
  );
}
