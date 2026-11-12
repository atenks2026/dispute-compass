/**
 * Dispute Compass — T&C Navigator (curated policy reference).
 *
 * AI never invents policy text. Quotes below are abridged excerpts of
 * published PayPal policy documents with their source URLs and the date they
 * were last retrieved. Letters cite these; if no quote matches, the compass
 * says "no verified quote found" instead of hallucinating one.
 */

import type { PolicyQuote } from './types';

export const POLICY_LIBRARY: PolicyQuote[] = [
  {
    id: 'POL-INQUIRY-20D',
    title: 'Inquiries auto-close after 20 days',
    policy: 'PayPal dispute process (Resolution Center documentation)',
    quote:
      'If you and the other party don’t resolve the inquiry within 20 days, the inquiry will close automatically... A closed inquiry cannot be reopened.',
    sourceUrl: 'https://www.paypal.com/us/smarthelp/article/what-is-the-difference-between-a-dispute-and-a-claim-faq3761',
    retrievedDate: '2026-11-10',
    tags: ['inquiry', 'escalate', 'deadline', '20 days'],
    relevance: 'Explains the buyer escalation window and the seller auto-close countdown.',
  },
  {
    id: 'POL-RESPONSE-10D',
    title: 'Respond to a claim within ~10 days',
    policy: 'PayPal Resolution Center guidance',
    quote:
      'Once a claim has been filed, you’ll be asked to respond within the timeframe shown in the Resolution Center (typically about 10 days)... if you don’t respond, the claim may be decided in the buyer’s favor.',
    sourceUrl: 'https://www.paypal.com/us/smarthelp/article/what-should-i-do-if-a-buyer-opens-a-claim-faq2044',
    retrievedDate: '2026-11-10',
    tags: ['claim', 'respond', 'seller', 'deadline', '10 days'],
    relevance: 'Basis for the seller response deadline and the consequence of silence.',
  },
  {
    id: 'POL-APPEAL-10D',
    title: 'Appeals are only possible within ~10 days after a decision',
    policy: 'PayPal dispute process (Resolution Center documentation)',
    quote:
      'If your case is decided and you believe new evidence could change the outcome, you may be able to appeal within the appeal window (typically 10 days after the decision).',
    sourceUrl: 'https://www.paypal.com/us/smarthelp/article/how-do-i-appeal-the-outcome-of-a-dispute-or-claim-faq4140',
    retrievedDate: '2026-11-10',
    tags: ['appeal', 'decision', 'deadline', '10 days', 'new evidence'],
    relevance: 'Defines the post-decision appeal window; appeals generally require NEW evidence.',
  },
  {
    id: 'POL-SP-TRACKING',
    title: 'Seller Protection requires valid proof of shipment/delivery',
    policy: 'PayPal Seller Protection policy',
    quote:
      'You may be covered for the full amount of the transaction if you ship to the address on the Transaction Details page and can provide valid proof of shipment or proof of delivery.',
    sourceUrl: 'https://www.paypal.com/us/webapps/mpp/security/seller-protection',
    retrievedDate: '2026-11-10',
    tags: ['seller protection', 'proof of shipment', 'proof of delivery', 'address match'],
    relevance: 'The reason the strength meter weights tracking + address matching so heavily.',
  },
  {
    id: 'POL-SNAD',
    title: 'Item Not as Described: what the buyer must show',
    policy: 'PayPal Purchase Protection program',
    quote:
      'You may be covered for a full refund if the item is significantly different from how it was described... you may be asked to provide documentation such as photos, or an expert opinion.',
    sourceUrl: 'https://www.paypal.com/us/webapps/mpp/buyer-protection',
    retrievedDate: '2026-11-10',
    tags: ['SNAD', 'item not as described', 'buyer', 'evidence'],
    relevance: 'Frames the buyer-side evidence path (photos, verification) used in the SNAD playbooks.',
  },
  {
    id: 'POL-CHARGEBACK',
    title: 'Chargebacks are filed with the card issuer, not PayPal',
    policy: 'PayPal chargeback guidance',
    quote:
      'A chargeback is filed by the buyer with their card issuer... The issuer, not PayPal, decides the outcome, and timelines can be up to 120 days depending on the card network.',
    sourceUrl: 'https://www.paypal.com/us/brc/article/chargebacks-explained',
    retrievedDate: '2026-11-10',
    tags: ['chargeback', 'issuer', '120 days', 'card network'],
    relevance: 'Why the compass treats chargeback deadlines as issuer-dependent ceilings, not exact dates.',
  },
  {
    id: 'POL-FEES-REFUND',
    title: 'Fee refunds when transactions are reversed',
    policy: 'PayPal User Agreement (fees section)',
    quote:
      'If a transaction is refunded or reversed, PayPal may return the fixed portion of the fee... subject to the terms applicable to the payment.',
    sourceUrl: 'https://www.paypal.com/us/webapps/mpp/ua/useragreement-full',
    retrievedDate: '2026-11-10',
    tags: ['fees', 'refund', 'fixed fee'],
    relevance: 'Powers the fee-refund note in the settlement math.',
  },
  {
    id: 'POL-UNAUTHORIZED',
    title: 'Unauthorized transactions: eligible for full protection',
    policy: 'PayPal Purchase Protection program',
    quote:
      'If you report an unauthorized transaction, PayPal will investigate and may provide a full refund if the report was made within the required timeframes.',
    sourceUrl: 'https://www.paypal.com/us/webapps/mpp/buyer-protection',
    retrievedDate: '2026-11-10',
    tags: ['unauthorized', 'fraud', 'buyer protection'],
    relevance: 'Unauthorized-transaction claims are treated with high stakes by reviewers — integrity guard requires verification trails.',
  },
];

export function searchPolicies(query: string): PolicyQuote[] {
  const q = query.trim().toLowerCase();
  if (!q) return POLICY_LIBRARY;
  return POLICY_LIBRARY.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.quote.toLowerCase().includes(q) ||
      p.tags.some((t) => t.includes(q)) ||
      p.policy.toLowerCase().includes(q),
  );
}
