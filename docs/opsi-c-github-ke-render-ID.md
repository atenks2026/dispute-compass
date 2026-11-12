# Panduan Opsi C — Laptop → GitHub → Render (Explain for Dummies)

**Team AHVO · Dispute Compass · PayPal AI Hackathon**
Ditulis: 12 November 2026 · Bahasa: Indonesia santai · Pembaca: kamu & AHVO

> **DEADLINE: Jumat, 13 November 2026, pukul 03.00 WIB**
> (= 12 November, jam 12.00 siang waktu Pacific = 12 Nov, 20.00 UTC)
>
> Penting: kalau form Devpost sudah terisi, **klik SUBMIT sekali SEKARANG**.
> Setelah SUBMIT pertama, form tetap bisa diedit sampai deadline. Kalau belum
> pernah SUBMIT sama sekali, saat deadline form terkunci dan kamu tidak bisa
> menambahkan apa pun lagi.

---

## 0. Jawaban pertanyaanmu dulu: "simpan semua di laptop, lalu push ke GitHub — nindas file lama, gimana?"

**Jawaban singkat: AMAN. Itu memang cara kerja git yang benar. Lakukan.**

Analogi: anggap git itu **album foto otomatis**. Setiap kali kamu *commit* +
*push*, git "memfoto" kondisi terbaru semua file dan menempelkannya di GitHub.
Yang kamu sebut "menindas" itu hanya mengganti **foto paling depan** (versi
terbaru). Semua foto-foto lama **tetap tersimpan** di dalam album — namanya
**history** — dan bisa dibuka/dikembalikan kapan saja.

Mau buktinya sendiri? Setelah push, buka repo di github.com → klik salah satu
file → klik tombol **History** (kanan atas area file). Kamu akan melihat semua
versi lama, lengkap dengan tanggalnya.

Jadi rencanamu sudah tepat:

- **Laptop** = meja kerja + backup utama (benar).
- **GitHub** = etalase versi terbaru + gudang semua riwayat versi (benar).
- Push versi hasil perombakan → versi lama di GitHub otomatis turun ke history.
  **Tidak ada yang hilang.**

### Tiga hal yang TIDAK BOLEH ikut di-push

| Jangan push | Kenapa |
|---|---|
| folder `node_modules/` | Ratusan ribu file dependensi. Bisa dipasang ulang kapan saja dengan `bun install`. |
| folder `.next/` | Hasil build sementara. Dibuat ulang otomatis oleh GitHub Actions. |
| file `.env` | Berisi kunci rahasia (API key). Sekali bocor di internet, sulit ditarik kembali. |

Kabar baik: file **`.gitignore`** di project sudah mengurus ketiganya
(otomatis tidak ikut ter-push). Syaratnya cuma dua:

1. **Jangan hapus** file `.gitignore`.
2. **Jangan pakai** `git add -f` untuk file/folder itu (flag `-f` artinya
   "paksa", menembus .gitignore — untuk kasus kita hanya workflow CI yang boleh
   pakai `-f`, dan itu sudah kuhandle di dalam file-nya).

---

## 1. Peta besar: apa itu Opsi C dan kenapa harus begini

**Masalah yang sudah terbukti (diukur langsung):**

| Kondisi | RAM dibutuhkan | RAM tersedia | Hasil |
|---|---|---|---|
| Proses `next build` | 1,4–2,3 GB | Render gratis: 512 MB | Build dibunuh di tengah jalan (OOM) → URL 502 |
| Aplikasi **hasil jadi** berjalan | **±94 MB** | Render gratis: 512 MB | **Aman, sisa 4x lipat** |

Kesimpulannya: **memasak** (build) yang berat, **menyajikan** (run) yang
ringan. Jadi kita pindahkan memasaknya ke dapur yang luas:

**Analogi Opsi C: masak di dapur tetangga, sajikan di gerobakmu.**

- **Dapur luas** = GitHub Actions (komputer gratis dari GitHub, RAM 7 GB,
  runner-nya publik gratis) → menjalankan `next build`.
- **Gerobak** = Render (RAM 512 MB) → tidak perlu memasak sama sekali, cukup
  menjalankan "makanan jadi" (hasil build bernama *standalone*).

Alur lengkapnya:

