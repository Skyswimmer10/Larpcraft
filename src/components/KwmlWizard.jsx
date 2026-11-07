import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { KWML_KEYS, KWML_BALANCED, KWML_ENERGIES, KWML_LEANS, KWML_INTENSITIES, KWML_STAGES, KWML_STAGE_HELP, kwmlKey, kwmlList, kwmlPrimary, kwmlSecondaries, kwmlActive, kwmlPrimaryKeys, kwmlSteps, kwmlDirections, kwmlPairChoices } from '../data/kwml.js';
import { kwmlSelectPrimary, kwmlToggleSecondary, kwmlStrengths, kwmlStrengthOptions, kwmlHighlightedStrengths, kwmlRiskOptions, kwmlSelectedRisks, kwmlSuggestedHook, kwmlLegacyQuestions, kwmlSelectedDirections, kwmlSelectedPairs } from '../lib/kwmlWizard.js';
import { PrimIcon } from './bits.jsx';
import './KwmlWizard.css';

const toggle = (values, value) => values.includes(value) ? values.filter(item => item !== value) : [...values, value];

function SelectField({ label, value, options, onChange, help }) {
  const id = useId();
  return <label className="kw-field" htmlFor={id}>{label}<select id={id} className="field-input" value={value || ''} onChange={event => onChange(event.target.value)}><option value="">Choose if useful…</option>{options.map(option => <option key={option} value={option}>{option}</option>)}</select>{help && <small>{help}</small>}</label>;
}
function ShortField({ label, value, onChange, placeholder, multiline = false }) {
  const id = useId();
  return <label className="kw-field" htmlFor={id}>{label}{multiline ? <textarea id={id} className="field-input" rows={3} value={value || ''} onChange={event => onChange(event.target.value)} placeholder={placeholder} /> : <input id={id} className="field-input" value={value || ''} onChange={event => onChange(event.target.value)} placeholder={placeholder} />}</label>;
}
function CheckList({ label, options, selected, onChange, max }) {
  return <fieldset className="kw-checklist"><legend>{label}{max && <small>Choose up to {max}</small>}</legend>{options.map(option => <label key={option} className={selected.includes(option) ? 'chosen' : ''}><input type="checkbox" checked={selected.includes(option)} disabled={max && selected.length >= max && !selected.includes(option)} onChange={() => onChange(toggle(selected, option))} /><span>{option}</span></label>)}</fieldset>;
}
function PagedChecks({ label, options, selected, onChange, pageSize = 6 }) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(options.length / pageSize)), current = Math.min(page, pages - 1);
  return <div><CheckList label={label} options={options.slice(current * pageSize, (current + 1) * pageSize)} selected={selected} onChange={values => {
    const visible = options.slice(current * pageSize, (current + 1) * pageSize);
    onChange([...selected.filter(value => !visible.includes(value)), ...values.filter(value => visible.includes(value))]);
  }} />{pages > 1 && <div className="kw-pages"><button type="button" className="btn small" disabled={!current} onClick={() => setPage(current - 1)} aria-label={`Previous ${label.toLowerCase()}`}>‹</button><small>{current + 1} / {pages} · {options.length} choices</small><button type="button" className="btn small" disabled={current + 1 === pages} onClick={() => setPage(current + 1)} aria-label={`More ${label.toLowerCase()}`}>›</button></div>}</div>;
}
function ToggleField({ label, checked, onChange }) {
  return <label className="kw-toggle"><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} /><span>{label}</span></label>;
}
function EnergyCard({ energy }) {
  const data = KWML_ENERGIES[energy];
  return <div className="kw-energy-card"><span><PrimIcon icon={data.icon} size={23} /></span><div><small>{energy} · {data.title}</small><p>{data.core}</p></div></div>;
}

