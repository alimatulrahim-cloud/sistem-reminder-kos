# 5 Solusi Reminder Tagihan Kos Tanpa Salah Sasaran

**Constraint:** Tidak boleh ada satu pun reminder yang salah antara penghuni yang sudah lunas dan yang belum bayar atau telat.

**Inti masalahnya:** Salah reminder hampir selalu terjadi karena salah satu dari tiga celah berikut:

1. **Celah identitas:** uang masuk, tapi tidak jelas dari kamar mana.
2. **Celah pencatatan:** pembayaran sudah diterima, tapi status di catatan tidak diperbarui atau salah baris.
3. **Celah waktu:** penghuni bayar malam hari, reminder dikirim pagi sebelum mutasi rekening dicek.

Kelima solusi di bawah masing-masing menutup celah yang berbeda. Untuk jaminan nol kesalahan, gabungkan beberapa di antaranya (lihat rekomendasi di bagian akhir).

---

## Solusi 1: Kode Unik Nominal per Kamar

**Menutup:** celah identitas.

Setiap kamar membayar dengan nominal yang tiga digit terakhirnya sama dengan nomor kamar.

| Kamar | Sewa dasar | Nominal transfer |
|---|---|---|
| 01 | Rp1.500.000 | Rp1.500.001 |
| 03 | Rp1.500.000 | Rp1.500.003 |
| 12 | Rp1.750.000 | Rp1.750.012 |

**Cara kerja:**
- Saat cek mutasi rekening, tiga digit terakhir langsung menunjukkan kamar mana yang bayar, tanpa perlu menebak dari nama pengirim.
- Berguna sekali ketika yang transfer adalah orang tua penghuni, nama pengirim berbeda, atau dua penghuni bayar di hari yang sama dengan nominal sama.

**Aturan yang dikomunikasikan ke penghuni:** "Transfer wajib dengan nominal persis sesuai tagihan, termasuk tiga digit terakhir."

**Biaya:** gratis. Selisih maksimal Rp15 per bulan.

---

## Solusi 2: Buku Log Pembayaran, Status Dihitung Rumus

**Menutup:** celah pencatatan.

Status lunas/belum tidak boleh diketik tangan. Yang diketik hanya **riwayat pembayaran**, dan status dihitung otomatis dari riwayat itu.

**Sheet "Log" (hanya ditambah, tidak pernah diedit):**

| A: Tanggal bayar | B: Kamar | C: Periode yang dibayar | D: Nominal | E: Bukti |
|---|---|---|---|---|
| 19 Okt 2026 | 03 | 21 Okt 2026 | 1.500.003 | link foto |

Kolom C diisi tanggal jatuh tempo yang dilunasi oleh pembayaran tersebut.

**Sheet "Master":**

| A: Kamar | B: Nama | C: No WA | D: Jatuh tempo berikutnya | E: Status |
|---|---|---|---|---|

Rumus kolom D (jatuh tempo berikutnya = satu bulan setelah periode terakhir yang dibayar):
```
=EDATE(MAXIFS(Log!C:C, Log!B:B, A2), 1)
```

Rumus kolom E:
```
=IF(D2<TODAY(),"TERLAMBAT",IF(D2-TODAY()<=3,"INGATKAN","LUNAS / AMAN"))
```

**Pengamanan tambahan:**
- Kunci (Protect range) sheet Master supaya rumus tidak bisa tertimpa.
- Kolom B di Log pakai Data Validation berupa dropdown nomor kamar, supaya tidak ada salah ketik "3" vs "03".
- Isi Log lewat Google Form, bukan langsung di Sheet, supaya tidak ada salah baris.

**Catatan:** untuk penghuni baru, isi satu baris awal di Log dengan periode = satu bulan sebelum jatuh tempo pertamanya, supaya rumus punya titik awal.

**Biaya:** gratis.

---

## Solusi 3: Gerbang Verifikasi Harian Sebelum Kirim

**Menutup:** celah waktu.

Tombol "Kirim WA" hanya muncul jika mutasi rekening hari ini **sudah dicek dan dicatat**. Kalau belum dicek, tombol kosong, sehingga tidak mungkin kirim reminder berdasarkan data kemarin.

**Di sheet Master, sel H1:** tanggal terakhir cek mutasi (diisi manual setiap kali selesai mencocokkan mutasi dengan Log).

**Rumus kolom F (tombol kirim):**
```
=IF(AND($H$1=TODAY(), OR(E2="INGATKAN", E2="TERLAMBAT")),
  HYPERLINK("https://wa.me/"&C2&"?text="&ENCODEURL("Halo "&B2&", mengingatkan sewa kamar "&A2&" jatuh tempo "&TEXT(D2,"dd mmm yyyy")&". Terima kasih."), "Kirim WA"),
  "")
```

