import { FRAMEWORK_TYPES } from '../data/seed.js';
import { adaptConceptGraph, frameworkNotesGraph, reviseWizardGraph } from './narrativeGraph.js';
import { questionAnswer } from './narrativeMemory.js';
import { GROUP_FOUNDATIONS_ID } from './groupFoundations.js';

const copy = value => JSON.parse(JSON.stringify(value));
const sessionKey = record => record.sessionId || `${record.sourceType}:${record.sourceId}:${record.title}`;
const empty = () => ({ nodes: {}, edges: [], frames: {}, numberMarkers: {}, titleMarkers: {} });

function inputGraph(record) {
  const source = record.sourceType === 'framework'
    ? FRAMEWORK_TYPES[record.sourceId] || { id: record.sourceId, title: record.sourceLabel }
    : record.sourceSnapshot || { id: record.sourceId, nodes: {}, edges: [] };
  return record.sourceId === GROUP_FOUNDATIONS_ID
    ? adaptConceptGraph(record.sourceSnapshot || source, record.roles || [], record.questions || [], record.answers || {})
    : record.sourceType === 'framework'
    ? frameworkNotesGraph(source, record.questions || [], record.answers || {})
    : adaptConceptGraph(source, record.roles || [], record.questions || [], record.answers || {});
}

function syncAnswers(current, generated) {
  const byKey = new Map();
  const collect = graph => Object.values(graph?.nodes || {}).forEach(node => {
    if (node.wizardQuestionKey) byKey.set(node.wizardQuestionKey, node);
    collect(node.sub);
  });
  collect(generated);
  const visit = graph => ({ ...graph, nodes: Object.fromEntries(Object.entries(graph.nodes || {}).map(([id, node]) => {
    const answer = byKey.get(node.wizardQuestionKey);
    return [id, { ...node, ...(answer ? { body: answer.body, wizardAnswer: answer.wizardAnswer, wizardGeneratedAnswer: answer.wizardGeneratedAnswer, wizardGeneratedBody: answer.wizardGeneratedBody, wizardReferenceBody: answer.wizardReferenceBody } : {}), ...(node.sub ? { sub: visit(node.sub) } : {}) }];
  })) });
  return visit(current);
}

// Project-local views of the character's canonical sessions. The child never
// owns another wizard record: its edit button always resumes the parent session.
export function syncCharacterCanvas(node, sources) {
  if (node.characterCanvas?.version !== 1) return node;
  let sub = node.sub || empty();
  let nodes = { ...sub.nodes };
  const bindings = new Map();
  let questions = node.questions;
  for (const [index, row] of sources.entries()) {
    if (node.characterCanvas.hidden?.includes(row.key)) continue;
    const record = row.record;
    const previewRecord = record || (row.records?.length === 1 ? row.records[0] : null);
    let existing = Object.values(nodes).find(child => child.characterInput?.key === row.key);
    if (!existing && record?.attachedChildId && !nodes[record.attachedChildId]?.characterInput) existing = nodes[record.attachedChildId];
    let id = existing?.id || `CHAR-INPUT-${index + 1}`;
    while (!existing && nodes[id]) id += '-copy';
    const marker = existing?.characterInput;
    const generated = record ? inputGraph(record) : row.records?.length === 1 ? inputGraph(row.records[0]) : row.canvas || empty();
    let current = existing?.sub;

    // Older concept characters had their first native tree directly inside the
    // character. Move that tree as a unit only when no connection would be cut.
    if (record?.sourceType === 'concept' && !existing && !Object.values(nodes).some(n => n.characterInput)) {
      const nativeIds = new Set(Object.keys(generated.nodes));
      const present = Object.keys(nodes).filter(key => nativeIds.has(key));
      const otherSessions = new Set(sources.map(source => source.record?.attachedChildId).filter(Boolean));
      const crossed = (sub.edges || []).some(edge => otherSessions.has(edge.from) !== otherSessions.has(edge.to));
      if (present.length && !crossed) {
        const moved = Object.fromEntries(Object.entries(nodes).filter(([key]) => !otherSessions.has(key)));
        current = { ...sub, nodes: moved };
        nodes = Object.fromEntries(Object.entries(nodes).filter(([key]) => otherSessions.has(key)));
        sub = empty();
      }
    }
    const previous = marker?.generated && previewRecord ? inputGraph({ ...previewRecord, ...marker.generated }) : generated;
    const inner = previewRecord ? syncAnswers(reviseWizardGraph(current, previous, generated), generated) : reviseWizardGraph(current, previous, generated);
    const isFramework = (record?.sourceType || (row.frameworkId ? 'framework' : 'concept')) === 'framework';
    const child = {
      ...existing, id, kind: isFramework ? 'framework' : 'concept',
      ...(isFramework ? { frameworkId: record?.sourceId || row.frameworkId } : { conceptKind: 'characterConcept' }),
      title: row.sourceLabel || row.label, body: row.text || '',
      x: existing?.x ?? 100 + index % 3 * 370, y: existing?.y ?? 100 + Math.floor(index / 3) * 290,
      w: existing?.w ?? 320, h: existing?.h ?? 240, color: existing?.color || (isFramework ? '#66BD91' : '#E7A25A'),
      sub: inner,
      characterInput: { key: row.key, enabled: row.enabled,
        ...(previewRecord ? { generated: { answers: copy(previewRecord.answers || {}), roles: copy(previewRecord.roles || []), questions: copy(previewRecord.questions || []) } } : {}),
        ...(record ? { sessionId: sessionKey(record) } : { linkedNodeId: row.nodeId }),
      },
    };
    // Retire the old child-owned duplicate session, retaining other authored data.
    delete child.narrativeWizard; delete child.narrativeWizardHistory; delete child.characterProfile; delete child.characterCanvas;
    nodes[id] = child;
    if (record) {
      bindings.set(sessionKey(record), { ...record, attachedChildId: id });
      questions = questions?.map(question => {
        const definition = record.questions?.find(q => record.questionIds?.[q.key] === question.id);
        return definition ? { ...question, answer: questionAnswer(definition, record.answers) } : question;
      });
    }
  }
  // Source removal removes its generated view. Extra user nodes remain intact.
  const keys = new Set(sources.map(row => row.key));
  const removed = new Set(Object.values(nodes).filter(child => child.characterInput && !keys.has(child.characterInput.key)).map(child => child.id));
  for (const id of removed) delete nodes[id];
  const bind = record => bindings.get(sessionKey(record)) || record;
  return { ...node, questions,
    ...(node.narrativeWizard ? { narrativeWizard: bind(node.narrativeWizard) } : {}),
    ...(node.narrativeWizardHistory ? { narrativeWizardHistory: node.narrativeWizardHistory.map(bind) } : {}),
    sub: { ...sub, nodes, edges: (sub.edges || []).filter(edge => !removed.has(edge.from) && !removed.has(edge.to)) },
  };
}