export default function KwmlWizard({ answers, onPatch, title, onTitle, context, onContext, preview, onNarrativeChange, onRebuild, narrativeEdited, previousQuestions = [], target, targetId, onTargetChange, possibleTargets = [], resuming, onClose, onBack, onSave, onReset, result, onDone }) {
  const [step, setStep] = useState('foundation'), [energyIndex, setEnergyIndex] = useState(0);
  const [interactionView, setInteractionView] = useState('direction'), [directionEnergy, setDirectionEnergy] = useState('');
  const [expressionView, setExpressionView] = useState('strengths'), [editingDescription, setEditingDescription] = useState(false);
  const dialog = useRef(null), content = useRef(null), id = useId();
  const primary = kwmlPrimary(answers), active = kwmlActive(answers), primaryKeys = kwmlPrimaryKeys(answers), secondary = kwmlSecondaries(answers);
  const steps = kwmlSteps(answers), current = steps.find(row => row.id === step) || steps[0], stepIndex = steps.indexOf(current);
  const balanced = primary === KWML_BALANCED;
  const focusedKeys = current.id === 'supporting' ? secondary : primaryKeys;
  const energy = focusedKeys[Math.min(energyIndex, Math.max(0, focusedKeys.length - 1))], data = KWML_ENERGIES[energy];
  const legacy = kwmlLegacyQuestions(answers, previousQuestions);
  const patch = (key, value) => onPatch({ [key]: value });
  const changeStep = next => { setStep(next); setEnergyIndex(0); };
  useEffect(() => {
    const element = dialog.current, previous = document.activeElement;
    element.showModal();
    return () => { element.close(); previous?.focus?.(); };
  }, []);
  useEffect(() => { content.current?.scrollTo(0, 0); }, [step, energyIndex, interactionView, expressionView]);
  const move = direction => {
    if (['primary', 'supporting'].includes(current.id)) {
      if (direction > 0 && energyIndex + 1 < focusedKeys.length) { setEnergyIndex(value => value + 1); return; }
      if (direction < 0 && energyIndex > 0) { setEnergyIndex(value => value - 1); return; }
    }
    const next = steps[stepIndex + direction];
    if (next) changeStep(next.id);
  };
  const exportProfile = () => {
    const blob = new Blob([preview], { type: 'text/plain;charset=utf-8' }), url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = `${(title || 'character').replace(/[<>:"/\\|?*]/g, '-')}-profile.txt`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const direction = active.includes(directionEnergy) ? directionEnergy : active[0];
  const directionOptions = kwmlDirections(answers).filter(row => row.energy === direction);
  const pairOptions = kwmlPairChoices(answers);
  const highlighted = kwmlHighlightedStrengths(answers), risks = kwmlSelectedRisks(answers);
  const effects = [...kwmlSelectedDirections(answers).map(row => row.label), ...kwmlSelectedPairs(answers).map(row => row.label)];
  const leans = primaryKeys.filter(key => answers[kwmlKey(key, 'lean')]).map(key => `${key}: ${answers[kwmlKey(key, 'lean')]}`);
  return createPortal(<dialog ref={dialog} className="kw-wizard" aria-labelledby={`${id}-title`} onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose(); }}>
    <header className="kw-header"><div><small>Character framework</small><h2 id={`${id}-title`}>King, Warrior, Magician &amp; Lover</h2></div><div>{onBack && !resuming && <button type="button" className="btn small" onClick={onBack}>Change framework</button>}<button type="button" className="btn" onClick={onClose}>Close</button></div></header>
    {result ? <section className="kw-saved"><h3>Saved to {result.includeLibrary ? 'game and library' : 'game'}</h3><p>The character profile and this framework’s choices remain editable.</p><button type="button" className="btn primary" onClick={onDone}>Done</button></section> : <>
      <nav className="kw-progress" aria-label="Character creation steps">{steps.map((item, index) => <button type="button" key={item.id} disabled={!primary && item.id !== 'foundation'} aria-current={current.id === item.id ? 'step' : undefined} onClick={() => changeStep(item.id)}><span>{index + 1}</span>{item.label}</button>)}</nav>
      <div ref={content} className="kw-body"><div className="kw-purpose"><small>Step {stepIndex + 1} of {steps.length}{resuming && ' · editing saved choices'}</small><h3>{current.label}</h3><p>{current.purpose}</p></div>
        {current.id === 'foundation' && <>
          <div className="kw-two"><ShortField label="Character name / working title" value={title} onChange={onTitle} placeholder="Name this character" /><ShortField label="One-sentence role or concept" value={answers['kwml:concept']} onChange={value => patch('kwml:concept', value)} placeholder="Who are they in this game?" /></div>
          <fieldset className="kw-primary"><legend>Primary energy</legend><div>{[...KWML_KEYS, KWML_BALANCED].map(key => <label key={key} className={primary === key ? 'chosen' : ''}><input type="radio" name={`${id}-primary`} checked={primary === key} onChange={() => onPatch(kwmlSelectPrimary(answers, key))} /><span><b>{key}</b><small>{KWML_ENERGIES[key]?.title || 'All four energies, without a single lead'}</small></span></label>)}</div></fieldset>
          {primary && !balanced && <fieldset className="kw-secondary"><legend>Supporting energies <small>Optional · up to two</small></legend>{KWML_KEYS.filter(key => key !== primary).map(key => <label key={key}><input type="checkbox" checked={secondary.includes(key)} disabled={secondary.length >= 2 && !secondary.includes(key)} onChange={() => onPatch(kwmlToggleSecondary(answers, key))} /><span>{key}</span></label>)}</fieldset>}
          {balanced && <p className="kw-note">Each energy gets a short deepening card. No separate supporting-energy step is needed.</p>}
          <details className="kw-optional"><summary>Context and destination</summary><ShortField label="Situation or background" value={context} onChange={onContext} multiline />{resuming ? <p>Saved with {target?.title || title}.</p> : <label className="kw-field">Character destination<select className="field-input" value={targetId || ''} onChange={event => onTargetChange(event.target.value)}><option value="">A new character in this game</option>{possibleTargets.filter(node => node.kind === 'character').map(node => <option key={node.id} value={node.id}>{node.title || node.name}</option>)}</select></label>}</details>
        </>}
        {['primary', 'supporting'].includes(current.id) && data && <>
          {focusedKeys.length > 1 && <div className="kw-subprogress"><b>{current.id === 'primary' && balanced ? 'Balanced mix' : 'Supporting energy'}</b><span>{energyIndex + 1} / {focusedKeys.length} · {energy}</span></div>}
          <EnergyCard energy={energy} />
          <div className="kw-two"><CheckList label={`${energy} strengths to emphasise`} options={data.strengths} selected={kwmlStrengths(answers, energy)} max={current.id === 'supporting' ? 3 : undefined} onChange={values => patch(kwmlKey(energy, 'strengths'), values.join(' | '))} />
            <section className="kw-shadow-card"><h4>Two shadow directions</h4><p><b>{data.active.name} · active:</b> {data.active.description}</p><p><b>{data.passive.name} · passive:</b> {data.passive.description}</p>
              {current.id === 'primary' ? <SelectField label={`${energy} shadow lean`} value={answers[kwmlKey(energy, 'lean')]} options={KWML_LEANS} onChange={value => patch(kwmlKey(energy, 'lean'), value)} /> : <SelectField label={`${energy} shadow intensity`} value={answers[kwmlKey(energy, 'intensity')]} options={KWML_INTENSITIES} onChange={value => patch(kwmlKey(energy, 'intensity'), value)} help="Intensity does not select an active or passive side. Choose any relevant pressure effects in Interactions." />}
            </section></div>
          {current.id === 'primary' && <div className="kw-history"><ToggleField label={`Include a short ${energy} shadow moment in their history`} checked={answers[kwmlKey(energy, 'historyEnabled')] === 'yes'} onChange={checked => patch(kwmlKey(energy, 'historyEnabled'), checked ? 'yes' : 'no')} />{answers[kwmlKey(energy, 'historyEnabled')] === 'yes' && <ShortField label={`${energy}: shadow moment`} value={answers[kwmlKey(energy, 'history')]} onChange={value => patch(kwmlKey(energy, 'history'), value)} multiline placeholder="One incident and its effect on the character." />}</div>}
          <p className="kw-note">{data.interaction}</p>
        </>}
        {current.id === 'interactions' && <>
          <div className="kw-section-switch" role="group" aria-label="Interaction view"><button type="button" aria-pressed={interactionView === 'direction'} onClick={() => setInteractionView('direction')}>Directional effects</button><button type="button" disabled={active.length < 2} aria-pressed={interactionView === 'pairs'} onClick={() => setInteractionView('pairs')}>Pairwise effects</button></div>
          <ToggleField label="Highlight possible shadow distortions" checked={answers['kwml:showDistortion'] === 'yes'} onChange={checked => patch('kwml:showDistortion', checked ? 'yes' : 'no')} />
          {interactionView === 'direction' ? <><div className="kw-energy-switch" role="group" aria-label="Direction from energy">{active.map(key => <button type="button" key={key} aria-pressed={key === direction} onClick={() => setDirectionEnergy(key)}>{key} → others</button>)}</div><p className="kw-note">{KWML_ENERGIES[direction]?.core}</p><CheckList label={`${direction}: effects that matter`} options={directionOptions.map(row => row.label)} selected={kwmlList(answers['kwml:directions'])} onChange={values => patch('kwml:directions', values.join(' | '))} /></> : <><p className="kw-note">Only pairs among the chosen energies appear. Shadow effects are possibilities to explore, not automatic consequences of choosing an energy.</p><PagedChecks label="Pairwise notes" options={pairOptions.map(row => row.label)} selected={kwmlList(answers['kwml:pairs'])} pageSize={3} onChange={values => patch('kwml:pairs', values.join(' | '))} /></>}
          <ShortField label="A concrete scene or habit" value={answers['kwml:scene']} onChange={value => patch('kwml:scene', value)} placeholder="Optional: one moment that shows these energies together." />
        </>}
        {current.id === 'expression' && <>
          <div className="kw-section-switch" role="group" aria-label="Expression view"><button type="button" aria-pressed={expressionView === 'strengths'} onClick={() => setExpressionView('strengths')}>Strengths in play</button><button type="button" aria-pressed={expressionView === 'limits'} onClick={() => setExpressionView('limits')}>Friction &amp; development</button></div>
          {expressionView === 'strengths' ? <>{kwmlStrengthOptions(answers).length ? <PagedChecks label="Strengths players should notice" options={kwmlStrengthOptions(answers)} selected={kwmlHighlightedStrengths(answers)} onChange={values => patch('kwml:highlights', values.join(' | '))} /> : <p className="kw-note">Choose strengths in Primary energy or Supporting energies to populate this list.</p>}</> : <><PagedChecks label="Shadow risks for story friction" options={kwmlRiskOptions(answers)} selected={kwmlSelectedRisks(answers)} onChange={values => patch('kwml:risks', values.join(' | '))} /><div className="kw-two kw-limit-controls"><SelectField label="Aware of their shadows?" value={answers['kwml:aware']} options={['yes', 'no']} onChange={value => patch('kwml:aware', value)} /><SelectField label="Current developmental stage" value={answers['kwml:stage']} options={KWML_STAGES} onChange={value => patch('kwml:stage', value)} help={KWML_STAGE_HELP[answers['kwml:stage']]} /></div></>}
        </>}
        {current.id === 'synthesis' && <>
          <div className="kw-synthesis-card"><header><div><small>Character synthesis</small><h3>{title || 'Your character'}</h3></div><button type="button" className="btn small" aria-pressed={editingDescription} onClick={() => setEditingDescription(value => !value)}>{editingDescription ? 'Read profile' : 'Edit profile'}</button></header>{editingDescription ? <ShortField label="Character profile" value={preview} onChange={onNarrativeChange} multiline /> : <><p className="kw-note">{answers['kwml:concept']}</p><dl className="kw-summary"><div><dt>Energies</dt><dd>{primary}{secondary.length ? ` + ${secondary.join(' + ')}` : ''}</dd></div><div><dt>Strengths</dt><dd>{highlighted.slice(0, 4).join('; ') || 'None chosen'}{highlighted.length > 4 ? `; +${highlighted.length - 4} more in the full profile` : ''}</dd></div><div><dt>Shadow risks</dt><dd>{risks.slice(0, 2).join('; ') || leans.join('; ') || 'None chosen'}{risks.length > 2 ? `; +${risks.length - 2} more in the full profile` : ''}</dd></div><div><dt>Interactions</dt><dd>{effects.slice(0, 2).join(' ') || 'None chosen'}{effects.length > 2 ? ` +${effects.length - 2} more in the full profile` : ''}</dd></div>{answers['kwml:stage'] && <div><dt>Development</dt><dd>{answers['kwml:stage']}</dd></div>}</dl><details className="kw-optional" open={narrativeEdited}><summary>Read full profile</summary><p className="kw-output">{preview}</p></details></>}{narrativeEdited && <p className="kw-note">Your edited profile stays as written when choices change. <button type="button" className="linkbtn" onClick={onRebuild}>Rebuild from choices</button></p>}</div>
          <ShortField label="Suggested story hook · editable" value={answers['kwml:hook'] === undefined ? kwmlSuggestedHook(answers) : answers['kwml:hook']} onChange={value => patch('kwml:hook', value)} multiline />
          <div className="kw-output-actions"><button type="button" className="btn" onClick={exportProfile}>Export profile</button><button type="button" className="btn" onClick={() => { if (window.confirm('Start this unsaved framework draft over? The saved character is unchanged until you save again.')) { onReset(); changeStep('foundation'); } }}>Start over</button></div>
        </>}
        {!!legacy.length && <details className="kw-optional"><summary>Retained earlier writing{answers['kwml:legacyPrimary'] ? ` · ${answers['kwml:legacyPrimary']}` : ''} ({legacy.length})</summary>{legacy.map(row => <ShortField key={row.key} label={row.prompt} value={answers[row.textAnswerKey || row.key]} onChange={value => patch(row.textAnswerKey || row.key, value)} multiline />)}</details>}
      </div>
      <footer className="kw-footer"><button type="button" className="btn" disabled={stepIndex === 0 && energyIndex === 0} onClick={() => move(-1)}>Back</button><small>{primary || 'Choose a primary energy to continue'}{primary && ` · ${balanced ? 'four complementary energies' : secondary.length ? `${secondary.length} supporting ${secondary.length === 1 ? 'energy' : 'energies'}` : 'no supporting energies'}`}</small><div>{current.id === 'synthesis' ? <><button type="button" className="btn" disabled={!title.trim() || !primary || (targetId && !target)} onClick={() => onSave(true)}>Save to library + game</button><button type="button" className="btn primary" disabled={!title.trim() || !primary || (targetId && !target)} onClick={() => onSave(false)}>Save as node</button></> : <button type="button" className="btn primary" disabled={!primary} onClick={() => move(1)}>{['primary', 'supporting'].includes(current.id) && energyIndex + 1 < focusedKeys.length ? 'Next energy' : 'Next'}</button>}</div></footer>
    </>}
  </dialog>, document.body);
}
