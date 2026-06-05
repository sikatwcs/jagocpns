# Jago CPNS

Jago CPNS adalah aplikasi tryout dan bimbel CPNS online berbasis React, TypeScript, dan Supabase.

Kode aktif proyek ini sekarang berada di `client/`. Koneksi API lama sudah dilepas dari aplikasi, sehingga data aktif dibaca dan ditulis melalui Supabase project baru.

## Struktur Aktif

- `client/`: aplikasi React + Vite + TypeScript.
- `client/src/lib/supabase/`: client Supabase dan tipe database.
- `client/src/features/`: modul fitur seperti auth, dashboard, tryout, ranking, profil, dan admin.
- `supabase/migrations/`: schema, policy, dan backfill data Supabase.

## Environment

Salin `.env.example` ke `.env.local` atau `client/.env.local`, lalu isi variable berikut:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Jangan commit file `.env` atau secret key service-role.

## Menjalankan Lokal

```bash
npm run dev
```

Perintah itu menjalankan aplikasi Vite di folder `client/`.

## Build

```bash
npm run build
```

Output build ada di `client/dist`.

## Catatan Migrasi

Schema baru memakai nama tabel `snake_case` agar lebih rapi dan mudah diskalakan. Tabel legacy lama dikunci dengan RLS dan privilege yang dicabut dari role client, lalu data utama dipindahkan ke tabel baru melalui migration SQL.
