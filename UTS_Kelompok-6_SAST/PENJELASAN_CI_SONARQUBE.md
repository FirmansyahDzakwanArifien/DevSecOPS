# Penjelasan Pipeline CI SAST SonarQube (GitHub Actions)

Dokumen ini menjelaskan tambahan **pengecekan otomatis** pada UTS SAST Kelompok 6. Pada laporan utama,
scan SonarQube dijalankan manual dari laptop (`sonar-scanner`). Dengan workflow GitHub Actions, scan yang
sama berjalan otomatis setiap kali source code berubah. Pengecekan keamanan pun menjadi bagian dari alur
pengembangan (*shift-left security*), bukan sekadar langkah sekali jalan di akhir.

## 1. Tujuan

1. **Otomatis**: setiap perubahan kode langsung dianalisis tanpa perlu menjalankan scanner manual.
2. **Mencegah regresi**: kerentanan yang sudah diperbaiki (MD5, CSRF dimatikan, API key hardcoded, dll.)
   tidak bisa muncul lagi tanpa ketahuan, karena pipeline akan gagal.
3. **Baseline tetap aman**: hasil CI dikirim ke project SonarQube terpisah, sehingga project
   `uts-kelompok6-blog-sebelum` dan `uts-kelompok6-blog-sesudah` yang dipakai di laporan tidak tertimpa.

## 2. Lokasi dan Komponen

| Komponen | Nilai |
|---|---|
| Repository | `FirmansyahDzakwanArifien/DevSecOPS` |
| Branch | `uts/sast-sonarqube-ci` |
| File workflow | `.github/workflows/sast-sonarqube.yml` |
| Source yang dianalisis | `UTS_Kelompok-6_SAST/kelompok-A-blog-platform/` |
| Server SonarQube | SonarQube Community Build 26.9 (`sonarqube.cyphera.my.id`) |
| Project SonarQube (CI) | `uts-kelompok6-blog-ci` |
| Action yang dipakai | `SonarSource/sonarqube-scan-action@v8.3.0` (action resmi SonarSource) |
| Kredensial | GitHub Secrets `SONAR_TOKEN` dan `SONAR_HOST_URL` |

## 3. Alur Kerja Pipeline

```
Developer push / buka Pull Request
            │  (hanya jika ada perubahan di kelompok-A-blog-platform/)
            ▼
GitHub Actions menyalakan runner ubuntu-latest
            │
            ▼
1. Checkout source code (riwayat git lengkap)
            │
            ▼
2. SonarScanner menganalisis kode PHP (app, routes, config)
   dan mengirim hasil ke server SonarQube
            │
            ▼
3. Pipeline menunggu hasil Quality Gate dari server
            │
     ┌──────┴───────┐
     ▼              ▼
  PASSED          FAILED
  job hijau ✔     job merah ✘ → perubahan perlu diperbaiki dulu
```

## 4. Penjelasan Isi Workflow

```yaml
on:
  workflow_dispatch:
  push:
    branches: [ uts/sast-sonarqube-ci ]
    paths:
      - 'UTS_Kelompok-6_SAST/kelompok-A-blog-platform/**'
      - '.github/workflows/sast-sonarqube.yml'
  pull_request:
    paths:
      - 'UTS_Kelompok-6_SAST/kelompok-A-blog-platform/**'
```

Bagian **trigger** menentukan kapan pipeline berjalan:
- `workflow_dispatch`: bisa dijalankan manual dari tab **Actions → SAST - SonarQube Scan → Run workflow**.
- `push`: berjalan ketika ada push ke branch ini yang mengubah source aplikasi atau file workflow-nya.
- `pull_request`: berjalan ketika ada PR yang mengubah source aplikasi, sehingga kode dicek sebelum di-merge.
- Filter `paths` membuat pipeline tidak berjalan sia-sia saat yang berubah hanya laporan atau slide.

