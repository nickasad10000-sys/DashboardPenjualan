# Dashboard Perumahan Lumajang — Vercel + Supabase

Versi fully-serverless dari Dashboard Perumahan Lumajang.  
Frontend: Vite + React | Backend: Vercel Functions | Database: Supabase PostgreSQL

---

## Panduan Deploy

### Langkah 1: Setup Supabase

1. Buat akun di [supabase.com](https://supabase.com) dan buat project baru
2. Masuk ke **SQL Editor** di dashboard Supabase
3. Copy seluruh isi file `supabase/schema.sql` dan jalankan
4. Catat dua nilai ini dari **Settings → API**:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY`

### Langkah 2: Upload ke GitHub

```bash
# Di folder lumajang-vercel/
git init
git add .
git commit -m "Initial commit — Dashboard Perumahan Lumajang"
git branch -M main
git remote add origin https://github.com/USERNAMU/REPO-KAMU.git
git push -u origin main
```

### Langkah 3: Deploy ke Vercel

1. Buka [vercel.com](https://vercel.com) dan login
2. Klik **New Project** → Import dari GitHub → pilih repo yang baru dibuat
3. Framework Preset: **Vite**
4. Root Directory: biarkan kosong (sudah di root)
5. Di bagian **Environment Variables**, tambahkan:
   ```
   SUPABASE_URL          = https://xxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY = eyJhbGci...
   ```
6. Klik **Deploy**

### Langkah 4: Ambil Data Pertama

Setelah deploy, buka dashboard dan klik **Refresh Data**.  
Proses akan berjalan otomatis:
1. Scraping ~1116 halaman SIKUMBANG (dalam chunk 100 halaman)
2. Enrichment detail unit per listing
3. Simpan snapshot penjualan bulanan

> **Catatan:** Scraping chunk besar (`scrape-chunk`) membutuhkan maxDuration 300s.  
> Ini memerlukan **Vercel Pro** plan. Untuk Hobby plan, turunkan `CHUNK_SIZE` di  
> `src/components/layout.tsx` dan `api/lumajang/scrape-chunk.ts` menjadi 30 halaman.

---

## Struktur Project

```
lumajang-vercel/
├── api/lumajang/           ← Vercel Serverless Functions
│   ├── summary.ts          ← GET /api/lumajang/summary
│   ├── kecamatan.ts        ← GET /api/lumajang/kecamatan
│   ├── listings.ts         ← GET /api/lumajang/listings
│   ├── listings/
│   │   └── [idLokasi].ts   ← GET /api/lumajang/listings/:id
│   ├── developers.ts       ← GET /api/lumajang/developers
│   ├── penjualan-bulanan.ts← GET /api/lumajang/penjualan-bulanan
│   ├── refresh.ts          ← POST /api/lumajang/refresh
│   ├── scrape-chunk.ts     ← POST /api/lumajang/scrape-chunk
│   ├── scrape-enrich.ts    ← POST /api/lumajang/scrape-enrich
│   ├── save-snapshot.ts    ← POST /api/lumajang/save-snapshot
│   └── photo-proxy.ts      ← GET /api/lumajang/photo-proxy
├── lib/
│   ├── supabase.ts         ← Supabase client
│   └── sikumbang.ts        ← Scraping utilities
├── src/                    ← React Frontend
│   ├── lib/api.ts          ← API client (fetch-based)
│   ├── components/
│   │   └── layout.tsx      ← Layout + refresh logic
│   └── pages/
│       ├── dashboard.tsx
│       ├── kecamatan.tsx
│       ├── developer.tsx
│       ├── listing.tsx
│       └── penjualan.tsx
├── supabase/
│   └── schema.sql          ← Jalankan di Supabase SQL Editor
└── vercel.json
```

## Cara Kerja Refresh Data

Karena Vercel Serverless Functions punya batas waktu eksekusi, proses scraping
dilakukan secara bertahap langsung dari browser:

```
Tombol "Refresh Data" diklik
    ↓
POST /api/lumajang/refresh          (reset progress)
    ↓
POST /api/lumajang/scrape-chunk     (halaman 1–100)
POST /api/lumajang/scrape-chunk     (halaman 101–200)
... (diulang sampai selesai)
    ↓
POST /api/lumajang/scrape-enrich    (ambil detail unit, diulang sampai selesai)
    ↓
POST /api/lumajang/save-snapshot    (simpan snapshot penjualan bulanan)
```

Semua data tersimpan di Supabase dan tetap ada meskipun aplikasi di-redeploy.
