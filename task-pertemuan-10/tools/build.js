const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, HeadingLevel, Footer, PageNumber,
} = require('docx');

const FONT = 'Cambria';
const MONO = 'Consolas';
const BASE = 24;          // 12 pt
const LINE = 360;         // 1,5
const OUT = process.argv[2] || 'jawaban.docx';

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
const P = text => new Paragraph({
  children: runs(text), alignment: AlignmentType.JUSTIFIED,
  spacing: { after: 120, line: LINE }, indent: { firstLine: 567 },
});
const H1 = (t, brk = true) => new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: brk, children: [new TextRun(t)] });
const Q = (n, text, brk = false) => new Paragraph({
  pageBreakBefore: brk, keepNext: true, alignment: AlignmentType.JUSTIFIED,
  spacing: { before: 120, after: 160, line: LINE }, indent: { left: 397, hanging: 397 },
  children: runs(`${n}.\t${text}`, { bold: true }),
});

// ---------- cover ----------
const C = (t, o = {}) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: o.after ?? 0, line: 360 },
  children: [new TextRun({ text: t, size: o.size || 24, bold: o.bold !== false })] });
const small = (t, after = 0) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after, line: 300 }, children: [new TextRun({ text: t, size: 22 })] });
const cover = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 500 }, children: [new ImageRun({ type: 'jpg', data: fs.readFileSync('tpl/logo.jpg'), transformation: { width: 170, height: 170 }, altText: { title: 'logo', description: 'Logo STT Terpadu Nurul Fikri', name: 'logo' } })] }),
  C('SEKOLAH TINGGI TEKNOLOGI TERPADU NURUL FIKRI', { size: 28, after: 600 }),
  C('TUGAS PERTEMUAN 10', { size: 28 }),
  C('JAWABAN PERTANYAAN', { size: 28 }),
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

