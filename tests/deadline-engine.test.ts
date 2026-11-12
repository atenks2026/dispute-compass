import { describe, expect, test } from 'bun:test';
import { computeDeadlines, nextAction, POLICY_WINDOWS } from '../src/lib/deadline-engine';
import { buildDemoDisputes } from '../src/lib/demo-data';
import { scanIntegrity } from '../src/lib/integrity';
import { buildChecklist, scoreStrength } from '../src/lib/strength-meter';
import type { Dispute } from '../src/lib/types';

const now = new Date();
const demo = buildDemoDisputes();

describe('Deadline Engine (deterministic, rule-based)', () => {
  test('seller-side inquiry shows the buyer escalation / auto-close window', () => {
    const inquiry = demo.find((d) => d.dispute_id === 'PP-D-27401')!;
    const windows = computeDeadlines(inquiry, now);
    expect(windows.length).toBe(1);
    expect(windows[0].kind).toBe('AUTO_CLOSE');
    expect(windows[0].windowDays).toBe(POLICY_WINDOWS.BUYER_ESCALATE_DAYS);
    expect(windows[0].basis).toContain('20 days');
  });

  test('claim response window is ~10 days and turns URGENT near the end', () => {
    const claim = demo.find((d) => d.dispute_id === 'PP-D-27402')!;
    const windows = computeDeadlines(claim, now);
    const respond = windows.find((w) => w.kind === 'SELLER_RESPOND')!;
    expect(respond.windowDays).toBe(POLICY_WINDOWS.SELLER_RESPOND_DAYS);
    expect(respond.daysRemaining).toBeLessThanOrEqual(2);
    expect(respond.urgency).toBe('URGENT');
  });

  test('resolved-in-buyer-favor cases open a 10-day appeal window', () => {
    const decided = demo.find((d) => d.dispute_id === 'PP-D-27404')!;
    const windows = computeDeadlines(decided, now);
    const appeal = windows.find((w) => w.kind === 'APPEAL')!;
    expect(appeal.windowDays).toBe(POLICY_WINDOWS.APPEAL_DAYS);
    expect(appeal.daysRemaining).toBeGreaterThan(0);
    expect(appeal.basis).toContain('10 days');
  });

  test('chargeback stage surfaces an issuer-dependent ceiling', () => {
    const cb = demo.find((d) => d.dispute_id === 'PP-D-27405')!;
    const windows = computeDeadlines(cb, now);
    const cbWindow = windows.find((w) => w.basis.includes('120 days'));
    expect(cbWindow).toBeDefined();
    expect(cbWindow!.kind).toBe('SELLER_RESPOND');
  });

  test('nextAction never returns a lapsed window when alternatives exist', () => {
    for (const d of demo) {
      const { window } = nextAction(d, now);
      if (window) expect(window.daysRemaining).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('Evidence Strength Meter', () => {
  test('scores increase when high-weight evidence is checked', () => {
    const claim = demo.find((d) => d.dispute_id === 'PP-D-27402')!;
    const checks = buildChecklist(claim);
    const weak = scoreStrength(checks.map((c) => ({ ...c, checked: false })));
    const strong = scoreStrength(checks.map((c) => ({ ...c, checked: true })));
    expect(weak.score).toBe(0);
    expect(strong.score).toBe(100);
    expect(strong.band).toBe('STRONG');
  });

  test('all-checklist weights are positive and checklists are non-empty', () => {
    for (const d of demo) {
      const checks = buildChecklist(d);
      expect(checks.length).toBeGreaterThan(0);
      for (const c of checks) expect(c.weight).toBeGreaterThan(0);
    }
  });
});

describe('Integrity Guard', () => {
  test('blocks absolute non-receipt and fraud claims', () => {
    const findings = scanIntegrity('I never received the item and this is fraud. You will hear from my lawyer.');
    const severities = findings.map((f) => f.severity);
    expect(severities).toContain('BLOCKER');
    expect(severities).toContain('WARNING'); // lawyer threat
  });

  test('clean factual text produces no blockers', () => {
    const findings = scanIntegrity('Carrier tracking 1Z999AA1 shows the parcel moving; new ETA is 3 business days.');
    expect(findings.filter((f) => f.severity === 'BLOCKER').length).toBe(0);
  });
});

describe('Demo data integrity', () => {
  test('covers every lifecycle stage the compass handles', () => {
    const statuses = new Set(demo.map((d) => d.status));
    expect(statuses.has('OPEN')).toBeTrue();
    expect(statuses.has('RESOLVED_BUYER_FAVOR')).toBeTrue();
    expect(statuses.has('RESOLVED_SELLER_FAVOR')).toBeTrue();
    expect(demo.some((d) => d.actorRole === 'BUYER')).toBeTrue();
    expect(demo.every((d: Dispute) => d.dispute_id.startsWith('PP-D-'))).toBeTrue();
  });
});
