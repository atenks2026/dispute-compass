/**
 * Dispute Compass — AI Case Coach orchestration.
 *
 * Two AI surfaces, both with deterministic fallbacks:
 *  1. Case analysis  — strategy, strengths/weaknesses, negotiation angle
 *  2. Letter drafting — message / offer note / appeal / evidence note
 *
 * Every output is tagged with its source ("AI" vs "TEMPLATE") and every
 * letter passes through the Integrity Guard before it can be sent.
 */

import { chatComplete, llmStatus, parseJsonLoose } from './llm';
import { scanIntegrity } from './integrity';
import { POLICY_LIBRARY } from './policy-library';
import type { CaseAnalysis, Dispute, EvidenceCheck, GeneratedLetter, LetterKind, StrengthResult } from './types';

/* ------------------------------ shared context -------------------------------- */

function disputeContext(dispute: Dispute, strength: StrengthResult, checks: EvidenceCheck[]): string {
  const msgLog = dispute.messages
    .slice(-6)
    .map((m) => `[${m.posted_by} @ ${m.time.slice(0, 10)}] ${m.content}`)
    .join('\n');
  const evidence = checks.map((c) => `- [${c.checked ? 'X' : ' '}] ${c.label} (weight ${c.weight})`).join('\n');
  return `DISPUTE CONTEXT
Case: ${dispute.dispute_id} | Stage: ${dispute.stage} | Status: ${dispute.status} | Reason: ${dispute.reason}
User role in this case: ${dispute.actorRole}
Amount: ${dispute.amount.value} ${dispute.amount.currency}
Opened: ${dispute.create_time.slice(0, 10)} | Last update: ${dispute.update_time.slice(0, 10)}
${dispute.dispute_outcome ? `Outcome so far: ${dispute.dispute_outcome.outcome_code}` : ''}
Transaction: ${dispute.transaction.item_description || 'n/a'} (${dispute.transaction.transaction_id})
Buyer note: ${dispute.transaction.buyer_note || 'n/a'}

EVIDENCE CHECKLIST (evidence strength ${strength.score}/100 — ${strength.band}):
${evidence || '- none recorded'}

RECENT MESSAGE LOG (newest last):
${msgLog || '(no messages yet)'}

VERIFIED POLICY EXCERPTS AVAILABLE FOR CITATION (do not invent others):
${POLICY_LIBRARY.map((p) => `- ${p.title} [${p.id}] — "${p.quote}" (${p.policy})`).join('\n')}`;
}

const SYSTEM_COACH = `You are the Dispute Compass case coach. You help PayPal buyers and sellers maximize COMPLETE TRUTH, not engineered victories.
Hard rules:
- Ground every statement in the provided context; if something is unknown, say what to verify instead of guessing.
- Never fabricate dates, amounts, tracking numbers, or policy text. Cite policy only by the [POL-*] ids provided.
- Be concrete and procedural: what to send, to whom, by when, and why it matters.
- Keep a calm, professional tone; no threats, no overpromising.`;

/* -------------------------------- 1. Analysis --------------------------------- */

interface RawAnalysis {
  caseSummary?: string;
  strengths?: string[];
  weaknesses?: string[];
  negotiationAngle?: string;
  nextBestActions?: string[];
  riskNotes?: string[];
}

export async function analyzeCase(dispute: Dispute, strength: StrengthResult, checks: EvidenceCheck[]): Promise<CaseAnalysis> {
  const status = llmStatus();
  if (!status.configured) return heuristicAnalysis(dispute, strength, checks);

  try {
    const raw = await chatComplete({
      system: SYSTEM_COACH,
      temperature: 0.25,
      maxTokens: 900,
      jsonMode: true,
      messages: [
        {
          role: 'user',
          content: `${disputeContext(dispute, strength, checks)}

TASK: Produce a JSON object with exactly these keys:
- "caseSummary": 2-3 sentences on where this case stands right now.
- "strengths": 2-4 short strings (what is verifiably strong).
- "weaknesses": 2-4 short strings (what a reviewer will question).
- "negotiationAngle": 2-3 sentences on the best opening move and why.
- "nextBestActions": 3-5 imperative strings, ordered by urgency.
- "riskNotes": 1-3 strings (integrity/strategy risks to avoid).`,
        },
      ],
    });
    const parsed = parseJsonLoose<RawAnalysis>(raw);
    if (!parsed?.caseSummary) throw new Error('BAD_JSON');
    return {
      caseSummary: parsed.caseSummary,
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      negotiationAngle: parsed.negotiationAngle || '',
      nextBestActions: parsed.nextBestActions || [],
      riskNotes: parsed.riskNotes || [],
      source: 'AI',
      model: status.model,
    };
  } catch {
    return heuristicAnalysis(dispute, strength, checks);
  }
}

