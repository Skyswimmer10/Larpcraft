import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
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
import { PrimIcon } from './bits.jsx';
import NarrativeSourceCard from './NarrativeSourceCard.jsx';
import GroupWizard from './GroupWizard.jsx';
import { GROUP_FOUNDATIONS_ID } from '../lib/groupFoundations.js';
import DragonWorkshop from './DragonWorkshop.jsx';
import NarrativeSetup from './NarrativeSetup.jsx';
import { StoryPlanningButton } from './StoryPlanning.jsx';
import NarrativeReferenceInfo from './NarrativeReferenceInfo.jsx';
import { storyWizardSources, storyToolInsertion } from '../lib/storyTools.js';
import { isDragonConcept, dragonAnswers, dragonQuestions, dragonKey } from '../lib/dragonWorkshop.js';
import './NarrativeWizard.css';
import ArchetypeWorkshop from './ArchetypeWorkshop.jsx';
import { storyArchetype } from '../data/storyArchetypes.js';
import { archetypeConceptQuestions } from '../lib/archetypeConcept.js';
import KwmlWizard from './KwmlWizard.jsx';
import { KWML_ID } from '../data/kwml.js';
import { kwmlInitialAnswers, kwmlQuestionRows } from '../lib/kwmlWizard.js';

const EMPTY_ANSWERS = Object.freeze({});
const FrameworkDetail = lazy(() => import('./FrameworkDetail.jsx'));
const FIT_LABELS = { best: 'Best fit', useful: 'Also useful', other: 'Another use' };
const PURPOSE_STYLES = {
  all: { icon: 'layers', color: '#b8c2d9' },
  character: { icon: 'user', color: '#f0a1c2' },
  relationship: { icon: 'users', color: '#f2b788' },
  communication: { icon: 'swap', color: '#88c9f4' },
  values: { icon: 'heart', color: '#e7ce7e' },
  scene: { icon: 'pin', color: '#9bd49a' },
  story: { icon: 'branches', color: '#bca4f4' },
  learning: { icon: 'book', color: '#7cd8cb' },
  style: { icon: 'star', color: '#e6aaa0' },
};
const focusNames = values => values.map(value => NARRATIVE_FOCUSES[value]?.label).filter(Boolean).join(' · ');

export function NarrativeFitDetails({ source, type = 'framework' }) {
  const guidance = narrativeGuidance(source, type);
  return <div className="nw-fit-details"><p>{guidance.reason}</p><dl><div><dt>Best for</dt><dd>{focusNames(guidance.best)}</dd></div><div><dt>Also useful for</dt><dd>{focusNames(guidance.useful)}</dd></div></dl><small>These are writing suggestions. You can choose another use.</small></div>;
}

export function NarrativeWizardButton({ source, sourceType, targetId, resumeNode, resumeRecord, gameScope, onSaved, onInsert, onInserted, includeSubnodes, label = 'Story wizard', className = 'btn', ariaLabel }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className={className} aria-label={ariaLabel} title={ariaLabel} onClick={() => setOpen(true)}>{label}</button>
    {open && <NarrativeWizard initialSource={source} initialType={sourceType} initialTargetId={targetId} resumeNode={resumeNode} resumeRecord={resumeRecord} gameScope={gameScope} onInsert={onInsert} onInserted={onInserted} includeSubnodes={includeSubnodes} onClose={() => setOpen(false)} onSaved={onSaved} />}
  </>;
}

