const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, AlignmentType,
  WidthType, BorderStyle, ShadingType, HeadingLevel, Footer, PageNumber, LevelFormat,
  VerticalAlign, TableLayoutType,
} = require('docx');

const FONT = 'Cambria';
const MONO = 'Consolas';
const TEAL = '0C343D';
const W = 7900;
const BASE = 24;          // 12 pt
const LINE = 360;         // 1,5
const OUT = process.argv[2] || 'laporan.docx';

// ---------- helpers ----------
const runs = (text, base = {}) => {
  const out = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|(?<![\w])_[^_]+_(?![\w]))/g;
  let last = 0, m;
  const size = base.size || BASE;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), ...base, size }));
    const t = m[0];
    if (t.startsWith('**')) out.push(new TextRun({ text: t.slice(2, -2), ...base, size, bold: true }));
    else if (t.startsWith('_')) out.push(new TextRun({ text: t.slice(1, -1), ...base, size, italics: true }));
    else out.push(new TextRun({ text: t.slice(1, -1), ...base, font: MONO, size: size - 3 }));
    last = m.index + t.length;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), ...base, size }));
  return out;
};
const P = (text, o = {}) => new Paragraph({
  children: runs(text, o.run || {}), alignment: o.align || AlignmentType.JUSTIFIED,
  spacing: { after: o.after ?? 120, line: LINE }, indent: o.indent ?? { firstLine: 567 }, keepNext: o.keepNext,
});
const H1 = (bab, title) => [
  new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, spacing: { after: 0 }, keepNext: true, children: [new TextRun(bab)] }),
  new Paragraph({ heading: HeadingLevel.HEADING_1, keepNext: true, children: [new TextRun(title)] }),
];
const H1s = t => new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun(t)] });
const H2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)], keepNext: true });
const H3 = t => new Paragraph({ heading: HeadingLevel.HEADING_3, children: runs(t, { bold: true }), keepNext: true });
const bullet = text => new Paragraph({ children: runs(text), numbering: { reference: 'bul', level: 0 }, alignment: AlignmentType.JUSTIFIED, spacing: { after: 60, line: LINE } });
const num = (text, ref) => new Paragraph({ children: runs(text), numbering: { reference: ref, level: 0 }, alignment: AlignmentType.JUSTIFIED, spacing: { after: 60, line: LINE } });

const counters = {};
const caption = (kind, bab, text) => {
  const k = kind + bab; counters[k] = (counters[k] || 0) + 1;
  return new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, keepNext: true,
    children: [new TextRun({ text: `${kind} ${bab}.${counters[k]} `, bold: true, size: 20 }), new TextRun({ text, size: 20 })],
  });
};
const border = { style: BorderStyle.SINGLE, size: 4, color: '9AA5A8' };
const borders = { top: border, bottom: border, left: border, right: border };
const cell = (content, w, o = {}) => new TableCell({
  width: { size: w, type: WidthType.DXA }, borders,
  shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill, color: 'auto' } : undefined,
  margins: { top: 50, bottom: 50, left: 90, right: 90 }, verticalAlign: VerticalAlign.CENTER,
  children: [new Paragraph({ alignment: o.align || AlignmentType.LEFT, spacing: { after: 0, line: 252 },
    children: runs(content, { size: 20, bold: o.bold, color: o.color }) })],
});
const table = (headers, rows, widths) => {
  const sum = widths.reduce((a, b) => a + b, 0);
  widths = widths.map(x => Math.round(x * W / sum));
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: widths, layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: headers.map((h, i) => cell(h, widths[i], { fill: TEAL, bold: true, color: 'FFFFFF', align: AlignmentType.CENTER })) }),
      ...rows.map(r => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, widths[i], i === 0 ? { fill: 'E6EEF0', bold: true } : {})) })),
    ],
  });
};
const code = (text, size = 17) => new Table({
  width: { size: W, type: WidthType.DXA }, columnWidths: [W], layout: TableLayoutType.FIXED,
  rows: [new TableRow({ cantSplit: true, children: [new TableCell({ width: { size: W, type: WidthType.DXA }, borders,
    shading: { type: ShadingType.CLEAR, fill: 'F4F6F7', color: 'auto' }, margins: { top: 90, bottom: 90, left: 120, right: 120 },
    children: text.replace(/^\n|\n$/g, '').split('\n').map(l => new Paragraph({ spacing: { after: 0, line: 240 },
      children: [new TextRun({ text: l || ' ', font: MONO, size })] })) })] })],
});
const spacer = (after = 120) => new Paragraph({ spacing: { after }, children: [] });

// ---------- cover (template makalah individu P7/P9) ----------
const C = (t, o = {}) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: o.after ?? 0, line: o.line ?? 360 },
  children: [new TextRun({ text: t, size: o.size || 24, bold: o.bold !== false })] });
