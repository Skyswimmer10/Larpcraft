import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGame, useDispatch, useLibrary, useLibraryDispatch } from '../state/store.jsx';
import { locateGraph } from '../state/reducer.js';
import { genId } from '../data/csvSchemas.js';
import { GROUP_KINDS, GROUP_STEPS, GROUP_QUESTIONS, GROUP_FOUNDATIONS_ID, groupFacts, groupFoundationsText, groupFactsText, refreshGroupFacts } from '../lib/groupFoundations.js';
import { saveGroupResult } from '../lib/groupProfile.js';
import { savedWizardSession } from '../lib/narrativeMemory.js';
import { syncCharacterProfile, characterWizardRecords } from '../lib/characterProfile.js';
import { wizardLibraryRecord } from '../lib/narrativeWizard.js';
import { visibleCanvasPlacement } from './FlowCanvas.jsx';
import GroupMembers from './GroupMembers.jsx';
import './GroupProfile.css';

export function GroupWizardButton({ node, scope = { coll: 'nodes' }, record, startStep, label = 'Group Foundations', className = 'btn' }) {
  const [open, setOpen] = useState(false);
  return <><button type="button" className={className} onClick={() => setOpen(true)}>{label}</button>{open && <GroupWizard targetId={node?.id} scope={scope} record={record} startStep={startStep} onClose={() => setOpen(false)} />}</>;
}

