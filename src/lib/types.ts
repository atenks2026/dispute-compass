/**
 * Dispute Compass — shared domain types.
 *
 * The `Dispute` type mirrors the PayPal Disputes API (v1/customer/disputes)
 * subset that the product actually uses, so the same code path serves both
 * Live Sandbox mode (real API) and Demo mode (built-in mock data).
 */

export type DisputeStatus =
  | 'OPEN'
  | 'WAITING_FOR_BUYER_RESPONSE'
  | 'UNDER_REVIEW'
  | 'RESOLVED_BUYER_FAVOR'
  | 'RESOLVED_SELLER_FAVOR'
  | 'CLOSED';

export type DisputeStage = 'OPEN_INQUIRIES' | 'CHARGEBACK' | 'PRE_ARBITRATION' | 'ARBITRATION' | 'COMPLIANCE';

export type DisputeReason =
  | 'ITEM_NOT_RECEIVED'
  | 'ITEM_NOT_AS_DESCRIBED'
  | 'UNAUTHORIZED_TRANSACTION'
  | 'DUPLICATE_TRANSACTION'
  | 'CHARGEBACK'
  | 'CREDIT_NOT_PROCESSED'
  | 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED'
  | 'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED';

/** Who is using the compass for this case. */
export type ActorRole = 'SELLER' | 'BUYER';

export interface Money {
  currency: string;
  value: string; // decimal string, as returned by PayPal
}

export interface DisputeMessage {
  posted_by: 'BUYER' | 'SELLER';
  time: string; // ISO datetime
  content: string;
}

export interface DisputeTransaction {
  transaction_id: string;
  reference_id?: string;
  seller_transaction_id?: string;
  create_time: string;
  invoice_number?: string;
  custom?: string;
  receipt_id?: string;
  buyer_note?: string;
  item_description?: string;
  item_quantity?: string;
  item_unit_price?: Money;
  gross_amount?: Money;
  buyer_email_address?: string;
  seller_email_address?: string;
}

export interface DisputeEvidence {
  evidence_type: string;
  notes?: string;
  provided: boolean;
}

export interface Dispute {
  dispute_id: string;
  status: DisputeStatus;
  stage: DisputeStage;
  reason: DisputeReason;
  actorRole: ActorRole; // who the compass user is in this case
  amount: Money;
  feeRefundEligible?: boolean;
  create_time: string; // ISO
  update_time: string; // ISO
  dispute_outcome?: {
    outcome_code?: string;
    amount?: Money;
  };
  buyer_name: string;
  seller_name: string;
  transaction: DisputeTransaction;
  messages: DisputeMessage[];
  evidence: DisputeEvidence[];
  /** Demo-mode flag so the UI can badge cases honestly. */
  source: 'DEMO' | 'LIVE_SANDBOX';
}

/* ---------------------------------- Deadlines --------------------------------- */

export type DeadlineKind =
  | 'BUYER_ESCALATE' // buyer must escalate inquiry to claim
  | 'SELLER_RESPOND' // seller must respond to claim
  | 'PROVIDE_EVIDENCE' // evidence submission while under review
  | 'APPEAL' // appeal after final decision
  | 'AUTO_CLOSE'; // inquiry auto-closes if buyer does not escalate

export interface DeadlineWindow {
  kind: DeadlineKind;
  label: string;
  /** Policy window in days from the anchor date. */
  windowDays: number;
  anchorDate: string; // ISO date the window started
  dueDate: string; // ISO date the window ends
  daysRemaining: number; // integer, negative = expired
  urgency: 'SAFE' | 'WATCH' | 'URGENT' | 'MISSED';
  /** Human-readable policy basis; shown in UI (honesty first). */
  basis: string;
  /** What happens when this window lapses. */
  consequence: string;
  recommendedAction: string;
}

/* ------------------------------- Strength meter ------------------------------- */

export type EvidenceCheckId =
  | 'TRACKING_DELIVERED'
  | 'PROOF_OF_SERVICE'
  | 'SIGNED_PROOF'
  | 'COMMUNICATION_LOG'
  | 'ITEM_DESCRIPTION_MATCH'
  | 'PHOTO_VIDEO_EVIDENCE'
  | 'RECEIPT_INVOICE'
  | 'REFUND_ATTEMPT'
  | 'POLICY_DISCLOSURE'
  | 'DELIVERY_ADDRESS_MATCH';

export interface EvidenceCheck {
  id: EvidenceCheckId;
  label: string;
  description: string;
  weight: number; // contribution to the score when checked
  /** Which dispute reasons this check is relevant for. */
  relevantFor: DisputeReason[] | 'ALL';
  checked: boolean;
}

export interface StrengthResult {
  score: number; // 0..100
  band: 'WEAK' | 'MODERATE' | 'STRONG';
  missingCritical: EvidenceCheck[];
  summary: string;
}

/* ------------------------------ Settlement advisor ---------------------------- */

export interface SettlementOption {
  id: 'ACCEPT_CLAIM' | 'MAKE_OFFER' | 'FIGHT';
  title: string;
  description: string;
  grossOutflow: number; // money leaving your side if it happens
  expectedCost: number; // probability-weighted cost estimate
  winProbability: number; // 0..1 (for FIGHT) or 1 for deterministic outcomes
  timeDays: number; // typical days to resolution
  recommended: boolean;
  rationale: string;
}

export interface SettlementResult {
  amount: number;
  currency: string;
  feeRefundEligible: boolean;
  options: SettlementOption[];
  bestOptionId: string;
  notes: string[];
}

/* ------------------------------- AI case coach -------------------------------- */

export interface CaseAnalysis {
  caseSummary: string;
  strengths: string[];
  weaknesses: string[];
  negotiationAngle: string;
  nextBestActions: string[];
  riskNotes: string[];
  source: 'AI' | 'HEURISTIC';
  model?: string;
}

export type LetterKind = 'MESSAGE_TO_BUYER' | 'OFFER_NOTE' | 'APPEAL' | 'EVIDENCE_NOTE';

export interface GeneratedLetter {
  kind: LetterKind;
  subject: string;
  body: string;
  source: 'AI' | 'TEMPLATE';
  model?: string;
  integrityWarnings: string[];
  citedPolicies: string[];
}

/* -------------------------------- Integrity guard ------------------------------ */

export interface IntegrityFinding {
  phrase: string;
  concern: string;
  severity: 'BLOCKER' | 'WARNING';
}

/* --------------------------------- T&C library -------------------------------- */

export interface PolicyQuote {
  id: string;
  title: string;
  policy: string; // e.g. "PayPal User Agreement", "PayPal Seller Protection"
  quote: string; // exact (abridged) quote
  sourceUrl: string;
  retrievedDate: string;
  tags: string[];
  relevance: string;
}

/* ---------------------------------- API DTOs ---------------------------------- */

export interface DisputeListResponse {
  disputes: Dispute[];
  mode: 'DEMO' | 'LIVE_SANDBOX';
  liveError?: string;
}

export interface AnalyzeResponse extends CaseAnalysis {
  strength: StrengthResult;
  settlement: SettlementResult;
  deadlines: DeadlineWindow[];
}

export type LetterResponse = GeneratedLetter;

export interface SendActionResponse {
  ok: boolean;
  action: 'SEND_MESSAGE' | 'MAKE_OFFER' | 'APPEAL' | 'ACCEPT_CLAIM';
  mode: 'DEMO' | 'LIVE_SANDBOX';
  paypalResponse?: unknown;
  error?: string;
  recordedAt: string;
}