const small = (t, after = 0) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after, line: 300 }, children: [new TextRun({ text: t, size: 22 })] });
const cover = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 500 }, children: [new ImageRun({ type: 'jpg', data: fs.readFileSync('tpl/logo.jpg'), transformation: { width: 170, height: 170 }, altText: { title: 'logo', description: 'Logo STT Terpadu Nurul Fikri', name: 'logo' } })] }),
  C('SEKOLAH TINGGI TEKNOLOGI TERPADU NURUL FIKRI', { size: 28, after: 600 }),
  C('TUGAS PERTEMUAN 10', { size: 28 }),
  C('SOFTWARE SUPPLY CHAIN SECURITY:', { size: 28 }),
  C('SBOM, SLSA, OIDC, DAN STRATEGI SCAN TRIVY', { size: 28, after: 160 }),
  C('Mata Kuliah DevSecOps', { bold: false, after: 700 }),
  C('FIRMANSYAH DZAKWAN ARIFIEN'),
  C('0110223282'),
  C('KELAS SIANG CS02 10.00 - 13.10'),
  C('DEVSECOPS'),
  C('SEMESTER 7', { after: 300 }),
  small('Dosen Pengampu: April Rustianto, S.Komp., M.T., CCIE'),
  small('Tanggal: 17 November 2026', 600),
  C('PROGRAM STUDI TEKNIK INFORMATIKA'),
  C('DEPOK'),
  C('2026'),
];

// ---------- BAB I ----------
const bab1 = [
  ...H1('BAB I', 'PENDAHULUAN'),
  H2('1.1\tLatar Belakang'),
  P('Pada pertemuan-pertemuan sebelumnya, keamanan aplikasi diperiksa dari sisi kode (SAST), aplikasi yang berjalan (DAST), dependensi (SCA dengan Snyk), dan container (Trivy dan Falco). Semua pemeriksaan itu berasumsi bahwa artefak yang diuji sama dengan artefak yang nanti berjalan di produksi, dan bahwa pipeline yang membangunnya dapat dipercaya. Asumsi ini tidak selalu benar. Serangan SolarWinds (2020) menyisipkan backdoor di sistem build, serangan pada `tj-actions/changed-files` (Maret 2025, CVE-2025-30066) membocorkan secret CI ribuan repository ke log, dan pada Maret 2026 tag `aquasecurity/trivy-action` dibajak untuk mencuri secret CI (CVE-2026-33634), kasus yang sudah dibahas pada laporan Praktikum 9.'),
  P('Karena itu fokus pertemuan 10 bergeser ke **software supply chain**: apa saja isi sebuah artefak, bagaimana artefak itu dibangun, bagaimana pipeline mengakses cloud tanpa menyimpan kunci jangka panjang, dan bagaimana pemindaian ditempatkan di alur kerja tim tanpa menghambat pengembangan.'),
  H2('1.2\tRumusan Masalah'),
  num('Apa yang dimaksud dengan SBOM dan SLSA Framework, dan bagaimana keduanya saling melengkapi dalam menjaga keamanan supply chain software?', 'rm'),
  num('Bagaimana perbandingan autentikasi pipeline CI/CD ke cloud provider menggunakan static credentials (GitHub Secrets) dan OIDC?', 'rm'),
  num('Bagaimana strategi scan Trivy yang berbeda untuk branch pull request dan branch main/production, mengapa berbeda, dan apa dampaknya terhadap workflow tim?', 'rm'),
  H2('1.3\tRuang Lingkup'),
  P('Pembahasan memakai GitHub Actions sebagai platform CI/CD dan AWS sebagai contoh cloud provider, karena keduanya paling banyak dipakai dan dokumentasinya paling lengkap. Prinsip yang sama berlaku untuk Azure (federated credential) dan Google Cloud (Workload Identity Federation). Contoh konfigurasi diambil dari dokumentasi resmi dan disesuaikan dengan praktik yang sudah diterapkan pada Praktikum 7 (SBOM CycloneDX dari Snyk) dan Praktikum 9 (Trivy di GitHub Actions dengan action di-pin ke commit SHA).'),
];

