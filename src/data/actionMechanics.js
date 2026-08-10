import { mechanismImage } from './mechanismVisual.js';

export const ACTION_MECHANISM_FAMILIES = {
  economy: { label: 'Action Token Systems', color: '#E8D25C', icon: 'pin' },
  flow: { label: 'Action Order Systems', color: '#5CA8F5', icon: 'swap' },
  access: { label: 'Action Special System', color: '#A87BF0', icon: 'flag' },
  prompt: { label: 'Action Special System', color: '#43BF87', icon: 'book' },
  physical: { label: 'Action Special System', color: '#E0A23C', icon: 'cog' },
};

export const ACTION_MECHANISMS = [
  { code: 'ACT-01', name: 'Action Points', family: 'economy', summary: 'Players receive a limited action budget and spend it on available actions.' },
  { code: 'ACT-02', name: 'Action Drafting', family: 'economy', summary: 'Players choose limited actions from a shared pool, making those choices unavailable to others.' },
  { code: 'ACT-03', name: 'Action Retrieval', family: 'economy', summary: 'Used actions become unavailable until a player retrieves or refreshes them.' },
  { code: 'ACT-04', name: 'Action / Event', family: 'economy', summary: 'A player chooses between using an action resource and resolving a special event.' },
  { code: 'ACT-05', name: 'Command Cards', family: 'economy', summary: 'Cards determine which units, roles, or participants may act.' },
  { code: 'ACT-06', name: 'Action Queue', family: 'flow', summary: 'Players program actions that resolve later in a defined sequence.' },
  { code: 'ACT-07', name: 'Shared Action Queue', family: 'flow', summary: 'Players contribute to one common queue whose actions affect everyone.' },
  { code: 'ACT-08', name: 'Follow', family: 'flow', summary: 'One participant selects an action and others may perform the same or a modified version.' },
  { code: 'ACT-09', name: 'Order Counters', family: 'flow', summary: 'Players commit hidden or visible orders to locations before resolving them.' },
  { code: 'ACT-10', name: 'Rondel', family: 'flow', summary: 'Available actions follow a circular sequence, with movement determining access or cost.' },
  { code: 'ACT-11', name: 'Action Selection Restrictions', family: 'access', summary: 'Rules restrict which actions a participant may currently choose.' },
  { code: 'ACT-12', name: 'Variable Player Powers', family: 'access', summary: 'Different players or teams receive unique actions or modifications to shared actions.' },
  { code: 'ACT-13', name: 'Once-per-Game Abilities', family: 'access', summary: 'A powerful special action may be used only once during the game.' },
  { code: 'ACT-14', name: 'Advantage Token', family: 'access', summary: 'A transferable token grants or modifies a special action for its current holder.' },
  { code: 'ACT-15', name: 'Gating and Unlocking', family: 'access', summary: 'Actions become available only after a condition, threshold, stage, or discovery.' },
  { code: 'ACT-16', name: 'Tech Trees / Tracks', family: 'access', summary: 'Progress unlocks new actions or improves actions already available.' },
  { code: 'ACT-17', name: 'Events', family: 'prompt', summary: 'An external event immediately changes the game state or later actions.' },
  { code: 'ACT-18', name: 'Narrative Choice', family: 'prompt', summary: 'Players choose between actions presented through a narrative situation.' },
  { code: 'ACT-19', name: 'Bingo', family: 'prompt', summary: 'Randomly presented elements determine which actions or patterns players pursue.' },
  { code: 'ACT-20', name: 'Layering', family: 'physical', summary: 'Overlapping physical components determine which visible areas or actions are active.' },
  { code: 'ACT-21', name: 'Slide / Push', family: 'physical', summary: 'Moving one object pushes or repositions other objects in its path.' },
  { code: 'ACT-22', name: 'Matching', family: 'physical', summary: 'A new action or component must match a visible feature of an earlier one.' },
  { code: 'ACT-23', name: 'Drawing', family: 'physical', summary: 'A participant represents something visually for others to interpret or guess.' },
];

const slug = (value) => value.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');

export const ACTION_PATTERN_SYSTEMS = {
  token: { id: 'token', label: 'Action Token Systems' },
  order: { id: 'order', label: 'Action Order Systems' },
  special: { id: 'special', label: 'Action Special System' },
};

export const ACTION_MECHANISM_NODE_KIND = 'actionMechanism';

const copyMechanismList = (values) => (
  Array.isArray(values) ? values.map((value) => `${value || ''}`) : ['']
);

// Applying a catalogue mechanism changes the generic Action placeholder into
// a self-contained canvas node. Geometry and graph identity are deliberately
// omitted so the caller's existing position, size, and relationships survive.
export function actionMechanismNodePatch(record) {
  if (!record || record.kind !== 'pattern') return null;
  return {
    primitiveId: null,
    mechKind: ACTION_MECHANISM_NODE_KIND,
    actionMechanismId: record.id,
    mechanismSystem: record.system,
    mechanismCategory: ACTION_PATTERN_SYSTEMS[record.system]?.label || record.category || 'Action Mechanism',
    title: record.label || 'Action Mechanism',
    body: record.description || '',
    color: record.color || '#58C7A6',
    icon: record.icon || 'cog',
    image: record.image ? { ...record.image } : null,
    imageScale: Number(record.imageScale) || 1,
    imagePositionX: Number(record.imagePositionX) || 0,
    imagePositionY: Number(record.imagePositionY) || 0,
    advantages: copyMechanismList(record.advantages),
    effects: copyMechanismList(record.effects),
    variations: copyMechanismList(record.variations),
    tokenMechanismId: undefined,
    orderMechanismId: undefined,
    specialMechanismId: undefined,
    attachedSubnodeIds: undefined,
    actionCode: undefined,
  };
}

