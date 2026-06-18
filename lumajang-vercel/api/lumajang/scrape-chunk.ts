import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../../lib/supabase";
import { scrapePage } from "../../lib/sikumbang";

const CONCURRENT = 10;
const CHUNK_SIZE = 20;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const start = parseInt(String(req.body?.start ?? req.query.start ?? "1"), 10);
  const end = parseInt(String(req.body?.end ?? req.query.end ?? String(start + CHUNK_SIZE - 1)), 10);

  if (isNaN(start) || isNaN(end) || start > end) {
    return res.status(400).json({ error: "Parameter start/end tidak valid" });
  }

  try {
    const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    let allListings: Awaited<ReturnType<typeof scrapePage>>["listings"] = [];
    let maxPage = 0;

    for (let i = 0; i < pages.length; i += CONCURRENT) {
      const batch = pages.slice(i, i + CONCURRENT);
      const results = await Promise.allSettled(batch.map((p) => scrapePage(p)));
      for (const r of results) {
        if (r.status === "fulfilled") {
          allListings = allListings.concat(r.value.listings);
          if (r.value.maxPage > maxPage) maxPage = r.value.maxPage;
        }
      }
    }

    if (allListings.length > 0) {
      const now = new Date().toISOString();
      const toUpsert = allListings.map((l) => ({ ...l, updated_at: now }));

      for (let i = 0; i < toUpsert.length; i += 500) {
        const batch = toUpsert.slice(i, i + 500);
        const { error } = await supabase.from("listings").upsert(batch, { onConflict: "id_lokasi" });
        if (error) console.error("Upsert error:", error.message);
      }
    }

    const actualEnd = maxPage > 0 ? Math.min(maxPage, 1116) : 1116;
    const nextStart = end < actualEnd ? end + 1 : null;
    const isDone = nextStart === null;

    await supabase.from("scrape_progress").update({
      pages_scraped: end,
      total_pages: actualEnd,
      in_progress: !isDone,
      ...(isDone ? { completed_at: new Date().toISOString(), last_refreshed: new Date().toISOString() } : {}),
    }).eq("id", 1);

    return res.json({
      ok: true,
      pagesScraped: end,
      totalPages: actualEnd,
      listingsFound: allListings.length,
      nextStart,
      nextEnd: nextStart ? Math.min(nextStart + CHUNK_SIZE - 1, actualEnd) : null,
      isDone,
    });
  } catch (err) {
    console.error(err);
    await supabase.from("scrape_progress").update({ in_progress: false }).eq("id", 1);
    return res.status(500).json({ error: "Gagal scrape chunk" });
  }
}
