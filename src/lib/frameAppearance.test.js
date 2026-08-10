import { describe, expect, it } from 'vitest';
import { frameBackgroundCss, frameBackgroundOpacity } from './frameAppearance.js';

describe('frame background appearance', () => {
  it('defaults to full opacity and clamps saved values', () => {
    expect(frameBackgroundOpacity(undefined)).toBe(100);
    expect(frameBackgroundOpacity(-20)).toBe(0);
    expect(frameBackgroundOpacity(140)).toBe(100);
  });

  it('keeps transparent frames clear and applies opacity only to a selected fill', () => {
    expect(frameBackgroundCss(null, 45)).toBe('transparent');
    expect(frameBackgroundCss('#FFFFFF', 45)).toBe('color-mix(in srgb, #FFFFFF 45%, transparent)');
  });
});
