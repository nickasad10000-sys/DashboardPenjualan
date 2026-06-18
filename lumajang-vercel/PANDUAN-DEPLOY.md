# 📋 Panduan Deploy — Dashboard Perumahan Lumajang
## Vercel + Supabase: Dari Nol Sampai Live

---

## Daftar Isi
1. [Persiapan](#1-persiapan)
2. [Setup Supabase](#2-setup-supabase)
3. [Upload Kode ke GitHub](#3-upload-kode-ke-github)
4. [Deploy ke Vercel](#4-deploy-ke-vercel)
5. [Ambil Data Pertama](#5-ambil-data-pertama)
6. [Verifikasi & Troubleshooting](#6-verifikasi--troubleshooting)

---

## 1. Persiapan

### Yang Kamu Butuhkan
- Akun **GitHub** (gratis) → [github.com/signup](https://github.com/signup)
- Akun **Supabase** (gratis) → [supabase.com](https://supabase.com)
- Akun **Vercel** (gratis/Pro) → [vercel.com/signup](https://vercel.com/signup)
- **Git** terinstall di komputer → [git-scm.com](https://git-scm.com)
- **Node.js** versi 18+ → [nodejs.org](https://nodejs.org)

### Download Kode dari Replit
1. Di Replit, klik **⋮ (tiga titik)** di pojok kanan atas
2. Pilih **Download as zip**
3. Extract zip tersebut
4. Masuk ke folder `lumajang-vercel/` — **ini yang akan kamu deploy**

---

## 2. Setup Supabase

### 2.1 Buat Project Baru

1. Buka [supabase.com](https://supabase.com) dan login
2. Klik tombol **"New Project"**
3. Isi form:
   - **Name**: `lumajang-dashboard` (bebas)
   - **Database Password**: buat password kuat, **simpan di tempat aman**
   - **Region**: pilih yang paling dekat (Singapore atau Tokyo)
4. Klik **"Create new project"**
5. Tunggu ±2 menit sampai project siap (ada loading bar)

### 2.2 Buat Tabel Database

1. Di sidebar kiri, klik **"SQL Editor"**
2. Klik **"New query"**
3. Buka file `supabase/schema.sql` dari folder yang sudah didownload
4. **Copy semua isinya** dan **paste** ke SQL Editor
5. Klik tombol **"Run"** (atau tekan Ctrl+Enter)
6. Pastikan muncul pesan: `Success. No rows returned`

> ✅ **Cek berhasil**: Klik **"Table Editor"** di sidebar → harus muncul 4 tabel:
> `listings`, `kecamatan_cache`, `sales_snapshots`, `scrape_progress`

### 2.3 Catat Kredensial API

1. Di sidebar kiri, klik **"Settings"** (ikon gear)
2. Klik **"API"**
3. Catat dua nilai ini — **jaga kerahasiaannya!**:

   ```
   Project URL:
   https://xxxxxxxxxxxxxxxxxxxx.supabase.co
   
   service_role (secret):
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   > ⚠️ Gunakan `service_role` key, **bukan** `anon` key.
   > `service_role` memberikan akses penuh untuk operasi tulis dari server.

---

## 3. Upload Kode ke GitHub

### 3.1 Buat Repository Baru di GitHub

1. Buka [github.com/new](https://github.com/new)
2. Isi:
   - **Repository name**: `lumajang-dashboard` (bebas)
   - **Visibility**: Public atau Private (keduanya ok)
   - **Jangan centang** "Initialize this repository"
3. Klik **"Create repository"**
4. GitHub akan menampilkan halaman kosong dengan instruksi — **biarkan dulu**

### 3.2 Push Kode dari Komputer

Buka Terminal / Command Prompt, masuk ke folder `lumajang-vercel/`:

```bash
# Masuk ke folder project
cd path/ke/lumajang-vercel

# Inisialisasi git
git init

# Tambahkan semua file
git add .

# Commit pertama
git commit -m "Dashboard Perumahan Lumajang - Vercel + Supabase"

# Ganti branch ke main
git branch -M main

# Hubungkan ke GitHub (ganti USERNAME dan REPO-NAME dengan milikmu)
git remote add origin https://github.com/USERNAME/REPO-NAME.git

# Push ke GitHub
git push -u origin main
```

> ✅ **Cek berhasil**: Refresh halaman GitHub — semua file harus muncul

---

## 4. Deploy ke Vercel

### 4.1 Import Project dari GitHub

1. Buka [vercel.com](https://vercel.com) dan login
2. Klik **"Add New..."** → **"Project"**
3. Di bagian **"Import Git Repository"**, klik **"Continue with GitHub"**
4. Authorize Vercel untuk mengakses GitHub jika diminta
5. Cari repository `lumajang-dashboard` → klik **"Import"**

### 4.2 Konfigurasi Deploy

Di halaman konfigurasi, isi sebagai berikut:

| Setting | Nilai |
|---|---|
| **Framework Preset** | Vite |
| **Root Directory** | `.` (biarkan kosong/default) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### 4.3 Tambahkan Environment Variables (WAJIB)

Ini langkah paling penting. Klik bagian **"Environment Variables"** dan tambahkan:

**Variable 1 (wajib):**
- Name: `SUPABASE_URL`
- Value: URL project Supabase kamu (contoh: `https://abcdefgh.supabase.co`)

**Variable 2 (wajib):**
- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: service_role key dari Supabase (yang panjang, dimulai `eyJhbGci...`)

**Variable 3 (opsional — untuk Supabase Realtime):**
- Name: `VITE_SUPABASE_URL`
- Value: sama dengan `SUPABASE_URL` di atas

**Variable 4 (opsional — untuk Supabase Realtime):**
- Name: `VITE_SUPABASE_ANON_KEY`
- Value: **anon/public key** dari Supabase (Settings → API → "anon public")

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` hanya boleh dipakai di server (Vercel Functions).
> `VITE_SUPABASE_ANON_KEY` adalah key publik yang aman dipakai di browser untuk Realtime.
>
> Jika Variable 3 & 4 tidak diisi, dashboard tetap berfungsi dengan polling setiap 30 detik.
> Jika diisi, dashboard update otomatis via WebSocket tanpa polling — lebih hemat bandwidth.

> Pastikan minimal Variable 1 & 2 ada sebelum deploy!

### 4.4 Deploy

1. Klik tombol **"Deploy"**
2. Vercel akan mulai proses build (±2-3 menit)
3. Tunggu sampai muncul confetti 🎉 dan status **"Congratulations!"**
4. Klik **"Visit"** untuk membuka dashboard yang sudah live

> ✅ **Cek berhasil**: Dashboard terbuka tapi data masih kosong (0 listing) — ini normal,
> data belum diambil dari SIKUMBANG

---

## 5. Ambil Data Pertama

### 5.1 Klik Refresh Data

1. Buka dashboard yang sudah live di Vercel
2. Klik tombol **"Refresh Data"** di pojok kanan atas
3. Tombol akan berubah menjadi loading spinner dan status akan muncul di header

### 5.2 Proses yang Terjadi (Otomatis)

Dashboard akan menampilkan progress scraping secara real-time:

```
Memulai scraping...
→ Scraping halaman 1–20 dari 1116...
→ Scraping halaman 21–40 dari 1116...
→ ... (berlanjut otomatis, berhenti lebih awal jika tidak ada listing Lumajang)
→ Mengambil detail unit...
→ Enrich 50 listing tersisa...
→ Menyimpan snapshot bulanan...
```

> ⏱️ **Estimasi waktu**: 3–5 menit (early stop aktif — tidak perlu scan semua 1116 halaman)
>
> 💡 **Jika tab tertutup di tengah jalan**: Buka lagi tab-nya — scraping akan **dilanjutkan otomatis**
> dari halaman terakhir yang sudah diproses. Progress tersimpan di Supabase.

### 5.3 Setelah Selesai

Data akan muncul secara otomatis:
- Dashboard: total lokasi, developer, stok, terjual
- Analisis Kecamatan: grafik distribusi supply
- Data Developer: 48 developer dengan listing mereka
- Listing Perumahan: 118 lokasi dengan detail unit
- Penjualan Bulanan: rekap unit per developer

---

## 6. Verifikasi & Troubleshooting

### ✅ Cek Data di Supabase

1. Buka Supabase Dashboard → **"Table Editor"**
2. Klik tabel `listings` → harus ada ~118 baris
3. Klik tabel `scrape_progress` → baris id=1 harus punya `completed_at` terisi

### ❌ Troubleshooting Umum

**Problem: Build gagal di Vercel**
```
Error: Cannot find module '@supabase/supabase-js'
```
→ Solusi: Pastikan file `package.json` di-push ke GitHub, lalu redeploy

---

**Problem: API error 500 saat Refresh Data**
```
Error: SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus diset
```
→ Solusi: 
1. Vercel Dashboard → Settings → Environment Variables
2. Tambahkan `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`
3. Klik **"Redeploy"** agar variable aktif

---

**Problem: Scraping berhenti di tengah jalan**
- Cek apakah tab browser tidak di-minimize terlalu lama
- Klik **"Refresh Data"** lagi — scraping akan melanjutkan dari awal
  (data yang sudah ada di Supabase akan ditimpa dengan data terbaru)

---

**Problem: Foto tidak muncul di detail listing**
- Ini normal untuk beberapa listing — foto di SIKUMBANG tidak selalu tersedia
- Foto yang ada akan tampil melalui photo proxy

---

**Problem: Vercel Hobby plan — scraping timeout**
```
Error: Function exceeded 10s execution limit
```
→ Solusi: Kurangi ukuran chunk. Edit file `src/components/layout.tsx`:
```typescript
// Ubah baris ini:
const CHUNK_SIZE = 100;
// Menjadi:
const CHUNK_SIZE = 30;
```
Commit dan push ke GitHub, Vercel akan auto-redeploy.

---

### 🔄 Update Data Rutin

Data SIKUMBANG berubah setiap bulan. Untuk memperbarui:
1. Buka dashboard
2. Klik **"Refresh Data"**
3. Tunggu proses selesai

Sistem akan otomatis menyimpan snapshot bulanan baru dan menghitung delta perubahan unit dibanding bulan sebelumnya.

---

## Ringkasan

| Komponen | Platform | Biaya |
|---|---|---|
| Frontend + API | Vercel | Gratis (Hobby) |
| Database | Supabase | Gratis (500MB, cukup untuk data ini) |
| Domain | Vercel | `.vercel.app` gratis, custom domain bisa ditambahkan |
| Scraping | Browser-driven | Tidak perlu server tambahan |

**Total biaya: Rp 0** untuk skala data ini 🎉

---

*Panduan ini dibuat untuk project Dashboard Perumahan Lumajang.*
*Data diambil dari SIKUMBANG Tapera (sikumbang.tapera.go.id)*