```
LAPTOP ──(git push)──▶ GitHub branch "main"
                            │
                            ▼
                 GitHub Actions menjalankan build (RAM 7 GB, gratis)
                            │
                            ▼
                 GitHub branch "deploy"  ← berisi "hasil jadi" siap saji
                            │
                            ▼
                 Render menjalankan (TANPA build) ──▶ https://dispute-compass.onrender.com
                                                        (online, otomatis tiap update)
```

Bonus cerita sponsor: dengan setup ini demo live-mu **benar-benar di-host di
Render**, dan kamu bisa bercerita di README/Devpost:

> "Free-tier Render cannot run `next build` (OOM at 512 MB), so we build in
> GitHub Actions CI and Render serves the prebuilt standalone output — runtime
> measured at ~94 MB."

Itu cerita engineering yang jujur dan bagus untuk kategori sponsor.

---

## 2. Info sponsor yang kamu lupa — nama kategorinya

Dari halaman **Prizes** di Devpost (paypalaihackathon.devpost.com), kategori
sponsor yang pilih kalian ikuti adalah:

### Render → nama kategorinya: **"Best Use of Render"**

| Juara | Hadiah |
|---|---|
| 1st Place | **$1.000** dalam Render Credits (1 pemenang) |
| 2nd Place | **$750** dalam Render Credits (1 pemenang) |
| 3rd Place | **$500** dalam Render Credits (1 pemenang) |

### AG Grid → nama kategorinya: **"Best Use of AG Grid"**

| Juara | Hadiah |
|---|---|
| 1st Place | **$5.000** cash (1 pemenang) |
| 2nd Place | **$2.000** cash (1 pemenang) |
| 3rd Place | **$1.000** cash (3 pemenang) |

**Dispute Compass sudah memenuhi dua-duanya:**

- AG Grid dipakai nyata di tabel disputes (cockpit dashboard).
- Dengan Opsi C ini, app live-nya di-host di Render.

Di form Devpost, di bagian sponsor prizes ada pertanyaan semacam
*"Which sponsor prizes are you entering for?"* → **centang AG Grid dan
Render** (dan pastikan tercentang sebelum SUBMIT).

---

## 3. Langkah 1 — Dorong versi terbaru dari laptop ke GitHub

Pilih sesuai kondisimu.

### Kasus A — repo GitHub SUDAH ada, isinya versi lama (kasusmu: "banyak perombakan")

Cara paling anti-ribet dan bebas konflik: **clone segar → timpa → push**.
Tidak perlu pusing merge.

```bash
# 1. Ambil salinan bersih dari GitHub
git clone https://github.com/<USERNAME>/<NAMA-REPO>.git
cd <NAMA-REPO>
```

```text
2. Buka folder hasil clone di File Explorer (Windows) / Finder (Mac).
   Copy SELURUH isi folder project dari laptop ke dalam folder clone ini.
   Kalau muncul dialog, pilih "Replace the files in the destination".

   PENTING — tiga pengecualian, JANGAN ikut di-copy:
   a) folder bernama ".git" di DALAM folder clone
      → itu otak git-nya. Terhapus = riwayat versi hilang!
      Folder .git itu tersembunyi:
        Windows: View ▸ Show ▸ Hidden items
        Mac: tekan Cmd+Shift+. (titik)
   b) folder node_modules dan .next dari laptop → skip (nggak perlu, nge-gede)
   c) file .env dari laptop → skip (rahasia, tidak boleh naik ke GitHub)
```

```bash
# 3. Kembali ke terminal (pastikan masih di dalam folder clone):
git add -A
git commit -m "Perombakan terbaru Dispute Compass + siap Opsi C (CI workflow & prebuilt render.yaml)"
git push
```

Selesai. Versi lama otomatis jadi history (Bab 0 sudah dijelaskan kenapa aman).

**Tips tambahan:** satu orang saja yang push (misal AHVO). Kalau dua orang
push bersamaan dari dua laptop berbeda, bisa terjadi konflik. Untuk
hackathon: satu laptop = satu tukang push.

### Kasus B — repo GitHub BELUM ada (mulai dari nol)

