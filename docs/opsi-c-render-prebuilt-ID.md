# Opsi C — URL `onrender.com` yang HIDUP di Render FREE 512 MB
### (build dipindah ke GitHub Actions — metode explain-for-dummies)

**Team AHVO · 12 Nov 2026 · untuk: siapa pun yang belum pernah menyentuh GitHub Actions**

> **UPDATE 12 Nov malam — panduan ini sudah diselaraskan dengan zip terbaru.**
> File workflow (`.github/workflows/deploy-render.yml`) dan `render.yaml` versi
> final **sudah ada di dalam zip** `Dispute-Compass-PayPal-AI-Hackathon.zip`,
> jadi bagian 3 cukup diverifikasi, tidak harus dibuat manual. Nama branch
> hasil build disepakati: **`deploy`** (bukan `render-deploy` seperti draf awal).
> Untuk jawaban "push dari laptop menindas file lama di GitHub — aman?" baca
> panduan pendamping: **`Dispute-Compass-Opsi-C-GitHub-ke-Render-ID.md`**.

> **Satu kalimat:** masalah Render free bukan "menjalankan aplikasi" (terukur hanya **±94 MB**, muat di 512 MB), tapi "membangun aplikasi" (butuh 1,4–2,3 GB). Jadi kita menyuruh **komputer GitHub yang RAM-nya 7 GB** untuk membangun, lalu Render hanya **menyalakan hasil jadinya**.
>
> Hasil akhir: aplikasi asli berjalan di Render free, URL tetap `https://dispute-compass.onrender.com`, dan setiap kali kode di-push ke GitHub, semua ter-update otomatis.
>
> ⏱️ Estimasi: **30–45 menit** (kalau repo GitHub sudah ada: **20–30 menit**).
>
> 🚨 Deadline: **Kamis 13 Nov 2026 jam 03.00 WIB.** Kalau di tengah jalan tersangkut lebih dari 30 menit → STOP, pakai jalur cepat Vercel (Opsi A di `Dispute-Compass-Render-Fix-ID.md`, 10 menit). SUBMIT lebih penting daripada URL cantik.

---

## 0. Kenapa ini bisa jalan? (pahami 2 menit, kerjakan 30 menit)

Analogi restoran:

| Peran | Siapa | Catatan |
|---|---|---|
| **Dapur besar** | GitHub Actions (komputer build gratis, RAM 7 GB) | Build butuh 1,4–2,3 GB → di sini aman |
| **Paket siap saji** | Branch `deploy` berisi `.next/standalone/` | Aplikasi sudah jadi + `node_modules` versi ramping ikut di dalamnya |
| **Ruang makan kecil** | Render free 512 MB | Tidak perlu memasak (Build Command dikosongkan), hanya **menyajikan** — RAM terpakai ±94 MB, terukur langsung |

Alur otomatisnya nanti:

```
kamu push kode ke main
   → GitHub Actions build (±4–6 menit)
   → hasil jadi di-push ke branch deploy
   → Render melihat branch itu berubah → deploy sendiri (tanpa build berat)
   → URL hidup
```

---

## 1. Checklist sebelum mulai

| # | Harus sudah ada | Cara cek |
|---|---|---|
| 1 | Repo GitHub **publik** berisi kode Dispute Compass | Buka `github.com/<username>/dispute-compass` → ada file `package.json`, folder `src/`, `README.md`, `LICENSE` |
| 2 | Akun Render dengan service **dispute-compass** | `dashboard.render.com` → service muncul (yang tadinya 502 itu) |
| 3 | Zip submission **terbaru** (untuk cara 2b) | `Dispute-Compass-PayPal-AI-Hackathon.zip` versi 12 Nov malam |

Repo belum ada? Kerjakan **bagian 2** dulu. Sudah ada? Langsung **bagian 3**.

---

## 2. (Lewati jika repo sudah ada) Buat repo GitHub publik dari zip

### Cara 2a — GitHub Desktop (paling dummy-proof, disarankan)

