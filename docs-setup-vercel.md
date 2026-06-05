# Catatan Deploy Vercel Jago CPNS

Deploy Vercel belum dijalankan pada tahap ini. Dokumen ini hanya mencatat konfigurasi yang perlu dipakai nanti setelah migrasi Supabase dan push GitHub selesai.

Entry aktif saat ini adalah aplikasi React + Vite + TypeScript di folder `client/`.

## Konfigurasi Vercel

- Root directory: `./`
- Install command: default Vercel atau `npm install`
- Build command: `npm run build:vercel`
- Output directory: `client/dist`

`vercel.json` root sudah mengatur build command dan output directory tersebut.

## Environment Supabase

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

## Catatan Migrasi

Aplikasi tidak lagi memakai endpoint API/Express lama. Untuk tahap deploy nanti, cukup set environment Supabase publishable di Vercel dan jalankan build dari root repository.
