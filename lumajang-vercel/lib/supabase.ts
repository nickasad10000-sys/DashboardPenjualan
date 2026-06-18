import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus diset di environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

export interface Listing {
  id_lokasi: string;
  nama_perumahan: string;
  jenis_perumahan: string | null;
  kecamatan: string | null;
  kelurahan: string | null;
  nama_developer: string | null;
  asosiasi: string | null;
  jumlah_unit: number | null;
  foto: string[];
  updated_at: string;
}

export interface KecamatanCache {
  kode_wilayah: string;
  nama_wilayah: string;
  supply: number;
  peminatan: number;
  pilihan: number;
  updated_at: string;
}

export interface ScrapeProgress {
  id: number;
  in_progress: boolean;
  pages_scraped: number;
  total_pages: number;
  enriched: number;
  to_enrich: number;
  started_at: string | null;
  completed_at: string | null;
  last_refreshed: string | null;
}

export interface SalesSnapshot {
  id: number;
  month: string;
  recorded_at: string;
  developer_sales: Record<string, { namaDeveloper: string; asosiasi: string; totalUnit: number; jumlahLokasi: number }>;
  total_unit: number;
  active_developers: number;
}
