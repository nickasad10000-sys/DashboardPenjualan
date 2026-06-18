import { useGetLumajangPenjualanBulanan } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, BarChart3, CalendarDays, Building } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-xs text-muted-foreground">—</span>;
  if (delta > 0) return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
      <TrendingUp className="h-3 w-3" />+{delta.toLocaleString()}
    </span>
  );
  if (delta < 0) return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
      <TrendingDown className="h-3 w-3" />{delta.toLocaleString()}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Minus className="h-3 w-3" />0
    </span>
  );
}

function formatMonth(monthStr: string) {
  try {
    return format(new Date(monthStr + "-01"), "MMMM yyyy", { locale: id });
  } catch {
    return monthStr;
  }
}

export default function Penjualan() {
  const { data, isLoading } = useGetLumajangPenjualanBulanan();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-muted animate-pulse rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="h-[500px] bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const activeDevs = data.developers.filter((d) => d.totalUnit > 0);
  const devsWithDelta = data.developers.filter((d) => d.deltaBulanIni !== null && d.deltaBulanIni > 0);
  const totalUnitBulanIni = data.developers.reduce((s, d) => s + (d.deltaBulanIni ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Unit Terdaftar Bulanan</h1>
        <p className="text-muted-foreground mt-1">
          Rekap unit terdaftar per developer — {formatMonth(data.bulan)}
        </p>
      </div>

      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Catatan data:</strong> Angka di halaman ini menunjukkan <em>jumlah unit yang terdaftar</em> di SIKUMBANG Tapera,
            bukan transaksi jual beli yang terkonfirmasi. Data SIKUMBANG bersumber dari pengembang yang submit secara manual —
            pemantauan perubahan antar periode menunjukkan tren penambahan stok baru oleh developer.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Developer Aktif</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDevs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">dari {data.totalDeveloper} total developer</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Developer Bertumbuh</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{devsWithDelta.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.snapshotCount > 1 ? "ada pertambahan unit vs bulan lalu" : "data snapshot pertama"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tambahan Unit Baru</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalUnitBulanIni > 0 ? `+${totalUnitBulanIni.toLocaleString()}` : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">unit baru terdeteksi bulan ini</p>
          </CardContent>
        </Card>
      </div>

      {data.snapshots.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Riwayat Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {data.snapshots.map((s) => (
                <div key={s.month} className="border rounded-lg px-4 py-3 text-center min-w-[140px]">
                  <div className="text-sm font-semibold">{formatMonth(s.month)}</div>
                  <div className="text-2xl font-bold mt-1">{s.totalUnit.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{s.activeDevelopers} developer aktif</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(new Date(s.recordedAt), "dd MMM HH:mm", { locale: id })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.snapshotCount <= 1 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Catatan:</strong> Data perubahan bulanan baru tersedia setelah ada minimal 2 siklus refresh data.
              Lakukan refresh data secara berkala untuk melihat tren pertumbuhan penjualan per developer.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Unit Terdaftar per Developer — {formatMonth(data.bulan)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Nama Developer</TableHead>
                  <TableHead>Asosiasi</TableHead>
                  <TableHead className="text-right">Lokasi</TableHead>
                  <TableHead className="text-right">Total Unit</TableHead>
                  <TableHead className="text-right">Perubahan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.developers.map((dev, i) => (
                  <TableRow key={dev.namaDeveloper}>
                    <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                    <TableCell className="font-bold">{dev.namaDeveloper}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">{dev.asosiasi}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{dev.jumlahLokasi}</TableCell>
                    <TableCell className="text-right font-semibold">{dev.totalUnit.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <DeltaBadge delta={dev.deltaBulanIni} />
                    </TableCell>
                  </TableRow>
                ))}
                {data.developers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Tidak ada data penjualan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