// ---------- BAB II : Soal 1 ----------
const bab2 = [
  ...H1('BAB II', 'SBOM DAN SLSA FRAMEWORK'),
  P('**Pertanyaan 1.** Apa yang dimaksud dengan SBOM (Software Bill of Materials) dan SLSA Framework? Jelaskan keduanya dan bagaimana keduanya saling melengkapi dalam menjaga keamanan supply chain software.', { indent: {} }),

  H2('2.1\tSoftware Bill of Materials (SBOM)'),
  P('**SBOM** adalah daftar formal dan dapat dibaca mesin yang mencatat seluruh komponen penyusun sebuah perangkat lunak, baik library yang dideklarasikan langsung maupun dependensi transitifnya, beserta versi, pemasok, lisensi, identitas unik, dan hubungan antarkomponen. Analogi yang sering dipakai adalah daftar komposisi pada kemasan makanan: konsumen tidak perlu membongkar produk untuk tahu bahan apa saja yang ada di dalamnya. Dorongan terbesar penggunaan SBOM datang dari Executive Order 14028 Amerika Serikat (Mei 2021), yang kemudian dirinci oleh NTIA menjadi **elemen minimum SBOM**: nama pemasok, nama komponen, versi, identitas unik lain (misalnya purl atau CPE), hubungan dependensi, penulis data SBOM, dan timestamp. Di Eropa, Cyber Resilience Act juga mewajibkan produsen perangkat lunak menyusun SBOM sebagai bagian dari dokumentasi teknis produknya.'),
  P('Dua format SBOM yang menjadi standar adalah **SPDX** dari Linux Foundation (standar ISO/IEC 5962:2021) yang awalnya berfokus pada lisensi, dan **CycloneDX** dari OWASP (standar ECMA-424) yang berfokus pada keamanan dan mendukung VEX, layanan, serta komponen container. SBOM dapat dihasilkan otomatis oleh tool seperti Snyk (`snyk sbom`), Trivy (`trivy image --format cyclonedx`), atau Syft. Pada Praktikum 7, SBOM CycloneDX 1.4 yang dihasilkan Snyk untuk OWASP Juice Shop mencatat **625 komponen**, padahal `package.json` hanya mendeklarasikan sekitar seratus dependensi langsung. Selisih inilah yang membuat SBOM penting: sebagian besar kode yang berjalan tidak pernah dipilih secara sadar oleh tim.'),
  P('Nilai SBOM paling terasa saat kerentanan besar diumumkan. Ketika Log4Shell (CVE-2021-44228) muncul, organisasi yang sudah memiliki SBOM untuk tiap aplikasinya cukup mencari `log4j-core` di repositori SBOM untuk mengetahui sistem mana yang terdampak, sementara organisasi lain harus memeriksa server satu per satu. Pada Praktikum 7, pertanyaan "apakah ada log4j?" bisa dijawab dalam hitungan detik hanya dengan membaca `sbom.json`. SBOM juga dapat dipindai ulang kapan saja tanpa artefak aslinya (`trivy sbom sbom.cdx.json`), sehingga CVE yang ditemukan bulan depan tetap bisa dipetakan ke rilis yang sudah lama dikirim.'),
  P('Namun SBOM memiliki batas yang perlu dipahami. SBOM hanya **pernyataan** tentang isi artefak; ia tidak membuktikan bahwa artefak benar-benar dibangun dari source code yang disebutkan, dan tidak mendeteksi kode berbahaya yang disisipkan saat proses build. SBOM yang dibuat dari `package.json` bisa berbeda dengan isi image akhir, dan SBOM yang tidak ditandatangani dapat diubah tanpa jejak. Selain itu, daftar CVE dari SBOM sering berisi kerentanan yang sebenarnya tidak dapat dieksploitasi pada produk tersebut, sehingga perlu dilengkapi dokumen **VEX** (Vulnerability Exploitability eXchange) yang menyatakan status tiap CVE: _affected_, _not affected_, _fixed_, atau _under investigation_.'),

  H2('2.2\tSLSA Framework'),
  P('**SLSA** (Supply-chain Levels for Software Artifacts, dibaca "salsa") adalah kerangka kerja keamanan dari Open Source Security Foundation (OpenSSF) yang awalnya dikembangkan dari praktik internal Google. Jika SBOM menjawab pertanyaan "apa isinya", SLSA menjawab "**bagaimana dan di mana artefak ini dibangun, dan apakah prosesnya dapat dipercaya**". SLSA berisi serangkaian persyaratan bertingkat untuk mencegah tampering, yaitu perubahan tidak sah pada source, proses build, atau artefak antara saat kode ditulis dan saat artefak dipakai. Bukti utamanya adalah **provenance**: metadata yang ditandatangani dan menyatakan artefak mana (diidentifikasi dengan digest SHA-256) dihasilkan oleh builder mana, dari repository dan commit mana, dengan parameter apa. Provenance SLSA ditulis dalam format attestation in-toto dengan predicate `https://slsa.dev/provenance/v1`.'),
  P('SLSA v1.0 (April 2023) mendefinisikan **Build Track** dengan empat level, dan spesifikasi berikutnya menambahkan track untuk sisi source. Tabel 2.1 merangkum level Build Track.'),
  caption('Tabel', 2, 'Level SLSA Build Track'),
  table(['Level', 'Persyaratan utama', 'Ancaman yang dicegah'], [
    ['Build L0', 'Tidak ada jaminan', '-'],
    ['Build L1', 'Proses build konsisten dan menghasilkan provenance (boleh belum ditandatangani)', 'Kesalahan rilis manual; memudahkan debugging dan inventaris'],
    ['Build L2', 'Build berjalan di platform build hosted dan provenance ditandatangani oleh platform tersebut', 'Pemalsuan provenance dan tampering artefak setelah build'],
    ['Build L3', 'Platform build hardened: tiap build terisolasi dan kunci penandatanganan tidak dapat diakses langkah build milik pengguna', 'Tampering saat build, termasuk oleh orang dalam atau kredensial yang dicuri'],
  ], [1.3, 4, 3.2]),
  spacer(),
  P('SLSA juga memetakan ancaman supply chain menjadi beberapa titik serangan: source yang diubah tanpa review, build dari source yang tidak sesuai repository resmi, platform build yang disusupi, dependensi berbahaya, serta artefak yang diganti setelah build. Kasus SolarWinds adalah contoh serangan pada platform build, sedangkan backdoor `xz-utils` (CVE-2024-3094) adalah contoh tarball rilis yang isinya berbeda dari repository Git. Kedua kasus ini dapat dikenali bila konsumen memverifikasi provenance dan menolak artefak yang tidak dibangun oleh builder tepercaya dari commit yang sah.'),
  P('Implementasi SLSA di GitHub Actions kini relatif mudah. Action resmi `actions/attest-build-provenance` membuat dan menandatangani provenance memakai Sigstore, dan menurut dokumentasi GitHub hasilnya memenuhi SLSA v1.0 Build L2; dengan reusable workflow yang terisolasi, level dapat dinaikkan ke Build L3. Proyek `slsa-framework/slsa-github-generator` juga menyediakan builder L3. Di sisi konsumen, provenance diverifikasi dengan `gh attestation verify` atau `slsa-verifier` sebelum artefak di-deploy, atau ditegakkan otomatis di cluster Kubernetes dengan admission controller seperti Sigstore policy-controller atau Kyverno.'),

  H2('2.3\tBagaimana Keduanya Saling Melengkapi'),
  P('SBOM dan SLSA menjawab dua pertanyaan berbeda yang sama-sama dibutuhkan untuk mempercayai sebuah artefak. SBOM menjelaskan **apa** yang ada di dalam artefak, sehingga tim bisa menilai risiko dari komponen pihak ketiga. SLSA menjelaskan **dari mana dan bagaimana** artefak itu dibuat, sehingga tim yakin artefak tidak diubah di tengah jalan. Tanpa SLSA, SBOM bisa akurat tetapi menggambarkan artefak yang berbeda dari yang benar-benar berjalan, atau SBOM itu sendiri dipalsukan. Tanpa SBOM, provenance SLSA membuktikan bahwa build berjalan dengan benar tetapi tidak memberi tahu apakah build itu memasukkan library rentan seperti log4j versi lama.'),
  caption('Tabel', 2, 'Perbandingan peran SBOM dan SLSA'),
  table(['Aspek', 'SBOM', 'SLSA (provenance)'], [
    ['Pertanyaan utama', 'Komponen apa saja yang ada di artefak?', 'Dari source dan builder mana artefak berasal, dan apakah prosesnya tidak diubah?'],
    ['Bentuk', 'Dokumen SPDX atau CycloneDX', 'Attestation in-toto bertanda tangan, terikat ke digest artefak'],
    ['Ancaman yang ditangani', 'Dependensi rentan, lisensi bermasalah, komponen tidak dikenal', 'Build disusupi, source tidak sah, artefak ditukar'],
    ['Kapan paling berguna', 'Saat CVE baru diumumkan (respons insiden, audit)', 'Saat artefak akan di-deploy (verifikasi asal)'],
    ['Contoh kasus', 'Log4Shell (2021)', 'SolarWinds (2020), xz-utils (2024)'],
  ], [2, 3.2, 3.6]),
  spacer(),
  P('Integrasi keduanya terjadi lewat attestation. SBOM yang dihasilkan di pipeline dapat diikat ke digest image dan ditandatangani oleh builder yang sama yang membuat provenance, misalnya dengan `actions/attest-sbom` atau `cosign attest --type cyclonedx`. Dengan begitu konsumen memperoleh SBOM yang terbukti berasal dari proses build tepercaya, bukan dokumen yang bisa diedit siapa saja. Alur lengkapnya digambarkan pada Gambar 2.1.'),
  code(`
 commit (review wajib) ──► build di GitHub Actions (platform hosted, terisolasi)
                                 │
                 ┌───────────────┼──────────────────┐
                 ▼               ▼                  ▼
          image @sha256:…   SBOM CycloneDX     provenance SLSA
                 │               │  (attest-sbom)   │ (attest-build-provenance)
                 └──────── ditandatangani Sigstore, disimpan di registry ───┘
                                 │
                 deploy hanya jika: provenance valid (repo + workflow benar)
                                 + SBOM tidak berisi CVE Critical yang bisa diperbaiki`, 16),
  caption('Gambar', 2, 'Alur SBOM dan provenance SLSA dalam satu pipeline'),
  P('Dalam praktiknya, keduanya membentuk lapisan pertahanan yang berurutan. SLSA memastikan "barang yang datang adalah barang yang dikirim dari pabrik yang benar", sedangkan SBOM memastikan "bahan baku barang itu diketahui dan dipantau". Kombinasi ini juga memperpendek waktu respons insiden: saat CVE baru diumumkan, tim mencari komponen terdampak di SBOM, lalu memakai provenance untuk menelusuri commit dan workflow yang membangun artefak tersebut, sehingga perbaikan dan rebuild dapat dilakukan dengan cepat dan dapat diaudit.'),
];

