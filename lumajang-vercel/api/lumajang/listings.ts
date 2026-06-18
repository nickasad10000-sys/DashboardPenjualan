import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../../lib/supabase";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const page = parseInt(String(req.query.page ?? "1"), 10);
  const limit = parseInt(String(req.query.limit ?? "20"), 10);
  const kecamatan = req.query.kecamatan as string | undefined;

  try {
    let query = supabase
      .from("listings")
      .select("id_lokasi, nama_perumahan, jenis_perumahan, kecamatan, kelurahan, nama_developer, asosiasi, jumlah_unit, foto", { count: "exact" })
      .order("nama_perumahan");

    if (kecamatan) {
      query = query.ilike("kecamatan", `%${kecamatan}%`);
    }

    const start = (page - 1) * limit;
    query = query.range(start, start + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    const mapped = (data ?? []).map((l) => ({
      idLokasi: l.id_lokasi,
      namaPerumahan: l.nama_perumahan,
      jenisPerumahan: l.jenis_perumahan,
      kecamatan: l.kecamatan,
      kelurahan: l.kelurahan,
      namaDeveloper: l.nama_developer,
      asosiasi: l.asosiasi,
      jumlahUnit: l.jumlah_unit != null ? String(l.jumlah_unit) : null,
      foto: l.foto ?? [],
    }));

    res.setHeader("Cache-Control", "s-maxage=30");
    return res.json({ data: mapped, total: count ?? 0, page, limit });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Gagal mengambil data listings" });
  }
}
