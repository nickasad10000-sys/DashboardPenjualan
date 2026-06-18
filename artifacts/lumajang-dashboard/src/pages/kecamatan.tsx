import { useGetLumajangKecamatan } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Kecamatan() {
  const { data: kecamatan, isLoading } = useGetLumajangKecamatan();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-muted animate-pulse rounded-md" />
        <div className="h-[400px] bg-muted animate-pulse rounded-xl" />
        <div className="h-[600px] bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!kecamatan) return null;

  const validKecamatan = kecamatan
    .filter(k => k.supply > 0)
    .sort((a, b) => b.supply - a.supply);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analisis Kecamatan</h1>
        <p className="text-muted-foreground mt-1">Perbandingan ketersediaan dan peminatan di tingkat kecamatan</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Distribusi Stok vs Dipilih per Kecamatan</CardTitle>
          <CardDescription>Stok = unit terdaftar di SIKUMBANG. Dipilih = unit yang diminati calon pembeli (bukan konfirmasi jual).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={validKecamatan} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="namaWilayah" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80} 
                  interval={0}
                  tick={{ fontSize: 12 }} 
                />
                <YAxis />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="supply" name="Total Stok" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pilihan" name="Dipilih/Peminat" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sisa" name="Sisa Stok" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rincian Data Wilayah</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Peringkat</TableHead>
                  <TableHead>Kecamatan</TableHead>
                  <TableHead className="text-right">Total Stok</TableHead>
                  <TableHead className="text-right">Dipilih</TableHead>
                  <TableHead className="text-right">Sisa Stok</TableHead>
                  <TableHead className="text-right">Tingkat Dipilih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validKecamatan.map((k, index) => {
                  const serapan = k.supply > 0 ? (k.pilihan / k.supply) * 100 : 0;
                  return (
                    <TableRow key={k.kodeWilayah}>
                      <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium">{k.namaWilayah}</TableCell>
                      <TableCell className="text-right">{k.supply.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{k.pilihan.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant="outline" 
                          className={k.sisa === 0 ? "text-destructive border-destructive" : "text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20"}
                        >
                          {k.sisa.toLocaleString()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {serapan.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
