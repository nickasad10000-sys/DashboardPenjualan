import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../../lib/supabase";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const { data, error } = await supabase
      .from("listings")
      .select("id_lokasi, nama_perumahan, jenis_perumahan, kecamatan, kelurahan, nama_developer, asosiasi, jumlah_unit, foto");

    if (error) throw error;

    const devMap = new Map<string, {
      namaDeveloper: string;
      asosiasi: string;
      listings: typeof data;
    }>();

    for (const l of data ?? []) {
      if (!l.nama_developer) continue;
      const existing = devMap.get(l.nama_developer);
      if (existing) {
        existing.listings.push(l);
      } else {
        devMap.set(l.nama_developer, {
          namaDeveloper: l.nama_developer,
          asosiasi: l.asosiasi ?? "",
          listings: [l],
        });
      }
    }

    const result = Array.from(devMap.values())
      .map((dev) => ({
        namaDeveloper: dev.namaDeveloper,
        asosiasi: dev.asosiasi,
        jumlahLokasi: dev.listings.length,
        totalUnit: dev.listings.reduce((s, l) => s + (l.jumlah_unit ?? 0), 0),
        listings: dev.listings.map((l) => ({
          idLokasi: l.id_lokasi,
          namaPerumahan: l.nama_perumahan,
          jenisPerumahan: l.jenis_perumahan,
          kecamatan: l.kecamatan,
          kelurahan: l.kelurahan,
          namaDeveloper: l.nama_developer,
          asosiasi: l.asosiasi,
          jumlahUnit: l.jumlah_unit != null ? String(l.jumlah_unit) : null,
          foto: l.foto ?? [],
        })),
      }))
      .sort((a, b) => b.jumlahLokasi - a.jumlahLokasi);

    res.setHeader("Cache-Control", "s-maxage=30");
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Gagal mengambil data developer" });
  }
}
