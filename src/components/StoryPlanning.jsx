import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useGame } from '../state/store.jsx';
import { PLOT_STRUCTURES, storyDirection, storyPlanning, storyPlanningPreview, storyPlanningRefKey, storyPlanningTargets } from '../lib/storyPlanning.js';
import { storyBeatDetails } from '../lib/storyBeat.js';
import { StoryBeatReviewFields, StoryDirectionFields } from './StoryPlanningFields.jsx';
import './StoryPlanning.css';

export function StoryPlanningButton({ label = 'Story direction', initialTab = 'direction', className = 'btn' }) {
  const [open, setOpen] = useState(false);
  return <><button type="button" className={className} onClick={() => setOpen(true)}>{label}</button>{open && <StoryPlanningDialog initialTab={initialTab} onClose={() => setOpen(false)} />}</>;
}

export default function StoryPlanningDialog({ initialTab = 'direction', onClose }) {
  const game = useGame(), dispatch = useDispatch(), ref = useRef(null);
  const [tab, setTab] = useState(initialTab), [active, setActive] = useState(null), [showResolved, setShowResolved] = useState(false);
  const planning = storyPlanning(game.meta.storyPlanning), direction = storyDirection(planning.direction);
  const structure = PLOT_STRUCTURES.find(row => row.id === planning.activeStructure), plan = planning.plans[structure.id] || {};
  const targets = storyPlanningTargets(game);
  const preview = storyPlanningPreview(planning);
  const update = change => dispatch({ type: 'PATCH_STORY_PLANNING', change });
  const close = () => { document.activeElement?.blur?.(); onClose(); };
  useEffect(() => {
    const element = ref.current, previous = document.activeElement;
    element.showModal();
    return () => { element.close(); previous?.focus?.(); };
  }, []);
  const threadTargets = targets.filter(row => row.node.kind !== 'masterAct' && storyBeatDetails(row.node).threads.some(thread => showResolved || thread.status !== 'resolved'));
  return createPortal(<dialog ref={ref} className="story-planning-dialog" aria-label="Story direction and plot structure" onCancel={event => { event.preventDefault(); event.stopPropagation(); close(); }}>
    <header><div><small>{game.meta.name} · Master Story</small><h2>Story direction</h2></div><button type="button" className="btn" onClick={close}>Close</button></header>
    <nav className="story-planning-tabs" aria-label="Story planning sections">{[['direction', 'Themes & tone'], ['plot', 'Plot structure'], ['threads', 'Open threads']].map(([id, label]) => <button type="button" key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>)}</nav>
    {tab === 'direction' && <div className="story-planning-direction"><h3>What idea or tension does this event explore?</h3><StoryDirectionFields value={planning.direction} onPatch={direction => update({ direction })} /><div className="story-direction-acts"><h3>Acts</h3>{Object.values(game.masterNodes || {}).filter(node => node.kind === 'masterAct').map(node => <details key={node.id}><summary>{node.title || node.id}</summary><StoryDirectionFields value={node.storyDirection} inherited={direction} onPatch={patch => dispatch({ type: 'GRAPH_UPDATE_NODE', scope: { coll: 'masterNodes' }, id: node.id, patch: { storyDirection: { ...node.storyDirection, ...patch } } })} /></details>)}</div></div>}
    {tab === 'plot' && <>
      <div className="story-structure-choices" role="group" aria-label="Choose plot structure">{PLOT_STRUCTURES.map(option => <button type="button" key={option.id} aria-pressed={structure.id === option.id} onClick={() => { update({ activeStructure: option.id }); setActive(null); }}><b>{option.label}</b><span>{option.short}</span></button>)}</div>
      <div className="story-plot-workspace"><main className="story-plot-board"><p className="story-plot-intro">{structure.description}</p><div className="story-stage-grid">{structure.stages.map((stage, index) => {
        const answers = plan.answers?.[stage.id] || {}, linked = plan.links?.[stage.id], live = targets.find(row => storyPlanningRefKey(row) === storyPlanningRefKey(linked));
        const count = stage.questions.filter(question => answers[question.id]?.trim()).length;
        return <article className={`story-stage-card${active === stage.id ? ' active' : ''}`} key={`${structure.id}:${stage.id}`} style={{ '--stage-color': stage.color }} onFocus={() => setActive(stage.id)}>
          <header><span className="story-stage-symbol" aria-hidden="true">{stage.symbol}</span><div><small>Stage {index + 1} · {count}/{stage.questions.length} answers</small><h3>{stage.title}</h3></div></header>
          {stage.questions.map(question => <label className="cp-field" key={question.id}>{question.prompt}<textarea className="field-input" value={answers[question.id] || ''} rows={3} onChange={event => update({ structure: structure.id, stage: stage.id, question: question.id, value: event.target.value })} /></label>)}
          <details className="story-stage-link"><summary>{linked ? `Linked: ${live?.title || linked.title || 'Missing beat / act'}${!live ? ' · unavailable' : ''}` : 'Link an Act or Story Beat · optional'}</summary>
            <label className="cp-field">Act or Story Beat<select className="field-input" value={live ? storyPlanningRefKey(live) : linked ? 'missing' : ''} onChange={event => { const target = targets.find(row => storyPlanningRefKey(row) === event.target.value); update({ structure: structure.id, stage: stage.id, link: target ? { coll: target.coll, parentPath: target.parentPath, nodeId: target.nodeId, title: target.title } : null }); }}><option value="">No link</option>{linked && !live && <option value="missing">{linked.title || linked.nodeId} · unavailable</option>}{targets.map(row => <option key={storyPlanningRefKey(row)} value={storyPlanningRefKey(row)}>{row.label}</option>)}</select></label>
          </details>
        </article>;
      })}</div></main><aside className="story-plot-preview" aria-label="Live story overview"><h3>Story at a glance</h3>{direction.themes.length > 0 && <p><b>Ideas:</b> {direction.themes.join(' · ')}</p>}{direction.tones.length > 0 && <p><b>Tone:</b> {direction.tones.join(' · ')}</p>}{preview.length ? preview.map(stage => <section className={active === stage.id ? 'active' : ''} key={stage.id} style={{ '--stage-color': stage.color }}><h4>{stage.title}</h4>{stage.passages.map(row => <p key={row.id}>{row.answer}</p>)}</section>) : <p className="dim">Your answers appear here as you develop the stages. Every question is optional.</p>}</aside></div>
    </>}
    {tab === 'threads' && <div className="story-open-thread-board"><div className="story-thread-filters"><label><input type="checkbox" checked={showResolved} onChange={event => setShowResolved(event.target.checked)} />Include resolved threads</label></div>
      {!threadTargets.length && <p className="dim">No open threads. Add one from a Story Beat’s Open threads section.</p>}
      {threadTargets.map(row => <article key={storyPlanningRefKey(row)}><h3>{row.title}</h3><small>{row.label}</small><StoryBeatReviewFields node={row.node} initialOpen showResolved={showResolved} hideImpacts onPatch={patch => dispatch({ type: 'GRAPH_UPDATE_NODE', scope: { coll: row.coll, parentPath: row.parentPath }, id: row.nodeId, patch })} /></article>)}
    </div>}
    <footer>Optional planning · edits save to this game · Undo restores changes</footer>
  </dialog>, document.body);
}
