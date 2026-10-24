import { FRAMEWORK_TYPES } from '../data/seed.js';

const text = value => typeof value === 'string' ? value.trim() : '';

// A choice and a written explanation are separate pieces of the same answer.
export function questionAnswer(row, answers = {}) {
  const choice = row.choiceAnswerKey ? text(answers[row.choiceAnswerKey]) : '';
  const written = text(answers[row.textAnswerKey || row.key]);
  return [choice, written].filter(Boolean).join('\n\n');
}

export function recordedAnswers(questions = [], answers = {}) {
  return questions.filter(row => questionAnswer(row, answers)).map(row => ({
    key: row.key, prompt: row.prompt, answer: questionAnswer(row, answers),
  }));
}

export function selectedArchetype(source, value) {
  return source?.phases?.find(phase => phase.key.toLowerCase() === text(value).toLowerCase());
}

// Use the actual reference and the writer's own words. No inferred personality
// labels or invented facts are added to an answer.
export function questionMemory({ source, type, questions, answers, active, roles = [], target }) {
  if (!active) return { earlier: [], selections: [], prior: [], guidance: '' };
  const index = questions.findIndex(row => row.key === active.key);
  const earlierRows = questions.slice(0, Math.max(0, index)).filter(row => questionAnswer(row, answers));
  const dependencyRows = active.dependsOn?.map(key => earlierRows.find(row => row.key === key)).filter(Boolean) || [];
  const rows = [...new Map([...earlierRows.filter(row => row.key.startsWith('focus:')).slice(0, 1), ...dependencyRows, ...earlierRows.slice(-2)].map(row => [row.key, row])).values()].slice(-3);
  const earlier = recordedAnswers(rows, answers);
  const selections = roles.filter(role => text(role.replacement)).map(role => ({ label: role.label || role.original, value: role.replacement }));
  const archetype = source?.layout === 'archetypes' ? selectedArchetype(source, answers.archetype) : null;
  if (archetype) selections.unshift({ label: 'Archetype', value: archetype.key });
  if (source?.layout === 'archetypes' && text(answers.otherRole)) selections.push({ label: 'Other side', value: answers.otherRole });
  if (source?.layout === 'preferenceSpectra' || source?.layout === 'values') {
    for (const row of questions) if (row.choiceAnswerKey && text(answers[row.choiceAnswerKey])) {
      const phase = source.phases.find(phase => row.key === `phase:${phase.key}`);
      selections.push({ label: phase?.name || row.prompt, value: answers[row.choiceAnswerKey] });
    }
  }
  const phase = source?.phases?.find(phase => active.key === `phase:${phase.key}`);
  const previous = earlierRows.filter(row => row.key.startsWith('phase:')).at(-1);
  const previousPhase = source?.phases?.find(phase => previous?.key === `phase:${phase.key}`);
  let guidance = '';
  if (archetype && !['archetype', 'otherRole'].includes(active.key)) {
    guidance = `You chose ${archetype.key}. Use its ${active.key === 'activeShadow' ? `${archetype.adultActiveShadow} shadow` : active.key === 'passiveShadow' ? `${archetype.adultPassiveShadow} shadow` : active.key === 'root' ? `${archetype.name} developing form` : 'strengths and responsibilities'} to develop the situation you described.`;
    if (active.key === 'shadowScene' && (answers.activeShadow || answers.passiveShadow)) guidance = `Build a scene around the ${archetype.key} shadows you described. What brings that behaviour out, who feels its effects, and what could change it?`;
  } else if (source?.id === 'kolbLearningCycle' && previousPhase) {
    guidance = { RO: 'Look back at the direct experience you recorded. What could players notice about it?', AC: 'Build the idea from the reflection you recorded, rather than adding an unrelated lesson.', AE: 'Test the idea you recorded in a new action. What result would support it, and what might make players rethink it?' }[phase?.key] || '';
  } else if (source?.id === 'fate' && previousPhase) {
    guidance = { A: 'Use the focus or message you recorded. Why would these people trust it?', T: 'Connect the message and its credibility to the people who need to feel involved.', E: 'Bring together the attention, credibility, and belonging you recorded. What detail could make that message felt?' }[phase?.key] || '';
  } else if (source?.layout === 'values' && previousPhase) {
    guidance = `You have already explored ${previousPhase.key} / ${previousPhase.name}. How does ${phase?.key} / ${phase?.name} support or clash with that value in this same situation?`;
  } else if (source?.layout === 'preferenceSpectra') {
    const choice = answers[active.choiceAnswerKey];
    guidance = phase && choice && choice === phase.left ? `${phase.left}: ${phase.leftDescription} Show what this means in the situation you described.` : phase && choice && choice === phase.right ? `${phase.right}: ${phase.rightDescription} Show what this means in the situation you described.` : earlier.length ? 'Keep the preferences you already recorded in mind. Explain where this preference supports them, differs, or changes with the situation.' : '';
  } else if (['storyArc', 'storyCircle8', 'decisionPath'].includes(source?.layout) && previousPhase) {
    guidance = `Build this step from ${previousPhase.name}, which you have already described. What carries forward, and what changes at ${phase?.name}?`;
  } else if (source?.layout === 'languageSpectrum' && earlier.length) {
    guidance = 'Try this language pattern in the conversation you already described. It can clarify the same exchange or reveal another misunderstanding within it.';
  } else if (source?.layout === 'profileDomains' && previousPhase) {
    guidance = `You have described ${previousPhase.name}. Show how this next aspect appears in the same fictional person, including any differences between situations.`;
  } else if (type === 'concept' && earlier.length) {
    guidance = `Use the roles and earlier answers below to develop this part of ${source.name || source.title || 'your concept'}. Keep the connection between the parts, even when you change the original example.`;
  }
  const records = target ? [...(target.narrativeWizardHistory || []), ...(target.narrativeWizard ? [target.narrativeWizard] : [])] : [];
  const uniqueRecords = [...new Map(records.map(record => [record.sessionId || `${record.sourceType}:${record.sourceId}:${record.title}`, record])).values()];
  const prior = uniqueRecords.filter(record => record.sourceId !== source?.id || record.sourceType !== type).map(record => ({
    label: record.sourceLabel || record.title,
    archetype: selectedArchetype(FRAMEWORK_TYPES[record.sourceId], record.answers?.archetype),
    answers: recordedAnswers(record.questions, record.answers),
  })).filter(record => record.answers.length || record.archetype);
  if (!guidance && prior.length) guidance = 'Use the recorded work below as background for this answer. You can develop another side of the same person or situation.';
  return { earlier, selections, prior, guidance };
}

