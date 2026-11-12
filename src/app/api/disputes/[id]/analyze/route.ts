import { NextResponse } from 'next/server';
import { paypalConfigured, getDispute } from '@/lib/paypal-client';
import { findDemo } from '@/lib/demo-store';
import { computeDeadlines } from '@/lib/deadline-engine';
import { buildChecklist, scoreStrength } from '@/lib/strength-meter';
import { computeSettlement } from '@/lib/settlement';
import { analyzeCase } from '@/lib/case-coach';
import type { AnalyzeResponse, Dispute } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/disputes/[id]/analyze
 * One call → everything the cockpit shows:
 * deterministic deadlines + evidence checklist + strength score +
 * settlement math + AI case coach brief.
 *
 * Body (optional): { evidenceOverrides?: Record<string, boolean> }
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let overrides: Record<string, boolean> = {};
  try {
    const body = (await req.json()) as { evidenceOverrides?: Record<string, boolean> };
    overrides = body.evidenceOverrides || {};
  } catch {
    // empty body is fine
  }

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

  const now = new Date();
  const deadlines = computeDeadlines(dispute, now);
  const checks = buildChecklist(dispute).map((c) => ({ ...c, checked: overrides[c.id] ?? c.checked }));
  const strength = scoreStrength(checks);
  const settlement = computeSettlement(dispute, strength.score);
  const analysis = await analyzeCase(dispute, strength, checks);

  const payload: AnalyzeResponse = {
    ...analysis,
    strength,
    settlement,
    deadlines,
  };
  return NextResponse.json({ ...payload, checks, disputeId: dispute.dispute_id });
}
