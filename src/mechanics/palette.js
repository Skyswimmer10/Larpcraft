import { ENTITY_COLORS } from '../components/bits.jsx';
import { MECHANIC_SUBNODE_TYPES, TASK_DETAIL_TYPES } from '../data/seed.js';
import { genId } from '../data/csvSchemas.js';
import { isCurrentMechanicPrimitive, isCurrentMechanicSubnode } from './nodeArchive.js';

export const MECHANICS_PALETTE_FILTERS = [
  { id: 'all', label: 'All', color: '#8B7BF5' },
  { id: 'mechanic', label: 'Mechanic Nodes', color: '#A87BF0' },
  { id: 'boardGame', label: 'Board Game Nodes', color: '#58C7A6' },
  { id: 'gameplayModifiers', label: 'Gameplay Modifiers', color: '#F08CB4' },
  { id: 'supporting', label: 'Supporting', color: '#8B92A6' },
  { id: 'physical', label: 'Physical', color: '#E0A23C' },
  { id: 'locations', label: 'Locations', color: '#43BF87' },
  { id: 'templates', label: 'Templates', color: '#8B7BF5' },
];

export const mechanicSubnodeCategory = (node) => {
  const kind = node?.subnodeKind || node?.kind;
  return node?.category || MECHANIC_SUBNODE_TYPES[kind]?.category || 'gameplayModifiers';
};

export const isSupportingMechanicSubnode = (node) => (
  (node?.kind === 'mechanicSubnode' || !!MECHANIC_SUBNODE_TYPES[node?.kind])
  && mechanicSubnodeCategory(node) === 'supporting'
);

const previewText = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  return `${value ?? ''}`.trim();
};

export function supportingMechanicSubnodePreview(node, game = null) {
  if (!isSupportingMechanicSubnode(node)) return null;
  const kind = node.subnodeKind || node.kind;
  const fields = node.fields || {};
  if (kind === 'comment') {
    return { label: 'Comment', text: previewText(fields.commentText), empty: 'No comment yet' };
  }
  if (kind === 'facilitatorNote') {
    return { label: 'Facilitator', text: previewText(fields.facilitatorGuidance), empty: 'No guidance yet' };
  }
  if (kind === 'readinessStatus') {
    const status = previewText(fields.status);
    const notes = previewText(fields.notes);
    return { label: 'Status', text: status, detail: notes, empty: 'Draft' };
  }
  if (kind === 'player') {
    const ids = Array.isArray(fields.playerIds) ? fields.playerIds : [];
    const links = ids.map((id) => ({ kind: 'player', id, label: game?.players?.[id]?.name || id }));
    return { label: 'Players', text: links.map((link) => link.label).join(', '), links, empty: 'No players selected' };
  }
  if (kind === 'team') {
    const ids = Array.isArray(fields.teamIds) ? fields.teamIds : [];
    const links = ids.map((id) => ({ kind: 'team', id, label: game?.teams?.[id]?.name || id }));
    return { label: 'Teams', text: links.map((link) => link.label).join(', '), links, empty: 'No teams selected' };
  }
  return null;
}

const itemTypeMeta = (lib, type) => lib.itemTypes?.[type] || { label: type || 'Item', color: ENTITY_COLORS.item, id: type || 'item' };

const payload = (type, id) => `${type}:${id}`;

const defaultCooperation = () => ({
  id: 'COOP-1',
  primitiveId: 'LIB-MPRIM-COOPERATION',
  kind: 'mechanic',
  mechKind: 'cooperation',
  title: 'Cooperation',
  body: 'Define how players coordinate, divide roles, or act together.',
  x: 80,
  y: 80,
  color: '#A87BF0',
  refs: {},
  estMinutes: 15,
  crew: 1,
  collapseDepth: 0,
  cooperationStyle: 'Parallel',
  attachedSubnodeIds: [],
});

export const isProgressStateNode = (node) => node?.mechKind === 'progressState';
export const progressValue = (node) => Math.min(10, Math.max(1, Number(node?.currentProgress) || 1));
export const progressPercent = (node) => Math.round((progressValue(node) / 10) * 100);

