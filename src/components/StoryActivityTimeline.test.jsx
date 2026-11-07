import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import StoryActivityTimeline, { StoryActivityDetails } from './StoryActivityTimeline.jsx';
import StoryDynamics from '../views/StoryDynamics.jsx';
import { createStoryActivity, normalizeStoryDynamicsGraph } from '../data/storyDynamics.js';

const state = vi.hoisted(() => ({ project: null }));
vi.mock('../state/store.jsx', () => ({ useGame: () => state.project, useDispatch: () => vi.fn() }));
const activity = { ...createStoryActivity({}, 'Water crisis'), start: 20, end: 40 };

describe('activity journey presentation', () => {
  it('shows timed clickable bands and a clear entry point into the shorter journey', () => {
    const html = renderToStaticMarkup(<StoryActivityTimeline activities={[activity]} duration={300} activeId={activity.id} onOpen={() => {}} />);
    expect(html).toContain('Water crisis');
    expect(html).toContain('60 min–120 min');
    expect(html).toContain('left:20%;width:20%');
    expect(html).toContain('aria-label="Open Water crisis: 60 min to 120 min"');
    expect(html).toContain('aria-current="page"');
  });

  it('shows local duration and both kinds of sources, while retaining a missing link', () => {
    const sources = [{ coll: 'nodes', parentPath: ['A'], nodeId: 'X', title: 'The warning', label: 'Act / The warning' }, { coll: 'taskNodes', parentPath: [], nodeId: 'M', title: 'Purifier puzzle', label: 'Purifier puzzle' }];
    const html = renderToStaticMarkup(<StoryActivityDetails activity={{ ...activity, sources: [sources[0], { coll: 'nodes', parentPath: [], nodeId: 'lost', title: 'Lost clue' }] }} duration={300} sources={sources} onPatch={() => {}} onInspect={() => {}} />);
    expect(html).toContain('Local journey: 60 min');
    expect(html).toContain('optgroup label="Mechanics"');
    expect(html).toContain('Purifier puzzle');
    expect(html).toContain('The warning');
    expect(html).toContain('Lost clue (missing)');
    expect(html).toContain('Inspect');
    expect(html).toContain('Unlink Lost clue');
  });

  it('keeps existing overview content and explains how the layers relate', () => {
    state.project = { meta: { name: 'Journey test', timeline: { startMin: 0, endMin: 300 } }, storyDynamicsGraph: { ...normalizeStoryDynamicsGraph(), activities: [activity] } };
    const html = renderToStaticMarkup(<StoryDynamics />);
    expect(html).toContain('Whole-game experience');
    expect(html).toContain('+ Activity journey');
    expect(html).toContain('Overview and activity curves are edited independently.');
    expect(html).toContain('Very memorable moments');
    expect(html).toContain('Water crisis');
    expect(html).toContain('300 min');
    expect(html).not.toContain('Remove activity');
  });
});
