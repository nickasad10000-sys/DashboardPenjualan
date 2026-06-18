import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const MANUAL_COORDS: Record<string, [number, number]> = {
  "GRAND LEMBAYUNG INDAH": [113.236666, -8.185600],
};

function getManualCoords(namaPerumahan: string): [number, number] | null {
  const upper = namaPerumahan.toUpperCase().trim();
  for (const [key, coords] of Object.entries(MANUAL_COORDS)) {
    if (upper.includes(key)) return coords;
  }
  return null;
}

const KECAMATAN_COORDS: Record<string, [number, number]> = {
  "LUMAJANG":     [113.2269, -8.1347],
  "KUNIR":        [113.1891, -8.2294],
  "YOSOWILANGUN": [113.1000, -8.2167],
  "ROWOKANGKUNG": [113.2333, -8.2917],
  "TEKUNG":       [113.2667, -8.1731],
  "TEMPEH":       [113.3333, -8.2333],
  "PASIRIAN":     [113.3500, -8.3333],
  "CANDIPURO":    [113.4167, -8.3667],
  "PRONOJIWO":    [113.4500, -8.2833],
  "SENDURO":      [113.3333, -8.1167],
  "PASRUJAMBE":   [113.3833, -8.1500],
  "GUCIALIT":     [113.3500, -8.0833],
  "JATIROTO":     [113.1500, -8.2167],
  "RANUYOSO":     [113.2500, -8.0833],
  "KLAKAH":       [113.2667, -8.1500],
  "RANDUAGUNG":   [113.2000, -8.1667],
  "SUKODONO":     [113.1833, -8.0667],
  "PADANG":       [113.3167, -8.1833],
  "KEDUNGJAJANG": [113.2000, -8.0500],
  "SUMBERSUKO":   [113.2500, -8.1333],
};

export interface PerumahanListing {
  idLokasi: string;
  namaPerumahan: string;
  namaDeveloper: string;
  kecamatan: string;
  jumlahUnit: string | null;
  koordinat?: [number, number] | null;
}

function buildGeoJSON(listings: PerumahanListing[]) {
  const kecCounts: Record<string, number> = {};

  const features = listings.map((l) => {
    const manualOverride = getManualCoords(l.namaPerumahan);
    let coords: [number, number] | null = manualOverride ?? (l.koordinat ?? null);

    if (!coords) {
      const key = l.kecamatan.toUpperCase().trim();
      const base = KECAMATAN_COORDS[key];
      if (base) {
        const idx = kecCounts[key] ?? 0;
        kecCounts[key] = idx + 1;
        const angle = (idx * 137.508) % 360;
        const radius = 0.003 + Math.floor(idx / 8) * 0.002;
        coords = [
          base[0] + radius * Math.cos((angle * Math.PI) / 180),
          base[1] + radius * Math.sin((angle * Math.PI) / 180),
        ];
      }
    }

    if (!coords) return null;

    return {
      type: "Feature" as const,
      properties: {
        idLokasi: l.idLokasi,
        namaPerumahan: l.namaPerumahan,
        namaDeveloper: l.namaDeveloper,
        kecamatan: l.kecamatan,
        jumlahUnit: l.jumlahUnit ?? "—",
        hasRealCoords: !!(l.koordinat),
      },
      geometry: {
        type: "Point" as const,
        coordinates: coords,
      },
    };
  }).filter((f): f is NonNullable<typeof f> => f !== null);

  return { type: "FeatureCollection" as const, features };
}

interface PerumahanMapProps {
  listings: PerumahanListing[];
  height?: string;
}

export function PerumahanMap({ listings, height = "320px" }: PerumahanMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const listingsRef = useRef(listings);
  listingsRef.current = listings;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [113.2269, -8.1347],
      zoom: 9.5,
      attributionControl: { compact: true },
    });

    const popup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      offset: 12,
      maxWidth: "260px",
    });

    map.on("load", () => {
      const geojson = buildGeoJSON(listingsRef.current);

      map.addSource("perumahan", {
        type: "geojson",
        data: geojson,
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 45,
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "perumahan",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step", ["get", "point_count"],
            "#60a5fa", 10, "#3b82f6", 30, "#1d4ed8",
          ],
          "circle-radius": [
            "step", ["get", "point_count"],
            18, 10, 24, 30, 30,
          ],
          "circle-opacity": 0.9,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "perumahan",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-size": 12,
        },
        paint: { "text-color": "#fff" },
      });

      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "perumahan",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "case", ["==", ["get", "hasRealCoords"], true],
            "#2563eb", "#94a3b8",
          ],
          "circle-radius": 7,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
          "circle-opacity": 0.95,
        },
      });

      map.on("click", "clusters", async (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        if (!features.length) return;
        const clusterId = features[0].properties?.cluster_id as number;
        const source = map.getSource("perumahan") as maplibregl.GeoJSONSource;
        const zoom = await source.getClusterExpansionZoom(clusterId);
        const coords = (features[0].geometry as GeoJSON.Point).coordinates as [number, number];
        map.easeTo({ center: coords, zoom });
      });

      map.on("click", "unclustered-point", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties as Record<string, string>;
        const coords = (f.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
        popup
          .setLngLat(coords)
          .setHTML(`
            <div style="font-family:system-ui,sans-serif;font-size:13px;line-height:1.4">
              <div style="font-weight:700;margin-bottom:4px;font-size:14px">${p.namaPerumahan}</div>
              <div style="color:#64748b;margin-bottom:6px;font-size:12px">${p.namaDeveloper}</div>
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                <span style="background:#eff6ff;color:#1d4ed8;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:500">${p.kecamatan}</span>
                <span style="background:#f0fdf4;color:#15803d;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:500">${p.jumlahUnit} unit</span>
              </div>
              ${p.hasRealCoords === "false" ? '<div style="color:#94a3b8;font-size:11px;margin-top:6px">⚠ Titik estimasi kecamatan</div>' : ""}
            </div>
          `)
          .addTo(map);
      });

      map.on("mouseenter", "clusters", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "clusters", () => { map.getCanvas().style.cursor = ""; });
      map.on("mouseenter", "unclustered-point", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "unclustered-point", () => { map.getCanvas().style.cursor = ""; });
    });

    mapRef.current = map;

    return () => {
      popup.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () => {
      const source = map.getSource("perumahan") as maplibregl.GeoJSONSource | undefined;
      if (source) {
        source.setData(buildGeoJSON(listingsRef.current));
      }
    };
    if (map.isStyleLoaded()) {
      update();
    } else {
      map.once("load", update);
    }
  }, [listings]);

  return (
    <div
      ref={containerRef}
      style={{ height, width: "100%" }}
      className="rounded-lg overflow-hidden"
    />
  );
}
