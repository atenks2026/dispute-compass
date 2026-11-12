'use client';

/**
 * Settlement Advisor — transparent cost-of-options math so the peaceful
 * path is visible early. Deterministic; recommendation driven by the
 * evidence score.
 */

import type { SettlementResult } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HandCoins } from 'lucide-react';

interface Props {
  settlement: SettlementResult;
  onPickOffer: (optionTitle: string) => void;
}

export function SettlementCard({ settlement, onPickOffer }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <HandCoins className="h-4 w-4 text-emerald-700" /> Settlement Advisor
          </span>
          <span className="text-xs font-normal text-muted-foreground">rule-based math, not AI guesses</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 md:grid-cols-3">
          {settlement.options.map((o) => (
            <div
              key={o.id}
              className={`relative rounded-lg border p-3 ${o.recommended ? 'border-emerald-500 bg-emerald-50/60' : 'border-stone-200'}`}
            >
              {o.recommended && (
                <Badge className="absolute -top-2 right-2 bg-emerald-600 hover:bg-emerald-600">Recommended</Badge>
              )}
              <div className="text-sm font-medium">{o.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">{o.description}</div>
              <dl className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <dt className="text-stone-500">Cost if it happens</dt>
                  <dd className="font-medium tabular-nums">
                    {o.grossOutflow.toFixed(2)} {settlement.currency}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Risk-adjusted cost</dt>
                  <dd className="font-medium tabular-nums">
                    {o.expectedCost.toFixed(2)} {settlement.currency}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Time to close</dt>
                  <dd className="font-medium tabular-nums">~{o.timeDays} d</dd>
                </div>
              </dl>
              <p className="mt-2 text-[11px] leading-snug text-stone-500">{o.rationale}</p>
              {o.id === 'MAKE_OFFER' && (
                <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => onPickOffer(o.title)}>
                  Draft this offer
                </Button>
              )}
            </div>
          ))}
        </div>
        <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
          {settlement.notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
