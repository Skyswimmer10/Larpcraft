import { mechanismImage } from './mechanismVisual.js';

const COLOR = '#A87BF0';

const definitions = [
  ['Open Auction', 'Participants openly raise or change their bids while everyone can see the current offer.'],
  ['English Auction', 'Bids increase openly until no participant is willing to exceed the highest bid.'],
  ['Turn Order Until Pass Auction', 'Participants bid in turn and leave the auction when they pass.'],
  ['Sealed Bid Auction', 'Participants submit hidden bids that are revealed and compared simultaneously.'],
  ['Sealed Bid with Cancellation', 'Participants submit hidden bids with a rule that can cancel selected bids or the auction.'],
  ['Constrained Bidding', 'Bids must follow defined limits, increments, resources, or eligibility requirements.'],
  ['Once Around Auction', 'Each participant receives one opportunity to bid in a single pass around the group.'],
  ['Dutch Auction', 'A price descends until a participant accepts the current offer.'],
  ['Second Bid Auction', 'The highest bidder wins but pays the value of the second-highest qualifying bid.'],
  ['Selection Order Bid', 'Bids determine the order in which participants choose rewards, actions, or positions.'],
  ['Multiple Lot Auction', 'Several items or groups of items are auctioned within the same bidding process.'],
  ['Closed Economy Auction', 'All bids and payments circulate within a limited game economy rather than leaving it.'],
  ['Reverse Auction', 'Participants compete by offering progressively lower costs or requirements.'],
  ['Dexterity Auction', 'Physical accuracy, speed, or coordination forms part of placing or resolving a bid.'],
  ['Fixed Placement Auction', 'Participants place bids into fixed spaces whose positions affect the outcome.'],
  ['Dutch Priority Auction', 'A descending offer determines both who accepts and the priority they receive.'],
  ['Bid as Wagers', 'Bids act as stakes that can be won, lost, or resolved according to a later outcome.'],
  ['Auction Compensation', 'Participants who lose or withdraw receive compensation based on their bids or position.'],
];

const slug = (value) => value.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');

export const AUCTION_MECHANISMS = definitions.map(([label, description]) => ({
  id: `AUC-${slug(label)}`,
  kind: 'auction',
  label,
  category: 'Auctions',
  description,
  variations: [''],
  effects: [''],
  imageScale: 1,
  imagePositionX: 0,
  imagePositionY: 0,
  color: COLOR,
  icon: 'cog',
  image: mechanismImage(label, COLOR, 'Auction mechanism'),
  custom: false,
}));

export const AUCTION_MECHANISM_TYPES = AUCTION_MECHANISMS.map((record) => record.label);

