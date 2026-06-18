import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../../lib/supabase";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const { data: listings } = await supabase
      .from("listings")
      .select("nama_developer, asosiasi, jumlah_unit");

    const developerSales: Record<string, { namaDeveloper: string; asosiasi: string; totalUnit: number; jumlahLokasi: number }> = {};
    let totalUnit = 0;

    for (const l of listings ?? []) {
      if (!l.nama_developer) continue;
      if (!developerSales[l.nama_developer]) {
        developerSales[l.nama_developer] = {
          namaDeveloper: l.nama_developer,
          asosiasi: l.asosiasi ?? "",
          totalUnit: 0,
          jumlahLokasi: 0,
        };
      }
      developerSales[l.nama_developer].totalUnit += l.jumlah_unit ?? 0;
      developerSales[l.nama_developer].jumlahLokasi++;
      totalUnit += l.jumlah_unit ?? 0;
    }

    const activeDevelopers = Object.keys(developerSales).length;

    await supabase.from("sales_snapshots").upsert({
      month,
      recorded_at: new Date().toISOString(),
      developer_sales: developerSales,
      total_unit: totalUnit,
      active_developers: activeDevelopers,
    }, { onConflict: "month" });

    return res.json({ ok: true, month, activeDevelopers, totalUnit });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Gagal menyimpan snapshot" });
  }
}
