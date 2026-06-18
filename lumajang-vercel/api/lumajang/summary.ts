import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../../lib/supabase";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const [listingsRes, kecamatanRes, progressRes] = await Promise.all([
      supabase.from("listings").select("nama_developer, jumlah_unit", { count: "exact" }),
      supabase.from("kecamatan_cache").select("supply, peminatan, pilihan"),
      supabase.from("scrape_progress").select("*").eq("id", 1).single(),
    ]);

    const listings = listingsRes.data ?? [];
    const kecamatan = kecamatanRes.data ?? [];
    const progress = progressRes.data;

    const totalLokasi = listingsRes.count ?? listings.length;
    const developerSet = new Set(listings.map((l) => l.nama_developer).filter(Boolean));
    const totalStok = kecamatan.reduce((s, k) => s + (k.supply || 0), 0);
    const totalPeminatan = kecamatan.reduce((s, k) => s + (k.peminatan || 0), 0);
    const totalPilihan = kecamatan.reduce((s, k) => s + (k.pilihan || 0), 0);

    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    return res.json({
      totalLokasi,
      totalDeveloper: developerSet.size,
      totalStok,
      totalTerjual: totalPilihan,
      totalSisa: Math.max(0, totalStok - totalPilihan),
      totalPeminatan,
      lastUpdated: progress?.last_refreshed ?? new Date().toISOString(),
      scraping: {
        inProgress: progress?.in_progress ?? false,
        pagesScraped: progress?.pages_scraped ?? 0,
        totalPages: progress?.total_pages ?? 1116,
        enriching: (progress?.to_enrich ?? 0) > (progress?.enriched ?? 0) && !(progress?.in_progress),
        enriched: progress?.enriched ?? 0,
        toEnrich: progress?.to_enrich ?? 0,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Gagal mengambil data summary" });
  }
}
