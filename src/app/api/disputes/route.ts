import { NextResponse } from 'next/server';
import { paypalConfigured, listDisputes } from '@/lib/paypal-client';
import { demoDisputes } from '@/lib/demo-store';
import type { DisputeListResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/disputes
 * Returns the dispute list. Live Sandbox mode when PayPal credentials are
 * configured; otherwise Demo Mode with built-in cases. If the live call
 * fails, falls back to Demo data and says so honestly.
 */
export async function GET() {
  const live = paypalConfigured();
  if (live) {
    try {
      const disputes = await listDisputes();
      const body: DisputeListResponse = { disputes, mode: 'LIVE_SANDBOX' };
      return NextResponse.json(body);
    } catch (err) {
      const body: DisputeListResponse = {
        disputes: demoDisputes(),
        mode: 'DEMO',
        liveError: err instanceof Error ? err.message : 'PayPal API error',
      };
      return NextResponse.json(body);
    }
  }
  const body: DisputeListResponse = { disputes: demoDisputes(), mode: 'DEMO' };
  return NextResponse.json(body);
}
