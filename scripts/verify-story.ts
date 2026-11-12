/** Verify every number quoted in the story document against the real engines. */
import { buildDemoDisputes } from '../src/lib/demo-data';
import { computeDeadlines } from '../src/lib/deadline-engine';
import { buildChecklist, scoreStrength } from '../src/lib/strength-meter';
import { computeSettlement } from '../src/lib/settlement';

const d = buildDemoDisputes().find((x) => x.dispute_id === 'PP-D-27401')!;
const wins = computeDeadlines(d, new Date());
console.log('27401 windows:', wins.map((w) => `${w.kind}:${w.daysRemaining}d:${w.urgency}`).join(' | '));

const checks = buildChecklist(d);
const s = scoreStrength(checks);
console.log('score now:', s.score, s.band);

const st = computeSettlement(d, s.score);
console.log('best:', st.bestOptionId);
for (const o of st.options) console.log(`  ${o.id}: expectedCost=${o.expectedCost} winProb=${o.winProbability}`);

const checks2 = checks.map((c) => (c.id === 'PROOF_OF_DELIVERY' ? { ...c, checked: true } : c));
const s2 = scoreStrength(checks2);
const st2 = computeSettlement(d, s2.score);
const offer2 = st2.options.find((o) => o.id === 'MAKE_OFFER');
console.log('after ticking POD:', s2.score, s2.band, '| offer title:', offer2?.title);

const d2 = buildDemoDisputes().find((x) => x.dispute_id === 'PP-D-27402')!;
console.log('27402 windows:', computeDeadlines(d2, new Date()).map((w) => `${w.kind}:${w.daysRemaining}d:${w.urgency}`).join(' | '));
