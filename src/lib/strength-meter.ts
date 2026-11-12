/**
 * Dispute Compass — Evidence Strength Meter.
 *
 * Rule-based scoring (deterministic, explainable). The checklist encodes what
 * PayPal review teams actually look for per dispute reason. AI comments on
 * the result; it never invents the score.
 */

import type { Dispute, DisputeReason, EvidenceCheck, EvidenceCheckId, StrengthResult } from './types';

const ALL: DisputeReason[] = 'ALL' as unknown as DisputeReason[];

const CHECKLIST: Omit<EvidenceCheck, 'checked'>[] = [
  {
    id: 'TRACKING_DELIVERED',
    label: 'Carrier tracking shows delivery',
    description: 'A tracking number whose final scan says "delivered" — the single strongest proof for not-received claims.',
    weight: 30,
    relevantFor: ['ITEM_NOT_RECEIVED', 'CHARGEBACK', 'UNAUTHORIZED_TRANSACTION'] as DisputeReason[],
  },
  {
    id: 'PROOF_OF_DELIVERY',
    label: 'Proof of delivery (POD) with signature or GPS/photo',
    description: 'Signature, doorstep photo, or GPS-stamped POD beats a plain tracking scan.',
    weight: 25,
    relevantFor: ['ITEM_NOT_RECEIVED', 'CHARGEBACK', 'UNAUTHORIZED_TRANSACTION'] as DisputeReason[],
  },
  {
    id: 'PROOF_OF_SERVICE',
    label: 'Proof of service (digital or in-person)',
    description: 'For services: bookings, access logs, signed completion notes.',
    weight: 25,
    relevantFor: ALL,
  },
  {
    id: 'DELIVERY_ADDRESS_MATCH',
    label: 'Delivery address matches the PayPal shipping address',
    description: 'POD to an address that differs from the PayPal address is weak; matching removes that attack surface.',
    weight: 15,
    relevantFor: ['ITEM_NOT_RECEIVED', 'CHARGEBACK', 'UNAUTHORIZED_TRANSACTION'] as DisputeReason[],
  },
  {
    id: 'COMMUNICATION_LOG',
    label: 'Relevant communication log',
    description: 'Emails/chat where the buyer acknowledges the order, uses the product, or changes their story.',
    weight: 10,
    relevantFor: ALL,
  },
  {
    id: 'ITEM_DESCRIPTION_MATCH',
    label: 'Listing snapshot matching what was sold',
    description: 'Timestamped capture of the exact listing the buyer saw (specs, compatibility, condition).',
    weight: 25,
    relevantFor: ['ITEM_NOT_AS_DESCRIBED'] as DisputeReason[],
  },
  {
    id: 'PHOTO_VIDEO_EVIDENCE',
    label: 'Photos or unboxing video',
    description: 'Condition evidence at dispatch and at the buyer’s side; short unboxing videos are disproportionately persuasive.',
    weight: 15,
    relevantFor: ['ITEM_NOT_AS_DESCRIBED', 'UNAUTHORIZED_TRANSACTION'] as DisputeReason[],
  },
  {
    id: 'RECEIPT_INVOICE',
    label: 'Receipt / invoice matching the transaction',
    description: 'Invoice number and amount that line up with the disputed transaction.',
    weight: 10,
    relevantFor: ALL,
  },
  {
    id: 'REFUND_ATTEMPT',
    label: 'Good-faith refund or settlement attempt',
    description: 'Shows a sincere resolution path — influences outcomes far beyond its monetary size.',
    weight: 10,
    relevantFor: ALL,
  },
  {
    id: 'POLICY_DISCLOSURE',
    label: 'Return / compatibility policy disclosed pre-purchase',
    description: 'Proof the policy was visible before checkout (footer snapshot, checkout screenshot).',
    weight: 15,
    relevantFor: ['ITEM_NOT_AS_DESCRIBED', 'CREDIT_NOT_PROCESSED'] as DisputeReason[],
  },
  {
    id: 'SIGNED_PROOF',
    label: 'Signed proof of use (fraud / unauthorized claims)',
    description: 'For unauthorized-transaction claims: signature, device fingerprint, or AVS+CVV match.',
    weight: 25,
    relevantFor: ['UNAUTHORIZED_TRANSACTION', 'CHARGEBACK'] as DisputeReason[],
  },
];

function isRelevant(check: Omit<EvidenceCheck, 'checked'>, dispute: Dispute): boolean {
  if ((check.relevantFor as unknown as string) === 'ALL') return true;
  return (check.relevantFor as DisputeReason[]).includes(dispute.reason);
}

export function buildChecklist(dispute: Dispute): EvidenceCheck[] {
  const providedTypes = new Set(dispute.evidence.filter((e) => e.provided).map((e) => e.evidence_type.toUpperCase()));
  return CHECKLIST.filter((c) => isRelevant(c, dispute)).map((c) => {
    // Auto-check when the dispute record already carries matching evidence
    const auto = [...providedTypes].some((t) => t.includes(c.id.replace(/_/g, ' ')) || c.id.includes(t.replace(/_/g, '_')));
    const strongTypes: Record<string, string[]> = {
      TRACKING_DELIVERED: ['PROOF_OF_SHIPMENT'],
      PROOF_OF_DELIVERY: ['PROOF_OF_DELIVERY'],
      DELIVERY_ADDRESS_MATCH: ['DELIVERY_ADDRESS_MATCH'],
      COMMUNICATION_LOG: ['COMMUNICATION_LOG', 'CUSTOMER_COMMUNICATION'],
      ITEM_DESCRIPTION_MATCH: ['LISTING_SNAPSHOT'],
      PHOTO_VIDEO_EVIDENCE: ['PHOTO_VIDEO_EVIDENCE'],
      REFUND_ATTEMPT: ['REFUND_ATTEMPT'],
      SIGNED_PROOF: ['AVS_CVV_MATCH', 'SIGNED_PROOF'],
      BRAND_VERIFICATION: [],
    };
    const matched = strongTypes[c.id]?.some((t) => providedTypes.has(t)) || auto;
    return { ...c, checked: Boolean(matched) };
  });
}

export function scoreStrength(checks: EvidenceCheck[]): StrengthResult {
  const total = checks.reduce((s, c) => s + c.weight, 0) || 1;
  const raw = checks.reduce((s, c) => s + (c.checked ? c.weight : 0), 0);
  const score = Math.round((raw / total) * 100);
  const band: StrengthResult['band'] = score >= 70 ? 'STRONG' : score >= 40 ? 'MODERATE' : 'WEAK';
  const missingCritical = checks.filter((c) => !c.checked && c.weight >= 25);
  const summary =
    band === 'STRONG'
      ? 'Strong, coherent evidence — you are describing the case to a reviewer who can verify it end to end.'
      : band === 'MODERATE'
        ? 'Useful but patchy — one or two high-weight items are missing, which is exactly where a reviewer will hesitate.'
        : 'Weak on its current footing — submit only what is true today, and consider settlement before losing by default.';
  return { score, band, missingCritical, summary };
}