**Urutan wajib setiap pagi:**
1. Buka mutasi rekening.
2. Cocokkan setiap transfer masuk dengan kode unik kamar (Solusi 1), catat ke Log.
3. Isi H1 dengan tanggal hari ini.
4. Baru setelah itu tombol "Kirim WA" muncul untuk penghuni yang memang belum bayar.

**Biaya:** gratis. Waktu sekitar 5 menit per hari.

---

## Solusi 4: Transfer Terjadwal oleh Penghuni

**Menutup:** kebutuhan reminder itu sendiri.

Penghuni diminta mengatur transfer terjadwal bulanan di aplikasi mobile banking mereka, tepat pada tanggal gajian masing-masing dan sebelum jatuh tempo. Ini sesuai dengan keberatan penghuni soal tanggal gajian yang berbeda-beda, karena mereka sendiri yang memilih tanggalnya.

**Cara kerja:**
- Penghuni yang sudah pakai transfer terjadwal ditandai di Master (kolom "Autodebet: Ya").
- Reminder H-3 **tidak dikirim** ke mereka. Yang dicek hanya apakah uang masuk di tanggal jadwal.
- Kalau transfer terjadwal gagal (saldo kurang), barulah dikirim pesan, dan pada saat itu statusnya memang belum bayar, jadi pasti benar sasaran.

**Insentif yang bisa ditawarkan:** potongan kecil, misalnya Rp25.000 per bulan, untuk penghuni yang memakai transfer terjadwal.

**Ketidakpastian:** sebagian besar bank besar di Indonesia menyediakan fitur transfer terjadwal di mobile banking, tapi saya belum memverifikasi ketersediaannya di setiap bank dan e-wallet. Perlu ditanyakan ke penghuni bank apa yang mereka pakai.

**Biaya:** gratis untuk pemilik; mungkin ada biaya transfer antarbank bagi penghuni.

---

## Solusi 5: Virtual Account per Penghuni lewat Payment Gateway

**Menutup:** ketiga celah sekaligus, karena status pembayaran datang langsung dari sistem bank, bukan dari pencatatan manusia.

Setiap penghuni mendapat nomor virtual account sendiri. Uang yang masuk ke VA tersebut otomatis tercatat atas nama kamar itu, dan status tagihan berubah jadi lunas tanpa campur tangan pemilik.

**Pilihan jalurnya:**
- Layanan payment gateway Indonesia (misalnya Xendit, Midtrans, atau Duitku) yang menyediakan fitur invoice berulang dan virtual account.
- Aplikasi manajemen kos siap pakai yang sudah menyertakan fitur tagihan dan pembayaran.

**Kelebihan:** paling mendekati jaminan nol kesalahan, karena reminder hanya dikirim untuk tagihan yang menurut bank belum dibayar.

**Kekurangan:**
- Ada biaya per transaksi.
- Butuh pendaftaran dan verifikasi usaha.
- Penghuni harus mau membayar lewat VA, bukan transfer biasa.

**Ketidakpastian:** saya belum mengecek biaya, syarat pendaftaran untuk usaha perorangan, dan fitur reminder terkini dari masing-masing penyedia. Ini perlu dicek langsung sebelum memutuskan.

**Ini tetap bukan "bikin webapp sendiri":** semuanya layanan jadi yang tinggal didaftarkan.

---

## Perbandingan

| Solusi | Celah yang ditutup | Biaya | Usaha pemilik | Tingkat jaminan |
|---|---|---|---|---|
| 1. Kode unik nominal | Identitas | Gratis | Rendah | Sedang |
| 2. Log + status rumus | Pencatatan | Gratis | Rendah | Sedang |
| 3. Gerbang verifikasi harian | Waktu | Gratis | 5 menit/hari | Sedang |
| 4. Transfer terjadwal | Kebutuhan reminder | Gratis | Rendah | Tinggi, untuk penghuni yang ikut |
| 5. Virtual account | Ketiganya | Berbayar per transaksi | Rendah setelah setup | Paling tinggi |

## Rekomendasi

- **Tanpa biaya:** gabungkan **1 + 2 + 3**. Kode unik memastikan uang tercatat ke kamar yang benar, log memastikan status tidak salah ketik, dan gerbang verifikasi memastikan reminder tidak dikirim sebelum mutasi dicek. Ketiganya harus dipakai bersamaan; satu saja tidak cukup untuk jaminan nol kesalahan.
- **Tambahkan 4** untuk penghuni yang mau, supaya jumlah reminder yang harus dikirim makin sedikit.
- **Pindah ke 5** hanya kalau setelah gabungan 1 + 2 + 3 masih terjadi kesalahan, atau jumlah kamar bertambah.

**Satu sisa risiko di semua solusi gratis:** penghuni yang transfer setelah mutasi dicek pagi itu tetapi sebelum reminder dibaca. Untuk menutupnya, kirim reminder segera setelah cek mutasi, dan cantumkan tanggal cek di pesan, misalnya: "Per pengecekan pukul 08.00 hari ini, pembayaran kamar 03 belum kami terima."