1. Buka **github.com** → login → klik ikon **+** (kanan atas) → **New repository**.
2. Isi: Repository name: `dispute-compass` · Visibility: **Public**
   (WAJIB public — syarat Devpost dan syarat ikut kategori sponsor) ·
   **JANGAN** centang "Add a README" (biarkan kosong total) → **Create repository**.
3. Di terminal, dari dalam folder project di laptop:

```bash
git init -b main
git add -A
git commit -m "Dispute Compass — versi terbaru (siap Opsi C)"
git remote add origin https://github.com/<USERNAME>/dispute-compass.git
git push -u origin main
```

4. (Opsional tapi bagus) Tambah LICENSE lewat web: di halaman repo →
   **Add file ▸ Create new file** → ketik `LICENSE` → klik "Choose a license
   template" → pilih **MIT** → Commit. Judge suka repo yang jelas lisensinya.

### Cek hasil push (1 menit, jangan dilewati)

Buka repo di github.com dan pastikan:

- [ ] File terbaru terlihat: `package.json`, `render.yaml`, `src/…`
- [ ] Ada file `.gitignore`
- [ ] Ada folder `.github/workflows/` berisi `deploy-render.yml`
- [ ] **TIDAK** ada folder `node_modules` dan `.next`
- [ ] **TIDAK** ada file `.env` (yang boleh naik hanya `.env.example`)

### Kalau push ditolak ("rejected / non-fast-forward")

Artinya ada perubahan di GitHub yang belum ada di laptop-mu. Obatnya:

```bash
git pull --rebase origin main
git push
```

---

## 4. Langkah 2 — Dua file baru (sudah kubuatkan; ada di repo & di zip terbaru)

Kedua file ini adalah "jantungnya Opsi C". Mereka **sudah ada** di zip
`Dispute-Compass-PayPal-AI-Hackathon.zip` versi terbaru (di folder `download/`)
— jadi kalau kamu push dari isi zip itu, tidak perlu mengetik apa pun.

Kalau file ini belum ada di laptop-mu (laptop-mu masih versi lama), buat saja
manual dengan copy-paste di bawah.

### File 1: `.github/workflows/deploy-render.yml`

> Cara buat di laptop: di dalam folder project, buat folder `.github`
> (ya, namanya diawali titik) di dalamnya folder `workflows`, di dalamnya file
> `deploy-render.yml`. Nama folder berawalan titik memang agak tersembunyi di
> Explorer — gunakan View ▸ Show ▸ Hidden items (Windows) atau buat lewat
> VS Code / editor kode, lebih gampang.

**Apa yang dilakukannya (baris per baris, versi manusia):**

| Langkah di workflow | Artinya |
|---|---|
| `on: push branches [main]` | Setiap kali kamu push ke main, workflow ini jalan otomatis. |
| `workflow_dispatch` | Ada juga tombol "Run workflow" manual di tab Actions. |
| `permissions: contents: write` | Memberi izin bot untuk membuat/memperbarui branch `deploy`. |
| Setup Bun | Project kita pakai `bun.lock`, jadi di CI juga pakai bun (versi persis sama, tidak bisa geser). |
| `bun install --frozen-lockfile` | Pasang semua dependensi sesuai daftar terkunci. |
| `bun run build` | Memasak! `next build` di komputer 7 GB — di sini RAM-nya lelap. |
| Salin static & public | Memastikan file tampilan ikut masuk ke paket standalone. |
| Publish ke branch `deploy` | Membungkus hasil build jadi satu commit di branch `deploy` (branch khusus "hasil jadi"). Render melihat branch ini. |

Isi lengkapnya:

```yaml
# Dispute Compass — build on GitHub Actions, run on Render (Option C)
#
# WHY THIS WORKFLOW EXISTS
# `next build` needs ~1.4–2.3 GB RAM (measured). Render's FREE plan only
# provides 512 MB, so building on Render gets OOM-killed and the URL returns
# HTTP 502. The finished app, however, only needs ~94 MB at runtime.
#
# STRATEGY (Option C): build here on GitHub Actions (runners have 7 GB RAM),
# publish the finished standalone output to the `deploy` branch, and let
# Render run that artifact with NO build step.
#
# FLOW
#   push to main → this workflow → `deploy` branch updated → Render auto-deploys
#
# Render service settings (set ONCE in the Render dashboard):
#   Branch:        deploy
#   Build Command: (leave EMPTY — never build on Render)
#   Start Command: node .next/standalone/server.js

name: Build & publish prebuilt bundle to deploy branch

on:
  push:
    branches: [main]
  workflow_dispatch: {} # allows a manual "Run workflow" from the Actions tab

permissions:
  contents: write # needed to push the deploy branch

jobs:
  build-and-publish:
    runs-on: ubuntu-latest # 7 GB RAM — plenty for next build
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun (project uses bun.lock)
        uses: oven-sh/setup-bun@v2

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Generate Prisma client (only if this project uses Prisma)
        run: |
          if [ -f prisma/schema.prisma ]; then
            bunx prisma generate
          else
            echo "No prisma schema — skipping."
          fi

      - name: Build Next.js (standalone output)
        run: bun run build

      - name: Ensure static & public live inside the standalone bundle
        run: |
          mkdir -p .next/standalone/.next
          [ -d .next/standalone/.next/static ] || cp -r .next/static .next/standalone/.next/static
          [ -d .next/standalone/public ] || cp -r public .next/standalone/public

      - name: Publish bundle to the deploy branch
        run: |
          rm -rf /tmp/bundle
          mkdir -p /tmp/bundle/.next
          cp -r .next/standalone /tmp/bundle/.next/standalone
          cd /tmp/bundle
          git init -q -b deploy
          git add -A -f
          git -c user.name="github-actions[bot]" \
              -c user.email="41898282+github-actions[bot]@users.noreply.github.com" \
              commit -q -m "Prebuilt bundle from commit $GITHUB_SHA"
          git remote add origin "https://x-access-token:${{ secrets.GITHUB_TOKEN }}@github.com/${{ github.repository }}.git"
          git push -q --force origin deploy
```

### File 2: `render.yaml` (versi baru — menggantikan yang lama)

Perubahan penting vs versi lama: **Render tidak lagi menjalankan build**.
Baris lama `buildCommand: bun install ... && bun run build` (yang selalu OOM)
diganti jadi `buildCommand: "true"` (perintah kosong yang selalu sukses), dan
ditambah `branch: deploy` supaya Render mengambil "hasil jadi", bukan kode
mentah.

Isi lengkapnya:

```yaml
# Render Blueprint — Dispute Compass (Option C: prebuilt deploy)
#
# WHY NO BUILD HERE: `next build` needs ~1.4–2.3 GB RAM (measured); Render's
# FREE plan provides 512 MB, so building here gets OOM-killed → HTTP 502.
# The finished app only runs in ~94 MB. GitHub Actions builds the app and
# publishes the finished standalone output to the `deploy` branch; Render
# only RUNS that artifact.
#
# Deploy: Render Dashboard → New → Web Service → pick this repository
#         → select the `deploy` branch → keep Build Command EMPTY
#         → Start Command: node .next/standalone/server.js
# Docs: https://render.com/docs/blueprint-spec

services:
  - type: web
    name: dispute-compass
    runtime: node
    plan: free
    branch: deploy                     # the branch holding the prebuilt bundle
    buildCommand: "true"               # no-op — NEVER run next build on Render (512 MB OOM)
    startCommand: node .next/standalone/server.js
    healthCheckPath: /api/health
    autoDeploy: true                   # redeploy whenever the deploy branch updates
    envVars:
      - key: NODE_VERSION
        value: "22"
      - key: NODE_ENV
        value: production
      - key: PAYPAL_CLIENT_ID
        sync: false # optional — PayPal Sandbox Client ID; Demo Mode works without
      - key: PAYPAL_CLIENT_SECRET
        sync: false # optional — PayPal Sandbox Secret
      - key: PAYPAL_BASE_URL
        value: https://api-m.sandbox.paypal.com
      - key: LLM_API_KEY
        sync: false # optional — NVIDIA NIM or any OpenAI-compatible key
      - key: LLM_BASE_URL
        value: https://integrate.api.nvidia.com/v1
      - key: LLM_MODEL
        value: nvidia/nemotron-3.5-super-vl-120b-a12b
```

> Kalau kamu menarik file dari zip terbaru, kedua file di atas SUDAH di dalam
>nya — tinggal push, tidak perlu mengetik ulang.

---

