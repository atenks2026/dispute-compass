# HANDOVER — Dispute Compass (untuk Team AHVO)

> Bahasa Indonesia untuk internal tim. Semua material submission (README, Devpost, video, deck) **sudah bahasa Inggris** sesuai rules.

---

## Apa yang berubah dari versi lama tim

| Versi lama tim (v1, Flask) | Dispute Compass (sekarang) |
|---|---|
| Flask proxy ±585 baris, frontend `index.html` 61 baris — "technical proof of concept" | Next.js 16 fullstack, single-page cockpit lengkap (portfolio → case → coach → letter → send) |
| Cuma: fetch dispute → generate surat → kirim | 5 modul: **Deadline Engine** (deterministik + basis policy), **Strength Meter** (checklist berbobot), **Settlement Advisor** (accept vs offer vs fight), **AI Case Coach + Letter Studio**, **Integrity Guard** (blokir klaim absolut, wajib 3 atestasi) |
| Tidak ada mekanisme deadline | Deadline Engine 100% rule-based: 20 hari auto-close inquiry, ~10 hari seller response, 10 hari appeal, ~120 hari chargeback — persis seperti spek v2.0 tim (§6) |
| Hard-gate tidak ada, kualitas klaim tidak dicek | Integrity Guard server-side + 3 atestasi manusia — sesuai prinsip spek v2 "AI memaksimalkan kebenaran yang lengkap" |
| API key berisiko bocor di frontend (temuan A11 spek) | Semua panggilan PayPal/LLM lewat API route server-side |
| Juri harus setup .env dulu baru bisa | **Demo Mode**: 8 kasus bawaan, jalan tanpa kredensial apa pun — juri cukup `npm install && npm run dev` |
| Tidak ada sponsor tool | **AG Grid** (portfolio, peluang hadiah $1k–$5k), **render.yaml** untuk Render (hosted demo + Render credits) |
| Tidak ada test | 10 unit test (97 assertion) untuk deadline engine, strength meter, integrity guard — `bun test tests/` |

Spek v2.0 tim (`ureq-solution-spec-v2.0.md`) sudah terimplementasi hampir semuanya: triage peran (buyer/seller), deadline engine, evidence checklist + strength meter, settlement advisor, appeal dengan bukti baru, T&C Navigator dengan kutipan bersumber, Integrity Guard. Yang belum (jelasin di "What's next"): provide-evidence file upload, buyer-side journey penuh, analytics multi-case.

## Yang perlu tim kerjakan sebelum deadline (13 Nov 2026 ~03:00 WIB)

1. **Isi `.env`** (opsional tapi disarankan untuk video):
   - `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` dari developer.paypal.com (Sandbox app) — biar badge jadi "PayPal Sandbox · live" di video.
   - `LLM_API_KEY` dari NVIDIA NIM (integrate.api.nvidia.com, gratis) — biar AI Case Coach benar-benar generatif saat direkam. Tanpa ini app jalan tapi labelnya "Template".
2. **Rekam video < 3 menit** — pakai `docs/video-script.md` (sudah scene-by-scene + shot checklist). Rekam di Demo Mode 100% aman; sisipkan 1 shot live sandbox kalau mau poin ekstra.
3. **Upload ke repo publik GitHub** (repo harus public + license terlihat — `LICENSE` MIT sudah ada di root).
4. **Deploy ke Render** (opsional): Render Dashboard → New → Blueprint → pilih repo (render.yaml sudah disiapkan).
5. **Isi form Devpost** — semua field sudah siap copy-paste di `docs/devpost-submission.md` (Inspiration, What it does, How we built it, Challenges, dll + testing instructions untuk juri).
6. Cek ulang tanggal/angka di Devpost sebelum submit (submission tidak bisa diubah setelah periode tutup).

## Cara jalanin lokal (dev)

```bash
npm install        # atau bun install
npm run dev        # http://localhost:3000
bun test tests/    # 10 test offline
```

Mode tanpa kredensial = Demo Mode otomatis. Data demo ada di `src/lib/demo-data.ts` (tanggal relatif ke "sekarang", jadi countdown selalu hidup).

## Peta file penting

```
src/lib/deadline-engine.ts     deadline windows + policy basis (rule-based)
src/lib/strength-meter.ts      checklist berbobot + skor
src/lib/settlement.ts          matematika accept/offer/fight
src/lib/case-coach.ts          prompt AI + fallback template (surat & analisis)
src/lib/integrity.ts           scanner klaim absolut (BLOCKER/WARNING)
src/lib/policy-library.ts      kutipan policy + URL sumber (AI cite ini, bukan karangan)
src/lib/demo-data.ts           8 kasus demo (buyer & seller, semua stage)
src/app/api/disputes/[id]/…    analyze / letter / send (server-side)
src/components/compass/…       UI cockpit (AG Grid, deadline, meter, studio, navigator)
docs/devpost-submission.md     copy-paste Devpost
docs/video-script.md           naskah video <3 menit
Dispute-Compass-Pitch.pptx     deck pitch 9 slide
```

## Catatan integritas (penting untuk Q&A juri)

- Semua angka deadline/skor/settlement **bukan tebakan LLM** — pure function + unit test; LLM cuma dipakai untuk briefing & drafting, dan selalu di-ground ke file kasus + policy library.
- Setiap artefak AI diberi label sumber ("AI draft · model" vs "Template (no LLM key)").
- Tidak ada pengiriman otomatis: Integrity Guard + 3 atestasi wajib sebelum `send`.
- Kalau juri tanya "kenapa bukan pakai AI untuk deadline?" → jawaban: deadline itu aturan, bukan bahasa; aturan harusnya auditable dan bisa diuji.
