import { mechanismImage } from './mechanismVisual.js';

const COLOR = '#3EC6D6';

const definitions = [
  ['Tessellation', 'Arrange repeating shapes so movement and adjacency follow the geometry of the play space.'],
  ['Roll and Move', 'Roll a randomizer and move according to the resulting distance or instruction.'],
  ['Pattern Movement', 'Move pieces according to a predefined spatial pattern.'],
  ['Movement Points', 'Spend a limited allowance of points to move through spaces or terrain.'],
  ['Resource to Move', 'Spend a resource in order to move or increase movement.'],
  ['Measurement', 'Measure physical distance directly to determine legal movement.'],
  ['Different Dice', 'Choose or assign different dice whose values and probabilities determine movement.'],
  ['Drift', 'Apply automatic or persistent movement in a particular direction.'],
  ['Impulse', 'Resolve movement in short shared steps or impulses rather than one complete move at a time.'],
  ['Programmed Movement', 'Choose movement instructions in advance and reveal or execute them later.'],
  ['Relative Position', 'Determine movement from the position or orientation of other pieces rather than a fixed map.'],
  ['Manacla', 'Move groups of pieces by distributing them sequentially across spaces.'],
  ['Chaining', 'Continue movement by linking one valid movement, space, or piece to the next.'],
  ['Bias', 'Make movement more likely or effective in selected directions or conditions.'],
  ['Moving Multiple Units', 'Move several units together, sequentially, or through one shared instruction.'],
  ['Map Addition', 'Expand the available play space by adding new map areas during play.'],
  ['Map Production', 'Create or reveal the map progressively through player actions or game procedures.'],
  ['Map Deformation', 'Change the shape, connections, or accessibility of the existing map.'],
  ['Move Through Deck', 'Represent movement by progressing through cards or an ordered deck.'],
  ['Movement Tempo', 'Control the rhythm and frequency with which movement becomes available.'],
  ['Pieces as Map', 'Use placed pieces themselves to define spaces, routes, or terrain.'],
  ['Multiple Maps', 'Use more than one connected or parallel play space for movement.'],
  ['Shortcuts', 'Provide routes that reduce distance or bypass normal movement requirements.'],
  ['Hidden Movement', 'Keep some or all movement information concealed from other participants.'],
];

const slug = (value) => value.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');

export const MOVEMENT_MECHANISMS = definitions.map(([label, description]) => ({
  id: `MOV-${slug(label)}`,
  kind: 'movement',
  label,
  category: 'Movement',
  description,
  variations: [''],
  effects: [''],
  imageScale: 1,
  imagePositionX: 0,
  imagePositionY: 0,
  color: COLOR,
  icon: 'pin',
  image: mechanismImage(label, COLOR, 'Movement mechanism'),
  custom: false,
}));

export const MOVEMENT_MECHANISM_TYPES = MOVEMENT_MECHANISMS.map((record) => record.label);

