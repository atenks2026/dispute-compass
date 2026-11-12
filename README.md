# Dispute Compass — AI Case Coach for PayPal Disputes

> **Know where you stand. Settle smart. Escalate right.**

Dispute Compass is an AI case coach for PayPal disputes. It helps buyers and sellers understand where a case stands, what deadline is ticking, what evidence actually counts, which resolution path is cheapest — and it drafts the message, offer note or appeal that closes the case. Built for the **PayPal AI Hackathon** on the **PayPal Disputes API (sandbox)**.

**The problem it solves:** PayPal disputes are a deadline-and-evidence game. Inquiries auto-close after 20 days, sellers get ~10 days to respond, appeals live in a ~10-day post-decision window — and closed disputes *cannot be reopened*. Most users lose not because they are wrong, but because they miss a window or send the wrong evidence. Dispute Compass turns that invisible process into one visible cockpit.

---

## Quick start (judges — 60 seconds, no credentials needed)

```bash
bun install          # or: npm install
bun run dev          # or: npm run dev
# open http://localhost:3000
```

That's it. The app boots in **Demo Mode** with 8 built-in cases covering every lifecycle stage (inquiry, claim, chargeback, review, decided). Every feature works out of the box.

```bash
bun test tests/      # 10 deterministic unit tests, no network needed
```

## Connecting the real PayPal Sandbox (optional, 3 minutes)

