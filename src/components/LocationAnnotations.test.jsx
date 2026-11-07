import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import LocationAnnotationPanel, { LocationAnnotationLayer } from './LocationAnnotations.jsx';
import { LocationStageEditor } from './LocationStage.jsx';
import { makeEmptyProject, locationMapDefaults } from '../data/seed.js';

const location = { id: 'L', name: 'Camp', ...locationMapDefaults(), mapLabels: [{ id: 'L1', text: 'Old well', x: 20, y: 30, color: '#e8d25c' }, { id: 'L2', text: 'Actor entrance', x: 60, y: 20, audience: 'facilitator' }], mapZones: [{ id: 'Z1', name: 'Search area', x: 20, y: 20, w: 40, h: 30, color: '#79c9a5' }, { id: 'Z2', name: 'Organizer camp', audience: 'facilitator', x: 80, y: 30, w: 10, h: 10 }] };

describe('location annotation views', () => {
  it('omits private content and editing handles from the player map', () => {
    const html = renderToStaticMarkup(<LocationAnnotationLayer location={location} audience="player" selected={null} interactive={false} />);
    expect(html).toContain('Old well'); expect(html).toContain('Search area');
    expect(html).not.toContain('Actor entrance'); expect(html).not.toContain('Organizer camp');
    expect(html).not.toContain('map-zone-resize'); expect(html).not.toContain('role="button"');
  });

  it('shows private notes, selection and resize handles in facilitator mode', () => {
    const html = renderToStaticMarkup(<LocationAnnotationLayer location={location} audience="facilitator" selected={{ collection: 'mapZones', id: 'Z1' }} interactive onDrag={() => {}} onSelect={() => {}} />);
    expect(html).toContain('Actor entrance'); expect(html).toContain('Organizer camp');
    expect(html).toContain('map-zone selected'); expect(html).toContain('map-zone-resize');
    expect(html).toContain('tabindex="0"');
  });

  it('offers a compact editor with audience, geometry and an optional existing Story Location link', () => {
    const html = renderToStaticMarkup(<LocationAnnotationPanel location={location} selected={{ collection: 'mapZones', id: 'Z1' }} onSelect={() => {}} onChange={() => {}} onRemove={() => {}} markerName={() => ''} storyLocations={[{ id: 'S', title: 'The magical forest' }]} />);
    for (const label of ['Zone name', 'Visible to', 'Facilitator only', 'Width (%)', 'Height (%)', 'No linked Story Location', 'The magical forest', 'Delete zone']) expect(html).toContain(label);
  });

  it('loads legacy stages with the new optional tools while preserving existing marker references', () => {
    const game = { ...makeEmptyProject(), items: { I: { id: 'I', name: 'Red stick' } } };
    const html = renderToStaticMarkup(<LocationStageEditor location={{ id: 'L', name: 'Older', markers: [{ id: 'M', kind: 'item', refId: 'I', x: 4, y: 5 }], arrows: [] }} game={game} dispatch={() => {}} />);
    for (const label of ['Add label', 'Draw zone', 'Player preview', 'Facilitator edit', 'Red stick']) expect(html).toContain(label);
  });
});
