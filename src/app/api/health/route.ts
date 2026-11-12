import { NextResponse } from 'next/server';
import { paypalConfigured } from '@/lib/paypal-client';
import { demoDisputes, demoSendLog } from '@/lib/demo-store';
import { llmStatus } from '@/lib/llm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const live = paypalConfigured();
  const llm = llmStatus();
  return NextResponse.json({
    status: 'ok',
    service: 'dispute-compass',
    mode: live ? 'LIVE_SANDBOX' : 'DEMO',
    paypal: { configured: live, baseUrl: process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com' },
    llm: { configured: llm.configured, provider: llm.provider, model: llm.model },
    demoCases: demoDisputes().length,
    actionsRecorded: demoSendLog.length,
    time: new Date().toISOString(),
  });
}
