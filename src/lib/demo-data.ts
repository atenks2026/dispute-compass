/**
 * Dispute Compass — built-in Demo Mode dataset.
 *
 * Dates are computed relative to `now` so countdowns always look live.
 * These cases are fictional but shaped like real PayPal Sandbox disputes so
 * judges can exercise every feature without credentials.
 */

import { DAY_MS } from './deadline-engine';
import type { Dispute } from './types';

function daysAgo(n: number): string {
  return new Date(Date.now() - n * DAY_MS).toISOString();
}
function hoursAgo(n: number): string {
  return new Date(Date.now() - n * 60 * 60 * 1000).toISOString();
}

export function buildDemoDisputes(): Dispute[] {
  return [
    {
      dispute_id: 'PP-D-27401',
      status: 'OPEN',
      stage: 'OPEN_INQUIRIES',
      reason: 'ITEM_NOT_RECEIVED',
      actorRole: 'SELLER',
      amount: { currency: 'USD', value: '248.00' },
      feeRefundEligible: true,
      create_time: daysAgo(15),
      update_time: daysAgo(2),
      buyer_name: 'M. Okafor',
      seller_name: 'LumenDesk Supplies (you)',
      transaction: {
        transaction_id: '8XY902145B783050E',
        create_time: daysAgo(16),
        item_description: 'Ergonomic desk lamp Pro — 2 units, shipped to New York',
        gross_amount: { currency: 'USD', value: '248.00' },
        buyer_email_address: 'buyer-sandbox-1@personal.example.com',
        seller_email_address: 'merchant-sandbox-1@business.example.com',
        buyer_note: 'Where is my package? Tracking has not moved for a week.',
      },
      messages: [
        {
          posted_by: 'BUYER',
          time: daysAgo(15),
          content: 'I still have not received the lamps. The tracking page has not updated in 7 days.',
        },
        {
          posted_by: 'SELLER',
          time: daysAgo(14),
          content: 'Sorry for the worry — the carrier reports an internal transfer delay. New ETA is 3 business days.',
        },
        {
          posted_by: 'BUYER',
          time: daysAgo(2),
          content: 'It has been another week. Please refund me or I will escalate.',
        },
      ],
      evidence: [
        { evidence_type: 'PROOF_OF_SHIPMENT', notes: 'Carrier tracking 1Z999AA10123456784, label created at dispatch', provided: true },
        { evidence_type: 'PROOF_OF_DELIVERY', notes: 'Not yet delivered — carrier shows in-transit', provided: false },
      ],
      source: 'DEMO',
    },
    {
      dispute_id: 'PP-D-27402',
      status: 'OPEN',
      stage: 'PRE_ARBITRATION',
      reason: 'ITEM_NOT_RECEIVED',
      actorRole: 'SELLER',
      amount: { currency: 'USD', value: '1290.00' },
      feeRefundEligible: true,
      create_time: daysAgo(8),
      update_time: daysAgo(1),
      buyer_name: 'R. Almeida',
      seller_name: 'LumenDesk Supplies (you)',
      transaction: {
        transaction_id: '4KR118376T992112K',
        create_time: daysAgo(21),
        item_description: 'Standing desk frame, freight shipment to Austin TX',
        gross_amount: { currency: 'USD', value: '1290.00' },
        buyer_email_address: 'buyer-sandbox-2@personal.example.com',
        seller_email_address: 'merchant-sandbox-1@business.example.com',
        buyer_note: 'Package says delivered but nothing arrived.',
      },
      messages: [
        {
          posted_by: 'BUYER',
          time: daysAgo(8),
          content: 'Carrier says delivered but I never saw it. I want my money back.',
        },
        {
          posted_by: 'SELLER',
          time: daysAgo(7),
          content: 'Carrier GPS shows drop-off at your address with photo. We opened a carrier trace.',
        },
      ],
      evidence: [
        { evidence_type: 'PROOF_OF_DELIVERY', notes: 'Carrier POD with GPS coordinates + doorstep photo', provided: true },
        { evidence_type: 'DELIVERY_ADDRESS_MATCH', notes: 'Address matches the buyer PayPal address exactly', provided: true },
        { evidence_type: 'COMMUNICATION_LOG', notes: 'Buyer confirmed "will look for it" on day 2 (email)', provided: false },
      ],
      source: 'DEMO',
    },
    {
      dispute_id: 'PP-D-27403',
      status: 'WAITING_FOR_BUYER_RESPONSE',
      stage: 'OPEN_INQUIRIES',
      reason: 'ITEM_NOT_AS_DESCRIBED',
      actorRole: 'SELLER',
      amount: { currency: 'USD', value: '89.50' },
      feeRefundEligible: true,
      create_time: daysAgo(11),
      update_time: daysAgo(3),
      buyer_name: 'S. Watanuki',
      seller_name: 'LumenDesk Supplies (you)',
      transaction: {
        transaction_id: '2NV555112C881223G',
        create_time: daysAgo(18),
        item_description: 'USB-C docking station, listed as "supports triple display"',
        gross_amount: { currency: 'USD', value: '89.50' },
        buyer_email_address: 'buyer-sandbox-3@personal.example.com',
        seller_email_address: 'merchant-sandbox-1@business.example.com',
        buyer_note: 'Only two displays work on my laptop, listing said three.',
      },
      messages: [
        { posted_by: 'BUYER', time: daysAgo(11), content: 'Triple display does not work as advertised.' },
        {
          posted_by: 'SELLER',
          time: daysAgo(6),
          content: 'Offer: 40% partial refund and you keep the unit, or full refund with a return label. Your choice.',
        },
      ],
      evidence: [
        { evidence_type: 'LISTING_SNAPSHOT', notes: 'Listing says "triple display (Windows 11 22H2+)" — buyer OS is macOS 13', provided: true },
        { evidence_type: 'COMMUNICATION_LOG', notes: 'Compatibility note existed on listing page', provided: true },
      ],
      source: 'DEMO',
    },
    {
      dispute_id: 'PP-D-27404',
      status: 'RESOLVED_BUYER_FAVOR',
      stage: 'OPEN_INQUIRIES',
      reason: 'ITEM_NOT_RECEIVED',
      actorRole: 'SELLER',
      amount: { currency: 'USD', value: '315.00' },
      feeRefundEligible: false,
      create_time: daysAgo(24),
      update_time: daysAgo(6),
      dispute_outcome: { outcome_code: 'RESOLVED_BUYER_FAVOR', amount: { currency: 'USD', value: '315.00' } },
      buyer_name: 'T. Neumann',
      seller_name: 'LumenDesk Supplies (you)',
      transaction: {
        transaction_id: '9QC773221X112099M',
        create_time: daysAgo(30),
        item_description: 'Office chair Elite, shipped to Denver CO',
        gross_amount: { currency: 'USD', value: '315.00' },
        buyer_email_address: 'buyer-sandbox-4@personal.example.com',
        seller_email_address: 'merchant-sandbox-1@business.example.com',
        buyer_note: 'Never received anything.',
      },
      messages: [
        { posted_by: 'BUYER', time: daysAgo(24), content: 'Order never arrived.' },
        { posted_by: 'SELLER', time: daysAgo(23), content: 'Tracking shows it moving. Please wait a few more days.' },
      ],
      evidence: [
        { evidence_type: 'PROOF_OF_SHIPMENT', notes: 'Tracking number provided', provided: true },
        { evidence_type: 'PROOF_OF_DELIVERY', notes: 'Never provided — package lost by carrier', provided: false },
        { evidence_type: 'CARRIER_INVESTIGATION', notes: 'Carrier confirmed loss AFTER decision (new evidence)', provided: true },
      ],
      source: 'DEMO',
    },
    {
      dispute_id: 'PP-D-27405',
      status: 'UNDER_REVIEW',
      stage: 'CHARGEBACK',
      reason: 'CHARGEBACK',
      actorRole: 'SELLER',
      amount: { currency: 'USD', value: '640.00' },
      feeRefundEligible: false,
      create_time: daysAgo(9),
      update_time: daysAgo(4),
      buyer_name: 'Card issuer (chargeback)',
      seller_name: 'LumenDesk Supplies (you)',
      transaction: {
        transaction_id: '7YB330981Q556041V',
        create_time: daysAgo(35),
        item_description: 'Bulk order: 8 monitor arms, delivered and signed',
        gross_amount: { currency: 'USD', value: '640.00' },
        buyer_email_address: 'buyer-sandbox-5@personal.example.com',
        seller_email_address: 'merchant-sandbox-1@business.example.com',
        buyer_note: 'Cardholder claims unauthorized transaction.',
      },
      messages: [],
      evidence: [
        { evidence_type: 'PROOF_OF_DELIVERY', notes: 'Signed POD by "M.HALL" at ship-to address', provided: true },
        { evidence_type: 'CUSTOMER_COMMUNICATION', notes: 'Buyer emailed support about assembly on day 5', provided: true },
        { evidence_type: 'AVS_CVV_MATCH', notes: 'AVS + CVV matched at authorization', provided: true },
      ],
      source: 'DEMO',
    },
    {
      dispute_id: 'PP-D-27406',
      status: 'OPEN',
      stage: 'OPEN_INQUIRIES',
      reason: 'ITEM_NOT_AS_DESCRIBED',
      actorRole: 'BUYER',
      amount: { currency: 'USD', value: '159.00' },
      feeRefundEligible: false,
      create_time: daysAgo(3),
      update_time: hoursAgo(20),
      buyer_name: 'You (buyer)',
      seller_name: 'GadgetBazaar Online',
      transaction: {
        transaction_id: '5TG884217B667090N',
        create_time: daysAgo(6),
        item_description: '"100% Original" branded smartwatch — serial number not found in brand database',
        gross_amount: { currency: 'USD', value: '159.00' },
        buyer_email_address: 'buyer-you-sandbox@personal.example.com',
        seller_email_address: 'merchant-sandbox-6@business.example.com',
        buyer_note: 'Suspect counterfeit.',
      },
      messages: [
        { posted_by: 'BUYER', time: daysAgo(3), content: 'The serial number does not verify with the brand. I believe this is counterfeit.' },
        { posted_by: 'SELLER', time: hoursAgo(20), content: 'All our products are original. No refunds after opening the box.' },
      ],
      evidence: [
        { evidence_type: 'BRAND_VERIFICATION', notes: 'Brand authenticity check failed (screenshot)', provided: true },
        { evidence_type: 'PHOTO_VIDEO_EVIDENCE', notes: 'Unboxing video + engraving photos', provided: true },
        { evidence_type: 'LISTING_SNAPSHOT', notes: 'Listing claimed "100% Original"', provided: false },
      ],
      source: 'DEMO',
    },
    {
      dispute_id: 'PP-D-27407',
      status: 'RESOLVED_SELLER_FAVOR',
      stage: 'OPEN_INQUIRIES',
      reason: 'ITEM_NOT_RECEIVED',
      actorRole: 'SELLER',
      amount: { currency: 'USD', value: '74.20' },
      feeRefundEligible: false,
      create_time: daysAgo(28),
      update_time: daysAgo(12),
      dispute_outcome: { outcome_code: 'RESOLVED_SELLER_FAVOR', amount: { currency: 'USD', value: '0.00' } },
      buyer_name: 'J. Duarte',
      seller_name: 'LumenDesk Supplies (you)',
      transaction: {
        transaction_id: '3PL991002D447788H',
        create_time: daysAgo(33),
        item_description: 'Cable organizer set, delivered to pickup point',
        gross_amount: { currency: 'USD', value: '74.20' },
        buyer_email_address: 'buyer-sandbox-7@personal.example.com',
        seller_email_address: 'merchant-sandbox-1@business.example.com',
        buyer_note: 'Says delivered to pickup point but I did not collect.',
      },
      messages: [{ posted_by: 'BUYER', time: daysAgo(28), content: 'I never picked it up, refund please.' }],
      evidence: [
        { evidence_type: 'PROOF_OF_DELIVERY', notes: 'Pickup-point scan + ID check', provided: true },
        { evidence_type: 'DELIVERY_ADDRESS_MATCH', notes: 'Pickup point matched buyer address', provided: true },
      ],
      source: 'DEMO',
    },
    {
      dispute_id: 'PP-D-27408',
      status: 'OPEN',
      stage: 'OPEN_INQUIRIES',
      reason: 'UNAUTHORIZED_TRANSACTION',
      actorRole: 'SELLER',
      amount: { currency: 'USD', value: '420.00' },
      feeRefundEligible: true,
      create_time: daysAgo(2),
      update_time: daysAgo(2),
      buyer_name: 'K. Nowak',
      seller_name: 'LumenDesk Supplies (you)',
      transaction: {
        transaction_id: '6RD223344F778001L',
        create_time: daysAgo(2),
        item_description: 'Digital gift cards x4 (instant delivery via email)',
        gross_amount: { currency: 'USD', value: '420.00' },
        buyer_email_address: 'buyer-sandbox-8@personal.example.com',
        seller_email_address: 'merchant-sandbox-1@business.example.com',
        buyer_note: 'I did not make this purchase. Someone used my account.',
      },
      messages: [
        { posted_by: 'BUYER', time: daysAgo(2), content: 'I did not authorize this purchase. Please reverse it.' },
      ],
      evidence: [
        { evidence_type: 'DELIVERY_CONFIRMATION', notes: 'Codes delivered to buyer email AND already redeemed (issuer logs pending)', provided: false },
        { evidence_type: 'ACCOUNT_LOGIN_HISTORY', notes: 'Login from buyer usual device/IP pattern', provided: false },
      ],
      source: 'DEMO',
    },
  ];
}
