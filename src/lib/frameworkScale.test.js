import { describe, expect, it } from 'vitest';
import { frameworkPreviewScale } from './frameworkScale.js';

describe('frameworkPreviewScale', () => {
  const framework = { id: 'homeVoyageReturn', layout: 'storyCircle8' };

  it('keeps a framework at its natural scale initially', () => {
    expect(frameworkPreviewScale(framework, 360)).toBe(1);
  });

  it('doubles internal content when both node dimensions double', () => {
    expect(frameworkPreviewScale(framework, 720, 650)).toBe(2);
  });

  it('preserves proportions when only one node axis is stretched', () => {
    expect(frameworkPreviewScale(framework, 720, 325)).toBe(1);
  });
});
