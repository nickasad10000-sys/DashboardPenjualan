const BASE = "/api/lumajang";

async function get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(BASE + path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export interface Summary {
  totalLokasi: number;
  totalDeveloper: number;
  totalStok: number;
  totalTerjual: number;
  totalSisa: number;
  totalPeminatan: number;
  lastUpdated: string;
  scraping: {
    inProgress: boolean;
    pagesScraped: number;
    totalPages: number;
    enriching: boolean;
    enriched: number;
    toEnrich: number;
  };
}

export interface KecamatanItem {
  kodeWilayah: string;
  namaWilayah: string;
  supply: number;
  peminatan: number;
  pilihan: number;
  sisa: number;
}

export interface ListingItem {
  idLokasi: string;
  namaPerumahan: string;
  jenisPerumahan: string | null;
  kecamatan: string | null;
  kelurahan: string | null;
  namaDeveloper: string | null;
  asosiasi: string | null;
  jumlahUnit: string | null;
  foto: string[];
}

export interface ListingsResponse {
  data: ListingItem[];
  total: number;
  page: number;
  limit: number;
}

export interface DeveloperItem {
  namaDeveloper: string;
  asosiasi: string;
  jumlahLokasi: number;
  totalUnit: number;
  listings: ListingItem[];
}

export interface PenjualanDeveloper {
  namaDeveloper: string;
  asosiasi: string;
  jumlahLokasi: number;
  totalUnit: number;
  unitBulanLalu: number | null;
  deltaBulanIni: number | null;
}

export interface PenjualanBulanan {
  bulan: string;
  totalDeveloper: number;
  snapshotCount: number;
  developers: PenjualanDeveloper[];
  snapshots: { month: string; recordedAt: string; totalUnit: number; activeDevelopers: number }[];
}

export interface ScrapeChunkResult {
  ok: boolean;
  pagesScraped: number;
  totalPages: number;
  listingsFound: number;
  nextStart: number | null;
  nextEnd: number | null;
  isDone: boolean;
}

export interface ScrapeProgress {
  inProgress: boolean;
  pagesScraped: number;
  totalPages: number;
  enriched: number;
  toEnrich: number;
  startedAt: string | null;
  completedAt: string | null;
}

export interface EnrichResult {
  ok: boolean;
  enriched: number;
  remaining: number;
  done: boolean;
}

export const api = {
  summary: () => get<Summary>("/summary"),
  kecamatan: () => get<KecamatanItem[]>("/kecamatan"),
  listings: (p: { page?: number; limit?: number; kecamatan?: string }) =>
    get<ListingsResponse>("/listings", { page: p.page, limit: p.limit, kecamatan: p.kecamatan }),
  listingDetail: (idLokasi: string) => get<ListingItem>(`/listings/${idLokasi}`),
  developers: () => get<DeveloperItem[]>("/developers"),
  penjualanBulanan: () => get<PenjualanBulanan>("/penjualan-bulanan"),
  refresh: () => post<{ ok: boolean; totalPages: number; chunkSize: number; totalChunks: number }>("/refresh"),
  scrapeChunk: (start: number, end: number) => post<ScrapeChunkResult>("/scrape-chunk", { start, end }),
  scrapeEnrich: () => post<EnrichResult>("/scrape-enrich"),
  saveSnapshot: () => post<{ ok: boolean }>("/save-snapshot"),
  getProgress: () => get<ScrapeProgress>("/progress"),
  proxyFotoUrl: (url: string) => `${BASE}/photo-proxy?url=${encodeURIComponent(url)}`,
};
