import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ARCHETYPE_ATTRIBUTION, storyArchetype } from '../data/storyArchetypes.js';
import { archetypeBlend } from '../lib/archetypeConcept.js';
import { questionAnswer } from '../lib/narrativeMemory.js';
import NarrativeSourceSymbol from './NarrativeSourceSymbol.jsx';
import { PrimIcon } from './bits.jsx';
import './ArchetypeWorkshop.css';

const FIELD_TITLES = { purpose: 'Purpose', when: 'Behaviour', gift: 'Gift to others', say: 'Voice', pressure: 'A test of character', excessive: 'Pushed too far', withdrawing: 'Disconnected from the gift' };

function ArchetypeField({ row, answers, onPatch, reference }) {
  const id = useId();
  const key = row.textAnswerKey || row.key;
  const value = answers[key] || '';
  const selected = answers[row.choiceAnswerKey || row.key] || '';
  const shadow = ['excessive', 'withdrawing'].includes(row.archetypeField) ? reference[row.archetypeField] : null;
  return <section className={`arc-field arc-field-${row.archetypeField || 'extra'}`} aria-labelledby={id}>
    <header><h3 id={id}>{FIELD_TITLES[row.archetypeField] || 'Additional writing'}{shadow && <span>{shadow.name}</span>}</h3></header>
    <p className="arc-field-guidance">{row.hint}</p>
    {!!row.choices?.length && <div className="arc-starters" role="group" aria-label={`${FIELD_TITLES[row.archetypeField] || 'Additional writing'} starting points`}>{row.choices.map(choice => <button type="button" key={choice} aria-pressed={selected === choice} onClick={() => onPatch({ [row.choiceAnswerKey || row.key]: choice })}>{choice}</button>)}</div>}
    <label className="arc-answer" htmlFor={`${id}-answer`}>{row.prompt}</label>
    <textarea id={`${id}-answer`} className="field-input" rows={2} value={value} onChange={event => onPatch({ [key]: event.target.value })} placeholder="Choose a starting point above, adapt it here, or write your own." />
    {!!questionAnswer(row, answers) && <button type="button" className="linkbtn arc-clear" onClick={() => onPatch({ [key]: '', ...(row.choiceAnswerKey ? { [row.choiceAnswerKey]: '' } : {}) })}>Clear this part</button>}
  </section>;
}

export function ArchetypeReference({ reference, compact = false }) {
  return <section className={`arc-reference${compact ? ' compact' : ''}`} aria-label={`${reference.label} reference`}>
    <div><small>The {reference.label}</small><h3>{reference.tagline}</h3><p>{reference.overview}</p></div>
    {!compact && <dl><div><dt>Gift</dt><dd>{reference.gift.hint}</dd></div><div><dt>{reference.excessive.name}</dt><dd>{reference.excessive.description}</dd></div><div><dt>{reference.withdrawing.name}</dt><dd>{reference.withdrawing.description}</dd></div></dl>}
  </section>;
}

