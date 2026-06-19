import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download, Upload, FileSpreadsheet, FileText, Loader2, CheckCircle2,
  AlertCircle, Info,
} from "lucide-react";
import * as XLSX from "xlsx";

interface ExportData {
  exportedAt: string;
  listings: Array<{
    idLokasi: string;
    namaPerumahan: string;
    jenisPerumahan: string;
    kecamatan: string;
    kelurahan: string;
    namaDeveloper: string;
    asosiasi: string;
    totalUnit: number;
    estTerjual: number;
    estSisa: number;
    pctTerjual: number;
    koordinatLat: number | string;
    koordinatLng: number | string;
    fotoUrl: string;
  }>;
  saleEvents: Array<{
    eventId: string;
    recordedAt: string;
    idLokasi: string;
    namaPerumahan: string;
    namaDeveloper: string;
    kecamatan: string;
    unitLaku: number;
    unitSebelum: number;
    unitSesudah: number;
  }>;
  kecamatan: Array<{
    namaWilayah: string;
    supply: number;
    pilihan: number;
    peminatan: number;
    sisa: number;
  }>;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportToCSV(rows: Record<string, unknown>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => {
        const val = String(row[h] ?? "");
        return val.includes(",") || val.includes('"') || val.includes("\n")
          ? `"${val.replace(/"/g, '""')}"`
          : val;
      }).join(",")
    ),
  ];
  const blob = new Blob(["\uFEFF" + csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename);
}

function exportToExcel(sheets: { name: string; data: Record<string, unknown>[] }[], filename: string) {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    if (sheet.data.length === 0) continue;
    const ws = XLSX.utils.json_to_sheet(sheet.data);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  }
  XLSX.writeFile(wb, filename);
}