// ---------- BAB III : Soal 2 ----------
const bab3 = [
  ...H1('BAB III', 'STATIC CREDENTIALS VS OIDC'),
  P('**Pertanyaan 2.** Bandingkan pendekatan Static Credentials (GitHub Secrets) vs OIDC (OpenID Connect) untuk autentikasi pipeline CI/CD ke cloud provider.', { indent: {} }),

  H2('3.1\tStatic Credentials (GitHub Secrets)'),
  P('Pada pendekatan **static credentials**, administrator membuat identitas mesin di cloud, misalnya IAM user AWS, lalu menyalin access key ID dan secret access key-nya ke **GitHub Secrets** (tingkat repository, environment, atau organisasi). Saat workflow berjalan, secret disuntikkan sebagai variabel lingkungan dan dipakai CLI atau SDK untuk memanggil API cloud. GitHub mengenkripsi secret saat disimpan, menyamarkan nilainya di log (`***`), dan tidak meneruskannya ke workflow yang dipicu pull request dari fork. Pendekatan ini sederhana, didukung semua cloud provider dan tool, sehingga banyak dipakai sebagai cara awal.'),
  code(`
- uses: aws-actions/configure-aws-credentials@<SHA-v4>
  with:
    aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: ap-southeast-3`),
  caption('Gambar', 3, 'Autentikasi ke AWS dengan static credentials'),
  P('Masalah utamanya adalah kredensial tersebut **berumur panjang**. Access key IAM user tidak kedaluwarsa sampai dirotasi manual, sehingga satu kebocoran memberi akses berbulan-bulan, dari mana saja, dan tidak terikat ke repository atau branch tertentu. Kebocoran juga tidak sulit terjadi: action pihak ketiga yang disusupi dapat membaca semua variabel lingkungan job, seperti pada kasus `tj-actions/changed-files` yang mencetak secret ke log publik dan kasus `trivy-action` yang mengirim secret CI ke server penyerang. Penyamaran `***` di log juga dapat diakali dengan mengenkode nilai (misalnya base64). Rotasi kunci menjadi pekerjaan manual yang sering ditunda, dan karena satu kunci biasa dipakai bersama oleh banyak workflow, jejak audit di CloudTrail hanya menunjukkan "IAM user ci-deploy", bukan workflow, commit, atau orang yang memicunya.'),

  H2('3.2\tOIDC (OpenID Connect)'),
  P('Dengan **OIDC**, pipeline tidak menyimpan kunci apa pun. GitHub bertindak sebagai identity provider (`https://token.actions.githubusercontent.com`). Ketika job membutuhkan akses cloud, runner meminta **JWT berumur pendek** yang ditandatangani GitHub. Token ini berisi klaim tentang konteks job, antara lain `iss` (penerbit), `aud` (audiens, untuk AWS `sts.amazonaws.com`), `sub` (misalnya `repo:org/app:ref:refs/heads/main`, `repo:org/app:environment:production`, atau `repo:org/app:pull_request`), serta `repository`, `ref`, `sha`, dan `job_workflow_ref`. Cloud provider memverifikasi tanda tangan token dengan kunci publik GitHub, mencocokkan klaim dengan **trust policy**, lalu menukarnya dengan kredensial sementara melalui `AssumeRoleWithWebIdentity` (AWS), federated credential (Azure), atau Workload Identity Federation (Google Cloud).'),
  code(`
permissions:
  id-token: write      # izin meminta token OIDC
  contents: read
jobs:
  deploy:
    environment: production
    steps:
      - uses: aws-actions/configure-aws-credentials@<SHA-v4>
        with:
          role-to-assume: arn:aws:iam::123456789012:role/gha-deploy-prod
          aws-region: ap-southeast-3      # kredensial sementara, default 1 jam`),
  caption('Gambar', 3, 'Workflow GitHub Actions dengan OIDC'),
  code(`
"Condition": {
  "StringEquals": {
    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
    "token.actions.githubusercontent.com:sub":
        "repo:FirmansyahDzakwanArifien/app:environment:production"
  }
}`),
  caption('Gambar', 3, 'Potongan trust policy IAM role yang membatasi repository dan environment'),
  P('Keunggulan OIDC bersifat struktural. Kredensial hanya berlaku selama beberapa menit sampai satu jam, sehingga kebocoran memiliki jendela yang sempit. Akses dapat dibatasi sangat spesifik melalui klaim `sub`: misalnya hanya job di environment `production` (yang sudah dilindungi required reviewer) yang boleh mengambil role deploy, sedangkan job pull request hanya mendapat role read-only atau tidak mendapat akses sama sekali. Tidak ada lagi rotasi manual karena tidak ada kunci yang disimpan. Jejak audit juga lebih jelas, karena nama sesi dan klaim token tercatat di CloudTrail sehingga setiap aksi di cloud dapat dikaitkan dengan repository, workflow, dan commit tertentu.'),
  P('OIDC tetap memiliki risiko, dan sebagian besar berasal dari kesalahan konfigurasi. Trust policy yang hanya memeriksa `aud` tanpa `sub`, atau memakai wildcard terlalu lebar seperti `repo:*`, memungkinkan workflow di repository milik **siapa pun** di GitHub mengambil role tersebut, karena semua repository memakai penerbit token yang sama. Kesalahan jenis ini pernah ditemukan peneliti keamanan pada banyak akun AWS nyata. Selain itu, token OIDC berumur pendek tetap dapat disalahgunakan selama job berjalan bila ada action berbahaya di dalam job yang sama, sehingga OIDC tidak menggantikan kebutuhan pin action ke commit SHA dan pembatasan `permissions` seperti yang diterapkan pada Praktikum 9.'),

  H2('3.3\tPerbandingan'),
  caption('Tabel', 3, 'Perbandingan static credentials dan OIDC'),
  table(['Aspek', 'Static credentials (GitHub Secrets)', 'OIDC'], [
    ['Masa berlaku', 'Panjang, sampai dirotasi manual', 'Pendek (menit sampai 1 jam), per job'],
    ['Tempat penyimpanan', 'Disimpan di GitHub, ada salinan kunci rahasia', 'Tidak ada kunci yang disimpan'],
    ['Dampak bila bocor', 'Akses penuh role dari mana saja sampai kunci dicabut', 'Terbatas pada sisa umur token dan scope role'],
    ['Granularitas akses', 'Per secret; sulit membedakan branch atau environment', 'Per repository, branch, tag, environment, atau workflow lewat klaim `sub`'],
    ['Rotasi', 'Manual, sering terlupa', 'Otomatis, setiap job mendapat token baru'],
    ['Audit', 'Hanya identitas IAM user bersama', 'Klaim token (repo, ref, sha, workflow) dapat ditelusuri'],
    ['Setup awal', 'Sangat mudah', 'Perlu identity provider dan trust policy di cloud'],
    ['Risiko utama', 'Kebocoran secret (log, action disusupi, fork)', 'Trust policy terlalu longgar (wildcard `sub`)'],
    ['Dukungan', 'Semua layanan', 'AWS, Azure, GCP, HashiCorp Vault, dan sebagian besar SaaS modern'],
  ], [2, 3.5, 3.5]),
  spacer(),
  P('Kesimpulannya, OIDC adalah pilihan yang direkomendasikan untuk autentikasi pipeline ke cloud, sejalan dengan dokumentasi resmi GitHub, AWS, dan prinsip zero trust: identitas diverifikasi setiap kali, akses diberikan seminimal mungkin dan sesingkat mungkin. Static credentials hanya layak dipakai untuk layanan yang belum mendukung federasi identitas, dan dalam kasus itu sebaiknya disimpan sebagai **environment secret** dengan required reviewer, diberi izin minimum, dirotasi terjadwal, dan diawasi. Untuk migrasi, tim dapat membuat role OIDC baru dengan izin yang sama, mengganti langkah autentikasi di workflow, memastikan semua job berjalan, lalu menonaktifkan dan menghapus access key lama.'),
];

