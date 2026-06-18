import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const rawUrl = req.query.url as string;
  if (!rawUrl) return res.status(400).json({ error: "URL diperlukan" });

  let photoUrl: string;
  try {
    photoUrl = decodeURIComponent(rawUrl);
  } catch {
    photoUrl = rawUrl;
  }

  if (
    !photoUrl.startsWith("https://sikumbang.tapera.go.id") &&
    !photoUrl.startsWith("http://sikumbang.tapera.go.id")
  ) {
    return res.status(403).json({ error: "URL tidak diizinkan" });
  }

  try {
    const r = await fetch(photoUrl, {
      signal: AbortSignal.timeout(15000),
      headers: {
        Referer: "https://sikumbang.tapera.go.id/",
        "User-Agent": "Mozilla/5.0 (compatible; LumajangDashboard/1.0)",
      },
    });

    if (!r.ok) return res.status(r.status).json({ error: "Gagal mengambil foto" });

    const contentType = r.headers.get("content-type") ?? "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");

    const buffer = await r.arrayBuffer();
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Gagal memuat foto" });
  }
}
