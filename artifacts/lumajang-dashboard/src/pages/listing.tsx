import { useState } from "react";
import { useGetLumajangListings, useGetLumajangKecamatan, useGetLumajangListingDetail, getGetLumajangListingDetailQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Loader2, Home, MapPin, Building, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

function proxyFotoUrl(url: string): string {
  if (!url) return "";
  return `/api/lumajang/photo-proxy?url=${encodeURIComponent(url)}`;
}

function FotoItem({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false);
  if (errored) return null;
  return (
    <img
      src={proxyFotoUrl(src)}
      alt={alt}
      className="rounded-lg object-cover aspect-video w-full bg-muted"
      onError={() => setErrored(true)}
    />
  );
}

function ListingDetailModal({ idLokasi, open, onOpenChange }: { idLokasi: string | null, open: boolean, onOpenChange: (o: boolean) => void }) {
  const { data: detail, isLoading } = useGetLumajangListingDetail(idLokasi || "", { 
    query: { 
      enabled: !!idLokasi && open, 
      queryKey: getGetLumajangListingDetailQueryKey(idLokasi || "") 
    } 
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Perumahan</DialogTitle>
          <DialogDescription>Informasi lengkap mengenai lokasi perumahan</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : detail ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold">{detail.namaPerumahan}</h3>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{detail.jenisPerumahan}</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {detail.kecamatan}{detail.kelurahan ? `, ${detail.kelurahan}` : ''}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Building className="h-4 w-4" /> Developer
                </div>
                <div className="font-semibold">{detail.namaDeveloper}</div>
                <div className="text-sm text-muted-foreground">{detail.asosiasi}</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Home className="h-4 w-4" /> Total Unit
                </div>
                <div className="font-semibold text-lg">
                  {detail.jumlahUnit ? `${detail.jumlahUnit} Unit` : "Sedang dimuat..."}
                </div>
              </div>
            </div>

            {detail.foto && detail.foto.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Foto Lokasi</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {detail.foto.map((f, i) => (
                    <FotoItem key={i} src={f} alt={`${detail.namaPerumahan} foto ${i+1}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 text-center text-muted-foreground">Gagal memuat detail</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Listing() {
  const [page, setPage] = useState(1);
  const [kecamatan, setKecamatan] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const { data: kecamatanList } = useGetLumajangKecamatan();
  
  const { data: listings, isLoading, isFetching } = useGetLumajangListings({ 
    page, 
    limit: 15,
    kecamatan: kecamatan !== "all" ? kecamatan : undefined
  });

  const totalPages = listings ? Math.ceil(listings.total / listings.limit) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Listing Perumahan</h1>
        <p className="text-muted-foreground mt-1">Daftar lengkap lokasi perumahan subsidi di Kabupaten Lumajang</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center gap-2">
            <CardTitle>Data Listing</CardTitle>
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="w-full sm:w-64">
            <Select 
              value={kecamatan} 
              onValueChange={(v) => { setKecamatan(v); setPage(1); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter Kecamatan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kecamatan</SelectItem>
                {kecamatanList?.filter(k => k.supply > 0).map(k => (
                  <SelectItem key={k.kodeWilayah} value={k.namaWilayah}>
                    {k.namaWilayah}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Perumahan</TableHead>
                  <TableHead>Developer</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead className="text-right">Unit</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(10)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 w-48 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell className="text-right"><div className="h-4 w-8 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))
                ) : listings?.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Tidak ada data ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  listings?.data.map((listing) => (
                    <TableRow key={listing.idLokasi} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedId(listing.idLokasi)}>
                      <TableCell className="font-medium">{listing.namaPerumahan}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{listing.namaDeveloper}</span>
                          <span className="text-xs text-muted-foreground">{listing.asosiasi}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span>{listing.kecamatan}</span>
                          {listing.kelurahan && <span className="text-xs text-muted-foreground">{listing.kelurahan}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {listing.jenisPerumahan}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {listing.jumlahUnit || <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {listings && listings.total > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Menampilkan {((page - 1) * listings.limit) + 1} - {Math.min(page * listings.limit, listings.total)} dari {listings.total} data
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || isFetching}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium w-12 text-center">
                  {page} / {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || isFetching}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <ListingDetailModal 
        idLokasi={selectedId} 
        open={selectedId !== null} 
        onOpenChange={(open) => !open && setSelectedId(null)} 
      />
    </div>
  );
}
