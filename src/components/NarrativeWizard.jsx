import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGame, useDispatch, useLibrary, useLibraryDispatch } from '../state/store.jsx';
import { locateGraph } from '../state/reducer.js';
import { genId } from '../data/csvSchemas.js';
import { visibleCanvasPlacement } from './FlowCanvas.jsx';
import { narrativeSources, frameworkQuestions, conceptQuestions, conceptRoles, substituteRoles, wizardSummary, createWizardNode, wizardLibraryRecord } from '../lib/narrativeWizard.js';
import './NarrativeWizard.css';

export function NarrativeWizardButton({ source, sourceType, targetId, gameScope, onSaved, label = 'Character & story wizard', className = 'btn' }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className={className} onClick={() => setOpen(true)}>{label}</button>
    {open && <NarrativeWizard initialSource={source} initialType={sourceType} initialTargetId={targetId} gameScope={gameScope} onClose={() => setOpen(false)} onSaved={onSaved} />}
  </>;
}

export default function NarrativeWizard({ initialSource, initialType, initialTargetId, gameScope, onClose, onSaved }) {
  const game = useGame();
  const library = useLibrary();
  const dispatch = useDispatch();
  const libraryDispatch = useLibraryDispatch();
  const gameNodes = gameScope ? locateGraph(game, gameScope).nodes : game.nodes;
  const dialog = useRef(null);
  const main = useRef(null);
  const saved = useRef(false);
  const [chosen, setChosen] = useState(initialSource ? { source: initialSource, type: initialType || 'concept' } : null);
  const [stage, setStage] = useState(initialSource ? 'setup' : 'source');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [output, setOutput] = useState(initialType === 'concept' && initialSource?.category !== 'characterConcept' && initialSource?.conceptKind !== 'characterConcept' ? 'concept' : 'character');
  const [targetId, setTargetId] = useState(initialTargetId || '');
  const [roles, setRoles] = useState(() => initialType === 'concept' ? conceptRoles(initialSource) : []);
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState(null);
  const source = chosen?.source;
  const type = chosen?.type;
  const sources = useMemo(() => narrativeSources(library), [library.concepts]);
  const questions = useMemo(() => !source ? [] : type === 'framework' ? frameworkQuestions(source, answers) : conceptQuestions(source), [source, type, answers.archetype]);
  const count = questions.filter(row => answers[row.key]?.trim()).length;
  const dirty = !!(title.trim() || context.trim() || Object.values(answers).some(a => a.trim()) || roles.some(r => r.replacement.trim()));
  const close = () => {
    if (!saved.current && dirty && !window.confirm('Close the wizard and discard these unsaved answers?')) return;
    onClose();
  };
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    element.showModal();
    return () => { element.close(); previousFocus?.focus?.(); };
  }, []);
  useEffect(() => {
    main.current?.scrollTo(0, 0);
    main.current?.focus();
  }, [stage, index]);

  const choose = item => {
    if (chosen && chosen.source !== item.source && dirty && !window.confirm('Switch starting point? Your current answers and role replacements will be cleared.')) return;
    setChosen({ source: item.source, type: item.type });
    setRoles(item.type === 'concept' ? conceptRoles(item.source) : []);
    setAnswers({}); setIndex(0);
    setOutput(targetId ? 'character' : item.type === 'concept' && item.source.category !== 'characterConcept' ? 'concept' : 'character');
    setStage('setup');
  };
  const setAnswer = value => setAnswers(current => ({ ...current, [questions[index].key]: value }));
  const build = id => createWizardNode({ source, type, title, context, roles, questions, answers, output, id, position: visibleCanvasPlacement({ x: 100, y: 100 }), characterTemplate: game.meta.characterCardTemplate });
  const preview = stage === 'review' ? wizardSummary({ source, type, title, context, roles, questions, answers }) : '';
  const target = output === 'character' ? gameNodes?.[targetId] : null;
  const save = includeLibrary => {
    if (saved.current || !title.trim()) return;
    let node = build(genId(gameNodes, `${game.meta.prefix}-N-`));
    if (targetId && (!target || target.kind !== 'character')) return;
    if (target) {
      const answered = node.questions.filter(q => q.id.startsWith(`${node.id}-wizard-`));
      node = { ...target, questions: [...(target.questions || []), ...answered], narrativeWizard: node.narrativeWizard,
        narrativeWizardHistory: [...(target.narrativeWizardHistory || (target.narrativeWizard ? [target.narrativeWizard] : [])), node.narrativeWizard],
        body: [target.body, node.body].filter(Boolean).join('\n\n'),
        description: [target.description || target.body, node.body].filter(Boolean).join('\n\n'),
      };
      // Keep the existing character's inner graph. A concept adaptation is a
      // separate child container so it cannot overwrite authored contents.
      if (type === 'concept') {
        const sub = target.sub || {};
        const child = createWizardNode({ source, type, title, context, roles, questions, answers, output: 'concept', id: genId(sub.nodes || {}, 'WIZ-'), position: { x: 100, y: 100 } });
        node.sub = { ...sub, nodes: { ...(sub.nodes || {}), [child.id]: child }, edges: sub.edges || [] };
      }
      dispatch({ type: gameScope ? 'GRAPH_UPDATE_NODE' : 'UPDATE_ENTITY', ...(gameScope ? { scope: gameScope } : { coll: 'nodes' }), id: target.id, patch: { questions: node.questions, body: node.body, description: node.description, narrativeWizard: node.narrativeWizard, narrativeWizardHistory: node.narrativeWizardHistory, ...(node.sub ? { sub: node.sub } : {}) } });
    } else dispatch({ type: gameScope ? 'GRAPH_ADD_NODE' : 'ADD_NODE', ...(gameScope ? { scope: gameScope } : {}), node });
    if (includeLibrary) {
      const coll = node.kind === 'character' ? 'narrative' : 'concepts';
      const record = wizardLibraryRecord(node, genId(library[coll] || {}, coll === 'narrative' ? 'LIB-NAR-' : 'LIB-CPT-N'));
      libraryDispatch({ type: 'ADD_ENTITY', ...record });
    }
    saved.current = true;
    setResult({ id: node.id, includeLibrary, existing: !!target });
    setStage('done');
  };
  const questionText = value => type === 'concept' ? substituteRoles(value, roles) : value;
  const goQuestions = () => { setIndex(0); setStage('questions'); };
  const next = () => index + 1 < questions.length ? setIndex(index + 1) : setStage('review');
  const active = questions[index];
  const sourceLabel = source?.label || source?.name || source?.title;
  return createPortal(<dialog ref={dialog} className="narrative-wizard" aria-labelledby="narrative-wizard-title" onCancel={event => { event.preventDefault(); event.stopPropagation(); close(); }} onClick={event => { event.stopPropagation(); if (event.target === event.currentTarget) close(); }}>
    <div className="nw-shell">
      <header className="nw-header"><div><small>Narrative workshop</small><h2 id="narrative-wizard-title">{stage === 'source' ? 'Choose a starting point' : sourceLabel}</h2></div><button type="button" className="btn" onClick={close}>Close</button></header>
      <div className="nw-body">
        <aside className="nw-sidebar" aria-label="Wizard steps">
          <b>Your version, step by step</b>
          <p>Keep the idea. Change the people, places, objects, or pressures that bring it to life.</p>
          <ol><li className={stage === 'source' ? 'current' : ''}>Choose a framework or concept</li><li className={stage === 'setup' ? 'current' : ''}>Name your version</li>{type === 'concept' && <li className={stage === 'roles' ? 'current' : ''}>Choose what fills each role</li>}<li className={stage === 'questions' ? 'current' : ''}>Answer at your own pace</li><li className={stage === 'review' ? 'current' : ''}>Review and save</li></ol>
          {['questions', 'review'].includes(stage) && <><small>{count} of {questions.length} answered · skipping is fine</small><nav className="nw-question-nav" aria-label="Questions">{questions.map((row, i) => <button key={row.key} type="button" className={stage === 'questions' && i === index ? 'current' : ''} onClick={() => { setIndex(i); setStage('questions'); }}><span aria-label={answers[row.key]?.trim() ? 'Answered' : 'Unanswered'}>{answers[row.key]?.trim() ? '●' : '○'}</span>{questionText(row.prompt)}</button>)}</nav></>}
        </aside>
        <main ref={main} className="nw-main" tabIndex={-1}>
          {stage === 'source' && <>
            <p>Frameworks help you explore a character. Concepts help you adapt a story pattern, character, or scene.</p>
            <label className="nw-field">Search frameworks and concepts<input autoFocus className="field-input" type="search" value={query} onChange={e => setQuery(e.target.value)} /></label>
            <div className="nw-filters">{[['all', 'All'], ['framework', 'Frameworks'], ['concept', 'Concepts']].map(([id, label]) => <button type="button" key={id} className={`btn${filter === id ? ' primary' : ''}`} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>)}</div>
            <div className="nw-source-grid">{sources.filter(item => (filter === 'all' || item.type === filter) && `${item.label} ${item.source.description || item.source.summary || ''}`.toLowerCase().includes(query.toLowerCase())).map(item => <button type="button" className="nw-source" key={item.key} onClick={() => choose(item)}><small>{item.type === 'framework' ? 'Framework' : 'Concept'}</small><b>{item.label}</b><span>{item.source.blurb || item.source.description}</span></button>)}</div>
          </>}
          {stage === 'setup' && <>
            <h3>What are you creating?</h3><p>{source.summary || source.description || source.body}</p>
            {type === 'framework' && <p className="nw-help">Use this as a fictional character-writing aid. Your answers describe a character, not an assessment of a real person.</p>}
            <label className="nw-field">Save as<select className="field-input" value={output} onChange={e => { setOutput(e.target.value); setTargetId(''); }}><option value="character">Character</option>{type === 'concept' && <option value="concept">Adapted concept / scene</option>}</select></label>
            {output === 'character' && <label className="nw-field">Character to work on<select className="field-input" value={targetId} onChange={e => setTargetId(e.target.value)}><option value="">Create a new character</option>{Object.values(gameNodes || {}).filter(n => n.kind === 'character').map(n => <option key={n.id} value={n.id}>{n.title}</option>)}</select></label>}
            <label className="nw-field">{target ? 'Title for these new notes' : 'Name of your character or version'}<input className="field-input" autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Give your version a name" /></label>
            <label className="nw-field">What is happening around them? <small>Optional</small><textarea className="field-input" rows={3} value={context} onChange={e => setContext(e.target.value)} placeholder="A situation, relationship, setting, or problem" /></label>
            {target && <p className="nw-help">Answers will be added to {target.title}. Their existing fields and connections will be kept.</p>}
          </>}
          {stage === 'roles' && <>
            <h3>Same story roles, your own entities</h3><p>Replace a literal example with what fills the same role in your version. A threat could be a dragon or a debt. What is protected could be a castle or a home.</p>
            <p className="nw-help">The copied graph keeps its layout and connections. Filled roles rename the matching nodes and wording in your copy.</p>
            {roles.map((role, i) => <fieldset className="nw-role" key={role.id}><legend>{role.label || 'Your story role'}</legend><label className="nw-field">Original word or phrase<input className="field-input" value={role.original} onChange={e => setRoles(rows => rows.map((r, j) => j === i ? { ...r, original: e.target.value } : r))} /></label><label className="nw-field">What fills this role in your version?<input className="field-input" value={role.replacement} onChange={e => setRoles(rows => rows.map((r, j) => j === i ? { ...r, replacement: e.target.value } : r))} placeholder="Person, place, object, or idea" /></label><small>{role.hint}</small><button type="button" className="linkbtn" onClick={() => setRoles(rows => rows.filter((_, j) => j !== i))}>Remove this replacement</button></fieldset>)}
            <button type="button" className="btn" onClick={() => setRoles(rows => [...rows, { id: `custom:${Date.now()}:${rows.length}`, label: 'Another story role', original: '', replacement: '' }])}>+ Add another role</button>
          </>}
          {stage === 'questions' && active && <>
            <small className="nw-kicker">Question {index + 1} of {questions.length}</small><h3>{questionText(active.prompt)}</h3>
            {active.hint && <p className="nw-help">{questionText(active.hint)}</p>}
            {!!active.choices?.length && <div className="nw-choices" aria-label="Suggested answers">{active.choices.map((choice, i) => <button type="button" key={`${i}:${choice}`} className={`btn${answers[active.key] === choice ? ' primary' : ''}`} onClick={() => setAnswer(choice)}>{choice}</button>)}</div>}
            <label className="nw-field" htmlFor="nw-answer"><span>Your answer</span><textarea id="nw-answer" aria-label="Your answer" key={active.key} autoFocus className="field-input nw-answer" value={answers[active.key] || ''} onChange={e => setAnswer(e.target.value)} placeholder="Use your own words. You can leave this blank and return later." /></label>
            <p className="nw-help">There is no fixed right answer. Describe what someone could say, do, want, or risk.</p>
          </>}
          {stage === 'review' && <>
            <h3>Review your {output === 'character' ? 'character' : 'adaptation'}</h3><p>{count} {count === 1 ? 'answer' : 'answers'} included in this version. You can return to any question to change it.</p>
            <label className="nw-field">Title<input className="field-input" value={title} onChange={e => setTitle(e.target.value)} /></label>
            <pre className="nw-preview">{preview}</pre>
            {type === 'concept' && <p className="nw-help">The adapted internal node tree is included. Answers to its questions appear on the corresponding nodes.</p>}
            <p className="nw-help">Save to game stores this {gameScope ? 'at the current level of your narrative canvas' : 'in the current game’s Narrative canvas'}. Save to library also creates a reusable copy in Story & Narrative.</p>
          </>}
          {stage === 'done' && <><h3>Saved to {result.includeLibrary ? 'game and library' : 'game'}</h3><p>{result.existing ? 'Your answers were added to the existing character.' : gameScope ? 'Your new node is at the current level of your narrative canvas.' : 'Your new node is on the game’s Narrative canvas.'}</p>{type === 'concept' && <p>Double-click the saved node to explore the adapted tree.</p>}<button className="btn primary" type="button" onClick={() => { onSaved?.(result.id); onClose(); }}>Done</button></>}
        </main>
      </div>
      {stage !== 'done' && <footer className="nw-footer"><button type="button" className="btn" onClick={() => {
        if (stage === 'source') close();
        else if (stage === 'setup') setStage('source');
        else if (stage === 'roles') setStage('setup');
        else if (stage === 'questions' && index > 0) setIndex(index - 1);
        else if (stage === 'questions') setStage(type === 'concept' ? 'roles' : 'setup');
        else { setIndex(questions.length - 1); setStage('questions'); }
      }}>{stage === 'source' ? 'Cancel' : 'Back'}</button><span>{stage === 'questions' ? 'All questions are optional' : 'Your source stays available in the library'}</span>
        {stage === 'setup' && <button type="button" className="btn primary" disabled={!title.trim()} onClick={() => type === 'concept' ? setStage('roles') : goQuestions()}>Continue</button>}
        {stage === 'roles' && <button type="button" className="btn primary" onClick={goQuestions}>Continue to questions</button>}
        {stage === 'questions' && <><button type="button" className="btn" onClick={() => setStage('review')}>Review now</button><button type="button" className="btn primary" onClick={next}>{index + 1 === questions.length ? 'Review' : answers[active?.key]?.trim() ? 'Next question' : 'Skip question'}</button></>}
        {stage === 'review' && <><button type="button" className="btn" disabled={!title.trim() || (targetId && !target)} onClick={() => save(false)}>Save to game</button><button type="button" className="btn primary" disabled={!title.trim() || (targetId && !target)} onClick={() => save(true)}>Save to library + game</button></>}
      </footer>}
    </div>
  </dialog>, document.body);
}
