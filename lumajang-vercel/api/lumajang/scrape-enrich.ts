import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../../lib/supabase";
import { fetchListingDetail } from "../../lib/sikumbang";

const CONCURRENT = 5;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { data: toEnrich, error } = await supabase
      .from("listings")
      .select("id_lokasi")
      .is("jumlah_unit", null)
      .limit(50);

    if (error) throw error;
    if (!toEnrich || toEnrich.length === 0) {
      await supabase.from("scrape_progress").update({ to_enrich: 0 }).eq("id", 1);
      return res.json({ ok: true, enriched: 0, remaining: 0, done: true });
    }

    let enriched = 0;
    for (let i = 0; i < toEnrich.length; i += CONCURRENT) {
      const batch = toEnrich.slice(i, i + CONCURRENT);
      const results = await Promise.allSettled(
        batch.map((l) => fetchListingDetail(l.id_lokasi))
      );
      for (let j = 0; j < results.length; j++) {
        const r = results[j];
        if (r.status === "fulfilled" && r.value) {
          const { error: updateErr } = await supabase
            .from("listings")
            .update({ jumlah_unit: r.value.jumlah_unit, foto: r.value.foto, updated_at: new Date().toISOString() })
            .eq("id_lokasi", batch[j].id_lokasi);
          if (!updateErr) enriched++;
        }
      }
    }

    const { count: remainingCount } = await supabase
      .from("listings")
      .select("id_lokasi", { count: "exact", head: true })
      .is("jumlah_unit", null);

    const remaining = remainingCount ?? 0;

    await supabase.from("scrape_progress")
      .update({ enriched: (await supabase.from("listings").select("id_lokasi", { count: "exact", head: true }).not("jumlah_unit", "is", null)).count ?? 0, to_enrich: remaining })
      .eq("id", 1);

    return res.json({ ok: true, enriched, remaining, done: remaining === 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Gagal enrich listings" });
  }
}