const activeMechanicPrimitives = (lib) => Object.values(lib.mechPrimitives || {})
  .filter((node) => !node.deprecated && isCurrentMechanicPrimitive(node));

const defaultTaskTemplateSubgraph = () => ({
  nodes: { 'COOP-1': defaultCooperation() },
  edges: [],
  frames: {},
});

export function buildMechanicsPaletteGroups(lib, {
  onAdd,
  includeTask = true,
  includeDetail = false,
  includeTemplates = false,
  includePhysical = true,
  includeLocations = true,
} = {}) {
  const itemGroups = Object.values(lib.itemTypes || {}).map((type) => {
    const items = Object.values(lib.items || {}).filter((item) => item.type === type.id);
    return {
      id: `items:${type.id}`,
      type: 'physical',
      label: type.label,
      items: items.map((item) => ({
        id: payload('item', item.id),
        label: item.name,
        blurb: item.description || item.propNotes || `${type.label} template`,
        color: type.color,
        icon: type.id === 'artifact' ? 'flag' : type.id === 'consumable' ? 'pin' : 'swap',
        kicker: item.id,
        dragPayload: payload('item', item.id),
        onClick: () => onAdd?.(payload('item', item.id)),
      })),
    };
  });

  const subnodes = Object.values(lib.mechSubnodes || {})
    .filter((node) => !node.deprecated && !node.hiddenFromPalette && isCurrentMechanicSubnode(node));
  const gameplayModifierSubnodes = subnodes.filter((node) => mechanicSubnodeCategory(node) === 'gameplayModifiers');
  const supportingSubnodes = subnodes.filter((node) => mechanicSubnodeCategory(node) === 'supporting');
  const primitives = activeMechanicPrimitives(lib);
  const actionPrimitives = primitives.filter((node) => node.category === 'action');
  const mechanicPrimitives = primitives.filter((node) => node.category !== 'supporting' && node.category !== 'action');
  const supportingPrimitives = primitives.filter((node) => node.category === 'supporting');

  return [
    includeTask && {
      id: 'task',
      type: 'mechanic',
      label: 'Task Flow',
      items: [{
        id: 'task',
        label: 'Task',
        blurb: 'A clean collapsed task node. Double-click to edit its internal mechanics.',
        color: '#5BC0BE',
        icon: 'layers',
        dragPayload: 'task',
        onClick: () => onAdd?.('task'),
      }],
    },
    includeDetail && {
      id: 'detail',
      type: 'mechanic',
      label: 'Task Detail Nodes',
      items: Object.values(TASK_DETAIL_TYPES).map((t) => ({
        id: payload('detail', t.id),
        label: t.label,
        blurb: t.blurb,
        color: t.color,
        icon: t.icon,
        dragPayload: payload('detail', t.id),
        onClick: () => onAdd?.(payload('detail', t.id)),
      })),
    },
    {
      id: 'boardGame',
      type: 'boardGame',
      label: 'Board Game Nodes',
      hint: 'Action, sequence, and resolution building blocks for board-game-style systems.',
      items: actionPrimitives.map((node) => ({
        id: payload('mech', node.id), label: node.name,
        blurb: node.defaultBody || (node.mechKind === 'playerFacingInstruction' ? 'The exact instruction presented or read to players.' : ''),
        color: node.color, icon: node.icon, kicker: node.mechKind,
        dragPayload: payload('mech', node.id), onClick: () => onAdd?.(payload('mech', node.id)),
      })),
    },
    {
      id: 'mechanic',
      type: 'mechanic',
      label: 'Mechanic Nodes',
      items: mechanicPrimitives.map((node) => ({
        id: payload('mech', node.id),
        label: node.name,
        blurb: node.defaultBody,
        color: node.color,
        icon: node.icon,
        kicker: node.mechKind || node.baseKind,
        dragPayload: payload('mech', node.id),
        onClick: () => onAdd?.(payload('mech', node.id)),
      })),
    },
    {
      id: 'gameplayModifiers',
      type: 'gameplayModifiers',
      label: 'Gameplay Modifiers',
      hint: 'Attachable task modifiers, especially for Cooperation and Task Template nodes.',
      items: gameplayModifierSubnodes.map((node) => ({
        id: payload('msub', node.id),
        label: node.name,
        blurb: node.description || node.purpose,
        color: node.color,
        icon: node.icon,
        kicker: node.reusable ? 'Reusable' : 'Modifier',
        dragPayload: payload('msub', node.id),
        onClick: () => onAdd?.(payload('msub', node.id)),
      })),
    },
    (supportingPrimitives.length > 0 || supportingSubnodes.length > 0) && {
      id: 'supporting',
      type: 'supporting',
      label: 'Supporting',
      hint: 'Player-facing instructions, reusable notes, player/team selectors, comments, and status tags.',
      items: [
        ...supportingPrimitives.map((node) => ({
          id: payload('mech', node.id),
          label: node.name,
          blurb: node.defaultBody,
          color: node.color,
          icon: node.icon,
          kicker: 'Supporting',
          dragPayload: payload('mech', node.id),
          onClick: () => onAdd?.(payload('mech', node.id)),
        })),
        ...supportingSubnodes.map((node) => ({
          id: payload('msub', node.id),
          label: node.name,
          blurb: node.purpose,
          color: node.color,
          icon: node.icon,
          kicker: 'Universal',
          dragPayload: payload('msub', node.id),
          onClick: () => onAdd?.(payload('msub', node.id)),
        })),
      ],
    },
    ...(includePhysical ? itemGroups : []),
    includePhysical && {
      id: 'sensors',
      type: 'physical',
      label: 'Sensors',
      items: Object.values(lib.sensors || {}).map((sensor) => ({
        id: payload('sensor', sensor.id),
        label: sensor.kind,
        blurb: sensor.label,
        color: ENTITY_COLORS.sensor,
        icon: 'zap',
        kicker: sensor.id,
        dragPayload: payload('sensor', sensor.id),
        onClick: () => onAdd?.(payload('sensor', sensor.id)),
      })),
    },
    includeLocations && {
      id: 'locations',
      type: 'locations',
      label: 'Locations',
      items: Object.values(lib.locations || {}).map((location) => ({
        id: payload('location', location.id),
        label: location.name,
        blurb: location.notes || location.safety,
        color: ENTITY_COLORS.location,
        icon: 'pin',
        kicker: location.id,
        dragPayload: payload('location', location.id),
        onClick: () => onAdd?.(payload('location', location.id)),
      })),
    },
    includeTemplates && {
      id: 'actionTemplates',
      type: 'templates',
      label: 'Action Templates',
      hint: 'Book-inspired starting points. Each opens as an editable action plus its relevant modifier.',
      items: Object.values(lib.mechStructures || {}).filter((template) => template.templateKind === 'action').map((template) => ({
        id: payload('template', template.id),
        label: template.name,
        blurb: template.description,
        color: '#58C7A6',
        icon: 'zap',
        kicker: template.actionCode || 'Action',
        dragPayload: payload('template', template.id),
        onClick: () => onAdd?.(payload('template', template.id)),
      })),
    },
    includeTemplates && {
      id: 'templates', type: 'templates', label: 'Task Templates',
      items: Object.values(lib.mechStructures || {}).filter((template) => template.templateKind !== 'action').map((template) => ({
        id: payload('template', template.id), label: template.name, blurb: template.description,
        color: '#8B7BF5', icon: 'layers', kicker: `${Object.keys(template.nodes || {}).length} nodes`,
        dragPayload: payload('template', template.id), onClick: () => onAdd?.(payload('template', template.id)),
      })),
    },
  ].filter(Boolean);
}