// ---------- BAB IV : Soal 3 ----------
const bab4 = [
  ...H1('BAB IV', 'STRATEGI SCAN TRIVY: PR VS MAIN'),
  P('**Pertanyaan 3.** Jelaskan strategi scan Trivy yang berbeda untuk branch PR (Pull Request) vs branch main/production. Mengapa strategi ini berbeda dan apa dampaknya terhadap workflow tim development?', { indent: {} }),

  H2('4.1\tStrategi pada Branch Pull Request'),
  P('Tujuan scan di pull request adalah **umpan balik cepat dan relevan bagi developer** sebelum kode masuk ke branch utama. Karena itu scan difokuskan pada perubahan yang dibawa PR dan hanya memblokir temuan yang benar-benar dapat ditindaklanjuti. Konfigurasi yang umum adalah `trivy fs` terhadap repository dengan scanner `vuln,secret,misconfig`, sehingga lockfile dependensi, secret yang tidak sengaja di-commit, dan file IaC (Dockerfile, manifest Kubernetes, Terraform) diperiksa sekaligus tanpa perlu membangun image. Gate diatur dengan `--severity CRITICAL,HIGH --ignore-unfixed --exit-code 1`: PR gagal hanya bila ada temuan berat yang sudah memiliki versi perbaikan, karena developer memang bisa memperbaikinya dengan menaikkan versi. Database Trivy di-cache agar job selesai dalam hitungan detik sampai satu atau dua menit.'),
  P('Pengecualian yang disengaja dicatat di file `.trivyignore` lengkap dengan alasan dan tanggal kedaluwarsa (`CVE-xxxx exp:2026-12-31`), sehingga keputusan "terima risiko" melewati code review yang sama dengan perubahan kode dan otomatis ditinjau ulang. Hasil scan ditampilkan sebagai tabel di log atau job summary. Bila SARIF di-upload ke GitHub Code Scanning, GitHub hanya menandai alert yang **baru diperkenalkan oleh PR** tersebut, sehingga developer tidak dibebani temuan lama yang bukan tanggung jawabnya. Satu hal yang perlu diperhatikan adalah keamanan pipeline itu sendiri: PR dari fork adalah kode yang belum dipercaya, sehingga job scan PR harus berjalan dengan `GITHUB_TOKEN` read-only, tanpa secret dan tanpa akses OIDC ke cloud, dan tidak memakai trigger `pull_request_target` yang menjalankan kode PR dengan hak akses penuh.'),

  H2('4.2\tStrategi pada Branch Main/Production'),
  P('Tujuan scan di branch main adalah **jaminan menyeluruh atas artefak yang akan dirilis**. Yang dipindai bukan lagi source code, melainkan image final yang benar-benar akan di-deploy (`trivy image` terhadap digest hasil build), karena image membawa paket OS base image dan file hasil build yang tidak terlihat di repository. Semua severity dilaporkan ke tab Security dalam format SARIF agar ada riwayat dan tren, sementara gate deploy tetap memblokir Critical/High yang bisa diperbaiki. Pada tahap ini Trivy juga menghasilkan SBOM (`--format cyclonedx`) yang kemudian ditandatangani dan diikat ke image bersama provenance SLSA, sehingga lingkaran dengan pembahasan Bab II tertutup. Pemeriksaan lisensi (`--scanners license`) juga relevan karena artefak akan didistribusikan.'),
  P('Perbedaan terpenting adalah **scan terjadwal**. Kode di main tidak berubah, tetapi database kerentanan berubah setiap hari. Pada Praktikum 9 terbukti bahwa versi dependensi yang dinyatakan aman oleh panduan (django 4.2.8, requests 2.31.0, pillow 10.1.0) kini membawa 52 temuan Critical/High. Karena itu main dan image yang sedang berjalan di produksi dipindai ulang setiap hari (`schedule: cron`), atau dipantau terus-menerus di cluster dengan Trivy Operator. Temuan baru dari scan terjadwal tidak memblokir siapa pun, melainkan membuat issue atau notifikasi ke pemilik layanan dengan tenggat perbaikan sesuai severity.'),
  caption('Tabel', 4, 'Perbandingan strategi scan Trivy pada PR dan main'),
  table(['Aspek', 'Branch PR', 'Branch main / production'], [
    ['Tujuan', 'Umpan balik cepat untuk developer', 'Jaminan artefak rilis dan pemantauan berkelanjutan'],
    ['Target', '`trivy fs` / `trivy config` pada repository', '`trivy image` pada digest image final, ditambah SBOM'],
    ['Scanner', 'vuln, secret, misconfig', 'vuln, secret, misconfig, license'],
    ['Severity', 'CRITICAL, HIGH, `--ignore-unfixed`', 'Semua severity dilaporkan; gate Critical/High'],
    ['Sifat gate', 'Blokir merge (required status check)', 'Blokir deploy; scan terjadwal hanya membuat issue'],
    ['Output', 'Tabel / job summary, alert baru di PR', 'SARIF ke Security tab, SBOM dan attestation'],
    ['Pemicu', '`pull_request`', '`push` ke main, `schedule`, rilis/tag'],
    ['Hak akses job', 'Read-only, tanpa secret dan OIDC', '`security-events: write`, OIDC ke registry/cloud'],
    ['Durasi target', 'Detik sampai 1-2 menit', 'Boleh lebih lama (build + scan menyeluruh)'],
  ], [1.8, 3.4, 3.6]),
  spacer(),
  code(`
on:
  pull_request:
  push:      { branches: [main] }
  schedule:  [{ cron: '0 0 * * *' }]
jobs:
  pr-scan:
    if: github.event_name == 'pull_request'
    permissions: { contents: read }
    steps:
      - uses: aquasecurity/trivy-action@<SHA-v0.36.0>
        with: { scan-type: fs, scanners: 'vuln,secret,misconfig',
                severity: 'CRITICAL,HIGH', ignore-unfixed: true, exit-code: '1' }
  main-scan:
    if: github.event_name != 'pull_request'
    permissions: { contents: read, security-events: write, id-token: write }
    steps:
      - # build image, lalu scan image final (semua severity -> SARIF)
      - # trivy image --format cyclonedx -> SBOM, attest SBOM + provenance
      - # gate: CRITICAL,HIGH + ignore-unfixed + exit-code 1 sebelum deploy`, 16),
  caption('Gambar', 4, 'Kerangka satu workflow dengan dua strategi scan'),

  H2('4.3\tMengapa Strateginya Berbeda'),
  P('Perbedaan ini muncul karena kedua branch memiliki **tujuan, pihak yang dilayani, dan tingkat kepercayaan** yang berbeda. Di PR, pengguna hasil scan adalah developer yang sedang bekerja; scan yang lambat atau penuh temuan yang tidak bisa ia perbaiki akan diabaikan atau diakali, sehingga yang dibutuhkan adalah sinyal yang cepat, sempit, dan dapat ditindaklanjuti. Di main, pengguna hasil scan adalah tim keamanan, operasional, dan auditor yang membutuhkan gambaran lengkap atas apa yang benar-benar berjalan di produksi. Objek yang dipindai pun berbeda: PR berisi perubahan source code, sedangkan produksi menjalankan image yang memuat base image dan paket OS di luar repository.'),
  P('Alasan kedua adalah **waktu**. Hasil scan PR mencerminkan kondisi saat PR dibuat, sedangkan risiko artefak di main terus berubah karena CVE baru ditemukan setiap hari. Alasan ketiga adalah **kepercayaan terhadap kode**. Kode PR, terutama dari fork, belum direview sehingga job-nya tidak boleh memegang secret atau token OIDC, sedangkan job di main dijalankan dari kode yang sudah disetujui dan boleh mengakses registry, Security tab, dan cloud. Dengan memisahkan keduanya, strategi scan sekaligus menerapkan prinsip least privilege yang dibahas pada Bab III.'),

  H2('4.4\tDampak terhadap Workflow Tim Development'),
  bullet('**Shift left yang tidak menghambat.** Developer mendapat umpan balik dalam hitungan menit di PR, saat konteks perubahan masih segar dan biaya perbaikan paling murah, tanpa harus menunggu scan image yang lama.'),
  bullet('**Lebih sedikit alert fatigue.** Dengan `--ignore-unfixed` dan fokus pada temuan baru, PR tidak diblokir oleh CVE lama atau CVE yang belum ada patch-nya. Developer tidak terdorong menonaktifkan scan atau menambahkan pengecualian sembarangan.'),
  bullet('**Kepemilikan yang jelas.** Temuan di PR adalah tanggung jawab penulis PR. Temuan dari scan terjadwal di main dikelola sebagai backlog keamanan dengan SLA (misalnya Critical 7 hari, High 30 hari) dan pemilik layanan yang jelas, bukan membebani PR yang tidak terkait.'),
  bullet('**Main tetap dapat dirilis.** Karena CVE baru dari scan terjadwal tidak otomatis memecahkan build PR orang lain, tim tidak tiba-tiba terblokir di pagi hari karena database Trivy diperbarui semalam. Dependabot atau Renovate membantu dengan membuka PR update otomatis yang juga melewati scan PR.'),
  bullet('**Proses pengecualian yang dapat diaudit.** `.trivyignore` dengan tanggal kedaluwarsa dan alasan masuk ke code review, sehingga keputusan menerima risiko terdokumentasi dan ditinjau ulang secara otomatis.'),
  bullet('**Ada biaya yang perlu dikelola.** Tim perlu memelihara dua konfigurasi, memastikan versi Trivy di CI dan lokal sama (pada Praktikum 9 versi dikunci ke v0.76.2 agar hasil tidak berbeda), dan menyediakan waktu rutin untuk triase backlog dari scan main.'),
  P('Secara keseluruhan, strategi berlapis ini membuat keamanan menjadi bagian alami dari alur kerja: PR berfungsi sebagai pagar agar risiko baru tidak masuk, sementara scan main dan scan terjadwal berfungsi sebagai pengawasan berkelanjutan terhadap risiko yang muncul belakangan. Pengalaman Praktikum 9 menunjukkan pola ini bekerja: PR #2 yang menambahkan `pillow==12.3.0` langsung diblokir gate Trivy dengan 28 kerentanan, lalu lolos setelah versi dinaikkan ke 13.0.0, tanpa mengganggu branch main.'),
];

