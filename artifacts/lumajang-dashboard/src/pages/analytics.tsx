import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  AreaChart, Area, LabelList, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import {
  TrendingUp, TrendingDown, Building, MapPin, Package,
  Activity, BarChart2, PieChart as PieChartIcon, Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AnalyticsData {
  summary: {
    totalSupply: number;
    totalPilihan: number;
    totalSisa: number;
    totalSaleEvents: number;
    totalPerumahan: number;
    totalEstTerjual: number;
    pctTerjual: number;
  };
  perumahanChart: Array<{
    idLokasi: string;
    namaPerumahan: string;
    namaDeveloper: string;
    kecamatan: string;
    totalUnit: number;
    estTerjual: number;
    estSisa: number;
    pctTerjual: number;
    pctKabupaten: number;
  }>;
  developerChart: Array<{
    namaDeveloper: string;
    asosiasi: string;
    totalUnit: number;
    estTerjual: number;
    jumlahLokasi: number;
    pctKabupaten: number;
    pctTerjual: number;
  }>;
  kecamatanChart: Array<{
    nama: string;
    supply: number;
    pilihan: number;
    peminatan: number;
    sisa: number;
    pctTerjual: number;
    pctKabupaten: number;
  }>;
  saleTimeline: Array<{ date: string; units: number }>;
  snapshots: Array<{ month: string; totalUnit: number }>;
}

const COLORS = ["#3b82f6", "#22c55e", "#f97316", "#8b5cf6", "#ec4899", "#14b8a6", "#eab308", "#f43f5e", "#6366f1", "#84cc16"];

function KpiCard({
  title, value, subtitle, icon: Icon, color = "blue", trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color?: "blue" | "green" | "yellow" | "purple" | "orange" | "red";
  trend?: number;
}) {
  const colorMap = {
    blue: { card: "border-blue-200 bg-gradient-to-br from-blue-50 to-white", icon: "text-blue-600 bg-blue-100", text: "text-blue-700" },
    green: { card: "border-green-200 bg-gradient-to-br from-green-50 to-white", icon: "text-green-600 bg-green-100", text: "text-green-700" },
    yellow: { card: "border-yellow-200 bg-gradient-to-br from-yellow-50 to-white", icon: "text-yellow-600 bg-yellow-100", text: "text-yellow-700" },
    purple: { card: "border-purple-200 bg-gradient-to-br from-purple-50 to-white", icon: "text-purple-600 bg-purple-100", text: "text-purple-700" },
    orange: { card: "border-orange-200 bg-gradient-to-br from-orange-50 to-white", icon: "text-orange-600 bg-orange-100", text: "text-orange-700" },
    red: { card: "border-red-200 bg-gradient-to-br from-red-50 to-white", icon: "text-red-600 bg-red-100", text: "text-red-700" },
  };
  const c = colorMap[color];

  return (
    <Card className={`border ${c.card} shadow-sm`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground mb-1">{title}</p>
            <p className={`text-2xl font-bold ${c.text}`}>{typeof value === "number" ? value.toLocaleString() : value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            {trend !== undefined && (
              <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
                {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(trend).toFixed(1)}%
              </div>
            )}
          </div>
          <div className={`p-2.5 rounded-xl ${c.icon}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await fetch("/api/lumajang/analytics");
      if (!res.ok) throw new Error("Gagal mengambil data analytics");
      return res.json();
    },
    refetchInterval: 120000,
    placeholderData: (prev) => prev,
  });

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm text-muted-foreground">Memuat data analitik...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-60">
        <p className="text-sm text-red-500">Gagal memuat data. Coba refresh halaman.</p>
      </div>
    );
  }

  const { summary, perumahanChart, developerChart, kecamatanChart, saleTimeline, snapshots } = data;

  const top10Perumahan = perumahanChart.slice(0, 10);
  const top5Developer = developerChart.slice(0, 5);

  const devPieData = developerChart.slice(0, 8).map((d, i) => ({
    name: d.namaDeveloper.length > 18 ? d.namaDeveloper.slice(0, 18) + "…" : d.namaDeveloper,
    value: d.estTerjual,
    color: COLORS[i % COLORS.length],
  }));

  const kecRadarData = kecamatanChart.slice(0, 8).map((k) => ({
    subject: k.nama.length > 10 ? k.nama.slice(0, 10) + "…" : k.nama,
    "% Terjual": k.pctTerjual,
    "% Peminatan": kecamatanChart.length > 0 && k.supply > 0
      ? Math.round((k.peminatan / k.supply) * 1000) / 10
      : 0,
  }));

  const funnelData = [
    { step: "Supply", value: summary.totalSupply, fill: "#3b82f6" },
    { step: "Peminatan", value: Math.round(summary.totalSupply * 0.7), fill: "#8b5cf6" },
    { step: "Dipilih", value: summary.totalPilihan, fill: "#f97316" },
    { step: "Sisa", value: summary.totalSisa, fill: "#22c55e" },
  ];

  const chartHeight = Math.max(420, perumahanChart.length * 28);

  return (
    <div className="space-y-6 p-1">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Analisa Detail</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Insight mendalam performa penjualan perumahan subsidi Kab. Lumajang
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard title="Total Supply" value={summary.totalSupply} icon={Package} color="blue" subtitle="unit tersedia" />
        <KpiCard title="Total Dipilih" value={summary.totalPilihan} icon={TrendingUp} color="orange" subtitle="unit dipilih" />
        <KpiCard title="Unit Tersedia" value={summary.totalSisa} icon={Activity} color="green" subtitle="unit masih ada" />
        <KpiCard title="Tingkat Serapan" value={`${summary.pctTerjual}%`} icon={BarChart2} color="purple" subtitle="dari total supply" />
        <KpiCard title="Perumahan Aktif" value={summary.totalPerumahan} icon={MapPin} color="blue" subtitle="lokasi terdaftar" />
        <KpiCard title="Sale Events" value={summary.totalSaleEvents} icon={TrendingDown} color="red" subtitle="unit terdeteksi terjual" />
      </div>

      <Tabs defaultValue="penjualan">
        <TabsList className="grid grid-cols-4 w-full max-w-lg bg-muted/60 rounded-xl p-1">
          <TabsTrigger value="penjualan" className="rounded-lg">Penjualan</TabsTrigger>
          <TabsTrigger value="developer" className="rounded-lg">Developer</TabsTrigger>
          <TabsTrigger value="kecamatan" className="rounded-lg">Kecamatan</TabsTrigger>
          <TabsTrigger value="trend" className="rounded-lg">Tren</TabsTrigger>
        </TabsList>

        {/* === TAB PENJUALAN === */}
        <TabsContent value="penjualan" className="space-y-5 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Chart 1 — Ranking Penjualan Total (ALL perumahan, scrollable) */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Ranking Penjualan Total
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Est. terjual = total unit × (pilihan÷supply) kecamatan · angka = est. unit terjual · % = serapan Kab. Lumajang
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-500" />
                    Est. Unit Terjual
                  </span>
                  <span className="text-xs text-muted-foreground">· label kanan = % serapan kab.</span>
                </div>
              </CardHeader>
              <CardContent className="px-2 pb-2">
                <div className="overflow-y-auto border rounded-lg bg-muted/10" style={{ maxHeight: "580px" }}>
                  <div style={{ height: `${chartHeight}px` }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={perumahanChart}
                        layout="vertical"
                        margin={{ top: 4, right: 56, left: 4, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis
                          type="category"
                          dataKey="namaPerumahan"
                          tick={{ fontSize: 8 }}
                          width={115}
                          tickFormatter={(v) => v.length > 22 ? v.slice(0, 22) + "…" : v}
                        />
                        <Tooltip
                          formatter={(v: number) => [`${v.toLocaleString()} unit`, "Est. Unit Terjual"]}
                          labelFormatter={(_, payload) => {
                            const p = payload?.[0]?.payload;
                            return p ? `${p.namaPerumahan} · ${p.kecamatan}` : "";
                          }}
                          contentStyle={{ fontSize: 11 }}
                        />
                        <Bar dataKey="estTerjual" name="Est. Unit Terjual" fill="#22c55e" radius={[0, 3, 3, 0]}>
                          <LabelList
                            dataKey="estTerjual"
                            position="insideRight"
                            formatter={(v: number) => v >= 10 ? v.toLocaleString() : v > 0 ? `${v}` : ""}
                            style={{ fontSize: 8, fill: "#ffffff", fontWeight: "700" }}
                          />
                          <LabelList
                            dataKey="pctKabupaten"
                            position="right"
                            formatter={(v: number) => v > 0 ? `${v}%` : ""}
                            style={{ fontSize: 10, fill: "#111827", fontWeight: "700" }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {perumahanChart.length} perumahan · scroll untuk lihat semua
                </p>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {/* Top 10 Perumahan — horizontal bar (bukan pie) */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-blue-600" />
                    Top 10 Perumahan — Est. Unit Terjual
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={top10Perumahan}
                        layout="vertical"
                        margin={{ top: 2, right: 50, left: 4, bottom: 2 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                        <XAxis type="number" tick={{ fontSize: 9 }} />
                        <YAxis
                          type="category"
                          dataKey="namaPerumahan"
                          tick={{ fontSize: 8 }}
                          width={110}
                          tickFormatter={(v) => v.length > 20 ? v.slice(0, 20) + "…" : v}
                        />
                        <Tooltip
                          formatter={(v: number) => [`${v.toLocaleString()} unit terjual`, "Est. Terjual"]}
                          labelFormatter={(_, payload) => payload?.[0]?.payload?.namaPerumahan ?? ""}
                          contentStyle={{ fontSize: 11 }}
                        />
                        {top10Perumahan.map((_, i) => null)}
                        <Bar dataKey="estTerjual" name="Est. Terjual" radius={[0, 3, 3, 0]}>
                          {top10Perumahan.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                          <LabelList
                            dataKey="estTerjual"
                            position="right"
                            formatter={(v: number) => `${v}`}
                            style={{ fontSize: 9, fill: "#374151", fontWeight: "700" }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Ranking Detail */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Ranking Perumahan — Est. Unit Terjual</CardTitle>
                  <p className="text-xs text-muted-foreground">Angka = estimasi unit terjual, % bar = tingkat serapan per perumahan</p>
                </CardHeader>
                <CardContent className="px-3">
                  <div className="space-y-3 max-h-56 overflow-y-auto">
                    {perumahanChart.slice(0, 10).map((p, i) => (
                      <div key={p.idLokasi}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white"
                              style={{ background: COLORS[i % COLORS.length], fontSize: "9px" }}
                            >
                              {i + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate leading-tight">{p.namaPerumahan}</p>
                              <p className="text-xs text-muted-foreground truncate">{p.kecamatan}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-bold text-green-600">{p.estTerjual} unit terjual</p>
                            <p className="text-xs text-muted-foreground">{p.pctKabupaten}% serapan kab.</p>
                          </div>
                        </div>
                        <Progress value={p.pctTerjual} className="h-1.5" />
                        <p className="text-xs text-muted-foreground mt-0.5">{p.pctTerjual}% serapan perumahan ini</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Matriks Performa — Semua Perumahan */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Matriks Performa — % Serapan per Perumahan</CardTitle>
              <p className="text-xs text-muted-foreground">Persentase est. unit terjual dari total unit masing-masing perumahan</p>
            </CardHeader>
            <CardContent className="px-2">
              <div className="overflow-x-auto">
                <div style={{ width: `${Math.max(800, perumahanChart.length * 14)}px`, height: "240px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={perumahanChart} margin={{ top: 8, right: 8, left: -10, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="namaPerumahan" tick={{ fontSize: 7 }} angle={-45} textAnchor="end"
                        tickFormatter={(v) => v.slice(0, 12)} />
                      <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
                      <Tooltip
                        formatter={(v: number) => [`${v}%`, "% Terjual"]}
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.namaPerumahan ?? ""}
                        contentStyle={{ fontSize: 11 }}
                      />
                      <Bar dataKey="pctTerjual" name="% Terjual" radius={[2, 2, 0, 0]}>
                        {perumahanChart.map((p, i) => (
                          <Cell key={i} fill={p.pctTerjual >= 80 ? "#ef4444" : p.pctTerjual >= 50 ? "#f97316" : p.pctTerjual >= 30 ? "#eab308" : "#22c55e"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="flex gap-4 justify-center mt-2 flex-wrap">
                {[["≥80%", "#ef4444", "Sangat Laris"], ["50–79%", "#f97316", "Laris"], ["30–49%", "#eab308", "Sedang"], ["<30%", "#22c55e", "Tersedia Banyak"]].map(([label, color, desc]) => (
                  <span key={label} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                    {label} {desc}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === TAB DEVELOPER === */}
        <TabsContent value="developer" className="space-y-5 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building className="h-4 w-4 text-purple-600" />
                  Top 15 Developer — Est. Unit Terjual & Market Share
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2">
                <div className="h-[420px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={developerChart}
                      layout="vertical"
                      margin={{ top: 4, right: 60, left: 4, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="namaDeveloper" tick={{ fontSize: 9 }} width={110}
                        tickFormatter={(v) => v.length > 18 ? v.slice(0, 18) + "…" : v} />
                      <Tooltip
                        formatter={(v: number) => [`${v.toLocaleString()} unit terjual`, "Est. Terjual"]}
                        labelFormatter={(_, payload) => {
                          const p = payload?.[0]?.payload;
                          return p ? `${p.namaDeveloper} | ${p.jumlahLokasi} lokasi | ${p.pctKabupaten}% market share` : "";
                        }}
                        contentStyle={{ fontSize: 11 }}
                      />
                      <Bar dataKey="estTerjual" name="Est. Terjual" fill="#8b5cf6">
                        <LabelList dataKey="pctKabupaten" position="right"
                          formatter={(v: number) => `${v}%`}
                          style={{ fontSize: 10, fill: "#374151", fontWeight: "700" }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Market Share Developer (Top 8)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={devPieData} cx="50%" cy="50%" outerRadius={75} dataKey="value"
                          label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine>
                          {devPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => [`${v.toLocaleString()} unit terjual`, "Est. Terjual"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    {devPieData.map((d, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                        <span className="text-xs text-muted-foreground truncate">{d.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Top 5 Developer — Efficiency Rate</CardTitle>
                  <p className="text-xs text-muted-foreground">% est. unit terjual dari total unit developer</p>
                </CardHeader>
                <CardContent className="px-3 space-y-3">
                  {top5Developer.map((d, i) => (
                    <div key={d.namaDeveloper}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium truncate max-w-[180px]">
                          #{i + 1} {d.namaDeveloper}
                        </span>
                        <div className="text-right shrink-0">
                          <Badge variant={d.pctTerjual >= 80 ? "destructive" : d.pctTerjual >= 50 ? "secondary" : "outline"}
                            className="text-xs">{d.pctTerjual}%</Badge>
                        </div>
                      </div>
                      <Progress value={d.pctTerjual} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {d.estTerjual} unit terjual / {d.totalUnit} total · {d.jumlahLokasi} lokasi
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* === TAB KECAMATAN === */}
        <TabsContent value="kecamatan" className="space-y-5 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  Kecamatan — Supply vs Dipilih vs Peminatan
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2">
                <div className="h-[380px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={kecamatanChart} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="nama" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(v: number, name: string) => [`${v.toLocaleString()} unit`, name]}
                        labelFormatter={(_, payload) => {
                          const p = payload?.[0]?.payload;
                          return p ? `${p.nama} | ${p.pctTerjual}% dipilih | ${p.pctKabupaten}% share kab.` : "";
                        }}
                        contentStyle={{ fontSize: 11 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="supply" name="Supply" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="pilihan" name="Dipilih" fill="#f97316" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="peminatan" name="Peminatan" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Radar — % Serapan per Kecamatan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={kecRadarData} cx="50%" cy="50%" outerRadius={80}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                        <Radar name="% Terjual" dataKey="% Terjual" stroke="#22c55e" fill="#22c55e" fillOpacity={0.4} />
                        <Radar name="% Peminatan" dataKey="% Peminatan" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ fontSize: 11 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">% Serapan Kecamatan — Ranking</CardTitle>
                </CardHeader>
                <CardContent className="px-3 space-y-2.5 max-h-48 overflow-y-auto">
                  {[...kecamatanChart].sort((a, b) => b.pctTerjual - a.pctTerjual).map((k, i) => (
                    <div key={k.nama}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs truncate max-w-[160px]">#{i + 1} {k.nama}</span>
                        <span className={`text-xs font-bold ${k.pctTerjual >= 80 ? "text-red-600" : k.pctTerjual >= 50 ? "text-orange-500" : "text-green-600"}`}>
                          {k.pctTerjual}%
                        </span>
                      </div>
                      <Progress value={k.pctTerjual} className="h-1.5" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Funnel Absorpsi — Kabupaten Lumajang</CardTitle>
              <p className="text-xs text-muted-foreground">Dari total supply hingga unit sisa</p>
            </CardHeader>
            <CardContent className="px-4">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="step" tick={{ fontSize: 12, fontWeight: "500" }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => [`${v.toLocaleString()} unit`, ""]} contentStyle={{ fontSize: 11 }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {funnelData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      <LabelList dataKey="value" position="top"
                        formatter={(v: number) => v.toLocaleString()}
                        style={{ fontSize: 11, fontWeight: "600" }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === TAB TREN === */}
        <TabsContent value="trend" className="space-y-5 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-orange-500" />
                  Timeline Penjualan Terdeteksi (30 Hari Terakhir)
                </CardTitle>
                <p className="text-xs text-muted-foreground">Unit terjual per hari berdasarkan sale events terdeteksi</p>
              </CardHeader>
              <CardContent className="px-2">
                {saleTimeline.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm gap-2">
                    <Activity className="h-8 w-8 opacity-30" />
                    <p>Belum ada sale events terdeteksi</p>
                    <p className="text-xs text-center">Tekan "Refresh Data" minimal 2 kali untuk mendeteksi penurunan stok</p>
                  </div>
                ) : (
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={saleTimeline} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(v) => v.slice(5)} />
                        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                        <Tooltip formatter={(v: number) => [`${v} unit`, "Unit Terjual"]} contentStyle={{ fontSize: 11 }} />
                        <Area type="monotone" dataKey="units" stroke="#f97316" fill="#fed7aa" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-blue-600" />
                  Tren Snapshot Bulanan — Total Unit
                </CardTitle>
                <p className="text-xs text-muted-foreground">Penurunan total unit antar bulan = estimasi penjualan</p>
              </CardHeader>
              <CardContent className="px-2">
                {snapshots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm gap-2">
                    <BarChart2 className="h-8 w-8 opacity-30" />
                    <p>Belum ada data snapshot bulanan</p>
                  </div>
                ) : (
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={snapshots} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v: number) => [`${v.toLocaleString()} unit`, "Total Unit"]} contentStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="totalUnit" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: "#3b82f6" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
