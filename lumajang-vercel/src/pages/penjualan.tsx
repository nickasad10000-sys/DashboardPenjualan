import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { TrendingUp, TrendingDown, Minus, BarChart3, CalendarDays, Building } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-xs text-gray-400">—</span>;
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
    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
      <Minus className="h-3 w-3" />0
    </span>
  );
}

function formatMonth(monthStr: string) {
  try { return format(new Date(monthStr + "-01"), "MMMM yyyy", { locale: id }); }
  catch { return monthStr; }
}

function StatCard({ title, value, icon: Icon, sub }: { title: string; value: string | number; icon: any; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <Icon className="h-4 w-4 text-gray-400" />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function Penjualan() {
  const { data, isLoading } = useQuery({ queryKey: ["penjualan"], queryFn: api.penjualanBulanan });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-gray-100 animate-pulse rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-xl" />)}
        </div>
        <div className="h-[500px] bg-gray-100 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const activeDevs = data.developers.filter(d => d.totalUnit > 0);
  const devsWithDelta = data.developers.filter(d => d.deltaBulanIni !== null && d.deltaBulanIni > 0);
  const totalUnitBulanIni = data.developers.reduce((s, d) => s + (d.deltaBulanIni ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Penjualan Bulanan</h1>
        <p className="text-gray-500 mt-1">Rekap unit terjual per developer — {formatMonth(data.bulan)}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Developer Aktif" value={activeDevs.length} icon={Building} sub={`dari ${data.totalDeveloper} total developer`} />
        <StatCard
          title="Developer Bertumbuh"
          value={<span className="text-green-600">{devsWithDelta.length}</span> as any}
          icon={TrendingUp}
          sub={data.snapshotCount > 1 ? "ada pertambahan unit vs bulan lalu" : "data snapshot pertama"}
        />
        <StatCard
          title="Tambahan Unit Baru"
          value={totalUnitBulanIni > 0 ? `+${totalUnitBulanIni.toLocaleString()}` : "—"}
          icon={BarChart3}
          sub="unit baru terdeteksi bulan ini"
        />
      </div>

      {data.snapshots.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <CalendarDays className="h-4 w-4 text-gray-400" /> Riwayat Snapshot
          </h3>
          <div className="flex flex-wrap gap-3">
            {data.snapshots.map(s => (
              <div key={s.month} className="border border-gray-200 rounded-lg px-4 py-3 text-center min-w-[140px]">
                <div className="text-sm font-semibold text-gray-700">{formatMonth(s.month)}</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{s.totalUnit.toLocaleString()}</div>
                <div className="text-xs text-gray-400">{s.activeDevelopers} developer aktif</div>
                <div className="text-xs text-gray-400 mt-1">
                  {format(new Date(s.recordedAt), "dd MMM HH:mm", { locale: id })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.snapshotCount <= 1 && (
        <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
          <p className="text-sm text-amber-800">
            <strong>Catatan:</strong> Data perubahan bulanan baru tersedia setelah ada minimal 2 siklus refresh data.
            Lakukan refresh data secara berkala untuk melihat tren pertumbuhan penjualan per developer.
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Penjualan per Developer — {formatMonth(data.bulan)}</h3>
        <div className="overflow-auto rounded-md border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-medium w-8">#</th>
                <th className="px-4 py-3 text-left font-medium">Nama Developer</th>
                <th className="px-4 py-3 text-left font-medium">Asosiasi</th>
                <th className="px-4 py-3 text-right font-medium">Lokasi</th>
                <th className="px-4 py-3 text-right font-medium">Total Unit</th>
                <th className="px-4 py-3 text-right font-medium">Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.developers.map((dev, i) => (
                <tr key={dev.namaDeveloper} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">{dev.namaDeveloper}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 border border-gray-200 rounded text-xs text-gray-600">{dev.asosiasi}</span>
                  </td>
                  <td className="px-4 py-3 text-right">{dev.jumlahLokasi}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{dev.totalUnit.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right"><DeltaBadge delta={dev.deltaBulanIni} /></td>
                </tr>
              ))}
              {data.developers.length === 0 && (
                <tr><td colSpan={6} className="h-24 text-center text-gray-400">Tidak ada data penjualan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
