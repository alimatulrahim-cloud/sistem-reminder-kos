# Sistem Red Flag Telat Bayar 3 Hari

**Satu sistem, satu Google Sheet, lima menit per hari.** Penghuni yang sudah lewat 3 hari dari jatuh tempo dan belum bayar otomatis ditandai merah, dan pesan WhatsApp red flag hanya bisa dikirim setelah mutasi rekening hari itu dicek. Penghuni yang sudah lunas tidak mungkin ikut menerima red flag.

Sistem ini menggabungkan tiga pengaman dalam satu alur:

| Pengaman | Mencegah kesalahan | Cara kerjanya |
|---|---|---|
| Kode unik nominal | Uang masuk tidak dikenali kamarnya | Tiga digit terakhir transfer = nomor kamar |
| Status dihitung rumus | Salah ketik atau salah baris saat update status | Status dihitung dari riwayat pembayaran, tidak pernah diketik |
| Gerbang verifikasi harian | Red flag dikirim pakai data kemarin | Tombol kirim baru muncul setelah mutasi hari ini dicek |

---

## Bagian 1: Aturan Pembayaran untuk Penghuni

Tiga digit terakhir nominal transfer wajib sama dengan nomor kamar.

| Kamar | Sewa dasar | Nominal transfer |
|---|---|---|
| 01 | Rp1.500.000 | Rp1.500.001 |
| 03 | Rp1.500.000 | Rp1.500.003 |
| 12 | Rp1.750.000 | Rp1.750.012 |

Tanggal jatuh tempo tetap mengikuti tanggal masuk masing-masing penghuni. Aturan nominal ini dimasukkan ke daftar do & don't kos dan disampaikan saat penghuni baru masuk.

---

## Bagian 2: Isi Google Sheet

### Sheet "Log" (riwayat pembayaran, hanya ditambah, tidak pernah diedit)

| A: Tanggal bayar | B: Kamar | C: Periode yang dibayar | D: Nominal | E: Bukti |
|---|---|---|---|---|
| 19 Okt 2026 | 03 | 21 Okt 2026 | 1.500.003 | link foto |

Kolom C = tanggal jatuh tempo yang dilunasi oleh pembayaran tersebut. Paling aman diisi lewat Google Form yang terhubung ke sheet ini, dengan kolom Kamar berupa dropdown.

### Sheet "Master" (dihitung otomatis)

| A: Kamar | B: Nama | C: No WA | D: Jatuh tempo berikutnya | E: Hari telat | F: Status | G: Kirim |
|---|---|---|---|---|---|---|

Nomor WA ditulis dengan awalan 62, tanpa 0 dan tanpa spasi. **Sel H1** berisi tanggal terakhir mutasi rekening dicek.

**Kolom D**, jatuh tempo berikutnya:
```
=EDATE(MAXIFS(Log!C:C, Log!B:B, A2), 1)
```

**Kolom E**, jumlah hari telat:
```
=MAX(0, TODAY()-D2)
```

**Kolom F**, status:
```
=IF(E2>=3, "RED FLAG", IF(E2>=1, "Lewat jatuh tempo", "Aman"))
```

**Kolom G**, tombol kirim (hanya muncul jika H1 = hari ini dan status RED FLAG):
```
=IF(AND($H$1=TODAY(), F2="RED FLAG"),
  HYPERLINK("https://wa.me/"&C2&"?text="&ENCODEURL("Halo "&B2&", per pengecekan mutasi hari ini "&TEXT(TODAY(),"dd mmm yyyy")&", pembayaran sewa kamar "&A2&" untuk jatuh tempo "&TEXT(D2,"dd mmm yyyy")&" belum kami terima ("&E2&" hari). Mohon segera diselesaikan. Jika sudah transfer, mohon kirim bukti transfernya. Terima kasih."), "Kirim Red Flag"),
  "")
```

### Pengaturan sekali di awal

1. Protect sheet Master supaya rumus tidak bisa tertimpa.
2. Conditional formatting kolom F: merah untuk "RED FLAG", kuning untuk "Lewat jatuh tempo".
3. Untuk setiap penghuni, isi satu baris awal di Log dengan periode = satu bulan sebelum jatuh tempo pertamanya, supaya rumus punya titik awal.
4. Penghuni dengan tanggal masuk 29, 30, atau 31: sepakati jatuh tempo tanggal 28 supaya tidak bergeser di bulan Februari dan bulan 30 hari.

---

## Bagian 3: Rutinitas Setiap Pagi

1. **Buka mutasi rekening.**
2. **Cocokkan setiap transfer masuk** berdasarkan tiga digit terakhir nominal, lalu catat ke Log lewat Google Form.
3. **Isi H1 dengan tanggal hari ini.**
4. **Klik "Kirim Red Flag"** pada baris yang muncul, lalu tekan kirim di WhatsApp.

Kalau langkah 3 terlewat, kolom G kosong untuk semua kamar, sehingga red flag tidak bisa dikirim berdasarkan data lama. Dengan 15 penghuni, pada kebanyakan hari tidak ada red flag sama sekali.

---

## Bagian 4: Kalau Penghuni Ternyata Sudah Bayar

Kemungkinan ini hanya muncul jika penghuni transfer setelah pengecekan pagi. Pesan red flag sudah menyebut "per pengecekan mutasi hari ini" dan meminta bukti transfer, sehingga isinya tetap faktual, bukan tuduhan. Cukup catat pembayarannya ke Log, dan status kamar itu langsung kembali "Aman".
