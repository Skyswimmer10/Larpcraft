import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import StoryItemPhysicalLink from './StoryItemPhysicalLink.jsx';
import { reducer, locateGraph } from '../state/reducer.js';
import { makeEmptyProject } from '../data/seed.js';
import { importNarrative, narrativeToStructNode } from '../state/bridge.js';
import { buildNarrativeLinkInsertion } from '../lib/narrativeLinks.js';

const sword = { id: 'SWORD', kind: 'item', title: 'Lightsaber', body: 'A blade of red energy.', playerLore: 'A blade of red energy.' };
const stick = { id: 'STICK', name: 'Red stick', description: 'A painted foam stick.', propNotes: 'Store in the prop box.', availability: 'ready', sensorReqs: [] };
const render = (node, game) => renderToStaticMarkup(<StoryItemPhysicalLink node={node} game={game} onPatch={() => {}} onSelect={() => {}} />);

describe('story items and their physical props', () => {
  it('shows the current physical description and edit shortcut without replacing lore', () => {
    const node = { ...sword, itemId: 'STICK' };
    const game = { items: { STICK: stick } };
    const before = JSON.stringify({ node, game });
    const html = render(node, game);
    expect(html).toContain('Red stick');
    expect(html).toContain('A painted foam stick.');
    expect(html).toContain('Store in the prop box.');
    expect(html).toContain('Edit real item');
    expect(html).toContain('Unlink real item');
    expect(html).not.toContain('A blade of red energy.');
    expect(JSON.stringify({ node, game })).toBe(before);
    expect(render(node, { items: { STICK: { ...stick, name: 'Replacement stick' } } })).toContain('Replacement stick');
  });

  it('explains unassigned, missing and library-only physical links', () => {
    expect(render(sword, { items: {} })).toContain('Create a real item in Items &amp; Gadgets');
    expect(render({ ...sword, itemId: 'DELETED' }, { items: {} })).toContain('Choose a replacement or unlink it.');
    const libraryHtml = render(sword, null);
    expect(libraryHtml).toContain('after adding this Story Item to a game');
    expect(libraryHtml).not.toContain('<select');
  });

  it.each(['nodes', 'nested', 'masterNodes'])('links, edits and unlinks independently in %s', scopeKind => {
    let game = { ...makeEmptyProject('Props'), items: { STICK: stick } };
    const scope = scopeKind === 'nested' ? { coll: 'nodes', parentPath: ['ACT'] } : { coll: scopeKind };
    if (scopeKind === 'nested') game.nodes = { ACT: { id: 'ACT', kind: 'masterAct', sub: { nodes: { SWORD: sword }, edges: [] } } };
    else game[scopeKind] = { SWORD: sword };
    const patchNode = patch => { game = reducer(game, { type: 'GRAPH_UPDATE_NODE', scope, id: 'SWORD', patch }); };
    patchNode({ itemId: 'STICK' });
    expect(locateGraph(game, scope).nodes.SWORD.itemId).toBe('STICK');
    game = reducer(game, { type: 'UPDATE_ENTITY', coll: 'items', id: 'STICK', patch: { description: 'A repaired foam stick.' } });
    expect(locateGraph(game, scope).nodes.SWORD.body).toBe(sword.body);
    patchNode({ playerLore: 'An ancient energy blade.', body: 'An ancient energy blade.' });
    expect(game.items.STICK.description).toBe('A repaired foam stick.');
    patchNode({ itemId: null });
    expect(locateGraph(game, scope).nodes.SWORD).toMatchObject({ itemId: null, body: 'An ancient energy blade.' });
    expect(game.items.STICK.name).toBe('Red stick');
  });

  it('does not carry another game’s prop assignment through library insertions', () => {
    const record = { id: 'LIB-SWORD', nodeKind: 'item', name: 'Lightsaber', template: { ...sword, itemId: 'STICK' } };
    const lib = { narrative: { 'LIB-SWORD': record } };
    const game = { ...makeEmptyProject('Different game'), items: { STICK: { ...stick, name: 'Unrelated object with the same ID' } } };
    const imported = importNarrative(lib, game, 'LIB-SWORD');
    for (const node of [imported.nodes[imported.createdId], narrativeToStructNode(record, {}, 0, 0), buildNarrativeLinkInsertion(lib, { type: 'narrative', id: 'LIB-SWORD' }, {})]) {
      expect(node.itemId).toBeNull();
      expect(node.body).toBe(sword.body);
    }
    expect(record.template.itemId).toBe('STICK');
  });
});
