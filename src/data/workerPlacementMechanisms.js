import { mechanismImage } from './mechanismVisual.js';

const COLOR = '#5CA8F5';

const definitions = [
  ['Standard Worker Placement', 'Place a limited worker on an available action space to perform or reserve that action.'],
  ['Workers of Differing Types', 'Give different worker types distinct placement permissions, strengths, or effects.'],
  ['Acquiring and Losing Workers', 'Allow the available worker pool to grow or shrink through game actions and consequences.'],
  ['Workers as Dice', 'Use dice as workers so their rolled values affect where they can be placed or what they accomplish.'],
  ['Adding and Blocking Buildings', 'Add action spaces through buildings while allowing placement or ownership to block access.'],
  ['Single Workers', 'Limit an action space, area, or participant to one worker at a time.'],
  ['Building Actions and Rewards', 'Connect worker placement on buildings to the actions and rewards those buildings provide.'],
  ['Turn Order and Resolution Order', 'Use worker placement to establish turn priority or the order in which actions resolve.'],
];

const slug = (value) => value.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');

export const WORKER_PLACEMENT_MECHANISMS = definitions.map(([label, description]) => ({
  id: `WP-${slug(label)}`,
  kind: 'workerPlacement',
  label,
  category: 'Worker Placement',
  description,
  variations: [''],
  effects: [''],
  imageScale: 1,
  imagePositionX: 0,
  imagePositionY: 0,
  color: COLOR,
  icon: 'users',
  image: mechanismImage(label, COLOR, 'Worker placement'),
  custom: false,
}));

export const WORKER_PLACEMENT_MECHANISM_TYPES = WORKER_PLACEMENT_MECHANISMS.map((record) => record.label);