function heuristicAnalysis(dispute: Dispute, strength: StrengthResult, checks: EvidenceCheck[] = []): CaseAnalysis {
  const missing = strength.missingCritical.map((m) => m.label);
  const confirmed = checks.filter((c) => c.checked).map((c) => c.label.toLowerCase());
  return {
    caseSummary: `Case ${dispute.dispute_id} (${dispute.reason.replace(/_/g, ' ').toLowerCase()}, ${dispute.amount.value} ${dispute.amount.currency}) is at stage ${dispute.stage.replace(/_/g, ' ').toLowerCase()} with status ${dispute.status.replace(/_/g, ' ').toLowerCase()}. Evidence strength is ${strength.score}/100 (${strength.band}). The compass generated this brief in heuristic mode because no LLM key is configured.`,
    strengths: confirmed.length
      ? [`Confirmed records: ${confirmed.join('; ')}.`]
      : ['Currently no high-weight evidence is confirmed.'],
    weaknesses: missing.length ? [`Missing high-weight evidence: ${missing.join('; ')}.`] : ['No critical gaps detected in the checklist.'],
    negotiationAngle:
      strength.band === 'STRONG'
        ? 'Open with the verified facts (tracking/POD/verification) and offer a courtesy path first — strength lets you be generous without risk.'
        : 'Open with a structured partial offer while you finish evidence collection; keeps the case inside the negotiation window.',
    nextBestActions: [
      'Verify every unchecked high-weight evidence item that is true today.',
      'Send a calm, factual message to the counterparty (draft ready in the Letter Studio).',
      'Re-run the strength meter after new evidence and re-read the settlement advisor.',
      'Act before the next deadline shown in the Deadline Engine.',
    ],
    riskNotes: [
      'Heuristic mode: add an LLM key (LLM_API_KEY) for strategy-depth and letter drafting.',
      'Never submit a claim that the checklist cannot support — the Integrity Guard will block it.',
    ],
    source: 'HEURISTIC',
  };
}

/* --------------------------------- 2. Letters --------------------------------- */

const LETTER_SPECS: Record<LetterKind, { label: string; instructions: string }> = {
  MESSAGE_TO_BUYER: {
    label: 'Message to the counterparty',
    instructions:
      'Write a calm, factual message from the user to the counterparty. Acknowledge their complaint, state the verifiable facts, and offer the concrete resolution path. 120-180 words. No legalese, no threats.',
  },
  OFFER_NOTE: {
    label: 'Settlement offer note',
    instructions:
      'Write the note that accompanies a PayPal make-offer action. State the offer amount, what it covers, and why it is fair for both sides. 80-130 words.',
  },
  APPEAL: {
    label: 'Appeal after decision',
    instructions:
      'Write a formal appeal. Structure: (1) case reference and decision being appealed, (2) NEW evidence or corrected facts (never restate old evidence as new), (3) exact policy citation by [POL-*] id where relevant, (4) the specific remedy requested. 180-280 words, formal register.',
  },
  EVIDENCE_NOTE: {
    label: 'Evidence cover note',
    instructions:
      'Write the cover note submitted alongside an evidence package. List what each attachment proves, mapped to the checklist. 100-160 words.',
  },
};

export interface LetterRequest {
  dispute: Dispute;
  kind: LetterKind;
  strength: StrengthResult;
  checks: EvidenceCheck[];
  extraContext?: string;
  tone?: 'professional' | 'firm' | 'conciliatory';
}

export async function generateLetter(req: LetterRequest): Promise<GeneratedLetter> {
  const { dispute, kind, strength, checks } = req;
  const spec = LETTER_SPECS[kind];
  const status = llmStatus();

  if (status.configured) {
    try {
      const raw = await chatComplete({
        system: SYSTEM_COACH,
        temperature: 0.35,
        maxTokens: 1000,
        messages: [
          {
            role: 'user',
            content: `${disputeContext(dispute, strength, checks)}

TASK: Draft the ${spec.label}.
${spec.instructions}
Tone: ${req.tone || 'professional'}. Signed as "${dispute.actorRole === 'SELLER' ? dispute.seller_name : dispute.buyer_name}".
${req.extraContext ? `Extra user-provided context (use it, do not contradict it): ${req.extraContext}` : ''}

Return JSON: {"subject": "...", "body": "..."}. The body must cite at most one policy by its [POL-*] id (in brackets at the end of the relevant sentence).`,
          },
        ],
      });
      const parsed = parseJsonLoose<{ subject?: string; body?: string }>(raw);
      if (parsed?.body) {
        const body = parsed.body.trim();
        const cited = POLICY_LIBRARY.filter((p) => body.includes(p.id)).map((p) => `${p.id} — ${p.title}`);
        return {
          kind,
          subject: parsed.subject?.trim() || `${spec.label} — ${dispute.dispute_id}`,
          body,
          source: 'AI',
          model: status.model,
          integrityWarnings: scanIntegrity(body, checks).map((f) => `${f.severity}: ${f.concern}`),
          citedPolicies: cited,
        };
      }
    } catch {
      // fall through to template
    }
  }

  return templateLetter(req);
}

