import { mechanismImage } from './mechanismVisual.js';

const COLOR = '#E0A23C';

const definitions = [
  ['Exchanging', 'Allow players to exchange resources according to a defined rate or rule.'],
  ['Trading', 'Allow players to negotiate and transfer resources directly between participants.'],
  ['Market', 'Use a shared buying and selling space whose supply, demand, or prices can change.'],
  ['Delayed Purchase', 'Separate payment from delivery so a purchase becomes available later.'],
  ['Income', 'Provide recurring resources when a defined phase, interval, or condition occurs.'],
  ['Automatic Resource Growth', 'Increase an owned resource automatically over time or between rounds.'],
  ['Loans', 'Provide resources now in exchange for repayment, interest, or a future obligation.'],
  ['Always Available Purchases', 'Keep selected purchases continuously available instead of limiting them to a changing market.'],
  ['I Cut You, You Choose', 'One participant divides available value while another chooses which portion to take.'],
  ['Discounts', 'Reduce a cost when a player meets a particular condition or possesses an advantage.'],
  ['Upgrades', 'Spend resources to improve the value, efficiency, or capability of something already owned.'],
  ['Random Production', 'Determine the amount or type of produced resources through a random process.'],
  ['Investment', 'Commit resources now for a possible larger return later.'],
  ['Ownership', 'Assign control or rights over resources, locations, actions, or other game elements.'],
  ['Contract', 'Create an agreement that exchanges commitments, resources, or future actions.'],
  ['Bribery', 'Offer resources or favors to influence another participant, role, or decision.'],
  ['Increase Value of Unchosen Resources', 'Raise the future value of options that players leave unselected.'],
  ['Negotiation', 'Let participants determine an exchange or agreement through direct discussion.'],
  ['Alliances', 'Allow participants to coordinate resources or goals through temporary or lasting cooperation.'],
  ['Resource Queue', 'Place resources or purchases in an ordered queue that controls when they become available.'],
];

const slug = (value) => value.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');

export const ECONOMY_MECHANISMS = definitions.map(([label, description]) => ({
  id: `ECON-${slug(label)}`,
  kind: 'economy',
  label,
  category: 'Economy',
  description,
  variations: [''],
  effects: [''],
  imageScale: 1,
  imagePositionX: 0,
  imagePositionY: 0,
  color: COLOR,
  icon: 'cog',
  image: mechanismImage(label, COLOR, 'Economy mechanism'),
  custom: false,
}));

export const ECONOMY_MECHANISM_TYPES = ECONOMY_MECHANISMS.map((record) => record.label);

