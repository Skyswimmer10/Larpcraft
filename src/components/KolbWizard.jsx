import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGame, useDispatch, useLibrary, useLibraryDispatch } from '../state/store.jsx';
import { locateGraph } from '../state/reducer.js';
import { FRAMEWORK_TYPES } from '../data/seed.js';
import { genId } from '../data/csvSchemas.js';
import { NARRATIVE_FOCUSES } from '../data/narrativeGuidance.js';
import { FATE_TONES } from '../data/fateWizard.js';
import { KOLB_COPY as C, KOLB_MODES, KOLB_FIELDS, KOLB_LABELS, KOLB_BRANCHES, KOLB_FORMATS, KOLB_LENGTHS, KOLB_TARGETS, KOLB_SPACE } from '../data/kolbWizard.js';
import { createKolbDraft, editKolb, kolbMode, kolbOrder, kolbFieldLabel, kolbEvidence, addKolbObservation, kolbSuggestions, acceptKolbSuggestion, keepKolb, addKolbTurn, kolbChange, kolbProgress, kolbChecks, kolbBanner, summarizeKolb, fateImportValue, importKolbFate, refreshKolbImports, kolbQuestions, kolbAnswers, kolbOutput } from '../lib/kolbWizard.js';
import { copyDraft, getPath, wizardScopeKey, wizardEntities, savedWizardModels, wizardSessionRecord, rememberWizardOption } from '../lib/storyWizardCore.js';
import { createWizardNode, appendWizardResult, reviseWizardResult, wizardLibraryRecord } from '../lib/narrativeWizard.js';
import { savedWizardSession } from '../lib/narrativeMemory.js';
import { visibleCanvasPlacement } from './FlowCanvas.jsx';
import { WizardField, WizardChoices } from './StoryWizardControls.jsx';
import { KolbCycleWheel, KolbObservationLinks, KolbBranchBuilder, KolbStyleGrid } from './KolbWizardControls.jsx';
import { useStoryWizardDraft } from './useStoryWizardDraft.js';
import './FateWizard.css';
import './KolbWizard.css';

const EMPTY = Object.freeze({});
const textField = (label, value, onChange, rows = 3) => <label className="nw-field">{label}<textarea aria-label={label} className="field-input" rows={rows} value={value || ''} onChange={event => onChange(event.target.value)} /></label>;
const selectField = (label, value, options, onChange) => <label className="nw-field">{label}<select aria-label={label} className="field-input" value={value ?? ''} onChange={event => onChange(event.target.value)}>{!options.some(option => typeof option === 'object' && option.value === '') && <option value="">{C.unset}</option>}{options.map(option => <option key={typeof option === 'string' ? option : option.value} value={typeof option === 'string' ? option : option.value}>{typeof option === 'string' ? option : option.label}</option>)}</select></label>;
const display = value => Array.isArray(value) ? value.map(item => typeof item === 'object' ? item.text || '' : item).join(', ') : value === null || value === undefined || value === '' ? C.unset : String(value);

