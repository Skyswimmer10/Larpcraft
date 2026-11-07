import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { characterQuickEditInputs, CharacterDescriptionInputs, CharacterDescription } from './CharacterNode.jsx';
import FlowCanvas from './FlowCanvas.jsx';
import { appendWizardResult, createWizardNode, reviseWizardResult } from '../lib/narrativeWizard.js';
import { characterWizardRecords, characterProfilePatch, characterInputSnapshot } from '../lib/characterProfile.js';
import { savedWizardSession } from '../lib/narrativeMemory.js';
import { FRAMEWORK_TYPES } from '../data/seed.js';

const fixture = vi.hoisted(() => ({ cards: [] }));
vi.mock('./CharacterNode.jsx', async importOriginal => ({ ...await importOriginal(), default: props => { fixture.cards.push(props); return <span>Character card</span>; } }));
vi.mock('react-dom', () => ({ createPortal: children => children }));
vi.stubGlobal('document', { body: {} });
const make = (id, value) => createWizardNode({ id, title: 'Uno', source: FRAMEWORK_TYPES.fate, type: 'framework', focus: 'character', questions: [{ key: 'attention', prompt: 'What captures their attention?' }], answers: { attention: value } });

describe('description sidebar quick editing', () => {
  it('opens the exact saved session for each repeated use, with its existing answers and character owner', () => {
    const node = appendWizardResult(make('C', 'Bells.'), make('SECOND', 'Footsteps.'));
    const inputs = characterQuickEditInputs(node, { nodes: { C: node } });
    expect(inputs.map(input => input.detail)).toEqual(['Uno · use 1 of 2', 'Uno · use 2 of 2']);
    expect(inputs.every(input => input.wizard.resumeNode === node && input.editable)).toBe(true);
    expect(inputs.map(input => savedWizardSession(input.wizard.resumeNode, {}, input.wizard.resumeRecord).answers.attention)).toEqual(['Bells.', 'Footsteps.']);
    const edit = vi.fn(), buttons = CharacterDescriptionInputs({ inputs, onEdit: edit }).props.children[1];
    buttons[1].props.onClick();
    expect(edit).toHaveBeenCalledWith(inputs[1]);
    expect(edit.mock.calls[0][0].wizard.resumeRecord.sessionId).toBe('SECOND:wizard');
    const revised = reviseWizardResult({ ...node, narrativeWizard: inputs[1].wizard.resumeRecord }, make('SECOND', 'Whispering.'), FRAMEWORK_TYPES.fate);
    expect(revised.body).toContain('Bells.'); expect(revised.body).toContain('Whispering.'); expect(revised.body).not.toContain('Footsteps.');
    expect(characterWizardRecords(revised)).toHaveLength(2);
  });

  it('shows named concept symbols below character details and retains excluded inputs for editing', () => {
    let node = createWizardNode({ id: 'C', title: 'Uno', source: { id: 'LIB-CPT-N033', name: 'Artist', category: 'characterConcept', nodes: {} }, type: 'concept', focus: 'character', questions: [{ key: 'work', prompt: 'What do they create?' }], answers: { work: 'Masks.' } });
    node = { ...node, characterProfile: { ...node.characterProfile, excluded: ['wizard:C:wizard'] } };
    const edit = vi.fn();
    const html = renderToStaticMarkup(<CharacterDescription node={node} graph={{ nodes: { C: node } }} onEdit={edit} onClose={() => {}} />);
    expect(html).toContain('data-symbol="artist"'); expect(html).toContain('<b>Artist</b>');
    expect(html).toContain('Excluded from description');
    expect(html.indexOf('Character frameworks and concepts')).toBeGreaterThan(html.indexOf('aria-label="Character details"'));
    expect(html).not.toContain('disabled=""');
    expect(characterQuickEditInputs(node)[0].wizard.resumeRecord.sourceSnapshot.id).toBe('LIB-CPT-N033');
  });

  it('edits linked inputs through their original owner and keeps missing snapshots visible without starting a blank wizard', () => {
    const source = make('SOURCE', 'Bells.');
    const node = characterProfilePatch({ id: 'C', kind: 'character', title: 'Uno', body: '' }, { nodes: { SOURCE: source } }, { links: [{ nodeId: 'SOURCE', snapshot: characterInputSnapshot(source) }] });
    const [live] = characterQuickEditInputs(node, { nodes: { SOURCE: source } });
    expect(live.wizard.resumeNode).toBe(source); expect(live.linked).toBe(true);
    expect(savedWizardSession(live.wizard.resumeNode, {}, live.wizard.resumeRecord).answers.attention).toBe('Bells.');
    const [missing] = characterQuickEditInputs(node);
    expect(missing.editable).toBe(false); expect(missing.wizard.resumeRecord.answers.attention).toBe('Bells.');
  });

  it('passes the containing graph scope through the shared canvas for main and nested characters', () => {
    const node = make('C', 'Bells.');
    for (const scope of [{ coll: 'nodes' }, { coll: 'masterNodes', parentPath: ['ACT', 'STORY'] }]) {
      fixture.cards = [];
      renderToStaticMarkup(<FlowCanvas nodes={{ C: node }} edges={[]} graphScope={scope} colorOf={() => '#aaa'} />);
      expect(fixture.cards[0].scope).toEqual(scope); expect(fixture.cards[0].node).toBe(node);
    }
  });
});
