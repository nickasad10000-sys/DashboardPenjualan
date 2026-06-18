import { useState, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Search, ChevronDown, ChevronRight, Building } from "lucide-react";

export default function Developer() {
  const { data: developers, isLoading } = useQuery({ queryKey: ["developers"], queryFn: api.developers });
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (name: string) => setExpanded(prev => ({ ...prev, [name]: !prev[name] }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-gray-100 animate-pulse rounded-md" />
        <div className="h-[600px] bg-gray-100 animate-pulse rounded-xl" />
      </div>
    );
  }

  const filtered = (developers ?? [])
    .filter(d => d.namaDeveloper.toLowerCase().includes(search.toLowerCase()) || d.asosiasi.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.totalUnit - a.totalUnit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Developer</h1>
        <p className="text-gray-500 mt-1">Daftar pengembang perumahan subsidi di Kabupaten Lumajang</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="font-semibold text-gray-900">Daftar Pengembang</h3>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Cari developer atau asosiasi..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-auto rounded-md border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3 text-left font-medium">Nama Developer</th>
                <th className="px-4 py-3 text-left font-medium">Asosiasi</th>
                <th className="px-4 py-3 text-right font-medium">Lokasi</th>
                <th className="px-4 py-3 text-right font-medium">Total Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((dev) => (
                <Fragment key={dev.namaDeveloper}>
                  <tr className="cursor-pointer hover:bg-gray-50" onClick={() => toggle(dev.namaDeveloper)}>
                    <td className="px-4 py-3 text-gray-400">
                      {expanded[dev.namaDeveloper] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900">{dev.namaDeveloper}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 border border-gray-200 rounded text-xs text-gray-600">{dev.asosiasi}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{dev.jumlahLokasi}</td>
                    <td className="px-4 py-3 text-right font-medium">{dev.totalUnit.toLocaleString()}</td>
                  </tr>
                  {expanded[dev.namaDeveloper] && (
                    <tr className="bg-gray-50/70">
                      <td colSpan={5} className="p-0">
                        <div className="p-4 pl-12 space-y-3">
                          <h4 className="text-sm font-semibold flex items-center gap-2 text-gray-700">
                            <Building className="h-4 w-4 text-gray-400" />
                            Daftar Perumahan ({dev.listings.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {dev.listings.map(l => (
                              <div key={l.idLokasi} className="bg-white rounded-md border border-gray-100 p-3">
                                <div className="font-medium text-sm truncate text-gray-900" title={l.namaPerumahan}>{l.namaPerumahan}</div>
                                <div className="text-xs text-gray-500 flex justify-between mt-1">
                                  <span>{l.kecamatan}</span>
                                  <span className="font-semibold text-gray-800">{l.jumlahUnit || 0} unit</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="h-24 text-center text-gray-400">Tidak ada data ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
