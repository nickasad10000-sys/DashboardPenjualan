import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../../lib/supabase";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const { data, error } = await supabase
      .from("scrape_progress")
      .select("*")
      .eq("id", 1)
      .single();

    if (error || !data) {
      return res.json({
        inProgress: false,
        pagesScraped: 0,
        totalPages: 0,
        enriched: 0,
        toEnrich: 0,
        startedAt: null,
        completedAt: null,
      });
    }

    return res.json({
      inProgress: data.in_progress ?? false,
      pagesScraped: data.pages_scraped ?? 0,
      totalPages: data.total_pages ?? 0,
      enriched: data.enriched ?? 0,
      toEnrich: data.to_enrich ?? 0,
      startedAt: data.started_at ?? null,
      completedAt: data.completed_at ?? null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Gagal mengambil progress" });
  }
}
