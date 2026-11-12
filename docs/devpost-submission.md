# Devpost Submission Copy — Dispute Compass

> Copy-paste ready for each Devpost field. All text in English per the hackathon rules.

---

## Project name

```
Dispute Compass
```

## Tagline (short pitch)

```
The AI case coach for PayPal disputes — know where you stand, settle smart, escalate right.
```

## Inspiration

PayPal disputes are a deadline-and-evidence game that ordinary buyers and sellers play blind. Inquiries auto-close after 20 days if the buyer doesn't escalate. Sellers get roughly 10 days to respond to a claim. After a decision, an appeal is generally only possible within about 10 days — and a closed dispute can never be reopened. Card chargebacks run on issuer-dependent windows of up to ~120 days.

The result: people lose not because they're wrong, but because they missed a window, didn't know what evidence counts, or let the peaceful path (a structured offer inside the negotiation window) slip by. We audited our own earlier build and found the real product wasn't "a better letter" — it was a map: where am I, what's ticking, what counts, what's the cheapest way out.

## What it does

Dispute Compass is a single-page case cockpit over the PayPal Disputes API:

- **Deadline Engine** — deterministic, rule-based countdowns for every window (20-day inquiry auto-close, ~10-day claim response, ~10-day appeal, ~120-day chargeback ceiling), each showing its policy basis, the consequence of missing it, and the recommended next action. Never LLM-generated.
- **Evidence Strength Meter** — a weighted checklist that mirrors what reviewers look for (carrier tracking, proof of delivery, address match, listing snapshots…). The score updates live as evidence is verified.
- **Settlement Advisor** — transparent math comparing accept vs. structured offer (~30–60% refund via PayPal make-offer) vs. fight, with a win probability derived from the evidence score rather than guessed.
- **AI Case Coach** — an LLM brief grounded in the case file: verifiable strengths, what a reviewer will question, the best opening move, and ordered next actions.
- **Letter Studio** — drafts messages, offer notes, evidence cover notes and appeals through the LLM, with a template fallback when no key is configured. Appeals are forced to argue *new* evidence.
- **Integrity Guard** — server-side scan for absolute claims ("never received", "fraud", "counterfeit"). Blockers stop the send until three human attestations are signed. Principle: *AI maximizes complete truth, not engineered victory.*
- **T&C Navigator** — curated PayPal policy excerpts with source URLs and retrieval dates; the AI cites these IDs and never invents policy text.

## How we built it

- **Next.js 16 (App Router, TypeScript)** — one page cockpit; all PayPal/LLM calls proxied through server routes so credentials never reach the browser.
- **PayPal Disputes API (sandbox)** — OAuth client credentials; list, detail, send-message, make-offer, appeal, accept-claim.
- **OpenAI-compatible LLM adapter** — defaults to NVIDIA NIM (`nvidia/nemotron-3.5-super-vl-120b-a12b`); any OpenAI-compatible endpoint works via `.env`.
- **Deterministic core with unit tests** — deadline engine, strength meter and integrity guard are pure functions covered by `bun test tests/` (10 tests, 97 assertions).
- **AG Grid Community** (sponsor tool) — the dispute portfolio: sorting, keyboard navigation, deadline-countdown dots.
- **Render-ready** — `render.yaml` blueprint included for one-click deployment.
- **Demo Mode** — 8 built-in cases with dates computed relative to *now*, mutable in-session, so judges can exercise every feature with zero credentials. Live-mode failures fall back to Demo Mode visibly.

## Challenges we ran into

- Early on our team's v1 was a thin Flask proxy that generated appeal letters — a technical proof of concept, not a product. A self-audit surfaced 14 issues, including the biggest one: the product was optimizing the letter when the real battle is deadlines and evidence. Rebuilding around the deadline engine changed everything.
- Making AI trustworthy in a disputes context: we solved it by confining the LLM to briefing/drafting, grounding it in curated policy quotes with sources, and putting a rule-based Integrity Guard plus mandatory attestations between every draft and every send.
- Keeping the demo judge-friendly: everything works with no PayPal account and no LLM key, and every AI artifact is honestly labeled ("AI draft · model" vs "Template").

## Accomplishments that we're proud of

- Rules do the math, AI does the language — and we can prove it with unit tests.
- The full product runs in under a minute for a judge: `npm install && npm run dev`.
- The Integrity Guard means the tool cannot be used to fabricate claims without deliberate human attestation — a stance we think matters for the payments ecosystem.

## What we learned

- The PayPal dispute lifecycle is richer than "dispute → decision": inquiries, claims, offers, evidence windows, appeals and chargeback rules each have their own clock. Encoding them as auditable rules (with their policy basis shown in the UI) beats asking an LLM to guess deadlines.
- Demo-first architecture is a hackathon superpower: the same code path serves mock and live data, so nothing on camera depends on network luck.

## What's next for Dispute Compass

- Live-sandbox two-way flows: provide-evidence file upload and buyer-side journey polish.
- More jurisdictions: localized policy libraries with per-region quotes.
- Multi-case analytics for merchants: root-cause clustering of disputes by SKU, carrier and reason.

## Built with

```
next.js, typescript, tailwindcss, shadcn/ui, ag-grid, paypal-disputes-api, paypal-sandbox, nvidia-nim, llm, bun, render
```

## Tools identification (Devpost "Tools" field)

- **AI:** NVIDIA NIM (OpenAI-compatible adapter; deterministic fallback without a key)
- **PayPal:** Disputes API v1 (sandbox), OAuth 2.0 client credentials
- **Sponsor tools:** AG Grid (Community) for the dispute portfolio; Render for hosting (render.yaml included)
- **Other:** Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, Bun (tests)

## Testing instructions for judges

1. Unzip and enter the project: `npm install` (or `bun install`).
2. `npm run dev` → open `http://localhost:3000`. Demo Mode badge on top-right.
3. Click any case in the AG Grid portfolio (sorted by nearest deadline).
4. On case **PP-D-27404**: open *AI Case Coach* → *Brief me on this case*; open *Letter Studio* → pick **Appeal after decision** → *Generate draft* → tick all three attestations → **Submit appeal** → status flips to *under review*.
5. On case **PP-D-27402**: open *Evidence & Strength*, toggle checkboxes and watch the score; the Settlement Advisor's recommended option changes with it.
6. Optional live mode: add `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` from developer.paypal.com (sandbox) to `.env`, restart, refresh — the badge switches to *PayPal Sandbox · live*.
7. Optional AI mode: add `LLM_API_KEY` (NVIDIA NIM or any OpenAI-compatible key). Without it, drafts come from templates and are labeled as such.
8. `npm test` is not required to judge, but `bun test tests/` runs 10 offline unit tests.

> No credentials of any kind are needed for steps 1–5. The hosted demo URL (if provided) runs the same Demo Mode.
