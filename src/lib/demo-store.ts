/**
 * Demo Mode in-memory store.
 *
 * Keeps demo disputes mutable during a session (sends append messages,
 * offers/accepts flip statuses) so the demo feels real. Resets on server
 * restart — fine for a hackathon demo, and honest about it.
 */

import { buildDemoDisputes } from './demo-data';
import type { Dispute } from './types';

let cache: Dispute[] | null = null;
export const demoSendLog: { at: string; disputeId: string; action: string; note: string }[] = [];

export function demoDisputes(): Dispute[] {
  if (!cache) cache = buildDemoDisputes();
  return cache;
}

export function findDemo(id: string): Dispute | undefined {
  return demoDisputes().find((d) => d.dispute_id === id);
}

export function mutateDemo(id: string, fn: (d: Dispute) => void): Dispute | undefined {
  const d = findDemo(id);
  if (!d) return undefined;
  fn(d);
  return d;
}
