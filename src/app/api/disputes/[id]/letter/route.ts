import { NextResponse } from 'next/server';
import { paypalConfigured, getDispute } from '@/lib/paypal-client';
import { findDemo } from '@/lib/demo-store';
import { buildChecklist, scoreStrength } from '@/lib/strength-meter';
import { generateLetter } from '@/lib/case-coach';
import type { Dispute, LetterKind } from '@/lib/types';

export const dynamic = 'force-dynamic';

const VALID_KINDS: LetterKind[] = ['MESSAGE_TO_BUYER', 'OFFER_NOTE', 'APPEAL', 'EVIDENCE_NOTE'];

/**
 * POST /api/disputes/[id]/letter
 * Body: { kind: LetterKind, tone?, extraContext?, evidenceOverrides? }
 * Returns the drafted letter with source tag (AI vs TEMPLATE) and
 * Integrity Guard findings. Nothing is sent by this endpoint.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: { kind?: string; tone?: 'professional' | 'firm' | 'conciliatory'; extraContext?: string; evidenceOverrides?: Record<string, boolean> } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    // defaults below
  }
  const kind = (VALID_KINDS as string[]).includes(body.kind || '') ? (body.kind as LetterKind) : 'MESSAGE_TO_BUYER';

  let dispute: Dispute | undefined;
  if (paypalConfigured() && !id.startsWith('PP-D-27')) {
    try {
      dispute = await getDispute(id);
    } catch {
      dispute = findDemo(id);
    }
  } else {
    dispute = findDemo(id);
  }
  if (!dispute) return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });

  const overrides = body.evidenceOverrides || {};
  const checks = buildChecklist(dispute).map((c) => ({ ...c, checked: overrides[c.id] ?? c.checked }));
  const strength = scoreStrength(checks);

  const letter = await generateLetter({
    dispute,
    kind,
    strength,
    checks,
    tone: body.tone,
    extraContext: body.extraContext,
  });

  return NextResponse.json(letter);
}
