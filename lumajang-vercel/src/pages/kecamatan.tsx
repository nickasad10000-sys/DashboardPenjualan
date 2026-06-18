import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

export default function Kecamatan() {
  const { data: kecamatan, isLoading } = useQuery({ queryKey: ["kecamatan"], queryFn: api.kecamatan });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-gray-100 animate-pulse rounded-md" />
        <div className="h-[400px] bg-gray-100 animate-pulse rounded-xl" />
        <div className="h-[600px] bg-gray-100 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!kecamatan) return null;

  const validKecamatan = kecamatan.filter(k => k.supply > 0).sort((a, b) => b.supply - a.supply);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analisis Kecamatan</h1>
        <p className="text-gray-500 mt-1">Perbandingan ketersediaan dan peminatan di tingkat kecamatan</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-1">Distribusi Supply vs Peminat</h3>
        <p className="text-sm text-gray-500 mb-4">Menampilkan kecamatan dengan stok perumahan subsidi</p>
        <div className="h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={validKecamatan} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="namaWilayah" angle={-45} textAnchor="end" height={80} interval={0} tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="supply" name="Total Stok" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pilihan" name="Terjual/Pilihan" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sisa" name="Sisa Stok" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Rincian Data Wilayah</h3>
        <div className="overflow-auto rounded-md border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-medium w-12">#</th>
                <th className="px-4 py-3 text-left font-medium">Kecamatan</th>
                <th className="px-4 py-3 text-right font-medium">Total Stok</th>
                <th className="px-4 py-3 text-right font-medium">Terjual</th>
                <th className="px-4 py-3 text-right font-medium">Sisa</th>
                <th className="px-4 py-3 text-right font-medium">Serapan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {validKecamatan.map((k, index) => {
                const serapan = k.supply > 0 ? (k.pilihan / k.supply) * 100 : 0;
                return (
                  <tr key={k.kodeWilayah} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400 text-sm">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{k.namaWilayah}</td>
                    <td className="px-4 py-3 text-right">{k.supply.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{k.pilihan.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${k.sisa === 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
                        {k.sisa.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{serapan.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
