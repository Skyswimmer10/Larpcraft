import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import CharacterNode, { CharacterDescription, characterNodeSources, characterQuickEditInputs, CharacterDescriptionInputs } from './CharacterNode.jsx';
import { CharacterWorkspaceContents } from './CharacterWorkspace.jsx';
import FlowCanvas from './FlowCanvas.jsx';
import { createGroupResult } from '../lib/groupProfile.js';
import { characterSources } from '../lib/characterProfile.js';
import { savedWizardSession } from '../lib/narrativeMemory.js';

vi.mock('react-dom', () => ({ createPortal: children => children }));
vi.stubGlobal('document', { body: {} });
const make = () => ({ ...createGroupResult({ id: 'G', title: 'Lantern Guild', facts: { kind: 'Guild', size: '80', purpose: 'Guard the road', members: [{ id: 'm', name: 'Mira', role: 'Mediator' }] }, answers: { 'bonds:choice': 'Trust' } }), image: { dataUrl: 'data:image/png;base64,guild-image' } });

describe('group node presentation', () => {
  it('shows the image, Description and accepted framework symbols without duplicated prose or a clipped generic thumbnail', () => {
    const group = make(), html = renderToStaticMarkup(<CharacterNode node={group} graph={{ nodes: { G: group } }} />);
    expect(html).toContain('src="data:image/png;base64,guild-image"');
    expect(html).toContain('alt="Image of Lantern Guild"');
    expect(html).toContain('data-symbol="companion"');
    expect(html).toContain('character-node-source framework');
    expect(html.indexOf('>Description</button>')).toBeLessThan(html.indexOf('character-node-portrait-thumb'));
    expect(html).not.toContain('Their bonds rest on trust.');
    const canvas = renderToStaticMarkup(<FlowCanvas nodes={{ G: group }} edges={[]} colorOf={() => '#73CCB2'} renderBody={node => node.body} onSelect={() => {}} />);
    expect(canvas).toContain('>Description</button>');
    expect(canvas).not.toContain('Their bonds rest on trust.');
    expect(canvas.match(/src="data:image\/png;base64,guild-image"/g)).toHaveLength(1);
    group.characterProfile.excluded = [characterSources(group)[0].key];
    expect(characterNodeSources(group, {}).length).toBe(0);
  });

  it('shows group facts and a saved framework edit shortcut below the image in the full description', () => {
    const group = make(), graph = { nodes: { G: group } };
    const html = renderToStaticMarkup(<CharacterDescription node={group} graph={graph} onEdit={() => {}} onClose={() => {}} />);
    for (const text of ['Group image', 'Group details', 'Kind of group: Guild', 'Approximate size: 80', 'Shared purpose: Guard the road', 'Members: Mira', 'Group frameworks and concepts', 'Group Foundations', 'data-symbol="companion"']) expect(html).toContain(text);
    expect(html).not.toContain('Gender');
    expect(html.indexOf('Group frameworks and concepts')).toBeGreaterThan(html.indexOf('Group details'));
    const inputs = characterQuickEditInputs(group, graph), edit = vi.fn();
    CharacterDescriptionInputs({ inputs, kind: 'Group', onEdit: edit }).props.children[1][0].props.onClick();
    expect(edit).toHaveBeenCalledWith(inputs[0]);
    expect(savedWizardSession(inputs[0].wizard.resumeNode, {}, inputs[0].wizard.resumeRecord).answers['bonds:choice']).toBe('Trust');
    expect(inputs[0].wizard.resumeNode).toBe(group);
    expect(inputs[0].type).toBe('framework');
  });

  it('uses the centered profile workspace with grouped saved questions and combined format/export controls', () => {
    const group = make();
    const html = renderToStaticMarkup(<CharacterWorkspaceContents node={group} graph={{ nodes: { G: group } }} view="profile" />);
    for (const text of ['Group profile', 'Combined group description', 'Full group profile', 'Short introduction', 'AI story context', 'Saved questions', 'Copy text', 'Download text']) expect(html).toContain(text);
    expect(html).not.toContain('Voice and dialogue');
    expect(html).not.toContain('>Export</button>');
    const questions = renderToStaticMarkup(<CharacterWorkspaceContents node={group} graph={{}} view="questions" />);
    expect(questions).toContain('Group Foundations'); expect(questions).toContain('data-symbol="companion"');
    expect(questions).toContain('cp-question-source framework');
    expect(questions).not.toContain('What keeps them together?');
  });
});
