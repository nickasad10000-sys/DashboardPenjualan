import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { Building, MapPin, Package, CheckCircle, Clock, Loader2 } from "lucide-react";

function StatCard({ title, value, icon: Icon, description }: { title: string; value: string | number; icon: any; description?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <Icon className="h-4 w-4 text-gray-400" />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: sl } = useQuery({
    queryKey: ["summary"],
    queryFn: api.summary,
    refetchInterval: (q) => (q.state.data?.scraping?.inProgress ? 3000 : false),
  });
  const { data: kecamatan, isLoading: kl } = useQuery({ queryKey: ["kecamatan"], queryFn: api.kecamatan });
  const { data: listings } = useQuery({
    queryKey: ["listings", 1, 5],
    queryFn: () => api.listings({ page: 1, limit: 5 }),
    refetchInterval: summary?.scraping?.inProgress ? 5000 : false,
  });

  const isLoading = sl || kl;
  const isScrapingInProgress = summary?.scraping?.inProgress ?? false;
  const scrapingPct = summary?.scraping?.totalPages
    ? Math.round((summary.scraping.pagesScraped / summary.scraping.totalPages) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-gray-100 animate-pulse rounded-xl" />
          <div className="h-96 bg-gray-100 animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  if (!summary || !kecamatan) return null;

  const topKecamatan = [...kecamatan].filter(k => k.supply > 0).sort((a, b) => b.supply - a.supply).slice(0, 10);
  const pieData = [
    { name: "Terjual", value: summary.totalTerjual, color: "#eab308" },
    { name: "Sisa Stok", value: summary.totalSisa, color: "#22c55e" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ringkasan Eksekutif</h1>
        <p className="text-gray-500 mt-1">Status ketersediaan perumahan subsidi di Kabupaten Lumajang</p>
      </div>

      {isScrapingInProgress && (
        <div className="border border-blue-200 bg-blue-50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin mt-0.5 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-blue-800">Mengambil data dari SIKUMBANG Tapera...</p>
                <span className="text-sm font-bold text-blue-700">{scrapingPct}%</span>
              </div>
              <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${scrapingPct}%` }} />
              </div>
              <p className="text-xs text-blue-600">
                {summary.scraping.pagesScraped.toLocaleString()} dari {summary.scraping.totalPages.toLocaleString()} halaman dipindai — {summary.totalLokasi} lokasi ditemukan
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Lokasi" value={isScrapingInProgress ? `${summary.totalLokasi}…` : summary.totalLokasi} icon={MapPin} description={isScrapingInProgress ? "Masih dihitung..." : undefined} />
        <StatCard title="Total Developer" value={summary.totalDeveloper} icon={Building} />
        <StatCard title="Total Stok" value={summary.totalStok.toLocaleString()} icon={Package} />
        <StatCard title="Terjual" value={summary.totalTerjual.toLocaleString()} icon={CheckCircle} />
        <StatCard title="Stok Sisa" value={summary.totalSisa.toLocaleString()} icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Distribusi Supply vs Peminat per Kecamatan</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topKecamatan} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="namaWilayah" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="supply" name="Supply (Stok)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="peminatan" name="Peminatan" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center">
          <h3 className="font-semibold text-gray-900 mb-4 self-start">Proporsi Stok</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-center">
            <div className="text-sm text-gray-500">Tingkat Penyerapan</div>
            <div className="text-3xl font-bold mt-1">
              {summary.totalStok > 0 ? ((summary.totalTerjual / summary.totalStok) * 100).toFixed(1) : "0.0"}%
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Listing Terbaru</h3>
        {listings?.data && listings.data.length > 0 ? (
          <div className="overflow-auto rounded-md border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Perumahan</th>
                  <th className="px-4 py-3 text-left font-medium">Developer</th>
                  <th className="px-4 py-3 text-left font-medium">Kecamatan</th>
                  <th className="px-4 py-3 text-right font-medium">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {listings.data.map((l) => (
                  <tr key={l.idLokasi} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{l.namaPerumahan}</td>
                    <td className="px-4 py-3 text-gray-600">{l.namaDeveloper}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{l.kecamatan}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{l.jumlahUnit || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">
            {isScrapingInProgress ? "Menunggu data pertama..." : "Tidak ada data listing"}
          </div>
        )}
      </div>
    </div>
  );
}
