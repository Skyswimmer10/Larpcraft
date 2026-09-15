import { describe, expect, it } from 'vitest';
import { AUCTION_MECHANISMS, AUCTION_MECHANISM_TYPES } from './auctionMechanisms.js';

const expectedNames = [
  'Open Auction',
  'English Auction',
  'Turn Order Until Pass Auction',
  'Sealed Bid Auction',
  'Sealed Bid with Cancellation',
  'Constrained Bidding',
  'Once Around Auction',
  'Dutch Auction',
  'Second Bid Auction',
  'Selection Order Bid',
  'Multiple Lot Auction',
  'Closed Economy Auction',
  'Reverse Auction',
  'Dexterity Auction',
  'Fixed Placement Auction',
  'Dutch Priority Auction',
  'Bid as Wagers',
  'Auction Compensation',
];

describe('Auction mechanism catalogue', () => {
  it('contains the 18 requested cards without visible numbering', () => {
    expect(AUCTION_MECHANISM_TYPES).toEqual(expectedNames);
    expect(new Set(AUCTION_MECHANISMS.map((record) => record.id)).size).toBe(18);
    expect(AUCTION_MECHANISMS.every((record) => (
      record.kind === 'auction'
      && record.category === 'Auctions'
      && record.description
      && record.image?.dataUrl
      && Array.isArray(record.variations)
      && Array.isArray(record.effects)
    ))).toBe(true);
  });
});
