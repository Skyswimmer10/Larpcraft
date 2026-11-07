import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import CharacterInputNode, { CharacterCanvasWizard, characterCanvasOwner } from './CharacterInputNode.jsx';
import { createWizardNode, appendWizardResult } from '../lib/narrativeWizard.js';
import { FRAMEWORK_TYPES, makeEmptyProject } from '../data/seed.js';

const fixture = vi.hoisted(() => ({ game: null, buttons: [] }));
vi.mock('../state/store.jsx', () => ({ useGame: () => fixture.game, useDispatch: () => vi.fn() }));
vi.mock('./NarrativeWizard.jsx', () => ({ NarrativeWizardButton: props => {
  fixture.buttons.push(props);
  return <button data-target={props.targetId || props.resumeNode?.id} data-session={props.resumeRecord?.sessionId}>{props.label}</button>;
} }));
const make = (id, answer) => createWizardNode({ id, title: 'Uno', source: FRAMEWORK_TYPES.fate, type: 'framework', focus: 'character',
  questions: [{ key: 'attention', prompt: 'What captures their attention?' }], answers: { attention: answer } });

describe('character input canvas controls', () => {
  it('routes each framework button to its own parent character session, even when titles and frameworks match', () => {
    const node = appendWizardResult(make('C', 'A bell.'), make('OTHER', 'Footsteps.'));
    fixture.game = { ...makeEmptyProject(), nodes: { C: node } }; fixture.buttons = [];
    const scope = { coll: 'nodes', parentPath: ['C'] };
    const html = Object.values(node.sub.nodes).map(input => renderToStaticMarkup(<CharacterInputNode node={input} scope={scope} />)).join('');
    expect(html.match(/Edit this framework/g)).toHaveLength(2);
    expect(html).toContain('Framework for Uno');
    expect(html).toContain('Include in description');
    expect(html).toContain('A bell.'); expect(html).toContain('Footsteps.');
    expect(fixture.buttons.map(button => button.resumeNode)).toEqual([node, node]);
    expect(fixture.buttons.map(button => button.resumeRecord.sessionId)).toEqual(['C:wizard', 'OTHER:wizard']);
    expect(fixture.buttons.every(button => JSON.stringify(button.gameScope) === JSON.stringify({ coll: 'nodes', parentPath: [] }))).toBe(true);
  });

  it('adds sources to the containing character and resolves repeated IDs within Master Act lanes', () => {
    const character = make('C', 'A bell.');
    fixture.game = { ...makeEmptyProject(), nodes: { C: make('C', 'Unrelated.') }, masterNodes: { ACT: { sub: { nodes: { STORY: { sub: { nodes: { C: character } } } } } } } }; fixture.buttons = [];
    const scope = { coll: 'masterNodes', parentPath: ['ACT', 'STORY', 'C'] };
    expect(characterCanvasOwner(fixture.game, scope).node).toBe(character);
    const html = renderToStaticMarkup(<CharacterCanvasWizard scope={scope} />);
    expect(html).toContain('Add a framework or concept');
    expect(fixture.buttons[0]).toMatchObject({ targetId: 'C', gameScope: { coll: 'masterNodes', parentPath: ['ACT', 'STORY'] } });
  });

  it('offers concept editing from its saved source rather than a library reference', () => {
    const character = createWizardNode({ id: 'C', title: 'Uno', type: 'concept', focus: 'character', source: { id: 'CONCEPT', name: 'A duty', nodes: {} }, questions: [{ key: 'duty', prompt: 'What duty?' }], answers: { duty: 'Guard the gate.' } });
    fixture.game = { ...makeEmptyProject(), nodes: { C: character } }; fixture.buttons = [];
    const html = renderToStaticMarkup(<CharacterInputNode node={Object.values(character.sub.nodes)[0]} scope={{ coll: 'nodes', parentPath: ['C'] }} detailed />);
    expect(html).toContain('Edit this concept'); expect(html).toContain('Guard the gate.');
    expect(fixture.buttons[0].resumeRecord.sourceSnapshot.id).toBe('CONCEPT');
    expect(fixture.buttons[0].source).toBeUndefined();
  });
});
