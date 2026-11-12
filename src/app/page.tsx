'use client';

/**
 * Dispute Compass — AI Case Coach for PayPal disputes.
 * Single-page cockpit: dispute portfolio (AG Grid) + case cockpit
 * (Deadline Engine · Strength Meter · Settlement Advisor · AI coach ·
 * Letter Studio with Integrity Guard · T&C Navigator).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AnalyzeResponse, Dispute, DisputeListResponse, EvidenceCheck, LetterKind } from '@/lib/types';
import { computeDeadlines } from '@/lib/deadline-engine';
import { DisputesTable, toRowData } from '@/components/compass/disputes-table';
import { DeadlineCard } from '@/components/compass/deadline-card';
import { StrengthCard, scoreFromChecks } from '@/components/compass/strength-card';
import { SettlementCard } from '@/components/compass/settlement-card';
import { LetterStudio } from '@/components/compass/letter-studio';
import { PolicyNavigator } from '@/components/compass/policy-navigator';
import { CoachCard, Timeline } from '@/components/compass/coach-card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Compass, AlarmClock, Wallet, ShieldQuestion, RefreshCw, Scale } from 'lucide-react';

type Health = {
  status: string;
  mode: 'DEMO' | 'LIVE_SANDBOX';
  paypal: { configured: boolean };
  llm: { configured: boolean; provider: string; model: string };
};

export default function Home() {
  const [health, setHealth] = useState<Health | null>(null);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [analyze, setAnalyze] = useState<AnalyzeResponse | null>(null);
  const [analyzeBusy, setAnalyzeBusy] = useState(false);
  const [coachBusy, setCoachBusy] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [policyPush, setPolicyPush] = useState<string | null>(null);
  const [kindHint, setKindHint] = useState<LetterKind | null>(null);
  const [tab, setTab] = useState('coach');
  const nowRef = useRef(new Date());

  const selected = useMemo(() => disputes.find((d) => d.dispute_id === selectedId) || null, [disputes, selectedId]);

  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await fetch('/api/disputes', { cache: 'no-store' });
      const json = (await res.json()) as DisputeListResponse;
      setDisputes(json.disputes);
      if (!selectedId && json.disputes.length > 0) setSelectedId(json.disputes[0].dispute_id);
    } finally {
      setListLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    fetch('/api/health', { cache: 'no-store' })
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null));
    loadList();
     
  }, []);

  const runAnalyze = useCallback(
    async (showCoachSpinner: boolean) => {
      if (!selectedId) return;
      if (showCoachSpinner) setCoachBusy(true);
      else setAnalyzeBusy(true);
      try {
        const res = await fetch(`/api/disputes/${selectedId}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ evidenceOverrides: overrides }),
        });
        const json = (await res.json()) as AnalyzeResponse;
        setAnalyze(json);
      } catch {
        setAnalyze(null);
      } finally {
        if (showCoachSpinner) setCoachBusy(false);
        else setAnalyzeBusy(false);
      }
    },
    [selectedId, overrides],
  );

  useEffect(() => {
    setAnalyze(null);
    setOverrides({});
    if (selectedId) runAnalyze(false);
     
  }, [selectedId]);

  // Live settlement: when the seller ticks evidence, re-run the deterministic
  // analysis so the offer math always matches the meter (rules do the math).
  useEffect(() => {
    if (selectedId && Object.keys(overrides).length > 0) runAnalyze(false);
  }, [overrides, selectedId, runAnalyze]);

  const checks: EvidenceCheck[] = analyze?.checks
    ? analyze.checks.map((c) => ({ ...c, checked: overrides[c.id] ?? c.checked }))
    : [];
  const strength = useMemo(() => scoreFromChecks(checks), [JSON.stringify(checks)]);  

  // Deterministic deadlines for every row (pure function, safe on the client).
  const rows = useMemo(() => disputes.map((d) => toRowData(d, computeDeadlines(d, nowRef.current))), [disputes]);

  const kpis = useMemo(() => {
    const withDeadlines = rows.filter((r) => r.nextDeadlineDays >= 0);
    const urgent = withDeadlines.filter((r) => r.nextDeadlineDays <= 2);
    const appealOpen = disputes.filter((d) => d.status === 'RESOLVED_BUYER_FAVOR' && d.actorRole === 'SELLER');
    const atStake = disputes.filter((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW' || d.status === 'WAITING_FOR_BUYER_RESPONSE').reduce((s, d) => s + Number(d.amount.value), 0);
    return [
      { icon: <Scale className="h-4 w-4 text-emerald-700" />, label: 'Active cases', value: String(disputes.filter((d) => d.status !== 'CLOSED').length), sub: `${disputes.length} total in view` },
      { icon: <AlarmClock className="h-4 w-4 text-red-600" />, label: 'Deadlines ≤ 2 days', value: String(urgent.length), sub: withDeadlines.length ? `next in ${Math.min(...withDeadlines.map((r) => r.nextDeadlineDays))} d` : 'none scheduled' },
      { icon: <ShieldQuestion className="h-4 w-4 text-amber-600" />, label: 'Appeal windows open', value: String(appealOpen.length), sub: '10-day post-decision window' },
      { icon: <Wallet className="h-4 w-4 text-emerald-700" />, label: 'Money in play', value: `$${atStake.toLocaleString('en-US')}`, sub: 'across undecided cases' },
    ];
  }, [rows, disputes]);

  const refreshListAfterSend = useCallback(() => {
    nowRef.current = new Date(); // recompute countdowns after an action
    loadList();
    runAnalyze(false);
  }, [loadList, runAnalyze]);

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white">
              <Compass className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight text-stone-900">Dispute Compass</h1>
              <p className="text-xs text-stone-500">Know where you stand. Settle smart. Escalate right.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {health && (
              <>
                <Badge variant={health.mode === 'LIVE_SANDBOX' ? 'default' : 'secondary'} className={health.mode === 'LIVE_SANDBOX' ? 'bg-emerald-600' : 'bg-stone-200 text-stone-700'}>
                  {health.mode === 'LIVE_SANDBOX' ? 'PayPal Sandbox · live' : 'Demo Mode · no credentials needed'}
                </Badge>
                <Badge variant={health.llm.configured ? 'default' : 'secondary'} className={health.llm.configured ? 'bg-emerald-600' : 'bg-stone-200 text-stone-700'}>
                  AI: {health.llm.configured ? health.llm.provider : 'heuristic fallback'}
                </Badge>
              </>
            )}
            <button
              onClick={() => loadList()}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs text-stone-600 hover:bg-stone-100"
              aria-label="Refresh dispute list"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${listLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
      </header>

      {/* KPI strip */}
      <section aria-label="Portfolio overview" className="border-b bg-white/70">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 py-4 md:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="flex items-start gap-3 rounded-xl border bg-white p-3">
              <div className="mt-0.5">{k.icon}</div>
              <div>
                <div className="text-xs text-stone-500">{k.label}</div>
                <div className="text-xl font-semibold tabular-nums text-stone-900">{k.value}</div>
                <div className="text-[11px] text-stone-400">{k.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5">
        <div className="grid gap-5 lg:grid-cols-5">
          {/* Left: portfolio */}
          <section aria-label="Dispute portfolio" className="lg:col-span-2">
            <div className="rounded-xl border bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-stone-800">Dispute portfolio</h2>
                <span className="text-[11px] text-stone-400">AG Grid · sort, scan, select</span>
              </div>
              {listLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full" />
                  ))}
                </div>
              ) : (
                <DisputesTable
                  disputes={rows}
                  selectedId={selectedId}
                  onSelect={(id) => setSelectedId(id)}
                />
              )}
            </div>
          </section>

          {/* Right: case cockpit */}
          <section aria-label="Case cockpit" className="lg:col-span-3">
            {!selected && <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">Select a dispute to open the case cockpit.</div>}
            {selected && (
              <div className="space-y-4">
                {/* Case header */}
                <div className="rounded-xl border bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-stone-900">{selected.dispute_id}</h2>
                        <Badge variant={selected.actorRole === 'SELLER' ? 'default' : 'outline'} className={selected.actorRole === 'SELLER' ? 'bg-emerald-700' : ''}>
                          you are the {selected.actorRole.toLowerCase()}
                        </Badge>
                        {selected.source === 'DEMO' && <Badge variant="secondary">demo case</Badge>}
                      </div>
                      <p className="mt-0.5 text-sm text-stone-600">
                        {selected.reason.replaceAll('_', ' ').toLowerCase()} · {selected.stage.replaceAll('_', ' ').toLowerCase()} · status {selected.status.replaceAll('_', ' ').toLowerCase()}
                      </p>
                      <p className="text-xs text-stone-400">
                        {selected.transaction.item_description || 'No item description'} · opened {new Date(selected.create_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-semibold tabular-nums text-stone-900">
                        {selected.amount.currency} {Number(selected.amount.value).toLocaleString('en-US')}
                      </div>
                      <div className="text-xs text-stone-400">disputed amount</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Timeline dispute={selected} />
                  </div>
                </div>

                {analyzeBusy && !analyze && (
                  <div className="space-y-3 rounded-xl border bg-white p-4">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-10 w-2/3" />
                  </div>
                )}

                {analyze && (
                  <>
                    <DeadlineCard windows={analyze.deadlines} />
                    <SettlementCard
                      settlement={analyze.settlement}
                      onPickOffer={() => {
                        setKindHint('OFFER_NOTE');
                        setTab('letters');
                      }}
                    />
                    <Tabs value={tab} onValueChange={setTab}>
                      <TabsList className="w-full justify-start overflow-x-auto">
                        <TabsTrigger value="coach">AI Case Coach</TabsTrigger>
                        <TabsTrigger value="evidence">Evidence & Strength</TabsTrigger>
                        <TabsTrigger value="letters">Letter Studio</TabsTrigger>
                        <TabsTrigger value="policies">T&C Navigator</TabsTrigger>
                      </TabsList>
                      <TabsContent value="coach" className="mt-3">
                        <CoachCard analysis={analyze} busy={coachBusy} onAnalyze={() => runAnalyze(true)} />
                      </TabsContent>
                      <TabsContent value="evidence" className="mt-3">
                        <StrengthCard
                          checks={checks}
                          strength={strength}
                          onToggle={(id, checked) => {
                            setOverrides((prev) => ({ ...prev, [id]: checked }));
                          }}
                        />
                      </TabsContent>
                      <TabsContent value="letters" className="mt-3">
                        <LetterStudio
                          dispute={selected}
                          checks={checks}
                          onSent={refreshListAfterSend}
                          onInsertPolicy={policyPush}
                          onPolicyConsumed={() => setPolicyPush(null)}
                          kindHint={kindHint}
                        />
                      </TabsContent>
                      <TabsContent value="policies" className="mt-3">
                        <PolicyNavigator
                          onInsertQuote={(quote) => {
                            setKindHint('EVIDENCE_NOTE');
                            setPolicyPush(quote);
                            setTab('letters');
                          }}
                        />
                      </TabsContent>
                    </Tabs>
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-stone-500">
          <span>Dispute Compass · MIT License · built for the PayPal AI Hackathon (PayPal Disputes API sandbox + NVIDIA NIM-class LLM + AG Grid)</span>
          <span>AI drafts are drafts — every submission requires human attestation.</span>
        </div>
      </footer>
    </div>
  );
}
