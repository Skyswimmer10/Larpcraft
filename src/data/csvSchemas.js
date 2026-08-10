// Per-section CSV schemas: how each collection flattens to rows (export) and
// how a row becomes an entity again (import). Import merges by id — an
// existing id updates that record, a new id creates one. `blank(id)` supplies
// defaults for created records and for the per-page "add new" buttons.
// Fields that can't survive a spreadsheet (images, live assignments) are
// omitted from CSV and preserved on update.

const ITEM_TYPES = ['artifact', 'gadget', 'consumable', 'key', 'clue', 'status', 'tool', 'wearable'];
const BUILD = ['concept', 'design', 'build', 'tested', 'packed'];
const AVAIL = ['ready', 'in-use', 'deployed', 'missing'];
const NODE_KINDS = ['story', 'location', 'objective', 'enemy', 'mechanic', 'sensor', 'beat', 'reveal', 'branch', 'fact', 'converge', 'timed', 'recovery', 'event', 'character', 'storyLocation', 'item', 'quest', 'concept'];

export function genId(existing, prefix) {
  let n = Object.keys(existing).length + 1;
  let id;
  do { id = `${prefix}${String(n).padStart(3, '0')}`; n++; } while (existing[id]);
  return id;
}

const list = (v) => (v ? v.split(';').map((x) => x.trim()).filter(Boolean) : []);
const joinNames = (values) => values.filter(Boolean).join('; ');
const itemTypeLabel = (s, id) => s.itemTypes?.[id]?.label || id || '';
const sensorLabel = (s, id) => {
  const sensor = s.sensors?.[id];
  return sensor ? `${sensor.label || sensor.kind || id} (${id})` : id;
};
const mechanicLabel = (s, id) => {
  const mech = s.mechanics?.[id];
  return mech ? `${mech.name || mech.title || id} (${id})` : id;
};
const playerOrTeamLabel = (s, assignedTo) => {
  if (!assignedTo) return '';
  const player = assignedTo.playerId ? s.players?.[assignedTo.playerId] : null;
  const team = assignedTo.teamId ? s.teams?.[assignedTo.teamId] : null;
  if (player && team) return `${player.name} / ${team.name}`;
  if (player) return player.name;
  if (team) return team.name;
  return assignedTo.playerId || assignedTo.teamId || '';
};
const NODE_KIND_LABELS = {
  story: 'Story',
  location: 'Location',
  objective: 'Objective',
  enemy: 'Enemy',
  mechanic: 'Mechanic',
  sensor: 'Sensor',
  beat: 'Beat',
  reveal: 'Reveal',
  branch: 'Branch',
  fact: 'Fact change',
  converge: 'Convergence',
  timed: 'Timed event',
  recovery: 'Recovery',
  event: 'Event',
  character: 'Character',
  storyLocation: 'Story Location',
  item: 'Story Item',
  quest: 'Quest',
  concept: 'Concept',
};
const TASK_NODE_KIND_LABELS = {
  task: 'Task',
  mechanic: 'Mechanic',
  objective: 'Objective',
  state: 'State',
  sensor: 'Sensor',
  rule: 'Rule',
  effect: 'Effect',
  power: 'Power',
  mechanicSubnode: 'Mechanic Subnode',
};
const pickEnum = (v, allowed, fallback, warn, what) => {
  if (!v) return fallback;
  if (allowed.includes(v)) return v;
  warn(`unknown ${what} "${v}" → ${fallback}`);
  return fallback;
};