function Mixer({ reference, row, answers, onPatch }) {
  const id = useId();
  const selected = answers[row.choiceAnswerKey || row.key] || '';
  const blend = archetypeBlend(reference, selected);
  const secondary = blend && storyArchetype({ name: blend.withArchetype });
  const notesKey = row.textAnswerKey || row.key;
  const notes = answers[notesKey] || '';
  return <section className="arc-mixer" aria-label="Archetype mixer">
    <div className="arc-mix-equation"><b>{reference.label}</b>{blend ? <><span>+</span><b>{blend.withArchetype}</b><span>→</span><strong>{blend.name}</strong></> : <span>Choose an optional second lens</span>}<button type="button" className="btn small" aria-pressed={!selected} onClick={() => onPatch({ [row.choiceAnswerKey || row.key]: '' })}>Use {reference.label} alone</button></div>
    <p className="arc-mix-intro">{reference.label} stays the foundation. Choose another archetype to colour how this character acts, speaks or helps others. These are combinations from the source card; they do not add a separate node.</p>
    <div className="arc-mix-options" role="group" aria-label={`Combine ${reference.label} with another archetype`}>{reference.blends.map(option => {
      const choice = `${reference.label} + ${option.withArchetype} = ${option.name}`;
      return <button type="button" key={option.withArchetype} aria-pressed={selected === choice} onClick={() => onPatch({ [row.choiceAnswerKey || row.key]: choice })}><PrimIcon icon="layers" size={19} /><span><b>{option.withArchetype}</b><small>{option.name}</small></span></button>;
    })}</div>
    <div className="arc-mix-workspace"><section className="arc-field"><h3>{blend ? `${blend.name}: your version` : 'Make the combination yours'}</h3>
      <p className="arc-field-guidance">{blend ? `Keep the ${reference.label} purpose and gift. What does the ${blend.withArchetype} add to how this particular character pursues them?` : 'The main canvas is sufficient on its own. Choose a second archetype only if it gives you a useful direction.'}</p>
      {secondary && <><p className="arc-field-guidance">Possible influences from the {secondary.label}. Choose one to adapt:</p><div className="arc-starters" role="group" aria-label={`${secondary.label} influence starting points`}>{[secondary.purpose.choices[0], secondary.when.choices[0], secondary.gift.choices[0]].map(choice => <button type="button" key={choice} aria-pressed={notes === choice} onClick={() => onPatch({ [notesKey]: choice })}>{choice}</button>)}</div></>}
      <label className="arc-answer" htmlFor={id}>Describe the influence in their actions, voice or relationships</label><textarea id={id} className="field-input" rows={5} value={notes} onChange={event => onPatch({ [notesKey]: event.target.value })} placeholder={blend ? `For this ${blend.name}, the second archetype changes...` : 'Optional: write your own combination or explain another side.'} />
      {!!notes && <button type="button" className="linkbtn arc-clear" onClick={() => onPatch({ [notesKey]: '' })}>Clear these notes</button>}
    </section><aside className="arc-mix-foundation"><h3>What stays at the centre</h3><p>{reference.overview}</p>{secondary && <><h4>What the {secondary.label} adds</h4><p>{secondary.overview}</p><p><b>Its gift:</b> {secondary.gift.hint}</p></>}<h4>Watch both shadow sides</h4><p><b>{reference.excessive.name}:</b> {reference.excessive.description}</p><p><b>{reference.withdrawing.name}:</b> {reference.withdrawing.description}</p><small>Combination names are directional: {reference.label} + another archetype can differ from that archetype + {reference.label}.</small></aside></div>
  </section>;
}

