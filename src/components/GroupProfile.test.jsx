import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import GroupWizard, { groupLiveDescription } from './GroupWizard.jsx';
import GroupPanel from './GroupPanel.jsx';
import GroupMembers from './GroupMembers.jsx';
import GroupRoster from './GroupRoster.jsx';
import { createGroupResult } from '../lib/groupProfile.js';
import { groupFoundationsText } from '../lib/groupFoundations.js';
import { makeEmptyProject } from '../data/seed.js';

const fixture = vi.hoisted(() => ({ game: null }));
vi.mock('../state/store.jsx', () => ({ useGame: () => fixture.game, useLibrary: () => ({ concepts: {}, narrative: {} }), useDispatch: () => vi.fn(), useLibraryDispatch: () => vi.fn() }));
vi.mock('react-dom', () => ({ createPortal: children => children }));
vi.stubGlobal('document', { body: {} });

const make = () => createGroupResult({ id: 'G', title: 'Lantern Guild', facts: { kind: 'Guild', size: '80', purpose: 'Guard the road', members: [{ id: 'm', name: 'Mira', role: 'Mediator', ref: { coll: 'nodes', path: ['C'] } }] }, answers: { 'bonds:choice': 'Trust' } });

describe('group authoring UI', () => {
  it('opens Group Foundations with compact details, colored steps and a live description', () => {
    fixture.game = makeEmptyProject();
    const html = renderToStaticMarkup(<GroupWizard onClose={() => {}} />);
    for (const text of ['Group name', 'Kind of group', 'Approximate size', 'Brief shared purpose', 'Live group description', 'Members &amp; roles', 'Power &amp; rules', 'Tensions &amp; change']) expect(html).toContain(text);
    expect(html).toContain('Larpcraft authoring guide');
    expect(html).toContain('Include optional institution details');
    expect(html).not.toContain('What is their mandate');
  });

  it('reopens the existing foundation and selected step with saved answers in the live pane', () => {
    const group = make(); fixture.game = { ...makeEmptyProject(), nodes: { G: group } };
    const html = renderToStaticMarkup(<GroupWizard targetId="G" startStep="identity" onClose={() => {}} />);
    expect(html).toContain('Their bonds rest on trust.');
    expect(html).toContain('Lantern Guild is a guild.');
    expect(html).toContain('What brought them together?');
    expect(groupLiveDescription(group, groupFoundationsText({ 'bonds:choice': 'Oaths' }))).toContain('Their bonds rest on oaths.');
  });

  it('offers profile links and names without profiles and keeps roles scoped to membership', () => {
    const group = make(); fixture.game = { ...makeEmptyProject(), nodes: { G: group, C: { id: 'C', kind: 'character', title: 'Mira' }, OTHER: { id: 'OTHER', kind: 'group', title: 'Town council' }, MECH: { id: 'MECH', kind: 'mechanic', title: 'A mechanism' } } };
    const html = renderToStaticMarkup(<GroupMembers game={fixture.game} facts={group.groupFacts} ownerRef={{ coll: 'nodes', path: ['G'] }} onChange={() => {}} />);
    expect(html).toContain('Name without a profile'); expect(html).toContain('Role in this group'); expect(html).toContain('Loyalty or allegiance');
    expect(html).toContain('Mira'); expect(html).toContain('Town council'); expect(html).not.toContain('A mechanism');
    const roster = GroupRoster({ scope: { coll: 'nodes', parentPath: ['G'] }, onSelect: vi.fn() });
    const memberButton = roster.props.children[0][0];
    const select = vi.fn();
    GroupRoster({ scope: { coll: 'nodes', parentPath: ['G'] }, onSelect: select }).props.children[0][0].props.onClick();
    expect(memberButton.props.children).toContain('Mira');
    expect(select).toHaveBeenCalledWith({ kind: 'graphnode', scope: { coll: 'nodes', parentPath: [] }, id: 'C' });
  });

  it('keeps the inspector compact and provides profile, export and input editing controls', () => {
    const group = make(); fixture.game = { ...makeEmptyProject(), nodes: { G: group } };
    const html = renderToStaticMarkup(<GroupPanel node={group} onPatch={() => {}} />);
    for (const text of ['Group Foundations', 'Members &amp; relationships (1)', 'Add a framework or concept', 'Edit Group’s Profile', 'Save group to library', 'Add image', 'Choose group image', 'Edit wizard: Group Foundations', 'Delete Group Foundations input', 'data-symbol="companion"']) expect(html).toContain(text);
    expect(html.indexOf('>Add image</button>')).toBeLessThan(html.indexOf('Group name'));
    expect(html.indexOf('type="checkbox"')).toBeLessThan(html.indexOf('Edit wizard: Group Foundations'));
    expect(html.indexOf('Edit wizard: Group Foundations')).toBeLessThan(html.indexOf('class="cp-input-delete"'));
    expect(html).not.toContain('Open profile / export');
    expect(html).not.toContain('<textarea'); expect(html).not.toContain('Gender'); expect(html).not.toContain('Archetype');
  });
});
