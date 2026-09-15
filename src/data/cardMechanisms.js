import { mechanismImage } from './mechanismVisual.js';

const COLOR = '#F08CB4';

const definitions = [
  ['Trick Taking', 'Participants play cards into tricks whose rules determine which card wins each exchange.'],
  ['Ladder Climbing', 'Players successively play higher combinations until everyone else passes or cannot continue.'],
  ['Melding', 'Combine cards into recognized sets or sequences to score, progress, or activate effects.'],
  ['Card Draw Limits and Deck Exhaustion', 'Use limits on drawing and the depletion of a deck to control tempo, scarcity, or ending conditions.'],
  ['Deck Building', 'Acquire cards during play to improve and specialize a personal deck.'],
  ['Drafting', 'Choose cards from a shared or passing selection while leaving other choices for later participants.'],
  ['Deck Construction', 'Build a deck before play according to defined composition and eligibility rules.'],
  ['Multi-Use Cards', 'Allow each card to be used in more than one way, requiring a choice between its functions.'],
  ['Tags', 'Use labels or traits on cards to create eligibility, combination, and interaction rules.'],
];

const slug = (value) => value.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');

export const CARD_MECHANISMS = definitions.map(([label, description]) => ({
  id: `CARD-${slug(label)}`,
  kind: 'cardMechanism',
  label,
  category: 'Card Mechanisms',
  description,
  variations: [''],
  effects: [''],
  imageScale: 1,
  imagePositionX: 0,
  imagePositionY: 0,
  color: COLOR,
  icon: 'target',
  image: mechanismImage(label, COLOR, 'Card mechanism'),
  custom: false,
}));

export const CARD_MECHANISM_TYPES = CARD_MECHANISMS.map((record) => record.label);

