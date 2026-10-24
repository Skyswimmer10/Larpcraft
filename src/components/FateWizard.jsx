import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGame, useDispatch, useLibrary, useLibraryDispatch } from '../state/store.jsx';
import { locateGraph } from '../state/reducer.js';
import { FRAMEWORK_TYPES } from '../data/seed.js';
import { genId } from '../data/csvSchemas.js';
import { NARRATIVE_FOCUSES } from '../data/narrativeGuidance.js';
import { FATE_COPY as C, FATE_STEPS, FATE_FIELDS, FATE_PURPOSE_LABELS, FATE_FORMATS, FATE_TONES, FATE_LENGTHS, FATE_OUTCOMES } from '../data/fateWizard.js';
import { copyFate, createFateDraft, editFate, getFate, fatePillarFor, fateScopeKey, fateEntities, fateSavedModels, fateQuestions, fateAnswers, fateOutput, fateCompletion, fateChecks, fateSuggestions, acceptFateSuggestion, keepFateField, summarizeFateStep, fateBanner, rememberFateOption, fateSessionRecord } from '../lib/fateWizard.js';
import { createWizardNode, appendWizardResult, reviseWizardResult, wizardLibraryRecord } from '../lib/narrativeWizard.js';
import { savedWizardSession } from '../lib/narrativeMemory.js';
import { visibleCanvasPlacement } from './FlowCanvas.jsx';
import { FateField, FateChoices, FateCompletionChart } from './FateWizardControls.jsx';
import { FATE_TYPES, FATE_PURPOSE_COPY as P, fateFieldsFor } from '../data/fatePurposes.js';
import { normalizeFateDraft, addFateEmotionPattern, linkFateListenerProfile, fateProfileSignature, fateDesignNotes } from '../lib/fateWizard.js';
import { FateTypePicker, FateSelectionDetails, FateEmotionPatterns, FateProfileGuidance, FateSelectedIdeas } from './FatePurposeControls.jsx';
import './FateWizard.css';
import './FatePurposes.css';

const EMPTY = Object.freeze({});
const formatValue = value => Array.isArray(value) ? value.join(', ') : value === true ? 'Yes' : value === false ? 'No' : value ?? C.unset;
const textEntry = (label, value, onChange, rows = 3) => <label className="nw-field">{label}<textarea className="field-input" rows={rows} value={value || ''} onChange={event => onChange(event.target.value)} /></label>;
const selectEntry = (label, value, options, onChange) => <label className="nw-field">{label}<select aria-label={label} className="field-input" value={value || ''} onChange={event => onChange(event.target.value)}><option value="">{C.unset}</option>{options.map(option => <option key={option} value={option}>{option}</option>)}</select></label>;

function initialFate(game, session, initialTargetId, scope, initialPurpose) {
  const targetId = session?.targetId || initialTargetId || '';
  const existing = Object.values(game.fateWizardDrafts || {}).filter(draft => draft.workspace?.scopeKey === fateScopeKey(scope) && (draft.workspace?.targetId || '') === targetId && (!session || draft.workspace?.sessionId === session.record.sessionId)).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
  if (existing?.schemaVersion > 1) throw new Error('This FATE draft was made by a newer version of Larpcraft. Update the app before editing it.');
  return existing ? normalizeFateDraft(existing) : createFateDraft({ record: session?.record, answers: session?.answers, preferences: game.fateWizardPreferences || {}, purpose: session?.record.focus || initialPurpose || game.fateWizardPreferences?.lastPurpose || 'communication', targetId, scope });
}

export default function FateWizard(props) {
  const game = useGame();
  const [initial] = useState(() => { try { return { draft: initialFate(game, props.session, props.initialTargetId, props.gameScope, props.initialPurpose) }; } catch (error) { return { error: error.message }; } });
  if (initial.error) return <FateUnavailable error={initial.error} onClose={props.onClose} />;
  return <FateEditor {...props} initial={initial.draft} />;
}
function FateUnavailable({ error, onClose }) {
  const ref = useRef(null);
  useEffect(() => { ref.current.showModal(); }, []);
  return createPortal(<dialog ref={ref} className="narrative-wizard" onCancel={event => { event.preventDefault(); onClose(); }}><div className="nw-main"><p>{error}</p><button type="button" className="btn" onClick={onClose}>{C.close}</button></div></dialog>, document.body);
}

