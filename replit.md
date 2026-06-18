# Dashboard Perumahan Kab. Lumajang

Dashboard analitik penjualan perumahan subsidi di Kabupaten Lumajang, Jawa Timur — data diambil langsung (scraping) dari portal SIKUMBANG Tapera secara real-time.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/lumajang-dashboard run dev` — run the frontend dashboard
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (backend scraper)
- Frontend: React + Vite + Recharts + shadcn/ui
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `artifacts/api-server/src/routes/lumajang.ts` — Backend scraper routes for SIKUMBANG data
- `artifacts/lumajang-dashboard/src/` — React frontend dashboard
  - `pages/index.tsx` — Dashboard utama (ringkasan + charts)
  - `pages/kecamatan.tsx` — Analisis per kecamatan
  - `pages/developer.tsx` — Data per developer
  - `pages/listing.tsx` — Daftar listing perumahan
  - `components/layout.tsx` — Sidebar + header layout

## Architecture decisions

- **No database** — data di-cache di memory Express dengan TTL 10 menit. Refresh manual via tombol "Refresh Data" atau POST /api/lumajang/refresh
- **Scraping strategy** — Data kecamatan dari `/grafik-data?kode=3508` (cepat, reliable). Data listing dari scraping HTML pages yang difilter oleh `wilayah.kabupaten === "KAB LUMAJANG"`
- **SIKUMBANG kode** — Kab. Lumajang = kode `3508`, Provinsi Jawa Timur = `35`
- Contract-first API: OpenAPI spec → Orval codegen → React Query hooks di frontend

## Product

- **Dashboard** — Ringkasan stok total, terjual, sisa, developer, dengan grafik supply/demand per kecamatan
- **Analisis Kecamatan** — Perbandingan supply vs peminatan vs pilihan per kecamatan, ranked list
- **Data Developer** — Tabel developer yang expandable, menampilkan semua lokasi per developer
- **Listing Perumahan** — Searchable/filterable daftar semua perumahan dengan pagination & detail modal

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- SIKUMBANG API tidak memiliki endpoint filter kabupaten langsung — listing difilter dari scraping halaman HTML dengan pengecekan `wilayah.kabupaten === "KAB LUMAJANG"` atau `idLokasi.startsWith("LMJ")`
- Data `jumlahUnit` dari SIKUMBANG sering bernilai `"..."` (belum diisi developer) — handle sebagai null/0
- `grafik-data` endpoint bisa timeout >15s — gunakan AbortSignal.timeout(15000)
- Frontend: CSS custom properties semua pakai HSL tanpa wrapper (e.g. `221 83% 53%`)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- SIKUMBANG API base: `https://sikumbang.tapera.go.id`
- Key endpoints: `/grafik-data?kode=3508`, `/?page=N` (scraping), `/lokasi-perumahan/{id}/json`
