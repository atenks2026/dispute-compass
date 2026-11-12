'use client';

/**
 * Evidence Strength Meter — rule-based score with an editable checklist.
 * Toggles recompute the score instantly (same weights the server uses);
 * the AI coach only *comments* on the result, never invents it.
 */

import type { EvidenceCheck, StrengthResult } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';

const BAND_STYLES: Record<StrengthResult['band'], string> = {
  STRONG: 'text-emerald-700',
  MODERATE: 'text-amber-600',
  WEAK: 'text-red-600',
};

interface Props {
  checks: EvidenceCheck[];
  strength: StrengthResult;
  onToggle: (id: string, checked: boolean) => void;
}

export function StrengthCard({ checks, strength, onToggle }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-700" /> Evidence Strength Meter
          </span>
          <span className={`text-sm font-semibold tabular-nums ${BAND_STYLES[strength.band]}`}>
            {strength.score}/100 · {strength.band}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={strength.score} className="h-2.5" aria-label={`Evidence strength ${strength.score} out of 100`} />
        <p className="text-sm text-muted-foreground">{strength.summary}</p>
        <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
          {checks.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5 rounded-md border p-2.5">
              <Checkbox
                id={`chk-${c.id}`}
                checked={c.checked}
                onCheckedChange={(v) => onToggle(c.id, v === true)}
                className="mt-0.5"
                aria-label={c.label}
              />
              <Label htmlFor={`chk-${c.id}`} className="cursor-pointer space-y-0.5">
                <span className="block text-sm font-medium leading-none">
                  {c.label} <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] tabular-nums">+{c.weight}</Badge>
                </span>
                <span className="block text-xs font-normal text-muted-foreground">{c.description}</span>
              </Label>
            </div>
          ))}
        </div>
        {strength.missingCritical.length > 0 && (
          <p className="text-xs text-red-600">
            Critical gaps: {strength.missingCritical.map((m) => m.label).join(' · ')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/** Client-side score mirror of src/lib/strength-meter.ts (same weights). */
export function scoreFromChecks(checks: EvidenceCheck[]): StrengthResult {
  const total = checks.reduce((s, c) => s + c.weight, 0) || 1;
  const raw = checks.reduce((s, c) => s + (c.checked ? c.weight : 0), 0);
  const score = Math.round((raw / total) * 100);
  const band: StrengthResult['band'] = score >= 70 ? 'STRONG' : score >= 40 ? 'MODERATE' : 'WEAK';
  return {
    score,
    band,
    missingCritical: checks.filter((c) => !c.checked && c.weight >= 25),
    summary:
      band === 'STRONG'
        ? 'Strong, coherent evidence — you are describing the case to a reviewer who can verify it end to end.'
        : band === 'MODERATE'
          ? 'Useful but patchy — one or two high-weight items are missing, which is exactly where a reviewer will hesitate.'
          : 'Weak on its current footing — submit only what is true today, and consider settlement before losing by default.',
  };
}
