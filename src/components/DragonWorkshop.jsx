import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PrimIcon } from './bits.jsx';
import { DRAGON_FIELDS, DRAGON_STEPS, DRAGON_ROUTES, dragonKey, dragonPassages, graphNodeAt } from '../lib/dragonWorkshop.js';
import './DragonWorkshop.css';

const titleCase = value => value[0].toUpperCase() + value.slice(1);
const routeIcon = route => ({ escape: 'pin', defend: 'shield', attack: 'zap' }[route]);

function ResponseIllustration({ route }) {
  return <svg className="dragon-response-illustration" viewBox="0 0 240 240" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
    {route === 'escape' && <><path d="M32 196V54h82v142M24 196h104M64 54v142" /><path d="M104 140h104m-30-30 30 30-30 30" strokeWidth="9" /><circle cx="144" cy="58" r="12" fill="currentColor" stroke="none" /><path d="m137 82-18 26-24 5m42-31 19 22 24-6m-43-16-8 49 24 22 10 34m-34-56-22 33-28 15" strokeWidth="8" /><path d="M42 210h144" opacity=".5" /></>}
    {route === 'defend' && <><path d="m120 24 76 28v59c0 46-31 77-76 104-45-27-76-58-76-104V52Z" fill="currentColor" fillOpacity=".18" /><path d="M75 143V91h18v15h18V91h18v15h18V91h18v52ZM104 143v-20a16 16 0 0 1 32 0v20" /><path d="M120 43v25M64 61l13 5m99-5-13 5" opacity=".6" /></>}
    {route === 'attack' && <><path d="m62 34 78 78-22 22-78-78-5-27ZM178 34l-78 78 22 22 78-78 5-27Z" fill="currentColor" fillOpacity=".18" /><path d="m93 105 43 43m-9-9 43 43m-75-43-25 25m-18-18 36 36m59-77-43 43m9-9-43 43m75-43 25 25m-18 18 36-36" strokeWidth="8" /><path d="M120 26v25M209 98l-24 9M31 98l24 9m65 83v26" opacity=".7" /></>}
  </svg>;
}

export function DragonAnswerField({ row, value, active, onAnswer, onFocus }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const element = ref.current;
    const resize = () => { element.style.height = 'auto'; element.style.height = `${Math.max(88, element.scrollHeight + 2)}px`; };
    resize();
    if (typeof ResizeObserver === 'undefined') return;
    let width = element.getBoundingClientRect().width;
    const observer = new ResizeObserver(entries => { const next = entries[0].contentRect.width; if (next !== width) { width = next; resize(); } });
    observer.observe(element);
    return () => observer.disconnect();
  }, [value]);
  return <label className={`dragon-field${active ? ' active' : ''}`}>{row.prompt}
    {row.hint && <small>{row.hint}</small>}
    <textarea ref={ref} data-dragon-answer={row.key} className="field-input" rows={3} value={value || ''} onChange={event => onAnswer(row.key, event.target.value)} onFocus={() => onFocus(row)} placeholder="Your answer · optional" />
  </label>;
}

export function DragonLiveDescription({ answers, questions, activeKey, section, route, onSelect }) {
  const passages = dragonPassages(answers, questions);
  const active = questions.find(row => row.key === activeKey);
  return <aside className="dragon-live" aria-label="Live concept description"><small>LIVE DESCRIPTION</small><h3>{answers[dragonKey('city')] || 'Your dilemma'}</h3>
    <div className="dragon-editing" aria-live="polite">{active ? `Editing: ${active.prompt}` : 'Select a section or an answer'}</div>
    {passages.length ? passages.map(passage => <button type="button" key={passage.id} data-dragon-tone={passage.id} className={`dragon-passage${(passage.id === section || section === 'responses' && passage.id === route) ? ' active' : ''}`} onClick={event => {
      const key = event.target.closest('[data-dragon-part]')?.dataset.dragonPart;
      onSelect(key || passage.parts[0].key);
    }}><small>{passage.label}{DRAGON_ROUTES.includes(passage.id) ? ' · possible response' : ''}</small>{passage.parts.map((part, index) => <React.Fragment key={part.key}>{index > 0 && ' '}<span data-dragon-part={part.key} className={activeKey === part.key ? 'dragon-highlight' : ''}>{part.text}{/[.!?]$/u.test(part.text) ? '' : '.'}</span></React.Fragment>)}</button>) : <p className="hint">Your story updates here as you answer. Leave any question blank and return later.</p>}
    <section className="dragon-glance"><h4>Concept at a glance</h4><dl><dt>City</dt><dd>{answers[dragonKey('city')] || 'Not described yet'}</dd><dt>Dragon</dt><dd>{answers[dragonKey('dragon')] || 'Not described yet'}</dd><dt>Responses</dt><dd>Escape · Defend · Attack</dd></dl></section>
    <small>Select a passage to return to its inputs. The possible routes are alternatives, not established events.</small>
  </aside>;
}