function templateLetter(req: LetterRequest): GeneratedLetter {
  const { dispute, kind, strength, checks } = req;
  const role = dispute.actorRole === 'SELLER' ? dispute.seller_name : dispute.buyer_name;
  const proven = checks.filter((c) => c.checked).map((c) => c.label.toLowerCase());
  const missing = checks.filter((c) => !c.checked && c.weight >= 25).map((c) => c.label.toLowerCase());
  const amount = `${dispute.amount.value} ${dispute.amount.currency}`;

  let subject = '';
  let body = '';

  if (kind === 'MESSAGE_TO_BUYER') {
    subject = `About your ${dispute.reason.replace(/_/g, ' ').toLowerCase()} case ${dispute.dispute_id}`;
    body = `Hello ${dispute.buyer_name.split('.')[0]},

Thank you for raising this, and I am sorry this order has been frustrating. Here is where things stand on case ${dispute.dispute_id} (${amount}):
${proven.length ? `\nWhat I can verify today: ${proven.join(', ')}.\n` : ''}
${missing.length ? `I am aware the following records are still missing and I am on them: ${missing.join(', ')}.\n` : ''}
My goal is to close this in a way that is fair to both of us. If the fastest path is a concrete resolution — a replacement, a partial refund, or a full refund where the facts support it — I am ready to arrange it through PayPal today. If you prefer, reply with what a good outcome looks like for you and I will respond within one business day.

Best regards,
${role}`;
  } else if (kind === 'OFFER_NOTE') {
    subject = `Settlement offer — case ${dispute.dispute_id}`;
    body = `To resolve case ${dispute.dispute_id} fairly and quickly, I am offering a structured settlement through PayPal for this ${amount} order.

The offer reflects what I can verify today: ${proven.join(', ') || 'the records currently on file'}. I believe this is a fair balance — it compensates you without waiting for a full review cycle, and it closes the case for both of us. If the amount or terms need adjusting, say so in the negotiation window and I will consider it in good faith.

— ${role}`;
  } else if (kind === 'APPEAL') {
    subject = `Appeal of decision on case ${dispute.dispute_id}`;
    body = `Dear Resolution Team,

I respectfully appeal the decision on case ${dispute.dispute_id} (${dispute.reason.replace(/_/g, ' ').toLowerCase()}, ${amount}), decided ${dispute.update_time.slice(0, 10)}.

NEW information available since the decision:
${proven.length ? `- ${proven.join(';\n- ')}.\n` : '- (describe the new evidence here — an appeal should not restate the original submission).\n'}
${missing.length ? `Records still being obtained: ${missing.join(', ')}.\n` : ''}
Policy basis: [POL-APPEAL-10D] — an appeal is generally possible within ~10 days after the decision, based on new evidence.

Requested remedy: reversal of the decision, or the specific alternative the facts support. I can provide every referenced record on request.

Sincerely,
${role}`;
  } else {
    subject = `Evidence package — case ${dispute.dispute_id}`;
    body = `Dear Reviewer,

Submitting the evidence package for case ${dispute.dispute_id} (${amount}).

What each item verifies:
${checks.map((c) => `- ${c.label}: ${c.checked ? 'provided' : 'not available — will follow if obtained'} (proves: ${c.description.toLowerCase()})`).join('\n')}

I ask that the review consider the package as a whole; each item corroborates the others.

Sincerely,
${role}`;
  }

  const cited = POLICY_LIBRARY.filter((p) => body.includes(p.id)).map((p) => `${p.id} — ${p.title}`);
  return {
    kind,
    subject,
    body,
    source: 'TEMPLATE',
    integrityWarnings: scanIntegrity(body, checks).map((f) => `${f.severity}: ${f.concern}`),
    citedPolicies: cited,
  };
}