1. Log in at [developer.paypal.com](https://developer.paypal.com/) (any PayPal account) → **Apps & Credentials → Sandbox → Create App**.
2. Copy the **Client ID** and **Secret** into `.env` (see `.env.example`).
3. Restart the server. The header badge switches from `Demo Mode` to `PayPal Sandbox · live`, and the app now reads your sandbox disputes through `GET /v1/customer/disputes`.

> If the live call fails (empty sandbox, expired token), the app **falls back to Demo Mode and says so in the UI** — it never pretends.

## Turning on AI (optional, 2 minutes)

The AI Case Coach and Letter Studio use any OpenAI-compatible LLM. Default config targets **NVIDIA NIM** (free account at integrate.api.nvidia.com):

```env
LLM_API_KEY=nvapi-...                 # (alias: NIM_API_KEY)
LLM_BASE_URL=https://integrate.api.nvidia.com/v1
LLM_MODEL=nvidia/nemotron-3.5-super-vl-120b-a12b
```

Any OpenAI-compatible endpoint works (OpenAI, Azure, local vLLM…). **Without a key, every AI feature degrades to deterministic templates and clearly labels its output** — "Template (no LLM key)" vs "AI draft · <model>". The compass never fakes intelligence.

## What's inside

| Feature | How it works | Where |
|---|---|---|
| **Deadline Engine** | 100% deterministic, rule-based windows (20-day inquiry auto-close, ~10-day seller response, ~10-day appeal, ~120-day chargeback ceiling) — each with its policy basis, consequence and recommended action. Never LLM-generated. | `src/lib/deadline-engine.ts` |
| **Evidence Strength Meter** | Weighted checklist per dispute reason (tracking, POD, address match, listing snapshot…). Score updates live as you tick items. | `src/lib/strength-meter.ts` |
| **Settlement Advisor** | Transparent cost-of-options math: accept vs structured offer (~30–60%) vs fight — with win probability derived from the evidence score, not guessed. | `src/lib/settlement.ts` |
| **AI Case Coach** | LLM brief grounded in the case file: strengths, weaknesses, opening move, next best actions. Heuristic fallback without a key. | `src/lib/case-coach.ts` |
| **Letter Studio** | Drafts message / offer note / appeal / evidence cover note. Appeals are forced to argue **new evidence**, never restated old evidence. | `src/app/api/disputes/[id]/letter/` |
| **Integrity Guard** | Server-side scan for absolute claims ("never received", "fraud", "counterfeit"). Blockers stop the send until the user signs 3 attestations. Principle: *AI maximizes complete truth, not engineered victory.* | `src/lib/integrity.ts`, `src/app/api/disputes/[id]/send/` |
| **T&C Navigator** | Curated policy excerpts with source URLs + retrieval dates. AI cites these IDs; it never invents policy text. If nothing matches, it says so. | `src/lib/policy-library.ts` |
| **Dispute portfolio (AG Grid)** | Sortable, keyboard-navigable portfolio table with deadline countdown dots (AG Grid Community — sponsor tool). | `src/components/compass/disputes-table.tsx` |
| **Demo Mode** | 8 realistic cases with dates computed relative to *now*, mutable in memory (sends append messages, offers flip status) so the demo feels real. | `src/lib/demo-data.ts` |

### PayPal Disputes API surface used

- `POST /v1/oauth2/token` — client-credentials OAuth (server-side only)
- `GET /v1/customer/disputes` — portfolio list
- `GET /v1/customer/disputes/{id}` — case detail
- `POST .../send-message` · `POST .../make-offer` · `POST .../appeal` · `POST .../accept-claim` — actions (all proxied server-side; keys never reach the browser)

## Architecture

```
Next.js 16 (App Router, TypeScript)
├─ src/app/page.tsx                  single-page cockpit (client)
├─ src/app/api/…                     server routes: health, disputes, analyze, letter, send
├─ src/lib/paypal-client.ts          PayPal OAuth + Disputes API (server only)
├─ src/lib/llm.ts                    OpenAI-compatible adapter (NVIDIA NIM default)
├─ src/lib/deadline-engine.ts        deterministic deadline windows (+ unit tests)
├─ src/lib/strength-meter.ts         weighted evidence checklist (+ unit tests)
├─ src/lib/settlement.ts             cost-of-options math
├─ src/lib/integrity.ts              risky-claim scanner (+ unit tests)
├─ src/lib/policy-library.ts         curated, sourced policy quotes
├─ src/lib/demo-data.ts | demo-store.ts   Demo Mode dataset + session store
└─ src/components/compass/           AG Grid table, deadline card, strength meter,
                                     settlement advisor, coach, letter studio, T&C nav
```

**Design decisions worth noting**

- *Rules do the math, AI does the language.* Deadlines, scores and settlement numbers are deterministic and unit-tested; the LLM is confined to briefing and drafting, always grounded in the case file and the curated policy library.
- *Judging friction ≈ zero.* Demo Mode means the full product works with no PayPal account, no LLM key, and no network. Credentials upgrade the demo; they are never required to see it run.
- *Honesty as a feature.* Every AI artifact carries its source badge; live failures fall back to Demo Mode visibly; policy quotes link to their sources with retrieval dates.

## Deploy (Render — one click)

A `render.yaml` blueprint is included (web service + env vars). In Render: **New → Blueprint → point at this repo**. For any Node host:

```bash
npm ci && npm run build && npm start   # serves on $PORT
```

## AI-tools disclosure (Devpost requirement)

- **AI used:** an OpenAI-compatible LLM (default NVIDIA NIM, `nvidia/nemotron-3.5-super-vl-120b-a12b`) for (1) case-coach briefs and (2) message/offer/appeal drafts. Both are grounded prompts over the case file + curated policy quotes.
- **Deterministic non-AI core:** Deadline Engine, Strength Meter, Settlement Advisor, Integrity Guard, Demo dataset — pure rules, unit-tested.
- **Transparency:** every generated artifact is tagged `AI draft · <model>` or `Template (no LLM key)`. Letters must pass Integrity Guard + 3 human attestations before any send. Nothing is ever auto-sent.
- **AI-assisted development:** portions of this codebase were drafted with AI coding assistance and reviewed/tested by the team (see LICENSE and repo history).

## Team AHVO

Built by **Team AHVO** for the PayPal AI Hackathon (Devpost), November 2026. MIT licensed — see [LICENSE](./LICENSE).
