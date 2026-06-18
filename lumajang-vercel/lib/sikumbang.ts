const SIKUMBANG_BASE = "https://sikumbang.tapera.go.id";
const LUMAJANG_KODE = "3508";

export interface SikumbangPageListing {
  idLokasi: string;
  namaPerumahan: string;
  jenisPerumahan: string;
  jumlahUnit: string;
  foto: string[];
  wilayah: {
    kodeWilayah: string;
    namaWilayah: string;
    provinsi: string;
    kabupaten: string;
    kecamatan: string;
    kelurahan: string | null;
  };
  pengembang: {
    nama: string;
    asosiasi: string;
  };
}

export interface ParsedListing {
  id_lokasi: string;
  nama_perumahan: string;
  jenis_perumahan: string;
  kecamatan: string;
  kelurahan: string | null;
  nama_developer: string;
  asosiasi: string;
  jumlah_unit: number | null;
  foto: string[];
}

export interface KecamatanRaw {
  kodeWilayah: string;
  namaWilayah: string;
  supply: number;
  peminatan: number;
  pilihan: number;
}

function isLumajang(l: SikumbangPageListing): boolean {
  return (
    l.wilayah?.kabupaten === "KAB LUMAJANG" ||
    l.idLokasi?.startsWith("LMJ")
  );
}

function normalizeUnit(raw: string | null | undefined): number | null {
  if (!raw || raw === "0" || raw === "" || raw === "...") return null;
  const n = parseInt(raw, 10);
  return isNaN(n) ? null : n;
}

export function mapPageListing(l: SikumbangPageListing): ParsedListing {
  return {
    id_lokasi: l.idLokasi,
    nama_perumahan: l.namaPerumahan,
    jenis_perumahan: l.jenisPerumahan ?? "",
    kecamatan: l.wilayah?.kecamatan ?? "",
    kelurahan: l.wilayah?.kelurahan ?? null,
    nama_developer: l.pengembang?.nama ?? "",
    asosiasi: l.pengembang?.asosiasi ?? "",
    jumlah_unit: normalizeUnit(l.jumlahUnit),
    foto: (l.foto ?? [])
      .filter((f) => f && typeof f === "string" && f.trim() !== "")
      .map((f) => f.startsWith("http") ? f : `${SIKUMBANG_BASE}${f}`),
  };
}

export async function scrapePage(page: number): Promise<{ listings: ParsedListing[]; maxPage: number }> {
  const res = await fetch(`${SIKUMBANG_BASE}/?page=${page}`, {
    signal: AbortSignal.timeout(20000),
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) return { listings: [], maxPage: 0 };
  const html = await res.text();
  const match = html.match(/window\.SIKUMBANG_DATA\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
  if (!match) return { listings: [], maxPage: 0 };
  const pageData = JSON.parse(match[1]) as {
    page: number;
    maxPage: number;
    listLokasi: SikumbangPageListing[];
  };
  const listings = (pageData.listLokasi ?? [])
    .filter(isLumajang)
    .map(mapPageListing);
  return { listings, maxPage: pageData.maxPage ?? 0 };
}

export async function fetchGrafikData(): Promise<KecamatanRaw[]> {
  const res = await fetch(
    `${SIKUMBANG_BASE}/grafik-data?kode=${LUMAJANG_KODE}&asosiasi=`,
    { signal: AbortSignal.timeout(15000), headers: { "User-Agent": "Mozilla/5.0" } }
  );
  if (!res.ok) throw new Error(`Grafik fetch failed: ${res.status}`);
  const json = (await res.json()) as { data: KecamatanRaw[] };
  return json.data ?? [];
}

interface SikumbangDetailResponse {
  detail?: {
    namaPerumahan?: string;
    foto?: string[];
  };
  bangunan?: { id: number }[];
}

export async function fetchListingDetail(idLokasi: string): Promise<{ jumlah_unit: number | null; foto: string[] } | null> {
  try {
    const res = await fetch(
      `${SIKUMBANG_BASE}/lokasi-perumahan/${idLokasi}/json`,
      { signal: AbortSignal.timeout(15000), headers: { "User-Agent": "Mozilla/5.0" } }
    );
    if (!res.ok) return null;
    const raw = (await res.json()) as SikumbangDetailResponse;
    if (raw.detail) {
      const jumlah_unit = Array.isArray(raw.bangunan) && raw.bangunan.length > 0
        ? raw.bangunan.length
        : null;
      const foto = (raw.detail.foto ?? [])
        .filter((f) => f && typeof f === "string")
        .map((f) => f.startsWith("http") ? f : `${SIKUMBANG_BASE}${f}`);
      return { jumlah_unit, foto };
    }
    return null;
  } catch {
    return null;
  }
}