// ---------- BAB V ----------
const bab5 = [
  ...H1('BAB V', 'KESIMPULAN'),
  num('**SBOM dan SLSA saling melengkapi.** SBOM mencatat apa isi artefak sehingga risiko komponen pihak ketiga dapat dipetakan dengan cepat, sedangkan SLSA melalui provenance bertanda tangan membuktikan dari mana dan bagaimana artefak dibangun. SBOM yang di-attest oleh builder tepercaya memberi jaminan isi dan asal sekaligus.', 'kes'),
  num('**OIDC lebih aman daripada static credentials.** OIDC menghilangkan kunci berumur panjang, membatasi akses per repository, branch, atau environment, dan memperjelas audit. Risiko utamanya ada pada trust policy yang terlalu longgar, sehingga klaim `sub` harus selalu dibatasi. Static credentials hanya dipakai untuk layanan yang belum mendukung federasi, dengan izin minimum dan rotasi terjadwal.', 'kes'),
  num('**Scan Trivy perlu dibedakan antara PR dan main.** PR membutuhkan scan cepat dan terfokus pada temuan yang dapat diperbaiki dengan hak akses minimal, sedangkan main membutuhkan scan menyeluruh atas image final, SBOM, dan scan terjadwal karena database kerentanan terus berubah. Pemisahan ini menjaga produktivitas developer sekaligus memberi visibilitas penuh bagi tim keamanan.', 'kes'),
  P('Ketiga topik ini membentuk satu rantai: pipeline yang mengautentikasi diri tanpa secret statis, memindai perubahan dan artefak pada tahap yang tepat, lalu menghasilkan SBOM dan provenance yang dapat diverifikasi sebelum deploy.', { indent: {} }),
];