export const CSV_SCHEMAS = {
  items: {
    filename: 'items.csv',
    headers: ['id', 'name', 'type', 'typeName', 'buildStatus', 'availability', 'assignedTo', 'description', 'propNotes', 'origin', 'loreNotes', 'persistsAcrossTasks', 'locationId', 'locationName', 'mechanicIds', 'mechanicNames', 'sensorReqs', 'sensorReqNames'],
    newId: (s) => genId(s.items, 'CHM-N-'),
    blank: (id) => ({ id, templateId: null, name: 'New item', type: 'gadget', buildStatus: 'concept', availability: 'ready', description: '', propNotes: '', origin: '', loreNotes: '', persistsAcrossTasks: false, locationId: null, mechanicIds: [], sensorReqs: [], image: null, assignedTo: null }),
    toRows: (s) => Object.values(s.items).map((i) => ({
      ...i,
      typeName: itemTypeLabel(s, i.type),
      assignedTo: playerOrTeamLabel(s, i.assignedTo),
      locationId: i.locationId ?? '',
      locationName: i.locationId ? (s.locations?.[i.locationId]?.name || i.locationId) : '',
      mechanicIds: i.mechanicIds.join(';'),
      mechanicNames: joinNames((i.mechanicIds || []).map((id) => mechanicLabel(s, id))),
      sensorReqs: i.sensorReqs.map((r) => (r.note ? `${r.sensorId}:${r.note}` : r.sensorId)).join(';'),
      sensorReqNames: joinNames(i.sensorReqs.map((r) => {
        const label = sensorLabel(s, r.sensorId);
        return r.note ? `${label}: ${r.note}` : label;
      })),
    })),
    fromRow: (row, s, warn) => {
      const typeKeys = s.itemTypes ? Object.keys(s.itemTypes) : ITEM_TYPES;
      const typeFallback = typeKeys.includes('gadget') ? 'gadget' : typeKeys[0];
      const p = {
        name: row.name || 'Unnamed item',
        type: pickEnum(row.type, typeKeys, typeFallback, warn, 'type'),
        buildStatus: pickEnum(row.buildStatus, BUILD, 'concept', warn, 'buildStatus'),
        availability: pickEnum(row.availability, AVAIL, 'ready', warn, 'availability'),
        description: row.description ?? '',
        propNotes: row.propNotes ?? '',
        origin: row.origin ?? '',
        loreNotes: row.loreNotes ?? '',
        persistsAcrossTasks: String(row.persistsAcrossTasks || '').toLowerCase() === 'true' || row.persistsAcrossTasks === '1' || String(row.persistsAcrossTasks || '').toLowerCase() === 'yes',
      };
      p.locationId = row.locationId && s.locations[row.locationId] ? row.locationId : (row.locationId && warn(`unknown location "${row.locationId}"`), null);
      p.mechanicIds = list(row.mechanicIds).filter((m) => s.mechanics[m] || (warn(`unknown mechanic "${m}"`), false));
      p.sensorReqs = list(row.sensorReqs).map((entry) => {
        const idx = entry.indexOf(':');
        const sensorId = idx === -1 ? entry : entry.slice(0, idx);
        const note = idx === -1 ? '' : entry.slice(idx + 1);
        if (!s.sensors[sensorId]) { warn(`unknown sensor "${sensorId}"`); return null; }
        return { sensorId, note };
      }).filter(Boolean);
      return p;
    },
  },

  locations: {
    filename: 'locations.csv',
    headers: ['id', 'name', 'zone', 'notes', 'safety', 'sensorIds', 'sensorNames'],
    newId: (s) => genId(s.locations, 'LOC-N-'),
    blank: (id) => ({ id, templateId: null, name: 'New location', zone: '', notes: '', safety: '', image: null, sensorIds: [], schematic: null, mapKind: 'schematic', osm: { lat: 56.9496, lon: 24.1052, zoom: 16 }, markers: [], arrows: [] }),
    toRows: (s) => Object.values(s.locations).map((l) => ({
      ...l,
      sensorIds: l.sensorIds.join(';'),
      sensorNames: joinNames((l.sensorIds || []).map((id) => sensorLabel(s, id))),
    })),
    fromRow: (row, s, warn) => ({
      name: row.name || 'Unnamed location',
      zone: row.zone ?? '',
      notes: row.notes ?? '',
      safety: row.safety ?? '',
      sensorIds: list(row.sensorIds).filter((x) => s.sensors[x] || (warn(`unknown sensor "${x}"`), false)),
    }),
  },

  players: {
    filename: 'players.csv',
    headers: ['id', 'name', 'nickname', 'initials', 'role', 'teamId', 'teamName', 'flags', 'personality', 'experience', 'strengths', 'weaknesses', 'motivation', 'communicationStyle', 'preferredRole', 'comfortNotes', 'safetyNotes', 'observerNotes', 'previousGames', 'totalPoints', 'stagePoints', 'achievements', 'accomplishments', 'performanceNotes', 'stageHistory', 'gmRewards'],
    newId: (s) => genId(s.players, 'P-N-'),
    blank: (id) => ({
      id, name: 'New player', nickname: '', initials: 'NP', role: 'Player', teamId: null, flags: [], image: null,
      personality: '', experience: '', strengths: '', weaknesses: '', motivation: '',
      communicationStyle: '', preferredRole: '', comfortNotes: '', safetyNotes: '', observerNotes: '',
      previousGames: '', totalPoints: 0, stagePoints: '', achievements: '', accomplishments: '',
      performanceNotes: '', stageHistory: '', gmRewards: '',
    }),
    toRows: (s) => Object.values(s.players).map((p) => ({
      ...p,
      teamName: p.teamId ? (s.teams?.[p.teamId]?.name || p.teamId) : '',
      flags: p.flags.join(';'),
    })),
    fromRow: (row, s, warn) => {
      if (!row.teamId || !s.teams[row.teamId]) {
        warn(`player "${row.id}": unknown team "${row.teamId}" — row skipped`);
        return null;
      }
      const name = row.name || 'Unnamed player';
      return {
        name,
        nickname: row.nickname ?? '',
        initials: row.initials || name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
        role: row.role || 'Player',
        teamId: row.teamId,
        flags: list(row.flags),
        image: null,
        personality: row.personality ?? '',
        experience: row.experience ?? '',
        strengths: row.strengths ?? '',
        weaknesses: row.weaknesses ?? '',
        motivation: row.motivation ?? '',
        communicationStyle: row.communicationStyle ?? '',
        preferredRole: row.preferredRole ?? '',
        comfortNotes: row.comfortNotes ?? '',
        safetyNotes: row.safetyNotes ?? '',
        observerNotes: row.observerNotes ?? '',
        previousGames: row.previousGames ?? '',
        totalPoints: Math.max(0, parseInt(row.totalPoints, 10) || 0),
        stagePoints: row.stagePoints ?? '',
        achievements: row.achievements ?? '',
        accomplishments: row.accomplishments ?? '',
        performanceNotes: row.performanceNotes ?? '',
        stageHistory: row.stageHistory ?? '',
        gmRewards: row.gmRewards ?? '',
      };
    },
  },

  nodes: {
    filename: 'quest-nodes.csv',
    headers: ['id', 'kind', 'kindName', 'title', 'teamId', 'teamName', 'x', 'y', 'color', 'body', 'itemId', 'itemName', 'locationId', 'locationName', 'mechanicIds', 'mechanicNames', 'sensorIds', 'sensorNames', 'connectsTo', 'connectsToTitles'],
    newId: (s) => genId(s.nodes, 'N-'),
    blank: (id) => ({ id, kind: 'story', title: 'New story beat', x: 80, y: 80, body: '', color: null, image: null, locationId: null, itemId: null, mechanicIds: [], sensorIds: [] }),
    toRows: (s) => Object.values(s.nodes).map((n) => ({
      ...n,
      kindName: NODE_KIND_LABELS[n.kind] || n.kind,
      teamId: n.teamId ?? '',
      teamName: n.teamId ? (s.teams?.[n.teamId]?.name || n.teamId) : '',
      color: n.color ?? '',
      itemId: n.itemId ?? '',
      itemName: n.itemId ? (s.items?.[n.itemId]?.name || n.itemId) : '',
      locationId: n.locationId ?? '',
      locationName: n.locationId ? (s.locations?.[n.locationId]?.name || n.locationId) : '',
      mechanicIds: (n.mechanicIds || []).join(';'),
      mechanicNames: joinNames((n.mechanicIds || []).map((id) => mechanicLabel(s, id))),
      sensorIds: (n.sensorIds || []).join(';'),
      sensorNames: joinNames((n.sensorIds || []).map((id) => sensorLabel(s, id))),
      connectsTo: s.edges.filter((e) => e.from === n.id).map((e) => e.to).join(';'),
      connectsToTitles: joinNames(s.edges.filter((e) => e.from === n.id).map((e) => {
        const target = s.nodes?.[e.to] || s.subnodes?.[e.to];
        return target ? `${target.title || target.name || e.to} (${e.to})` : e.to;
      })),
    })),
    fromRow: (row, s, warn) => ({
      kind: pickEnum(row.kind, NODE_KINDS, 'story', warn, 'node kind'),
      title: row.title || 'Untitled node',
      x: Number.isFinite(+row.x) && row.x !== '' ? Math.max(8, Math.round(+row.x)) : 80,
      y: Number.isFinite(+row.y) && row.y !== '' ? Math.max(8, Math.round(+row.y)) : 80,
      color: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(row.color) ? row.color : null,
      body: row.body ?? '',
      itemId: row.itemId && s.items[row.itemId] ? row.itemId : (row.itemId && warn(`unknown item "${row.itemId}"`), null),
      locationId: row.locationId && s.locations[row.locationId] ? row.locationId : (row.locationId && warn(`unknown location "${row.locationId}"`), null),
    }),
    // Rebuild connections after the nodes themselves are merged in.
    extra: (row) => list(row.connectsTo).map((to) => ({ type: 'ADD_EDGE', from: row.id, to })),
  },

  taskNodes: {
    filename: 'mechanics-fever-nodes.csv',
    headers: ['id', 'kind', 'kindName', 'title', 'x', 'y', 'color', 'description', 'primitiveId', 'mechKind', 'physicalKind', 'subnodeKind', 'estimatedMinutes', 'minPlayers', 'maxPlayers', 'connectsTo', 'connectsToTitles'],
    newId: (s) => genId(s.taskNodes || {}, 'TSK-N-'),
    blank: (id) => ({ id, kind: 'task', title: 'New mechanics task', x: 80, y: 80, body: '', color: null, primitiveId: null, sub: { nodes: {}, edges: [], frames: {}, numberMarkers: {}, titleMarkers: {} } }),
    toRows: (s) => Object.values(s.taskNodes || {}).map((n) => ({
      id: n.id,
      kind: n.kind || '',
      kindName: TASK_NODE_KIND_LABELS[n.kind] || n.mechKind || n.physicalKind || n.kind || '',
      title: n.title || n.name || '',
      x: n.x ?? '',
      y: n.y ?? '',
      color: n.color ?? '',
      description: n.body ?? '',
      primitiveId: n.primitiveId ?? '',
      mechKind: n.mechKind ?? '',
      physicalKind: n.physicalKind ?? '',
      subnodeKind: n.subnodeKind ?? '',
      estimatedMinutes: n.estMinutes ?? '',
      minPlayers: n.minPlayers ?? '',
      maxPlayers: n.maxPlayers ?? '',
      connectsTo: (s.taskEdges || []).filter((e) => e.from === n.id).map((e) => e.to).join(';'),
      connectsToTitles: joinNames((s.taskEdges || []).filter((e) => e.from === n.id).map((e) => {
        const target = s.taskNodes?.[e.to];
        return target ? `${target.title || target.name || e.to} (${e.to})` : e.to;
      })),
    })),
    fromRow: (row) => ({
      kind: row.kind || 'task',
      title: row.title || 'Untitled mechanics task',
      x: Number.isFinite(+row.x) && row.x !== '' ? Math.max(8, Math.round(+row.x)) : 80,
      y: Number.isFinite(+row.y) && row.y !== '' ? Math.max(8, Math.round(+row.y)) : 80,
      color: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(row.color) ? row.color : null,
      body: row.description ?? '',
      primitiveId: row.primitiveId || null,
      mechKind: row.mechKind || undefined,
      physicalKind: row.physicalKind || undefined,
      subnodeKind: row.subnodeKind || undefined,
      estMinutes: row.estimatedMinutes === '' ? undefined : Math.max(0, parseInt(row.estimatedMinutes, 10) || 0),
      minPlayers: row.minPlayers === '' ? undefined : Math.max(0, parseInt(row.minPlayers, 10) || 0),
      maxPlayers: row.maxPlayers === '' ? undefined : Math.max(0, parseInt(row.maxPlayers, 10) || 0),
    }),
    extra: (row) => list(row.connectsTo).map((to) => ({ type: 'GRAPH_ADD_EDGE', scope: { coll: 'taskNodes' }, from: row.id, to })),
  },
};
