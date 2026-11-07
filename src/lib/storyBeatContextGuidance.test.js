import { describe, expect, it } from 'vitest';
import { BEAT_OPENERS } from '../data/storyBeatWorkshop.js';
import { beatWorkshopDetails, beatWorkshopText, beatSectionClauses, beatClauseSegments, beatContextChoices, beatWorkshopPatch, detachBeatWorkshopLinks } from './storyBeatWorkshop.js';
import { storyBeatStructure } from './storyBeatStructure.js';
import { CSV_SCHEMAS } from '../data/csvSchemas.js';
import { toCsv, parseCsv } from './csv.js';

const ref = id => ({ coll: 'nodes', parentPath: [], nodeId: id });
function sample() {
  return { id: 'B', kind: 'storyBeat', body: 'Keep my original writing.', storyBeat: { workshop: {
    roles: { item: { name: 'Winning Guy' } },
    opener: { family: 'information', selections: { information: 'rumour' }, guidance: { 'information/rumour': { accuracy: 'Distorted' } }, context: { 'information/rumour': { distortion: 'blame' } } },
    occasion: { family: 'social', selections: { social: 'Arrival' }, collisionEnabled: true, second: 'Delivery', context: { 'information/rumour': { connection: 'second' } } },
    complication: { context: { 'information/rumour': { difficulty: 'witnesses' } } },
    involvement: { context: { 'information/rumour': { actions: ['compare', 'evidence'] } } },
    consequences: [
      { id: 'clear', context: { 'information/rumour': { condition: 'verify', outcome: 'cleared' } }, notes: 'Keep the delivery note.' },
      { id: 'hidden', context: { 'information/rumour': { condition: 'alone', outcome: 'hidden' } } },
    ],
    stakes: { context: { 'information/rumour': { risk: 'commitment' } } },
    bindings: { 'opener/information/rumour': { actor: { ref: ref('A'), name: 'Winning Guy' }, other: { ref: ref('P'), name: 'Pinky' } } },
  } } };
}

describe('Connected Story Beat guidance', () => {
  it('offers concrete follow-ups for every opener without creating content on read', () => {
    for (const family of BEAT_OPENERS) for (const opener of family.options) {
      const node = { storyBeat: { workshop: { opener: { family: family.id, selections: { [family.id]: opener.id } } } } };
      const before = JSON.stringify(node), w = beatWorkshopDetails(node);
      for (const section of ['complication','involvement','consequences','stakes']) {
        expect(beatContextChoices(w, section).length).toBeGreaterThan(0);
        expect(beatSectionClauses(w, section)).toEqual([]);
      }
      expect(JSON.stringify(node)).toBe(before);
    }
  });

  it('connects context, distortion, player actions, conditional branches and personal stakes using live opener roles', () => {
    const node = sample(), game = { nodes: { A: { title: 'Winning Guy renamed', kind: 'character' }, P: { title: 'Pinky', kind: 'character' } } };
    const before = JSON.stringify(node), prose = beatWorkshopText(node, game);
    expect(prose).toContain('The delivery brings the rumour to Pinky’s attention.');
    expect(prose).toContain('The rumour is distorted. The rumour wrongly blames Winning Guy renamed');
    expect(prose).toContain('Two witnesses give conflicting accounts of the rumour.');
    expect(prose).toContain('Players can compare the conflicting accounts');
    expect(prose).toContain('If players test the evidence and establish what happened, Winning Guy renamed could be cleared of suspicion.');
    expect(prose).toContain('If players leave the matter unresolved, the source of the rumour could remain unknown to Pinky.');
    expect(prose).toContain('Winning Guy renamed’s ability to honour a commitment to Pinky is at stake.');
    const graph = storyBeatStructure(node, game);
    expect(graph.nodes['SB-COMPLICATION'].body).toContain('conflicting accounts');
    expect(graph.nodes['SB-OUTCOME:clear'].body).toContain('cleared of suspicion');
    expect(graph.nodes['SB-OUTCOME:hidden'].body).not.toContain('cleared of suspicion');
    expect(JSON.stringify(node)).toBe(before);
  });

  it('keeps contextual role overrides independent, typed, live and reusable through CSV', () => {
    const node = sample(), key = 'context/consequences/hidden/information/rumour/outcome/hidden';
    node.storyBeat.workshop.bindings[key] = { other: { ref: ref('C'), name: 'Carl' } };
    let w = beatWorkshopDetails(node);
    const clause = beatSectionClauses(w, 'consequences', 'hidden')[0];
    expect(beatClauseSegments(w, {}, clause).find(segment => segment.role === 'other').kinds).toEqual(['character','group']);
    expect(beatWorkshopText(node, { nodes: { C: { title: 'Carl renamed' } } })).toContain('unknown to Carl renamed');
    const row = parseCsv(toCsv(CSV_SCHEMAS.nodes.headers, CSV_SCHEMAS.nodes.toRows({ nodes: { B: node }, edges: [] }))).rows[0];
    expect(CSV_SCHEMAS.nodes.fromRow(row, {}).storyBeat.workshop).toEqual(node.storyBeat.workshop);
    const detached = detachBeatWorkshopLinks(node.storyBeat.workshop);
    expect(detached.bindings[key].other).toEqual({ ref: null, name: 'Carl' });
    expect(beatWorkshopText({ storyBeat: { workshop: detached } })).toContain('unknown to Carl');
    const changed = { ...node, ...beatWorkshopPatch(node, 'opener', { family: 'possession', selections: { information: 'rumour', possession: 'withhold' } }) };
    expect(beatWorkshopText(changed)).not.toContain('conflicting accounts of the rumour');
    expect(changed.storyBeat.workshop.complication.context).toEqual(node.storyBeat.workshop.complication.context);
    w = beatWorkshopDetails({ ...changed, ...beatWorkshopPatch(changed, 'opener', { family: 'information' }) });
    expect(beatContextChoices(w, 'opener')[0].label).toBe('What is distorted?');
  });

  it('uses reflexive rumour wording for the same scoped character, not different characters with equal names', () => {
    const node = sample(), w = node.storyBeat.workshop;
    w.bindings['opener/information/rumour'].other = w.bindings['opener/information/rumour'].actor;
    expect(beatWorkshopText(node)).toContain('Winning Guy hears a rumour about themselves.');
    w.bindings['opener/information/rumour'].other = { name: 'Winning Guy', ref: ref('OTHER') };
    expect(beatWorkshopText(node)).toContain('A rumour about Winning Guy reaches Winning Guy.');
  });

  it('never inherits an outcome subject from the opener’s shared item role', () => {
    const node = sample();
    node.storyBeat.workshop.consequences = [{ id: 'old', effect: 'conceal', affectedName: 'Pinky' }];
    expect(beatWorkshopText(node)).toContain('the truth remains hidden from Pinky.');
    expect(beatWorkshopText(node)).not.toContain('Winning Guy remains hidden');
    node.storyBeat.workshop.consequences[0].result = 'the source of the rumour';
    expect(beatWorkshopText(node)).toContain('the source of the rumour remains hidden from Pinky.');
    node.storyBeat.workshop.consequences = [{id:'draft',context:{'information/rumour':{condition:'verify'}}}];
    expect(beatWorkshopText(node)).toContain('A possible consequence can follow if players test the evidence and establish what happened.');
  });
});