export default function GroupWizard({ targetId = '', scope = { coll: 'nodes' }, record: requestedRecord, startStep, onClose, onSaved, onBack }) {
  const game = useGame(), dispatch = useDispatch(), library = useLibrary(), libraryDispatch = useLibraryDispatch();
  const graph = locateGraph(game, scope), target = graph.nodes[targetId];
  const record = requestedRecord || characterWizardRecords(target).reverse().find(row => row.sourceId === GROUP_FOUNDATIONS_ID);
  const key = JSON.stringify([scope.coll, ...(scope.parentPath || (scope.parentId ? [scope.parentId] : [])), targetId, record?.sessionId || 'new']);
  const [draft, setDraft] = useState(() => {
    const saved = game.groupWizardDrafts?.[key];
    if (saved) return { ...saved, step: startStep || saved.step };
    const session = record && target && savedWizardSession(target, library, record);
    return { schemaVersion: 1, id: key, title: target?.title || '', facts: groupFacts(target || {}), answers: session?.answers || {}, step: startStep || 'start' };
  });
  const [showDrafts, setShowDrafts] = useState(false);
  const dialog = useRef(null), main = useRef(null), stopped = useRef(false), latest = useRef(draft);
  latest.current = draft;
  const facts = refreshGroupFacts({ groupFacts: draft.facts }, game).groupFacts;
  const steps = GROUP_STEPS.filter(step => step.key !== 'institution' || facts.institution);
  const stepIndex = Math.max(0, steps.findIndex(s => s.key === draft.step)), step = steps[stepIndex];
  const preview = groupFoundationsText(draft.answers, { institution: !!facts.institution });
  const previewNode = { title: draft.title, groupFacts: facts };
  const description = groupLiveDescription(previewNode, preview);
  const edit = patch => setDraft(current => ({ ...current, ...patch }));
  const answer = (key, value) => setDraft(current => ({ ...current, answers: { ...current.answers, [key]: value } }));
  const keep = () => { if (!stopped.current) dispatch({ type: 'SAVE_GROUP_DRAFT', draft: { ...latest.current, scope, targetId, sessionId: record?.sessionId || null } }); };
  const close = () => { keep(); onClose(); };
  useEffect(() => { const previous = document.activeElement, element = dialog.current; element.showModal(); return () => { element.close(); previous?.focus?.(); }; }, []);
  useEffect(() => { if (stopped.current) return; const timer = setTimeout(keep, 400); return () => clearTimeout(timer); }, [draft, dispatch]);
  useEffect(() => { main.current?.scrollTo(0, 0); main.current?.focus(); }, [draft.step]);
  const save = includeLibrary => {
    if (stopped.current || !draft.title.trim() || targetId && target?.kind !== 'group') return;
    const id = target?.id || genId(graph.nodes, `${game.meta.prefix}-GROUP-`);
    let node = saveGroupResult(target, { id, title: draft.title.trim(), facts, answers: draft.answers, position: visibleCanvasPlacement({ x: 100, y: 100 }) }, record);
    node = syncCharacterProfile(node, graph);
    stopped.current = true;
    dispatch({ type: 'BATCH', actions: [target ? { type: 'GRAPH_UPDATE_NODE', scope, id, patch: node } : { type: 'GRAPH_ADD_NODE', scope, node }, { type: 'REMOVE_GROUP_DRAFT', id: draft.id }] });
    if (includeLibrary) libraryDispatch({ type: 'ADD_ENTITY', ...wizardLibraryRecord(node, genId(library.narrative || {}, 'LIB-GROUP-')) });
    onSaved?.(id); onClose();
  };
  return createPortal(<dialog ref={dialog} className="narrative-wizard nw-fullscreen group-wizard" aria-labelledby="group-wizard-title" onCancel={e => { e.preventDefault(); e.stopPropagation(); close(); }}>
    <div className="nw-shell"><header className="nw-header"><div><small>Larpcraft authoring guide</small><h2 id="group-wizard-title">Group Foundations · {step.label}</h2></div><div className="cp-actions"><button type="button" className="btn small" aria-expanded={showDrafts} onClick={() => setShowDrafts(!showDrafts)}>Drafts</button><button type="button" className="btn" onClick={close}>Close</button></div></header>
      {showDrafts && <div className="group-drafts"><p>This draft is restored when you reopen this group or start Group Foundations from this canvas. Drafts do not change saved profiles.</p><button type="button" className="btn small" onClick={() => {
        if (!window.confirm('Discard these unsaved changes and reload the saved group answers?')) return;
        const session = record && target && savedWizardSession(target, library, record);
        setDraft({ schemaVersion: 1, id: key, title: target?.title || '', facts: groupFacts(target || {}), answers: session?.answers || {}, step: 'start' });
      }}>Reload saved answers</button></div>}
      <div className="group-wizard-body"><nav className="fc-step-nav" aria-label="Group Foundations steps">{steps.map(item => <button type="button" key={item.key} style={{ '--fate-accent': item.color }} aria-current={step.key === item.key ? 'step' : undefined} onClick={() => edit({ step: item.key })}>{item.label}</button>)}</nav>
        <main ref={main} className="nw-main" tabIndex={-1}>
          {targetId && target?.kind !== 'group' && <p role="alert">The original group is unavailable. Your draft is retained.</p>}
          {step.key === 'start' && <><p>Build a family, band, guild, faction or institution. Every question is optional; give the group a name when saving.</p><GroupBasicFields title={draft.title} facts={facts} onTitle={title => edit({ title })} onFacts={next => edit({ facts: next })} /><p className="nw-help">This is a Larpcraft synthesis informed by Group Dynamics Atlas. It does not impose fixed group stages or predict how members will behave.</p></>}
          {step.key === 'members' && <><h3>Who belongs, and what place do they have?</h3><GroupMembers facts={facts} game={game} ownerRef={target ? { coll: scope.coll, path: [...(scope.parentPath || (scope.parentId ? [scope.parentId] : [])), target.id] } : null} onChange={next => edit({ facts: next })} /></>}
          {GROUP_QUESTIONS.filter(q => q.step === step.key).map(q => <section className="group-question" key={q.key}><h3>{q.prompt}</h3>{q.choices && <div className="nw-choices">{q.choices.map(choice => {
            const selected = (draft.answers[q.choiceAnswerKey] || '').split(' | ').filter(Boolean);
            return <button type="button" className="btn" aria-pressed={selected.includes(choice)} key={choice} onClick={() => answer(q.choiceAnswerKey, (selected.includes(choice) ? selected.filter(v => v !== choice) : [...selected, choice]).join(' | '))}>{choice}</button>;
          })}</div>}<label className="nw-field">{q.choices ? 'Your detail or example · optional' : 'Your answer · optional'}<textarea className="field-input" rows={3} value={draft.answers[q.key] || ''} onChange={e => answer(q.key, e.target.value)} /></label>{q.step === 'pressure' && q.key !== 'tensions' && <small>These are possibilities, not events that have already happened.</small>}</section>)}
          {step.key === 'review' && <><h3>{draft.title || 'Your group'}</h3><p className="group-prose">{description || 'Choose any useful ideas to begin the description.'}</p><p>Save keeps every answer editable and fills the Group Foundations node tree.</p>{target?.characterProfile?.manualDescription !== undefined && <p className="nw-help">Your edited group description is protected. The profile will offer the updated description for review.</p>}</>}
          {step.key !== 'start' && <p className="nw-help">Leave anything that does not help this group blank.</p>}
        </main>
        <aside className="group-live-preview" aria-label="Live group description"><h3>Live group description</h3><p className="group-prose">{description || 'Your group description updates as you make selections.'}</p><p className="hint">Members can disagree. Recorded roles and possible developments are not fixed outcomes.</p></aside>
      </div>
      <footer className="nw-footer"><button type="button" className="btn" onClick={() => stepIndex ? edit({ step: steps[stepIndex - 1].key }) : onBack ? (keep(), onBack()) : close()}>Back</button><span>Draft kept locally</span>{step.key === 'review' ? <><button type="button" className="btn" disabled={!draft.title.trim() || !!targetId && target?.kind !== 'group'} onClick={() => save(false)}>Save to game</button><button type="button" className="btn primary" disabled={!draft.title.trim() || !!targetId && target?.kind !== 'group'} onClick={() => save(true)}>Save to library + game</button></> : <><button type="button" className="btn" onClick={() => edit({ step: 'review' })}>Review description</button><button type="button" className="btn primary" onClick={() => edit({ step: steps[stepIndex + 1].key })}>Next step</button></>}</footer>
    </div>
  </dialog>, document.body);
}

export function groupLiveDescription(node, foundationText) { return [groupFactsText(node), foundationText].filter(Boolean).join('\n\n'); }
export function GroupBasicFields({ title, facts, onTitle, onFacts }) {
  return <section aria-label="Group details"><label className="nw-field">Group name<input className="field-input" value={title} onChange={e => onTitle(e.target.value)} /></label>
    <label className="nw-field">Kind of group<input className="field-input" list="group-kind-options" value={facts.kind} onChange={e => onFacts({ ...facts, kind: e.target.value })} /><datalist id="group-kind-options">{GROUP_KINDS.map(kind => <option key={kind} value={kind} />)}</datalist></label>
    <label className="nw-field">Approximate size<input className="field-input" placeholder="3, about 80, several hundred…" value={facts.size} onChange={e => onFacts({ ...facts, size: e.target.value })} /></label>
    <label className="nw-field">Brief shared purpose<input className="field-input" placeholder="Protect the caravan…" value={facts.purpose} onChange={e => onFacts({ ...facts, purpose: e.target.value })} /></label>
    <label className="cp-check"><input type="checkbox" checked={facts.institution} onChange={e => onFacts({ ...facts, institution: e.target.checked })} />Include optional institution details</label>
  </section>;
}
