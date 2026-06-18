import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Bell, Webhook, Mail, Send, CheckCircle2, AlertCircle,
  Loader2, Info, Settings,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface NotificationConfig {
  webhookUrl: string;
  webhookEnabled: boolean;
  emailEnabled: boolean;
  emailSmtp: string;
  emailPort: number;
  emailUser: string;
  emailPass: string;
  emailTo: string;
  notifyOnSale: boolean;
  notifyOnRefreshComplete: boolean;
  lastTestedAt: string | null;
  lastSentAt: string | null;
}

type TestResult = {
  success: boolean;
  results: { webhook?: boolean; email?: boolean };
};

export default function Notifications() {
  const queryClient = useQueryClient();
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: config, isLoading } = useQuery<NotificationConfig>({
    queryKey: ["notifications-config"],
    queryFn: async () => {
      const res = await fetch("/api/lumajang/notifications");
      if (!res.ok) throw new Error("Gagal");
      return res.json();
    },
  });

  const [form, setForm] = useState<NotificationConfig>({
    webhookUrl: "",
    webhookEnabled: false,
    emailEnabled: false,
    emailSmtp: "",
    emailPort: 587,
    emailUser: "",
    emailPass: "",
    emailTo: "",
    notifyOnSale: true,
    notifyOnRefreshComplete: false,
    lastTestedAt: null,
    lastSentAt: null,
  });

  useEffect(() => {
    if (config) setForm(config);
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<NotificationConfig>) => {
      const res = await fetch("/api/lumajang/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-config"] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/lumajang/notifications/test", { method: "POST" });
      if (!res.ok) throw new Error("Gagal");
      return res.json() as Promise<TestResult>;
    },
    onSuccess: (data) => {
      setTestResult(data);
      queryClient.invalidateQueries({ queryKey: ["notifications-config"] });
    },
    onError: () => {
      setTestResult({ success: false, results: {} });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-60">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Notifikasi & Alert</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Konfigurasi webhook dan email otomatis saat penjualan terdeteksi
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className={`border ${form.webhookEnabled ? "border-blue-200 bg-blue-50" : ""}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <Webhook className={`h-8 w-8 ${form.webhookEnabled ? "text-blue-600" : "text-muted-foreground"}`} />
            <div>
              <p className="text-sm font-semibold">Webhook</p>
              <Badge variant={form.webhookEnabled ? "default" : "secondary"} className="text-xs">
                {form.webhookEnabled ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className={`border ${form.emailEnabled ? "border-green-200 bg-green-50" : ""}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <Mail className={`h-8 w-8 ${form.emailEnabled ? "text-green-600" : "text-muted-foreground"}`} />
            <div>
              <p className="text-sm font-semibold">Email</p>
              <Badge variant={form.emailEnabled ? "default" : "secondary"} className="text-xs">
                {form.emailEnabled ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Bell className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-sm font-semibold">Terakhir Dikirim</p>
              <p className="text-xs text-muted-foreground">
                {config?.lastSentAt
                  ? new Date(config.lastSentAt).toLocaleString("id-ID")
                  : "Belum pernah"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="webhook">
        <TabsList>
          <TabsTrigger value="webhook">
            <Webhook className="h-4 w-4 mr-2" /> Webhook
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" /> Email SMTP
          </TabsTrigger>
          <TabsTrigger value="rules">
            <Settings className="h-4 w-4 mr-2" /> Aturan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="webhook" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Webhook className="h-5 w-5 text-blue-600" />
                Konfigurasi Webhook
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-3 p-4 rounded-lg border">
                <Switch
                  checked={form.webhookEnabled}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, webhookEnabled: v }))}
                />
                <div>
                  <p className="text-sm font-medium">Aktifkan Webhook</p>
                  <p className="text-xs text-muted-foreground">Kirim HTTP POST ke URL saat ada penjualan baru</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  placeholder="https://hooks.slack.com/services/... atau https://discord.com/api/webhooks/..."
                  value={form.webhookUrl}
                  onChange={(e) => setForm((f) => ({ ...f, webhookUrl: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Mendukung Slack Incoming Webhook, Discord Webhook, Make/Zapier, atau endpoint HTTP custom
                </p>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <p className="text-xs font-semibold mb-2">Contoh Payload yang Dikirim:</p>
                <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
{`{
  "event": "sale_detected",
  "recordedAt": "2026-06-18T10:30:00.000Z",
  "totalLaku": 8,
  "changes": [
    {
      "namaPerumahan": "Griya Lumajang Permai",
      "kecamatan": "SUKODONO",
      "unitLaku": 5,
      "unitSebelum": 120,
      "unitSesudah": 115
    }
  ],
  "text": "🏠 Penjualan Baru: 8 unit terjual..."
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="mt-4 space-y-4">
          <Card className="border-blue-100 bg-blue-50">
            <CardContent className="p-4 flex gap-3">
              <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold">Konfigurasi SMTP Server</p>
                <p className="mt-0.5 text-xs">
                  Gunakan SMTP provider seperti Gmail (smtp.gmail.com, port 587), Mailtrap, SendGrid, atau server SMTP sendiri.
                  Untuk Gmail, aktifkan "App Password" di pengaturan akun Google.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-5 w-5 text-green-600" />
                Konfigurasi Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg border">
                <Switch
                  checked={form.emailEnabled}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, emailEnabled: v }))}
                />
                <div>
                  <p className="text-sm font-medium">Aktifkan Email</p>
                  <p className="text-xs text-muted-foreground">Kirim email notifikasi via SMTP saat ada penjualan</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emailSmtp">SMTP Host</Label>
                  <Input
                    id="emailSmtp"
                    placeholder="smtp.gmail.com"
                    value={form.emailSmtp}
                    onChange={(e) => setForm((f) => ({ ...f, emailSmtp: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailPort">Port</Label>
                  <Input
                    id="emailPort"
                    type="number"
                    placeholder="587"
                    value={form.emailPort}
                    onChange={(e) => setForm((f) => ({ ...f, emailPort: parseInt(e.target.value) || 587 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emailUser">Username / Email Pengirim</Label>
                  <Input
                    id="emailUser"
                    type="email"
                    placeholder="noreply@example.com"
                    value={form.emailUser}
                    onChange={(e) => setForm((f) => ({ ...f, emailUser: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailPass">Password / App Password</Label>
                  <Input
                    id="emailPass"
                    type="password"
                    placeholder="••••••••"
                    value={form.emailPass}
                    onChange={(e) => setForm((f) => ({ ...f, emailPass: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailTo">Email Penerima (To)</Label>
                <Input
                  id="emailTo"
                  type="email"
                  placeholder="admin@example.com"
                  value={form.emailTo}
                  onChange={(e) => setForm((f) => ({ ...f, emailTo: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Aturan Trigger Notifikasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Saat Penjualan Baru Terdeteksi</p>
                  <p className="text-xs text-muted-foreground">Kirim notifikasi saat unit berkurang antar refresh (sale event)</p>
                </div>
                <Switch
                  checked={form.notifyOnSale}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, notifyOnSale: v }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Saat Refresh Data Selesai</p>
                  <p className="text-xs text-muted-foreground">Kirim notifikasi setiap kali scraping SIKUMBANG selesai</p>
                </div>
                <Switch
                  checked={form.notifyOnRefreshComplete}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, notifyOnRefreshComplete: v }))}
                />
              </div>

              {config?.lastTestedAt && (
                <div className="p-3 rounded-lg bg-muted text-xs text-muted-foreground">
                  Terakhir diuji: {new Date(config.lastTestedAt).toLocaleString("id-ID")}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="gap-2 min-w-[120px]"
        >
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Simpan Konfigurasi
        </Button>

        <Button
          variant="outline"
          onClick={() => { setTestResult(null); testMutation.mutate(); }}
          disabled={testMutation.isPending || (!form.webhookEnabled && !form.emailEnabled)}
          className="gap-2"
        >
          {testMutation.isPending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Send className="h-4 w-4" />}
          Kirim Test Notifikasi
        </Button>

        {saveSuccess && (
          <span className="flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            Tersimpan
          </span>
        )}

        {saveMutation.isError && (
          <span className="flex items-center gap-1.5 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            Gagal menyimpan
          </span>
        )}
      </div>

      {testResult !== null && (
        <Card className={`border ${testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
          <CardContent className="p-4 flex gap-3">
            {testResult.success
              ? <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              : <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />}
            <div>
              <p className={`text-sm font-semibold ${testResult.success ? "text-green-800" : "text-red-800"}`}>
                {testResult.success ? "Test berhasil dikirim!" : "Test gagal"}
              </p>
              <div className="text-xs mt-1 space-y-0.5">
                {testResult.results.webhook !== undefined && (
                  <p className={testResult.results.webhook ? "text-green-700" : "text-red-600"}>
                    Webhook: {testResult.results.webhook ? "✓ Terkirim" : "✗ Gagal"}
                  </p>
                )}
                {testResult.results.email !== undefined && (
                  <p className={testResult.results.email ? "text-green-700" : "text-red-600"}>
                    Email: {testResult.results.email ? "✓ Terkirim" : "✗ Gagal (periksa konfigurasi SMTP)"}
                  </p>
                )}
                {testResult.results.webhook === undefined && testResult.results.email === undefined && (
                  <p className="text-muted-foreground">Tidak ada channel aktif. Aktifkan webhook atau email terlebih dahulu.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
