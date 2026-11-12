'use client';

/**
 * Deadline Engine card — deterministic, rule-based countdowns with the
 * policy basis and consequence spelled out. Never AI-generated.
 */

import type { DeadlineWindow } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlarmClock, Info } from 'lucide-react';

const URGENCY_STYLES: Record<DeadlineWindow['urgency'], { badge: string; bar: string; label: string }> = {
  SAFE: { badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', bar: 'bg-emerald-500', label: 'Safe' },
  WATCH: { badge: 'bg-amber-100 text-amber-800 border-amber-200', bar: 'bg-amber-500', label: 'Watch' },
  URGENT: { badge: 'bg-red-100 text-red-800 border-red-200', bar: 'bg-red-500', label: 'Urgent' },
  MISSED: { badge: 'bg-stone-200 text-stone-600 border-stone-300', bar: 'bg-stone-400', label: 'Lapsed' },
};

export function DeadlineCard({ windows }: { windows: DeadlineWindow[] }) {
  if (windows.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlarmClock className="h-4 w-4 text-emerald-700" /> Deadline Engine
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">No active windows for this case.</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <AlarmClock className="h-4 w-4 text-emerald-700" /> Deadline Engine
          </span>
          <span className="text-xs font-normal text-muted-foreground">deterministic · rule-based</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {windows.map((w) => {
          const style = URGENCY_STYLES[w.urgency];
          const pct = Math.max(0, Math.min(100, (w.daysRemaining / w.windowDays) * 100));
          return (
            <div key={w.kind + w.dueDate} className="rounded-lg border p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium text-sm">{w.label}</div>
                <Badge variant="outline" className={style.badge}>
                  {w.urgency === 'MISSED' ? `lapsed ${Math.abs(w.daysRemaining)}d ago` : `${w.daysRemaining} day${w.daysRemaining === 1 ? '' : 's'} left`}
                </Badge>
              </div>
              <Progress value={pct} className="h-2" aria-label={`${w.label}: ${w.daysRemaining} days remaining`} />
              <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                <div className="flex items-start gap-1.5">
                  <Info className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>
                    <span className="font-medium text-stone-700">Why: </span>
                    {w.basis}
                  </span>
                </div>
                <div className="flex items-start gap-1.5">
                  <Info className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>
                    <span className="font-medium text-stone-700">If missed: </span>
                    {w.consequence}
                  </span>
                </div>
                <div className="flex items-start gap-1.5">
                  <Info className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>
                    <span className="font-medium text-stone-700">Do now: </span>
                    {w.recommendedAction}
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-stone-400">
                window {w.windowDays} days from {new Date(w.anchorDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → due{' '}
                {new Date(w.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
