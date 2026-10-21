# Kelompok 6 — DAST dengan OWASP ZAP (Pertemuan 6)

Laporan praktikum Dynamic Application Security Testing (DAST) terhadap aplikasi **SnipVault**
(`https://vulnlab.cyphera.my.id`) menggunakan **OWASP ZAP 2.17.0**.

## Isi folder
- `Kelompok-6_DAST_P6_DevSecOps.docx` — laporan lengkap (cover, ringkasan eksekutif, metodologi,
  temuan, rekomendasi remediasi, lampiran).
- `ZAP_DAST_Report_SnipVault_P6.html` — laporan HTML resmi hasil export OWASP ZAP.
  Pratinjau ter-render: <https://htmlpreview.github.io/?https://github.com/FirmansyahDzakwanArifien/DevSecOPS/blob/praktikum/dast-p6/Kelompok-6_DAST_P6/ZAP_DAST_Report_SnipVault_P6.html>

## Ringkasan temuan
**Scan otomatis OWASP ZAP:** 1 High (Cross-Site Scripting Reflected), 5 Medium, 6 Low, 6 Informational.

**Pengujian manual (Tugas E):** SSTI (`/preview`), IDOR (`/note/{id}`), Sensitive Data Exposure
(`/api/users`), dan SSRF (`/fetch`) — berdampak High, dikonfirmasi dengan bukti tangkapan layar.

## Anggota Kelompok 6
| No | Nama | NIM |
|----|------|-----|
| 1 | Firmansyah Dzakwan Arifien | 0110223282 |
| 2 | Azzam Fikri | 0110225110 |
| 3 | Dhiya Nailah Rizqya | 0110225095 |
| 4 | Ghifana Adzkia Ahmad | 0110225044 |
| 5 | Rizky Putri | 0110225064 |
| 6 | Muhammad Fathir Lubis | 0110225005 |
| 7 | Muhammad Bintang Siregar | 0110225058 |