// ---------- jawaban ----------
const jawaban = [
  H1('JAWABAN PERTANYAAN', true),

  Q(1, 'Apa yang dimaksud dengan SBOM (Software Bill of Materials) dan SLSA Framework? Jelaskan keduanya dan bagaimana keduanya saling melengkapi dalam menjaga keamanan supply chain software.'),
  P('**SBOM (Software Bill of Materials)** adalah daftar formal yang dapat dibaca mesin dan mencatat seluruh komponen penyusun sebuah perangkat lunak, baik library yang dipakai langsung maupun dependensi transitifnya, lengkap dengan nama, versi, pemasok, lisensi, identitas unik (misalnya purl atau CPE), dan hubungan antarkomponen. Cara paling mudah memahaminya adalah membayangkan daftar komposisi pada kemasan makanan: kita tahu bahan apa saja yang ada di dalamnya tanpa harus membongkar produknya. Penggunaan SBOM didorong oleh Executive Order 14028 Amerika Serikat (2021) yang kemudian dirinci NTIA menjadi elemen minimum SBOM, dan di Eropa diwajibkan oleh Cyber Resilience Act. Dua format standar yang paling umum adalah **SPDX** (ISO/IEC 5962:2021) dan **CycloneDX** dari OWASP (ECMA-424). SBOM bisa dibuat otomatis oleh tool seperti Snyk, Trivy, atau Syft.'),
  P('Manfaat SBOM paling terasa saat kerentanan besar diumumkan. Ketika Log4Shell (CVE-2021-44228) muncul, organisasi yang punya SBOM cukup mencari `log4j-core` untuk mengetahui aplikasi mana yang terdampak, sedangkan organisasi lain harus memeriksa server satu per satu. Pentingnya SBOM juga terlihat dari besarnya jumlah komponen yang tidak dipilih secara sadar oleh developer; pada tugas SCA sebelumnya, Juice Shop yang hanya mendeklarasikan sekitar seratus dependensi ternyata berisi 625 komponen menurut SBOM-nya. Meski begitu, SBOM hanyalah **pernyataan** tentang isi artefak. SBOM tidak membuktikan bahwa artefak benar-benar dibangun dari source code yang sah, dan SBOM yang tidak ditandatangani bisa diubah tanpa jejak.'),
  P('**SLSA (Supply-chain Levels for Software Artifacts)** adalah kerangka kerja keamanan dari OpenSSF yang berfokus pada integritas proses pembuatan software, yaitu mencegah perubahan tidak sah pada source code, proses build, maupun artefak sebelum sampai ke pengguna. Jika SBOM menjawab "apa isinya", SLSA menjawab "dari mana dan bagaimana artefak ini dibuat, dan apakah prosesnya bisa dipercaya". Bukti utamanya adalah **provenance**, yaitu metadata bertanda tangan yang menyatakan artefak mana (berdasarkan digest SHA-256) dihasilkan oleh builder apa, dari repository dan commit mana, dan dengan parameter apa.'),
  P('SLSA v1.0 menyusun persyaratannya secara bertingkat. Pada **Build L1**, proses build sudah konsisten dan menghasilkan provenance. Pada **Build L2**, build dijalankan di platform build hosted (misalnya GitHub Actions) dan provenance ditandatangani oleh platform tersebut, sehingga tidak bisa dipalsukan. Pada **Build L3**, platform build sudah di-hardening: setiap build terisolasi dan kunci penandatanganan tidak bisa diakses oleh langkah build milik pengguna, sehingga tampering saat build menjadi sangat sulit. Di GitHub, provenance dapat dibuat dengan action `actions/attest-build-provenance` dan diverifikasi sebelum deploy dengan `gh attestation verify` atau `slsa-verifier`. Kasus seperti SolarWinds (sistem build disusupi) dan backdoor xz-utils (isi tarball rilis berbeda dari repository) adalah jenis serangan yang ingin dicegah oleh SLSA.'),
  P('Keduanya saling melengkapi karena menjawab dua pertanyaan berbeda yang sama-sama dibutuhkan untuk mempercayai sebuah artefak. SBOM memberi visibilitas atas **isi** artefak, sehingga risiko dari library pihak ketiga, misalnya dependensi rentan atau lisensi bermasalah, dapat diketahui dan dipantau. SLSA memberi jaminan atas **asal-usul** artefak, sehingga tim yakin artefak yang akan dijalankan memang hasil build resmi dan tidak diubah di tengah jalan. Tanpa SLSA, SBOM bisa saja akurat tetapi menggambarkan artefak yang berbeda dari yang sebenarnya berjalan, atau SBOM itu sendiri dipalsukan. Sebaliknya, tanpa SBOM, provenance hanya membuktikan bahwa proses build berjalan benar, tanpa memberi tahu apakah build itu ikut memasukkan library yang rentan.'),
  P('Dalam praktik, keduanya digabungkan dalam satu pipeline: SBOM dihasilkan saat build, lalu SBOM dan provenance sama-sama ditandatangani dan diikat ke digest image yang sama (misalnya dengan `actions/attest-sbom` dan Sigstore). Saat deploy, sistem hanya menerima artefak yang provenance-nya valid dan SBOM-nya tidak mengandung kerentanan kritis. Saat CVE baru diumumkan, tim mencari komponen terdampak melalui SBOM, lalu memakai provenance untuk menelusuri commit dan workflow yang membangun artefak tersebut. Dengan begitu, SLSA memastikan "barangnya asli dari pabrik yang benar", sedangkan SBOM memastikan "bahan bakunya diketahui", dan keduanya bersama-sama membentuk dasar kepercayaan terhadap software supply chain.'),

  Q(2, 'Bandingkan pendekatan Static Credentials (GitHub Secrets) vs OIDC (OpenID Connect) untuk autentikasi pipeline CI/CD ke cloud provider?'),
  P('Pada pendekatan **static credentials**, administrator membuat identitas mesin di cloud, misalnya IAM user di AWS, lalu menyimpan access key ID dan secret access key-nya di **GitHub Secrets**. Saat workflow berjalan, secret tersebut disuntikkan sebagai variabel lingkungan dan dipakai CLI atau SDK untuk mengakses cloud. GitHub mengenkripsi secret, menyamarkannya di log menjadi `***`, dan tidak meneruskannya ke pull request dari fork. Cara ini sangat mudah diterapkan dan didukung oleh hampir semua layanan, sehingga sering menjadi pilihan awal.'),
  P('Kelemahan utama static credentials adalah sifatnya yang **berumur panjang**. Access key tidak kedaluwarsa sampai dirotasi secara manual, sehingga jika bocor, penyerang bisa memakainya dari mana saja dalam waktu lama. Kebocoran juga cukup mudah terjadi, misalnya melalui action pihak ketiga yang disusupi. Pada kasus `tj-actions/changed-files` (2025) secret ribuan repository tercetak di log, dan pada kasus pembajakan tag `trivy-action` (2026) secret CI dikirim ke server penyerang. Selain itu, rotasi kunci sering terlupa, satu kunci biasanya dipakai bersama oleh banyak workflow, dan log audit di cloud hanya menunjukkan nama IAM user, bukan workflow atau commit yang memakainya.'),
  P('Pada pendekatan **OIDC**, pipeline tidak menyimpan kunci apa pun. GitHub berperan sebagai identity provider. Saat job membutuhkan akses cloud (dengan izin `id-token: write`), GitHub menerbitkan token JWT berumur pendek yang berisi klaim tentang job tersebut, seperti repository, branch, environment, dan workflow, misalnya `sub: repo:org/app:environment:production`. Cloud provider memverifikasi tanda tangan token, mencocokkan klaimnya dengan **trust policy** pada role, lalu memberikan kredensial sementara yang biasanya berlaku sekitar satu jam. Di AWS mekanisme ini memakai `AssumeRoleWithWebIdentity`, di Azure memakai federated credential, dan di Google Cloud memakai Workload Identity Federation.'),
  P('Keunggulan OIDC terlihat pada hampir semua aspek. Dari sisi **masa berlaku**, kredensial hanya hidup selama job berjalan, sehingga dampak kebocoran sangat terbatas. Dari sisi **granularitas**, akses bisa dibatasi sangat spesifik, misalnya hanya job di environment `production` yang boleh deploy, sedangkan job pull request tidak mendapat akses sama sekali. Dari sisi **operasional**, tidak ada lagi rotasi kunci manual karena tidak ada kunci yang disimpan. Dari sisi **audit**, setiap aksi di cloud dapat ditelusuri sampai ke repository, workflow, dan commit yang memicunya. Kekurangannya, setup awal OIDC sedikit lebih rumit karena perlu mendaftarkan identity provider dan menulis trust policy, dan tidak semua layanan pihak ketiga mendukungnya.'),
  P('OIDC juga bukan tanpa risiko. Risiko terbesarnya justru berasal dari salah konfigurasi: trust policy yang tidak membatasi klaim `sub`, atau memakai wildcard terlalu luas seperti `repo:*`, bisa membuat workflow dari repository milik orang lain ikut bisa mengambil role tersebut, karena semua repository GitHub memakai penerbit token yang sama. Token berumur pendek juga tetap bisa disalahgunakan selama job berjalan jika ada action berbahaya di dalam job yang sama. Karena itu OIDC tetap harus dikombinasikan dengan praktik lain, seperti mem-pin action ke commit SHA dan membatasi `permissions` workflow seminimal mungkin.'),
  P('Kesimpulannya, OIDC adalah pendekatan yang direkomendasikan untuk autentikasi pipeline ke cloud karena sejalan dengan prinsip zero trust dan least privilege: identitas diverifikasi setiap kali, dan akses diberikan seminimal serta sesingkat mungkin. Static credentials sebaiknya hanya dipakai untuk layanan yang belum mendukung federasi identitas. Jika terpaksa dipakai, secret sebaiknya disimpan sebagai environment secret dengan persetujuan reviewer, diberi izin minimum, dan dirotasi secara terjadwal.'),

  Q(3, 'Jelaskan strategi scan Trivy yang berbeda untuk branch PR (Pull Request) vs branch main/production. Mengapa strategi ini berbeda dan apa dampaknya terhadap workflow tim development?'),
  P('Pada **branch pull request**, tujuan scan adalah memberi umpan balik yang cepat dan relevan kepada developer sebelum kode digabung. Scan biasanya dilakukan dengan `trivy fs` terhadap repository menggunakan scanner `vuln,secret,misconfig`, sehingga dependensi, secret yang tidak sengaja ikut di-commit, dan file konfigurasi seperti Dockerfile atau manifest Kubernetes diperiksa sekaligus tanpa perlu membangun image. Gate dibuat ketat tetapi sempit, misalnya `--severity CRITICAL,HIGH --ignore-unfixed --exit-code 1`, sehingga PR hanya gagal jika ada temuan berat yang sudah memiliki versi perbaikan dan memang bisa diperbaiki oleh developer. Database Trivy di-cache agar scan selesai dalam hitungan detik sampai satu atau dua menit. Pengecualian yang disengaja dicatat di `.trivyignore` beserta alasan dan tanggal kedaluwarsa, sehingga ikut melalui proses code review.'),
  P('Scan di PR juga perlu memperhatikan keamanan pipeline itu sendiri. Kode dari PR, terutama yang berasal dari fork, belum direview dan belum dapat dipercaya. Karena itu job scan PR dijalankan dengan token read-only, tanpa secret dan tanpa akses OIDC ke cloud, serta tidak memakai trigger `pull_request_target` yang menjalankan kode PR dengan hak akses penuh. Jika hasil SARIF di-upload ke GitHub Code Scanning, GitHub hanya menyorot alert yang baru diperkenalkan oleh PR tersebut, sehingga developer tidak dibebani temuan lama yang bukan tanggung jawabnya.'),
  P('Pada **branch main/production**, tujuan scan adalah memberikan jaminan menyeluruh atas artefak yang benar-benar akan dirilis. Target scan bukan lagi source code, melainkan image final hasil build (`trivy image`), karena image membawa paket OS dari base image dan file hasil build yang tidak terlihat di repository. Semua tingkat severity dilaporkan ke tab Security dalam format SARIF agar ada riwayat dan tren, sementara gate tetap memblokir deploy jika ada temuan Critical atau High yang bisa diperbaiki. Pada tahap ini Trivy juga dapat menghasilkan SBOM (`--format cyclonedx`) dan memeriksa lisensi, lalu SBOM tersebut ditandatangani bersama provenance sebelum image dipublikasikan.'),
  P('Selain itu, branch main perlu **scan terjadwal**, misalnya setiap hari melalui `schedule: cron`, atau pemantauan terus-menerus di cluster dengan Trivy Operator. Alasannya, kode di main bisa saja tidak berubah, tetapi database kerentanan diperbarui setiap hari. Pada praktikum sebelumnya terlihat bahwa versi dependensi yang dahulu dinyatakan aman ternyata kini memiliki puluhan temuan Critical/High. Temuan dari scan terjadwal ini tidak dipakai untuk memblokir PR orang lain, tetapi diteruskan sebagai issue atau notifikasi kepada pemilik layanan dengan target waktu perbaikan sesuai tingkat severity.'),
  P('Strategi ini berbeda karena kedua branch memiliki tujuan, pengguna hasil scan, dan tingkat kepercayaan yang berbeda. Di PR, pengguna hasil scan adalah developer yang sedang bekerja; scan yang lambat atau penuh temuan yang tidak bisa ia perbaiki akan cenderung diabaikan atau diakali. Di main, pengguna hasil scan adalah tim keamanan, operasional, dan auditor yang membutuhkan gambaran lengkap tentang apa yang berjalan di produksi. Objek yang dipindai juga berbeda, yaitu perubahan source code di PR dan image lengkap di main. Faktor waktu juga berpengaruh, karena hasil scan PR mencerminkan kondisi saat PR dibuat, sedangkan risiko artefak di main terus berubah seiring munculnya CVE baru. Terakhir, kode PR belum dipercaya sehingga job-nya tidak boleh memegang kredensial, sedangkan job main berjalan dari kode yang sudah disetujui.'),
  P('Dampaknya terhadap workflow tim cukup besar dan sebagian besar positif. Developer mendapat umpan balik dalam hitungan menit, saat konteks perubahan masih segar dan biaya perbaikan paling murah, sehingga prinsip shift left berjalan tanpa memperlambat pengembangan. Karena PR hanya diblokir oleh temuan baru yang bisa diperbaiki, risiko alert fatigue berkurang dan developer tidak terdorong untuk mematikan scan. Kepemilikan masalah juga menjadi jelas: temuan di PR menjadi tanggung jawab penulis PR, sedangkan temuan dari scan terjadwal dikelola sebagai backlog keamanan dengan SLA, misalnya Critical tujuh hari dan High tiga puluh hari. Tim juga tidak tiba-tiba terblokir hanya karena database Trivy diperbarui semalam.'),
  P('Di sisi lain, strategi ini menuntut disiplin tambahan. Tim perlu memelihara dua konfigurasi scan, menjaga versi Trivy di CI dan di lokal tetap sama agar hasilnya konsisten, meninjau `.trivyignore` secara berkala, dan menyediakan waktu rutin untuk menangani backlog dari scan main. Tool seperti Dependabot atau Renovate dapat membantu dengan membuka PR update dependensi secara otomatis, yang kemudian juga melewati scan PR. Secara keseluruhan, pembagian ini membuat scan PR berfungsi sebagai pagar agar risiko baru tidak masuk, sedangkan scan main dan scan terjadwal berfungsi sebagai pengawasan berkelanjutan terhadap risiko yang muncul setelah kode dirilis.'),
];