## 5. Langkah 3 — Build pertama di GitHub Actions

1. Push seperti Langkah 1 (yang penting: workflow ikut ter-push).
2. Buka github.com → repo kamu → tab **Actions** (di baris menu atas).
3. Kamu akan melihat workflow **"Build & publish prebuilt bundle to deploy
   branch"** berjalan (lingkaran kuning = sedang jalan).
4. Tunggu ± 5–10 menit sampai jadi **centang hijau**. Klik di dalamnya kalau
   ingin melihat detail tiap langkah.
5. Kalau berhasil, buka halaman utama repo → klik dropdown branch (yang
   tertulis `main`) → branch **`deploy`** sekarang muncul di daftar. Itu
   "paket hasil jadi"-nya.

**Kalau workflow belum jalan sama sekali** (daftar kosong): masuk ke tab
Actions → klik nama workflow di sidebar → tombol **Run workflow** → pilih
branch `main` → Run.

> **Urutan penting:** jangan buat service di Render SEBELUM branch `deploy`
> muncul. Dropdown pemilih branch di Render hanya menampilkan branch yang
> sudah ada. Jadi: push dulu → Actions hijau dulu → baru Langkah 4.

**Biaya:** untuk repo **public**, GitHub Actions gratis tanpa batas kuota.
Repo private pun dapat 2.000 menit/bulan gratis — build kita cuma ±5 menit
 sekali push. Santai.

---

## 6. Langkah 4 — Nyalakan Render (hanya sekali disetel)

1. Buka **dashboard.render.com** → login pakai akun GitHub-mu.
2. Klik **New ▸ Web Service**.
3. Kalau diminta menghubungkan GitHub: izinkan Render (bisa pilih
   "All repositories" atau "Only select repositories" → pilih repo-mu).
4. Di halaman pengaturan, isi PERSIS begini:

| Kolom | Isi |
|---|---|
| Repository | repo-mu (dispute-compass) |
| **Branch** | **`deploy`** ← KUNCI UTAMA. Bukan main! |
| Language / Runtime | Node |
| **Build Command** | **HAPUS SAMPAI KOSONG** (kalau ada tulisan apa pun — `npm install` dsb — hapus) |
| **Start Command** | `node .next/standalone/server.js` |
| Instance Type | **Free** |

5. Scroll ke bagian **Environment Variables**, tambahkan:

| Key | Value | Wajib? |
|---|---|---|
| `NODE_VERSION` | `22` | ya |
| `NODE_ENV` | `production` | disarankan |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | (kredensial sandbox PayPal) | tidak — boleh dilewati |
| `LLM_API_KEY` | (kunci NVIDIA NIM) | tidak — boleh dilewati |

Demo Mode berjalan **tanpa satu pun kredensial** — jadi untuk demo kontes,
dua baris pertama saja cukup. Kredensial bisa ditambahkan nanti lewat
Environment di dashboard Render.

6. Klik **Create Web Service** → Render menarik branch `deploy` →
   deploy pertama berlangsung **±1–2 menit** → status berubah **"Live"**
   → kamu dapat URL, contohnya `https://dispute-compass.onrender.com`.

**Cara alternatif (Blueprint):** kalau repo-mu sudah berisi `render.yaml`
versi baru, kamu juga bisa: New ▸ Blueprint → pilih repo → Apply. Semua
pengaturan di tabel di atas sudah tertulis di file itu. Tapi cara manual
(tabel di atas) lebih transparan untuk dipelajari — pilih salah satu saja.

---

## 7. Langkah 5 — Uji (5 menit, jangan dilewati)

1. Buka URL Render-mu → landing page muncul.
2. Buka `https://URL-KAMU.onrender.com/api/health` → harus muncul JSON status
   ok (ini endpoint kesehatan; Render juga memakainya untuk cek otomatis).
3. Masuk **Demo Mode** → buka kasus **27401** → periksa angka kunci yang sudah
   terverifikasi di lokal:
   - Strength meter: 24 → 44 (WEAK → MODERATE) setelah evidence masuk
   - Settlement offer: 60% → 45%
   - Fight option: $188.48 pada pWin 0.24; urgency 4–5 hari = WATCH
