import { genId } from '../data/csvSchemas.js';

export const TOOLBOX_KEY = 'larpcraft:mechanics-toolbox:v1';
export const WORK_AREAS = [
  { id: 'build', label: 'Build', hint: 'Build the backbone', icon: 'layers' },
  { id: 'adjust', label: 'Adjust', hint: 'Change how it plays', icon: 'cog' },
  { id: 'equip', label: 'Equip', hint: 'Add equipment and places', icon: 'box' },
  { id: 'prepare', label: 'Prepare', hint: 'Get ready to run the activity', icon: 'book' },
];
const CATEGORIES = [
  ['core', 'Game Node Collections', 'build', true],
  ['rules', 'Custom rules', 'build', true],
  ['saved', 'Saved mechanics', 'collection', true],
  ['boardMechanics', 'Board game mechanics', 'collection', true],
  ['changes', 'Rule changes', 'adjust', true],
  ['props', 'Props', 'equip', true],
  ['gadgets', 'Gadgets', 'equip', false],
  ['consumables', 'Consumables', 'equip', false],
  ['sensors', 'Sensor hardware', 'equip', false],
  ['places', 'Locations', 'equip', false],
  ['instructions', 'Instructions for players', 'prepare', true],
  ['notes', 'Facilitator notes', 'prepare', false],
  ['readiness', 'Readiness and progress', 'prepare', false],
  ['people', 'Players and teams', 'prepare', false],
  ['comments', 'Comments', 'prepare', false],
];

export function toolboxPreferences(value) {
  return {
    area: WORK_AREAS.some(area => area.id === value?.area) ? value.area : 'build',
    pinned: Object.fromEntries(CATEGORIES.map(([id, , , initial]) => [id, typeof value?.pinned?.[id] === 'boolean' ? value.pinned[id] : initial])),
  };
}

function categoryFor(group, item, lib) {
  const [type, id] = item.id.split(':');
  const node = type === 'mech' ? lib.mechPrimitives?.[id] : type === 'msub' ? lib.mechSubnodes?.[id] : null;
  const kind = node?.mechKind || node?.kind;
  if (kind === 'action' || type === 'catalogue') return 'boardMechanics';
  if (type === 'template') return 'saved';
  if (type === 'sensor') return 'sensors';
  if (type === 'location' || id === 'placement') return 'places';
  if (type === 'item') return ({ gadget: 'gadgets', consumable: 'consumables' })[lib.items?.[id]?.type] || 'props';
  if (kind === 'playerFacingInstruction') return 'instructions';
  if (kind === 'facilitatorNote') return 'notes';
  if (kind === 'comment') return 'comments';
  if (['player', 'team'].includes(kind)) return 'people';
  if (['readinessStatus', 'progressState'].includes(kind)) return 'readiness';
  if (group.id === 'gameplayModifiers' || id === 'power') return 'changes';
  if (id === 'prop' || id === 'effect') return 'props';
  if (group.id === 'boardGame') return 'core';
  return 'rules';
}

export function toolboxCategories(groups, lib) {
  const categories = CATEGORIES.map(([id, label, area]) => ({ id, label, area, items: [] }));
  const byId = Object.fromEntries(categories.map(category => [category.id, category]));
  for (const group of groups) for (const item of group.items || []) {
    byId[categoryFor(group, item, lib)].items.push(item);
  }
  return categories;
}

export function visibleToolboxCategories(categories, preferences) {
  return categories.filter(category => category.area === preferences.area && preferences.pinned[category.id]);
}

export function searchToolbox(categories, query) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return categories.flatMap(category => category.items.map(item => ({ ...item, categoryId: category.id, categoryLabel: category.label, area: category.area })))
    .filter(item => words.every(word => `${item.label} ${item.blurb || ''} ${item.kicker || ''} ${item.categoryLabel}`.toLowerCase().includes(word)));
}

export const WIZARD_STEPS = [
  { id: 'goal', label: 'Goal', question: 'What should the players achieve?', hint: 'Describe the result they are working towards.' },
  { id: 'actions', label: 'Player actions', question: 'What do the players do?', hint: 'Describe what they move, solve, say, collect, or work out together.' },
  { id: 'rules', label: 'Rules', question: 'What rules must they follow?', hint: 'Describe the limits, allowed actions, or number of tries.' },
  { id: 'success', label: 'Success', question: 'How do we know they succeeded?', hint: 'Describe what players or the facilitator can see or check.' },
];

// This runs only when the user finishes the wizard. Never replace an existing graph.
export function mechanicWizardGraph(answers, existingNodes = {}, position = { x: 90, y: 90 }) {
  const nodes = {}, edges = [];
  for (const step of WIZARD_STEPS) {
    const body = answers[step.id]?.trim();
    if (!body) continue;
    const index = Object.keys(nodes).length;
    const id = genId({ ...existingNodes, ...nodes }, 'WIZ-');
    const node = { id, title: step.label, body, x: position.x + (index % 2) * 320, y: position.y + Math.floor(index / 2) * 220, color: null,
      kind: step.id === 'rules' ? 'rule' : 'objective',
      ...(step.id === 'goal' ? { kind: 'mechanic', mechKind: 'goal', icon: 'target', color: '#E8D25C' } : {}),
    };
    const previous = Object.values(nodes).at(-1);
    nodes[id] = node;
    if (previous) edges.push({ from: previous.id, to: id, label: '', color: null });
  }
  return { nodes, edges };
}
