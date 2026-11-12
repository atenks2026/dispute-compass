/**
 * Dispute Compass — PayPal Disputes API client (SERVER-SIDE ONLY).
 *
 * Talks to the PayPal Sandbox Disputes API (`/v1/customer/disputes`) with
 * OAuth2 client credentials. Credentials never leave the server. When no
 * credentials are configured the app falls back to Demo Mode so judges can
 * run everything without a PayPal account.
 */

import type { Dispute } from './types';

export function paypalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

function baseUrl(): string {
  return process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
}

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 30_000) return tokenCache.token;

  const id = process.env.PAYPAL_CLIENT_ID as string;
  const secret = process.env.PAYPAL_CLIENT_SECRET as string;
  const auth = Buffer.from(`${id}:${secret}`).toString('base64');

  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`PayPal OAuth failed (${res.status})`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = { token: json.access_token, expiresAt: now + json.expires_in * 1000 };
  return json.access_token;
}

async function paypalFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal API ${path} failed (${res.status}): ${text.slice(0, 300)}`);
  }
  // Some actions return 204 No Content
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/* ------------------------- Raw PayPal API response types ------------------------ */

interface RawPayPalDispute {
  dispute_id: string;
  status?: string;
  dispute_state?: string;
  reason?: string;
  dispute_amount?: { currency_code?: string; value?: string };
  fee_refund_eligible?: boolean;
  create_time?: string;
  update_time?: string;
  dispute_outcome?: { outcome_code?: string; amount?: { currency_code?: string; value?: string } };
  protected_offers?: unknown;
  buyer_response_due_date?: string;
  seller_response_due_date?: string;
  communication_details?: { emails?: { posted_by?: string; time?: string; content?: string }[] };
  evidence?: { evidence_type?: string; notes?: string }[];
  dispute_transactions?: {
    transaction_id?: string;
    reference_id?: string;
    create_time?: string;
    invoice_number?: string;
    item_description?: string;
    gross_amount?: { currency_code?: string; value?: string };
    buyer_email_address?: string;
    seller_email_address?: string;
    buyer_note?: string;
  }[];
  links?: { href: string; rel: string; method: string }[];
}

/** Map the API reason codes we care about into our domain reason union. */
function normalizeReason(reason?: string): Dispute['reason'] {
  switch (reason) {
    case 'ITEM_NOT_RECEIVED':
    case 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED':
      return 'ITEM_NOT_RECEIVED';
    case 'ITEM_NOT_AS_DESCRIBED':
    case 'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED':
      return 'ITEM_NOT_AS_DESCRIBED';
    case 'UNAUTHORIZED_TRANSACTION':
      return 'UNAUTHORIZED_TRANSACTION';
    case 'DUPLICATE_TRANSACTION':
      return 'DUPLICATE_TRANSACTION';
    case 'CREDIT_NOT_PROCESSED':
      return 'CREDIT_NOT_PROCESSED';
    case 'CHARGEBACK':
      return 'CHARGEBACK';
    default:
      return 'ITEM_NOT_RECEIVED';
  }
}

function normalizeStatus(status?: string): Dispute['status'] {
  switch (status) {
    case 'OPEN':
      return 'OPEN';
    case 'WAITING_FOR_BUYER_RESPONSE':
      return 'WAITING_FOR_BUYER_RESPONSE';
    case 'UNDER_REVIEW':
      return 'UNDER_REVIEW';
    case 'RESOLVED_BUYER_FAVOR':
      return 'RESOLVED_BUYER_FAVOR';
    case 'RESOLVED_SELLER_FAVOR':
      return 'RESOLVED_SELLER_FAVOR';
    default:
      return 'CLOSED';
  }
}

function normalizeStage(d: RawPayPalDispute): Dispute['stage'] {
  const s = (d.dispute_state || '').toUpperCase();
  if (s.includes('CHARGEBACK')) return 'CHARGEBACK';
  if (s.includes('ARBITRATION')) return s.includes('PRE') ? 'PRE_ARBITRATION' : 'ARBITRATION';
  if (s.includes('COMPLIANCE')) return 'COMPLIANCE';
  return 'OPEN_INQUIRIES';
}

function mapRawDispute(d: RawPayPalDispute): Dispute {
  const tx = d.dispute_transactions?.[0];
  return {
    dispute_id: d.dispute_id,
    status: normalizeStatus(d.status),
    stage: normalizeStage(d),
    reason: normalizeReason(d.reason),
    actorRole: 'SELLER', // sandbox list is merchant-scoped; buyer path comes from Demo Mode
    amount: {
      currency: d.dispute_amount?.currency_code || 'USD',
      value: d.dispute_amount?.value || '0.00',
    },
    feeRefundEligible: Boolean(d.fee_refund_eligible),
    create_time: d.create_time || new Date().toISOString(),
    update_time: d.update_time || new Date().toISOString(),
    dispute_outcome: d.dispute_outcome
      ? {
          outcome_code: d.dispute_outcome.outcome_code,
          amount: d.dispute_outcome.amount
            ? { currency: d.dispute_outcome.amount.currency_code || 'USD', value: d.dispute_outcome.amount.value || '0' }
            : undefined,
        }
      : undefined,
    buyer_name: tx?.buyer_email_address?.split('@')[0] || 'Buyer',
    seller_name: 'Your store (sandbox)',
    transaction: {
      transaction_id: tx?.transaction_id || 'UNKNOWN',
      reference_id: tx?.reference_id,
      create_time: tx?.create_time || d.create_time || '',
      invoice_number: tx?.invoice_number,
      item_description: tx?.item_description,
      gross_amount: tx?.gross_amount
        ? { currency: tx.gross_amount.currency_code || 'USD', value: tx.gross_amount.value || '0' }
        : undefined,
      buyer_email_address: tx?.buyer_email_address,
      seller_email_address: tx?.seller_email_address,
      buyer_note: tx?.buyer_note,
    },
    messages: (d.communication_details?.emails || []).map((m) => ({
      posted_by: (m.posted_by as 'BUYER' | 'SELLER') || 'BUYER',
      time: m.time || '',
      content: m.content || '',
    })),
    evidence: (d.evidence || []).map((e) => ({
      evidence_type: e.evidence_type || 'UNSPECIFIED',
      notes: e.notes,
      provided: true,
    })),
    source: 'LIVE_SANDBOX',
  };
}

export async function listDisputes(): Promise<Dispute[]> {
  const json = await paypalFetch<{ items?: RawPayPalDispute[] }>('/v1/customer/disputes?page_size=20');
  const items = json.items || [];
  return items.map(mapRawDispute);
}

export async function getDispute(disputeId: string): Promise<Dispute> {
  const raw = await paypalFetch<RawPayPalDispute>(`/v1/customer/disputes/${encodeURIComponent(disputeId)}`);
  return mapRawDispute(raw);
}

export type SendAction = 'SEND_MESSAGE' | 'MAKE_OFFER' | 'APPEAL' | 'ACCEPT_CLAIM';

export interface SendActionInput {
  action: SendAction;
  disputeId: string;
  message?: string;
  offerAmount?: { currency: string; value: string };
}

export async function sendAction(input: SendActionInput): Promise<unknown> {
  const id = encodeURIComponent(input.disputeId);
  switch (input.action) {
    case 'SEND_MESSAGE':
      return paypalFetch(`/v1/customer/disputes/${id}/send-message`, {
        method: 'POST',
        body: JSON.stringify({ message: input.message }),
      });
    case 'MAKE_OFFER':
      return paypalFetch(`/v1/customer/disputes/${id}/make-offer`, {
        method: 'POST',
        body: JSON.stringify({
          offer_amount: { currency_code: input.offerAmount?.currency || 'USD', value: input.offerAmount?.value || '0' },
          note: input.message || 'Settlement offer',
          return_shipping_cost_payer: 'BUYER',
        }),
      });
    case 'APPEAL':
      return paypalFetch(`/v1/customer/disputes/${id}/appeal`, {
        method: 'POST',
        body: JSON.stringify({ evidence: { notes: input.message || '' } }),
      });
    case 'ACCEPT_CLAIM':
      return paypalFetch(`/v1/customer/disputes/${id}/accept-claim`, {
        method: 'POST',
        body: JSON.stringify({ note: input.message || 'Accepting claim' }),
      });
  }
}
