---
name: Dashboard workflow env setup
description: PORT dan BASE_PATH harus di-set langsung di workflow command karena Replit tidak auto-set dari artifact.toml
---

## Rule
Saat mengkonfigurasi workflow untuk artifact lumajang-dashboard, PORT dan BASE_PATH harus di-prefix langsung di command string.

## Values (dari artifact.toml)
- Dashboard: `PORT=24105 BASE_PATH=/ pnpm --filter @workspace/lumajang-dashboard run dev`
- API Server: `PORT=8080 pnpm --filter @workspace/api-server run start`

## Why
Vite config (`vite.config.ts`) throws error jika PORT atau BASE_PATH tidak ada di environment. `configureWorkflow()` tidak punya parameter `env`, jadi satu-satunya cara adalah prefix di command string. Nilai PORT diambil dari `artifact.toml` (bukan dari `.replit` `[[ports]]` section).

## How to apply
Selalu cek `artifacts/<slug>/.replit-artifact/artifact.toml` untuk PORT dan BASE_PATH yang benar sebelum mengkonfigurasi workflow.
