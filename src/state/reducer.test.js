import { describe, it, expect } from 'vitest';
import { reducer, resolveNode, itemsAssignedToTeam, availableItems } from './reducer.js';
import { makeProjectSeed, makeLibrarySeed, migrateProject } from '../data/seed.js';

const seed = () => makeProjectSeed();
const lib = makeLibrarySeed();

describe('assignment logic', () => {
  it('assigning an item to a player flips availability to in-use', () => {
    const s = reducer(seed(), { type: 'ASSIGN_ITEM', itemId: 'CHM-A-004', teamId: 'T-RAVEN', playerId: 'P-ELZA' });
    expect(s.items['CHM-A-004'].availability).toBe('in-use');
    expect(s.items['CHM-A-004'].assignedTo).toEqual({ teamId: 'T-RAVEN', playerId: 'P-ELZA' });
    expect(itemsAssignedToTeam(s, 'T-RAVEN').map((i) => i.id)).toContain('CHM-A-004');
  });

  it('returning an item restores ready and removes it from team kit', () => {
    let s = reducer(seed(), { type: 'ASSIGN_ITEM', itemId: 'CHM-A-004', teamId: 'T-RAVEN', playerId: 'P-ELZA' });
    s = reducer(s, { type: 'UNASSIGN_ITEM', itemId: 'CHM-A-004' });
    expect(s.items['CHM-A-004'].availability).toBe('ready');
    expect(s.items['CHM-A-004'].assignedTo).toBeNull();
    expect(itemsAssignedToTeam(s, 'T-RAVEN')).toHaveLength(0);
  });

  it('deploying an item sets location and deployed status', () => {
    const s = reducer(seed(), { type: 'DEPLOY_ITEM', itemId: 'CHM-G-001', locationId: 'LOC-S7' });
    expect(s.items['CHM-G-001'].availability).toBe('deployed');
    expect(s.items['CHM-G-001'].locationId).toBe('LOC-S7');
  });

  it('assigned items leave the available pool used by the Teams issue dropdown', () => {
    const before = availableItems(seed()).length;
    const s = reducer(seed(), { type: 'ASSIGN_ITEM', itemId: 'CHM-A-004', teamId: 'T-WOLF' });
    expect(availableItems(s).length).toBe(before - 1);
  });
});

describe('cross-referencing', () => {
  it('a flow node resolves to the live item record', () => {
    const s = seed();
    const r = resolveNode(s, lib, 'N-KEY');
    expect(r.item.id).toBe('CHM-A-004');
    expect(r.mechanics.map((m) => m.id)).toContain('LIB-MECH-LOCK');
    expect(r.sensors.map((x) => x.id)).toContain('RFID-07');
  });

  it('edits made via the inspector are visible through node resolution', () => {
    let s = seed();
    s = reducer(s, { type: 'UPDATE_ENTITY', coll: 'items', id: 'CHM-A-004', patch: { buildStatus: 'packed', name: 'Cipher-Key Mk2' } });
    const r = resolveNode(s, lib, 'N-KEY');
    expect(r.item.buildStatus).toBe('packed');
    expect(r.item.name).toBe('Cipher-Key Mk2');
  });
});

describe('images and hardware requirements', () => {
  it('uploading sets the primary thumbnail on the item', () => {
    const image = { kind: 'photo', name: 'key.jpg', dataUrl: 'data:image/jpeg;base64,xxx' };
    const s = reducer(seed(), { type: 'SET_IMAGE', coll: 'items', id: 'CHM-A-004', image });
    expect(s.items['CHM-A-004'].image).toEqual(image);
  });

  it('sensor requirements can be added once and removed', () => {
    let s = reducer(seed(), { type: 'ADD_SENSOR_REQ', itemId: 'CHM-G-001', sensorId: 'MOT-04', note: 'test' });
    expect(s.items['CHM-G-001'].sensorReqs).toHaveLength(1);
    const dup = reducer(s, { type: 'ADD_SENSOR_REQ', itemId: 'CHM-G-001', sensorId: 'MOT-04' });
    expect(dup.items['CHM-G-001'].sensorReqs).toHaveLength(1);
    s = reducer(s, { type: 'REMOVE_SENSOR_REQ', itemId: 'CHM-G-001', sensorId: 'MOT-04' });
    expect(s.items['CHM-G-001'].sensorReqs).toHaveLength(0);
  });

  it('sensor hardware can be issued to a player role', () => {
    const s = reducer(seed(), { type: 'ASSIGN_SENSOR', sensorId: 'RF-01', playerId: 'P-JANIS' });
    expect(s.sensors['RF-01'].assignedTo).toBe('P-JANIS');
  });
});

