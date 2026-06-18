import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../../lib/supabase";
import { fetchGrafikData } from "../../lib/sikumbang";

const CACHE_TTL_MS = 10 * 60 * 1000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const { data: cached } = await supabase
      .from("kecamatan_cache")
      .select("*")
      .order("nama_wilayah");

    const now = Date.now();
    const isStale = !cached?.length ||
      (cached[0]?.updated_at && now - new Date(cached[0].updated_at).getTime() > CACHE_TTL_MS);

    if (isStale) {
      try {
        const fresh = await fetchGrafikData();
        if (fresh.length > 0) {
          await supabase.from("kecamatan_cache").upsert(
            fresh.map((k) => ({
              kode_wilayah: k.kodeWilayah,
              nama_wilayah: k.namaWilayah,
              supply: k.supply || 0,
              peminatan: k.peminatan || 0,
              pilihan: k.pilihan || 0,
              updated_at: new Date().toISOString(),
            })),
            { onConflict: "kode_wilayah" }
          );
          res.setHeader("Cache-Control", "s-maxage=60");
          return res.json(fresh.map((k) => ({
            kodeWilayah: k.kodeWilayah,
            namaWilayah: k.namaWilayah,
            supply: k.supply || 0,
            peminatan: k.peminatan || 0,
            pilihan: k.pilihan || 0,
            sisa: Math.max(0, (k.supply || 0) - (k.pilihan || 0)),
          })));
        }
      } catch {
        // fallback ke cache lama
      }
    }

    const result = (cached ?? []).map((k) => ({
      kodeWilayah: k.kode_wilayah,
      namaWilayah: k.nama_wilayah,
      supply: k.supply,
      peminatan: k.peminatan,
      pilihan: k.pilihan,
      sisa: Math.max(0, k.supply - k.pilihan),
    }));

    res.setHeader("Cache-Control", "s-maxage=60");
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Gagal mengambil data kecamatan" });
  }
}
