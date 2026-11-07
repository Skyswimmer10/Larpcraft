import { describe, expect, it } from 'vitest';
import { cloneDefaultStoryDynamicsGraph, createStoryActivity, emptyActivityChart, normalizeStoryDynamicsGraph, storyDynamicsDuration, storyDynamicsSourceKey, storyDynamicsSources, updateStoryDynamicsChart } from './storyDynamics.js';

describe('whole-game and activity journeys', () => {
  it('retains an existing overview without inventing activities or changing its curve', () => {
    const legacy = cloneDefaultStoryDynamicsGraph();
    const before = JSON.stringify(legacy);
    const normalized = normalizeStoryDynamicsGraph(legacy);
    expect(normalized.curves).toEqual(legacy.curves);
    expect(normalized.tags).toEqual(legacy.tags);
    expect(normalized.activities).toEqual([]);
    expect(JSON.stringify(legacy)).toBe(before);
    expect(storyDynamicsDuration(normalized, { startMin: 540, endMin: 1020 })).toBe(480);
    expect(storyDynamicsDuration(normalized, {})).toBe(240);
  });

  it('creates separate blank activity charts with unique IDs', () => {
    const root = normalizeStoryDynamicsGraph();
    const first = createStoryActivity(root, 'The water crisis');
    const second = createStoryActivity({ ...root, activities: [first] });
    expect(first.graph).toEqual(emptyActivityChart());
    expect(first.graph).not.toBe(second.graph);
    expect(first.id).not.toBe(second.id);
  });

  it('keeps overview, sibling activity and local edits independent, including resets', () => {
    const base = normalizeStoryDynamicsGraph();
    const a = createStoryActivity(base, 'Negotiation');
    const b = createStoryActivity({ activities: [a] }, 'Escape');
    const root = { ...base, durationMinutes: 300, activities: [a, b] };
    const chart = { ...emptyActivityChart(), curves: [{ id: 'peak', label: 'Surprise', color: '#fff', points: [{ x: 10, y: 5 }, { x: 20, y: 99 }] }], tags: [{ id: 't', label: 'Discovery', x: 20, y: 99 }] };
    const edited = updateStoryDynamicsChart(root, a.id, chart);
    expect(edited.curves).toEqual(root.curves);
    expect(edited.tags).toEqual(root.tags);
    expect(edited.activities[1]).toEqual(b);
    expect(edited.activities[0].graph.curves[0].points[1].y).toBe(99);
    const resetOverview = updateStoryDynamicsChart(edited, null, cloneDefaultStoryDynamicsGraph());
    expect(resetOverview.activities).toEqual(edited.activities);
    expect(resetOverview.durationMinutes).toBe(300);
    const resetActivity = updateStoryDynamicsChart(edited, a.id, emptyActivityChart());
    expect(resetActivity.activities[0].graph.curves).toEqual([]);
    expect(resetActivity.curves).toEqual(root.curves);
  });

  it('keeps overlapping ranges and bounds invalid timing without losing local content', () => {
    const graph = normalizeStoryDynamicsGraph({ activities: [
      { id: 'a', start: 70, end: 20 }, { id: 'a', start: 100, end: 400 }, { id: 'c', start: 30, end: 60 },
    ] });
    expect(graph.activities[0]).toMatchObject({ start: 20, end: 70 });
    expect(graph.activities[1].id).not.toBe('a');
    expect(graph.activities.every(a => a.start >= 0 && a.start < a.end && a.end <= 100)).toBe(true);
    expect(graph.activities[2]).toMatchObject({ start: 30, end: 60 });
    const duration = storyDynamicsDuration({ durationMinutes: 300 }, {});
    expect((graph.activities[0].end - graph.activities[0].start) / 100 * duration).toBe(150);
  });

  it('distinguishes narrative and mechanics sources even with matching IDs in nested graphs', () => {
    const project = { nodes: { A: { id: 'A', title: 'Act', sub: { nodes: { X: { id: 'X', title: 'Warning' } } } } }, taskNodes: { X: { id: 'X', title: 'Purifier puzzle' } } };
    const before = JSON.stringify(project);
    const sources = storyDynamicsSources(project);
    const nested = sources.find(s => s.title === 'Warning');
    expect(nested).toMatchObject({ coll: 'nodes', parentPath: ['A'], nodeId: 'X', label: 'Act / Warning' });
    expect(new Set(sources.map(storyDynamicsSourceKey)).size).toBe(3);
    const normalized = normalizeStoryDynamicsGraph({ activities: [{ sources: [nested, sources.find(s => s.title === 'Purifier puzzle')] }] });
    expect(normalized.activities[0].sources).toHaveLength(2);
    expect(JSON.stringify(project)).toBe(before);
  });
});