export function updateActionPatternSelection(fields, system, mechanismId, mechanismsById) {
  const selectionKey = `${system}MechanismId`;
  const previousId = fields[selectionKey] || '';
  const mechanism = mechanismId ? mechanismsById?.[mechanismId] : null;
  if (mechanismId && (!mechanism || mechanism.system !== system)) return fields;

  const next = { ...fields, [selectionKey]: mechanismId || '' };
  if (mechanism) {
    return {
      ...next,
      activeMechanismId: mechanism.id,
    };
  }

  if (fields.activeMechanismId !== previousId) return next;
  const fallbackId = Object.keys(ACTION_PATTERN_SYSTEMS)
    .map((candidateSystem) => next[`${candidateSystem}MechanismId`])
    .find((candidateId) => candidateId && mechanismsById?.[candidateId]) || '';
  const fallback = mechanismsById?.[fallbackId];
  return {
    ...next,
    activeMechanismId: fallbackId,
  };
}

export const actionPatternSystemForCode = (code) => {
  if (['ACT-01', 'ACT-02', 'ACT-03', 'ACT-04', 'ACT-05', 'ACT-14'].includes(code)) return 'token';
  if (['ACT-06', 'ACT-07', 'ACT-08', 'ACT-09', 'ACT-10'].includes(code)) return 'order';
  return 'special';
};

export const actionPatternMechanismId = (name) => `APM-${slug(name)}`;

export function makeActionPatternMechanisms() {
  return Object.fromEntries(ACTION_MECHANISMS.map((mechanism) => {
    const id = actionPatternMechanismId(mechanism.name);
    const system = actionPatternSystemForCode(mechanism.code);
    const meta = ACTION_PATTERN_SYSTEMS[system];
    const family = ACTION_MECHANISM_FAMILIES[mechanism.family];
    return [id, {
      id,
      kind: 'pattern',
      system,
      label: mechanism.name,
      description: mechanism.summary,
      category: meta.label,
      color: family?.color || '#58C7A6',
      icon: family?.icon || 'cog',
      image: mechanismImage(mechanism.name, family?.color || '#58C7A6', meta.label),
      imageScale: 1,
      imagePositionX: 0,
      imagePositionY: 0,
      advantages: [''],
      effects: [''],
      variations: [''],
      custom: false,
    }];
  }));
}

export function makeActionMechanicTemplates() {
  const catalogue = makeActionPatternMechanisms();
  return Object.fromEntries(ACTION_MECHANISMS.map((mechanism) => {
    const system = actionPatternSystemForCode(mechanism.code);
    const mechanismId = actionPatternMechanismId(mechanism.name);
    const mechanismRecord = catalogue[mechanismId];
    const id = `LIB-MSTRUCT-${mechanism.code}`;
    const modifierId = 'PATTERN';
    return [id, {
      id,
      name: mechanism.name,
      description: mechanism.summary,
      templateKind: 'action',
      actionCode: mechanism.code,
      actionFamily: mechanism.family,
      estMinutes: 1,
      tags: ['Action Template', mechanism.code, ACTION_PATTERN_SYSTEMS[system].label],
      nodes: {
        ACTION: {
          id: 'ACTION', primitiveId: 'LIB-MPRIM-ACTION', kind: 'mechanic', mechKind: 'action',
          title: mechanism.name, x: 80, y: 100, body: mechanism.summary, color: '#58C7A6',
          tokenMechanismId: system === 'token' ? mechanismId : '',
          orderMechanismId: system === 'order' ? mechanismId : '',
          specialMechanismId: system === 'special' ? mechanismId : '',
          attachedSubnodeIds: [modifierId], actionCode: mechanism.code,
        },
        INSTRUCTION: {
          id: 'INSTRUCTION', primitiveId: 'LIB-MPRIM-PLAYER-INSTRUCTION', kind: 'mechanic', mechKind: 'playerFacingInstruction',
          title: `${mechanism.name} Instruction`, x: 400, y: 40, body: '', color: '#E8D25C',
        },
        [modifierId]: {
          id: modifierId, primitiveId: 'LIB-MSUB-actionTypePattern', kind: 'mechanicSubnode',
          subnodeKind: 'actionTypePattern', title: 'Action Type Pattern', x: 400, y: 220,
          body: mechanism.summary,
          image: mechanismRecord.image,
          color: '#58C7A6', icon: 'cog', category: 'gameplayModifiers', attachesTo: ['action', 'actionSequence', '*'],
          fields: {
            tokenMechanismId: system === 'token' ? mechanismId : '',
            orderMechanismId: system === 'order' ? mechanismId : '',
            specialMechanismId: system === 'special' ? mechanismId : '',
            activeMechanismId: mechanismId,
          },
        },
      },
      edges: [
        { from: 'ACTION', to: 'INSTRUCTION', label: 'present as', color: '#E8D25C' },
        { from: 'ACTION', to: modifierId, label: 'configured by', color: '#58C7A6' },
      ],
      frames: {}, numberMarkers: {}, titleMarkers: {},
    }];
  }));
}
