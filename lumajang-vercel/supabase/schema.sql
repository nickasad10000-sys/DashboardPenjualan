-- ============================================================
-- Dashboard Perumahan Lumajang — Supabase Schema
-- Aman dijalankan berulang kali (idempotent)
-- ============================================================

-- Tabel listings (data perumahan)
CREATE TABLE IF NOT EXISTS listings (
  id_lokasi       TEXT PRIMARY KEY,
  nama_perumahan  TEXT NOT NULL,
  jenis_perumahan TEXT,
  kecamatan       TEXT,
  kelurahan       TEXT,
  nama_developer  TEXT,
  asosiasi        TEXT,
  jumlah_unit     INTEGER,
  foto            TEXT[] DEFAULT '{}',
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listings_kecamatan ON listings (kecamatan);
CREATE INDEX IF NOT EXISTS idx_listings_developer ON listings (nama_developer);

-- Tabel cache data kecamatan
CREATE TABLE IF NOT EXISTS kecamatan_cache (
  kode_wilayah  TEXT PRIMARY KEY,
  nama_wilayah  TEXT NOT NULL,
  supply        INTEGER DEFAULT 0,
  peminatan     INTEGER DEFAULT 0,
  pilihan       INTEGER DEFAULT 0,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel snapshot penjualan bulanan
CREATE TABLE IF NOT EXISTS sales_snapshots (
  id                  SERIAL PRIMARY KEY,
  month               TEXT NOT NULL,
  recorded_at         TIMESTAMPTZ DEFAULT NOW(),
  developer_sales     JSONB DEFAULT '{}',
  total_unit          INTEGER DEFAULT 0,
  active_developers   INTEGER DEFAULT 0,
  UNIQUE(month)
);

-- Tabel status progress scraping
CREATE TABLE IF NOT EXISTS scrape_progress (
  id              INTEGER PRIMARY KEY DEFAULT 1,
  in_progress     BOOLEAN DEFAULT FALSE,
  pages_scraped   INTEGER DEFAULT 0,
  total_pages     INTEGER DEFAULT 1116,
  enriched        INTEGER DEFAULT 0,
  to_enrich       INTEGER DEFAULT 0,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  last_refreshed  TIMESTAMPTZ
);

INSERT INTO scrape_progress (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Row Level Security
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE kecamatan_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_progress ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama dulu (supaya tidak error kalau sudah ada)
DROP POLICY IF EXISTS "public read listings"        ON listings;
DROP POLICY IF EXISTS "public read kecamatan"       ON kecamatan_cache;
DROP POLICY IF EXISTS "public read snapshots"       ON sales_snapshots;
DROP POLICY IF EXISTS "public read scrape_progress" ON scrape_progress;

-- Buat ulang policy
CREATE POLICY "public read listings"        ON listings        FOR SELECT USING (true);
CREATE POLICY "public read kecamatan"       ON kecamatan_cache FOR SELECT USING (true);
CREATE POLICY "public read snapshots"       ON sales_snapshots FOR SELECT USING (true);
CREATE POLICY "public read scrape_progress" ON scrape_progress FOR SELECT USING (true);
