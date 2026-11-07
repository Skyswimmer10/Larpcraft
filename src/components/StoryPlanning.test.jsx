import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import StoryPlanningDialog from './StoryPlanning.jsx';
import { StoryBeatReviewFields, StoryDirectionFields } from './StoryPlanningFields.jsx';

vi.mock('react-dom', () => ({ createPortal: children => children }));
vi.stubGlobal('document', { body: {} });
vi.mock('../state/store.jsx', () => ({ useGame: () => ({ meta: { name: 'Test game', storyPlanning: { direction: { themes: ['Loyalty vs truth'] }, plans: { journey12: { answers: { ordinary: { life: 'The market is open.' } } } } } }, nodes: {}, masterNodes: {} }), useDispatch: () => () => {} }));

describe('story planning presentation', () => {
  it('provides a complete card overview with several questions per stage and a live preview', () => {
    const html = renderToStaticMarkup(<StoryPlanningDialog initialTab="plot" onClose={() => {}} />);
    expect((html.match(/class="story-stage-card/g) || [])).toHaveLength(12);
    expect((html.match(/<textarea/g) || [])).toHaveLength(24);
    for (const text of ['Ordinary World', 'Return with the Elixir', 'Event arc', 'Pressure and change', 'Story at a glance', 'The market is open.', 'Loyalty vs truth', 'Link an Act or Story Beat']) expect(html).toContain(text);
  });
  it('keeps direction optional with custom tags and separate inheritance controls', () => {
    const html = renderToStaticMarkup(<StoryDirectionFields value={{ themes: ['A custom idea'] }} inherited={{ tones: ['Winter night'] }} onPatch={() => {}} />);
    for (const text of ['Theme / idea to explore', 'Tone / setting flavor', 'A custom idea', 'Winter night', 'Use Master Story themes', 'Use Master Story tone', 'Add your own']) expect(html).toContain(text);
    expect(html).not.toContain('required=');
  });
  it('offers one thread form for new and older entries, moves impact choices out of the inspector and can hide resolved entries', () => {
    const node = { id: 'B', storyBeat: { impacts: ['Thematic significance'], threads: [{ id: 'T', title: 'The missing courier', kind: 'story', status: 'open' }, { id: 'I', title: 'Incompatible dates', kind: 'inconsistency', status: 'open' }, { id: 'C', title: 'Already answered', kind: 'story', status: 'resolved' }] } };
    const html = renderToStaticMarkup(<StoryBeatReviewFields node={node} onPatch={() => {}} />);
    expect(html).not.toContain('Thematic significance');
    expect(html).toContain('1 selected');
    expect(html).toContain('The missing courier');
    expect(html).toContain('Incompatible dates');
    expect(html).toContain('Revealed to players');
    expect(html).toContain('What remains unanswered, or needs attention?');
    expect((html.match(/>Add thread<\/button>/g) || []).length).toBe(1);
    expect(html).not.toContain('Add authoring issue');
    const filtered = renderToStaticMarkup(<StoryBeatReviewFields node={node} onPatch={() => {}} initialOpen kindFilter="story" showResolved={false} hideImpacts />);
    expect(filtered).toContain('The missing courier');
    expect(filtered).not.toContain('Incompatible dates');
    expect(filtered).not.toContain('Already answered');
    expect(filtered).not.toContain('Thematic significance');
  });
});
