import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../../lib/supabase";
import { scrapePage } from "../../lib/sikumbang";

const CHUNK_SIZE = 20;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    // Ambil totalPages dari halaman pertama SIKUMBANG — jangan hardcode 1116
    let totalPages = 1116;
    try {
      const first = await scrapePage(1);
      if (first.maxPage > 0) totalPages = first.maxPage;
    } catch {
      // fallback ke 1116 jika fetch gagal
    }

    await supabase.from("scrape_progress").upsert({
      id: 1,
      in_progress: true,
      pages_scraped: 0,
      total_pages: totalPages,
      enriched: 0,
      to_enrich: 0,
      started_at: new Date().toISOString(),
      completed_at: null,
      last_refreshed: null,
    });

    return res.json({
      ok: true,
      message: "Scraping dimulai. Panggil /api/lumajang/scrape-chunk secara berurutan.",
      totalPages,
      chunkSize: CHUNK_SIZE,
      totalChunks: Math.ceil(totalPages / CHUNK_SIZE),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Gagal memulai scraping" });
  }
}
