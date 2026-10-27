# Sistem Reminder Kos

Sistem red flag untuk penghuni kos yang telat bayar 3 hari, tanpa salah sasaran ke penghuni yang sudah lunas. Cukup Google Sheet, Google Form, dan WhatsApp, tanpa bikin webapp sendiri.

Halaman panduan: https://alimatulrahim-cloud.github.io/sistem-reminder-kos/

## Isi repo

| File | Isi |
|---|---|
| [`index.html`](index.html) | Halaman panduan sistem final, rumus bisa langsung disalin |
| [`docs/sistem-red-flag-telat-3-hari.md`](docs/sistem-red-flag-telat-3-hari.md) | Sistem final dalam Markdown |
| [`docs/3-solusi-red-flag-telat-3-hari.md`](docs/3-solusi-red-flag-telat-3-hari.md) | Tiga solusi terbaik untuk target telat 3 hari |
| [`docs/5-solusi-reminder-tanpa-salah.md`](docs/5-solusi-reminder-tanpa-salah.md) | Lima solusi awal beserta perbandingannya |

## Ringkasnya

Tiga pengaman dipakai bersamaan:

1. **Kode unik nominal**: tiga digit terakhir transfer = nomor kamar.
2. **Status dihitung rumus**: status dihitung dari log pembayaran, tidak diketik tangan.
3. **Gerbang verifikasi harian**: tombol kirim WA baru muncul setelah mutasi hari ini dicek.

## Backend dan deploy (Cloudflare)

Aplikasi `aplikasi.html` bisa jalan sendiri (data di browser) atau lewat Worker `reminder-kos` yang menyimpan data di D1 supaya sama di semua perangkat.

- `src/index.js`: API `GET/PUT /api/state`, dikunci kode akses.
- `migrations/0001_init.sql`: tabel `rooms`, `payments`, `meta`.
- `wrangler.toml`: Worker, aset statis, dan binding D1 `reminder-kos`.

Deploy:

```sh
npm install
npx wrangler d1 migrations apply reminder-kos --remote
npx wrangler secret put APP_PASSCODE   # kode akses aplikasi
npx wrangler deploy
```
