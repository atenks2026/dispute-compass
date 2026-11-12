'use client';

/**
 * T&C Navigator — searchable curated policy quotes. AI cites these ids; it
 * never invents policy text. If nothing matches, it says so.
 */

import { useMemo, useState } from 'react';
import { POLICY_LIBRARY } from '@/lib/policy-library';
import type { PolicyQuote } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Search, ExternalLink } from 'lucide-react';

interface Props {
  onInsertQuote: (quote: string) => void;
}

export function PolicyNavigator({ onInsertQuote }: Props) {
  const [q, setQ] = useState('');
  const results = useMemo<PolicyQuote[]>(() => {
    const query = q.trim().toLowerCase();
    if (!query) return POLICY_LIBRARY;
    return POLICY_LIBRARY.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.policy.toLowerCase().includes(query) ||
        p.quote.toLowerCase().includes(query) ||
        p.tags.some((t) => t.includes(query)),
    );
  }, [q]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-4 w-4 text-emerald-700" /> T&C Navigator
          <span className="text-xs font-normal text-muted-foreground">verified excerpts · AI cites, never invents</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search policy: deadline, appeal, tracking, chargeback…" className="pl-8" aria-label="Search policy library" />
        </div>
        {results.length === 0 && (
          <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            No verified quote matches “{q}”. The compass will not fabricate policy text.
          </p>
        )}
        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
          {results.map((p) => (
            <div key={p.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-medium">{p.title}</div>
                <Badge variant="outline" className="text-[10px]">{p.id}</Badge>
              </div>
              <blockquote className="border-l-4 border-emerald-200 pl-3 text-xs italic leading-relaxed text-stone-600">“{p.quote}”</blockquote>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-500">
                <span className="font-medium text-stone-600">{p.policy}</span>
                <a href={p.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-700 hover:underline">
                  source <ExternalLink className="h-3 w-3" />
                </a>
                <span>retrieved {p.retrievedDate}</span>
                <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px] text-emerald-700" onClick={() => onInsertQuote(p.quote)}>
                  Use in draft
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {p.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
