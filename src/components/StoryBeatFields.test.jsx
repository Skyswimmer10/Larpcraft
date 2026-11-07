import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import StoryBeatFields, { StoryBeatIdentityFields, StoryBeatMechanicLink } from './StoryBeatFields.jsx';

const Field = ({ label, value }) => <label>{label}<textarea readOnly value={value} /></label>;
const render = (node, game) => renderToStaticMarkup(<StoryBeatFields node={node} game={game} Field={Field} onPatch={() => {}} onSelect={() => {}} />);

describe('Story Beat optional sections', () => {
  it('starts with Add section and does not require extra questions or nodes', () => {
    const html = render({ id: 'B', kind: 'storyBeat' });
    expect(html).toContain('Add section');
    expect(html).toContain('The title and description can be the entire beat.');
    for (const label of ['Situation / change', 'Objective', 'Dialogue / readout', 'Gameplay']) expect(html).toContain(label);
    expect(html).not.toContain('<textarea');
  });

  it('keeps enabled sections as compact window launchers without rendering their editors in the inspector', () => {
    const node = { id: 'B', kind: 'storyBeat', storyBeat: { sections: ['situation', 'objective', 'dialogue', 'gameplay'], situation: 'The well turns green.', objective: 'Restore clean water.', dialogue: 'Please help.', gameplay: 'Test the samples.', conversationIds: ['T', 'MISSING'], mechanicRefs: [{ coll: 'taskNodes', parentPath: [], nodeId: 'M', title: 'Purifier' }] } };
    const game = { conversations: { T: { id: 'T', title: 'The healer asks for help' }, U: { id: 'U', title: 'The accusation' } }, taskNodes: { M: { id: 'M', mechKind: 'action', title: 'Purifier test' }, N: { id: 'N', mechKind: 'rule', title: 'Sample rules' } } };
    const html = render(node, game);
    for (const text of ['Situation / change', 'Objective', 'Dialogue / readout', 'Gameplay']) expect(html).toContain(text);
    for (const text of ['The well turns green.', 'Restore clean water.', 'Please help.', 'Test the samples.', 'Purifier test']) expect(html).not.toContain(text);
    expect((html.match(/class="btn story-beat-section-launch"/g) || []).length).toBe(4);
    expect(html).not.toContain('<textarea');
    expect(html).not.toContain('Extract');
    expect(html).not.toContain('Create Event');
  });

  it('keeps both visible and hidden section prose out of the compact inspector', () => {
    const node = { id: 'L', kind: 'storyBeat', storyBeat: { sections: ['gameplay'], objective: 'Keep this hidden objective', gameplay: 'Run the purifier.' } };
    const html = render(node);
    expect(html).not.toContain('Keep this hidden objective');
    expect(html).not.toContain('Run the purifier.');
    expect(html).toContain('story-beat-section-launch');
  });

  it('puts title and description together above a compact image without disclosures', () => {
    const html = renderToStaticMarkup(<StoryBeatIdentityFields node={{ title: 'Water crisis', body: 'The well is poisoned.' }} onPatch={() => {}} Field={Field}><span>Image control</span></StoryBeatIdentityFields>);
    expect(html).toContain('Water crisis'); expect(html).toContain('The well is poisoned.');
    expect(html.indexOf('Title')).toBeLessThan(html.indexOf('Description'));
    expect(html.indexOf('Description')).toBeLessThan(html.indexOf('story-beat-image'));
    expect(html).not.toContain('<details');
  });

  it('opens a mechanic with its exact graph path and keeps unlink separate, including missing records', () => {
    const reference = { coll: 'taskNodes', parentPath: ['TASK', 'INNER'], nodeId: 'M', title: 'Old name' }, onOpen = vi.fn(), onUnlink = vi.fn();
    const element = StoryBeatMechanicLink({ reference, live: { title: 'Absolute Control' }, onOpen, onUnlink });
    element.props.children[0].props.onClick();
    expect(onOpen).toHaveBeenCalledWith(reference); expect(onUnlink).not.toHaveBeenCalled();
    element.props.children[1].props.onClick(); expect(onUnlink).toHaveBeenCalledOnce();
    expect(renderToStaticMarkup(element)).toContain('Open mechanic Absolute Control');
    const missing = renderToStaticMarkup(<StoryBeatMechanicLink reference={reference} onOpen={onOpen} onUnlink={onUnlink} />);
    expect(missing).toContain('Old name (missing)'); expect(missing).not.toContain('Open mechanic');
  });
});