// ---------- pustaka ----------
const pustaka = [
  H1s('DAFTAR PUSTAKA'),
  ...[
    '[1] NTIA. (2021). The Minimum Elements For a Software Bill of Materials (SBOM). https://www.ntia.gov/report/2021/minimum-elements-software-bill-materials-sbom',
    '[2] OWASP Foundation. CycloneDX Specification (ECMA-424). https://cyclonedx.org/specification/overview/',
    '[3] The Linux Foundation. SPDX Specification (ISO/IEC 5962:2021). https://spdx.dev/',
    '[4] OpenSSF. SLSA Specification v1.0: Security levels dan Build provenance. https://slsa.dev/spec/v1.0/',
    '[5] GitHub. Using artifact attestations to establish provenance for builds. https://docs.github.com/actions/security-for-github-actions/using-artifact-attestations',
    '[6] GitHub. About security hardening with OpenID Connect. https://docs.github.com/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect',
    '[7] AWS. Configuring OpenID Connect in Amazon Web Services; IAM roles for OIDC federation. https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html',
    '[8] Aqua Security. Trivy Documentation: Configuration, Filtering, dan SBOM. https://trivy.dev/docs/',
    '[9] Aqua Security. (2026). Trivy supply chain attack: what you need to know. https://www.aquasec.com/blog/trivy-supply-chain-attack-what-you-need-to-know/',
    '[10] CISA. (2025). Supply chain compromise of third-party GitHub Action tj-actions/changed-files (CVE-2025-30066). https://www.cisa.gov/news-events/alerts',
    '[11] GitHub. Security hardening for GitHub Actions. https://docs.github.com/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions',
  ].map(t => new Paragraph({ alignment: AlignmentType.LEFT, indent: { left: 500, hanging: 500 }, spacing: { after: 140, line: 300 }, children: [new TextRun({ text: t, size: 22 })] })),
];

