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
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    green: "text-green-600 bg-green-50 border-green-100",
    yellow: "text-yellow-600 bg-yellow-50 border-yellow-100",
    purple: "text-purple-600 bg-purple-50 border-purple-100",
    orange: "text-orange-600 bg-orange-50 border-orange-100",
    red: "text-red-600 bg-red-50 border-red-100",
  };

  return (
    <Card className={`border ${colorMap[color]}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold">{typeof value === "number" ? value.toLocaleString() : value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            {trend !== undefined && (
              <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
                {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(trend).toFixed(1)}%
              </div>
            )}
          </div>
          <div className={`p-2 rounded-lg ${colorMap[color]}`}>
            <Icon className="h-5 w-5" />
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

  const top5Perumahan = perumahanChart.slice(0, 5);
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
        <KpiCard title="Sisa Unit" value={summary.totalSisa} icon={Activity} color="green" subtitle="unit tersisa" />
        <KpiCard title="Tingkat Serapan" value={`${summary.pctTerjual}%`} icon={BarChart2} color="purple" subtitle="dari total supply" />
        <KpiCard title="Perumahan Aktif" value={summary.totalPerumahan} icon={MapPin} color="blue" subtitle="lokasi terdaftar" />
        <KpiCard title="Sale Events" value={summary.totalSaleEvents} icon={TrendingDown} color="red" subtitle="unit terdeteksi terjual" />
      </div>

      <Tabs defaultValue="penjualan">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="penjualan">Penjualan</TabsTrigger>
          <TabsTrigger value="developer">Developer</TabsTrigger>
          <TabsTrigger value="kecamatan">Kecamatan</TabsTrigger>
          <TabsTrigger value="trend">Tren</TabsTrigger>
        </TabsList>

        <TabsContent value="penjualan" className="space-y-5 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Ranking Penjualan Total — Estimasi Unit Terjual
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Estimasi terjual = total unit × (pilihan/supply) kecamatan · label kanan = % serapan Kab. Lumajang
                </p>
              </CardHeader>
              <CardContent className="px-2">
                <div className="h-[520px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={perumahanChart}
                      layout="vertical"
                      margin={{ top: 4, right: 70, left: 4, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="namaPerumahan" tick={{ fontSize: 8 }} width={110}
                        tickFormatter={(v) => v.length > 20 ? v.slice(0, 20) + "…" : v} />
                      <Tooltip
                        formatter={(v: number) => [`${v.toLocaleString()} unit`, "Est. Terjual"]}
                        labelFormatter={(_, payload) => {
                          const p = payload?.[0]?.payload;
                          return p ? `${p.namaPerumahan} · ${p.kecamatan} · ${p.pctTerjual}% terjual · ${p.pctKabupaten}% serapan kab.` : "";
                        }}
                      />
                      <Bar dataKey="estTerjual" name="Est. Terjual" fill="#22c55e" radius={[0, 3, 3, 0]}>
                        <LabelList dataKey="pctKabupaten" position="right"
                          formatter={(v: number) => `${v}%`}
                          style={{ fontSize: 9, fill: "#374151", fontWeight: "600" }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-blue-600" />
                    Top 5 Perumahan — Proporsi Serapan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={top5Perumahan.map((p, i) => ({ name: p.namaPerumahan.slice(0, 20), value: p.estTerjual, color: COLORS[i] }))}
                          cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, pctKabupaten }) => `${name?.slice(0, 12)}… ${pctKabupaten ?? ""}%`}
                          labelLine={false}>
                          {top5Perumahan.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => [`${v} unit`, "Est. Terjual"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Ranking Perumahan — Detail</CardTitle>
                </CardHeader>
                <CardContent className="px-3">
                  <div className="space-y-3">
                    {perumahanChart.slice(0, 8).map((p, i) => (
                      <div key={p.idLokasi}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">#{i + 1}</span>
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate">{p.namaPerumahan}</p>
                              <p className="text-xs text-muted-foreground truncate">{p.kecamatan}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-bold text-green-600">{p.estTerjual} unit</p>
                            <p className="text-xs text-muted-foreground">{p.pctKabupaten}% kab.</p>
                          </div>
                        </div>
                        <Progress value={p.pctTerjual} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Matriks Performa — Semua Perumahan</CardTitle>
              <p className="text-xs text-muted-foreground">Persentase unit terjual dari total unit masing-masing perumahan</p>
            </CardHeader>
            <CardContent className="px-2">
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perumahanChart} margin={{ top: 8, right: 8, left: -10, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="namaPerumahan" tick={{ fontSize: 8 }} angle={-45} textAnchor="end"
                      tickFormatter={(v) => v.slice(0, 14)} />
                    <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
                    <Tooltip
                      formatter={(v: number) => [`${v}%`, "Terjual"]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.namaPerumahan ?? ""}
                    />
                    <Bar dataKey="pctTerjual" name="% Terjual" radius={[2, 2, 0, 0]}>
                      {perumahanChart.map((p, i) => (
                        <Cell key={i} fill={p.pctTerjual >= 80 ? "#ef4444" : p.pctTerjual >= 50 ? "#f97316" : p.pctTerjual >= 30 ? "#eab308" : "#22c55e"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 justify-center mt-2">
                {[["≥80%", "#ef4444", "Sangat Laris"], ["50-79%", "#f97316", "Laris"], ["30-49%", "#eab308", "Sedang"], ["<30%", "#22c55e", "Tersedia"]].map(([label, color, desc]) => (
                  <span key={label} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                    {label} {desc}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="developer" className="space-y-5 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building className="h-4 w-4 text-purple-600" />
                  Top 15 Developer — Unit Terjual & Market Share
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
                        formatter={(v: number, name: string) => [
                          `${v.toLocaleString()} unit`,
                          name === "estTerjual" ? "Est. Terjual" : "Stok",
                        ]}
                        labelFormatter={(_, payload) => {
                          const p = payload?.[0]?.payload;
                          return p ? `${p.namaDeveloper} | ${p.jumlahLokasi} lokasi | ${p.pctKabupaten}% market share` : "";
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="estTerjual" name="Est. Terjual" fill="#8b5cf6">
                        <LabelList dataKey="pctKabupaten" position="right"
                          formatter={(v: number) => `${v}%`}
                          style={{ fontSize: 9, fill: "#6b7280" }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Market Share Developer (Top 8)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={devPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                          label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine>
                          {devPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => [`${v} unit`, "Est. Terjual"]} />
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

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Top 5 Developer — Efficiency Rate</CardTitle>
                  <p className="text-xs text-muted-foreground">% unit terjual dari total unit developer</p>
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
                        {d.estTerjual} / {d.totalUnit} unit · {d.jumlahLokasi} lokasi
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="kecamatan" className="space-y-5 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  Kecamatan — Supply vs Dipilih vs Peminatan
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2">
                <div className="h-[380px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={kecamatanChart}
                      margin={{ top: 8, right: 8, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="nama" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(v: number, name: string) => [`${v.toLocaleString()} unit`, name]}
                        labelFormatter={(_, payload) => {
                          const p = payload?.[0]?.payload;
                          return p ? `${p.nama} | ${p.pctTerjual}% dipilih | ${p.pctKabupaten}% share kab.` : "";
                        }}
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
              <Card>
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
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">% Serapan Kecamatan — Ranking</CardTitle>
                </CardHeader>
                <CardContent className="px-3 space-y-2.5 max-h-48 overflow-y-auto">
                  {kecamatanChart.sort((a, b) => b.pctTerjual - a.pctTerjual).map((k, i) => (
                    <div key={k.nama}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs truncate max-w-[160px]">#{i + 1} {k.nama}</span>
                        <span className={`text-xs font-bold ${k.pctTerjual >= 80 ? "text-red-600" : k.pctTerjual >= 50 ? "text-orange-500" : "text-green-600"}`}>
                          {k.pctTerjual}%
                        </span>
                      </div>
                      <Progress
                        value={k.pctTerjual}
                        className="h-1.5"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
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
                    <Tooltip formatter={(v: number) => [`${v.toLocaleString()} unit`, ""]} />
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

        <TabsContent value="trend" className="space-y-5 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-orange-500" />
                  Timeline Penjualan Terdeteksi (30 Hari Terakhir)
                </CardTitle>
                <p className="text-xs text-muted-foreground">Unit terjual per hari berdasarkan sale events</p>
              </CardHeader>
              <CardContent className="px-2">
                {saleTimeline.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                    Belum ada sale events terdeteksi
                  </div>
                ) : (
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={saleTimeline} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(v) => v.slice(5)} />
                        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                        <Tooltip formatter={(v: number) => [`${v} unit`, "Unit Terjual"]} />
                        <Area type="monotone" dataKey="units" stroke="#f97316" fill="#fed7aa" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-blue-600" />
                  Tren Snapshot Bulanan — Total Unit
                </CardTitle>
                <p className="text-xs text-muted-foreground">Pergerakan total unit terdaftar per bulan (perubahan = penjualan)</p>
              </CardHeader>
              <CardContent className="px-2">
                {snapshots.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                    Belum ada snapshot bulanan tersedia
                  </div>
                ) : (
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={snapshots} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v: number) => [`${v.toLocaleString()} unit`, "Total Unit"]} />
                        <Line type="monotone" dataKey="totalUnit" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: "#3b82f6" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Ringkasan Performa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Unit Berhasil Dipilih", value: summary.totalPilihan, desc: `${summary.pctTerjual}% dari supply`, color: "text-orange-600" },
                  { label: "Unit Masih Tersedia", value: summary.totalSisa, desc: `${(100 - summary.pctTerjual).toFixed(1)}% sisa`, color: "text-green-600" },
                  { label: "Perumahan Terdaftar", value: summary.totalPerumahan, desc: "lokasi aktif", color: "text-blue-600" },
                  { label: "Unit Terjual (Events)", value: summary.totalSaleEvents, desc: "terdeteksi antar refresh", color: "text-purple-600" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border p-4 text-center">
                    <div className={`text-2xl font-bold ${item.color}`}>{item.value.toLocaleString()}</div>
                    <div className="text-xs font-medium mt-1">{item.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
