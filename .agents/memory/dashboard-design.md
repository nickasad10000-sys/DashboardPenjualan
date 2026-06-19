---
name: Dashboard map & layout decisions
description: Key design and architecture decisions for the Lumajang housing dashboard frontend
---

## Active design decisions

### Chart library
- MapLibre GL (NOT react-leaflet) for map
- Recharts for all charts

### Layout structure
- Sidebar: 64px wide (w-64) fixed, blueprint "L" icon in gradient blue
- Header: sticky top, bell notification icon + blue "Refresh Data" button
- Main: max-w-7xl, p-4/6/8 responsive

### Notification system (in-app)
- `sonner` v2 for toast notifications (already installed)
- `<Toaster as SonnerToaster />` added to App.tsx
- Layout.tsx polls `/api/lumajang/sale-events` every 60s via useQuery
- Uses `useRef` (prevEventCountRef) to detect NEW events without false positives on first load
- Bell badge = count of notifications newer than `localStorage["lumajang-notif-last-seen-at"]`
- `/api/lumajang/in-app-notifications` endpoint derives from saleEvents

### Analytics Chart 1 — scrollable ALL perumahan
- `perumahanChart` NO longer sliced to 20 — returns all ~118 perumahan
- Scrollable: outer `div.overflow-y-auto maxH:580px` + inner `div` height = `Math.max(420, count*28)px`
- Labels: `LabelList position="insideRight"` for unit count (white), `position="right"` for pct (dark)
- Top 5 Pie replaced with Top 10 horizontal BarChart with Cell colors

### API data shape
- perumahanChart includes ALL perumahan (no slice), sorted by estTerjual desc
- `pctKabupaten` = (estTerjual / totalEstTerjual) * 100
- `pctTerjual` = (estTerjual / totalUnit) * 100
- Stat cards: "Unit Tersedia" (not "Sisa Unit"), "Sale Events" for detected sales

### Export Excel  
- 5 sheets: Ringkasan Eksekutif, Penjualan Per Bulan, Ranking Perumahan, Sale Events Terdeteksi, Data Kecamatan
- buildRingkasanSheet() creates summary report format (KPI + top kecamatan + top perumahan)
- buildPenjualanBulananSheet() groups sale events by month
- Indonesian-named columns in all sheets

### Workflow port conflict
- Dashboard workflow (port 24105) conflicts with `artifacts/lumajang-dashboard: web`
- `artifacts/lumajang-dashboard: web` is the CORRECT running workflow (uses HMR)
- Dashboard workflow can be ignored/disabled — don't try to restart it

### Query keys used in layout
- `["sale-events-layout"]` for sale events polling
- `["in-app-notifications"]` for notification panel
- These are separate from dashboard's `["sale-events"]` to avoid conflict

## Coordinate approach
- Per listing coordinates from SIKUMBANG detail endpoint `/lokasi-perumahan/{id}/json`
- Fallback: kecamatan centroid + jitter if no GPS coords
- 3 stat cards on dashboard (not more)