// Saved records contain their question keys and answers, so continuing a wizard
// restores a choice even if the originating library entry is no longer present.
export function savedWizardSession(node, library, record = node?.narrativeWizard) {
  if (!record?.sourceId || !record.sourceType) return null;
  const source = record.sourceType === 'framework' ? FRAMEWORK_TYPES[record.sourceId] : library?.concepts?.[record.sourceId];
  if (!source && !record.questions?.length) return null;
  const answers = { ...(record.answers || {}) };
  const attachedId = record.attachedChildId || Object.values(node.sub?.nodes || {}).find(child => child.narrativeWizard?.sourceId === record.sourceId && child.narrativeWizard?.title === record.title)?.id;
  const plan = attachedId ? node.sub.nodes[attachedId] : node;
  const readAnswer = (row, value) => {
    if (row.choiceAnswerKey) {
      const [first, ...rest] = value.split('\n\n');
      const wasChosen = !!record.answers?.[row.choiceAnswerKey];
      const validMulti = row.control === 'multi' && first.split(' | ').every(choice => row.choices?.includes(choice));
      if (wasChosen && (row.choices?.includes(first) || validMulti)) {
        answers[row.choiceAnswerKey] = first;
        answers[row.textAnswerKey || row.key] = rest.join('\n\n');
      } else answers[row.textAnswerKey || row.key] = value;
    } else answers[row.textAnswerKey || row.key] = value;
  };
  for (const row of record.questions || []) {
    const id = record.questionIds?.[row.key];
    const editable = id && node.questions?.find(question => question.id === id);
    const note = Object.values(plan.sub?.nodes || {}).find(child => child.wizardQuestionKey === row.key);
    if (editable) readAnswer(row, editable.answer || '');
    else if (note) readAnswer(row, note.body || '');
  }
  return { source: source || { id: record.sourceId, name: record.sourceLabel, description: '', savedQuestions: record.questions }, type: record.sourceType, record, answers, targetId: node.id };
}

export function savedWizardSessions(node, library) {
  const records = [...(node?.narrativeWizardHistory || []), ...(node?.narrativeWizard ? [node.narrativeWizard] : [])];
  return [...new Map(records.map(record => [record.sessionId || `${record.sourceType}:${record.sourceId}:${record.title}`, record])).values()]
    .map(record => savedWizardSession(node, library, record)).filter(Boolean);
}