// ---------- document ----------
const decimal = r => ({ reference: r, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 567, hanging: 340 } } } }] });
const doc = new Document({
  creator: 'Firmansyah Dzakwan Arifien', lastModifiedBy: 'Firmansyah Dzakwan Arifien',
  title: 'Tugas Pertemuan 10 Software Supply Chain Security', description: 'Tugas DevSecOps Pertemuan 10',
  styles: {
    default: { document: { run: { font: FONT, size: BASE } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: FONT, color: '000000' },
        paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 0, after: 300, line: 360 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: FONT, color: '000000' },
        paragraph: { spacing: { before: 280, after: 120, line: 360 }, tabStops: [{ type: 'left', position: 709 }], outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: FONT, color: '000000' },
        paragraph: { spacing: { before: 200, after: 80, line: 360 }, outlineLevel: 2 } },
    ],
  },
  numbering: { config: [
    { reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 567, hanging: 283 } } } }] },
    decimal('rm'), decimal('kes'),
  ] },
  sections: [
    { properties: { page: { margin: { top: 1699, right: 1699, bottom: 1699, left: 2261 } } }, children: cover },
    { properties: { page: { margin: { top: 1699, right: 1699, bottom: 1699, left: 2261 }, pageNumbers: { start: 1 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT], size: 22 })] })] }) },
      children: [...bab1, ...bab2, ...bab3, ...bab4, ...bab5, ...pustaka] },
  ],
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync(OUT, b); console.log('wrote', OUT); });
