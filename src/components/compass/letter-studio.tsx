'use client';

/**
 * Letter Studio — drafts a message / offer note / appeal / evidence note,
 * shows Integrity Guard findings, requires attestations before sending,
 * then posts the action to PayPal (or records it in Demo Mode).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Dispute, EvidenceCheck, GeneratedLetter, LetterKind, SendActionResponse } from '@/lib/types';
import { INTEGRITY_CONFIRMATIONS, scanIntegrity } from '@/lib/integrity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { FileText, Loader2, Send, ShieldAlert, BookMarked } from 'lucide-react';

const KINDS: { id: LetterKind; label: string }[] = [
  { id: 'MESSAGE_TO_BUYER', label: 'Message to counterparty' },
  { id: 'OFFER_NOTE', label: 'Settlement offer note' },
  { id: 'APPEAL', label: 'Appeal after decision' },
  { id: 'EVIDENCE_NOTE', label: 'Evidence cover note' },
];

interface Props {
  dispute: Dispute;
  checks: EvidenceCheck[];
  onSent: () => void;
  onInsertPolicy: string | null; // quote pushed from the T&C navigator
  onPolicyConsumed: () => void;
  kindHint?: LetterKind | null;
}

export function LetterStudio({ dispute, checks, onSent, onInsertPolicy, onPolicyConsumed, kindHint }: Props) {
  const { toast } = useToast();
  const [kind, setKind] = useState<LetterKind>('MESSAGE_TO_BUYER');
  const [tone, setTone] = useState<'professional' | 'firm' | 'conciliatory'>('professional');
  const [extraContext, setExtraContext] = useState('');
  const [letter, setLetter] = useState<GeneratedLetter | null>(null);
  const [editedBody, setEditedBody] = useState('');
  const [editedSubject, setEditedSubject] = useState('');
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [attestations, setAttestations] = useState<boolean[]>([false, false, false]);
  const [offerAmount, setOfferAmount] = useState<string>('');
  const [result, setResult] = useState<SendActionResponse | null>(null);
  const lastPolicyRef = useRef<string | null>(null);

  // Live Integrity Guard — re-scans the editable draft with the same rules the
  // server enforces, so findings appear (and clear) as the user edits the text.
  const liveFindings = useMemo(() => {
    const generation = letter?.integrityWarnings || [];
    if (!letter) return [] as string[];
    const extra = scanIntegrity(`${editedSubject}\n${editedBody}`, checks)
      .map((f) => `${f.severity}: ${f.concern}`)
      .filter((w) => !generation.includes(w));
    return [...generation, ...extra];
  }, [letter, editedSubject, editedBody, checks]);
  const allAttested = attestations.every(Boolean);

  // Push a verified policy quote (from the T&C Navigator) into the draft context.
  useEffect(() => {
    if (!onInsertPolicy || lastPolicyRef.current === onInsertPolicy) return;
    lastPolicyRef.current = onInsertPolicy;
    setExtraContext((prev) =>
      prev ? `${prev}\n\nCite this verified policy quote: "${onInsertPolicy}"` : `Cite this verified policy quote: "${onInsertPolicy}"`,
    );
    toast({ title: 'Policy quote added to context', description: 'It will ground the next draft.' });
    onPolicyConsumed();
     
  }, [onInsertPolicy]);

  // Follow document-type hints (e.g. "Draft this offer" from the Settlement Advisor).
  useEffect(() => {
    if (kindHint) setKind(kindHint);
  }, [kindHint]);

  async function generate() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(`/api/disputes/${dispute.dispute_id}/letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          tone,
          extraContext: extraContext || undefined,
          evidenceOverrides: Object.fromEntries(checks.map((c) => [c.id, c.checked])),
        }),
      });
      const json = (await res.json()) as GeneratedLetter;
      setLetter(json);
      setEditedBody(json.body);
      setEditedSubject(json.subject);
      setAttestations([false, false, false]);
      toast({
        title: json.source === 'AI' ? 'Draft generated with AI' : 'Draft generated from template',
        description: json.source === 'AI' ? `Model: ${json.model}` : 'No LLM key configured — deterministic fallback used.',
      });
    } catch {
      toast({ title: 'Could not generate the draft', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    setSending(true);
    try {
      const action =
        kind === 'OFFER_NOTE' ? 'MAKE_OFFER' : kind === 'APPEAL' ? 'APPEAL' : kind === 'EVIDENCE_NOTE' ? 'SEND_MESSAGE' : 'SEND_MESSAGE';
      const res = await fetch(`/api/disputes/${dispute.dispute_id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          message: `Subject: ${editedSubject}\n\n${editedBody}`,
          offerAmount: kind === 'OFFER_NOTE' && offerAmount ? { currency: dispute.amount.currency, value: offerAmount } : undefined,
          confirmationsAccepted: allAttested,
          checks,
        }),
      });
      const json = (await res.json()) as SendActionResponse;
      setResult(json);
      if (json.ok) {
        toast({
          title: json.mode === 'DEMO' ? 'Recorded (Demo Mode)' : 'Sent to PayPal Sandbox',
          description: json.mode === 'DEMO' ? json.paypalResponse?.info : 'Check the Resolution Center.',
        });
        onSent();
      } else {
        toast({ title: 'Send blocked or failed', description: json.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error while sending', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-emerald-700" /> Letter Studio
          {letter && (
            <Badge variant={letter.source === 'AI' ? 'default' : 'secondary'} className={letter.source === 'AI' ? 'bg-emerald-600' : ''}>
              {letter.source === 'AI' ? `AI draft · ${letter.model}` : 'Template (no LLM key)'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Document type</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as LetterKind)}>
              <SelectTrigger aria-label="Document type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tone</Label>
            <RadioGroup value={tone} onValueChange={(v) => setTone(v as typeof tone)} className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="professional" id="tone-p" />
                <Label htmlFor="tone-p">Professional</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="firm" id="tone-f" />
                <Label htmlFor="tone-f">Firm</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="conciliatory" id="tone-c" />
                <Label htmlFor="tone-c">Conciliatory</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {kind === 'OFFER_NOTE' && (
          <div className="space-y-1.5">
            <Label htmlFor="offer-amount">Offer amount ({dispute.amount.currency})</Label>
            <Input
              id="offer-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder={String((Number(dispute.amount.value) * 0.4).toFixed(2))}
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              className="max-w-44"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="letter-context">Facts only you know (dates, names, what actually happened)</Label>
          <Textarea
            id="letter-context"
            placeholder="e.g. carrier picked up on May 3; buyer wrote 'my bad' on May 6; serial check screenshot attached…"
            value={extraContext}
            onChange={(e) => setExtraContext(e.target.value)}
            className="min-h-20"
          />
          {onInsertPolicy === null && (
            <p className="text-[11px] text-muted-foreground">Tip: use the T&C Navigator tab to push verified policy quotes into this context.</p>
          )}
        </div>

        <Button onClick={generate} disabled={busy} className="bg-emerald-700 hover:bg-emerald-800">
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {busy ? 'Drafting…' : 'Generate draft'}
        </Button>

        {letter && (
          <div className="space-y-3 rounded-lg border p-3">
            <div className="space-y-1.5">
              <Label htmlFor="letter-subject">Subject</Label>
              <Input id="letter-subject" value={editedSubject} onChange={(e) => setEditedSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="letter-body">Body (editable — you own every word)</Label>
              <Textarea id="letter-body" value={editedBody} onChange={(e) => setEditedBody(e.target.value)} className="min-h-56 font-mono text-xs" />
            </div>

            {liveFindings.length > 0 && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-sm font-medium text-amber-800">
                  <ShieldAlert className="h-4 w-4" /> Integrity Guard findings
                </div>
                <p className="mb-1.5 text-[11px] text-amber-700">Live scan — re-checked on every edit with the same rules the server enforces.</p>
                <ul className="list-disc space-y-1 pl-4 text-xs text-amber-900">
                  {liveFindings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {letter.citedPolicies.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <BookMarked className="mr-1 inline h-3 w-3" /> Cites: {letter.citedPolicies.join(' · ')}
              </div>
            )}

            <div className="rounded-md border p-3 space-y-2">
              <div className="text-sm font-medium">Attest before sending</div>
              {INTEGRITY_CONFIRMATIONS.map((c, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Checkbox
                    id={`att-${i}`}
                    checked={attestations[i]}
                    onCheckedChange={(v) => setAttestations((prev) => prev.map((p, j) => (j === i ? v === true : p)))}
                    className="mt-0.5"
                  />
                  <Label htmlFor={`att-${i}`} className="text-xs font-normal leading-snug">
                    {c}
                  </Label>
                </div>
              ))}
            </div>

            <Button onClick={send} disabled={sending || !allAttested || editedBody.trim().length < 20} className="w-full bg-emerald-700 hover:bg-emerald-800">
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {kind === 'APPEAL' ? 'Submit appeal' : kind === 'OFFER_NOTE' ? 'Send offer' : 'Send message'}
            </Button>
            {!allAttested && <p className="text-center text-[11px] text-muted-foreground">All three attestations are required to enable sending.</p>}
            <p className="text-[10px] text-muted-foreground italic mt-2">Not an official PayPal product — not legal advice. You are solely responsible for your send/settle decision. PayPal's decision is final.</p>

            {result && (
              <div className={`rounded-md border p-3 text-xs ${result.ok ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-red-300 bg-red-50 text-red-900'}`}>
                {result.ok ? (
                  <>
                    <div className="font-medium">{result.mode === 'DEMO' ? 'Recorded locally (Demo Mode)' : 'Sent to PayPal Sandbox'}</div>
                    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all">{JSON.stringify(result.paypalResponse, null, 2).slice(0, 400)}</pre>
                  </>
                ) : (
                  <div>
                    <div className="font-medium">{result.error}</div>
                    {result.paypalResponse && <div className="mt-1">{String(result.paypalResponse)}</div>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
