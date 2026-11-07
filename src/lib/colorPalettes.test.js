import { describe, expect, it, vi } from 'vitest';
import { COLOR_PALETTES, DEFAULT_PALETTE, PALETTE_STORAGE_KEY, colorPalette, readColorPalette, saveColorPalette, applyColorPalette } from './colorPalettes.js';

const luminance = color => {
  const channels = color.slice(1).match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
};
const contrast = (a, b) => { const values = [luminance(a), luminance(b)].sort((x, y) => y - x); return (values[0] + .05) / (values[1] + .05); };

describe('application color palettes', () => {
  it('keeps six distinct approved palettes with readable content and action text', () => {
    expect(new Set(COLOR_PALETTES.map(row => row.id)).size).toBe(6);
    expect(COLOR_PALETTES.filter(row => row.tone === 'light').map(row => row.id)).toEqual(['daylight']);
    for (const palette of COLOR_PALETTES) {
      for (const surface of ['ground', 'panel', 'raised']) {
        expect(contrast(palette.ink, palette[surface]), palette.name).toBeGreaterThanOrEqual(4.5);
        expect(contrast(palette.muted, palette[surface]), palette.name).toBeGreaterThanOrEqual(4.5);
      }
      expect(contrast(palette.brand, palette.onBrand), palette.name).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('persists only a validated local appearance preference and restores it on reload', () => {
    const values = new Map(), storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
    expect(readColorPalette(storage)).toBe(DEFAULT_PALETTE);
    for (const palette of COLOR_PALETTES) { saveColorPalette(palette.id, storage); expect(readColorPalette(storage)).toBe(palette.id); }
    expect([...values.keys()]).toEqual([PALETTE_STORAGE_KEY]);
    expect(saveColorPalette('unknown', storage)).toBe(DEFAULT_PALETTE);
    values.set(PALETTE_STORAGE_KEY, 'older-or-invalid');
    expect(readColorPalette(storage)).toBe(DEFAULT_PALETTE);
    const denied = { getItem: () => { throw Error('blocked'); }, setItem: () => { throw Error('blocked'); } };
    expect(readColorPalette(denied)).toBe(DEFAULT_PALETTE);
    expect(saveColorPalette('forest', denied)).toBe('forest');
  });
  it('applies the document-level palette for portalled dialogs as well as the main frame', () => {
    const root = { dataset: {}, style: { setProperty: vi.fn() } };
    expect(applyColorPalette('daylight', root)).toBe('daylight');
    expect(root.dataset).toEqual({ palette: 'daylight', tone: 'light' });
    expect(root.style.setProperty).toHaveBeenCalledWith('--panel', colorPalette('daylight').panel);
    expect(root.style.setProperty).toHaveBeenCalledWith('color-scheme', 'light');
    applyColorPalette('ocean', root);
    expect(root.dataset).toEqual({ palette: 'ocean', tone: 'dark' });
    expect(root.style.setProperty).toHaveBeenCalledWith('color-scheme', 'dark');
  });
});
