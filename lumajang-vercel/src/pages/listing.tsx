import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type ListingItem } from "@/lib/api";
import { ChevronLeft, ChevronRight, Loader2, Home, MapPin, Building, Info, X } from "lucide-react";

function proxyFotoUrl(url: string): string {
  return api.proxyFotoUrl(url);
}

function FotoItem({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false);
  if (errored) return null;
  return (
    <img
      src={proxyFotoUrl(src)}
      alt={alt}
      className="rounded-lg object-cover aspect-video w-full bg-gray-100"
      onError={() => setErrored(true)}
    />
  );
}

function ListingDetailModal({ listing, onClose }: { listing: ListingItem | null; onClose: () => void }) {
  if (!listing) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Detail Perumahan</h2>
            <p className="text-sm text-gray-500">Informasi lengkap mengenai lokasi perumahan</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{listing.namaPerumahan}</h3>
            <div className="flex items-center gap-2 mt-2">
              {listing.jenisPerumahan && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{listing.jenisPerumahan}</span>
              )}
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {listing.kecamatan}{listing.kelurahan ? `, ${listing.kelurahan}` : ""}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Building className="h-4 w-4" /> Developer
              </div>
              <div className="font-semibold text-gray-900">{listing.namaDeveloper}</div>
              <div className="text-sm text-gray-500">{listing.asosiasi}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Home className="h-4 w-4" /> Total Unit
              </div>
              <div className="font-semibold text-lg text-gray-900">
                {listing.jumlahUnit ? `${listing.jumlahUnit} Unit` : "—"}
              </div>
            </div>
          </div>

          {listing.foto && listing.foto.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Foto Lokasi</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {listing.foto.map((f, i) => (
                  <FotoItem key={i} src={f} alt={`${listing.namaPerumahan} foto ${i + 1}`} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Listing() {
  const [page, setPage] = useState(1);
  const [kecamatan, setKecamatan] = useState<string>("all");
  const [selected, setSelected] = useState<ListingItem | null>(null);

  const { data: kecamatanList } = useQuery({ queryKey: ["kecamatan"], queryFn: api.kecamatan });
  const { data: listings, isLoading, isFetching } = useQuery({
    queryKey: ["listings", page, kecamatan],
    queryFn: () => api.listings({ page, limit: 15, kecamatan: kecamatan !== "all" ? kecamatan : undefined }),
  });

  const totalPages = listings ? Math.ceil(listings.total / listings.limit) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Listing Perumahan</h1>
        <p className="text-gray-500 mt-1">Daftar lengkap lokasi perumahan subsidi di Kabupaten Lumajang</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">Data Listing</h3>
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          </div>
          <select
            className="w-full sm:w-64 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={kecamatan}
            onChange={e => { setKecamatan(e.target.value); setPage(1); }}
          >
            <option value="all">Semua Kecamatan</option>
            {kecamatanList?.filter(k => k.supply > 0).map(k => (
              <option key={k.kodeWilayah} value={k.namaWilayah}>{k.namaWilayah}</option>
            ))}
          </select>
        </div>

        <div className="overflow-auto rounded-md border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Nama Perumahan</th>
                <th className="px-4 py-3 text-left font-medium">Developer</th>
                <th className="px-4 py-3 text-left font-medium">Lokasi</th>
                <th className="px-4 py-3 text-left font-medium">Jenis</th>
                <th className="px-4 py-3 text-right font-medium">Unit</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading
                ? [...Array(10)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 animate-pulse rounded w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                : listings?.data.length === 0
                ? (
                  <tr><td colSpan={6} className="h-24 text-center text-gray-400">Tidak ada data ditemukan.</td></tr>
                )
                : listings?.data.map((l) => (
                    <tr key={l.idLokasi} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelected(l)}>
                      <td className="px-4 py-3 font-medium text-gray-900">{l.namaPerumahan}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{l.namaDeveloper}</span>
                          <span className="text-xs text-gray-400">{l.asosiasi}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-gray-800">{l.kecamatan}</span>
                          {l.kelurahan && <span className="text-xs text-gray-400">{l.kelurahan}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{l.jenisPerumahan}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {l.jumlahUnit || <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="p-1 rounded hover:bg-gray-100"><Info className="h-4 w-4 text-gray-400" /></button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {listings && listings.total > 0 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              Menampilkan {((page - 1) * listings.limit) + 1}–{Math.min(page * listings.limit, listings.total)} dari {listings.total} data
            </p>
            <div className="flex items-center gap-2">
              <button
                className="p-1.5 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isFetching}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium w-16 text-center">{page} / {totalPages}</span>
              <button
                className="p-1.5 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isFetching}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ListingDetailModal listing={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
