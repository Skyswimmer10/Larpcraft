import { describe, expect, it } from 'vitest';
import { BEAT_COMPLICATIONS, BEAT_WORKSHOP_SECTIONS } from '../data/storyBeatWorkshop.js';
import { beatWorkshopDetails, beatWorkshopPatch, beatWorkshopText, beatWorkshopSentences, beatConnectedParticipants, beatEntities, beatValueSources, beatStakesValues, beatSectionClauses, beatClauseSegments, beatSlotAllows } from './storyBeatWorkshop.js';
import { storyBeatCanvasText, detachStoryBeatLinks } from './storyBeat.js';
import { CSV_SCHEMAS } from '../data/csvSchemas.js';
import { toCsv, parseCsv } from './csv.js';

const fixture = () => ({
  id: 'B', kind: 'storyBeat', title: 'The delivery', body: 'Keep my existing description.',
  storyBeat: { dialogue: 'Keep this readout.', workshop: {
    version: 1, roles: { actor: { name: 'John' }, other: { name: 'Carl' }, item: { name: 'the key' } },
    occasion: { family: 'social', selections: { social: 'Delivery' } },
    opener: { family: 'possession', selections: { possession: 'withhold' } },
    complication: { family: 'resistance', selections: { resistance: 'proof' }, effect: 'delays' },
    involvement: { entry: 'asked', interactions: ['investigate', 'negotiate'], influence: 'possession' },
    consequences: [{ id: 'C', condition: 'alone', effect: 'lose', affected: 'other', result: 'the key' }],
    stakes: { domain: 'relationships', values: [{ id: 'V', valueId: 'friendship', from: 'Friend', to: 'Enemy' }], morals: ['Care / Harm'] },
  } },
});