export default function ArchetypeWorkshop({ source, questions, answers, onPatch, title, onTitle, context, onContext, preview, onNarrativeChange, onRebuild, narrativeEdited, target, targetId, onTargetChange, possibleTargets = [], resuming, onClose, onBack, onSave, result, onDone }) {
  const reference = storyArchetype(source);
  const [tab, setTab] = useState('canvas');
  const [editingDescription, setEditingDescription] = useState(false);
  const dialog = useRef(null), body = useRef(null), canvasTab = useRef(null), mixerTab = useRef(null);
  const id = useId();
  const blendQuestion = questions.find(row => row.archetypeField === 'blends');
  const hasMixer = !!reference.blends.length && !!blendQuestion;
  const fields = questions.filter(row => row.archetypeField !== 'blends');
  const count = questions.filter(row => questionAnswer(row, answers)).length;
  const characters = possibleTargets.filter(node => node.kind === 'character');
  useEffect(() => {
    const element = dialog.current, previous = document.activeElement;
    element.showModal();
    return () => { element.close(); previous?.focus?.(); };
  }, []);
  useEffect(() => { body.current?.scrollTo(0, 0); }, [tab]);
  const changeTab = next => { setTab(next); (next === 'canvas' ? canvasTab : mixerTab).current?.focus(); };
  return createPortal(<dialog ref={dialog} className="arc-workshop" aria-labelledby={`${id}-title`} onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose(); }}>
    <header className="arc-header"><div><small>Story wizard · Character</small><h2 id={`${id}-title`}>{reference.label}</h2></div><div className="arc-header-actions">{onBack && !resuming && <button type="button" className="btn small" onClick={onBack}>Change concept</button>}<button type="button" className="btn" onClick={onClose}>Close</button></div></header>
    {result ? <section className="arc-saved"><PrimIcon icon="tick" size={32} /><h3>Saved to {result.includeLibrary ? 'game and library' : 'game'}</h3><p>{result.existing ? 'The character’s saved contribution has been updated.' : 'Your character is on the narrative canvas.'}</p><button type="button" className="btn primary" onClick={onDone}>Done</button></section> : <>
      <div className="arc-identity"><label>Name this character<input className="field-input" aria-label="Name this character" autoFocus value={title} onChange={event => onTitle(event.target.value)} placeholder="Character name" /></label>
        {resuming ? <p>Editing the saved {reference.label} contribution{target?.title ? ` for ${target.title}` : ''}.</p> : <label>Save with<select className="field-input" aria-label="Character destination" value={targetId || ''} onChange={event => onTargetChange(event.target.value)}><option value="">A new character in this game</option>{characters.map(node => <option key={node.id} value={node.id}>{node.title || node.name}</option>)}</select></label>}
        <details className="arc-context"><summary>Situation or background{context ? ' · added' : ' · optional'}</summary><label>What is happening around this character?<textarea className="field-input" rows={3} value={context} onChange={event => onContext(event.target.value)} /></label></details>
      </div>
      <div className="arc-tabbar">{hasMixer ? <div role="tablist" aria-label="Character workshop views"><button ref={canvasTab} type="button" id={`${id}-canvas-tab`} role="tab" aria-selected={tab === 'canvas'} aria-controls={`${id}-canvas`} onClick={() => changeTab('canvas')} onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); changeTab(event.key === 'Home' ? 'canvas' : 'mixer'); } }}><PrimIcon icon="user" size={16} />Character Canvas</button><button ref={mixerTab} type="button" id={`${id}-mixer-tab`} role="tab" aria-selected={tab === 'mixer'} aria-controls={`${id}-mixer`} onClick={() => changeTab('mixer')} onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); changeTab(event.key === 'End' ? 'mixer' : 'canvas'); } }}><PrimIcon icon="layers" size={16} />Archetype Mixer</button></div> : <b>Character Canvas</b>}<small>{count} {count === 1 ? 'part' : 'parts'} recorded · all optional</small></div>
      <div ref={body} className="arc-body">
        <section id={`${id}-canvas`} {...(hasMixer ? { role: 'tabpanel', 'aria-labelledby': `${id}-canvas-tab` } : { 'aria-label': 'Character Canvas' })} hidden={tab !== 'canvas'}>
          <div className="arc-introduction"><div className="arc-symbol"><NarrativeSourceSymbol source={source} type="concept" /></div><ArchetypeReference reference={reference} compact /></div>
          <div className="arc-canvas-fields">{fields.map(row => <ArchetypeField key={row.key} row={row} answers={answers} onPatch={onPatch} reference={reference} />)}</div>
        </section>
        {hasMixer && <section id={`${id}-mixer`} role="tabpanel" aria-labelledby={`${id}-mixer-tab`} hidden={tab !== 'mixer'}><Mixer reference={reference} row={blendQuestion} answers={answers} onPatch={onPatch} /></section>}
        <section className="arc-live-description" aria-labelledby={`${id}-description`}><header><div><small>From your recorded answers</small><h3 id={`${id}-description`}>Live character description</h3></div><button type="button" className="btn small" aria-pressed={editingDescription} onClick={() => setEditingDescription(value => !value)}>{editingDescription ? 'Read description' : 'Edit description'}</button></header>
          {editingDescription ? <label className="arc-answer">Character description<textarea className="field-input" rows={8} value={preview} onChange={event => onNarrativeChange(event.target.value)} /></label> : <p className="arc-description-text" aria-live="polite">{count || narrativeEdited ? preview : 'Choose a starting point or write in any field. Only your recorded choices and writing become part of this character.'}</p>}
          {narrativeEdited && <p className="arc-description-note">Your edited description is kept as written. <button type="button" className="linkbtn" onClick={onRebuild}>Rebuild from answers</button></p>}
        </section>
        <details className="arc-attribution"><summary>About this reference</summary><p>{ARCHETYPE_ATTRIBUTION}</p><p>Reference PDF pages {reference.pages.join('–')}. Starting choices become character details only when you select or write them.</p></details>
      </div>
      <footer className="arc-footer"><small>{targetId ? `Saves this contribution with ${target?.title || 'the selected character'}.` : 'Creates a character in this game. Library saving is optional.'}</small><div><button type="button" className="btn" disabled={!title.trim() || (targetId && !target)} onClick={() => onSave(true)}>Save to library + game</button><button type="button" className="btn primary" disabled={!title.trim() || (targetId && !target)} onClick={() => onSave(false)}>Save to game</button></div></footer>
    </>}
  </dialog>, document.body);
}
