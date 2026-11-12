/**
 * Dispute Compass — Integrity Guard.
 *
 * A tool that writes dispute letters can be misused to fabricate claims.
 * The Guard scans every generated artifact for absolute / risky assertions
 * and blocks sending until the user confirms each claim is true. Principle:
 * *AI maximizes complete truth, not engineered victory.*
 */

import type { EvidenceCheck, IntegrityFinding } from './types';

interface Rule {
  pattern: RegExp;
  concern: string;
  severity: IntegrityFinding['severity'];
}

const RULES: Rule[] = [
  {
    pattern: /\b(never|not) (received|delivered|arrived)\b/i,
    concern: 'Absolute non-receipt claim — confirm the tracking record genuinely shows no delivery scan.',
    severity: 'BLOCKER',
  },
  {
    pattern: /\bfraud(ulent)?\b/i,
    concern: 'Fraud accusation — a serious allegation; only send it if you have a verification trail (brand check, police report, issuer log).',
    severity: 'BLOCKER',
  },
  {
    pattern: /\bcounterfeit\b/i,
    concern: 'Counterfeit claim — requires an authenticity verification (brand serial check, expert letter) attached.',
    severity: 'BLOCKER',
  },
  {
    pattern: /\bI (will )?(sue|report to police|contact the media)\b/i,
    concern: 'Threat of escalation — threats rarely help and can backfire; state facts, not intentions.',
    severity: 'WARNING',
  },
  {
    pattern: /\b(guarantee|promise|swear) (that|you)\b/i,
    concern: 'Emotional guarantee language — reviewers weigh documents, not assurances.',
    severity: 'WARNING',
  },
  {
    pattern: /\b(always|everyone|nobody|all your customers)\b/i,
    concern: 'Overgeneralization — replace with the specific dates and records of this case.',
    severity: 'WARNING',
  },
  {
    pattern: /\b(lawsuit|lawyer|attorney)\b/i,
    concern: 'Legal-threat wording — keep the letter factual and procedural.',
    severity: 'WARNING',
  },
];

/** PII redaction patterns — never send raw personal data to PayPal or in logs. */
const PII_PATTERNS: [RegExp, string][] = [
  [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[EMAIL]'],
  [/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[PHONE]'],
  [/\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b/g, '[CARD_NUMBER]'],
  [/\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g, '[SSN]'],
];

export function redactPII(text: string): string {
  let result = text;
  for (const [pattern, replacement] of PII_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

export interface ScanResult {
  redactedText: string;
  findings: IntegrityFinding[];
  hasBlocker: boolean;
  hasWarning: boolean;
}

export function scanAndRedact(text: string, checks: EvidenceCheck[] = []): ScanResult {
  const redacted = redactPII(text);
  const findings = scanIntegrity(redacted, checks);
  return {
    redactedText: redacted,
    findings,
    hasBlocker: findings.some((f) => f.severity === 'BLOCKER'),
    hasWarning: findings.some((f) => f.severity === 'WARNING'),
  };
}

export function scanIntegrity(text: string, checks: EvidenceCheck[] = []): IntegrityFinding[] {
  const findings: IntegrityFinding[] = [];
  for (const rule of RULES) {
    const m = text.match(rule.pattern);
    if (m) {
      // If the evidence checklist already supports the claim, downgrade blockers to warnings.
      let severity = rule.severity;
      if (severity === 'BLOCKER') {
        const supported = checks.some((c) => c.checked && c.weight >= 25);
        if (supported) severity = 'WARNING';
      }
      findings.push({ phrase: m[0], concern: rule.concern, severity });
    }
  }
  return findings;
}

export const INTEGRITY_CONFIRMATIONS = [
  'Every factual statement in this message is true to the best of my knowledge.',
  'I have attached or referenced evidence for every claim marked as a blocker.',
  'I understand that deliberately false statements can violate PayPal policy and local law.',
];