export default function DragonWorkshop({ source, answers, questions, roles, onAnswer, title, onTitle, focus, onFocusChange, targetId, targetTitle, possibleTargets = [], onTargetChange, resuming, onClose, onBack, onSave, onDone, result }) {
  const dialog = useRef(null), main = useRef(null), pendingFocus = useRef(null);
  const [section, setSection] = useState('city'), [route, setRoute] = useState('defend'), [compare, setCompare] = useState(true), [activeKey, setActiveKey] = useState(dragonKey('city'));
  const [reviewMode, setReviewMode] = useState('questions'), [reviewPath, setReviewPath] = useState(null), [expanded, setExpanded] = useState({});
  const byId = useMemo(() => new Map(questions.filter(row => row.dragonField).map(row => [row.dragonField, row])), [questions]);
  const groups = useMemo(() => {
    const grouped = new Map();
    for (const row of questions) {
      const key = row.nodePath ? JSON.stringify(row.nodePath) : 'unbound';
      const node = graphNodeAt(source.sub || source, row.nodePath);
      if (!grouped.has(key)) grouped.set(key, { key, node, rows: [] });
      grouped.get(key).rows.push(row);
    }
    return [...grouped.values()];
  }, [questions, source]);
  const currentGroup = groups.find(group => group.key === reviewPath) || groups[0];
  useEffect(() => { const element = dialog.current, previous = document.activeElement; element.showModal(); return () => { element.close(); previous?.focus?.(); }; }, []);
  useEffect(() => {
    if (pendingFocus.current) {
      const element = Array.from(main.current?.querySelectorAll('[data-dragon-answer]') || []).find(element => element.dataset.dragonAnswer === pendingFocus.current);
      element?.focus(); element?.scrollIntoView({ block: 'nearest' }); pendingFocus.current = null;
    }
  }, [section, route, compare, expanded, reviewPath, reviewMode]);
  const selectField = key => {
    const row = questions.find(row => row.key === key), definition = DRAGON_FIELDS.find(field => field.id === row?.dragonField);
    setActiveKey(key); pendingFocus.current = key;
    if (!definition) { setSection('review'); setReviewMode('questions'); setExpanded(current => ({ ...current, earlier: true })); return; }
    setSection(definition.section);
    if (definition.route) setRoute(definition.route);
    if (definition.advanced) setExpanded(current => ({ ...current, [definition.route || definition.section]: true }));
    // The field may already be visible, so focus without waiting for navigation.
    requestAnimationFrame(() => { const element = Array.from(main.current?.querySelectorAll('[data-dragon-answer]') || []).find(element => element.dataset.dragonAnswer === key); element?.focus(); element?.scrollIntoView({ block: 'nearest' }); });
  };
  const focusField = row => {
    setActiveKey(row.key);
    const definition = DRAGON_FIELDS.find(field => field.id === row.dragonField);
    if (definition?.route) setRoute(definition.route);
  };
  const field = id => {
    const row = byId.get(id) || questions.find(row => row.key === id);
    return row ? <DragonAnswerField key={row.key} row={row} value={answers[row.key]} active={activeKey === row.key} onAnswer={onAnswer} onFocus={focusField} /> : null;
  };
  const more = key => <details className="dragon-more" open={!!expanded[key]} onToggle={event => { const open = event.currentTarget.open; if (open !== !!expanded[key]) setExpanded(current => ({ ...current, [key]: open })); }}><summary>More detail · optional</summary>{DRAGON_FIELDS.filter(definition => definition.advanced && (definition.route === key || !definition.route && definition.section === key)).map(definition => field(definition.id))}</details>;
  const go = id => { setSection(id); setActiveKey(dragonKey(id === 'city' ? 'city' : id === 'dragon' ? 'dragon' : id === 'stakes' ? 'defenders' : route + 'Plan')); };
  const stepIndex = DRAGON_STEPS.findIndex(step => step.id === section);
  const missingTarget = !!targetId && !targetTitle;
  return createPortal(<dialog ref={dialog} className="narrative-wizard nw-fullscreen dragon-workshop" aria-labelledby="dragon-workshop-title" onClick={event => event.stopPropagation()} onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose(); }}>
    <div className="nw-shell"><header className="nw-header"><div><small>CONCEPT · {source.name || source.title || 'Dragon & the City'}</small><h2 id="dragon-workshop-title">Dragon & the City · Focused Workshop</h2></div><button type="button" className="btn" onClick={onClose}>Close</button></header>
      <div className="dragon-title"><label>Name this version<input className="field-input" value={title} onChange={event => onTitle(event.target.value)} placeholder="Name your dilemma or character" /></label><span className="hint">All answers are optional. The wizard fills the concept’s current nodes.</span></div>
      <nav className="dragon-nav" aria-label="Dragon concept sections">{DRAGON_STEPS.map(step => <button type="button" className="btn" key={step.id} data-dragon-tone={step.id} aria-current={section === step.id ? 'step' : undefined} onClick={() => go(step.id)}><PrimIcon icon={step.icon} />{step.label}</button>)}</nav>
      {result ? <main className="nw-main"><h3>Saved {result.existing ? 'your changes' : 'your concept'}</h3><p>The answers and filled node tree are editable. Double-click the saved concept to review its nodes.</p><button type="button" className="btn primary" onClick={onDone}>Done</button></main> : <div className="dragon-body"><main className="dragon-main" data-dragon-tone={section === 'responses' ? route : section} ref={main}>
        {missingTarget && <p role="alert">The selected destination is unavailable. Choose a destination in Review; your writing is retained here.</p>}
        {section === 'city' && <><h3>The city · what matters?</h3><p className="hint">The city can represent a place, community, institution, relationship or belief. Show its value and its flaws.</p>{DRAGON_FIELDS.filter(definition => definition.section === 'city' && !definition.advanced).map(definition => field(definition.id))}{more('city')}</>}
        {section === 'dragon' && <><h3>The dragon · understand the pressure</h3><p className="hint">A person or group can be a threat, but so can famine, debt or an approaching change. It does not have to be a villain.</p>{DRAGON_FIELDS.filter(definition => definition.section === 'dragon' && !definition.advanced).map(definition => field(definition.id))}{more('dragon')}</>}
        {section === 'responses' && <><div className="dragon-toolbar"><div><h3>Three responses to the threat</h3><p className="hint">Compare the possible actions and their costs. No route is selected as the outcome.</p></div><button type="button" className="btn" aria-pressed={compare} onClick={() => setCompare(!compare)}>Compare all routes</button></div>
          <div className="dragon-routes" role="group" aria-label="Possible responses">{DRAGON_ROUTES.map(id => <button type="button" className="btn" data-dragon-tone={id} aria-pressed={route === id} key={id} onClick={() => { setRoute(id); setActiveKey(dragonKey(id + 'Plan')); }}><PrimIcon icon={routeIcon(id)} />{titleCase(id)}</button>)}</div>
          <div className={compare ? 'dragon-comparison' : 'dragon-single'}>{(compare ? DRAGON_ROUTES : [route]).map(id => <section className={`dragon-route${route === id ? ' active' : ''}`} data-dragon-tone={id} key={id}><ResponseIllustration route={id} /><h4><PrimIcon icon={routeIcon(id)} />{titleCase(id)}</h4>{field(id + 'Plan')}{field(id + 'Cost')}</section>)}</div>{more(route)}
        </>}
        {section === 'stakes' && <><h3>People and stakes</h3><p className="hint">Connect the dilemma to people whose lives might change.</p>{field('defenders')}{field('stakes')}{more('stakes')}</>}
        {section === 'review' && <><div className="dragon-toolbar"><h3>Review the same information</h3><div className="dragon-review-switch"><button type="button" className="btn" aria-pressed={reviewMode === 'questions'} onClick={() => setReviewMode('questions')}>By questions</button><button type="button" className="btn" aria-pressed={reviewMode === 'nodes'} onClick={() => setReviewMode('nodes')}>By nodes</button></div></div>
          {reviewMode === 'questions' ? DRAGON_STEPS.filter(step => step.id !== 'review').map(step => <details className="dragon-review-group" key={step.id}><summary>{step.label}</summary>{DRAGON_FIELDS.filter(definition => definition.section === step.id).map(definition => field(definition.id))}</details>) : <><div className="dragon-node-picker" role="group" aria-label="Template nodes">{groups.map(group => <button type="button" key={group.key} className="btn" aria-pressed={group.key === currentGroup?.key} onClick={() => setReviewPath(group.key)}>{group.node?.title || (group.key === 'unbound' ? 'Unbound writing' : 'Missing template node')}</button>)}</div>{currentGroup && <section className="dragon-node-review"><h4>{currentGroup.node?.title || 'Retained writing'}</h4><p className="hint">{currentGroup.node ? 'These answers fill this existing node. Its type and connections are preserved.' : 'These answers stay saved, but their template node is missing. No replacement nodes will be invented.'}</p>{currentGroup.rows.map(row => field(row.key))}</section>}<p className="hint">After saving, develop individual nodes further as appropriate. This wizard keeps the current node types.</p></>}
          {questions.some(row => !row.dragonField) && <details className="dragon-review-group" open={!!expanded.earlier} onToggle={event => { const open = event.currentTarget.open; if (open !== !!expanded.earlier) setExpanded(current => ({ ...current, earlier: open })); }}><summary>Earlier answers and additional template questions</summary>{questions.filter(row => !row.dragonField).map(row => field(row.key))}</details>}
          <details className="dragon-review-group"><summary>Save destination</summary><label className="nw-field">Use this for<select className="field-input" value={focus} disabled={resuming} onChange={event => onFocusChange(event.target.value)}>{[['scene','Story dilemma / scene'],['character','Character'],['relationship','Relationship'],['values','Dilemma / values'],['story','Story arc'],['communication','Communication'],['learning','Learning'],['style','Storytelling style']].map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label><label className="nw-field">Save into<select className="field-input" value={targetId} disabled={resuming} onChange={event => onTargetChange(event.target.value)}><option value="">Create a separate {focus === 'character' ? 'character' : 'concept'} node</option>{possibleTargets.map(node => <option key={node.id} value={node.id}>{node.title}</option>)}</select></label></details>
        </>}
      </main><DragonLiveDescription answers={answers} questions={questions} activeKey={activeKey} section={section} route={route} onSelect={selectField} /></div>}
      {!result && <footer className="nw-footer"><button type="button" className="btn" onClick={() => stepIndex > 0 ? go(DRAGON_STEPS[stepIndex - 1].id) : onBack()}>Back</button><span className="hint">Answers remain editable in the wizard and on their nodes.</span>{section === 'review' ? <><button type="button" className="btn" disabled={!title.trim() || missingTarget} onClick={() => onSave(false)}>Save to game</button><button type="button" className="btn primary" disabled={!title.trim() || missingTarget} onClick={() => onSave(true)}>Save to library + game</button></> : <><button type="button" className="btn" onClick={() => go('review')}>Review</button><button type="button" className="btn primary" onClick={() => go(DRAGON_STEPS[stepIndex + 1].id)}>Next</button></>}</footer>}
    </div>
  </dialog>, document.body);
}
