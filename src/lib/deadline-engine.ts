/**
 * Dispute Compass — deterministic Deadline Engine.
 *
 * Rule-based (never LLM). Windows follow published PayPal dispute-process
 * policy; each result carries its policy basis so the UI can show *why* a
 * deadline exists. Dates the user can act on are estimates derived from the
 * dispute's create/update timestamps and labeled as policy-derived.
 */

import type { DeadlineKind, DeadlineWindow, Dispute } from './types';

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Policy windows (days), per PayPal dispute-process documentation. */
export const POLICY_WINDOWS = {
  /** Buyer must escalate an inquiry to a claim before it auto-closes. */
  BUYER_ESCALATE_DAYS: 20,
  /** Seller typically has ~10 days to respond once a claim is opened. */
  SELLER_RESPOND_DAYS: 10,
  /** Appeal window after a final decision, where eligible. */
  APPEAL_DAYS: 10,
  /** Card-network chargeback window is issuer/network dependent (~120 days is a common ceiling). */
  CHARGEBACK_CEILING_DAYS: 120,
} as const;

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  return Math.floor((to - from) / DAY_MS);
}

function addDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * DAY_MS).toISOString();
}

function urgencyFor(daysRemaining: number): DeadlineWindow['urgency'] {
  if (daysRemaining < 0) return 'MISSED';
  if (daysRemaining <= 2) return 'URGENT';
  if (daysRemaining <= 5) return 'WATCH';
  return 'SAFE';
}

interface WindowSpec {
  kind: DeadlineKind;
  label: string;
  windowDays: number;
  anchorDate: string;
  basis: string;
  consequence: string;
  recommendedAction: string;
}

function buildWindow(spec: WindowSpec, nowIso: string): DeadlineWindow {
  const dueDate = addDays(spec.anchorDate, spec.windowDays);
  const daysRemaining = daysBetween(nowIso, dueDate);
  return {
    kind: spec.kind,
    label: spec.label,
    windowDays: spec.windowDays,
    anchorDate: spec.anchorDate,
    dueDate,
    daysRemaining,
    urgency: urgencyFor(daysRemaining),
    basis: spec.basis,
    consequence: spec.consequence,
    recommendedAction: spec.recommendedAction,
  };
}

/**
 * Compute every active / recently-lapsed deadline window for a dispute.
 * Windows are derived from the dispute lifecycle stage + status + timestamps.
 */