export default function ExportPage() {
  const [importStatus, setImportStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<ExportData>({
    queryKey: ["export-data"],
    queryFn: async () => {
      const res = await fetch("/api/lumajang/export");
      if (!res.ok) throw new Error("Gagal mengambil data export");
      return res.json();
    },
    staleTime: 60000,
  });

  const ts = () => new Date().toISOString().slice(0, 10);

  const handleExportListingsCSV = () => {
    if (!data) return;
    exportToCSV(data.listings.map((l) => ({ ...l })), `listings-lumajang-${ts()}.csv`);
  };

  const handleExportSaleEventsCSV = () => {
    if (!data) return;
    exportToCSV(data.saleEvents.map((e) => ({ ...e })), `sale-events-lumajang-${ts()}.csv`);
  };

  const handleExportKecamatanCSV = () => {
    if (!data) return;
    exportToCSV(data.kecamatan.map((k) => ({ ...k })), `kecamatan-lumajang-${ts()}.csv`);
  };

  const handleExportAllExcel = () => {
    if (!data) return;
    exportToExcel(
      [
        { name: "Listings", data: data.listings as unknown as Record<string, unknown>[] },
        { name: "Sale Events", data: data.saleEvents as unknown as Record<string, unknown>[] },
        { name: "Kecamatan", data: data.kecamatan as unknown as Record<string, unknown>[] },
      ],
      `dashboard-lumajang-${ts()}.xlsx`
    );
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);
    e.target.value = "";

    try {
      let importedListings: Record<string, unknown>[] = [];

      if (file.name.endsWith(".csv")) {
        const text = await file.text();
        const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length < 2) throw new Error("File CSV kosong atau tidak valid");
        const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim());
        importedListings = lines.slice(1).map((line) => {
          const values: string[] = [];
          let cur = "";
          let inQuote = false;
          for (const ch of line) {
            if (ch === '"') { inQuote = !inQuote; continue; }
            if (ch === "," && !inQuote) { values.push(cur); cur = ""; continue; }
            cur += ch;
          }
          values.push(cur);
          return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
        });
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const wsName = wb.SheetNames[0];
        importedListings = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wsName]);
      } else {
        throw new Error("Format tidak didukung. Gunakan .csv atau .xlsx");
      }

      const mapped = importedListings.map((row) => ({
        idLokasi: String(row.idLokasi ?? row["ID Lokasi"] ?? ""),
        namaPerumahan: String(row.namaPerumahan ?? row["Nama Perumahan"] ?? ""),
        jenisPerumahan: String(row.jenisPerumahan ?? ""),
        kecamatan: String(row.kecamatan ?? ""),
        kelurahan: String(row.kelurahan ?? ""),
        namaDeveloper: String(row.namaDeveloper ?? row["Developer"] ?? ""),
        asosiasi: String(row.asosiasi ?? ""),
        jumlahUnit: String(row.totalUnit ?? row.jumlahUnit ?? ""),
      })).filter((r) => r.idLokasi);

      if (mapped.length === 0) throw new Error("Tidak ada data valid yang ditemukan dalam file");

      const res = await fetch("/api/lumajang/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listings: mapped }),
      });

      if (!res.ok) throw new Error("Gagal import ke server");
      const result = await res.json() as { success: boolean; updated: number; added: number; total: number };

      setImportStatus({
        type: "success",
        message: `Berhasil! ${result.added} listing ditambahkan, ${result.updated} diperbarui. Total: ${result.total} listing.`,
      });

      refetch();
    } catch (err) {
      setImportStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal memproses file",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 p-1">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Export & Import Data</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Download data penjualan ke CSV/Excel atau upload data eksternal
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat data untuk export...
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertCircle className="h-4 w-4" />
          Gagal memuat data. Coba refresh.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {data && [
          { label: "Listing Perumahan", count: data.listings.length, color: "text-blue-600" },
          { label: "Sale Events", count: data.saleEvents.length, color: "text-orange-600" },
          { label: "Data Kecamatan", count: data.kecamatan.length, color: "text-green-600" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4 text-center">
              <div className={`text-3xl font-bold ${item.color}`}>{item.count.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground mt-1">{item.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="export">
        <TabsList>
          <TabsTrigger value="export">
            <Download className="h-4 w-4 mr-2" /> Export
          </TabsTrigger>
          <TabsTrigger value="import">
            <Upload className="h-4 w-4 mr-2" /> Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                Export ke Excel (Semua Sheet)
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Satu file .xlsx berisi 3 sheet: Listings, Sale Events, dan Kecamatan
              </p>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleExportAllExcel}
                disabled={!data || isLoading}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4" />
                Download Excel (.xlsx)
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Export ke CSV (Per Dataset)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={handleExportListingsCSV} disabled={!data || isLoading} className="gap-2">
                  <Download className="h-4 w-4" />
                  Listings Perumahan ({data?.listings.length ?? 0} baris)
                </Button>
                <Button variant="outline" onClick={handleExportSaleEventsCSV} disabled={!data || isLoading} className="gap-2">
                  <Download className="h-4 w-4" />
                  Sale Events ({data?.saleEvents.length ?? 0} baris)
                </Button>
                <Button variant="outline" onClick={handleExportKecamatanCSV} disabled={!data || isLoading} className="gap-2">
                  <Download className="h-4 w-4" />
                  Data Kecamatan ({data?.kecamatan.length ?? 0} baris)
                </Button>
              </div>
            </CardContent>
          </Card>

          {data && (
            <p className="text-xs text-muted-foreground">
              Terakhir diperbarui: {data.exportedAt ? new Date(data.exportedAt).toLocaleString("id-ID") : "—"}
            </p>
          )}
        </TabsContent>

        <TabsContent value="import" className="mt-4 space-y-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 flex gap-3">
              <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 space-y-1">
                <p className="font-semibold">Panduan Import</p>
                <p>Upload file CSV atau Excel (.xlsx) dengan kolom: <code className="bg-blue-100 px-1 rounded text-xs">idLokasi, namaPerumahan, kecamatan, namaDeveloper, totalUnit</code></p>
                <p>Data yang di-import akan <strong>menambahkan atau memperbarui</strong> data cache berdasarkan <code className="bg-blue-100 px-1 rounded text-xs">idLokasi</code>. Data SIKUMBANG tetap menjadi sumber utama saat refresh.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Upload File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 gap-3 cursor-pointer transition-colors
                  ${isImporting ? "opacity-50 cursor-not-allowed" : "hover:border-blue-400 hover:bg-blue-50/50"}`}
              >
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleImport}
                  disabled={isImporting}
                />
                {isImporting ? (
                  <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                ) : (
                  <Upload className="h-10 w-10 text-muted-foreground" />
                )}
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {isImporting ? "Memproses file..." : "Klik atau drag file ke sini"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">CSV, XLS, XLSX — maksimum 10MB</p>
                </div>
              </label>

              {importStatus && (
                <div className={`flex items-start gap-3 rounded-lg p-4 ${importStatus.type === "success" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                  {importStatus.type === "success"
                    ? <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    : <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  }
                  <p className={`text-sm ${importStatus.type === "success" ? "text-green-800" : "text-red-800"}`}>
                    {importStatus.message}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Template Download</CardTitle>
              <p className="text-xs text-muted-foreground">Download template CSV untuk mengisi data baru</p>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  const template = [
                    {
                      idLokasi: "LMJ-CONTOH-001",
                      namaPerumahan: "Perumahan Contoh",
                      jenisPerumahan: "RST",
                      kecamatan: "SUKODONO",
                      kelurahan: "",
                      namaDeveloper: "PT. Developer Contoh",
                      asosiasi: "REI",
                      totalUnit: 100,
                      estTerjual: 0,
                      estSisa: 100,
                      pctTerjual: 0,
                      koordinatLat: -8.123,
                      koordinatLng: 113.456,
                      fotoUrl: "",
                    }
                  ];
                  exportToCSV(template as unknown as Record<string, unknown>[], "template-import-lumajang.csv");
                }}
              >
                <Download className="h-4 w-4" />
                Download Template CSV
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
