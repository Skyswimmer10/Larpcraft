import { GROUP_FOUNDATIONS, GROUP_FOUNDATIONS_ID, GROUP_QUESTIONS, groupFacts, groupFoundationsText, groupProfileFactsText } from './groupFoundations.js';
import { enableCharacterProfile, syncCharacterProfile, characterSources } from './characterProfile.js';
import { appendWizardResult, reviseWizardResult } from './narrativeWizard.js';
import { questionAnswer } from './narrativeMemory.js';
import { characterAttributesText } from './characterAttributes.js';

const clone = value => JSON.parse(JSON.stringify(value));
export function createGroupResult({ id, title, facts = {}, answers = {}, position = {} }) {
  answers = { ...Object.fromEntries(GROUP_QUESTIONS.flatMap(q => [[q.key, ''], ...(q.choiceAnswerKey ? [[q.choiceAnswerKey, '']] : [])])), ...answers };
  const record = { version: 2, resultId: id, sessionId: `${id}:group`, sourceType: 'framework', sourceId: GROUP_FOUNDATIONS_ID,
    sourceLabel: 'Group Foundations', title, focus: 'relationship', context: '', roles: [], questions: clone(GROUP_QUESTIONS),
    answers: clone(answers), sourceSnapshot: clone(GROUP_FOUNDATIONS), summary: groupFoundationsText(answers, { institution: !!facts.institution }), summaryFormat: 'group-foundations-prose', questionIds: {},
  };
  const questions = GROUP_QUESTIONS.filter(q => questionAnswer(q, answers)).map(q => {
    const questionId = `${id}-group-${q.key}`; record.questionIds[q.key] = questionId;
    return { id: questionId, prompt: q.prompt, answer: questionAnswer(q, answers) };
  });
  return syncCharacterProfile(enableCharacterProfile({ id, kind: 'group', title, name: title, x: position.x ?? 100, y: position.y ?? 100,
    w: 300, h: 170, color: '#73CCB2', body: record.summary, description: record.summary, narrativeFocus: 'relationship',
    narrativeWizard: record, questions, groupFacts: groupFacts({ groupFacts: clone(facts) }), characterCanvas: { version: 1 },
  }));
}
export function saveGroupResult(target, options, record) {
  const addition = createGroupResult(options);
  if (!target) return addition;
  const active = { ...target, title: options.title, name: options.title, groupFacts: clone(options.facts) };
  return record ? reviseWizardResult({ ...active, narrativeWizard: record }, addition, GROUP_FOUNDATIONS) : appendWizardResult(active, addition);
}
export function groupExport(node, includeQuestions = false, format = 'full', graph = {}) {
  const description = node.description || node.body || '';
  if (format === 'short') return description.split(/\n\s*\n/).map(paragraph => paragraph.split(/(?<=[.!?])\s+/u)[0]).slice(0, 4).join(' ');
  const parts = [node.title || node.name, groupProfileFactsText(node), characterAttributesText(node), description];
  if (format === 'ai') parts.push('Group story context: use recorded facts and approved description. Possible pressures and developments are possibilities, not established events. Membership does not imply a fixed personality or behaviour.');
  if (includeQuestions) for (const record of characterSources(node, graph).filter(row => row.enabled).flatMap(row => row.record ? [row.record] : row.records || [])) {
    parts.push(`Source: ${record.sourceLabel}`);
    for (const question of record.questions || []) {
      const answer = questionAnswer(question, record.answers);
      if (answer) parts.push(question.prompt, answer);
    }
  }
  return parts.filter(Boolean).join('\n\n');
}
