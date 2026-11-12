import { NextResponse } from 'next/server';
import { paypalConfigured, sendAction, type SendAction } from '@/lib/paypal-client';
import { demoSendLog, mutateDemo } from '@/lib/demo-store';
import { scanIntegrity } from '@/lib/integrity';
import type { SendActionResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

const ACTIONS: SendAction[] = ['SEND_MESSAGE', 'MAKE_OFFER', 'APPEAL', 'ACCEPT_CLAIM'];

/**
 * POST /api/disputes/[id]/send
 * Body: { action: SendAction, message?, offerAmount? }
 *
 * Integrity Guard runs server-side before anything is sent: messages
 * containing BLOCKER findings are refused unless the client explicitly
 * attests (confirmationsAccepted: true) that the claims are true.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: { action?: string; message?: string; offerAmount?: { currency: string; value: string }; confirmationsAccepted?: boolean } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    // fallthrough
  }

  const action = body.action as SendAction;
  if (!ACTIONS.includes(action)) {
    return NextResponse.json({ error: `action must be one of ${ACTIONS.join(', ')}` }, { status: 400 });
  }

  const message = body.message || '';
  const blockers = scanIntegrity(message).filter((f) => f.severity === 'BLOCKER');
  if (blockers.length > 0 && !body.confirmationsAccepted) {
    return NextResponse.json(
      {
        error: 'INTEGRITY_BLOCKED',
        detail: 'The draft contains absolute claims that must be verified. Confirm the attestations to proceed, or edit the draft.',
        blockers,
      },
      { status: 422 },
    );
  }

  const now = new Date().toISOString();

  if (paypalConfigured() && !id.startsWith('PP-D-27')) {
    try {
      const paypalResponse = await sendAction({ action, disputeId: id, message, offerAmount: body.offerAmount });
      demoSendLog.push({ at: now, disputeId: id, action, note: 'sent to PayPal Sandbox' });
      const payload: SendActionResponse = { ok: true, action, mode: 'LIVE_SANDBOX', paypalResponse, recordedAt: now };
      return NextResponse.json(payload);
    } catch (err) {
      const payload: SendActionResponse = {
        ok: false,
        action,
        mode: 'LIVE_SANDBOX',
        error: err instanceof Error ? err.message : 'PayPal API error',
        recordedAt: now,
      };
      return NextResponse.json(payload, { status: 502 });
    }
  }

  // Demo mode: mutate the in-memory copy so the demo feels real.
  mutateDemo(id, (d) => {
    if (action === 'SEND_MESSAGE' && message) {
      d.messages.push({ posted_by: d.actorRole, time: now, content: message });
    }
    if (action === 'MAKE_OFFER') {
      d.messages.push({
        posted_by: d.actorRole,
        time: now,
        content: `Offer sent through PayPal: ${body.offerAmount?.value || '?'} ${body.offerAmount?.currency || d.amount.currency} — ${message || 'see note'}`,
      });
      d.status = 'WAITING_FOR_BUYER_RESPONSE';
    }
    if (action === 'APPEAL') {
      d.evidence.push({ evidence_type: 'APPEAL_SUBMISSION', notes: message.slice(0, 200), provided: true });
      d.status = 'UNDER_REVIEW';
    }
    if (action === 'ACCEPT_CLAIM') {
      d.messages.push({ posted_by: d.actorRole, time: now, content: `Claim accepted: ${message || 'no note'}` });
      d.status = 'CLOSED';
    }
    d.update_time = now;
  });
  demoSendLog.push({ at: now, disputeId: id, action, note: 'recorded locally (demo mode)' });

  const payload: SendActionResponse = {
    ok: true,
    action,
    mode: 'DEMO',
    paypalResponse: { simulated: true, info: 'Demo Mode: action recorded locally. Configure PAYPAL_CLIENT_ID/SECRET to send to the real sandbox.' },
    recordedAt: now,
  };
  return NextResponse.json(payload);
}