1. Download **GitHub Desktop** (desktop.github.com) → install → login akun GitHub.
2. Ekstrak `Dispute-Compass-PayPal-AI-Hackathon.zip` (klik kanan → Extract All). Di dalamnya ada folder `dispute-compass/`.
3. GitHub Desktop → **File → Add Local Repository…** → kalau muncul "this directory does not appear to be a Git repository" klik **Create a Repository** → Name: `dispute-compass` → **Keep private JANGAN dicentang** (harus publik!) → Create.
4. Tunggu semua file terdeteksi → tulis summary `initial commit` → **Commit to main**.
5. Tombol **Publish repository** di atas → pastikan **Keep this code private TIDAK dicentang** → Publish.
6. Buka `github.com/<username>/dispute-compass` di browser → file terlihat → selesai.

### Cara 2b — upload lewat browser (tanpa install apa pun)

1. `github.com/new` → Repository name: `dispute-compass` → pilih **Public** → **Create repository**.
2. Di halaman repo kosong, klik link **uploading an existing file**.
3. Drag folder dari hasil ekstrak zip **per batch** (GitHub membatasi ±100 file per tarikan): `src/` dulu → tunggu selesai → lanjut `public/`, `tests/`, `docs/`, `examples/`, `prisma/`, lalu folder `.github/` (workflow CI), lalu file-file di root (`package.json`, `bun.lock`, `render.yaml`, `README.md`, `LICENSE`, `next.config.ts`, `tsconfig.json`, dll).
4. Commit message: `initial commit` → **Commit changes**.
5. Cek: file `package.json` dan `LICENSE` terlihat di halaman repo.

> Repo WAJIB publik — syarat resmi rules ("URL to the open-source project repository"). Repo private = gugur administratif.

---

## 3. File "resep" GitHub Actions — SUDAH ADA di zip terbaru (tinggal cek)

Nama file: **`.github/workflows/deploy-render.yml`**.

1. **Kalau kamu push dari zip terbaru (12 Nov malam):** file ini sudah ada di
   dalamnya — buka repo → folder `.github/workflows/` → pastikan
   `deploy-render.yml` terlihat → **langsung lewati ke bagian 4**.
2. **Kalau belum ada** (repo dibuat dari file laptop versi lama): buka repo di
   browser → **Add file → Create new file** → ketik nama filenya **persis**
   (slash-nya bikin folder otomatis): `.github/workflows/deploy-render.yml` →
   salin-tempel seluruh isi di bawah ini (jangan ada yang terpotong) →
   **Commit changes** (pakai default "Commit directly to the main branch").

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

3. Apa arti resep ini (versi bahasa manusia):
   - Setiap ada push ke `main` (atau kamu klik "Run workflow") → GitHub menyewakan komputer Ubuntu RAM 7 GB.
   - Di situ: `bun install` → `bun run build` → hasilnya satu folder `.next/standalone/` = **aplikasi jadi lengkap** (server + `node_modules` ramping di dalamnya).
   - Folder itu di-commit ke branch **`deploy`** (branch khusus berisi hasil jadi siap jalan, bukan kode sumber).
   - Bot-nya `github-actions[bot]` memakai izin `contents: write` yang sudah dideklarasikan di file — tidak perlu membuat token/secret apa pun.

---

## 4. Jalankan Actions & cek branch hasil (±5 menit)

1. Di repo → tab **Actions** → kalau ada tombol kuning *"Workflows aren't being run on this fork"* / *"I understand my workflows, go ahead and enable them"* → klik **enable**.
2. Klik workflow **Build & publish prebuilt bundle to deploy branch** di kiri → **Run workflow** (kanan atas) → **Run workflow** (pop-up) → tunggu.
3. Klik baris run yang berjalan → titik hijau berarti sukses (±4–6 menit).
   - Kalau titik merah → klik run itu → klik langkah yang gagal → baca baris error pertama → cocokkan dengan tabel Troubleshooting di bagian 8.