describe('entity deletion and element categories', () => {
  it('DELETE_ENTITY removes a record and ignores unknown ids', () => {
    const libSeed = makeLibrarySeed();
    const before = Object.keys(libSeed.narrativeCategories).length;
    const s1 = reducer(libSeed, { type: 'DELETE_ENTITY', coll: 'narrativeCategories', id: 'rumor' });
    expect(s1.narrativeCategories.rumor).toBeUndefined();
    expect(Object.keys(s1.narrativeCategories)).toHaveLength(before - 1);
    expect(reducer(s1, { type: 'DELETE_ENTITY', coll: 'narrativeCategories', id: 'nope' })).toBe(s1);
  });

  it('new narrative categories can be added and items reassigned on delete', () => {
    let libState = makeLibrarySeed();
    libState = reducer(libState, { type: 'ADD_ENTITY', coll: 'narrativeCategories', entity: { id: 'prophecy', label: 'Prophecy', color: '#3EC6D6', icon: 'flag' } });
    expect(libState.narrativeCategories.prophecy.label).toBe('Prophecy');
    libState = reducer(libState, {
      type: 'ADD_ENTITY',
      coll: 'narrative',
      entity: { id: 'LIB-NAR-TEST', nodeClass: 'base', nodeKind: 'event', name: 'Rumor seed', category: 'rumor', color: '#43BF87', icon: 'zap', body: 'One sentence.', tags: [] },
    });
    // reassign a saved reusable node template to the new category, then delete the old one.
    libState = reducer(libState, { type: 'UPDATE_ENTITY', coll: 'narrative', id: 'LIB-NAR-TEST', patch: { category: 'prophecy' } });
    libState = reducer(libState, { type: 'DELETE_ENTITY', coll: 'narrativeCategories', id: 'rumor' });
    expect(libState.narrative['LIB-NAR-TEST'].category).toBe('prophecy');
    expect(libState.narrativeCategories.rumor).toBeUndefined();
  });
});

