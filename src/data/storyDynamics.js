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

export function normalizeStoryDynamicsChart(graph) {
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

const percent = value => Math.max(0, Math.min(100, Number(value) || 0));
export const emptyActivityChart = () => ({ xLabel: 'Journey within this activity', yLabel: STORY_DYNAMICS_DEFAULT_GRAPH.yLabel, curves: [], tags: [] });

export function normalizeStoryDynamicsGraph(graph) {
  const used = new Set();
  return {
    ...normalizeStoryDynamicsChart(graph),
    durationMinutes: Number.isFinite(Number(graph?.durationMinutes)) && Number(graph?.durationMinutes) > 0 ? Number(graph.durationMinutes) : null,
    activities: (Array.isArray(graph?.activities) ? graph.activities : []).filter(a => a && typeof a === 'object').map((activity, index) => {
      let id = String(activity.id || `activity-${index + 1}`);
      while (used.has(id)) id += '-copy';
      used.add(id);
      const a = percent(activity.start ?? 0), b = percent(activity.end ?? 20);
      const start = Math.min(Math.min(a, b), 99.9);
      const end = Math.max(Math.max(a, b), start + 0.1);
      return {
        id, title: activity.title || `Activity ${index + 1}`, start, end,
        color: activity.color || STORY_DYNAMICS_COLORS[index % STORY_DYNAMICS_COLORS.length],
        notes: activity.notes || '',
        sources: Array.isArray(activity.sources) ? activity.sources.filter(source => ['nodes', 'masterNodes', 'taskNodes'].includes(source?.coll) && typeof source.nodeId === 'string').map(source => ({
          coll: source.coll, parentPath: Array.isArray(source.parentPath) ? source.parentPath.filter(id => typeof id === 'string') : [], nodeId: source.nodeId, title: source.title || source.nodeId,
        })) : [],
        graph: normalizeStoryDynamicsChart(activity.graph || emptyActivityChart()),
      };
    }),
  };
}

export function createStoryActivity(graph, title = 'New activity') {
  const activities = graph?.activities || [];
  let counter = 1;
  while (activities.some(activity => activity.id === `activity-${counter}`)) counter++;
  return { id: `activity-${counter}`, title, start: 0, end: 20, color: STORY_DYNAMICS_COLORS[activities.length % STORY_DYNAMICS_COLORS.length], notes: '', sources: [], graph: emptyActivityChart() };
}

export function updateStoryDynamicsChart(root, activityId, chart) {
  const nextChart = normalizeStoryDynamicsChart(chart);
  if (!activityId) return { ...root, ...nextChart };
  return { ...root, activities: root.activities.map(activity => activity.id === activityId ? { ...activity, graph: nextChart } : activity) };
}

export function storyDynamicsDuration(graph, timeline) {
  if (Number(graph?.durationMinutes) > 0) return Number(graph.durationMinutes);
  const minutes = Number(timeline?.endMin) - Number(timeline?.startMin);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 240;
}

export function storyDynamicsSourceKey(source) {
  return JSON.stringify([source.coll, source.parentPath || [], source.nodeId]);
}

export function storyDynamicsSources(project) {
  const result = [];
  const walk = (nodes, coll, path = [], names = []) => {
    Object.values(nodes || {}).forEach(node => {
      const title = node.title || node.name || node.id;
      result.push({ coll, parentPath: path, nodeId: node.id, title, label: [...names, title].join(' / ') });
      if (node.sub?.nodes) walk(node.sub.nodes, coll, [...path, node.id], [...names, title]);
    });
  };
  for (const coll of ['masterNodes', 'nodes', 'taskNodes']) walk(project?.[coll], coll);
  return result;
}

export const cloneDefaultStoryDynamicsGraph = () => JSON.parse(JSON.stringify(STORY_DYNAMICS_DEFAULT_GRAPH));