4. Bukti sukses: balik ke halaman utama repo → klik dropdown **branches** → harus ada branch baru **`deploy`**. Isinya: folder `.next/standalone/` — aplikasi jadi lengkap, `node_modules` ramping sudah ikut di dalamnya.

---

## 5. Arahkan Render ke hasil jadi (±5 menit)

Buka **dashboard.render.com** → service **dispute-compass** → **Settings**:

| Setting | Isi dengan | Catatan |
|---|---|---|
| **Branch** (di bagian Build & Deploy / Repo) | `deploy` | Ini ganti dari `main`/branch lama — branch "hasil jadi" |
| **Build Command** | kosong (hapus semua isinya) | Tidak ada build di Render — RAM 512 MB murni untuk menjalankan |
| **Start Command** | `node .next/standalone/server.js` | Persis ini, tanpa `bun`, tanpa `tee` |
| **Health Check Path** | `/api/health` | Render otomatis menunggu sampai aplikasi benar-benar hidup |

Lalu **Environment** (menu kiri) → tambah kalau belum ada:

| Key | Value |
|---|---|
| `NODE_VERSION` | `22` |
| `PAYPAL_BASE_URL` | `https://api-m.sandbox.paypal.com` |

(`PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` / `LLM_API_KEY` **tidak wajib** — tanpa mereka aplikasi jalan penuh dalam **Demo Mode**, badge "no credentials needed" muncul di layar. Itu memang desainnya.)

**Simpan** semua perubahan.

---

## 6. Deploy & verifikasi (±5 menit)

1. Di atas kanan service → **Manual Deploy → Deploy latest commit** → Render mengambil branch `deploy` → karena tidak ada build, proses cepat (±1–3 menit).
2. Status di tab **Events** berubah jadi **Live** (hijau).
3. Uji persis seperti juri:
   - Buka `https://dispute-compass.onrender.com` → kokpit Dispute Compass muncul, badge **Demo Mode** terlihat, 8 kasus di tabel.
   - Tab lain: `https://dispute-compass.onrender.com/api/health` → JSON `{"status":"ok", ...}`.
   - Service free tidur kalau 15 menit sepi: request pertama bisa menggantung ±50 detik — itu **normal** (beda dengan 502 instan dulu). Rekurs: buka lagi, langsung cepat.
4. **Update 3 tempat** (kalau URL berubah dari rencana):
   - Form Devpost → field *Demo / hosted link*
   - GitHub repo → About (ikon gerigi) → Website
   - Penutup video demo: *"Try it live at …"*

---

## 7. Hidup setelahnya (otomatis, tanpa diurus)

| Kejadian | Yang terjadi |
|---|---|
| Kamu/team push kode baru ke `main` | Actions build ulang (4–6 menit) → branch `deploy` diperbarui → **Render deploy otomatis** |
| Edit langsung di branch `deploy` | ❌ Jangan — akan tertimpa saat build berikutnya. Semua edit lewat `main` |
| Render free tidur | Bangun sendiri ±50 detik pada request pertama. Kalau mau selalu cepat: halaman Devpost bisa menyebut *"first load may take up to 50s on free hosting"* — juri paham |

---

## 8. Troubleshooting for dummies

