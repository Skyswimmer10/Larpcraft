import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGame, useDispatch, useLibrary, useLibraryDispatch } from '../state/store.jsx';
import { locateGraph } from '../state/reducer.js';
import { genId } from '../data/csvSchemas.js';
import { visibleCanvasPlacement } from './FlowCanvas.jsx';
import { narrativeSources, frameworkQuestions, conceptQuestions, conceptRoles, substituteRoles, wizardSummary, createWizardNode, appendWizardResult, reviseWizardResult, wizardLibraryRecord } from '../lib/narrativeWizard.js';
import { questionAnswer, recordedAnswers, questionMemory, savedWizardSession, savedWizardSessions } from '../lib/narrativeMemory.js';
import { NARRATIVE_FOCUSES, narrativeGuidance, narrativeFit, defaultNarrativeFocus } from '../data/narrativeGuidance.js';
import MetaProgramsWizard, { MetaProgramsSteps, MetaProgramsSnapshot } from './MetaProgramsWizard.jsx';
import { META_PROGRAM_STEPS } from '../data/metaProgramWizard.js';
import FateWizard from './FateWizard.jsx';
import KolbWizard from './KolbWizard.jsx';
import HumanValuesWizard from './HumanValuesWizard.jsx';
import './NarrativeWizard.css';

const EMPTY_ANSWERS = Object.freeze({});
const FIT_LABELS = { best: 'Best fit', useful: 'Also useful', other: 'Another use' };
const focusNames = values => values.map(value => NARRATIVE_FOCUSES[value]?.label).filter(Boolean).join(' · ');

export function NarrativeFitDetails({ source, type = 'framework' }) {
  const guidance = narrativeGuidance(source, type);
  return <div className="nw-fit-details"><p>{guidance.reason}</p><dl><div><dt>Best for</dt><dd>{focusNames(guidance.best)}</dd></div><div><dt>Also useful for</dt><dd>{focusNames(guidance.useful)}</dd></div></dl><small>These are writing suggestions. You can choose another use.</small></div>;
}

export function NarrativeWizardButton({ source, sourceType, targetId, resumeNode, gameScope, onSaved, label = 'Story wizard', className = 'btn' }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className={className} onClick={() => setOpen(true)}>{label}</button>
    {open && <NarrativeWizard initialSource={source} initialType={sourceType} initialTargetId={targetId} resumeNode={resumeNode} gameScope={gameScope} onClose={() => setOpen(false)} onSaved={onSaved} />}
  </>;
}

