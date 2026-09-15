import { mechanismImage } from './mechanismVisual.js';

const COLOR = '#E8D25C';

const definitions = [
  ['Set Valuation', 'Assign value according to the size, composition, rarity, or completeness of a collected set.'],
  ['Tile Laying', 'Place tiles to create patterns, spaces, routes, or scoring relationships.'],
  ['Grid Coverage', 'Score or progress by covering required cells, shapes, or regions of a grid.'],
  ['Network Building', 'Connect elements into routes or networks that satisfy goals or generate value.'],
  ['Combo Abilities', 'Combine collected elements so their abilities interact or produce a stronger effect.'],
];

const slug = (value) => value.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');

export const SET_COLLECTION_MECHANISMS = definitions.map(([label, description]) => ({
  id: `SET-${slug(label)}`,
  kind: 'setCollection',
  label,
  category: 'Set Collection',
  description,
  variations: [''],
  effects: [''],
  imageScale: 1,
  imagePositionX: 0,
  imagePositionY: 0,
  color: COLOR,
  icon: 'target',
  image: mechanismImage(label, COLOR, 'Set collection'),
  custom: false,
}));

export const SET_COLLECTION_MECHANISM_TYPES = SET_COLLECTION_MECHANISMS.map((record) => record.label);

