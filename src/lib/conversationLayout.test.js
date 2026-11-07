import { describe, expect, it } from 'vitest';
import { conversationPaneLayout } from './conversationLayout.js';

describe('conversation pane sizing', () => {
  it('allows either side to expand without consuming the minimum dialogue space', () => {
    expect(conversationPaneLayout(1200, 220, 500)).toMatchObject({ left: 220, right: 500, rightMax: 640 });
    expect(conversationPaneLayout(1200, 480, 354)).toMatchObject({ left: 480, right: 354 });
    for (const width of [732, 800, 1000, 1200, 1600]) for (const left of [100, 220, 480, 900]) for (const right of [100, 354, 640, 900]) {
      const layout = conversationPaneLayout(width, left, right);
      expect(layout.left).toBeGreaterThanOrEqual(180);
      expect(layout.right).toBeGreaterThanOrEqual(260);
      expect(layout.left).toBeLessThanOrEqual(layout.leftMax);
      expect(layout.right).toBeLessThanOrEqual(layout.rightMax);
      expect(width - layout.left - layout.right - 12).toBeGreaterThanOrEqual(280);
    }
  });
  it('uses bounded scrollable minima on a narrow screen rather than negative widths', () => {
    expect(conversationPaneLayout(500, 480, 640)).toEqual({ left: 180, right: 260, leftMax: 180, rightMax: 260 });
  });
});
