import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingDown, Activity, AlertCircle, Building2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface ListingChange {
  idLokasi: string;
  namaPerumahan: string;
  namaDeveloper: string;
  kecamatan: string;
  unitLaku: number;
  unitSebelum: number;
  unitSesudah: number;
}

interface SaleEvent {
  id: string;
  recordedAt: string;
  listingChanges: ListingChange[];
  totalLaku: number;
}

interface SaleEventsResponse {
  events: SaleEvent[];
  totalLaku: number;
  count: number;
}

async function fetchSaleEvents(): Promise<SaleEventsResponse> {
  const res = await fetch("/api/lumajang/sale-events");
  if (!res.ok) throw new Error("Gagal mengambil data penjualan");
  return res.json();
}

function formatDate(iso: string) {
  try {
    return format(new Date(iso), "dd MMM yyyy, HH:mm", { locale: id });
  } catch {
    return iso;
  }
}

function StatCard({ title, value, icon: Icon, sub }: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function PenjualanRealtime() {
  const { data, isLoading } = useQuery<SaleEventsResponse>({
    queryKey: ["sale-events"],
    queryFn: fetchSaleEvents,
    refetchInterval: 30000,
  });

  const events = data?.events ?? [];

  const allChanges = events.flatMap((e) =>
    e.listingChanges.map((c) => ({ ...c, recordedAt: e.recordedAt, eventId: e.id }))
  );

  const chartData = [...events]
    .reverse()
    .slice(-20)
    .map((e) => ({
      label: format(new Date(e.recordedAt), "dd/MM HH:mm"),
      unit: e.totalLaku,
    }));

  const perumahanTerdampak = new Set(allChanges.map((c) => c.idLokasi));
  const developerTerdampak = new Set(allChanges.map((c) => c.namaDeveloper));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Penjualan Realtime</h1>
        <p className="text-muted-foreground mt-1">
          Setiap unit stok perumahan yang berkurang antar refresh dihitung sebagai penjualan baru
        </p>
      </div>

      {events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <Activity className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Belum ada penjualan tercatat</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-md">
                Penjualan dideteksi otomatis saat jumlah unit suatu perumahan <strong>berkurang</strong> antara
                dua refresh data. Klik <strong>Refresh Data</strong> minimal dua kali untuk mulai
                mendeteksi perubahan.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-4 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                Saat stok unit perumahan berkurang → event penjualan baru tercatat secara otomatis
              </span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Total Unit Terjual"
              value={data?.totalLaku.toLocaleString() ?? 0}
              icon={TrendingDown}
              sub="Akumulasi sejak monitoring aktif"
            />
            <StatCard
              title="Perumahan Terdampak"
              value={perumahanTerdampak.size}
              icon={Activity}
              sub="Perumahan yang ada penjualan"
            />
            <StatCard
              title="Developer Terdampak"
              value={developerTerdampak.size}
              icon={Building2}
              sub="Developer yang ada unit terjual"
            />
          </div>

          {chartData.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Tren Unit Terjual per Refresh</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip
                        formatter={(v: number) => [`${v} unit`, "Unit terjual"]}
                      />
                      <Bar dataKey="unit" name="Unit terjual" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Riwayat Penjualan per Perumahan</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">Nama Perumahan</TableHead>
                      <TableHead className="min-w-[160px]">Developer</TableHead>
                      <TableHead className="min-w-[100px]">Kecamatan</TableHead>
                      <TableHead className="text-center min-w-[100px]">Unit Terjual</TableHead>
                      <TableHead className="min-w-[80px]">Stok</TableHead>
                      <TableHead className="min-w-[150px]">Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allChanges.map((c) => (
                      <TableRow key={`${c.eventId}-${c.idLokasi}`}>
                        <TableCell className="font-medium text-sm">{c.namaPerumahan}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.namaDeveloper}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal text-xs">{c.kecamatan}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 font-bold text-sm">
                            −{c.unitLaku}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {c.unitSebelum} → {c.unitSesudah}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(c.recordedAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            * Data penjualan dideteksi dari perubahan jumlah unit antara dua refresh SIKUMBANG Tapera.
            Jika unit stok berkurang, terhitung sebagai penjualan baru. Histori tersimpan dan tidak
            hilang saat server restart.
          </p>
        </>
      )}
    </div>
  );
}