function FateEditor({ initial, session, sessions = [], onContinueSession, onClose, onBack, onSaved }) {
  const game = useGame(), library = useLibrary(), dispatch = useDispatch(), libraryDispatch = useLibraryDispatch();
  const [history, setHistory] = useState(() => ({ past: [], present: normalizeFateDraft(initial), future: [] }));
  const draft = history.present;
  const [finished, setFinished] = useState(null);
  const [selectedDraft, setSelectedDraft] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('');
  const [savedDraft, setSavedDraft] = useState(false);
  const dialog = useRef(null), main = useRef(null), latest = useRef(draft), stopped = useRef(false), group = useRef(null);
  latest.current = draft;
  const preferences = game.fateWizardPreferences || EMPTY;
  const advanced = draft.meta.depth === 'advanced';
  const character = draft.meta.purpose === 'character', communication = draft.meta.purpose === 'communication';
  const entities = useMemo(() => fateEntities(game), [game.nodes, game.masterNodes, game.locations, game.items, game.teams, game.players]);
  const models = useMemo(() => fateSavedModels(game), [game.nodes, game.masterNodes]);
  const profiles = models.filter(model => model.record.focus === 'character');
  const profileSource = profiles.find(model => model.key === draft.communication.profile?.key);
  const stepIndex = Math.max(0, FATE_STEPS.findIndex(step => step.key === draft.lastStep));
  const step = FATE_STEPS[stepIndex], pillar = step.section ? step.key : null;
  const locked = pillar && draft.meta.locks[pillar];
  const scope = draft.workspace.scope || { coll: 'nodes' }, graph = locateGraph(game, scope), target = graph.nodes[draft.workspace.targetId];
  const record = fateSessionRecord(target, draft.workspace);
  const checks = fateChecks(draft), suggestions = pillar ? fateSuggestions(draft, pillar) : [];
  const stale = Object.entries(draft.fieldMeta).filter(([, meta]) => meta.stale);
  const output = fateOutput(draft);
  const resultReady = !!draft.title.trim() && !(draft.workspace.targetId && !target) && (!communication || !!output.trim());
  const transition = (updater, key = null) => {
    const coalesce = key && key === group.current;
    group.current = key;
    setHistory(current => {
      const next = typeof updater === 'function' ? updater(current.present) : updater;
      if (next === current.present || JSON.stringify(next) === JSON.stringify(current.present)) return current;
      return { past: coalesce ? current.past : [...current.past, current.present].slice(-75), present: next, future: [] };
    });
  };
  const edit = (path, value) => {
    if (path === 'meta.purpose' && record) return;
    transition(current => editFate(current, path, value), typeof value === 'string' ? path : null);
    const preference = { 'meta.purpose': 'lastPurpose', 'meta.depth': 'lastDepth', 'output.format': 'lastOutputFormat' }[path];
    if (preference) dispatch({ type: 'SET_FATE_PREFERENCES', preferences: { ...preferences, [preference]: value } });
  };
  const undo = () => { group.current = null; setHistory(current => current.past.length ? { past: current.past.slice(0, -1), present: current.past.at(-1), future: [current.present, ...current.future] } : current); };
  const redo = () => { group.current = null; setHistory(current => current.future.length ? { past: [...current.past, current.present], present: current.future[0], future: current.future.slice(1) } : current); };
  const remember = (path, value, custom) => dispatch({ type: 'SET_FATE_PREFERENCES', preferences: rememberFateOption(game.fateWizardPreferences || {}, path, value, custom) });
  const go = key => edit('lastStep', key);
  const next = () => go(FATE_STEPS[Math.min(stepIndex + 1, FATE_STEPS.length - 1)].key);
  const keepDraft = () => { if (!stopped.current) dispatch({ type: 'SAVE_FATE_DRAFT', draft: { ...latest.current, updatedAt: Date.now() } }); };
  const close = () => { keepDraft(); onClose(); };

  useEffect(() => {
    const previous = document.activeElement;
    const element = dialog.current;
    element.showModal();
    return () => { element.close(); previous?.focus?.(); };
  }, []);
  useEffect(() => {
    if (stopped.current || finished) return;
    setSavedDraft(false);
    const timer = setTimeout(() => { dispatch({ type: 'SAVE_FATE_DRAFT', draft: { ...draft, updatedAt: Date.now() } }); setSavedDraft(true); }, 500);
    return () => clearTimeout(timer);
  }, [draft, dispatch, finished]);
  useEffect(() => { main.current?.scrollTo(0, 0); main.current?.focus(); }, [draft.lastStep]);
  const linked = keys => keys.map(key => entities.find(entity => entity.key === key) || { key, name: C.missingEntity, type: '', description: '' });
  const targetKey = target ? JSON.stringify([scope.coll || 'nodes', ...(scope.parentPath || (scope.parentId ? [scope.parentId] : [])), target.id]) : '';
  const linkedEntities = linked([...new Set([...(targetKey ? [targetKey] : []), ...draft.meta.influencers, ...draft.meta.targets, ...(draft.meta.source ? [draft.meta.source] : [])])]);
  const priorRecords = [...new Map([...(target?.narrativeWizardHistory || []), ...(target?.narrativeWizard ? [target.narrativeWizard] : [])].filter(record => record.sourceId !== 'fate').map(record => [record.sessionId || record.sourceId, record])).values()];
  // Entity labels are provided separately; IDs remain scope-aware even when two
  // nested graphs contain nodes with the same local ID.
  const entityPicker = (label, path, multiple = false) => <fieldset className="fw-entity-picker"><legend>{label}</legend><label className="nw-field">{label}<select aria-label={label} className="field-input" value={multiple ? '' : getFate(draft, path) || ''} onChange={event => { const key = event.target.value; edit(path, multiple ? key ? [...new Set([...(getFate(draft, path) || []), key])] : getFate(draft, path) : key); }}><option value="">{C.unset}</option>{entities.map(entity => <option key={entity.key} value={entity.key}>{entity.name} · {entity.type}</option>)}</select></label>{multiple && <div className="fw-linked-picks">{linked(getFate(draft, path)).map(entity => <button type="button" className="btn" key={entity.key} onClick={() => edit(path, getFate(draft, path).filter(key => key !== entity.key))}>{entity.name} ×</button>)}</div>}</fieldset>;
  const loadDraft = id => {
    const value = game.fateWizardDrafts?.[id];
    if (!value || value.schemaVersion !== 1) return;
    keepDraft(); setHistory({ past: [], present: normalizeFateDraft(value), future: [] }); group.current = null;
  };
  const fresh = model => {
    keepDraft();
    const value = createFateDraft({ ...(model ? { record: model.record } : {}), preferences, purpose: model?.record.focus || draft.meta.purpose, scope });
    value.id = `FATE-${crypto.randomUUID()}`; value.workspace = { targetId: '', scope, scopeKey: fateScopeKey(scope), sessionId: null }; value.lastStep = 'setup';
    if (model) value.title = `${model.record.title} — copy`;
    setHistory({ past: [], present: value, future: [] }); group.current = null;
  };
  const save = includeLibrary => {
    if (!resultReady || stopped.current) return;
    const id = record?.resultId || genId(graph.nodes, `${game.meta.prefix}-N-`);
    let node = createWizardNode({ source: FRAMEWORK_TYPES.fate, type: 'framework', title: draft.title, context: draft.context, focus: draft.meta.purpose, questions: fateQuestions(draft), answers: fateAnswers(draft), fateDraft: draft, id, position: visibleCanvasPlacement({ x: 100, y: 100 }), characterTemplate: game.meta.characterCardTemplate });
    if (record?.sessionId) node.narrativeWizard.sessionId = record.sessionId;
    if (target) node = record ? reviseWizardResult({ ...target, narrativeWizard: { ...record, answers: savedWizardSession(target, library, record)?.answers || record.answers } }, node, FRAMEWORK_TYPES.fate) : appendWizardResult(target, node);
    const action = target ? { type: 'GRAPH_UPDATE_NODE', scope, id: target.id, patch: { ...(record ? { title: node.title, name: node.name } : {}), body: node.body, description: node.description, narrativeWizard: node.narrativeWizard, narrativeWizardHistory: node.narrativeWizardHistory, ...(node.questions ? { questions: node.questions } : {}), ...(node.sub ? { sub: node.sub } : {}) } } : { type: 'GRAPH_ADD_NODE', scope, node };
    stopped.current = true;
    dispatch({ type: 'BATCH', actions: [action, { type: 'REMOVE_FATE_DRAFT', id: draft.id }] });
    if (includeLibrary) {
      const coll = node.kind === 'character' ? 'narrative' : 'concepts';
      libraryDispatch({ type: 'ADD_ENTITY', ...wizardLibraryRecord(node, genId(library[coll] || {}, coll === 'narrative' ? 'LIB-NAR-' : 'LIB-CPT-N')) });
    }
    dispatch({ type: 'SET_FATE_PREFERENCES', preferences: { ...preferences, lastPurpose: draft.meta.purpose, lastDepth: draft.meta.depth, lastOutputFormat: draft.output.format } });
    setFinished({ id: node.id, library: includeLibrary });
  };

  const field = item => {
    if (item.purposes && !item.purposes.includes(draft.meta.purpose)) return null;
    if (item.when && getFate(draft, item.when[0]) !== item.when[1]) return null;
    const meta = draft.fieldMeta[item.path];
    return <div className="fw-field" key={item.path} data-fate-field={item.path}>
      {meta?.source === 'suggested' && <small className="fw-inherited">{C.from} {FATE_STEPS.find(step => step.key === fatePillarFor(Object.keys(meta.basedOn || {})[0] || ''))?.name || C.setup}</small>}
      <FateField field={item} draft={draft} onEdit={edit} preferences={preferences} onRemember={remember} entities={entities} />
      <FateSelectionDetails draft={draft} field={item} onEdit={edit} />
    </div>;
  };
  const calibration = () => <details className="fw-calibration"><summary>{C.calibration}</summary>{selectEntry(C.cap, String(draft.safety.cap), ['0', '1', '2', '3', '4'], value => edit('safety.cap', Number(value)))}<p>{FATE_FIELDS.A.find(field => field.path === 'authority.cost').options[draft.safety.cap]}</p><label className="fw-toggle"><input type="checkbox" checked={draft.safety.optIn} onChange={event => edit('safety.optIn', event.target.checked)} />{C.optIn}</label>{draft.safety.optIn && textEntry(C.safetyNote, draft.safety.note, value => edit('safety.note', value))}<label className="fw-toggle"><input type="checkbox" checked={draft.safety.debrief} onChange={event => edit('safety.debrief', event.target.checked)} />{C.debrief}</label>{draft.safety.debrief && textEntry(C.debriefNote, draft.safety.debriefNote, value => edit('safety.debriefNote', value))}</details>;

  return createPortal(<dialog ref={dialog} className={`narrative-wizard fate-wizard${advanced ? ' fw-advanced' : ''}`} aria-labelledby="fate-title" onCancel={event => { event.preventDefault(); event.stopPropagation(); close(); }} onBlurCapture={() => { group.current = null; }} onKeyDown={event => {
    if (!(event.ctrlKey || event.metaKey)) return;
    if (event.key === 'Enter' && !finished) { event.preventDefault(); event.stopPropagation(); next(); }
    if (event.key.toLowerCase() === 'z') { event.preventDefault(); event.stopPropagation(); event.shiftKey ? redo() : undo(); }
  }}>
    <div className="nw-shell"><header className="nw-header"><div><small>{C.title}</small><h2 id="fate-title">{finished ? C.saved : step.name}</h2></div><div className="fw-header-actions">{!finished && <><fieldset className="fw-mode"><legend>{C.depth}</legend>{['simple', 'advanced'].map(depth => <label key={depth} className={draft.meta.depth === depth ? 'selected' : ''}><input type="radio" name="fate-depth" checked={draft.meta.depth === depth} onChange={() => edit('meta.depth', depth)} />{C[depth]}</label>)}</fieldset><button type="button" className="btn" aria-label={C.undo} disabled={!history.past.length} onClick={undo}>↶</button><button type="button" className="btn" aria-label={C.redo} disabled={!history.future.length} onClick={redo}>↷</button></>}<button type="button" className="btn" onClick={close}>{C.close}</button></div></header>
      {!finished && <nav className="fw-stepper" aria-label="FATE steps">{FATE_STEPS.map(item => { const progress = item.section ? fateCompletion(draft, item.key) : null; const changed = stale.some(([path]) => fatePillarFor(path) === item.key); return <button type="button" key={item.key} aria-current={draft.lastStep === item.key ? 'step' : undefined} onClick={() => go(item.key)}><b>{item.section ? item.key : item.key === 'setup' ? '1' : '✓'}</b><span>{item.name}{changed ? ' ⟳' : ''}</span>{progress && <meter aria-label={`${item.name}: ${C.completed}`} min="0" max="1" value={progress.ratio} />}</button>; })}</nav>}
      <div className="fw-body"><aside className="fw-context"><b>{C.contextRail}</b><p>{advanced ? C.advancedHelp : C.simpleHelp}</p>{linkedEntities.map(entity => <details className="fw-context-card" key={entity.key}><summary>{entity.name}<small>{entity.type}</small></summary><p>{entity.description}</p></details>)}{['F', 'A', 'T', 'E'].map(key => { const item = FATE_STEPS.find(step => step.key === key), value = draft[item.section]; return <div className={`fw-context-card${key === pillar ? ' current' : ''}`} key={key} style={{ '--fate-accent': item.color }}><button type="button" onClick={() => go(key)}><b>{item.name}{draft.meta.locks[key] ? ' · 🔒' : ''}</b><span>{summarizeFateStep(draft, key) || C.notStarted}</span></button>{!!draft.notes[key] && <details><summary>{C.notes}</summary><p>{draft.notes[key]}</p></details>}{advanced && <small>{FATE_FIELDS[key].filter(field => ['single', 'multi'].includes(field.control)).flatMap(field => { const v = value[field.path.split('.')[1]]; return Array.isArray(v) ? v : v ? [v] : []; }).slice(0, 4).join(' · ')}</small>}</div>; })}<small role="status">{savedDraft ? C.draft : C.saving}</small></aside>
        <main className="nw-main fw-main" ref={main} tabIndex={-1}>
          {finished ? <><h3>{finished.library ? C.savedBoth : C.savedGame}</h3><button type="button" className="btn primary" onClick={() => { onSaved?.(finished.id); onClose(); }}>{C.done}</button></> : <>
            {communication && draft.communication.profile && <section className="fp-profile-status"><b>{P.known}: {draft.communication.profile.name}</b>{(!profileSource || fateProfileSignature(profileSource) !== draft.communication.profile.signature) && <p>{profileSource ? P.changedProfile : P.missingProfile}</p>}{profileSource && fateProfileSignature(profileSource) !== draft.communication.profile.signature && <button type="button" className="btn" onClick={() => transition(current => linkFateListenerProfile(current, profileSource))}>{P.refreshProfile}</button>}<button type="button" className="linkbtn" onClick={() => edit('communication.profile', null)}>{P.unlinkProfile}</button></section>}
            {draft.lastStep === 'setup' && <>
              <p>{advanced ? C.advancedHelp : C.simpleHelp}</p>
              {sessions.length > 1 && <label className="nw-field">{C.savedWizard}<select aria-label={C.savedWizard} className="field-input" value={sessions.findIndex(item => item.record.sourceId === session?.record.sourceId && (item.record.sessionId ? item.record.sessionId === session?.record.sessionId : item.record.title === session?.record.title))} onChange={event => { keepDraft(); onContinueSession(event.target.value); }}>{sessions.map((item, index) => <option key={index} value={index}>{item.record.sourceLabel} — {item.record.title}</option>)}</select></label>}
              <FateTypePicker purpose={draft.meta.purpose} onChange={value => edit('meta.purpose', value)} disabled={!!record} />
              <label className="nw-field">{C.titleLabel}<input className="field-input" value={draft.title} onChange={event => edit('title', event.target.value)} /></label>
              <details open={!FATE_TYPES[draft.meta.purpose]}><summary>{P.otherUses}</summary><label className="nw-field">{C.purpose}<select aria-label={C.purpose} className="field-input" disabled={!!record} value={draft.meta.purpose} onChange={event => edit('meta.purpose', event.target.value)}>{Object.entries(NARRATIVE_FOCUSES).map(([key, value]) => <option key={key} value={key}>{FATE_TYPES[key]?.label || value.label}</option>)}</select></label></details>
              {textEntry(C.context, draft.context, value => edit('context', value))}
              <p className="nw-help">{character ? P.profileContext : P.contextHelp}</p>
              {communication && <section className="fp-conversation-setup">
                {textEntry(P.speaker, draft.communication.speaker, value => edit('communication.speaker', value), 1)}
                {textEntry(P.listener, draft.communication.listener, value => edit('communication.listener', value), 1)}
                {textEntry(P.relation, draft.communication.relationship, value => edit('communication.relationship', value), 2)}
                {textEntry(P.goal, draft.communication.goal, value => edit('communication.goal', value), 2)}
                <details><summary>{C.linked}</summary>{[['speaker', P.speakerLink], ['listener', P.listenerLink]].map(([role, label]) => <label className="nw-field" key={role}>{label}<select aria-label={label} className="field-input" value={draft.communication[`${role}Ref`]} onChange={event => { const key = event.target.value, entity = entities.find(row => row.key === key); transition(current => { let next = editFate(current, `communication.${role}Ref`, key); return entity ? editFate(next, `communication.${role}`, entity.name) : next; }); }}><option value="">{C.unset}</option>{entities.map(entity => <option key={entity.key} value={entity.key}>{entity.name} · {entity.type}</option>)}</select></label>)}</details>
                {profiles.length > 0 && <details><summary>{P.profile}</summary><p>{P.profileHelp}</p><label className="nw-field">{P.profilePick}<select aria-label={P.profilePick} className="field-input" value={selectedProfile} onChange={event => setSelectedProfile(event.target.value)}><option value="">{C.unset}</option>{profiles.map(model => <option key={model.key} value={model.key}>{model.entity.name} · {model.record.title}</option>)}</select></label><button type="button" className="btn" disabled={!selectedProfile} onClick={() => transition(current => linkFateListenerProfile(current, profiles.find(model => model.key === selectedProfile)))}>{P.useProfile}</button></details>}
              </section>}
              <label className="nw-field">{P.destination}<select aria-label={P.destination} className="field-input" disabled={!!record} value={target ? JSON.stringify([scope.coll || 'nodes', ...(scope.parentPath || (scope.parentId ? [scope.parentId] : [])), target.id]) : ''} onChange={event => {
                const entity = entities.find(entity => entity.key === event.target.value);
                edit('workspace', entity ? { ...draft.workspace, targetId: entity.ref.path.at(-1), scope: { coll: entity.ref.coll, parentPath: entity.ref.path.slice(0, -1) }, scopeKey: fateScopeKey({ coll: entity.ref.coll, parentPath: entity.ref.path.slice(0, -1) }), sessionId: null } : { ...draft.workspace, targetId: '', sessionId: null });
              }}><option value="">{communication ? P.separateConversation : character ? P.separateProfile : C.newResult}</option>{entities.filter(entity => ['nodes', 'masterNodes'].includes(entity.ref.coll)).map(entity => <option key={entity.key} value={entity.key}>{C.attach}: {entity.name}</option>)}</select></label>
              <p className="nw-help">{P.destinationHelp}</p>
              <details className="fw-drafts"><summary>{C.drafts}</summary><label className="nw-field">{C.drafts}<select aria-label={C.drafts} className="field-input" value={selectedDraft} onChange={event => setSelectedDraft(event.target.value)}><option value="">{C.unset}</option>{Object.values(game.fateWizardDrafts || {}).filter(item => item.id !== draft.id && item.schemaVersion === 1).map(item => <option key={item.id} value={item.id}>{item.title || C.notStarted} · {NARRATIVE_FOCUSES[item.meta.purpose]?.label}</option>)}</select></label><button type="button" className="btn" disabled={!selectedDraft} onClick={() => loadDraft(selectedDraft)}>{C.drafts}</button><button type="button" className="btn" onClick={() => fresh()}>{C.fresh}</button><p>{C.draftHelp}</p></details>
              {models.length > 0 && <details><summary>{C.startFrom}</summary><label className="nw-field">{C.startFrom}<select aria-label={C.startFrom} className="field-input" value={selectedModel} onChange={event => setSelectedModel(event.target.value)}><option value="">{C.unset}</option>{models.map(model => <option key={model.key} value={model.key}>{model.entity.name} · {model.record.title}</option>)}</select></label><button type="button" className="btn" disabled={!selectedModel} onClick={() => fresh(models.find(model => model.key === selectedModel))}>{C.duplicate}</button></details>}
              {advanced && <>
                <FateChoices field={{ path: 'meta.mode', label: C.mode, control: 'single', options: [C.build, C.diagnose] }} value={draft.meta.mode === 'diagnose' ? C.diagnose : C.build} preferences={EMPTY} onChange={value => edit('meta.mode', value === C.diagnose ? 'diagnose' : 'build')} onRemember={() => {}} />
                {draft.meta.mode === 'diagnose' && <>{entityPicker(C.diagnoseSource, 'meta.source')}<p className="nw-help">{C.diagnosisHelp}</p>{draft.meta.source && <details open><summary>{C.sourceText}</summary><p className="fw-source-description">{entities.find(entity => entity.key === draft.meta.source)?.description || C.missingEntity}</p></details>}</>}
                {entityPicker(C.influencer, 'meta.influencers', true)}{entityPicker(C.targets, 'meta.targets', true)}
                {textEntry(C.otherEntity, draft.meta.otherEntities, value => edit('meta.otherEntities', value), 2)}
                {selectEntry(C.outcome, draft.meta.outcome, FATE_OUTCOMES, value => edit('meta.outcome', value))}{textEntry(C.outcomeDetail, draft.meta.outcomeText, value => edit('meta.outcomeText', value), 2)}
                <FateField field={{ path: 'meta.intensity', label: C.intensity, control: 'scale', options: ['Quiet', 'Noticeable', 'Confronting', 'A crisis', 'Everything is at stake'] }} draft={{ ...draft, meta: { ...draft.meta, intensity: draft.meta.intensity === null ? null : draft.meta.intensity - 1 } }} onEdit={(path, value) => edit(path, value === null ? null : value + 1)} preferences={EMPTY} onRemember={() => {}} entities={entities} />
                <fieldset className="fw-weighting"><legend>{C.weighting}</legend>{draft.meta.weighting.map((key, index) => <div key={key}><b>{FATE_STEPS.find(step => step.key === key).name}</b>{[-1, 1].map(delta => <button type="button" className="btn" key={delta} aria-label={`${delta < 0 ? C.up : C.down}: ${key}`} disabled={index + delta < 0 || index + delta > 3} onClick={() => { const next = [...draft.meta.weighting]; [next[index], next[index + delta]] = [next[index + delta], next[index]]; edit('meta.weighting', next); }}>{delta < 0 ? '↑' : '↓'}</button>)}</div>)}</fieldset>
                {calibration()}
              </>}
              <details><summary>{C.preferences}</summary><p>{C.clearHelp}</p><button type="button" className="btn" onClick={() => dispatch({ type: 'SET_FATE_PREFERENCES', preferences: {} })}>{C.clearPreferences}</button></details>
              <button type="button" className="linkbtn" onClick={() => { keepDraft(); onBack(); }}>{C.chooseSource}</button>
            </>}
            {pillar && <>
              <p className="nw-guidance"><b>{C.earlier}</b>{fateBanner(draft, pillar, entities)}</p>
              {communication && <FateProfileGuidance draft={draft} pillar={pillar} />}
              <details className="fw-all-context"><summary>{C.allContext}</summary>{['F', 'A', 'T', 'E'].map(key => { const item = FATE_STEPS.find(step => step.key === key); return <section key={key}><h4>{item.name}</h4><p className="fw-source-description">{draft[item.section].anchor || C.notStarted}</p>{draft.notes[key] && <p className="fw-source-description">{draft.notes[key]}</p>}<button type="button" className="linkbtn" onClick={() => go(key)}>{item.name}</button></section>; })}{linkedEntities.map(entity => <section key={entity.key}><b>{entity.name}</b><p className="fw-source-description">{entity.description}</p></section>)}</details>
              {priorRecords.length > 0 && <details><summary>{C.priorWork}</summary>{priorRecords.map(record => <section key={record.sessionId || record.sourceId}><b>{record.sourceLabel}{record.answers?.archetype ? ` · ${record.answers.archetype}` : ''}</b><p className="fw-source-description">{record.summary}</p></section>)}</details>}
              <div className="fw-pillar-header"><h3>{FATE_PURPOSE_LABELS[draft.meta.purpose][stepIndex - 1]}</h3><button type="button" className="btn" aria-pressed={!!locked} onClick={() => edit(`meta.locks.${pillar}`, !locked)}>{locked ? C.unlock : C.lock}</button></div>
              <fieldset className="fw-pillar-fields" disabled={!!locked}><legend className="sr-only">{step.name}</legend>
                {textEntry(FATE_PURPOSE_LABELS[draft.meta.purpose][stepIndex - 1], draft[step.section].anchor, value => edit(`${step.section}.anchor`, value), 3)}
                <p className="nw-help">{P.summaryHelp}</p>
                {fateFieldsFor(draft.meta.purpose, pillar).filter(item => item.simple).map(field)}
                {advanced && <details className="fw-deeper" open><summary>{C.deeper}</summary>{fateFieldsFor(draft.meta.purpose, pillar).filter(item => !item.simple).map(field)}</details>}
                {character && pillar === 'E' && <FateEmotionPatterns draft={draft} onEdit={edit} onAdd={() => transition(current => addFateEmotionPattern(current))} preferences={preferences} onRemember={remember} />}
                {communication && <section className="fp-spoken-part">{textEntry(P.words, draft.communication.lines[pillar], value => edit(`communication.lines.${pillar}`, value), 3)}<p>{P.wordsHelp}</p>{pillar === 'E' && <>{textEntry(P.listenerReply, draft.communication.listenerReply, value => edit('communication.listenerReply', value), 3)}<p>{P.replyHelp}</p></>}</section>}
                <details><summary>{C.notes}</summary>{textEntry(C.notes, draft.notes[pillar], value => edit(`notes.${pillar}`, value))}<small>{C.notesHelp}</small></details>
              </fieldset>
              <p className="nw-help">{P.optional}</p>
              <FateSelectedIdeas draft={draft} />
              {!locked && <details className="fw-suggestions"><summary>{C.suggest} ({suggestions.length})</summary><p>{C.suggestionHelp}</p>{suggestions.length ? suggestions.map(suggestion => <div key={suggestion.id}><b>{FATE_FIELDS[pillar].find(item => item.path === suggestion.path)?.label}</b><p>{formatValue(suggestion.proposed)} — {suggestion.reason}</p><button type="button" className="btn" onClick={() => transition(current => acceptFateSuggestion(current, suggestion))}>{C.accept}</button></div>) : <p>{C.noSuggestions}</p>}</details>}
            </>}
            {stale.length > 0 && <section className="fw-stale"><h4>{C.reviewField}</h4>{stale.map(([path, meta]) => { const item = Object.values(FATE_FIELDS).flat().find(item => item.path === path), suggestion = fateSuggestions(draft).find(item => item.path === path); return <div key={path}><b>{item?.label || path}</b><p>{Object.entries(meta.basedOn || {}).map(([key, before]) => `${C.basedOn}: ${formatValue(before)} → ${C.now}: ${formatValue(getFate(draft, key))}`).join('; ')}</p><button type="button" className="btn" onClick={() => transition(current => keepFateField(current, path))}>{C.keep}</button>{suggestion && <button type="button" className="btn" onClick={() => transition(current => acceptFateSuggestion(current, suggestion))}>{C.update}</button>}</div>; })}</section>}
            {draft.lastStep === 'review' && <>
              <FateSelectedIdeas draft={draft} />
              {advanced && <FateCompletionChart draft={draft} />}
              {draft.meta.mode === 'diagnose' && <p className="nw-help">{C.diagnosisHelp}</p>}
              <label className="nw-field">{C.titleLabel}<input className="field-input" value={draft.title} onChange={event => edit('title', event.target.value)} /></label>
              {advanced && <div className="fw-output-options">{selectEntry(C.format, draft.output.format, FATE_FORMATS.filter(format => communication || format !== 'Spoken dialogue'), value => edit('output.format', value))}{selectEntry(C.tone, draft.output.tone, FATE_TONES, value => edit('output.tone', value))}{selectEntry(C.length, draft.output.length, FATE_LENGTHS, value => edit('output.length', value))}</div>}
              {textEntry(character ? C.characterOutput : draft.meta.mode === 'diagnose' ? C.gaps : communication ? P.dialogue : C.output, output, value => edit('output.text', value), 12)}
              {communication && <details><summary>{P.design}</summary><div className="fp-design-notes">{fateDesignNotes(draft)}</div></details>}<p className="nw-help">{communication ? P.wordsHelp : C.outputHelp}</p>{draft.output.text !== undefined && <><p>{C.edited}</p><button type="button" className="btn" onClick={() => { if (window.confirm(C.confirmRebuild)) edit('output.text', undefined); }}>{C.rebuild}</button></>}
              <details className="fw-checks" open={draft.meta.mode === 'diagnose'}><summary>{C.checks} ({checks.length})</summary>{checks.length ? checks.map(check => <div key={check.id}><p>{check.message}</p>{check.suggestion && <p>{check.suggestion}</p>}<button type="button" className="linkbtn" onClick={() => go(check.pillar)}>{FATE_STEPS.find(step => step.key === check.pillar).name}</button><button type="button" className="linkbtn" onClick={() => edit('dismissedWarnings', [...draft.dismissedWarnings, check.id])}>{C.keep}</button></div>) : <p>{C.noChecks}</p>}</details>
              <details><summary>{C.details}</summary>{['F', 'A', 'T', 'E'].map(key => <section key={key}><h4>{FATE_STEPS.find(step => step.key === key).name}</h4><p>{summarizeFateStep(draft, key)}</p><dl>{FATE_FIELDS[key].map(item => { const value = getFate(draft, item.path); return value !== null && value !== '' && (!Array.isArray(value) || value.length) && item.control !== 'board' && item.control !== 'curve' ? <div key={item.path}><dt>{item.label}</dt><dd>{formatValue(value)}</dd></div> : null; })}</dl><p>{draft.notes[key]}</p></section>)}</details>
              {advanced && calibration()}
              {advanced && draft.meta.intensity >= 4 && linked(draft.meta.targets).some(entity => entity.type === 'players' || entity.type === 'teams') && <p className="nw-help">{C.playerReminder}</p>}
            </>}
            {pillar && <details className="fw-inline-preview"><summary>{C.preview}</summary><p>{output || (communication ? P.dialogueEmpty : C.previewEmpty)}</p>{communication && <div className="fp-design-notes">{fateDesignNotes(draft)}</div>}</details>}
          </>}
        </main>
        {!finished && <aside className="fw-live-preview"><small>{draft.meta.mode === 'diagnose' ? C.gaps : C.preview}</small><p>{output || (communication ? P.dialogueEmpty : C.previewEmpty)}</p><FateSelectedIdeas draft={draft} />{communication && <details open><summary>{P.design}</summary><div className="fp-design-notes">{fateDesignNotes(draft)}</div></details>}<details><summary>{C.linked}</summary>{linkedEntities.map(entity => <section key={entity.key}><b>{entity.name}</b><p>{entity.description}</p></section>)}</details></aside>}
      </div>
      {!finished && <footer className="nw-footer"><button type="button" className="btn" onClick={() => stepIndex ? go(FATE_STEPS[stepIndex - 1].key) : close()}>{C.back}</button><span>{savedDraft ? C.draft : C.saving}</span>{draft.lastStep === 'review' ? <><button type="button" className="btn" disabled={!resultReady} onClick={() => save(false)}>{C.saveGame}</button><button type="button" className="btn primary" disabled={!resultReady} onClick={() => save(true)}>{C.saveLibrary}</button></> : <><button type="button" className="btn" onClick={() => go('review')}>{C.reviewNow}</button><button type="button" className="btn primary" onClick={next}>{stepIndex === 4 ? C.review : C.next}</button></>}</footer>}
    </div>
  </dialog>, document.body);
}
