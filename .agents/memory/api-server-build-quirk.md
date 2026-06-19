---
name: API server build requirement
description: API server runs from pre-compiled dist/, not TypeScript source — must rebuild after any route changes
---

The `API Server` workflow runs `node ./dist/index.mjs` (pre-compiled). When editing `artifacts/api-server/src/routes/lumajang.ts` or any server TypeScript:
1. Run `cd artifacts/api-server && pnpm run build` first
2. Then restart the `API Server` workflow

**Why:** The `start` script executes the pre-built bundle, not the TS source. Changes to `.ts` files are NOT picked up until rebuilt.

**How to apply:** Any time server-side routes or logic change, rebuild before testing. The build takes ~1.5 seconds with esbuild so it's fast.
