import { useState, Fragment } from "react";
import { useGetLumajangDevelopers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ChevronDown, ChevronRight, Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Developer() {
  const { data: developers, isLoading } = useGetLumajangDevelopers();
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (name: string) => {
    setExpanded(prev => ({ ...prev, [name]: !prev[name] }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-muted animate-pulse rounded-md" />
        <div className="h-[600px] bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  const filteredDevs = developers?.filter(dev => 
    dev.namaDeveloper.toLowerCase().includes(search.toLowerCase()) ||
    dev.asosiasi.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => b.totalUnit - a.totalUnit) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Developer</h1>
        <p className="text-muted-foreground mt-1">Daftar pengembang perumahan subsidi di Kabupaten Lumajang</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <CardTitle>Daftar Pengembang</CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari developer atau asosiasi..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Nama Developer</TableHead>
                  <TableHead>Asosiasi</TableHead>
                  <TableHead className="text-right">Jumlah Lokasi</TableHead>
                  <TableHead className="text-right">Total Unit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevs.map((dev) => (
                  <Fragment key={dev.namaDeveloper}>
                    <TableRow 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleExpand(dev.namaDeveloper)}
                    >
                      <TableCell>
                        {expanded[dev.namaDeveloper] ? 
                          <ChevronDown className="h-4 w-4 text-muted-foreground" /> : 
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        }
                      </TableCell>
                      <TableCell className="font-bold">{dev.namaDeveloper}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">{dev.asosiasi}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{dev.jumlahLokasi}</TableCell>
                      <TableCell className="text-right font-medium">{dev.totalUnit.toLocaleString()}</TableCell>
                    </TableRow>
                    
                    {expanded[dev.namaDeveloper] && (
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={5} className="p-0 border-b">
                          <div className="p-4 pl-12 space-y-3">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              Daftar Perumahan ({dev.listings.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {dev.listings.map(l => (
                                <div key={l.idLokasi} className="bg-background rounded-md border p-3 flex flex-col gap-1">
                                  <div className="font-medium text-sm truncate" title={l.namaPerumahan}>{l.namaPerumahan}</div>
                                  <div className="text-xs text-muted-foreground flex justify-between">
                                    <span>{l.kecamatan}</span>
                                    <span className="font-semibold text-foreground">{l.jumlahUnit || 0} unit</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
                
                {filteredDevs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Tidak ada data ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
