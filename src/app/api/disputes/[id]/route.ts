import { NextResponse } from 'next/server';
import { paypalConfigured, getDispute } from '@/lib/paypal-client';
import { demoDisputes, findDemo } from '@/lib/demo-store';

export const dynamic = 'force-dynamic';

/** GET /api/disputes/[id] — dispute detail (live first, demo fallback). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (paypalConfigured() && !id.startsWith('PP-D-27')) {
    try {
      const dispute = await getDispute(id);
      return NextResponse.json(dispute);
    } catch (err) {
      const demo = findDemo(id);
      if (demo) return NextResponse.json(demo);
      return NextResponse.json({ error: err instanceof Error ? err.message : 'PayPal API error' }, { status: 502 });
    }
  }
  const demo = findDemo(id) || demoDisputes()[0];
  if (!demo) return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
  return NextResponse.json(demo);
}
