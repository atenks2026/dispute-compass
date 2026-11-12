/**
 * Dispute Compass — Settlement Advisor.
 *
 * Transparent, rule-based cost-of-options math. It makes the "peaceful path"
 * visible early (the window most users let slip by) instead of defaulting to
 * "fight everything".
 */

import type { Dispute, SettlementOption, SettlementResult } from './types';

export function computeSettlement(dispute: Dispute, strengthScore: number): SettlementResult {
  const amount = Number(dispute.amount.value) || 0;
  const currency = dispute.amount.currency;
  const pWin = Math.min(0.95, Math.max(0.05, strengthScore / 100)); // honest, score-driven

  const acceptOut = amount;
  // Partial offers between 30–60% resolve most no-show / mismatch claims cheaply.
  const offerPct = strengthScore >= 70 ? 0.3 : strengthScore >= 40 ? 0.45 : 0.6;
  const offerAmount = Math.round(amount * offerPct * 100) / 100;
  const fightCost = Math.round(amount * (1 - pWin) * 100) / 100;

  const options: SettlementOption[] = [
    {
      id: 'ACCEPT_CLAIM',
      title: 'Accept the claim',
      description: 'Close it now, refund in full. Cleanest outcome for a case you believe you should lose.',
      grossOutflow: acceptOut,
      expectedCost: acceptOut,
      winProbability: 1,
      timeDays: 1,
      recommended: false,
      rationale: `Cost is certain (${acceptOut.toFixed(2)} ${currency}); zero further time spent.`,
    },
    {
      id: 'MAKE_OFFER',
      title: `Make a structured offer (~${Math.round(offerPct * 100)}% refund)`,
      description: 'Partial refund through PayPal’s make-offer flow. The buyer keeps the item (or returns it) and the case closes.',
      grossOutflow: offerAmount,
      expectedCost: offerAmount,
      winProbability: 1,
      timeDays: 3,
      recommended: false,
      rationale: `Between the certainty of a full refund and the risk of a fight — and it stays inside the negotiation window where most cases actually end.`,
    },
    {
      id: 'FIGHT',
      title: 'Fight with evidence',
      description: 'Submit the evidence package (and appeal if needed) and let the reviewer decide.',
      grossOutflow: 0,
      expectedCost: fightCost,
      winProbability: pWin,
      timeDays: 14,
      recommended: false,
      rationale: `Evidence strength ${strengthScore}/100 → heuristic case-strength score (not a win probability). Risk-adjusted cost ${fightCost.toFixed(2)} ${currency} plus ~2 weeks of attention.`,
    },
  ];

  // Recommendation logic: fight only pays when evidence is strong; offers win the middle; accept for weak cases.
  let best = 'FIGHT';
  if (strengthScore >= 70) best = 'FIGHT';
  else if (strengthScore >= 40) best = 'MAKE_OFFER';
  else best = strengthScore < 25 && amount < 100 ? 'ACCEPT_CLAIM' : 'MAKE_OFFER';

  const rec = options.find((o) => o.id === best);
  if (rec) rec.recommended = true;

  const notes: string[] = [];
  if (dispute.feeRefundEligible) {
    notes.push('Fee refund eligible: if you win, PayPal also returns the fixed fee — a real margin saver on small tickets.');
  }
  notes.push('Case-strength score is derived from the evidence checklist score, not from an LLM guess — it updates as evidence changes. Not a prediction of outcome.');
  if (dispute.stage === 'CHARGEBACK') {
    notes.push('Chargeback: offers do not apply; the paths are compelling evidence or accepting the chargeback.');
  }

  return { amount, currency, feeRefundEligible: Boolean(dispute.feeRefundEligible), options, bestOptionId: best, notes };
}
