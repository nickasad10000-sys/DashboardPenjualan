---
name: Dashboard map & layout decisions
description: MapLibre GL setup, koordinat enrichment, stat card layout, dan chart decisions untuk lumajang-dashboard
---

## Map: MapLibre GL (bukan react-leaflet)
- Package: `maplibre-gl` (v5), leaflet sudah dihapus
- Component: `src/components/perumahan-map.tsx` — standalone, tidak pakai wrapper library
- Marker: circle layer dengan `circle-radius: 7` (pixel, tidak skala dengan zoom)
- Clustering: GeoJSON source dengan `cluster: true`, clusterMaxZoom 12
- Style: Carto positron (`https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`)

**Why:** User minta titik tidak membesar saat zoom out — MapLibre circle layer pixel radius memenuhi ini secara default.

## Koordinat per listing
- Field baru: `koordinat: [number, number] | null` di `ListingItem` (format [lng, lat] untuk MapLibre/GeoJSON)
- Source: `koordinatPerumahan` dari SIKUMBANG detail endpoint (`/lokasi-perumahan/{id}/json`)
- Parsing: `parseKoordinat(raw)` — format SIKUMBANG adalah "lat,lng", dikonversi ke [lng, lat]
- Enrichment: `enrichListings` sekarang juga enrich listings yang `!l.koordinat` (bukan hanya yang tidak punya jumlahUnit)
- Fallback: kecamatan coords (KECAMATAN_COORDS [lng,lat]) dengan golden-angle jitter per listing

**Why:** SIKUMBANG hanya punya koordinat di detail endpoint, bukan listing page. Perlu enrichment untuk setiap listing.

## Stat cards: hanya 3
- Total Lokasi (klik → peta MapLibre + tabel)
- Total Developer (klik → tabel developer expandable)
- Total Stok (klik → breakdown per perumahan, bukan per kecamatan)
- "Dipilih/Diminati" dan "Sisa Stok" dihapus — sudah ada di StokModal dan di description card Total Stok

## StokModal: per perumahan
- Data dari `useGetLumajangListings(limit=500)` + `useGetLumajangKecamatan`
- "Est. Dipilih" per perumahan = proporsional dari kecamatan pilihan: `(unit/kec_supply)*kec_pilihan`
- Label jelas "Est. Dipilih" supaya tidak misleading

## Charts
1. Supply vs Peminat per Kecamatan (top 10) — bar chart vertikal, existing
2. Stok per Perumahan (top 15) — bar chart HORIZONTAL baru, multicolor

## Mobile responsive
- Grid cards: `grid-cols-1 sm:grid-cols-3`
- Dialog: `max-h-[92dvh]`
- Table: `overflow-x-auto` dengan `min-w-[...]` per kolom
- Chart heights: lebih kecil di mobile via sm: variants