export const filterMechanicsPaletteGroups = (groups, activeFilter) => {
  if (activeFilter === 'all') return groups;
  return groups.filter((group) => group.type === activeFilter || group.id === activeFilter || (activeFilter === 'physical' && group.type === 'physical'));
};

export function buildMechanicsLibrarySections(lib, onPick) {
  return [
    {
      id: 'actionTemplates',
      label: 'Action Templates',
      hint: 'Reusable action mechanisms inspired by Building Blocks of Tabletop Game Design.',
      items: Object.values(lib.mechStructures || {}).filter((template) => template.templateKind === 'action').map((template) => ({
        id: payload('template', template.id), label: template.name, blurb: template.description,
        color: '#58C7A6', icon: 'zap', kicker: template.actionCode || 'Action',
        onPick: () => onPick?.(payload('template', template.id)),
      })),
    },
    {
      id: 'mechanicTemplates',
      label: 'Task Templates',
      hint: 'Reusable mechanics structures that drop onto the canvas as clean task/template nodes.',
      items: Object.values(lib.mechStructures || {}).filter((template) => template.templateKind !== 'action').map((template) => ({
        id: payload('template', template.id),
        label: template.name,
        blurb: template.description,
        color: '#8B7BF5',
        icon: 'layers',
        kicker: `${Object.keys(template.nodes || {}).length} nodes`,
        onPick: () => onPick?.(payload('template', template.id)),
      })),
    },
    {
      id: 'supportingMechanics',
      label: 'Supporting Nodes',
      hint: 'Lightweight progress, status, and utility nodes that support tasks without becoming core mechanics.',
      items: activeMechanicPrimitives(lib).filter((node) => node.category === 'supporting').map((node) => ({
        id: payload('mech', node.id),
        label: node.name,
        blurb: node.defaultBody,
        color: node.color,
        icon: node.icon,
        kicker: 'Supporting',
        onPick: () => onPick?.(payload('mech', node.id)),
      })),
    },
    {
      id: 'physicalItems',
      label: 'Physical Elements',
      hint: 'Items, gadgets, artifacts, consumables, and other physical records from the master database.',
      items: Object.values(lib.items || {}).map((item) => {
        const meta = itemTypeMeta(lib, item.type);
        return {
          id: payload('item', item.id),
          label: item.name,
          blurb: item.description || item.propNotes || `${meta.label} template`,
          color: meta.color,
          icon: meta.id === 'artifact' ? 'flag' : meta.id === 'consumable' ? 'pin' : 'swap',
          kicker: meta.label,
          onPick: () => onPick?.(payload('item', item.id)),
        };
      }),
    },
    {
      id: 'sensorHardware',
      label: 'Sensor Hardware',
      hint: 'Reusable sensor records that can be referenced by mechanics nodes.',
      items: Object.values(lib.sensors || {}).map((sensor) => ({
        id: payload('sensor', sensor.id),
        label: sensor.kind,
        blurb: sensor.label,
        color: ENTITY_COLORS.sensor,
        icon: 'zap',
        kicker: sensor.id,
        onPick: () => onPick?.(payload('sensor', sensor.id)),
      })),
    },
    {
      id: 'locations',
      label: 'Locations',
      hint: 'Physical and playable locations from the library.',
      items: Object.values(lib.locations || {}).map((location) => ({
        id: payload('location', location.id),
        label: location.name,
        blurb: location.notes || location.safety,
        color: ENTITY_COLORS.location,
        icon: 'pin',
        kicker: location.id,
        onPick: () => onPick?.(payload('location', location.id)),
      })),
    },
  ];
}

