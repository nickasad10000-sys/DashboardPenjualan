---
name: API client hook signatures
description: Generated hooks di @workspace/api-client-react — mana yang 1 arg vs 2 arg, dan akibat salah signature
---

## Rule
Hooks tanpa path params → 1 arg saja: `useGetLumajangSummary(options?)`
Hooks dengan path/query params → 2 args: `useGetLumajangListings(params?, options?)`

## Detail
- `useGetLumajangSummary(options?)` — 1 arg, options = `{ query?, request? }`
- `useGetLumajangKecamatan(options?)` — 1 arg
- `useGetLumajangDevelopers(options?)` — 1 arg
- `useGetLumajangListings(params?, options?)` — 2 args, params = `{ page?, limit?, ... }`
- `useGetLumajangListingDetail(idLokasi, options?)` — 2 args

## Why
Memanggil `useGetLumajangSummary({}, { query: {...} })` dengan 2 arg: arg pertama `{}` jadi `options` (kosong tanpa `query`), arg kedua diabaikan → `placeholderData`, `refetchInterval` tidak aktif → data tidak fresh → crash `summary.totalStok is undefined`.

## How to apply
Sebelum menambahkan options ke hook call, cek apakah hook punya path/query params. Kalau tidak, gunakan 1 arg saja:
```ts
// BENAR
useGetLumajangSummary({ query: { refetchInterval: ... } })
// SALAH - 2 arg pada hook tanpa params
useGetLumajangSummary({}, { query: { refetchInterval: ... } })
```
