export const STORY_DYNAMICS_COLORS = ['#F08CB4', '#E8D25C', '#5CA8F5', '#43BF87', '#A87BF0', '#E86464', '#3EC6D6'];

export const STORY_DYNAMICS_TAG_TYPES = [
  { id: 'memorable', label: 'Memorable Moment', color: '#E8D25C' },
  { id: 'problem', label: 'Problem / Dip', color: '#E86464' },
  { id: 'twist', label: 'Possible Twist', color: '#F08CB4' },
  { id: 'victory', label: 'Victory', color: '#A87BF0' },
  { id: 'recovery', label: 'Recovery', color: '#43BF87' },
  { id: 'note', label: 'Note', color: '#8B92A6' },
];

export const STORY_DYNAMICS_DEFAULT_GRAPH = {
  xLabel: 'Player journey through the game',
  yLabel: 'Emotional intensity / memorability',
  curves: [
    {
      id: 'curve-main',
      label: 'Expected emotional arc',
      color: '#F08CB4',
      points: [
        { x: 2, y: 6 },
        { x: 10, y: 10 },
        { x: 20, y: 42 },
        { x: 32, y: 34 },
        { x: 42, y: 58 },
        { x: 50, y: 22 },
        { x: 58, y: 50 },
        { x: 68, y: 74 },
        { x: 74, y: 12 },
        { x: 80, y: 92 },
        { x: 86, y: 55 },
        { x: 91, y: 72 },
        { x: 98, y: 8 },
      ],
    },
  ],
  tags: [
    { id: 'tag-start', type: 'note', label: 'START', x: 8, y: 4, color: '#8B92A6' },
    { id: 'tag-middle', type: 'note', label: 'MIDDLE', x: 50, y: 4, color: '#8B92A6' },
    { id: 'tag-end', type: 'note', label: 'END', x: 88, y: 4, color: '#8B92A6' },
    { id: 'tag-memory', type: 'memorable', label: 'Very memorable moments', x: 38, y: 92, color: '#E8D25C' },
    { id: 'tag-twist', type: 'twist', label: 'Possible twist', x: 68, y: 80, color: '#F08CB4' },
    { id: 'tag-victory', type: 'victory', label: 'Victory', x: 80, y: 96, color: '#A87BF0' },
    { id: 'tag-dip', type: 'problem', label: 'Problems get worse', x: 54, y: 18, color: '#E86464' },
  ],
};

export function normalizeStoryDynamicsGraph(graph) {
  const src = graph && typeof graph === 'object' ? graph : STORY_DYNAMICS_DEFAULT_GRAPH;
  return {
    xLabel: src.xLabel || STORY_DYNAMICS_DEFAULT_GRAPH.xLabel,
    yLabel: src.yLabel || STORY_DYNAMICS_DEFAULT_GRAPH.yLabel,
    curves: Array.isArray(src.curves) ? src.curves.map((curve, idx) => ({
      id: curve.id || `curve-${idx + 1}`,
      label: curve.label || `Curve ${idx + 1}`,
      color: curve.color || STORY_DYNAMICS_COLORS[idx % STORY_DYNAMICS_COLORS.length],
      points: Array.isArray(curve.points) ? curve.points.map((p) => ({
        x: Math.max(0, Math.min(100, Number(p.x) || 0)),
        y: Math.max(0, Math.min(100, Number(p.y) || 0)),
      })) : [],
    })) : [],
    tags: Array.isArray(src.tags) ? src.tags.map((tag, idx) => ({
      id: tag.id || `tag-${idx + 1}`,
      type: tag.type || 'note',
      label: tag.label || 'Tag',
      x: Math.max(0, Math.min(100, Number(tag.x) || 0)),
      y: Math.max(0, Math.min(100, Number(tag.y) || 0)),
      color: tag.color || STORY_DYNAMICS_TAG_TYPES.find((type) => type.id === tag.type)?.color || '#8B92A6',
    })) : [],
  };
}

export const cloneDefaultStoryDynamicsGraph = () => JSON.parse(JSON.stringify(STORY_DYNAMICS_DEFAULT_GRAPH));