| Gejala | Penyebab | Obat |
|---|---|---|
| Tab Actions kosong / workflow tidak muncul | Actions belum di-enable | Bagian 4 langkah 1 — klik enable |
| Run gagal di langkah `Install dependencies` dengan soal lockfile | `bun.lock` tidak ikut ter-push | Pastikan file `bun.lock` ikut di repo (di zip terbaru sudah ada). Commit `bun.lock` lalu jalankan ulang workflow |
| Run gagal di langkah Build dengan `Killed` / `heap out of memory` | Kebalik! Kamu menjalankan build di Render, bukan di Actions | Cek lagi: Render **Build Command** harus kosong — bukan `bun run build` / `npm run build` |
| Run gagal di langkah Push: `remote: Permission to ... denied` | Token tidak punya izin menulis | Pastikan baris `permissions: contents: write` ada di YAML (sudah ada). Kalau repo milik organisasi: Settings → Actions → General → Workflow permissions → pilih **Read and write** |
| Run sukses tapi branch `deploy` tidak ada | Push gagal diam-diam / commit kosong | Buka log langkah terakhir; jalankan ulang **Run workflow** |
| Render deploy gagal: `Cannot find module ...` | Folder `.next/standalone` tidak utuh | Pastikan langkah "Build Next.js" dan "Ensure static & public live inside the standalone bundle" sukses keduanya, lalu Run workflow ulang |
| Render deploy gagal: OOM lagi (`used over 512MB`) | Build command masih perintah build asli | Kosongkan Build Command (jangan ada kata `build` di sana) |
| URL 502 **instan** setelah Live | Start Command salah ketik | Harus persis `node .next/standalone/server.js` |
| URL menggantung ±50 detik lalu masuk | **Bukan error** — instance free bangun dari tidur | Tunggu / refresh; opsional beri catatan di Devpost |
| Status tetap "Deploy failed" padahal semua benar | Cache deploy lama | Manual Deploy → **Clear build cache & deploy** |

---

## 9. Pengingat sponsor: "Render sama apa ya?"

Kontes ini punya hadiah sponsor khusus. Yang **kita benar-benar pakai** ada dua — dan ini yang layak ditonjolkan di form Devpost:

| Sponsor | Hadiahnya | Di mana kita memakainya | Bukti di repo |
|---|---|---|---|
| **Render** | *Best Use of Render* — juara 1/2/3: $1.000 / $750 / $500 Render Credits (1 pemenang per posisi) | Hosting demo (Opsi C ini!), blueprint deployment, health check | `render.yaml`, `/api/health`, cara deploy di README, proses "build di Actions → Render menyajikan" yang terdokumentasi rapi |
| **AG Grid** | *Best Use of AG Grid* | **Dispute Portfolio** — tabel 8 kasus di kokpit (kolom sortable, status chips, klik baris = buka detail) | `src/components/compass/disputes-table.tsx` + paket `ag-grid-react` di `package.json` |

Sponsor lain di daftar hadiah (**APIMatic, Bryntum, Channel3**, dll.) **tidak kita pakai** — tidak wajib, tidak masalah.

Kalimat jujur siap-tempel untuk Devpost (bagian *"How did you use Render / AG Grid?"*):

> *"Render: the repo ships a Render blueprint (`render.yaml`, health-checked at `/api/health`). Because `next build` needs 1.4–2.3 GB RAM — above the free instance's 512 MB — we build in GitHub Actions (free, 7 GB) and let Render serve the prebuilt standalone output (measured ~94 MB at runtime), so the live demo genuinely runs on Render's free tier. AG Grid: the Dispute Portfolio cockpit table is powered by AG Grid Community — sorting, status chips, and row-click case detail across 8 sandbox disputes."*

Kejujuran teknis seperti ini justru terlihat matang di mata juri — kita tidak menyembunyikan batasan, kita **merebutikasi** (mengelilinginya dengan solusi) dan mendokumentasikannya.

---

## 10. Peta jalan malam ini (jangan tertukar urutan)

1. ✅ Repo GitHub publik (bagian 2) — syarat wajib rules, prioritas #1
2. ✅ Opsi C ini (bagian 3–6) → URL `onrender.com` hidup
3. ✅ Upload video demo ke YouTube **PUBLIC** + thumbnail (`Dispute-Compass-YouTube-Thumbnail.jpg`) → link ke form
4. ✅ Isi form dari `docs/devpost-submission.md` + upload 5 screenshot (`01, 02, 03, 04, 07`)
5. ✅ **KLIK SUBMIT** — deadline **Kamis 13 Nov 2026, 03.00 WIB**; bisa edit sampai deadline asal submit pertama sudah pernah diklik

> Tersangkut di mana pun lebih dari 30 menit → **fallback: Vercel** (Opsi A di `Dispute-Compass-Render-Fix-ID.md`) → submit. URL Vercel sah 100% menurut rules; render.yaml tetap ada di repo untuk cerita sponsor Render.
