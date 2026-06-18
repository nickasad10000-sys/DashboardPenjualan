---
name: Vercel + Supabase migration
description: Architecture pattern for migrating the Lumajang dashboard from Express/Replit to Vercel serverless + Supabase PostgreSQL
---

# Vercel + Supabase Migration Architecture

## Key Constraint
Vercel serverless functions have execution time limits (Hobby: 10s functions/60s serverless, Pro: 300s).
Full SIKUMBANG scrape of ~1116 pages cannot run in a single function call.

## Solution: Client-Driven Chunked Scraping
Instead of a background process, the browser orchestrates the scraping:
1. `POST /api/lumajang/refresh` → resets Supabase progress row, returns totalPages
2. `POST /api/lumajang/scrape-chunk {start, end}` → scrapes 100 pages, upserts to Supabase
3. Repeat chunk calls until `isDone: true`
4. `POST /api/lumajang/scrape-enrich` → enriches 50 listings per call (fetch detail per listing)
5. `POST /api/lumajang/save-snapshot` → saves monthly sales snapshot

**Why:** Avoids serverless timeout; progress is visible in UI; data persists in Supabase across restarts.

## Supabase Tables
- `listings` — scraped + enriched listing data (jumlah_unit, foto from /lokasi-perumahan/{id}/json)
- `kecamatan_cache` — grafik-data from SIKUMBANG, refreshed on API call if stale >10min
- `sales_snapshots` — monthly snapshots for delta tracking (UNIQUE on month)
- `scrape_progress` — single-row progress tracker (id=1)

## Output Directory
Created standalone project in `lumajang-vercel/` (33 files) ready to push to GitHub and deploy.

## Vercel Pro Requirement
`scrape-chunk.ts` has `maxDuration: 300` which requires Vercel Pro. For Hobby plan, reduce CHUNK_SIZE to 30 pages.

## Frontend API Client
No orval/generated client — uses plain fetch via `src/lib/api.ts` with typed interfaces. All API paths are `/api/lumajang/*` relative URLs (same domain in Vercel).
