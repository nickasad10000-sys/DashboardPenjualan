import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../../../lib/supabase";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const { idLokasi } = req.query;
  if (!idLokasi || typeof idLokasi !== "string") {
    return res.status(400).json({ error: "idLokasi diperlukan" });
  }

  try {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id_lokasi", idLokasi)
      .single();

    if (error || !data) return res.status(404).json({ error: "Listing tidak ditemukan" });

    res.setHeader("Cache-Control", "s-maxage=60");
    return res.json({
      idLokasi: data.id_lokasi,
      namaPerumahan: data.nama_perumahan,
      jenisPerumahan: data.jenis_perumahan,
      kecamatan: data.kecamatan,
      kelurahan: data.kelurahan,
      namaDeveloper: data.nama_developer,
      asosiasi: data.asosiasi,
      jumlahUnit: data.jumlah_unit != null ? String(data.jumlah_unit) : null,
      foto: data.foto ?? [],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Gagal mengambil detail listing" });
  }
}
