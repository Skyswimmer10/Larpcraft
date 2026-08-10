const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function frameworkBaseSize(framework = {}) {
  if (framework.id === 'jungianMasculineArchetypes' || framework.layout === 'archetypes') return { w: 360, h: 330 };
  if (framework.id === 'kolbLearningCycle' || framework.layout === 'cycle') return { w: 300, h: 260 };
  if (framework.id === 'descentAndRecovery' || framework.layout === 'storyArc') return { w: 330, h: 215 };
  if (framework.id === 'homeVoyageReturn' || framework.layout === 'storyCircle8') return { w: 360, h: 325 };
  if (framework.id === 'storyBuildingSystem' || framework.layout === 'decisionPath') return { w: 400, h: 430 };
  if (framework.layout === 'values') return { w: 236, h: Math.max(180, Math.ceil((framework.phases?.length || 1) / 2) * 42 + 72) };
  return { w: 236, h: 150 };
}

export function frameworkPreviewScale(framework, width, height) {
  const base = frameworkBaseSize(framework);
  const widthRatio = Math.max(0.1, Number(width) || base.w) / base.w;
  if (!Number(height)) return clamp(widthRatio, 0.6, 2.75);
  const heightRatio = Math.max(0.1, Number(height)) / base.h;
  return clamp(Math.min(widthRatio, heightRatio), 0.6, 2.75);
}