export default function NarrativeWizard({ initialSource, initialType, initialTargetId, resumeNode, resumeRecord, gameScope, onClose, onSaved, onInsert, onInserted, includeSubnodes = !gameScope }) {
  const game = useGame();
  const library = useLibrary();
  const dispatch = useDispatch();
  const libraryDispatch = useLibraryDispatch();
  const [session, setSession] = useState(() => savedWizardSession(resumeNode, library, resumeRecord || resumeNode?.narrativeWizard));
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [informationSource, setInformationSource] = useState(null);
  const searchButton = useRef(null);
  const [filter, setFilter] = useState('all');
  const [visibleFits, setVisibleFits] = useState({ best: true, useful: true, other: true });
  const [title, setTitle] = useState(session?.record.title || '');
  const [context, setContext] = useState(session?.record.context || '');
  const [focus, setFocus] = useState(() => session?.record.focus || defaultNarrativeFocus(initialSource, initialType, gameNodes?.[initialTargetId]));
  const [purposeFilter, setPurposeFilter] = useState(initialTargetId ? defaultNarrativeFocus(initialSource, initialType, gameNodes?.[initialTargetId]) : 'all');
  const [targetId, setTargetId] = useState(initialTargetId || '');
  const [roles, setRoles] = useState(() => session?.record.roles || (initialType === 'concept' ? conceptRoles(initialSource) : []));
  const [answerBanks, setAnswerBanks] = useState(() => session ? { [session.record.focus || defaultNarrativeFocus(initialSource, initialType)]: session.record.sourceId === KWML_ID && session.record.focus === 'character' ? kwmlInitialAnswers(session.answers) : session.answers } : {});
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
  const isGroupFoundations = source?.id === GROUP_FOUNDATIONS_ID;
  const isDragon = type === 'concept' && isDragonConcept(source);
  const isArchetype = type === 'concept' && focus === 'character' && !!storyArchetype(source);
  const isKwml = type === 'framework' && source?.id === KWML_ID && focus === 'character';
  const isCharacterProse = isMetaPrograms && focus === 'character';
  const rawAnswers = answerBanks[focus] || EMPTY_ANSWERS;
  const answers = isDragon ? dragonAnswers(source, rawAnswers, roles, session?.record.questions) : isKwml ? kwmlInitialAnswers(rawAnswers) : rawAnswers;
  const metaAnswers = isMetaPrograms ? answers : EMPTY_ANSWERS;
  const kwmlAnswers = isKwml ? rawAnswers : EMPTY_ANSWERS;
  const guidance = useMemo(() => source ? narrativeGuidance(source, type) : null, [source, type]);
  const focusInfo = NARRATIVE_FOCUSES[focus];
  const fullCatalogue = !initialSource && !initialTargetId && !resumeNode;
  const sources = useMemo(() => fullCatalogue ? storyWizardSources(library, { includeSubnodes }) : narrativeSources(library), [library, fullCatalogue, includeSubnodes]);
  const questions = useMemo(() => !source ? [] : isKwml ? kwmlQuestionRows(answers, session?.record.questions) : isDragon ? dragonQuestions(source, session?.record.questions) : isArchetype ? archetypeConceptQuestions(source, conceptQuestions(source, focus), session?.record.questions) : source.savedQuestions || (type === 'framework' ? frameworkQuestions(source, answers, focus) : conceptQuestions(source, focus)), [source, type, focus, answers.archetype, answers.otherRole, metaAnswers, kwmlAnswers, isKwml, isDragon, isArchetype, session?.record.questions]);
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
  }, [isFate, isKolb, isValues, isGroupFoundations, isDragon, isArchetype, isKwml]);
  useEffect(() => {
    main.current?.scrollTo(0, 0);
    main.current?.focus();
  }, [stage, index]);

  const choose = item => {
    if (item.canWizard === false) return;
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
    setFocus(item.type === 'concept' && storyArchetype(item.source) ? 'character' : purposeFilter === 'all' ? defaultNarrativeFocus(item.source, item.type, gameNodes?.[targetId]) : purposeFilter);
    setStage('setup');
  };
  const insertSource = item => {
    if (dirty && !window.confirm('Add this reference directly and discard the unsaved wizard answers?')) return;
    if (onInsert) onInsert(item.payload);
    else {
      const insertion = storyToolInsertion(library, item.payload, game, gameScope, visibleCanvasPlacement({ x: 110, y: 100 }), gameNodes);
      if (!insertion) return;
      dispatch(insertion.action);
      onInserted?.(insertion.selection);
      if (!onInserted && insertion.selection.kind === 'node') onSaved?.(insertion.selection.id);
    }
    onClose();
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
    const nextBanks = { [nextFocus]: next.record.sourceId === KWML_ID && nextFocus === 'character' ? kwmlInitialAnswers(next.answers) : next.answers };
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
    const actualRoles = isDragon ? roles.map(role => ['city', 'dragon'].includes(role.id) ? { ...role, replacement: answers[dragonKey(role.id)] || '' } : role) : roles;
    const node = createWizardNode({ source, type, title, context, roles: actualRoles, questions, answers, focus, id, narrativeText: narrativeDrafts[focus], position: visibleCanvasPlacement({ x: 100, y: 100 }), characterTemplate: game.meta.characterCardTemplate });
    node.narrativeWizard.branchAnswers = branchAnswers;
    if (session?.record.sessionId) node.narrativeWizard.sessionId = session.record.sessionId;
    return node;
  };
  const preview = stage === 'review' || isArchetype || isKwml ? wizardSummary({ source, type, title, context, roles, questions, answers, focus, narrativeText: narrativeDrafts[focus] }) : '';
  const target = gameNodes?.[targetId];
  const possibleTargets = Object.values(gameNodes || {}).filter(node => ['character', 'group', 'concept', 'storyBeat', 'event', 'quest', 'storyLocation', 'item', 'storyStructureContainer'].includes(node.kind));
  const save = includeLibrary => {
    if (saved.current || !title.trim()) return;
    let node = build(resuming ? session.record.resultId || session.targetId : genId(gameNodes, `${game.meta.prefix}-N-`));
    if (targetId && !target) return;
    if (target) {
      node = resuming ? reviseWizardResult({ ...target, narrativeWizard: { ...session.record, answers: session.answers } }, node, source) : appendWizardResult(target, node);
      dispatch({ type: gameScope ? 'GRAPH_UPDATE_NODE' : 'UPDATE_ENTITY', ...(gameScope ? { scope: gameScope } : { coll: 'nodes' }), id: target.id, patch: { ...(resuming ? { title: node.title, name: node.name } : {}), ...(node.questions ? { questions: node.questions } : {}), body: node.body, description: node.description, ...(node.characterProfile ? { characterProfile: node.characterProfile } : {}), ...(node.characterCanvas ? { characterCanvas: node.characterCanvas } : {}), narrativeWizard: node.narrativeWizard, narrativeWizardHistory: node.narrativeWizardHistory, ...(node.sub ? { sub: node.sub } : {}) } });
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
  if (isKwml) return <KwmlWizard key={`kwml:${session?.record.sessionId || 'new'}`} answers={answers} onPatch={patchAnswers} title={title} onTitle={setTitle} context={context} onContext={setContext}
    preview={preview} previousQuestions={session?.record.questions} narrativeEdited={narrativeDrafts[focus] !== undefined}
    onNarrativeChange={value => setNarrativeDrafts(current => ({ ...current, [focus]: value }))}
    onRebuild={() => { if (window.confirm('Replace your edited profile with the current choices?')) setNarrativeDrafts(current => { const next = { ...current }; delete next[focus]; return next; }); }}
    target={target} targetId={targetId} onTargetChange={setTargetId} possibleTargets={possibleTargets} resuming={resuming} onClose={close}
    onBack={() => { if (dirty && !window.confirm('Return to the catalogue and discard this unsaved draft?')) return; setChosen(null); setSession(null); setStage('source'); }}
    onReset={() => { setAnswerBanks(current => ({ ...current, [focus]: {} })); setBranchAnswers(current => ({ ...current, [focus]: {} })); setNarrativeDrafts(current => { const next = { ...current }; delete next[focus]; return next; }); setContext(''); if (!resuming) setTitle(''); }}
    onSave={save} result={result} onDone={() => { onSaved?.(result.id); onClose(); }} />;
  if (isArchetype) return <ArchetypeWorkshop source={source} questions={questions} answers={answers} onPatch={patchAnswers}
    title={title} onTitle={setTitle} context={context} onContext={setContext} preview={preview}
    onNarrativeChange={value => setNarrativeDrafts(current => ({ ...current, [focus]: value }))} narrativeEdited={narrativeDrafts[focus] !== undefined}
    onRebuild={() => { if (window.confirm('Replace your edited description with the current answers?')) setNarrativeDrafts(current => { const next = { ...current }; delete next[focus]; return next; }); }}
    target={target} targetId={targetId} onTargetChange={setTargetId} possibleTargets={possibleTargets} resuming={resuming}
    onClose={close} onBack={() => { if (dirty && !window.confirm('Return to the catalogue and discard these unsaved answers?')) return; setChosen(null); setSession(null); setStage('source'); }}
    onSave={save} result={result} onDone={() => { onSaved?.(result.id); onClose(); }} />;
  if (isDragon) return <DragonWorkshop key={`dragon:${session?.targetId || initialTargetId || 'new'}:${session?.record.sessionId || 'new'}`}
    source={source} answers={answers} questions={questions} roles={roles} onAnswer={setAnswerKey} title={title} onTitle={setTitle}
    focus={focus} onFocusChange={next => { setAnswerBanks(current => ({ ...current, [next]: answers })); setFocus(next); }} targetId={targetId} targetTitle={target?.title} possibleTargets={possibleTargets} onTargetChange={setTargetId} resuming={resuming}
    onClose={close} onBack={() => { if (dirty && !window.confirm('Return to the catalogue and discard these unsaved answers?')) return; setChosen(null); setSession(null); setStage('source'); }}
    onSave={save} result={result} onDone={() => { onSaved?.(result.id); onClose(); }} />;
  if (isGroupFoundations) return <GroupWizard key={`group:${session?.targetId || initialTargetId || 'new'}:${session?.record.sessionId || 'new'}`}
    targetId={gameNodes?.[initialTargetId]?.kind === 'group' ? initialTargetId : ''} scope={gameScope || { coll: 'nodes' }} record={session?.record}
    onClose={onClose} onSaved={onSaved} onBack={() => { setChosen(null); setSession(null); setStage('source'); }} />;
  if (isFate) return <FateWizard key={`${session?.targetId || ''}:${session?.record.sessionId || session?.record.title || 'new'}`} session={session} sessions={sessions} onContinueSession={continueSession} initialTargetId={initialTargetId} initialPurpose={purposeFilter === 'all' ? undefined : focus} gameScope={gameScope} onClose={onClose} onSaved={onSaved} onBack={() => { setChosen(null); setSession(null); setStage('source'); }} />;
  if (isKolb) return <KolbWizard key={`kolb:${session?.targetId || ''}:${session?.record.sessionId || session?.record.title || 'new'}`} session={session} sessions={sessions} onContinueSession={continueSession} initialTargetId={initialTargetId} initialPurpose={purposeFilter === 'all' ? undefined : focus} gameScope={gameScope} onClose={onClose} onSaved={onSaved} onBack={() => { setChosen(null); setSession(null); setStage('source'); }} />;
  if (isValues) return <HumanValuesWizard key={`values:${session?.targetId || ''}:${session?.record.sessionId || session?.record.title || 'new'}`} session={session} sessions={sessions} onContinueSession={continueSession} initialTargetId={initialTargetId} initialPurpose={purposeFilter === 'all' ? undefined : focus} gameScope={gameScope} onClose={onClose} onSaved={onSaved} onBack={() => { setChosen(null); setSession(null); setStage('source'); }} />;
  return createPortal(<><dialog ref={dialog} className="narrative-wizard nw-fullscreen" aria-labelledby="narrative-wizard-title" onCancel={event => { event.preventDefault(); event.stopPropagation(); close(); }} onClick={event => { event.stopPropagation(); if (event.target === event.currentTarget) close(); }}>
    <div className="nw-shell">
      <header className="nw-header"><div><small>Story wizard</small><h2 id="narrative-wizard-title">{stage === 'source' ? 'Choose a starting point' : sourceLabel}</h2></div><div className="right">{stage === 'source' && !initialTargetId && <StoryPlanningButton label="Plot structure" initialTab="plot" />}<button type="button" className="btn" onClick={close}>Close</button></div></header>
      <div className="nw-body">
        <main ref={main} className="nw-main" tabIndex={-1}>
          {['questions', 'review'].includes(stage) && (!isMetaPrograms || stage === 'review') && <details className="nw-answer-memory"><summary>{isMetaPrograms ? 'Return to a step' : 'Jump to a question'} · {count} answers recorded</summary>{isMetaPrograms ? <MetaProgramsSteps step={-1} questions={questions} answers={answers} onStepChange={step => { setIndex(step); setStage('questions'); }} /> : <nav className="nw-question-nav" aria-label="Questions">{questions.map((row, i) => <button key={row.key} type="button" className={stage === 'questions' && i === index ? 'current' : ''} aria-current={stage === 'questions' && i === index ? 'step' : undefined} onClick={() => { setIndex(i); setStage('questions'); }}><span aria-label={questionAnswer(row, answers) ? 'Answered' : 'Unanswered'}>{questionAnswer(row, answers) ? '●' : '○'}</span>{questionText(row.prompt)}</button>)}</nav>}{!!memory.selections.length && <div className="nw-recorded-choices">{memory.selections.map((selection, i) => <p key={i}><span>{selection.label}</span><b>{selection.value}</b></p>)}</div>}</details>}
          {stage === 'source' && <>
            <fieldset className="nw-purpose-picker"><legend>I am working on</legend><div>{[['all', 'Browse all purposes'], ...Object.entries(NARRATIVE_FOCUSES).map(([key, info]) => [key, info.label])].map(([key, label]) => <button type="button" className="nw-purpose" key={key} style={{ '--nw-purpose-color': PURPOSE_STYLES[key].color }} aria-pressed={purposeFilter === key} onClick={() => setPurposeFilter(key)}><PrimIcon icon={PURPOSE_STYLES[key].icon} size={20} /><span>{label}</span></button>)}</div></fieldset>
            <div className="nw-source-toolbar">
              <div className="nw-filters" role="group" aria-label="Source type">{[['all', 'All'], ['framework', 'Frameworks'], ['concept', 'Concepts'], ...(fullCatalogue ? [['structure', 'Story structures'], ...(includeSubnodes ? [['template', 'Supporting templates']] : [])] : [])].map(([id, label]) => <button type="button" key={id} className={`btn nw-filter-${id}`} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>)}</div>
              <div className="nw-search"><button ref={searchButton} type="button" className="btn nw-search-button" aria-label={searchOpen ? 'Close search' : 'Search frameworks and concepts'} title={searchOpen ? 'Close search' : 'Search frameworks and concepts'} aria-expanded={searchOpen} aria-controls="nw-source-search" onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setQuery(''); }}><PrimIcon icon="search" size={19} /></button>{searchOpen && <input id="nw-source-search" autoFocus className="field-input" type="search" aria-label="Search frameworks and concepts" placeholder="Search frameworks and concepts…" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setQuery(''); setSearchOpen(false); searchButton.current?.focus(); } }} />}</div>
            </div>
            <div className="nw-fit-visibility" role="group" aria-label="Recommendation fit">{Object.entries(FIT_LABELS).map(([key, label]) => <label key={key} className={`nw-fit-toggle ${key}`}><input type="checkbox" aria-label={label} disabled={purposeFilter === 'all'} checked={visibleFits[key]} onChange={event => setVisibleFits(current => ({ ...current, [key]: event.target.checked }))} /><span>{label}</span>{purposeFilter !== 'all' && <small aria-hidden="true">{fitCounts[key]}</small>}</label>)}</div>
            <div className="nw-source-grid">{visibleSources.map(item => <NarrativeSourceCard key={item.key} item={item} fit={purposeFilter === 'all' ? null : narrativeFit(item.guidance, purposeFilter)} fitLabel={FIT_LABELS[narrativeFit(item.guidance, purposeFilter)]} onChoose={choose} onInsert={fullCatalogue ? insertSource : undefined} onInformation={() => setInformationSource(item)} />)}</div>
            {!visibleSources.length && <p className="nw-help">{matchingSources.length ? 'No references in the selected fit groups. Select another group or change your search.' : 'No references match this search. Try a shorter phrase or change the source filter.'}</p>}
          </>}
          {stage === 'setup' && <NarrativeSetup source={source} title={title} onTitle={setTitle} focus={focus} onFocus={nextFocus => { setFocus(nextFocus); setIndex(0); }}
            purposeStyles={PURPOSE_STYLES} guidance={guidance} context={context} onContext={setContext} target={target} targetId={targetId} resuming={resuming}
            savedVersions={resuming && sessions.length > 1 && <details className="nw-setup-reference"><summary>Other saved versions</summary><label className="nw-field">Saved wizard<select className="field-input" aria-label="Saved wizard" value={sessions.findIndex(item => item.record === session.record || (item.record.sessionId && item.record.sessionId === session.record.sessionId))} onChange={event => continueSession(event.target.value)}>{sessions.map((item, i) => <option key={i} value={i}>{item.record.sourceLabel} — {item.record.title}</option>)}</select></label></details>}>
            <NarrativeFitDetails source={source} type={type} />
          </NarrativeSetup>}
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
  </dialog>
    {informationSource && (informationSource.type === 'framework' ? <Suspense fallback={null}><FrameworkDetail framework={informationSource.source} showUseButton={false} onClose={() => setInformationSource(null)} /></Suspense> : <NarrativeReferenceInfo item={informationSource} library={library} onClose={() => setInformationSource(null)} />)}
  </>, document.body);
}
