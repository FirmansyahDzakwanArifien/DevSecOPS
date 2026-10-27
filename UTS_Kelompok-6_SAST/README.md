# UTS DevSecOps - SAST dengan SonarQube (Kelompok 6)

Audit keamanan aplikasi **STT-NF Blog Platform** (`kelompok-A-blog-platform`, PHP/Laravel) menggunakan
Static Application Security Testing (SAST) dengan SonarQube.

## Anggota Kelompok 6

| No | Nama | NIM |
|---|---|---|
| 1 | Firmansyah Dzakwan Arifien | 0110223282 |
| 2 | Azzam Fikri | 0110225110 |
| 3 | Dhiya Nailah Rizqya | 0110225095 |
| 4 | Ghifana Adzkia Ahmad | 0110225044 |
| 5 | Rizky Putri | 0110225064 |
| 6 | Muhammad Fathir Lubis | 0110225005 |
| 7 | Muhammad Bintang Siregar | 0110225058 |

## Isi Folder

| File / Folder | Keterangan |
|---|---|
| `Laporan_UTS_SAST_Kelompok-6.docx` / `.pdf` | Laporan UTS lengkap |
| `Presentasi_UTS_SAST_Kelompok-6.pptx` / `.pdf` | Slide presentasi UTS |
| `kelompok-A-blog-platform/` | Source code (sudah diperbaiki) |
| `screenshots/` | Screenshot SonarQube sebelum (`b_*`) dan sesudah (`a_*`) perbaikan |

## Ringkasan Hasil

| Metrik | Sebelum | Sesudah |
|---|---|---|
| Security issues | 5 | 0 |
| Security Rating | E | A |
| Vulnerability | 4 | 0 |
| Maintainability issues | 3 | 0 |
| Total issue | 8 | 0 |

Scan sebelum dan sesudah perbaikan dijalankan ke dua project SonarQube terpisah:

- Sebelum: https://sonarqube.cyphera.my.id/dashboard?id=uts-kelompok6-blog-sebelum
- Sesudah: https://sonarqube.cyphera.my.id/dashboard?id=uts-kelompok6-blog-sesudah

## Kerentanan yang Diperbaiki

| Rule | Kerentanan | Lokasi | Severity |
|---|---|---|---|
| secrets:S6334 | Google API key hardcoded | AdminController.php:9 | Blocker |
| php:S4790 | Password di-hash dengan MD5 | AuthController.php:12, 25 | High |
| php:S4502 | CSRF dinonaktifkan untuk semua route | VerifyCsrfToken.php:12 | High |
| php:S1313 | Hardcoded IP address | config/database.php:15 | Low |
| php:S1068, S1135 | Field tidak terpakai, TODO | AdminController.php, VerifyCsrfToken.php | Medium, Info |

Selain itu diperbaiki juga temuan review manual yang tidak terdeteksi SonarQube Community Build:
SQL Injection, OS Command Injection, Path Traversal, IDOR, Mass Assignment, dan kredensial database hardcoded.
Riwayat perbaikan dapat dilihat per commit di branch ini (`git log -- UTS_Kelompok-6_SAST`).

## Cara Menjalankan Scan

```bash
cd kelompok-A-blog-platform
export SONAR_HOST_URL=https://sonarqube.cyphera.my.id
export SONAR_TOKEN=<token analisis>
sonar-scanner -Dsonar.projectKey=<project-key>
```