describe('scenario graph editing', () => {
  const newNode = { id: 'N-TEST', kind: 'story', title: 'New story beat', x: 100, y: 100, body: '', color: null, locationId: null, itemId: null, mechanicIds: [], sensorIds: [] };

  it('adds a node and connects it to an existing node', () => {
    let s = reducer(seed(), { type: 'ADD_NODE', node: newNode });
    expect(s.nodes['N-TEST'].title).toBe('New story beat');
    const before = s.edges.length;
    s = reducer(s, { type: 'ADD_EDGE', from: 'N-BRIEF', to: 'N-TEST', color: '#5CA8F5' });
    expect(s.edges.length).toBe(before + 1);
    expect(s.edges.at(-1)).toMatchObject({ from: 'N-BRIEF', to: 'N-TEST', color: '#5CA8F5' });
  });

  it('rejects self-loops and duplicate connections', () => {
    let s = reducer(seed(), { type: 'ADD_NODE', node: newNode });
    const before = s.edges.length;
    s = reducer(s, { type: 'ADD_EDGE', from: 'N-TEST', to: 'N-TEST' });
    expect(s.edges.length).toBe(before);
    s = reducer(s, { type: 'ADD_EDGE', from: 'N-BRIEF', to: 'N-S7' }); // exists in seed
    expect(s.edges.length).toBe(before);
  });

  it('rewires an existing relationship when it is reconnected to different sides', () => {
    let s = reducer(seed(), { type: 'ADD_EDGE', from: 'N-BRIEF', to: 'N-S7', fromSide: 'left', toSide: 'right' });
    expect(s.edges.find((e) => e.from === 'N-BRIEF' && e.to === 'N-S7')).toMatchObject({ fromSide: 'left', toSide: 'right' });
    expect(s.edges.filter((e) => e.from === 'N-BRIEF' && e.to === 'N-S7')).toHaveLength(1);
  });

  it('allows framework nodes to connect through the normal relationship system', () => {
    let s = reducer(seed(), { type: 'ADD_ENTITY', coll: 'frameworks', entity: { id: 'FW-X', kind: 'framework', title: 'Reference', x: 500, y: 100 } });
    s = reducer(s, { type: 'ADD_EDGE', from: 'FW-X', to: 'N-BRIEF', fromSide: 'bottom', toSide: 'left' });
    expect(s.edges.find((e) => e.from === 'FW-X' && e.to === 'N-BRIEF')).toMatchObject({ fromSide: 'bottom', toSide: 'left' });
  });

  it('removes a connection', () => {
    const before = seed().edges.length;
    const s = reducer(seed(), { type: 'REMOVE_EDGE', from: 'N-BRIEF', to: 'N-S7' });
    expect(s.edges.length).toBe(before - 1);
  });

  it('DELETE_NODE removes the node and every edge touching it', () => {
    const s = reducer(seed(), { type: 'DELETE_NODE', nodeId: 'N-KEY' });
    expect(s.nodes['N-KEY']).toBeUndefined();
    expect(s.edges.some((e) => e.from === 'N-KEY' || e.to === 'N-KEY')).toBe(false);
    expect(s.edges.length).toBe(seed().edges.length - 2); // N-KEY had 1 in + 1 out
  });

  it('UPDATE_EDGE edits a connection label', () => {
    const s = reducer(seed(), { type: 'UPDATE_EDGE', from: 'N-KEY', to: 'N-GATE', patch: { label: 'WHEN both keys held' } });
    expect(s.edges.find((e) => e.from === 'N-KEY' && e.to === 'N-GATE').label).toBe('WHEN both keys held');
  });

  it('ADD_EDGE and UPDATE_EDGE preserve chosen connection sides', () => {
    let s = reducer(seed(), { type: 'ADD_EDGE', from: 'N-GATE', to: 'N-S7', fromSide: 'bottom', toSide: 'top' });
    expect(s.edges.find((e) => e.from === 'N-GATE' && e.to === 'N-S7')).toMatchObject({ fromSide: 'bottom', toSide: 'top' });
    s = reducer(s, { type: 'UPDATE_EDGE', from: 'N-GATE', to: 'N-S7', patch: { fromSide: 'left', toSide: 'right' } });
    expect(s.edges.find((e) => e.from === 'N-GATE' && e.to === 'N-S7')).toMatchObject({ fromSide: 'left', toSide: 'right' });
  });

  it('allows a title marker to receive a relationship and removes it with the title', () => {
    let s = seed();
    const titleId = 'TTL-TEST';
    s = reducer(s, { type: 'ADD_ENTITY', coll: 'titleMarkers', entity: { id: titleId, text: 'Chapter One', x: 400, y: 100, fontSize: 28 } });
    s = reducer(s, { type: 'ADD_EDGE', from: 'N-BRIEF', to: titleId, fromSide: 'right', toSide: 'left' });
    expect(s.edges.find((e) => e.from === 'N-BRIEF' && e.to === titleId)).toMatchObject({ toSide: 'left' });
    s = reducer(s, { type: 'DELETE_ENTITY', coll: 'titleMarkers', id: titleId });
    expect(s.edges.some((e) => e.to === titleId)).toBe(false);
  });

  it('CLEAR_NARRATIVE_CANVAS removes all visible narrative canvas entities and relationships', () => {
    const s = reducer(seed(), { type: 'CLEAR_NARRATIVE_CANVAS' });
    expect(s.nodes).toEqual({});
    expect(s.subnodes).toEqual({});
    expect(s.frameworks).toEqual({});
    expect(s.frames).toEqual({});
    expect(s.numberMarkers).toEqual({});
    expect(s.titleMarkers).toEqual({});
    expect(s.edges).toEqual([]);
    expect(s.alignments).toEqual([]);
  });

  it('Weaver alignments add, dedupe, remove, and clean up on node delete', () => {
    let s = reducer(seed(), { type: 'ADD_ALIGN', story: 'ACT-3', task: 'TSK-3' });
    const n = s.alignments.length;
    s = reducer(s, { type: 'ADD_ALIGN', story: 'ACT-3', task: 'TSK-3' }); // dup ignored
    expect(s.alignments.length).toBe(n);
    s = reducer(s, { type: 'REMOVE_ALIGN', story: 'ACT-3', task: 'TSK-3' });
    expect(s.alignments.some((a) => a.story === 'ACT-3' && a.task === 'TSK-3')).toBe(false);
    // deleting an aligned story node drops alignments referencing it
    // (seed aligns N-KEY↔TSK-2)
    const before = s.alignments.length;
    s = reducer(s, { type: 'GRAPH_DELETE_NODE', scope: { coll: 'masterNodes' }, id: 'ACT-2' });
    expect(s.alignments.length).toBe(before - 1);
    expect(s.alignments.some((a) => a.story === 'ACT-2')).toBe(false);
  });

  it('the demo game ships seeded story↔task alignments', () => {
    const s = seed();
    expect(s.alignments).toEqual(expect.arrayContaining([{ story: 'ACT-1', task: 'TSK-1' }]));
  });

  it('SET_STORY_POS records a story beat position on the Weaver track', () => {
    const s = reducer(seed(), { type: 'SET_STORY_POS', nodeId: 'N-BRIEF', x: 120, y: 240 });
    expect(s.storyTrack['N-BRIEF']).toEqual({ x: 120, y: 240 });
  });

  it('rescheduling a task persists startMin via UPDATE_ENTITY', () => {
    const s = reducer(seed(), { type: 'UPDATE_ENTITY', coll: 'nodes', id: 'N-KEY', patch: { startMin: 720, durationMin: 30 } });
    expect(s.nodes['N-KEY'].startMin).toBe(720);
    expect(s.meta.timeline).toEqual({ startMin: 540, endMin: 1020 });
    expect(s.meta.timelineStep).toBe(30);
  });

  it('SET_META stores separate per-game backdrops; SET_IMAGE respects field', () => {
    const image = { kind: 'photo', name: 'bg.jpg', dataUrl: 'data:x' };
    let s = reducer(seed(), {
      type: 'SET_META',
      patch: {
        timelineStep: 5,
        backdrops: {
          header: { image, opacity: 0.4 },
          content: { image: null, opacity: 0.2 },
        },
      },
    });
    expect(s.meta.backdrops.header.image).toEqual(image);
    expect(s.meta.backdrops.header.opacity).toBe(0.4);
    expect(s.meta.backdrops.content.image).toBeNull();
    expect(s.meta.timelineStep).toBe(5);
    expect(s.meta.name).toBe('Operation Chimera'); // merge, not replace
    s = reducer(s, { type: 'SET_IMAGE', coll: 'locations', id: 'LOC-S7', field: 'schematic', image: { kind: 'photo', name: 'plan.png', dataUrl: 'data:y' } });
    expect(s.locations['LOC-S7'].schematic.name).toBe('plan.png');
    expect(s.locations['LOC-S7'].image).toBeNull(); // cover untouched
  });

  it('migrates legacy hero backdrops into explicit header and content slots', () => {
    const oldImage = { kind: 'photo', name: 'old-bg.jpg', dataUrl: 'data:old' };
    const oldSave = {
      ...seed(),
      meta: {
        ...seed().meta,
        hero: { image: oldImage, opacity: 0.3, placement: 'content' },
        backdrops: undefined,
      },
    };
    const migrated = migrateProject(oldSave);
    expect(migrated.meta.backdrops.header.image).toBeNull();
    expect(migrated.meta.backdrops.header.opacity).toBe(0.34);
    expect(migrated.meta.backdrops.content.image).toEqual(oldImage);
    expect(migrated.meta.backdrops.content.opacity).toBe(0.3);
  });

  it('node drag position and color pick persist via UPDATE_ENTITY', () => {
    let s = reducer(seed(), { type: 'UPDATE_ENTITY', coll: 'nodes', id: 'N-BRIEF', patch: { x: 500, y: 250 } });
    s = reducer(s, { type: 'UPDATE_ENTITY', coll: 'nodes', id: 'N-BRIEF', patch: { color: '#E8D25C' } });
    expect(s.nodes['N-BRIEF']).toMatchObject({ x: 500, y: 250, color: '#E8D25C' });
  });
});
