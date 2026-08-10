export function frameBackgroundOpacity(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 100;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

export function frameBackgroundCss(color, opacity) {
  if (!color) return 'transparent';
  return `color-mix(in srgb, ${color} ${frameBackgroundOpacity(opacity)}%, transparent)`;
}