4. Buka kasus **27402** → urgency 2 hari = **URGENT**.
5. Kalau semua sama seperti saat demo lokal → Render-mu hidup dan sehat.

**Catatan "app-nya kok lemot pas dibuka pertama":** Render free tidur
(setelah ±15 menit tanpa pengunjung) dan butuh **±50 detik** untuk bangun.
Ini NORMAL dan gratis. Tulis satu baris di README/Devpost:

> "Free tier: the first request may take ~50 s while the instance wakes up.
> Subsequent requests are fast."

Jadi: sebelum merekam video demo / sebelum judge membuka link, **buka dulu
URL-nya sekali** untuk membangunkan instance.

---

## 8. Alur update berikutnya (sehari-hari)

Sekali disetel, selamanya begini saja:

```bash
# edit-edit file di laptop...
git add -A
git commit -m "deskripsi perubahan"
git push
```

Lalu otomatis: Actions membangun (±5 menit) → branch `deploy` terbarui →
Render redeploy sendiri (±1 menit). **Kamu tidak perlu menyentuh dashboard
Render lagi.**

Render juga punya tombol darurat: dashboard → service kamu → **Manual Deploy
▸ Deploy latest commit** — berguna kalau kamu ingin redeploy tanpa push.

---

## 9. Troubleshooting (masalah umum + obatnya)

| Gejala | Penyebab paling mungkin | Obat |
|---|---|---|
| Actions merah (X) | Lihat langkah mana yang merah | Klik job → langkah merah → baca log. `Install dependencies` merah = lockfile tidak ter-push (pastikan `bun.lock` ikut). `Build` merah = error kode; jalankan `bun run build` di laptop untuk melihat error yang sama. |
| Workflow tidak jalan sama sekali | Belum pernah ada trigger | Tab Actions → pilih workflow → **Run workflow** manual. |
| Branch `deploy` tidak muncul | Workflow gagal / belum jalan | Pastikan Actions hijau dulu (lihat atas). |
| Render: tetap 502 | Start Command salah ketik | Persis: `node .next/standalone/server.js` (huruf kecil semua, satu baris). Cek tab **Logs** di Render. |
| Render: masih ada proses `npm install` / `next build` | Build Command belum kosong | Settings → Build Command → hapus isinya → Save → Manual Deploy. |
| Render: "No open ports detected" | App gagal start | Cek Logs; biasanya Start Command typo atau NODE_VERSION terlalu tua (harus 22). |
| Push ditolak (rejected) | Ada perubahan di GitHub yang belum di laptop | `git pull --rebase origin main` lalu `git push`. |
| Takut "menindas" file salah | — | Semua bisa dikembalikan: github.com → file → **History** → pilih versi lama → "Revert" atau download. |
| URL lama masih 502 setelah setup benar | Instance lama masih sakit | Dashboard Render → **Manual Deploy ▸ Clear build cache & deploy**. |
| Fitur AI/PayPal error di online | Kredensial belum diisi di Render | Demo Mode tetap jalan tanpa itu. Kalau ingin fitur live: Environment (dashboard Render) → tambah `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `LLM_API_KEY` → Save. |

---

## 10. Checklist menuju SUBMIT

- [ ] Push versi terbaru dari laptop ke GitHub (Langkah 1) — repo **public**
- [ ] Cek di github.com: `.github/workflows/deploy-render.yml` ada, `node_modules`/`.env` TIDAK ada
- [ ] Actions hijau → branch `deploy` muncul (Langkah 3)
- [ ] Render Web Service dibuat dari branch `deploy`, Build Command kosong (Langkah 4)
- [ ] `/api/health` ok + Demo Mode angkanya cocok (Langkah 5)
- [ ] URL Render ditempel di form Devpost (Live Demo URL) + buka sekali untuk bangunkan instance
- [ ] README repo: tambah 1 kalimat cerita Render (ada contoh di Bab 1)
- [ ] Devpost: centang sponsor prize **Best Use of AG Grid** dan **Best Use of Render**
- [ ] Video YouTube public (judul + thumbnail PNG sudah ada di `download/`)
- [ ] **SUBMIT diklik** (klik sekali sekarang agar bisa terus diedit sampai 13 Nov 2026, 03.00 WIB)

Selesai — Dispute Compass online di Render, gratis, tanpa 502.
