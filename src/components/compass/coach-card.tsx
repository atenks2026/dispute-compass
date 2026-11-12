'use client';

/**
 * AI Case Coach card + dispute lifecycle timeline.
 */

import type { CaseAnalysis, Dispute } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, UserCheck, Bot, CircleCheck } from 'lucide-react';

const STAGES = [
  { key: 'inquiry', label: 'Inquiry / Claim' },
  { key: 'negotiation', label: 'Negotiation window' },
  { key: 'review', label: 'Review' },
  { key: 'decision', label: 'Decision' },
  { key: 'appeal', label: 'Appeal (10 d)' },
];

function stageIndex(dispute: Dispute): number {
  if (dispute.status === 'OPEN') return dispute.stage === 'OPEN_INQUIRIES' ? 0 : 1;
  if (dispute.status === 'WAITING_FOR_BUYER_RESPONSE') return 1;
  if (dispute.status === 'UNDER_REVIEW') return 2;
  if (dispute.status === 'RESOLVED_BUYER_FAVOR' || dispute.status === 'RESOLVED_SELLER_FAVOR') return 3;
  return 0;
}

export function Timeline({ dispute }: { dispute: Dispute }) {
  const current = stageIndex(dispute);
  return (
    <ol className="flex flex-wrap items-center gap-1 text-[11px]" aria-label="Dispute lifecycle">
      {STAGES.map((s, i) => (
        <li key={s.key} className="flex items-center gap-1">
          <span
            className={`flex items-center gap-1 rounded-full border px-2.5 py-1 ${
              i < current ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : i === current ? 'border-emerald-600 bg-emerald-700 text-white' : 'border-stone-200 text-stone-400'
            }`}
          >
            {i < current && <CircleCheck className="h-3 w-3" />}
            {s.label}
          </span>
          {i < STAGES.length - 1 && <span aria-hidden className="text-stone-300">→</span>}
        </li>
      ))}
    </ol>
  );
}

export function CoachCard({ analysis, onAnalyze, busy }: { analysis: CaseAnalysis | null; onAnalyze: () => void; busy: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-700" /> AI Case Coach
          </span>
          {analysis && (
            <Badge variant={analysis.source === 'AI' ? 'default' : 'secondary'} className={analysis.source === 'AI' ? 'bg-emerald-600' : ''}>
              {analysis.source === 'AI' ? `AI · ${analysis.model?.split('/').pop()}` : 'Heuristic mode'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!analysis && !busy && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              The coach reads the case facts, the evidence checklist and the deadline engine, then briefs you: strengths, weaknesses, the
              best opening move and the next actions — ordered by urgency.
            </p>
            <Button onClick={onAnalyze} className="bg-emerald-700 hover:bg-emerald-800">
              <Bot className="mr-2 h-4 w-4" /> Brief me on this case
            </Button>
          </div>
        )}
        {busy && (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading the case file…
          </div>
        )}
        {analysis && !busy && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed">{analysis.caseSummary}</p>
            <div className="grid gap-3 md:grid-cols-2">
              {analysis.strengths.length > 0 && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">Strengths</div>
                  <ul className="list-disc space-y-1 pl-4 text-xs text-stone-700">
                    {analysis.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.weaknesses.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-800">What a reviewer will question</div>
                  <ul className="list-disc space-y-1 pl-4 text-xs text-stone-700">
                    {analysis.weaknesses.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {analysis.negotiationAngle && (
              <div className="rounded-lg border p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-600">
                  <UserCheck className="h-3.5 w-3.5" /> Opening move
                </div>
                <p className="text-sm text-stone-700">{analysis.negotiationAngle}</p>
              </div>
            )}
            {analysis.nextBestActions.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-600">Next best actions</div>
                <ol className="list-decimal space-y-1 pl-5 text-sm">
                  {analysis.nextBestActions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              </div>
            )}
            {analysis.riskNotes.length > 0 && (
              <div className="rounded-lg bg-stone-50 p-3 text-xs text-stone-600">
                {analysis.riskNotes.map((s, i) => (
                  <p key={i} className="mt-1 first:mt-0">
                    ⚠ {s}
                  </p>
                ))}
              </div>
            )}
            <Button variant="outline" size="sm" onClick={onAnalyze}>
              Re-brief after evidence changes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
