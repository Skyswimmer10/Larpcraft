const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Both side panes reserve 280px for dialogue plus the two 6px dividers.
export function conversationPaneLayout(width, left = 220, right = 354) {
  const available = Math.max(732, Number(width) || 1000);
  left = clamp(left, 180, Math.min(480, available - 260 - 292));
  const rightMax = Math.min(640, available - left - 292);
  right = clamp(right, 260, rightMax);
  const leftMax = Math.min(480, available - right - 292);
  return { left, right, leftMax, rightMax };
}
