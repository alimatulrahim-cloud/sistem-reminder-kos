# 3 Solusi Terbaik: Red Flag Penghuni Telat Bayar 3 Hari

**Target minimal:** memberi reminder atau red flag kepada penghuni yang sudah **lewat 3 hari dari tanggal jatuh tempo** dan belum bayar, tanpa sekali pun salah sasaran ke penghuni yang sudah lunas.

**Tiga solusi terpilih:**

1. Kode unik nominal per kamar
2. Log pembayaran dengan status dihitung rumus
3. Gerbang verifikasi harian sebelum kirim

Ketiganya gratis, cukup dengan Google Sheet dan WhatsApp, dan **dipakai bersamaan**, karena masing-masing menutup celah kesalahan yang berbeda. Satu saja tidak cukup untuk menjamin nol salah sasaran.

| Solusi | Celah yang ditutup | Pertanyaan yang dijawab |
|---|---|---|
| 1. Kode unik nominal | Identitas | Uang ini dari kamar mana? |
| 2. Log + status rumus | Pencatatan | Apakah status kamar ini benar? |
| 3. Gerbang verifikasi | Waktu | Apakah data hari ini sudah dicek? |

**Keuntungan target "telat 3 hari":** jeda 3 hari setelah jatuh tempo memberi ruang bagi transfer antarbank yang tertunda, akhir pekan, dan hari libur. Risiko salah flag jauh lebih kecil dibanding reminder H-3 sebelum jatuh tempo.

---

## Solusi 1: Kode Unik Nominal per Kamar

**Fungsi:** memastikan setiap uang masuk langsung bisa dipastikan berasal dari kamar mana.

Tiga digit terakhir nominal transfer = nomor kamar.

| Kamar | Sewa dasar | Nominal transfer |
|---|---|---|
| 01 | Rp1.500.000 | Rp1.500.001 |
| 03 | Rp1.500.000 | Rp1.500.003 |
| 12 | Rp1.750.000 | Rp1.750.012 |

**Kenapa penting untuk target ini:** red flag yang salah biasanya terjadi karena uang sudah masuk tapi tidak dikenali, misalnya dikirim oleh orang tua penghuni dengan nama pengirim berbeda. Dengan kode unik, tidak ada transfer yang "yatim".

**Aturan ke penghuni:** transfer wajib persis sesuai nominal tagihan, termasuk tiga digit terakhir. Masukkan aturan ini ke daftar do & don't kos.

---

## Solusi 2: Log Pembayaran, Status Dihitung Rumus

**Fungsi:** status "lunas" atau "red flag" tidak pernah diketik tangan, sehingga tidak bisa salah ketik atau salah baris.

### Sheet "Log" (hanya ditambah, tidak pernah diedit)

| A: Tanggal bayar | B: Kamar | C: Periode yang dibayar | D: Nominal | E: Bukti |
|---|---|---|---|---|
| 19 Okt 2026 | 03 | 21 Okt 2026 | 1.500.003 | link foto |

Kolom C = tanggal jatuh tempo yang dilunasi oleh pembayaran itu.

### Sheet "Master"

| A: Kamar | B: Nama | C: No WA | D: Jatuh tempo berikutnya | E: Hari telat | F: Status | G: Kirim |
|---|---|---|---|---|---|---|

**Kolom D**, jatuh tempo berikutnya, dihitung dari pembayaran terakhir:
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

### Pengamanan

- Kunci sheet Master (Protect range) supaya rumus tidak tertimpa.
- Kolom Kamar di Log memakai dropdown (Data Validation), supaya tidak ada salah ketik "3" vs "03".
- Isi Log lewat Google Form, bukan langsung di Sheet.
- Penghuni baru: isi satu baris awal di Log dengan periode = satu bulan sebelum jatuh tempo pertamanya.
- Conditional formatting: merah untuk "RED FLAG", kuning untuk "Lewat jatuh tempo".

---

## Solusi 3: Gerbang Verifikasi Harian Sebelum Kirim

**Fungsi:** tombol kirim red flag hanya muncul setelah mutasi rekening hari ini dicek dan dicatat ke Log.

**Sel H1 di sheet Master:** tanggal terakhir cek mutasi, diisi setelah selesai mencocokkan mutasi dengan Log.

**Kolom G**, tombol kirim:
```
=IF(AND($H$1=TODAY(), F2="RED FLAG"),
  HYPERLINK("https://wa.me/"&C2&"?text="&ENCODEURL("Halo "&B2&", per pengecekan mutasi hari ini "&TEXT(TODAY(),"dd mmm yyyy")&", pembayaran sewa kamar "&A2&" untuk jatuh tempo "&TEXT(D2,"dd mmm yyyy")&" belum kami terima ("&E2&" hari). Mohon segera diselesaikan. Jika sudah transfer, mohon kirim bukti transfernya. Terima kasih."), "Kirim Red Flag"),
  "")
```

Kalau H1 bukan tanggal hari ini, kolom G kosong untuk semua kamar. Tidak mungkin mengirim red flag berdasarkan data kemarin.

### Urutan wajib setiap pagi

1. Buka mutasi rekening.
2. Cocokkan setiap transfer dengan kode unik kamar, catat ke Log.
3. Isi H1 dengan tanggal hari ini.
4. Kirim red flag hanya lewat tombol yang muncul.

Waktu sekitar 5 menit per hari. Dengan 15 penghuni, red flag yang perlu dikirim biasanya nol pada kebanyakan hari.

---

## Kenapa 2 Solusi Lain Tidak Dipilih

| Solusi | Alasan tidak masuk 3 terbaik |
|---|---|
| Transfer terjadwal oleh penghuni | Bagus untuk mengurangi keterlambatan, tapi tidak menghasilkan red flag dan bergantung pada kemauan tiap penghuni. Bisa ditambahkan nanti sebagai pelengkap |
| Virtual account lewat payment gateway | Paling akurat, tapi berbayar per transaksi, butuh pendaftaran usaha, dan penghuni harus mengubah cara bayar. Berlebihan untuk target minimal 15 kamar |

---

## Sisa Risiko dan Penutupnya

**Risiko:** penghuni transfer setelah pengecekan pagi, lalu menerima red flag beberapa menit kemudian.

**Penutup:** pesan red flag sudah menyebut "per pengecekan mutasi hari ini" dan meminta bukti transfer bila sudah bayar. Pesan menjadi faktual terhadap waktu cek, bukan tuduhan, dan jika ternyata sudah bayar, cukup catat ke Log dan status langsung kembali "Aman".