export function mechanicsPayloadToNode(payloadText, lib, existingNodes = {}, x = 80, y = 80, idPrefix = 'M') {
  const [type, id] = payloadText.includes(':') ? payloadText.split(':') : [payloadText, null];
  const nodeId = genId(existingNodes, `${idPrefix}-`);
  const base = { id: nodeId, x: Math.round(x), y: Math.round(y), color: null };

  if (type === 'task') return { ...base, kind: 'task', title: 'New task', body: '', sub: { nodes: {}, edges: [] } };
  if (type === 'detail') {
    const t = TASK_DETAIL_TYPES[id];
    if (!t) return null;
    return { ...base, kind: t.id, title: `New ${t.label.toLowerCase()}`, body: '', color: t.color };
  }
  if (type === 'mech') {
    const p = lib.mechPrimitives?.[id];
    if (!p) return null;
    if (p.deprecated) {
      globalThis.window?.alert?.(p.migrationHint || 'This mechanic node is deprecated. Use the newer replacement node instead.');
      return null;
    }
    const {
      id: _pid, name: _name, baseKind: _baseKind, defaultBody: _defaultBody,
      inputs: _inputs, outputs: _outputs, color: _color, icon: _icon, ...extras
    } = p;
    return {
      ...base, primitiveId: p.id, kind: p.baseKind, mechKind: p.mechKind, title: p.name,
      body: p.defaultBody || '', color: p.color ?? null, refs: p.refs ? JSON.parse(JSON.stringify(p.refs)) : {},
      ...JSON.parse(JSON.stringify(extras)),
      sub: p.mechKind === 'taskTemplate' ? defaultTaskTemplateSubgraph()
        : p.mechKind === 'actionSequence' ? { nodes: {}, edges: [], frames: {} }
          : undefined,
    };
  }
  if (type === 'msub') {
    const sn = lib.mechSubnodes?.[id];
    if (!sn) return null;
    if (sn.deprecated || sn.hiddenFromPalette) {
      globalThis.window?.alert?.(sn.purpose || 'This mechanic subnode is deprecated. Use the newer built-in node fields instead.');
      return null;
    }
    return {
      ...base, primitiveId: sn.id, kind: 'mechanicSubnode', subnodeKind: sn.kind, title: sn.name,
      body: sn.description || sn.purpose || '', color: sn.color ?? null, icon: sn.icon,
      category: mechanicSubnodeCategory(sn),
      fields: JSON.parse(JSON.stringify(sn.fields || {})), attachesTo: [...(sn.attachesTo || ['*'])],
    };
  }
  if (type === 'item') {
    const item = lib.items?.[id];
    if (!item) return null;
    const meta = itemTypeMeta(lib, item.type);
    return {
      ...base, primitiveId: item.id, kind: 'objective', physicalKind: 'item', itemId: item.id,
      title: item.name, body: item.description || item.propNotes || '', color: meta.color,
      refs: { itemIds: [item.id], sensorIds: (item.sensorReqs || []).map((s) => s.sensorId), mechanicIds: item.mechanicIds || [] },
    };
  }
  if (type === 'sensor') {
    const sensor = lib.sensors?.[id];
    if (!sensor) return null;
    return {
      ...base, primitiveId: sensor.id, kind: 'sensor', physicalKind: 'sensor', sensorId: sensor.id,
      title: sensor.kind, body: sensor.label || '', color: ENTITY_COLORS.sensor, refs: { sensorIds: [sensor.id] },
    };
  }
  if (type === 'location') {
    const location = lib.locations?.[id];
    if (!location) return null;
    return {
      ...base, primitiveId: location.id, kind: 'location', physicalKind: 'location', locationId: location.id,
      title: location.name, body: location.notes || location.safety || '', color: ENTITY_COLORS.location, refs: { locationIds: [location.id] },
    };
  }
  if (type === 'template') {
    const template = lib.mechStructures?.[id];
    if (!template) return null;
    const actionTemplate = template.templateKind === 'action';
    return {
      ...base, primitiveId: template.id, kind: actionTemplate ? 'mechanic' : 'task', mechKind: actionTemplate ? 'actionSequence' : 'taskTemplate', title: template.name,
      body: template.description || '', color: actionTemplate ? '#58C7A6' : '#8B7BF5', templateId: template.id,
      sequenceMode: actionTemplate ? 'Custom' : undefined,
      sub: {
        nodes: JSON.parse(JSON.stringify(template.nodes || {})),
        edges: JSON.parse(JSON.stringify(template.edges || [])),
        frames: JSON.parse(JSON.stringify(template.frames || {})),
      },
    };
  }
  return null;
}
