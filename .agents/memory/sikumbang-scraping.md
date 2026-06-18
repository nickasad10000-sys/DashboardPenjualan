---
name: SIKUMBANG full-page scraping
description: Cara mengambil semua data listing Kabupaten Lumajang dari SIKUMBANG Tapera
---

## Aturan

SIKUMBANG tidak menyediakan filter kabupaten di endpoint `/?page=N`. Parameter `kabupaten=3508`, `kode=3508`, `kodeWilayah=3508`, `wilayah=3508` tidak berpengaruh — selalu mengembalikan maxPage 1116 (data nasional).

Satu-satunya cara mendapatkan data Lumajang adalah scrape **semua 1116 halaman** dan filter `wilayah.kabupaten === "KAB LUMAJANG"` atau `idLokasi.startsWith("LMJ")`.

**Why:** Tidak ada endpoint search/filter kabupaten di SIKUMBANG per Juni 2026.

**How to apply:**
- Gunakan 30 concurrent requests per batch.
- Track progress dengan state global `ScrapingState { inProgress, pagesScraped, totalPages }`.
- Update cache secara incremental agar frontend bisa menampilkan data parsial.
- Expose `scraping` object di summary endpoint agar frontend bisa polling dan tampilkan progress bar.
- Total waktu scraping: ~2 menit untuk 1116 halaman dengan 30 concurrent.
- 30 listing per halaman nasional; Lumajang punya ~118 lokasi tersebar.