```yaml
permissions:
  contents: read
```

Prinsip **least privilege**: token bawaan GitHub hanya diberi izin baca repository.

```yaml
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
```

Mengambil source code. `fetch-depth: 0` mengambil seluruh riwayat git agar SonarQube bisa menentukan
*new code* dan informasi *blame* (siapa yang menulis baris yang bermasalah) dengan akurat.

```yaml
      - name: SonarQube Scan
        uses: SonarSource/sonarqube-scan-action@v8.3.0
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
        with:
          projectBaseDir: UTS_Kelompok-6_SAST/kelompok-A-blog-platform
          args: >
            -Dsonar.projectKey=uts-kelompok6-blog-ci
            -Dsonar.projectName=UTS-Kelompok6-Blog-CI
            -Dsonar.qualitygate.wait=true
            -Dsonar.qualitygate.timeout=300
```

- **Versi action dikunci** (`v8.3.0`) agar hasil pipeline konsisten dan tidak berubah diam-diam saat action diperbarui.
- **Token dan URL server diambil dari GitHub Secrets**, tidak ditulis di kode. Ini sejalan dengan salah satu
  temuan audit (kredensial hardcoded) yang sudah diperbaiki.
- `projectBaseDir` mengarahkan scanner ke folder aplikasi, sehingga `sonar-project.properties` di folder
  tersebut ikut terbaca (`sonar.sources=app,routes,config`, exclusions `vendor/**`, dll.).
- `sonar.projectKey` menimpa key bawaan agar hasil masuk ke project CI yang terpisah.
- `sonar.qualitygate.wait=true` membuat scanner **menunggu keputusan Quality Gate**. Jika gagal,
  step dan job ikut gagal (merah). Inilah fungsi "gerbang" yang memblokir kode tidak aman.
- `sonar.qualitygate.timeout=300` membatasi waktu tunggu hasil dari server maksimal 5 menit.

## 5. Bukti Eksekusi

Run pertama dipicu otomatis oleh push dan **berhasil**:

- Run: https://github.com/FirmansyahDzakwanArifien/DevSecOPS/actions/runs/41459578523
- Semua step sukses: *Set up job → Checkout → SonarQube Scan → Complete job*
- Cuplikan log scanner:

```
INFO  Communicating with SonarQube Community Build 26.9.0.129388
INFO  Project key: uts-kelompok6-blog-ci
INFO  10 files indexed
INFO  ------------- Check Quality Gate status
INFO  QUALITY GATE STATUS: PASSED - View details on .../dashboard?id=uts-kelompok6-blog-ci
INFO  EXECUTION SUCCESS
```

- Dashboard: https://sonarqube.cyphera.my.id/dashboard?id=uts-kelompok6-blog-ci

Hasil **PASSED** sesuai dengan kondisi kode setelah remediasi (0 issue, Security Rating A pada project `-sesudah`).

## 6. Pembagian Tiga Project SonarQube

| Project | Isi | Cara dijalankan |
|---|---|---|
| `uts-kelompok6-blog-sebelum` | Kode asli sebelum perbaikan (8 issue, Security E) | Manual, sekali |
| `uts-kelompok6-blog-sesudah` | Kode setelah perbaikan (0 issue, Security A) | Manual, sekali |
| `uts-kelompok6-blog-ci` | Setiap perubahan kode berikutnya | Otomatis via GitHub Actions |

## 7. Keterbatasan

- SonarQube Community Build tidak memiliki *taint analysis*, sehingga SQL Injection, Command Injection,
  Path Traversal, IDOR, dan Mass Assignment tetap perlu review manual. Pipeline ini melengkapi review manual,
  bukan menggantikannya.
- Community Build hanya menganalisis satu branch utama per project dan tidak mendukung dekorasi PR
  (komentar otomatis di Pull Request). Status lolos/gagal tetap terlihat dari tanda ✔/✘ pada PR atau commit.
