import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import PalettePicker from './PalettePicker.jsx';
import { COLOR_PALETTES } from '../lib/colorPalettes.js';

describe('compact palette picker', () => {
  it('uses one icon trigger with six named, keyboard reachable choices', () => {
    const html = renderToStaticMarkup(<PalettePicker />);
    expect(html).toContain('<details');
    expect(html).toContain('Color palette: Midnight Violet');
    expect(html).toContain('role="group" aria-label="Color palette"');
    for (const palette of COLOR_PALETTES) expect(html).toContain(palette.name.replace('&', '&amp;'));
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(html.match(/type="button"/g)).toHaveLength(6);
  });
});