export default function NarrativeWizard({ initialSource, initialType, initialTargetId, resumeNode, gameScope, onClose, onSaved }) {
  const game = useGame();
  const library = useLibrary();
  const dispatch = useDispatch();
  const libraryDispatch = useLibraryDispatch();
  const [session, setSession] = useState(() => savedWizardSession(resumeNode, library));
  const sessions = useMemo(() => savedWizardSessions(resumeNode, library), [resumeNode, library]);
  initialSource = session?.source || initialSource;
  initialType = session?.type || initialType;
  initialTargetId = session?.targetId || initialTargetId;
  const gameNodes = gameScope ? locateGraph(game, gameScope).nodes : game.nodes;
  const dialog = useRef(null);
  const main = useRef(null);
  const saved = useRef(false);
  const [chosen, setChosen] = useState(initialSource ? { source: initialSource, type: initialType || 'concept' } : null);
  const [stage, setStage] = useState(initialSource ? 'setup' : 'source');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [visibleFits, setVisibleFits] = useState({ best: true, useful: true, other: true });
  const [title, setTitle] = useState(session?.record.title || '');
  const [context, setContext] = useState(session?.record.context || '');
  const [focus, setFocus] = useState(() => session?.record.focus || defaultNarrativeFocus(initialSource, initialType, gameNodes?.[initialTargetId]));
  const [purposeFilter, setPurposeFilter] = useState(initialTargetId ? defaultNarrativeFocus(initialSource, initialType, gameNodes?.[initialTargetId]) : 'all');
  const [targetId, setTargetId] = useState(initialTargetId || '');
  const [roles, setRoles] = useState(() => session?.record.roles || (initialType === 'concept' ? conceptRoles(initialSource) : []));
  const [answerBanks, setAnswerBanks] = useState(() => session ? { [session.record.focus || defaultNarrativeFocus(initialSource, initialType)]: session.answers } : {});
  const [branchAnswers, setBranchAnswers] = useState(session?.record.branchAnswers || {});
  const [narrativeDrafts, setNarrativeDrafts] = useState(() => typeof session?.record.narrativeText === 'string' ? { [session.record.focus]: session.record.narrativeText } : {});
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState(null);
  const source = chosen?.source;
  const type = chosen?.type;
  const isMetaPrograms = type === 'framework' && source?.id === 'nlpMetaPrograms';
  const isFate = type === 'framework' && source?.id === 'fate';
  const isKolb = type === 'framework' && source?.id === 'kolbLearningCycle';
  const isValues = type === 'framework' && source?.id === 'humanValues';
  const isCharacterProse = isMetaPrograms && focus === 'character';
  const answers = answerBanks[focus] || EMPTY_ANSWERS;
  const metaAnswers = isMetaPrograms ? answers : EMPTY_ANSWERS;
  const guidance = useMemo(() => source ? narrativeGuidance(source, type) : null, [source, type]);
  const fit = guidance ? narrativeFit(guidance, focus) : null;
  const focusInfo = NARRATIVE_FOCUSES[focus];
  const sources = useMemo(() => narrativeSources(library), [library.concepts]);
  const questions = useMemo(() => !source ? [] : source.savedQuestions || (type === 'framework' ? frameworkQuestions(source, answers, focus) : conceptQuestions(source, focus)), [source, type, focus, answers.archetype, answers.otherRole, metaAnswers]);
  const count = questions.filter(row => questionAnswer(row, answers)).length;
  const draftValue = JSON.stringify({ title, context, focus, roles, answerBanks, branchAnswers, narrativeDrafts });
  const initialDraft = useRef(draftValue);
  const dirty = draftValue !== initialDraft.current;
  const resuming = !!session;
  const matchingSources = useMemo(() => sources.filter(item => (filter === 'all' || item.type === filter) && `${item.label} ${item.guidance.reason} ${item.source.description || item.source.summary || ''} ${focusNames([...item.guidance.best, ...item.guidance.useful])}`.toLowerCase().includes(query.trim().toLowerCase())), [sources, filter, query]);
  const fitCounts = useMemo(() => matchingSources.reduce((counts, item) => {
    if (purposeFilter !== 'all') counts[narrativeFit(item.guidance, purposeFilter)]++;
    return counts;
  }, { best: 0, useful: 0, other: 0 }), [matchingSources, purposeFilter]);
  const visibleSources = useMemo(() => matchingSources.filter(item => purposeFilter === 'all' || visibleFits[narrativeFit(item.guidance, purposeFilter)])
    .sort((a, b) => {
      const rank = item => purposeFilter === 'all' ? 0 : { best: 0, useful: 1, other: 2 }[narrativeFit(item.guidance, purposeFilter)];
      return rank(a) - rank(b) || a.label.localeCompare(b.label);
    }), [matchingSources, purposeFilter, visibleFits]);
  const close = () => {
    if (!saved.current && dirty && !window.confirm('Close the wizard and discard these unsaved answers?')) return;
    onClose();
  };
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const previousFocus = document.activeElement;
    element.showModal();
    return () => { element.close(); previousFocus?.focus?.(); };
  }, [isFate, isKolb, isValues]);
  useEffect(() => {
    main.current?.scrollTo(0, 0);
    main.current?.focus();
  }, [stage, index]);

  const choose = item => {
    const different = chosen?.source !== item.source;
    if (chosen && different && dirty && !window.confirm('Switch starting point? Your current answers and role replacements will be cleared.')) return;
    setChosen({ source: item.source, type: item.type });
    if (different) {
      setRoles(item.type === 'concept' ? conceptRoles(item.source) : []);
      setAnswerBanks({});
      setBranchAnswers({});
      setNarrativeDrafts({});
    }
    setIndex(0);
    setFocus(purposeFilter === 'all' ? defaultNarrativeFocus(item.source, item.type, gameNodes?.[targetId]) : purposeFilter);
    setStage('setup');
  };
  const setAnswerKey = (key, value) => {
    if (key === 'archetype' && value !== answers.archetype) {
      const keys = ['strength', 'root', 'activeShadow', 'passiveShadow', 'shadowScene', 'archetype:notes'];
      const branch = Object.fromEntries(keys.filter(key => answers[key] !== undefined).map(key => [key, answers[key]]));
      const next = { ...answers };
      for (const key of keys) delete next[key];
      Object.assign(next, branchAnswers[focus]?.[value] || {}, { archetype: value });
      if (answers.archetype) setBranchAnswers(current => ({ ...current, [focus]: { ...(current[focus] || {}), [answers.archetype]: branch } }));
      setAnswerBanks(current => ({ ...current, [focus]: next }));
    } else setAnswerBanks(current => ({ ...current, [focus]: { ...(current[focus] || {}), [key]: value } }));
  };
  const continueSession = value => {
    if (dirty && !window.confirm('Switch saved wizard and discard the unsaved changes to these answers?')) return;
    const next = sessions[Number(value)];
    const nextFocus = next.record.focus || defaultNarrativeFocus(next.source, next.type);
    const nextRoles = next.record.roles || [];
    const nextBanks = { [nextFocus]: next.answers };
    const nextBranches = next.record.branchAnswers || {};
    const nextNarratives = typeof next.record.narrativeText === 'string' ? { [nextFocus]: next.record.narrativeText } : {};
    setSession(next); setChosen({ source: next.source, type: next.type });
    setTitle(next.record.title || ''); setContext(next.record.context || '');
    setFocus(nextFocus); setRoles(nextRoles); setAnswerBanks(nextBanks); setBranchAnswers(nextBranches); setNarrativeDrafts(nextNarratives); setIndex(0);
    initialDraft.current = JSON.stringify({ title: next.record.title || '', context: next.record.context || '', focus: nextFocus, roles: nextRoles, answerBanks: nextBanks, branchAnswers: nextBranches, narrativeDrafts: nextNarratives });
  };
  const setAnswer = value => setAnswerKey(questions[index].textAnswerKey || questions[index].key, value);
  const patchAnswers = patch => setAnswerBanks(current => ({ ...current, [focus]: { ...(current[focus] || {}), ...patch } }));
  const build = id => {
    const node = createWizardNode({ source, type, title, context, roles, questions, answers, focus, id, narrativeText: narrativeDrafts[focus], position: visibleCanvasPlacement({ x: 100, y: 100 }), characterTemplate: game.meta.characterCardTemplate });
    node.narrativeWizard.branchAnswers = branchAnswers;
    return node;
  };
  const preview = stage === 'review' ? wizardSummary({ source, type, title, context, roles, questions, answers, focus, narrativeText: narrativeDrafts[focus] }) : '';
  const target = gameNodes?.[targetId];
  const possibleTargets = Object.values(gameNodes || {}).filter(node => ['character', 'concept', 'event', 'quest', 'storyLocation', 'item', 'storyStructureContainer'].includes(node.kind));
  const save = includeLibrary => {
    if (saved.current || !title.trim()) return;
    let node = build(resuming ? session.record.resultId || session.targetId : genId(gameNodes, `${game.meta.prefix}-N-`));
    if (targetId && !target) return;
    if (target) {
      node = resuming ? reviseWizardResult({ ...target, narrativeWizard: { ...session.record, answers: session.answers } }, node, source) : appendWizardResult(target, node);
      dispatch({ type: gameScope ? 'GRAPH_UPDATE_NODE' : 'UPDATE_ENTITY', ...(gameScope ? { scope: gameScope } : { coll: 'nodes' }), id: target.id, patch: { ...(resuming ? { title: node.title, name: node.name } : {}), ...(node.questions ? { questions: node.questions } : {}), body: node.body, description: node.description, narrativeWizard: node.narrativeWizard, narrativeWizardHistory: node.narrativeWizardHistory, ...(node.sub ? { sub: node.sub } : {}) } });
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
  const questionSteps = isMetaPrograms ? META_PROGRAM_STEPS.length : questions.length;
  const next = () => index + 1 < questionSteps ? setIndex(index + 1) : setStage('review');
  const active = questions[index];
  const memory = questionMemory({ source, type, questions, answers, active, roles, target });
  const allAnswers = recordedAnswers(questions, answers);
  const sourceLabel = source?.label || source?.name || source?.title;
  if (isFate) return <FateWizard key={`${session?.targetId || ''}:${session?.record.sessionId || session?.record.title || 'new'}`} session={session} sessions={sessions} onContinueSession={continueSession} initialTargetId={initialTargetId} initialPurpose={purposeFilter === 'all' ? undefined : focus} gameScope={gameScope} onClose={onClose} onSaved={onSaved} onBack={() => { setChosen(null); setSession(null); setStage('source'); }} />;
  if (isKolb) return <KolbWizard key={`kolb:${session?.targetId || ''}:${session?.record.sessionId || session?.record.title || 'new'}`} session={session} sessions={sessions} onContinueSession={continueSession} initialTargetId={initialTargetId} initialPurpose={purposeFilter === 'all' ? undefined : focus} gameScope={gameScope} onClose={onClose} onSaved={onSaved} onBack={() => { setChosen(null); setSession(null); setStage('source'); }} />;
  if (isValues) return <HumanValuesWizard key={`values:${session?.targetId || ''}:${session?.record.sessionId || session?.record.title || 'new'}`} session={session} sessions={sessions} onContinueSession={continueSession} initialTargetId={initialTargetId} initialPurpose={purposeFilter === 'all' ? undefined : focus} gameScope={gameScope} onClose={onClose} onSaved={onSaved} onBack={() => { setChosen(null); setSession(null); setStage('source'); }} />;
  return createPortal(<dialog ref={dialog} className="narrative-wizard" aria-labelledby="narrative-wizard-title" onCancel={event => { event.preventDefault(); event.stopPropagation(); close(); }} onClick={event => { event.stopPropagation(); if (event.target === event.currentTarget) close(); }}>
    <div className="nw-shell">
      <header className="nw-header"><div><small>Narrative workshop</small><h2 id="narrative-wizard-title">{stage === 'source' ? 'Choose a starting point' : sourceLabel}</h2></div><button type="button" className="btn" onClick={close}>Close</button></header>
      <div className="nw-body">
        <aside className="nw-sidebar" aria-label="Wizard steps">
          <b>Your version, step by step</b>
          <p>{isMetaPrograms && ['questions', 'review'].includes(stage) ? 'Four steps to explore choices and try them in a scene. Return to any step whenever you need.' : 'Choose what you are developing. Use a framework or concept where it helps your story.'}</p>
          {source && <div className="nw-current-focus"><small>Working on</small><b>{focusInfo.label}</b><span>{focusInfo.hint}</span></div>}
          {!!memory.selections.length && (isMetaPrograms ? <details className="nw-recorded-choices nw-meta-choices"><summary>Your recorded choices ({memory.selections.length})</summary>{memory.selections.map((selection, i) => <p key={i}><span>{selection.label}</span><b>{selection.value}</b></p>)}</details> : <div className="nw-recorded-choices"><small>Your recorded choices</small>{memory.selections.map((selection, i) => <p key={i}><span>{selection.label}</span><b>{selection.value}</b></p>)}</div>)}
          {(!isMetaPrograms || !['questions', 'review'].includes(stage)) && <ol><li className={stage === 'source' ? 'current' : ''}>Choose a useful starting point</li><li className={stage === 'setup' ? 'current' : ''}>Choose your purpose and destination</li>{type === 'concept' && <li className={stage === 'roles' ? 'current' : ''}>Adapt the roles if needed</li>}<li className={stage === 'questions' ? 'current' : ''}>Answer at your own pace</li><li className={stage === 'review' ? 'current' : ''}>Review and save</li></ol>}
          {['questions', 'review'].includes(stage) && <><small>{isMetaPrograms ? `${count} answers recorded · every choice is optional` : `${count} of ${questions.length} answered · skipping is fine`}</small>{isMetaPrograms ? <MetaProgramsSteps compact step={stage === 'review' ? -1 : index} questions={questions} answers={answers} onStepChange={step => { setIndex(step); setStage('questions'); }} /> : <nav className="nw-question-nav" aria-label="Questions">{questions.map((row, i) => <button key={row.key} type="button" className={stage === 'questions' && i === index ? 'current' : ''} onClick={() => { setIndex(i); setStage('questions'); }}><span aria-label={questionAnswer(row, answers) ? 'Answered' : 'Unanswered'}>{questionAnswer(row, answers) ? '●' : '○'}</span>{questionText(row.prompt)}</button>)}</nav>}</>}
        </aside>
        <main ref={main} className="nw-main" tabIndex={-1}>
          {stage === 'source' && <>
            <p>Develop a character, relationship, message, dilemma, encounter, story arc, discovery, or presentation. Recommendations help you choose; every reference stays available.</p>
            <label className="nw-field">I am working on<select className="field-input" aria-label="I am working on" value={purposeFilter} onChange={event => setPurposeFilter(event.target.value)}><option value="all">Browse all purposes</option>{Object.entries(NARRATIVE_FOCUSES).map(([key, info]) => <option key={key} value={key}>{info.label}</option>)}</select></label>
            <label className="nw-field">Search frameworks and concepts<input autoFocus className="field-input" type="search" value={query} onChange={e => setQuery(e.target.value)} /></label>
            <div className="nw-filters">{[['all', 'All'], ['framework', 'Frameworks'], ['concept', 'Concepts']].map(([id, label]) => <button type="button" key={id} className={`btn${filter === id ? ' primary' : ''}`} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>)}</div>
            <fieldset className="nw-fit-visibility"><legend>Show recommendations</legend>
              <div>{Object.entries(FIT_LABELS).map(([key, label]) => <label key={key} className={`nw-fit-toggle ${key}`}><input type="checkbox" aria-label={label} disabled={purposeFilter === 'all'} checked={visibleFits[key]} onChange={event => setVisibleFits(current => ({ ...current, [key]: event.target.checked }))} /><span>{label}</span>{purposeFilter !== 'all' && <small aria-hidden="true">{fitCounts[key]}</small>}</label>)}</div>
              {purposeFilter === 'all' ? <small>Choose a purpose above to show or hide references by fit.</small> : <div className="nw-fit-visibility-footer"><small role="status">{visibleSources.length} of {matchingSources.length} matching references shown</small><button type="button" className="linkbtn" onClick={() => setVisibleFits({ best: true, useful: true, other: true })}>Show all</button></div>}
            </fieldset>
            {purposeFilter !== 'all' && <p className="nw-help">Best fits appear first. Check or uncheck each group to show or hide its references for {NARRATIVE_FOCUSES[purposeFilter].label.toLowerCase()}.</p>}
            <div className="nw-source-grid">{visibleSources.map(item => <button type="button" className="nw-source" key={item.key} onClick={() => choose(item)}><small>{item.type === 'framework' ? 'Framework' : 'Concept'}{purposeFilter !== 'all' && <em className={`nw-fit ${narrativeFit(item.guidance, purposeFilter)}`}>{FIT_LABELS[narrativeFit(item.guidance, purposeFilter)]}</em>}</small><b>{item.label}</b><span>{item.guidance.reason}</span><div className="nw-source-uses"><strong>Best for</strong> {focusNames(item.guidance.best)}<br /><strong>Also useful</strong> {focusNames(item.guidance.useful)}</div></button>)}</div>
            {!visibleSources.length && <p className="nw-help">{matchingSources.length ? 'No references in the visible fit groups. Show another group above, choose Show all, or change your search.' : 'No references match this search. Try a shorter phrase or change the source filter.'}</p>}
          </>}
          {stage === 'setup' && <>
            <h3>Where will this help your story?</h3>
            {resuming && <p className="nw-help">Continuing saved work. Your choices and answers have been restored. Saving updates this wizard's notes in {target?.title}; it does not create another copy.</p>}
            {resuming && sessions.length > 1 && <label className="nw-field">Saved wizard<select className="field-input" aria-label="Saved wizard" value={sessions.findIndex(item => item.record === session.record || (item.record.sessionId && item.record.sessionId === session.record.sessionId))} onChange={event => continueSession(event.target.value)}>{sessions.map((item, i) => <option key={i} value={i}>{item.record.sourceLabel} — {item.record.title}</option>)}</select></label>}
            <NarrativeFitDetails source={source} type={type} />
            <label className="nw-field">What are you developing?<select disabled={resuming} className="field-input" aria-label="What are you developing?" value={focus} onChange={event => { setFocus(event.target.value); setIndex(0); }}>{Object.entries(NARRATIVE_FOCUSES).map(([key, info]) => <option key={key} value={key}>{info.label}{narrativeFit(guidance, key) === 'best' ? ' — Best fit' : narrativeFit(guidance, key) === 'useful' ? ' — Also useful' : ''}</option>)}</select></label>
            <p className="nw-help"><span className={`nw-fit ${fit}`}>{FIT_LABELS[fit]}</span> {focusInfo.hint} {fit === 'other' ? 'This is an exploratory use. The questions adapt the reference to your chosen situation.' : 'The questions will follow this purpose.'}</p>
            <label className="nw-field">Where should the result go?<select disabled={resuming} className="field-input" aria-label="Where should the result go?" value={targetId} onChange={event => setTargetId(event.target.value)}><option value="">Create a new {focusInfo.result.toLowerCase()}</option>{possibleTargets.map(node => <option key={node.id} value={node.id}>Add notes to: {node.title}</option>)}</select></label>
            <label className="nw-field">{target ? 'Title for these new notes' : 'Name this version'}<input className="field-input" aria-label={target ? 'Title for these new notes' : 'Name this version'} autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder={`Name this ${focusInfo.result.toLowerCase()}`} /></label>
            <label className="nw-field">Situation or background <small>Optional</small><textarea className="field-input" aria-label="Situation or background" rows={3} value={context} onChange={e => setContext(e.target.value)} placeholder="Who is involved, what is happening, or what you want to explore" /></label>
            {target && !resuming && <p className="nw-help">Notes will be added to {target.title}. Its type, existing fields, and connections stay intact. A separate plan or adapted tree is kept inside it.</p>}
            <details className="nw-reference"><summary>Read the original reference</summary><p>{source.summary || source.description || source.body}</p>{source.usage && <p>{source.usage}</p>}{source.attribution && <p>{source.attribution}</p>}</details>
          </>}
          {stage === 'roles' && <>
            <h3>Same story roles, your own entities</h3><p>Replace a literal example with what fills the same role in your version. A threat could be a dragon or a debt. What is protected could be a castle or a home.</p>
            <p className="nw-help">The copied graph keeps its layout and connections. Filled roles rename the matching nodes and wording in your copy.</p>
            {roles.map((role, i) => <fieldset className="nw-role" key={role.id}><legend>{role.label || 'Your story role'}</legend><label className="nw-field">Original word or phrase<input className="field-input" value={role.original} onChange={e => setRoles(rows => rows.map((r, j) => j === i ? { ...r, original: e.target.value } : r))} /></label><label className="nw-field">What fills this role in your version?<input className="field-input" value={role.replacement} onChange={e => setRoles(rows => rows.map((r, j) => j === i ? { ...r, replacement: e.target.value } : r))} placeholder="Person, place, object, or idea" /></label><small>{role.hint}</small><button type="button" className="linkbtn" onClick={() => setRoles(rows => rows.filter((_, j) => j !== i))}>Remove this replacement</button></fieldset>)}
            <button type="button" className="btn" onClick={() => setRoles(rows => [...rows, { id: `custom:${Date.now()}:${rows.length}`, label: 'Another story role', original: '', replacement: '' }])}>+ Add another role</button>
          </>}
          {stage === 'questions' && isMetaPrograms && <MetaProgramsWizard step={index} questions={questions} answers={answers} onPatch={patchAnswers} onStepChange={setIndex} title={title} context={context} memory={memory} />}
          {stage === 'questions' && !isMetaPrograms && active && <>
            <small className="nw-kicker">{focusInfo.label} · Question {index + 1} of {questions.length}</small><h3>{questionText(active.prompt)}</h3>
            {memory.guidance && <p className="nw-guidance"><b>Build on what you have recorded</b>{questionText(memory.guidance)}</p>}
            {!!memory.earlier.length && <details className="nw-answer-memory"><summary>Earlier answers used here ({memory.earlier.length})</summary>{memory.earlier.map(row => <div key={row.key}><b>{questionText(row.prompt)}</b><p>{row.answer}</p><button type="button" className="linkbtn" onClick={() => setIndex(questions.findIndex(question => question.key === row.key))}>Edit this answer</button></div>)}</details>}
            {!!memory.prior.length && <details className="nw-answer-memory"><summary>Already recorded for {target?.title}</summary>{memory.prior.map((record, i) => <div key={i}><b>{record.label}{record.archetype ? ` · ${record.archetype.key}` : ''}</b>{record.archetype && <p>{record.archetype.descriptions.adult}</p>}{record.answers.map(row => <p key={row.key}><strong>{row.prompt}</strong><br />{row.answer}</p>)}</div>)}</details>}
            {active.hint && <p className="nw-help">{questionText(active.hint)}</p>}
            {!!active.choices?.length && <div className="nw-choices" aria-label="Suggested answers">{active.choices.map((choice, i) => <button type="button" key={`${i}:${choice}`} aria-pressed={answers[active.choiceAnswerKey || active.key] === choice} className={`btn${answers[active.choiceAnswerKey || active.key] === choice ? ' primary' : ''}`} onClick={() => setAnswerKey(active.choiceAnswerKey || active.key, choice)}>{choice}</button>)}{active.choiceAnswerKey && answers[active.choiceAnswerKey] && <button type="button" className="linkbtn" onClick={() => setAnswerKey(active.choiceAnswerKey, '')}>Clear choice</button>}</div>}
            {active.key === 'archetype' && <p className="nw-help">Follow-up questions use the archetype you choose. If you try another, its strength and shadow answers stay separate; switching back restores them.</p>}
            <label className="nw-field" htmlFor="nw-answer"><span>{active.textAnswerKey ? 'Your notes about this choice' : 'Your answer'}</span><textarea id="nw-answer" aria-label="Your answer" key={active.key} autoFocus className="field-input nw-answer" value={answers[active.textAnswerKey || active.key] || ''} onChange={e => setAnswer(e.target.value)} placeholder="Use your own words. You can leave this blank and return later." /></label>
            {!!allAnswers.length && <details className="nw-answer-memory"><summary>Your recorded answers ({allAnswers.length})</summary>{allAnswers.map(row => <div key={row.key}><b>{questionText(row.prompt)}</b><p>{row.answer}</p></div>)}</details>}
            <p className="nw-help">There is no fixed right answer. Describe what someone could say, do, want, or risk.</p>
          </>}
          {stage === 'review' && <>
            <h3>Review your {focusInfo.result.toLowerCase()}</h3><p>{count} {count === 1 ? 'answer' : 'answers'} included in this version. You can return to any question to change it.</p>
            <label className="nw-field">Title<input className="field-input" value={title} onChange={e => setTitle(e.target.value)} /></label>
            {isCharacterProse ? <>
              <label className="nw-field">Character description<textarea className="field-input nw-story-description" aria-label="Character description" rows={12} value={preview} placeholder="Answer a few questions to build a character description, or write your own paragraph here." onChange={event => setNarrativeDrafts(current => ({ ...current, [focus]: event.target.value }))} /></label>
              <p className="nw-help">This paragraph becomes the character’s description. You can rewrite it freely. Your choices and notes stay available in the wizard.</p>
              {narrativeDrafts[focus] !== undefined && <><p className="nw-help">You have edited this paragraph. Changes to answers will keep your wording until you rebuild it.</p><button type="button" className="btn" onClick={() => { if (window.confirm('Replace your edited paragraph with a new description from the current answers?')) setNarrativeDrafts(current => { const next = { ...current }; delete next[focus]; return next; }); }}>Rebuild from answers</button></>}
              <details className="nw-answer-memory"><summary>View choices and answers ({count})</summary><MetaProgramsSnapshot questions={questions} answers={answers} />{allAnswers.map(row => <div key={row.key}><b>{questionText(row.prompt)}</b><p>{row.answer}</p></div>)}</details>
            </> : <>{isMetaPrograms && <MetaProgramsSnapshot questions={questions} answers={answers} />}<pre className="nw-preview">{preview}</pre></>}
            {type === 'concept' && <p className="nw-help">The adapted internal node tree is included. Answers to its questions appear on the corresponding nodes.</p>}
            {type === 'framework' && focus !== 'character' && <p className="nw-help">This saves as an editable plan with the reference and your answered questions inside. It does not create a character.</p>}
            {Object.entries(answerBanks).some(([key, bank]) => key !== focus && Object.values(bank).some(answer => answer.trim())) && <p className="nw-help">Only the {focusInfo.label.toLowerCase()} answers shown here will be saved. Your other purpose drafts stay available while this wizard is open.</p>}
            <p className="nw-help">Save to game stores this {gameScope ? 'at the current level of your narrative canvas' : 'in the current game’s Narrative canvas'}. Save to library also creates a reusable copy in Story & Narrative.</p>
          </>}
          {stage === 'done' && <><h3>Saved to {result.includeLibrary ? 'game and library' : 'game'}</h3><p>{result.existing ? 'Your notes were added to the selected node.' : gameScope ? 'Your new node is at the current level of your narrative canvas.' : 'Your new node is on the game’s Narrative canvas.'}</p>{(type === 'concept' || focus !== 'character') && <p>Double-click the saved node to explore its notes or adapted tree.</p>}<button className="btn primary" type="button" onClick={() => { onSaved?.(result.id); onClose(); }}>Done</button></>}
        </main>
      </div>
      {stage !== 'done' && <footer className="nw-footer"><button type="button" className="btn" onClick={() => {
        if (stage === 'source') close();
        else if (stage === 'setup') resuming ? close() : setStage('source');
        else if (stage === 'roles') setStage('setup');
        else if (stage === 'questions' && index > 0) setIndex(index - 1);
        else if (stage === 'questions') setStage(type === 'concept' ? 'roles' : 'setup');
        else { setIndex(questionSteps - 1); setStage('questions'); }
      }}>{stage === 'source' ? 'Cancel' : 'Back'}</button><span>{stage === 'questions' ? 'All questions are optional' : 'Your source stays available in the library'}</span>
        {stage === 'setup' && <button type="button" className="btn primary" disabled={!title.trim()} onClick={() => type === 'concept' ? setStage('roles') : goQuestions()}>Continue</button>}
        {stage === 'roles' && <button type="button" className="btn primary" onClick={goQuestions}>Continue to questions</button>}
        {stage === 'questions' && <><button type="button" className="btn" onClick={() => setStage('review')}>Review now</button><button type="button" className="btn primary" onClick={next}>{index + 1 === questionSteps ? 'Review' : isMetaPrograms ? 'Next step' : questionAnswer(active || {}, answers) ? 'Next question' : 'Skip question'}</button></>}
        {stage === 'review' && <><button type="button" className="btn" disabled={!title.trim() || (targetId && !target)} onClick={() => save(false)}>Save to game</button><button type="button" className="btn primary" disabled={!title.trim() || (targetId && !target)} onClick={() => save(true)}>Save to library + game</button></>}
      </footer>}
    </div>
  </dialog>, document.body);
}