// ---------- referensi ----------
const pustaka = [
  H1('REFERENSI', false),
  ...[
    '[1] NTIA. (2021). The Minimum Elements For a Software Bill of Materials (SBOM). https://www.ntia.gov/report/2021/minimum-elements-software-bill-materials-sbom',
    '[2] OpenSSF. SLSA Specification v1.0. https://slsa.dev/spec/v1.0/',
    '[3] GitHub. Using artifact attestations to establish provenance for builds. https://docs.github.com/actions/security-for-github-actions/using-artifact-attestations',
    '[4] GitHub. About security hardening with OpenID Connect. https://docs.github.com/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect',
    '[5] AWS. Create an OpenID Connect (OIDC) identity provider in IAM. https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html',
    '[6] Aqua Security. Trivy Documentation. https://trivy.dev/docs/',
  ].map(t => new Paragraph({ alignment: AlignmentType.LEFT, indent: { left: 500, hanging: 500 }, spacing: { after: 120, line: 300 }, children: [new TextRun({ text: t, size: 22 })] })),
];

// ---------- document ----------
const doc = new Document({
  creator: 'Firmansyah Dzakwan Arifien', lastModifiedBy: 'Firmansyah Dzakwan Arifien',
  title: 'Tugas Pertemuan 10 DevSecOps', description: 'Jawaban pertanyaan Pertemuan 10',
  styles: {
    default: { document: { run: { font: FONT, size: BASE } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: FONT, color: '000000' },
        paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 360, after: 300, line: 360 }, outlineLevel: 0 } },
    ],
  },
  sections: [
    { properties: { page: { margin: { top: 1699, right: 1699, bottom: 1699, left: 2261 } } }, children: cover },
    { properties: { page: { margin: { top: 1699, right: 1699, bottom: 1699, left: 2261 }, pageNumbers: { start: 1 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT], size: 22 })] })] }) },
      children: [...jawaban, ...pustaka] },
  ],
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync(OUT, b); console.log('wrote', OUT); });
