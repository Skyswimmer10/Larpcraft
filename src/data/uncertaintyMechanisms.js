import { mechanismImage } from './mechanismVisual.js';

const COLOR = '#A87BF0';

const definitions = [
  ['Betting and Bluffing', 'Let players stake resources while concealing, exaggerating, or misrepresenting the strength of their position.'],
  ['Push Your Luck', 'Let players choose between securing current gains and risking them for a greater reward.'],
  ['Memory', 'Require participants to remember previously revealed information, positions, or sequences.'],
  ['Hidden Roles', 'Assign concealed identities or responsibilities that shape player goals and behavior.'],
  ['Roles with Asymmetric Information', 'Give different roles access to different information relevant to shared or competing decisions.'],
  ['Communication Limits', 'Restrict what, when, or how participants may communicate information.'],
  ['Unknown Information', 'Keep information unavailable to every participant until it is discovered or generated.'],
  ['Hidden Information', 'Allow some participants to know information that remains concealed from others.'],
  ['Probability Management', 'Let players influence, evaluate, or reduce uncertainty in random outcomes.'],
  ['Variable Setup', 'Change starting conditions, resources, positions, or objectives between plays.'],
  ['Hidden Control', 'Conceal which participant controls an element, area, or decision.'],
  ['Deduction', 'Infer a specific hidden answer by combining evidence and eliminating possibilities.'],
  ['Induction', 'Form a broader rule or pattern from several observed examples or clues.'],
  ['Questions and Answers', 'Reveal or test information through structured questions and responses.'],
];

const slug = (value) => value.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');

export const UNCERTAINTY_MECHANISMS = definitions.map(([label, description]) => ({
  id: `UNC-${slug(label)}`,
  kind: 'uncertainty',
  label,
  category: 'Uncertainty',
  description,
  variations: [''],
  effects: [''],
  imageScale: 1,
  imagePositionX: 0,
  imagePositionY: 0,
  color: COLOR,
  icon: 'target',
  image: mechanismImage(label, COLOR, 'Uncertainty mechanism'),
  custom: false,
}));

export const UNCERTAINTY_MECHANISM_TYPES = UNCERTAINTY_MECHANISMS.map((record) => record.label);

