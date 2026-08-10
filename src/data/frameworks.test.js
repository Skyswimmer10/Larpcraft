import { describe, expect, it } from 'vitest';
import { FRAMEWORK_TYPES } from './seed.js';

describe('reference frameworks', () => {
  it('defines the complete descent and recovery arc', () => {
    const framework = FRAMEWORK_TYPES.descentAndRecovery;

    expect(framework.layout).toBe('storyArc');
    expect(framework.phases.map((phase) => phase.name)).toEqual([
      'Comfort Zone',
      'Trigger',
      'Crisis',
      'Recovery',
      'Better Place',
    ]);
    framework.phases.forEach((phase) => {
      expect(phase.short.length).toBeGreaterThan(20);
      expect(phase.detail.length).toBeGreaterThan(40);
    });
  });

  it('defines the complete home, voyage, return circle', () => {
    const framework = FRAMEWORK_TYPES.homeVoyageReturn;
    expect(framework.layout).toBe('storyCircle8');
    expect(framework.phases.map((phase) => phase.name)).toEqual([
      'Comfort Zone', 'Need or Desire', 'Unfamiliar Situation', 'Adaptation',
      'Get What They Want', 'Pay a Price', 'Return to Comfort', 'Having Changed',
    ]);
  });

  it('defines the complete story building decision path', () => {
    const framework = FRAMEWORK_TYPES.storyBuildingSystem;
    expect(framework.layout).toBe('decisionPath');
    expect(framework.phases.map((phase) => phase.name)).toEqual([
      'Concept', 'Explore', 'Character', 'Function',
      'Structure', 'Style', 'Organise', 'Recipe',
    ]);
    framework.phases.forEach((phase) => {
      expect(phase.question.endsWith('?')).toBe(true);
      expect(phase.detail.length).toBeGreaterThan(50);
    });
  });
});