export function computeDeadlines(dispute: Dispute, now: Date = new Date()): DeadlineWindow[] {
  const nowIso = now.toISOString();
  const windows: DeadlineWindow[] = [];

  const openAnchor = dispute.create_time;

  if (dispute.stage === 'OPEN_INQUIRIES') {
    if (dispute.actorRole === 'BUYER') {
      windows.push(
        buildWindow(
          {
            kind: 'BUYER_ESCALATE',
            label: 'Escalate inquiry to a claim',
            windowDays: POLICY_WINDOWS.BUYER_ESCALATE_DAYS,
            anchorDate: openAnchor,
            basis: 'PayPal dispute lifecycle: an inquiry auto-closes 20 days after opening if the buyer does not escalate it to a claim.',
            consequence:
              'The inquiry closes automatically and cannot be reopened. To pursue the case you would need a new dispute (if still eligible) or a card chargeback.',
            recommendedAction:
              'If the seller has not resolved it, escalate to a claim before the deadline — with your evidence package ready.',
          },
          nowIso,
        ),
      );
    } else {
      windows.push(
        buildWindow(
          {
            kind: 'AUTO_CLOSE',
            label: 'Inquiry auto-close countdown (buyer must escalate)',
            windowDays: POLICY_WINDOWS.BUYER_ESCALATE_DAYS,
            anchorDate: openAnchor,
            basis: 'PayPal dispute lifecycle: an inquiry auto-closes 20 days after opening if the buyer does not escalate.',
            consequence:
              'If the buyer does not escalate, the inquiry closes with no claim against you. Do not refund reflexively — use the countdown to send a strong resolution message instead.',
            recommendedAction:
              'Send a clear, friendly message via the compass (tracking, ETA, refund path) so the buyer never needs to escalate.',
          },
          nowIso,
        ),
      );
    }
  }

  if (dispute.stage !== 'OPEN_INQUIRIES' && dispute.status === 'OPEN') {
    windows.push(
      buildWindow(
        {
          kind: 'SELLER_RESPOND',
          label: 'Seller response to claim',
          windowDays: POLICY_WINDOWS.SELLER_RESPOND_DAYS,
          anchorDate: openAnchor,
          basis: 'PayPal dispute process: sellers are generally asked to respond to a claim within about 10 days of it being opened.',
          consequence:
            'PayPal may decide the claim in the buyer’s favor by default, and the decision can be final — no appeal for non-response.',
          recommendedAction:
            'Respond now: submit evidence via the compass, make a structured offer, or accept the claim if the case is weak.',
        },
        nowIso,
      ),
    );
  }

  if (dispute.status === 'UNDER_REVIEW') {
    windows.push(
      buildWindow(
        {
          kind: 'PROVIDE_EVIDENCE',
          label: 'Evidence submission (case under review)',
          windowDays: POLICY_WINDOWS.SELLER_RESPOND_DAYS,
          anchorDate: dispute.update_time,
          basis: 'PayPal dispute process: parties are given a short window (~10 days from the status change) to complete evidence before review concludes.',
          consequence:
            'The review concludes on the evidence on file. Missing evidence usually means losing the case by default.',
          recommendedAction:
            'Complete the evidence checklist and submit everything that exists today — partial evidence rarely improves on a later appeal.',
        },
        nowIso,
      ),
    );
  }

  if (dispute.status === 'RESOLVED_BUYER_FAVOR' && dispute.actorRole === 'SELLER') {
    windows.push(
      buildWindow(
        {
          kind: 'APPEAL',
          label: 'Appeal window after decision',
          windowDays: POLICY_WINDOWS.APPEAL_DAYS,
          anchorDate: dispute.update_time,
          basis: 'PayPal dispute process: an appeal is generally only possible within ~10 days after the final decision, for eligible outcomes.',
          consequence:
            'The decision becomes final and the fund movement stands. Closed disputes cannot be reopened.',
          recommendedAction:
            'Generate the appeal letter now, verify every claim against the Integrity Guard, and submit it with new evidence — not the same evidence.',
        },
        nowIso,
      ),
    );
  }

  if (dispute.stage === 'CHARGEBACK') {
    windows.push(
      buildWindow(
        {
          kind: 'SELLER_RESPOND',
          label: 'Chargeback response (issuer window)',
          windowDays: POLICY_WINDOWS.CHARGEBACK_CEILING_DAYS,
          anchorDate: openAnchor,
          basis:
            'Card-network rules: cardholders generally have up to ~120 days (network- and issuer-dependent) to file a chargeback; the issuer sets the exact deadline.',
          consequence:
            'If unchallenged, the chargeback stands and the amount plus a network fee leaves your balance.',
          recommendedAction:
            'Submit compelling evidence through PayPal immediately — chargeback outcomes are driven almost entirely by evidence quality.',
        },
        nowIso,
      ),
    );
  }

  return windows;
}

/** Single "what do I do next" helper for dashboards and the video demo. */
export function nextAction(dispute: Dispute, now: Date = new Date()): { window: DeadlineWindow | null; callToAction: string } {
  const windows = computeDeadlines(dispute, now).filter((w) => w.daysRemaining >= 0);
  if (windows.length === 0) {
    return {
      window: null,
      callToAction:
        dispute.status === 'RESOLVED_SELLER_FAVOR'
          ? 'Resolved in your favor — log the playbook that worked.'
          : 'No active deadline. Archive the case and apply lessons to the next one.',
    };
  }
  windows.sort((a, b) => a.daysRemaining - b.daysRemaining);
  const w = windows[0];
  return { window: w, callToAction: w.recommendedAction };
}
