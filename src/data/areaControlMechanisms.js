import { mechanismImage } from './mechanismVisual.js';

const COLOR = '#43BF87';

const definitions = [
  ['Absolute Control', 'Control an area by meeting an exclusive requirement that prevents competing control.'],
  ['Area Majority Influence', 'Control or score an area by having more influence there than competing participants.'],
  ['Troop Types', 'Use units with different capabilities or values when establishing control over an area.'],
  ['Territories and Regions', 'Organize the play space into defined areas that can be occupied, contested, or controlled.'],
  ['Area Perimeters', 'Determine control through borders, enclosure, or presence around the edge of an area.'],
  ['Force Projection', 'Extend influence or control from a unit, base, or nearby controlled area.'],
  ['Zone of Control', 'Limit or affect movement and actions within the surrounding reach of a unit or position.'],
  ['Line of Sight', 'Require an unobstructed visual or spatial path for influence, targeting, or control.'],
];

const slug = (value) => value.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');

export const AREA_CONTROL_MECHANISMS = definitions.map(([label, description]) => ({
  id: `AC-${slug(label)}`,
  kind: 'areaControl',
  label,
  category: 'Area Control',
  description,
  variations: [''],
  effects: [''],
  imageScale: 1,
  imagePositionX: 0,
  imagePositionY: 0,
  color: COLOR,
  icon: 'target',
  image: mechanismImage(label, COLOR, 'Area control'),
  custom: false,
}));

export const AREA_CONTROL_MECHANISM_TYPES = AREA_CONTROL_MECHANISMS.map((record) => record.label);