describe('Story Beat Wide Workshop', () => {
  it('retains independent typed bindings, live names and cast through CSV and reusable template detachment', () => {
    const node=fixture(), ref={coll:'nodes',parentPath:[],nodeId:'C'};
    node.storyBeat.workshop.bindings={
      'complication/resistance/proof':{actor:{ref,name:'Pinky'}},
      'involvement/entry/asked':{actor:{name:'The steward',ref:null}},
      'consequences/C/lose':{affected:{ref,name:'Pinky'},result:{name:'the ring',ref:null}},
    };
    node.storyBeat.workshop.participants=[{ref,name:'Pinky'}];
    const game={nodes:{B:node,C:{id:'C',kind:'character',title:'Pinky renamed'}},edges:[]};
    const prose=beatWorkshopText(node,game);
    expect(prose).toContain('John withholds the key from Carl.');
    expect(prose).toContain('Pinky renamed demands proof');
    expect(prose).toContain('The steward asks the players');
    expect(prose).toContain('Pinky renamed loses the ring');
    const row=parseCsv(toCsv(CSV_SCHEMAS.nodes.headers,CSV_SCHEMAS.nodes.toRows(game))).rows.find(row=>row.id==='B');
    expect(CSV_SCHEMAS.nodes.fromRow(row,game).storyBeat.workshop).toEqual(node.storyBeat.workshop);
    const detached=detachStoryBeatLinks(node).storyBeat.workshop;
    expect(detached.bindings['complication/resistance/proof'].actor).toEqual({ref:null,name:'Pinky'});
    expect(detached.participants).toEqual([{ref:null,name:'Pinky'}]);
    expect(beatWorkshopText({storyBeat:{workshop:detached}})).toContain('Pinky demands proof');
  });

  it('uses location-only access and item-only possession slots, while leaving optional context blank', () => {
    const node=fixture();
    node.storyBeat.workshop.consequences=[{id:'access',effect:'grant'}];
    let w=beatWorkshopDetails(node),clause=beatSectionClauses(w,'consequences','access')[0];
    const result=beatClauseSegments(w,{},clause).find(row=>row.role==='result');
    expect(beatSlotAllows(result,{kind:'storyLocation'})).toBe(true);
    expect(beatSlotAllows(result,{kind:'character'})).toBe(false);
    const possession=beatSectionClauses(w,'involvement').find(row=>row.key.includes('/influence/possession'));
    expect(beatClauseSegments(w,{},possession).find(row=>row.role==='item').kinds).toEqual(['item']);
    expect(beatWorkshopText(node)).toContain('The occasion is a delivery.');
    expect(beatWorkshopText(node)).not.toContain('at the place');
    node.storyBeat.workshop.bindings={'complication/resistance/proof':{actor:{name:'',ref:null}}};
    expect(beatWorkshopText(node)).toContain('Someone demands proof');
    expect(node.storyBeat.workshop.roles.actor.name).toBe('John');
  });
  it('keeps every section optional and offers all eight difficulty families with distinctive choices', () => {
    expect(beatWorkshopText({})).toBe('');
    expect(BEAT_WORKSHOP_SECTIONS).toHaveLength(6);
    expect(BEAT_COMPLICATIONS).toHaveLength(8);
    expect(BEAT_COMPLICATIONS.every(family => family.options.length === 4)).toBe(true);
    const resistance = BEAT_COMPLICATIONS[0].options;
    expect(new Set(resistance.map(option => option.icon)).size).toBe(4);
    expect(new Set(resistance.map(option => option.tone)).size).toBe(4);
  });

  it('builds six live paragraphs without overwriting descriptions or turning possibilities into facts', () => {
    const node = fixture(), before = JSON.stringify(node);
    const paragraphs = beatWorkshopSentences(node);
    expect(paragraphs.map(row => row.id)).toEqual(BEAT_WORKSHOP_SECTIONS.map(row => row.id));
    const prose = beatWorkshopText(node);
    expect(prose).toContain('John withholds the key from Carl.');
    expect(prose).toContain('John demands proof before proceeding, delaying what happens next.');
    expect(prose).toContain('If players leave the situation alone, Carl loses the key.');
    expect(prose).toContain('Friendship could move from friend to enemy.');
    expect(JSON.stringify(node)).toBe(before);
    expect(storyBeatCanvasText(node)).toContain(node.body);
    expect(storyBeatCanvasText({ ...node, body: prose }).split(prose)).toHaveLength(2);
  });

  it('retains earlier family choices, hidden details and future fields while patching', () => {
    let node = fixture();
    node.storyBeat.workshop.futureDetail = { keep: true };
    node = { ...node, ...beatWorkshopPatch(node, 'complication', { family: 'time', selections: { resistance: 'proof', time: 'deadline' } }) };
    expect(beatWorkshopText(node)).toContain('A deadline approaches');
    node = { ...node, ...beatWorkshopPatch(node, 'complication', { family: 'resistance' }) };
    expect(beatWorkshopText(node)).toContain('John demands proof');
    expect(node.storyBeat.dialogue).toBe('Keep this readout.');
    expect(beatWorkshopDetails(node).futureDetail).toEqual({ keep: true });
    expect(beatWorkshopText({ ...node, ...beatWorkshopPatch(node, 'complication', { family: '' }) })).not.toContain('demands proof');
  });

  it('resolves scoped participants and renamed nodes, excluding real players and teams', () => {
    const nested = { id: 'A', sub: { nodes: { B: fixture(), X: { id: 'X', kind: 'character', title: 'Nested Carl' } }, edges: [{ from: 'B', to: 'X' }] } };
    const game = { nodes: { X: { id: 'X', kind: 'character', title: 'Root John' }, TEAM: { id: 'TEAM', kind: 'team' } }, masterNodes: { A: nested }, players: { P: { id: 'P' } } };
    const node = fixture();
    node.storyBeat.workshop.roles.actor = { ref: { coll: 'nodes', nodeId: 'X' }, name: 'Old John' };
    node.storyBeat.workshop.roles.other = { ref: { coll: 'masterNodes', parentPath: ['A'], nodeId: 'X' }, name: 'Old Carl' };
    expect(beatEntities(game)).toHaveLength(2);
    expect(beatWorkshopText(node, game)).toContain('Root John withholds the key from Nested Carl.');
    expect(beatConnectedParticipants(node, game, { coll: 'masterNodes', parentPath: ['A'] }).map(row => row.name)).toEqual(['Root John', 'Nested Carl']);
    expect(beatWorkshopText(node)).toContain('Old John withholds the key from Old Carl.');
  });

  it('reads linked Human Values live and retains a snapshot if its original is unavailable', () => {
    const ref = { coll: 'nodes', nodeId: 'VALUES', parentPath: [] };
    const original = { sourceId: 'humanValues', sessionId: 'session', title: 'Trust', valuesDraft: { values: [{ id: 'V', column: 'inPlay', label: 'Friendship', from: 'Friend', to: 'Enemy' }] } };
    const game = { nodes: { VALUES: { id: 'VALUES', narrativeWizard: original } } };
    expect(beatValueSources(game)).toHaveLength(1);
    const node = fixture();
    node.storyBeat.workshop.stakes.source = { ref, sessionId: 'session', title: 'Trust', snapshot: [{ id: 'V', label: 'Earlier trust', from: 'Enemy', to: 'Friend' }] };
    expect(beatStakesValues(beatWorkshopDetails(node), game).rows[0].label).toBe('Friendship');
    original.valuesDraft.values[0].to = 'Stranger';
    expect(beatWorkshopText(node, game)).toContain('friend to stranger');
    expect(beatWorkshopText(node)).toContain('Earlier trust');
    const detached = detachStoryBeatLinks(node);
    expect(detached.storyBeat.workshop.roles).toEqual({ actor: { name: 'John', ref: null }, other: { name: 'Carl', ref: null }, item: { name: 'the key', ref: null } });
    expect(detached.storyBeat.workshop.stakes.source.ref).toBeNull();
    expect(detached.storyBeat.workshop.stakes.source.snapshot).toEqual(node.storyBeat.workshop.stakes.source.snapshot);
    expect(node.storyBeat.workshop.stakes.source.ref).toBe(ref);
  });

  it('round-trips the workshop and multiline detail through narrative CSV', () => {
    const node = fixture();
    node.storyBeat.workshop.notes = { opener: 'A handwritten note.\nSigned, "the keeper".' };
    const game = { nodes: { B: node }, edges: [] };
    const row = parseCsv(toCsv(CSV_SCHEMAS.nodes.headers, CSV_SCHEMAS.nodes.toRows(game))).rows[0];
    expect(CSV_SCHEMAS.nodes.fromRow(row, game).storyBeat).toEqual(node.storyBeat);
  });
});