function initialKolb(game, props) {
  const targetId = props.session?.targetId || props.initialTargetId || '';
  const existing = Object.values(game.kolbWizardDrafts || {}).filter(draft => draft.workspace?.scopeKey === wizardScopeKey(props.gameScope) && (draft.workspace?.targetId || '') === targetId && (!props.session || draft.workspace?.sessionId === props.session.record.sessionId)).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
  if (existing?.schemaVersion > 1) throw new Error('This Kolb draft was made by a newer version of Larpcraft. Update the app before editing it.');
  return existing ? copyDraft(existing) : createKolbDraft({ record: props.session?.record, answers: props.session?.answers, purpose: props.session?.record.focus || props.initialPurpose || game.kolbWizardPreferences?.lastPurpose || 'learning', preferences: game.kolbWizardPreferences || {}, targetId, scope: props.gameScope });
}
export default function KolbWizard(props) {
  const game = useGame();
  const [initial] = useState(() => { try { return { draft: initialKolb(game, props) }; } catch (error) { return { error: error.message }; } });
  return initial.error ? <KolbUnavailable error={initial.error} onClose={props.onClose} /> : <KolbEditor {...props} initial={initial.draft} />;
}
function KolbUnavailable({ error, onClose }) {
  const ref = useRef(null);
  useEffect(() => { const element = ref.current; element.showModal(); return () => element.close(); }, []);
  return createPortal(<dialog ref={ref} className="narrative-wizard" onCancel={event => { event.preventDefault(); onClose(); }}><div className="nw-main"><p>{error}</p><button type="button" className="btn" onClick={onClose}>{C.close}</button></div></dialog>, document.body);
}
function KolbEditor({ initial, session, sessions = [], onContinueSession, onClose, onBack, onSaved }) {
  const game = useGame(), library = useLibrary(), dispatch = useDispatch(), libraryDispatch = useLibraryDispatch();
  const editor = useStoryWizardDraft(initial, dispatch, 'SAVE_KOLB_DRAFT');
  const { draft, transition } = editor;
  const [finished, setFinished] = useState(null), [fateKey, setFateKey] = useState(''), [draftKey, setDraftKey] = useState(''), [modelKey, setModelKey] = useState('');
  const dialog = useRef(null), main = useRef(null), busy = useRef(false);
  const index = Math.min(draft.lastStep.turn, draft.turns.length - 1), turn = draft.turns[index];
  const mode = kolbMode(draft.lastStep.step), advanced = draft.meta.depth === 'advanced', order = kolbOrder(draft.meta.entry);
  const preferences = game.kolbWizardPreferences || EMPTY;
  const entities = useMemo(() => wizardEntities(game), [game.nodes, game.masterNodes, game.locations, game.items, game.teams, game.players]);
  const models = useMemo(() => savedWizardModels(game, 'kolbLearningCycle'), [game.nodes, game.masterNodes]);
  const fateModels = useMemo(() => savedWizardModels(game, 'fate'), [game.nodes, game.masterNodes]);
  const scope = draft.workspace.scope || { coll: 'nodes' }, graph = locateGraph(game, scope), target = graph.nodes[draft.workspace.targetId];
  const record = wizardSessionRecord(target, draft.workspace, 'kolbLearningCycle');
  const locked = mode && draft.locks[`${index}:${mode.key}`], output = kolbOutput(draft), checks = kolbChecks(draft);
  const stale = Object.entries(draft.fieldMeta).filter(([, meta]) => meta.stale);
  const prior = [...new Map([...(target?.narrativeWizardHistory || []), ...(target?.narrativeWizard ? [target.narrativeWizard] : [])].filter(record => record.sourceId !== 'kolbLearningCycle').map(record => [record.sessionId || record.sourceId, record])).values()];
  const edit = (path, value) => {
    if (path === 'meta.purpose' && (!value || record)) return;
    transition(current => editKolb(current, path, value), typeof value === 'string' ? path : null);
    const preference = { 'meta.depth': 'lastDepth', 'meta.purpose': 'lastPurpose', 'meta.entry': 'lastEntry', 'output.format': 'lastOutputFormat' }[path];
    if (preference) dispatch({ type: 'SET_KOLB_PREFERENCES', preferences: { ...preferences, [preference]: value } });
  };
  const go = (cycle, step) => edit('lastStep', { turn: cycle, step });
  const next = () => draft.lastStep.step === 'setup' ? go(index, order[0].key) : mode ? go(index, order[order.findIndex(item => item.key === mode.key) + 1]?.key || 'review') : null;
  const back = () => mode ? go(index, order[order.findIndex(item => item.key === mode.key) - 1]?.key || 'setup') : draft.lastStep.step === 'review' ? go(index, order.at(-1).key) : close();
  const close = () => { editor.persist(); onClose(); };
  const remember = (path, value, custom) => {
    const shared = path.replace(/^turns\.\d+\./, '');
    dispatch({ type: 'SET_KOLB_PREFERENCES', preferences: rememberWizardOption(preferences, shared, value, custom) });
  };
  useEffect(() => {
    const previous = document.activeElement, element = dialog.current;
    element.showModal();
    return () => { element.close(); previous?.focus?.(); };
  }, []);
  useEffect(() => { main.current?.scrollTo(0, 0); main.current?.focus(); }, [draft.lastStep.turn, draft.lastStep.step]);
  useEffect(() => { editor.synchronize(current => refreshKolbImports(current, fateModels)); }, [fateModels]);
  const entityOptions = entities.map(entity => ({ value: entity.key, label: `${entity.name} · ${entity.type}` }));
  const linked = entities.filter(entity => draft.meta.learners.includes(entity.key) || entity.key === draft.meta.source);
  const entityPicker = (label, path, multiple = false) => <div>{selectField(label, multiple ? '' : getPath(draft, path), entityOptions, value => edit(path, multiple ? value ? [...new Set([...(getPath(draft, path) || []), value])] : getPath(draft, path) : value))}{multiple && <div className="fw-linked-picks">{getPath(draft, path).map(key => <button type="button" className="btn" key={key} onClick={() => edit(path, getPath(draft, path).filter(id => id !== key))}>{entities.find(entity => entity.key === key)?.name || C.missingEntity} ×</button>)}</div>}</div>;
  const loadDraft = value => { const next = game.kolbWizardDrafts?.[value]; if (next?.schemaVersion === 1) editor.replace(copyDraft(next)); };
  const fresh = model => {
    const saved = model && savedWizardSession(model.node, library, model.record);
    const next = createKolbDraft({ record: saved?.record, answers: saved?.answers, purpose: saved?.record.focus || draft.meta.purpose, preferences, scope });
    next.workspace = { targetId: '', scope, scopeKey: wizardScopeKey(scope), sessionId: null }; next.lastStep = { turn: 0, step: 'setup' };
    if (model) next.title = `${model.record.title} — copy`;
    editor.replace(next);
  };
  const save = includeLibrary => {
    if (busy.current || !draft.title.trim() || (draft.workspace.targetId && !target)) return;
    const id = record?.resultId || genId(graph.nodes, `${game.meta.prefix}-N-`);
    let node = createWizardNode({ source: FRAMEWORK_TYPES.kolbLearningCycle, type: 'framework', title: draft.title, context: draft.context, focus: draft.meta.purpose, questions: kolbQuestions(draft), answers: kolbAnswers(draft), kolbDraft: draft, id, position: visibleCanvasPlacement({ x: 100, y: 100 }), characterTemplate: game.meta.characterCardTemplate });
    if (record?.sessionId) node.narrativeWizard.sessionId = record.sessionId;
    if (target) node = record ? reviseWizardResult({ ...target, narrativeWizard: { ...record, answers: savedWizardSession(target, library, record)?.answers || record.answers } }, node, FRAMEWORK_TYPES.kolbLearningCycle) : appendWizardResult(target, node);
    const action = target ? { type: 'GRAPH_UPDATE_NODE', scope, id: target.id, patch: { ...(record ? { title: node.title, name: node.name } : {}), body: node.body, description: node.description, narrativeWizard: node.narrativeWizard, narrativeWizardHistory: node.narrativeWizardHistory, ...(node.questions ? { questions: node.questions } : {}), ...(node.sub ? { sub: node.sub } : {}) } } : { type: 'GRAPH_ADD_NODE', scope, node };
    busy.current = true; editor.stopSaving();
    dispatch({ type: 'BATCH', actions: [action, { type: 'REMOVE_KOLB_DRAFT', id: draft.id }] });
    if (includeLibrary) {
      const coll = node.kind === 'character' ? 'narrative' : 'concepts';
      libraryDispatch({ type: 'ADD_ENTITY', ...wizardLibraryRecord(node, genId(library[coll] || {}, coll === 'narrative' ? 'LIB-NAR-' : 'LIB-CPT-N')) });
    }
    dispatch({ type: 'SET_KOLB_PREFERENCES', preferences: { ...preferences, lastPurpose: draft.meta.purpose, lastDepth: draft.meta.depth, lastEntry: draft.meta.entry, lastOutputFormat: draft.output.format } });
    setFinished({ id: node.id, library: includeLibrary });
  };
  const field = item => {
    const path = `turns.${index}.${item.path}`;
    const optionPreferences = { ...preferences, chipUsage: { ...preferences.chipUsage, [path]: preferences.chipUsage?.[item.path] }, customVocabulary: { ...preferences.customVocabulary, [path]: preferences.customVocabulary?.[item.path] } };
    return <div className="fw-field" key={path} data-kolb-field={item.path}>{draft.fieldMeta[path]?.source !== 'user' && draft.fieldMeta[path]?.source !== undefined && <small className="fw-inherited">{C.from} {draft.fieldMeta[path].source === 'migrated' ? C.savedWizard : draft.fieldMeta[path].external ? 'FATE' : C.carried}</small>}<WizardField field={{ ...item, path, ...(item.path === 'ae.stakes' ? { maxIndex: draft.safety.cap } : {}) }} draft={draft} onEdit={edit} preferences={optionPreferences} onRemember={remember} entities={entities} /></div>;
  };
  const calibration = () => <details><summary>{C.calibration}</summary>{selectField(C.stakesCap, draft.safety.cap, KOLB_FIELDS.AE.find(field => field.path === 'ae.stakes').options.map((label, value) => ({ value, label })), value => edit('safety.cap', Number(value)))}<label className="fw-toggle"><input type="checkbox" checked={draft.safety.failureFraming} onChange={event => edit('safety.failureFraming', event.target.checked)} />{C.failureFraming}</label><label className="fw-toggle"><input type="checkbox" checked={draft.safety.debrief} onChange={event => edit('safety.debrief', event.target.checked)} />{C.debrief}</label>{draft.safety.debrief && textField(C.debriefText, draft.safety.note, value => edit('safety.note', value))}</details>;
  const changeEditor = cycle => { const value = kolbChange(draft, cycle); return <section className="kw-change" key={cycle}><h4>{C.cycle} {cycle + 1} · {C.turnSummary}</h4><p>{C.changeHelp}</p>{['before', 'after', 'behaviour'].map(part => textField(C[part], value[part], next => edit(`turns.${cycle}.change.${part}`, next), 2))}</section>; };
  const purposeExtras = () => {
    const p = `turns.${index}.extras`;
    if (draft.meta.purpose === 'relationship') return <details><summary>{C.sideA} / {C.sideB}</summary>{textField(C.sideA, turn.extras.sideA, value => edit(`${p}.sideA`, value))}{textField(C.sideB, turn.extras.sideB, value => edit(`${p}.sideB`, value))}</details>;
    if (draft.meta.purpose === 'values') return <details><summary>{C.values}</summary>{['value', 'facts', 'meaning', 'relevance'].map(key => textField(C[key], turn.extras[key], value => edit(`${p}.${key}`, value)))}</details>;
    if (draft.meta.purpose === 'learning') return <details><summary>{C.space}</summary>{KOLB_SPACE.map((name, i) => textField(name, turn.extras[`space${i}`], value => edit(`${p}.space${i}`, value), 2))}</details>;
    if (['communication', 'style'].includes(draft.meta.purpose)) return <details><summary>{C.audience}</summary>{selectField(C.audience, turn.extras.audience, ['Listeners', 'Participants', 'Observers', 'A mixture'], value => edit(`${p}.audience`, value))}{selectField(C.presentation, turn.extras.presentation, ['Telling', 'Showing', 'Both'], value => edit(`${p}.presentation`, value))}</details>;
    return null;
  };
  return createPortal(<dialog ref={dialog} className="narrative-wizard fate-wizard kolb-wizard" aria-labelledby="kolb-title" onCancel={event => { event.preventDefault(); event.stopPropagation(); close(); }} onBlurCapture={editor.endGroup} onKeyDown={event => { if (!(event.ctrlKey || event.metaKey)) return; if (event.key === 'Enter' && !finished) { event.preventDefault(); event.stopPropagation(); next(); } if (event.key.toLowerCase() === 'z') { event.preventDefault(); event.stopPropagation(); event.shiftKey ? editor.redo() : editor.undo(); } }}>
    <div className="nw-shell"><header className="nw-header"><div><small>{C.title}</small><h2 id="kolb-title">{finished ? C.saved : mode ? `${C.cycle} ${index + 1} · ${mode.name}` : draft.lastStep.step === 'setup' ? C.setup : C.review}</h2></div><div className="fw-header-actions">{!finished && <><fieldset className="fw-mode"><legend>{C.depth}</legend>{['simple', 'advanced'].map(depth => <label key={depth} className={draft.meta.depth === depth ? 'selected' : ''}><input type="radio" name="kolb-depth" checked={draft.meta.depth === depth} onChange={() => edit('meta.depth', depth)} />{C[depth]}</label>)}</fieldset><button type="button" className="btn" aria-label={C.undo} disabled={!editor.canUndo} onClick={editor.undo}>↶</button><button type="button" className="btn" aria-label={C.redo} disabled={!editor.canRedo} onClick={editor.redo}>↷</button></>}<button type="button" className="btn" onClick={close}>{C.close}</button></div></header>
      {!finished && <nav className="fw-stepper kw-stepper" aria-label="Kolb steps"><button type="button" aria-current={draft.lastStep.step === 'setup' ? 'step' : undefined} onClick={() => go(index, 'setup')}>{C.setup}</button>{order.map(item => { const progress = kolbProgress(draft, index, item.key); return <button type="button" key={item.key} aria-current={mode?.key === item.key ? 'step' : undefined} onClick={() => go(index, item.key)}><b style={{ color: item.color }}>{item.key}</b><span>{item.name}</span><meter aria-label={`${item.name}: ${C.progress}`} min="0" max={progress.total} value={progress.filled} /></button>; })}<button type="button" aria-current={draft.lastStep.step === 'review' ? 'step' : undefined} onClick={() => go(index, 'review')}>{C.review}</button></nav>}
      <div className="fw-body"><aside className="fw-context"><b>{C.contextRail}</b><p>{advanced ? C.advancedHelp : C.simpleHelp}</p>{linked.map(entity => <details className="fw-context-card" key={entity.key}><summary>{entity.name}</summary><p>{entity.description}</p></details>)}{draft.meta.targetText && <p>{draft.meta.targetText}</p>}{draft.turns.map((cycle, cycleIndex) => <section key={cycleIndex}><h4>{C.cycle} {cycleIndex + 1}</h4>{kolbOrder(draft.meta.entry).map(item => <div key={item.key} className={`fw-context-card${cycleIndex === index && item.key === mode?.key ? ' current' : ''}`} style={{ '--fate-accent': item.color }}><button type="button" onClick={() => go(cycleIndex, item.key)}><b>{item.name}{draft.locks[`${cycleIndex}:${item.key}`] ? ' · 🔒' : ''}</b><span>{summarizeKolb(draft, cycleIndex, item.key) || C.notStarted}</span></button>{draft.notes[`${cycleIndex}:${item.key}`] && <details><summary>{C.notes}</summary><p>{draft.notes[`${cycleIndex}:${item.key}`]}</p></details>}</div>)}</section>)}<small role="status">{editor.kept ? C.kept : C.keeping}</small></aside>
        <main className="nw-main fw-main kw-main" ref={main} tabIndex={-1}>
          {finished ? <><h3>{finished.library ? C.savedBoth : C.savedGame}</h3><button type="button" className="btn primary" onClick={() => { onSaved?.(finished.id); onClose(); }}>{C.done}</button></> : <>
            {draft.lastStep.step === 'setup' && <>
              <p>{advanced ? C.advancedHelp : C.simpleHelp}</p>
              {sessions.length > 1 && selectField(C.savedWizard, sessions.findIndex(item => item.record.sourceId === session?.record.sourceId && (item.record.sessionId ? item.record.sessionId === session?.record.sessionId : item.record.title === session?.record.title)), sessions.map((item, value) => ({ value, label: `${item.record.sourceLabel} — ${item.record.title}` })), value => { editor.persist(); onContinueSession(value); })}
              <label className="nw-field">{C.name}<input aria-label={C.name} className="field-input" value={draft.title} onChange={event => edit('title', event.target.value)} /></label>
              {selectField(C.purpose, draft.meta.purpose, Object.entries(NARRATIVE_FOCUSES).map(([value, info]) => ({ value, label: info.label })), value => { if (!record) edit('meta.purpose', value); })}
              {textField(C.context, draft.context, value => edit('context', value))}
              {selectField(C.destination, target ? JSON.stringify([scope.coll || 'nodes', ...(scope.parentPath || (scope.parentId ? [scope.parentId] : [])), target.id]) : '', [{ value: '', label: C.newResult }, ...entityOptions.filter(option => ['nodes', 'masterNodes'].includes(entities.find(entity => entity.key === option.value).ref.coll))], value => { if (record) return; const entity = entities.find(entity => entity.key === value); edit('workspace', entity ? { ...draft.workspace, targetId: entity.ref.path.at(-1), scope: { coll: entity.ref.coll, parentPath: entity.ref.path.slice(0, -1) }, scopeKey: wizardScopeKey({ coll: entity.ref.coll, parentPath: entity.ref.path.slice(0, -1) }), sessionId: null, sourceTitle: null } : { ...draft.workspace, targetId: '', sessionId: null, sourceTitle: null }); })}
              {selectField(C.entry, draft.meta.entry, KOLB_MODES.map(item => ({ value: item.key, label: item.name })), value => { if (value) edit('meta.entry', value); })}<small>{C.entryHelp}</small>
              <details><summary>{C.drafts}</summary>{selectField(C.drafts, draftKey, Object.values(game.kolbWizardDrafts || {}).filter(item => item.id !== draft.id && item.schemaVersion === 1).map(item => ({ value: item.id, label: item.title || C.notStarted })), setDraftKey)}<button type="button" className="btn" disabled={!draftKey} onClick={() => loadDraft(draftKey)}>{C.drafts}</button><button type="button" className="btn" onClick={() => fresh()}>{C.fresh}</button><p>{C.draftHelp}</p></details>
              {models.length > 0 && <details><summary>{C.startFrom}</summary>{selectField(C.startFrom, modelKey, models.map(model => ({ value: model.key, label: `${model.entity.name} · ${model.record.title}` })), setModelKey)}<button type="button" className="btn" disabled={!modelKey} onClick={() => fresh(models.find(model => model.key === modelKey))}>{C.duplicate}</button></details>}
              {advanced && <>
                <WizardChoices field={{ path: 'meta.mode', label: C.mode, control: 'single', options: [C.build, C.diagnose] }} value={draft.meta.mode === 'diagnose' ? C.diagnose : C.build} preferences={EMPTY} onChange={value => edit('meta.mode', value === C.diagnose ? 'diagnose' : 'build')} onRemember={() => {}} />
                {draft.meta.mode === 'diagnose' && <>{entityPicker(C.source, 'meta.source')}<p className="nw-help">{C.diagnoseHelp}</p><details open><summary>{C.sourceDescription}</summary><p className="fw-source-description">{entities.find(entity => entity.key === draft.meta.source)?.description || C.notStarted}</p></details></>}
                {entityPicker(C.learners, 'meta.learners', true)}{textField(C.others, draft.meta.otherLearners, value => edit('meta.otherLearners', value), 2)}
                {selectField(C.target, draft.meta.target, KOLB_TARGETS, value => edit('meta.target', value))}{textField(C.targetText, draft.meta.targetText, value => edit('meta.targetText', value))}
                {selectField(C.scope, draft.meta.scope, ['Complete a task', 'Improve an approach', 'Reconsider a larger purpose'], value => edit('meta.scope', value))}
                <KolbStyleGrid value={draft.meta.habit} onChange={value => edit('meta.habit', value)} />
                {selectField(C.learningIdentity, draft.meta.identity, ['They doubt they can change', 'They are unsure', 'They are open to trying'], value => edit('meta.identity', value))}
                {selectField(C.intent, draft.meta.intent, ['Practise a familiar approach', 'Try a less familiar approach', 'Mix approaches'], value => edit('meta.intent', value))}{calibration()}
              </>}
              <details><summary>{C.preferences}</summary><p>{C.clearPreferencesHelp}</p><button type="button" className="btn" onClick={() => dispatch({ type: 'SET_KOLB_PREFERENCES', preferences: {} })}>{C.clearPreferences}</button></details>
              <button type="button" className="linkbtn" onClick={() => { editor.persist(); onBack(); }}>{C.chooseSource}</button>
            </>}
            {mode && <>
              <p className="nw-guidance"><b>{C.carried}</b>{kolbBanner(draft, index, mode.key, entities)}</p>
              <details><summary>{C.allContext}</summary>{draft.turns.map((cycle, cycleIndex) => <section key={cycleIndex}><h4>{C.cycle} {cycleIndex + 1}</h4>{KOLB_MODES.map(item => <div key={item.key}><b>{item.name}</b><p className="fw-source-description">{cycle[item.section].anchor || C.notStarted}</p>{draft.notes[`${cycleIndex}:${item.key}`] && <p>{draft.notes[`${cycleIndex}:${item.key}`]}</p>}<button type="button" className="linkbtn" onClick={() => go(cycleIndex, item.key)}>{item.name}</button></div>)}</section>)}{prior.map(record => <section key={record.sessionId || record.sourceId}><b>{record.sourceLabel}{record.answers?.archetype ? ` · ${record.answers.archetype}` : ''}</b><p>{record.summary}</p></section>)}</details>
              <div className="fw-pillar-header"><h3>{KOLB_LABELS[draft.meta.purpose][KOLB_MODES.findIndex(item => item.key === mode.key)]}</h3><button type="button" className="btn" aria-pressed={!!locked} onClick={() => edit(`locks.${index}:${mode.key}`, !locked)}>{locked ? C.unlock : C.lock}</button></div>
              <fieldset className="fw-pillar-fields" disabled={!!locked}><legend>{mode.full}</legend>
                {textField(KOLB_LABELS[draft.meta.purpose][KOLB_MODES.findIndex(item => item.key === mode.key)], turn[mode.section].anchor, value => edit(`turns.${index}.${mode.section}.anchor`, value))}
                {KOLB_FIELDS[mode.key].filter(item => item.simple).map(field)}
                {mode.key === 'RO' && <section className="kw-observations"><h4>{C.observations}</h4>{turn.ro.observations.map((row, rowIndex) => <div key={row.id}>{textField(`${C.observation} ${rowIndex + 1}`, row.text, value => edit(`turns.${index}.ro.observations`, turn.ro.observations.map(other => other.id === row.id ? { ...other, text: value } : other)), 2)}<button type="button" className="linkbtn" onClick={() => edit(`turns.${index}.ro.observations`, turn.ro.observations.filter(other => other.id !== row.id))}>{C.removeObservation}</button></div>)}<button type="button" className="btn" disabled={turn.ro.observations.length >= 5} onClick={() => transition(current => addKolbObservation(current, index))}>{C.addObservation}</button></section>}
                {mode.key === 'AC' && <KolbObservationLinks draft={draft} index={index} onEdit={edit} />}
                {mode.key === 'AE' && <><KolbBranchBuilder turn={turn} index={index} onEdit={edit} advanced={advanced} />{selectField(C.observed, turn.ae.observed, [{ value: '', label: C.unknownOutcome }, ...KOLB_BRANCHES.filter(branch => turn.ae.branches[branch.key].enabled && turn.ae.branches[branch.key].text.trim()).map(branch => ({ value: branch.key, label: branch.name }))], value => edit(`turns.${index}.ae.observed`, value || null))}<small>{C.outcomeHelp}</small>{selectField(C.seed, turn.ae.seed, KOLB_BRANCHES.filter(branch => turn.ae.branches[branch.key].enabled && turn.ae.branches[branch.key].text.trim()).map(branch => ({ value: branch.key, label: branch.name })), value => edit(`turns.${index}.ae.seed`, value || null))}<button type="button" className="btn" disabled={draft.turns.length >= 4 || !turn.ae.seed} onClick={() => transition(current => addKolbTurn(current, turn.ae.seed))}>{C.useResult}</button></>}
                {advanced && <details className="fw-deeper" open><summary>{C.advancedDetails}</summary>{KOLB_FIELDS[mode.key].filter(item => !item.simple).map(field)}<label className="nw-field">{C.minutes}<input aria-label={`${mode.name}: ${C.minutes}`} className="field-input" type="number" min="0" value={turn.durations[mode.key] ?? ''} onChange={event => edit(`turns.${index}.durations.${mode.key}`, event.target.value === '' ? null : Math.max(0, Number(event.target.value)))} /></label></details>}
                <details><summary>{C.notes}</summary>{textField(C.notes, draft.notes[`${index}:${mode.key}`], value => edit(`notes.${index}:${mode.key}`, value))}<small>{C.notesHelp}</small></details>
                {advanced && mode.key === 'CE' && fateModels.length > 0 && <details><summary>{C.fate}</summary><p>{C.fateHelp}</p>{selectField(C.fatePick, fateKey, fateModels.map(model => ({ value: model.key, label: `${model.entity.name} · ${model.record.title}` })), setFateKey)}{fateModels.find(model => model.key === fateKey) && (() => { const model = fateModels.find(model => model.key === fateKey); return <><p>{fateImportValue(model, 'experience')}</p><button type="button" className="btn" onClick={() => transition(current => importKolbFate(current, index, model, 'experience'))}>{C.importExperience}</button>{fateImportValue(model, 'emotion') && <><p>{fateImportValue(model, 'emotion')}</p><button type="button" className="btn" onClick={() => transition(current => importKolbFate(current, index, model, 'emotion'))}>{C.importEmotion}</button></>}</>; })()}</details>}
              </fieldset>
              {!locked && <details className="fw-suggestions"><summary>{C.suggest}</summary><p>{C.suggestHelp}</p>{kolbSuggestions(draft, index, mode.key, fateModels).length ? kolbSuggestions(draft, index, mode.key, fateModels).map(suggestion => <div key={suggestion.id}><b>{display(suggestion.proposed)}</b><p>{suggestion.reason}</p><button type="button" className="btn" onClick={() => transition(current => acceptKolbSuggestion(current, suggestion))}>{C.accept}</button></div>) : <p>{C.noSuggestions}</p>}</details>}
              {advanced && purposeExtras()}
            </>}
            {stale.length > 0 && <section className="fw-stale"><h4>{C.reviewField}</h4>{stale.map(([path, meta]) => { const suggestion = draft.turns.flatMap((cycle, cycleIndex) => KOLB_MODES.flatMap(item => kolbSuggestions(draft, cycleIndex, item.key, fateModels))).find(row => row.path === path); return <div key={path}><b>{`${C.cycle} ${Number(path.split('.')[1]) + 1} · ${kolbFieldLabel(path)}`}</b><p>{meta.external ? `${C.from} FATE: ${display(meta.external.value)}` : Object.entries(meta.basedOn || {}).map(([dependency, before]) => `${display(before)} → ${display(getPath(draft, dependency))}`).join('; ')}</p><button type="button" className="btn" onClick={() => { const model = meta.external && fateModels.find(model => model.key === meta.external.key); transition(current => keepKolb(current, path, model ? fateImportValue(model, meta.external.field) : null)); }}>{C.keep}</button>{suggestion && <button type="button" className="btn" onClick={() => transition(current => acceptKolbSuggestion(current, suggestion))}>{C.update}</button>}</div>; })}</section>}
            {draft.lastStep.step === 'review' && <>
              {advanced && <KolbCycleWheel draft={draft} onGo={go} />}
              {draft.turns.map((cycle, cycleIndex) => changeEditor(cycleIndex))}
              <div className="kw-cycle-actions"><button type="button" className="btn" disabled={draft.turns.length >= 4} onClick={() => transition(current => addKolbTurn(current))}>{C.blankCycle}</button>{draft.turns.length >= 4 && <small>{C.cycleLimit}</small>}</div>
              <label className="nw-field">{C.name}<input aria-label={C.name} className="field-input" value={draft.title} onChange={event => edit('title', event.target.value)} /></label>
              {advanced && <div className="fw-output-options">{selectField(C.format, draft.output.format, KOLB_FORMATS, value => edit('output.format', value))}{selectField(C.tone, draft.output.tone, FATE_TONES, value => edit('output.tone', value))}{selectField(C.length, draft.output.length, KOLB_LENGTHS, value => edit('output.length', value))}</div>}
              {draft.meta.mode === 'diagnose' && <p className="nw-help">{C.diagnoseHelp}</p>}
              {textField(draft.meta.mode === 'diagnose' ? C.gaps : draft.meta.purpose === 'character' ? C.characterOutput : C.output, output, value => edit('output.text', value), 12)}<p className="nw-help">{C.outputHelp}</p>{draft.output.text !== undefined && <><p>{C.edited}</p><button type="button" className="btn" onClick={() => { if (window.confirm(C.confirmRebuild)) edit('output.text', undefined); }}>{C.rebuild}</button></>}
              <details open={draft.meta.mode === 'diagnose'}><summary>{C.checks} ({checks.length})</summary>{checks.length ? checks.map(check => <div key={check.id}><p>{check.message}</p><button type="button" className="linkbtn" onClick={() => go(check.turn, check.mode)}>{C.cycle} {check.turn + 1} · {kolbMode(check.mode).name}</button><button type="button" className="linkbtn" onClick={() => edit('dismissed', [...draft.dismissed, check.id])}>{C.keep}</button></div>) : <p>{C.noChecks}</p>}</details>
              <details><summary>{C.details}</summary>{draft.turns.map((cycle, cycleIndex) => <section key={cycleIndex}><h4>{C.cycle} {cycleIndex + 1}</h4>{KOLB_MODES.map(item => <div key={item.key}><b>{item.name}</b><p>{cycle[item.section].anchor}</p><p>{draft.notes[`${cycleIndex}:${item.key}`]}</p><dl>{KOLB_FIELDS[item.key].map(field => { const value = getPath(cycle, field.path); return value !== null && value !== '' && (!Array.isArray(value) || value.length) ? <div key={field.path}><dt>{field.label}</dt><dd>{field.control === 'scale' ? field.options[value] : display(value)}</dd></div> : null; })}</dl></div>)}</section>)}</details>
              {advanced && <><section className="kw-pacing"><h4>{C.pacing}</h4>{draft.turns.map((cycle, cycleIndex) => <section key={cycleIndex}><b>{C.cycle} {cycleIndex + 1}</b>{order.map(item => <p key={item.key}><span>{item.name}</span><meter min="0" max={Math.max(1, ...Object.values(cycle.durations).filter(Number.isFinite))} value={cycle.durations[item.key] || 0} /><span>{cycle.durations[item.key] ?? '—'} {C.minutes.toLowerCase()}</span></p>)}</section>)}</section><section><h4>{C.roles}</h4>{draft.turns.map((cycle, cycleIndex) => <p className="kw-roles" key={cycleIndex}>{C.cycle} {cycleIndex + 1}: {order.map(item => <span key={item.key}>{item.name}: {cycle[item.section].role || C.unset}</span>)}</p>)}</section>{draft.meta.purpose === 'story' && draft.turns.map((cycle, cycleIndex) => selectField(`${C.cycle} ${cycleIndex + 1}: ${C.act}`, cycle.act, entityOptions.filter(option => entities.find(entity => entity.key === option.value).ref.coll === 'masterNodes'), value => edit(`turns.${cycleIndex}.act`, value)))}{calibration()}</>}
            </>}
            {mode && <details className="fw-inline-preview"><summary>{C.preview}</summary><p>{output || C.previewEmpty}</p></details>}
          </>}
        </main>
        {!finished && <aside className="fw-live-preview"><small>{draft.meta.mode === 'diagnose' ? C.gaps : C.preview}</small><p>{output || C.previewEmpty}</p>{advanced && <KolbCycleWheel draft={draft} onGo={go} />}</aside>}
      </div>
      {!finished && <footer className="nw-footer"><button type="button" className="btn" onClick={back}>{C.back}</button><span>{editor.kept ? C.kept : C.keeping}</span>{draft.lastStep.step === 'review' ? <><button type="button" className="btn" disabled={!draft.title.trim() || (draft.workspace.targetId && !target)} onClick={() => save(false)}>{C.saveGame}</button><button type="button" className="btn primary" disabled={!draft.title.trim() || (draft.workspace.targetId && !target)} onClick={() => save(true)}>{C.saveLibrary}</button></> : <><button type="button" className="btn" onClick={() => go(index, 'review')}>{C.reviewNow}</button><button type="button" className="btn primary" onClick={next}>{C.next}</button></>}</footer>}
    </div>
  </dialog>, document.body);
}
