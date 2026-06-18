import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../../lib/supabase";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const [listingsRes, snapshotsRes] = await Promise.all([
      supabase.from("listings").select("nama_developer, asosiasi, jumlah_unit, kecamatan"),
      supabase.from("sales_snapshots").select("*").order("month", { ascending: false }).limit(13),
    ]);

    const listings = listingsRes.data ?? [];
    const snapshots = snapshotsRes.data ?? [];

    const developerMap: Record<string, { namaDeveloper: string; asosiasi: string; totalUnit: number; jumlahLokasi: number }> = {};
    for (const l of listings) {
      if (!l.nama_developer) continue;
      if (!developerMap[l.nama_developer]) {
        developerMap[l.nama_developer] = {
          namaDeveloper: l.nama_developer,
          asosiasi: l.asosiasi ?? "",
          totalUnit: 0,
          jumlahLokasi: 0,
        };
      }
      developerMap[l.nama_developer].totalUnit += l.jumlah_unit ?? 0;
      developerMap[l.nama_developer].jumlahLokasi++;
    }

    const prevSnapshot = snapshots.find((s) => s.month < currentMonth);

    const developers = Object.values(developerMap)
      .filter((d) => d.totalUnit > 0)
      .map((dev) => {
        const prevUnit = prevSnapshot?.developer_sales?.[dev.namaDeveloper]?.totalUnit ?? null;
        return {
          ...dev,
          unitBulanLalu: prevUnit,
          deltaBulanIni: prevUnit !== null ? dev.totalUnit - prevUnit : null,
        };
      })
      .sort((a, b) => b.totalUnit - a.totalUnit);

    res.setHeader("Cache-Control", "s-maxage=60");
    return res.json({
      bulan: currentMonth,
      totalDeveloper: developers.length,
      snapshotCount: snapshots.length,
      developers,
      snapshots: snapshots.map((s) => ({
        month: s.month,
        recordedAt: s.recorded_at,
        totalUnit: s.total_unit,
        activeDevelopers: s.active_developers,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Gagal mengambil data penjualan bulanan" });
  }
}
