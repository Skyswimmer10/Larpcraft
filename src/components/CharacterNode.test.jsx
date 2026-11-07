import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import CharacterNode, { CharacterDescription, characterNodeSources } from './CharacterNode.jsx';
import FlowCanvas from './FlowCanvas.jsx';
import { createWizardNode } from '../lib/narrativeWizard.js';
import { removeCharacterInput } from '../lib/characterProfile.js';
import { FRAMEWORK_TYPES } from '../data/seed.js';

vi.mock('react-dom', () => ({ createPortal: children => children }));
vi.stubGlobal('document', { body: {} });

const record = (sourceId, sourceLabel, sessionId = sourceId, extra = {}) => ({ sourceId, sourceLabel, sourceType: 'framework', sessionId, summaryFormat: 'prose', summary: 'A recorded detail.', ...extra });
const character = () => ({ id: 'C', kind: 'character', title: 'Moro', x: 0, y: 0, body: 'Complete character description.', description: 'Complete character description.', narrativeWizardHistory: [record('fate', 'FATE'), record('nlpMetaPrograms', 'NLP Metaprograms')], characterProfile: {} });

describe('compact character canvas node', () => {
  it('keeps portraits scaled while adding or removing the source rail without changing saved geometry', () => {
    const node = { ...createWizardNode({ id: 'C', title: 'Moro', source: FRAMEWORK_TYPES.fate, type: 'framework', focus: 'character', questions: [{ key: 'attention', prompt: 'What do they notice?' }], answers: { attention: 'The bells.' } }), image: { dataUrl: 'data:image/png;base64,portrait' }, w: 320, h: 280 };
    const before = renderToStaticMarkup(<CharacterNode node={node} graph={{ nodes: { C: node } }} />);
    expect(before).toContain('character-node-portrait-fill has-source-rail');
    expect(before).toContain('data-symbol="fate"');
    const removed = removeCharacterInput(node, {}, 'wizard:C:wizard');
    const after = renderToStaticMarkup(<CharacterNode node={removed} graph={{ nodes: { C: removed } }} />);
    expect(after).toContain('character-node-portrait-fill');
    expect(after.indexOf('>Description</button>')).toBeLessThan(after.indexOf('<img'));
    expect(after).not.toContain('max-height:');
    expect(after).not.toContain('character-node-symbols');
    expect(after).not.toContain('has-source-rail');
    expect(removed.image).toEqual(node.image);
    expect([removed.w, removed.h]).toEqual([320, 280]);
    const added = { ...removed, narrativeWizardHistory: [record('nlpMetaModel', 'NLP Meta Model')], characterProfile: {} };
    expect(renderToStaticMarkup(<CharacterNode node={added} graph={{ nodes: { C: added } }} />)).toContain('character-node-portrait-fill has-source-rail');
  });

  it('scales all four narrative entity images and hides the rail when the last input is excluded', () => {
    const node = { ...character(), image: { dataUrl: 'data:image/png;base64,portrait' } };
    const render = value => renderToStaticMarkup(<CharacterNode node={value} graph={{ nodes: {} }} />);
    expect(render({ ...node, image: null })).not.toContain('character-node-portrait-fill');
    for (const kind of ['character', 'group', 'item', 'storyLocation']) expect(render({ ...node, kind })).toContain('character-node-portrait-fill has-source-rail');
    expect(render({ ...node, kind: 'group', narrativeWizardHistory: [] })).toContain('character-node-portrait-fill');
    expect(render(node)).not.toContain('max-height:');
    expect(render({ ...node, characterProfile: { excluded: ['wizard:fate', 'wizard:nlpMetaPrograms'] } })).toContain('character-node-portrait-fill');
  });

  it('uses the existing FATE and NLP symbols beside Description without putting prose on the card', () => {
    const html = renderToStaticMarkup(<CharacterNode node={character()} graph={{ nodes: {} }} />);
    expect(html).toContain('>Description</button>');
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-label="FATE"');
    expect(html).toContain('aria-label="NLP Metaprograms"');
    expect(html).toContain('data-symbol="fate"');
    expect(html).toContain('data-symbol="preferences"');
    expect(html).not.toContain('Complete character description.');
  });

  it('deduplicates repeated sources, hides excluded inputs and identifies concepts from their saved references', () => {
    const node = character();
    node.narrativeWizardHistory.push(record('fate', 'FATE', 'second-fate'), record('COPY', 'Renamed artist', 'artist', { sourceType: 'concept', sourceSnapshot: { conceptId: 'LIB-CPT-N033', name: 'Artist' } }));
    node.characterProfile.excluded = ['wizard:nlpMetaPrograms'];
    const html = renderToStaticMarkup(<CharacterNode node={node} graph={{ nodes: {} }} />);
    expect(html.match(/data-symbol="fate"/g)).toHaveLength(1);
    expect(html).not.toContain('data-symbol="preferences"');
    expect(html).toContain('data-symbol="artist"');
    expect(html).toContain('aria-label="Renamed artist"');
  });

  it('keeps symbols for saved missing inputs and updates included canvas sources without mutating the profile', () => {
    const node = { ...character(), narrativeWizardHistory: [], characterProfile: { links: [{ nodeId: 'S', snapshot: { title: 'Saved source', records: [record('kolbLearningCycle', 'Kolb Learning Cycle')] } }] } };
    const before = JSON.stringify(node);
    expect(characterNodeSources(node, { nodes: {} })[0]).toMatchObject({ label: 'Kolb Learning Cycle', source: { id: 'kolbLearningCycle' } });
    const live = { id: 'S', kind: 'framework', frameworkId: 'fate', title: 'FATE reference' };
    expect(characterNodeSources(node, { nodes: { S: live } })[0].source.id).toBe('fate');
    expect(JSON.stringify(node)).toBe(before);
  });

  it('shows the complete saved description in the dialog, including legacy body-only characters', () => {
    const html = renderToStaticMarkup(<CharacterDescription node={{ ...character(), description: 'First paragraph.\n\nSecond paragraph.' }} onClose={() => {}} />);
    expect(html).toContain('<dialog'); expect(html).toContain('Moro · Description');
    expect(html).toContain('First paragraph.\n\nSecond paragraph.');
    expect(html).toContain('aria-label="Full description"');
    expect(html).toContain('Space reserved for a photo or illustration');
    const portrait = renderToStaticMarkup(<CharacterDescription node={{ ...character(), image: { dataUrl: 'data:image/png;base64,portrait' } }} onClose={() => {}} />);
    expect(portrait).toContain('src="data:image/png;base64,portrait"');
    expect(portrait).toContain('alt="Portrait of Moro"');
    expect(portrait).not.toContain('Space reserved for a photo or illustration');
    expect(renderToStaticMarkup(<CharacterDescription node={{ title: 'Older', body: 'Retained older prose.' }} onClose={() => {}} />)).toContain('Retained older prose.');
  });

  it('includes filled identity, brief facts and current relationship names above the prose', () => {
    const node = { ...character(), name: 'Moro', title: 'Keeper of the Gate', characterFacts: { role: 'Gatekeeper', gender: 'Man', race: 'Human', age: 0, goal: 'Protect the village', relationships: [{ type: 'Loyal to', name: 'Old king', targetId: 'KING', targetType: 'node' }, { type: 'Friends', name: 'Uno' }] } };
    const html = renderToStaticMarkup(<CharacterDescription node={node} graph={{ nodes: { KING: { id: 'KING', kind: 'character', title: 'King Arno' } } }} onClose={() => {}} />);
    for (const text of ['Name: Moro', 'Title: Keeper of the Gate', 'Story role: Gatekeeper', 'Gender: Man', 'Race: Human', 'Age: 0', 'Goal / motivation: Protect the village', 'Loyal to: King Arno', 'Friends: Uno']) expect(html).toContain(text);
    expect(html).not.toContain('Old king');
    expect(html.indexOf('Story role:')).toBeLessThan(html.indexOf('Complete character description.'));
  });

  it('omits empty details and relationships and avoids repeating a shared name/title', () => {
    const node = { ...character(), name: 'Moro', characterFacts: { role: ' ', gender: '', race: '', age: '', goal: '', relationships: [{ type: 'Friends', name: '  ' }] } };
    const html = renderToStaticMarkup(<CharacterDescription node={node} onClose={() => {}} />);
    expect(html).toContain('Name / title: Moro');
    for (const label of ['Story role:', 'Gender:', 'Race:', 'Age:', 'Goal / motivation:', 'Friends:', 'Name: Moro', 'Title: Moro']) expect(html).not.toContain(label);
    const empty = renderToStaticMarkup(<CharacterDescription node={{ body: 'Description alone.' }} onClose={() => {}} />);
    expect(empty).not.toContain('aria-label="Character details"');
    expect(empty).toContain('Description alone.');
  });

  it('replaces character prose in the shared canvas while preserving other node bodies and saved geometry', () => {
    const node = { ...character(), w: 540, h: 420, image: { dataUrl: 'data:image/png;base64,portrait' } };
    const event = { id: 'E', kind: 'event', title: 'Arrival', body: 'Keep this event text.', x: 600, y: 0 };
    const html = renderToStaticMarkup(<FlowCanvas nodes={{ C: node, E: event }} edges={[]} colorOf={() => '#aaa'} renderBody={n => n.body} renderExtra={() => <span>Other node controls</span>} />);
    expect(html).not.toContain('Complete character description.');
    expect(html).toContain('>Description</button>');
    expect(html).toContain('Keep this event text.');
    expect(html).toContain('width:540px;height:420px');
    expect(html).toContain('class="character-node-portrait-thumb"');
    expect(html.indexOf('>Description</button>')).toBeLessThan(html.indexOf('class="character-node-portrait-thumb"'));
    expect(html).not.toContain('class="nimgframe');
  });

  it('uses the same card for story items and locations while retaining authored lore in Description', () => {
    const item = { id: 'I', kind: 'item', title: 'Lightsaber', x: 0, y: 0, body: 'Player-facing history.', completeLore: 'A hidden origin.', origin: 'The old order', buildStatus: 'tested', w: 320, h: 260, image: { dataUrl: 'data:image/png;base64,item' }, narrativeWizardHistory: [record('fate', 'FATE')] };
    const location = { ...item, id: 'L', x: 400, kind: 'storyLocation', title: 'The city', image: { dataUrl: 'data:image/png;base64,location' } };
    const html = renderToStaticMarkup(<FlowCanvas nodes={{ I: item, L: location }} edges={[]} colorOf={() => '#aaa'} renderBody={n => n.body} />);
    expect(html.match(/has-source-rail/g)).toHaveLength(2);
    expect(html.match(/data-symbol="fate"/g)).toHaveLength(2);
    expect(html).toContain('Description of Lightsaber');
    expect(html).toContain('Description of The city');
    expect(html).not.toContain('Player-facing history.');
    expect(html).toContain('tested');
    const description = renderToStaticMarkup(<CharacterDescription node={item} onClose={() => {}} />);
    for (const value of ['Player lore', 'Player-facing history.', 'Complete lore · facilitator', 'A hidden origin.', 'Origin: The old order']) expect(description).toContain(value);
    expect(description).not.toContain('Character details');
  });
});
