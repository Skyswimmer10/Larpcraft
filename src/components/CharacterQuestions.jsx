import React, { useState } from 'react';
import { characterWizardRecords } from '../lib/characterProfile.js';
import NarrativeSourceSymbol from './NarrativeSourceSymbol.jsx';
import CharacterText from './CharacterText.jsx';

export function characterQuestionGroups(node) {
  const owners = new Map(), groups = new Map();
  for (const record of characterWizardRecords(node)) for (const id of Object.values(record.questionIds || {})) owners.set(id, record);
  for (const question of node.questions || []) {
    const record = owners.get(question.id), key = record ? `${record.sourceType}:${record.sourceId}` : 'personal';
    if (!groups.has(key)) groups.set(key, {
      key, label: record?.sourceLabel || record?.sourceId || 'Personal questions', type: record?.sourceType || 'concept',
      source: record ? { ...record.sourceSnapshot, id: record.sourceId, name: record.sourceLabel || record.sourceSnapshot?.name } : { category: 'characterConcept' }, rows: [],
    });
    groups.get(key).rows.push({ question, record });
  }
  if (!groups.has('personal')) groups.set('personal', { key: 'personal', label: 'Personal questions', type: 'concept', source: { category: 'characterConcept' }, rows: [] });
  return [...groups.values()];
}

export default function CharacterQuestions({ node, onPatch }) {
  const [selected, setSelected] = useState(null);
  const groups = characterQuestionGroups(node), group = groups.find(group => group.key === selected);
  return <div className="cp-questions-layout">
    <nav className="cp-question-sources" aria-label="Question sources">{groups.map(group => <button type="button" key={group.key} className={`cp-question-source ${group.type}`} aria-pressed={selected === group.key} onClick={event => { setSelected(group.key); event.currentTarget.closest('.cp-workspace-body')?.scrollTo({ top: 0 }); }}>
      <NarrativeSourceSymbol source={group.source} type={group.type} /><span><b>{group.label}</b><small>{group.rows.length} question{group.rows.length === 1 ? '' : 's'}</small></span>
    </button>)}</nav>
    <div className="cp-question-selection">{group ? <CharacterQuestionPanel group={group} questions={node.questions || []} onPatch={onPatch} /> : <p className="cp-question-empty">Choose a framework or concept symbol to view and edit its saved questions.</p>}</div>
  </div>;
}

export function CharacterQuestionPanel({ group, questions, onPatch }) {
  const patchQuestion = (id, patch) => onPatch({ questions: questions.map(row => row.id === id ? { ...row, ...patch } : row) });
  return <section aria-label={`${group.label} questions`}><h3>{group.label}</h3>
    {group.rows.map(({ question: row, record }) => <section className="cp-workspace-question" key={row.id}>
      {record && <p className="cp-source-name">{record.title} · {record.sourceLabel || record.sourceId}</p>}
      <h4 className="cp-question-prompt">{row.prompt || 'Untitled question'}</h4>
      <details><summary>Edit question</summary><CharacterText label="Question" value={row.prompt || ''} rows={3} onCommit={prompt => patchQuestion(row.id, { prompt })} /></details>
      <CharacterText label="Answer" value={row.answer || ''} rows={6} onCommit={answer => patchQuestion(row.id, { answer })} />
      {!record && <button type="button" className="btn ghost small" onClick={() => onPatch({ questions: questions.filter(item => item.id !== row.id) })}>Remove question</button>}
    </section>)}
    {!group.rows.length && <p>No saved questions in this section yet.</p>}
    {group.key === 'personal' && <button type="button" className="btn" onClick={() => onPatch({ questions: [...questions, { id: `character-question-${crypto.randomUUID()}`, prompt: '', answer: '' }] })}>Add question</button>}
  </section>;
}
