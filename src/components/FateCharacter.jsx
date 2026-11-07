import React, { useId, useState } from 'react';
import { FATE_SIGNAL_GROUPS, FATE_ATTENTION, FATE_FEELING_STRENGTH, FATE_RESPONSES } from '../lib/fateCharacter.js';
import { FateChoices } from './FateWizardControls.jsx';
import { FateSelectedIdeas, FateTypePicker } from './FatePurposeControls.jsx';
import { FATE_FIELDS, FATE_STEPS } from '../data/fateWizard.js';
import { FATE_PURPOSE_COPY as P, fateFieldsFor } from '../data/fatePurposes.js';
import { addFateEmotionPattern, fateOutput } from '../lib/fateWizard.js';

const text = (label, value, onChange, rows = 2) => <label className="nw-field">{label}<textarea className="field-input" rows={rows} value={value || ''} onChange={event => onChange(event.target.value)} /></label>;

export function FateCharacterNavigation({ draft, onGo }) {
  return <nav className="fc-step-nav" aria-label="Character FATE steps">
    <b>Character steps</b>
    {FATE_STEPS.map(step => <button type="button" key={step.key}
      style={{ '--fate-accent': step.color || (step.key === 'setup' ? '#B8A4F4' : '#B7C7D8') }}
      aria-current={draft.lastStep === step.key ? 'step' : undefined}
      aria-controls="fate-character-step-content" onClick={() => onGo(step.key)}>
      <span className="fc-step-index" aria-hidden="true">{step.section ? step.key : step.key === 'setup' ? '1' : '✓'}</span>
      <span>{step.key === 'setup' ? 'Start' : step.key === 'review' ? 'Character description' : step.name}</span>
    </button>)}
  </nav>;
}

export function FateCharacterPreview({ draft, onGo }) {
  const description = fateOutput({ ...draft, output: { ...draft.output, text: undefined } });
  return <section className="fc-live-description" aria-label="Live character description">
    <h3>Live character description</h3>
    <p className="fc-live-prose">{description || 'Your character description will appear as you make selections.'}</p>
    {draft.output.text !== undefined && <p className="fc-live-note">This preview follows your answers. Your edited description is kept on the Character description step.</p>}
    <FateSelectedIdeas draft={draft} onGo={onGo} />
  </section>;
}

function Strength({ label, value, options, onChange }) {
  const id = useId(), chosen = Number.isInteger(value);
  return <fieldset className="fw-scale"><legend>{label}</legend><input id={id} type="range" aria-label={label} aria-valuetext={chosen ? options[value] : 'Not chosen'} min="0" max={options.length - 1} value={chosen ? value : 0} onChange={event => onChange(Number(event.target.value))} /><div className="fw-scale-ends"><span>{options[0]}</span><span>{options.at(-1)}</span></div><output htmlFor={id}>{chosen ? options[value] : 'Not chosen'}</output><button type="button" className="linkbtn" onClick={() => onChange(chosen ? null : 0)}>{chosen ? 'Clear strength' : `Use ${options[0].toLowerCase()}`}</button></fieldset>;
}
export function FateSignalEditor({ draft, onEdit }) {
  const [kind, setKind] = useState('attention'), [custom, setCustom] = useState('');
  const signals = draft.focus.signals || [];
  const add = (label, channel) => {
    if (!label.trim() || signals.some(row => row.kind === kind && row.label === label.trim())) return;
    onEdit('focus.signals', [...signals, { id: crypto.randomUUID(), label: label.trim(), channel, kind, strength: null, detail: '' }]); setCustom('');
  };
  return <section className="fc-signals"><div className="fc-toggle" role="group" aria-label="Signal response">{[['attention', 'Draws attention'], ['overlooked', 'Easily overlooked']].map(([key, label]) => <button type="button" className="btn" key={key} aria-pressed={kind === key} onClick={() => setKind(key)}>{label}</button>)}</div>
    {Object.entries(FATE_SIGNAL_GROUPS).map(([channel, options]) => <fieldset className="fc-signal-group" key={channel}><legend>{channel}</legend><div className="nw-choices">{options.map(label => { const included = signals.some(row => row.kind === kind && row.label === label); return <button type="button" className={`btn${included ? ' primary' : ''}`} key={label} aria-pressed={included} onClick={() => included ? onEdit('focus.signals', signals.filter(row => !(row.kind === kind && row.label === label))) : add(label, channel)}>{label}</button>; })}</div></fieldset>)}
    <form className="fc-add-line" onSubmit={event => { event.preventDefault(); add(custom, 'Custom'); }}><label className="nw-field">Custom signal<input className="field-input" value={custom} onChange={event => setCustom(event.target.value)} /></label><button type="submit" className="btn" disabled={!custom.trim()}>Add trigger</button></form>
    <div className="fc-cards">{signals.map((signal, index) => <section className="fc-card" key={signal.id}><header><div><small>{signal.channel} · {signal.kind === 'overlooked' ? 'Easily overlooked' : 'Draws attention'}</small><h4>{signal.label}</h4></div><button type="button" className="linkbtn" aria-label={`Remove signal ${signal.label}`} onClick={() => onEdit('focus.signals', signals.filter(row => row.id !== signal.id))}>Remove</button></header><Strength label={`Attention to ${signal.label}`} value={signal.strength} options={FATE_ATTENTION} onChange={value => onEdit(`focus.signals.${index}.strength`, value)} /><details open={!!signal.detail}><summary>Example, condition or exception</summary>{text('When and how does this affect their attention?', signal.detail, value => onEdit(`focus.signals.${index}.detail`, value))}</details>{signals.some(other => other.id !== signal.id && other.label === signal.label && other.kind !== signal.kind) && !signal.detail && <p className="fc-hint">Also selected in the other category. You can explain when each response applies.</p>}</section>)}</div>
  </section>;
}

export function FatePeopleEditor({ draft, section, entities, onEdit, advanced }) {
  const [name, setName] = useState(''), [type, setType] = useState('person'), [entityKey, setEntityKey] = useState('');
  const rows = draft[section].people || [];
  const add = () => {
    const linked = entities.find(entity => entity.key === entityKey);
    const label = linked?.name || name.trim();
    if (!label) return;
    onEdit(`${section}.people`, [...rows, { id: crypto.randomUUID(), name: label, type: linked?.type || type, entityKey: linked?.key || '', detail: '', relationship: '', symbol: '', board: {} }]); setName(''); setEntityKey('');
  };
  return <section className="fc-people"><h4>{section === 'authority' ? 'People and groups whose judgment matters' : 'People and groups that matter'}</h4>
    <div className="fc-add-grid"><label className="nw-field">Choose from the game<select aria-label={`Choose ${section} person or group`} className="field-input" value={entityKey} onChange={event => { setEntityKey(event.target.value); const linked = entities.find(entity => entity.key === event.target.value); setName(linked?.name || ''); if (linked) setType(linked.type); }}><option value="">Enter a name instead…</option>{entities.map(entity => <option key={entity.key} value={entity.key}>{entity.name} · {entity.type} · {entity.ref.path.join(' / ')}</option>)}</select></label><label className="nw-field">Person or group<select className="field-input" value={type} disabled={!!entityKey} onChange={event => setType(event.target.value)}><option value="person">Person</option><option value="group">Group</option></select></label><label className="nw-field">Name<input className="field-input" value={name} onChange={event => { setName(event.target.value); setEntityKey(''); }} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); add(); } }} /></label><button type="button" className="btn" disabled={!name.trim()} onClick={add}>Add {type}</button></div>
    <div className="fc-cards">{rows.map((row, index) => {
      const live = row.entityKey && entities.find(entity => entity.key === row.entityKey);
      const path = `${section}.people.${index}`;
      return <section className="fc-card" key={row.id}><header><h4>{live?.name || row.name}</h4><button type="button" className="linkbtn" onClick={() => onEdit(`${section}.people`, rows.filter(item => item.id !== row.id))}>Remove</button></header><small>{row.entityKey ? live ? 'Linked game profile' : 'Profile unavailable · saved name retained' : 'Name only'}</small>
        <label className="nw-field">Link to a profile<select className="field-input" value={live ? row.entityKey : ''} onChange={event => { const entity = entities.find(entity => entity.key === event.target.value); onEdit(`${section}.people`, rows.map(item => item.id === row.id ? { ...item, entityKey: entity?.key || '', name: entity?.name || live?.name || item.name, type: entity?.type || item.type } : item)); }}><option value="">Keep as a name only</option>{entities.filter(entity => entity.type === row.type).map(entity => <option key={entity.key} value={entity.key}>{entity.name} · {entity.ref.path.join(' / ')}</option>)}</select></label>
        {row.entityKey && <button type="button" className="linkbtn" onClick={() => onEdit(`${section}.people`, rows.map(item => item.id === row.id ? { ...item, entityKey: '', name: live?.name || item.name } : item))}>Keep as a name only</button>}
        {!row.entityKey && <label className="nw-field">Name<input className="field-input" value={row.name} onChange={event => onEdit(`${path}.name`, event.target.value)} /></label>}
        {section === 'tribe' && <label className="nw-field">Relationship · optional<input className="field-input" placeholder="Friend, sibling, loyal to…" value={row.relationship || ''} onChange={event => onEdit(`${path}.relationship`, event.target.value)} /></label>}
        {text(section === 'authority' ? 'Why does their judgment carry weight?' : 'What place do they have here, and why does this relationship matter?', row.detail, value => onEdit(`${path}.detail`, value))}
        {section === 'tribe' && row.type === 'group' && <details><summary>Signs of belonging and group membership · optional</summary>{text('Recognisable signs of belonging', row.symbol, value => onEdit(`${path}.symbol`, value))}<p>Membership in {live?.name || row.name}</p><label className="nw-field">Add a character to this group board<select className="field-input" value="" onChange={event => {
          const entity = entities.find(entity => entity.key === event.target.value); if (!entity) return;
          const existing = rows.find(person => person.entityKey === entity.key && person.type === 'person');
          const person = existing || { id: crypto.randomUUID(), name: entity.name, type: 'person', entityKey: entity.key, detail: '' };
          onEdit(`${section}.people`, [...rows.map(item => item.id === row.id ? { ...item, board: { ...item.board, [person.id]: 'undecided' } } : item), ...(!existing ? [person] : [])]);
        }}><option value="">Choose a character…</option>{entities.filter(entity => entity.type === 'person' && !rows.some(person => person.entityKey === entity.key && row.board?.[person.id])).map(entity => <option key={entity.key} value={entity.key}>{entity.name} · {entity.ref.path.join(' / ')}</option>)}</select></label>{rows.filter(person => person.type === 'person').map(person => <label className="nw-field" key={person.id}>{entities.find(entity => entity.key === person.entityKey)?.name || person.name}<select className="field-input" value={row.board?.[person.id] || ''} onChange={event => onEdit(`${path}.board`, { ...row.board, [person.id]: event.target.value })}><option value="">Not recorded</option><option value="inGroup">Belongs</option><option value="undecided">Undecided</option><option value="outGroup">Outside the group</option></select></label>)}</details>}
      </section>;
    })}</div>
  </section>;
}

export function FateCharacterPatterns({ draft, onEdit, onTransition, advanced, preferences, onRemember }) {
  return <section className="fc-patterns"><h4>Recurring emotional patterns</h4>{draft.emotion.patterns.map((pattern, index) => { const path = `emotion.patterns.${index}`; return <fieldset className="fc-card" key={pattern.id}><legend>Pattern {index + 1}</legend>
    {text('What brings this pattern out?', pattern.situation, value => onEdit(`${path}.situation`, value))}
    <FateChoices field={{ path: 'emotion.patternFeelings', label: 'Which feelings mix here?', control: 'multi', options: P.emotions }} value={pattern.feelings} preferences={preferences} onRemember={onRemember} onChange={value => onEdit(`${path}.feelings`, value)} />
    <FateChoices field={{ path: 'emotion.patternDirection', label: 'What might they do with these feelings?', control: 'single', options: FATE_RESPONSES }} value={pattern.direction} preferences={preferences} onRemember={onRemember} onChange={value => onEdit(`${path}.direction`, value)} />
    {text('Their usual response · in your own words', pattern.response, value => onEdit(`${path}.response`, value))}
    <Strength label={`Feeling strength in pattern ${index + 1}`} options={FATE_FEELING_STRENGTH} value={pattern.intensity} onChange={value => onEdit(`${path}.intensity`, value)} />
    {text('When might they respond differently? · optional', pattern.exception, value => onEdit(`${path}.exception`, value))}
    {advanced && <details><summary>More detail</summary><FateChoices field={{ path: 'emotion.patternTriggers', label: 'What brings this response out?', control: 'multi', options: FATE_FIELDS.E.find(field => field.path === 'emotion.triggers').options }} value={pattern.triggers || []} preferences={preferences} onRemember={onRemember} onChange={value => onEdit(`${path}.triggers`, value)} />{text('What behaviour shows their feelings?', pattern.behaviour, value => onEdit(`${path}.behaviour`, value))}<FateChoices field={{ path: 'emotion.patternOrigin', label: 'Where does this reaction come from in your story?', control: 'single', options: ['A basic protective response', 'A learned experience', 'Both', 'Unclear'] }} value={pattern.originKind} preferences={preferences} onRemember={onRemember} onChange={value => onEdit(`${path}.originKind`, value)} /></details>}
    <button type="button" className="linkbtn" onClick={() => onEdit('emotion.patterns', draft.emotion.patterns.filter(row => row.id !== pattern.id))}>Remove pattern</button>
  </fieldset>; })}<button type="button" className="btn" onClick={() => onTransition(current => addFateEmotionPattern(current))}>Add emotional pattern</button></section>;
}

export function FateEarlierWriting({ draft, onEdit }) {
  const legacy = [['Situation or background', draft.context], ['Earlier setup', Object.fromEntries(Object.entries(draft.meta).filter(([key, value]) => !['purpose', 'depth', 'locks', 'mode'].includes(key) && value != null && value !== '' && (!Array.isArray(value) || value.length) && !(key === 'weighting' && JSON.stringify(value) === '["F","A","T","E"]')))], ...['F', 'A', 'T', 'E'].map((key, index) => [`${key} notes`, draft.notes[key]]), ...['focus', 'authority', 'tribe', 'emotion'].flatMap(section => FATE_FIELDS[{ focus: 'F', authority: 'A', tribe: 'T', emotion: 'E' }[section]].filter(field => !fateFieldsFor('character', { focus: 'F', authority: 'A', tribe: 'T', emotion: 'E' }[section]).some(current => current.path === field.path) || ['focus.capture', 'focus.overlooked', 'emotion.direction', 'emotion.intensity', 'emotion.resistance', 'emotion.response', 'emotion.scriptType', 'emotion.triggers', 'emotion.secondary'].includes(field.path)).map(field => [field.label, draft[section][field.path.split('.')[1]]]))].filter(([, value]) => value !== null && value !== undefined && value !== '' && (!Array.isArray(value) || value.length) && (typeof value !== 'object' || Object.keys(value).length));
  return <details className="fc-earlier"><summary>Earlier writing and retained settings{legacy.length ? ` · ${legacy.length}` : ''}</summary>{legacy.length ? legacy.map(([label, value], i) => <section key={i}><b>{label}</b><pre>{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</pre></section>) : <p>No earlier writing.</p>}</details>;
}

export default function FateCharacter({ draft, onEdit, onTransition, field, entities, output, record, onGo }) {
  const advanced = draft.meta.depth === 'advanced', pillar = { F: 'focus', A: 'authority', T: 'tribe', E: 'emotion' }[draft.lastStep];
  const selected = path => fateFieldsFor('character', draft.lastStep).find(item => item.path === path);
  return <>
    {draft.lastStep === 'setup' && <><FateTypePicker purpose="character" onChange={value => onEdit('meta.purpose', value)} disabled={!!record} /><label className="nw-field">Character name<input className="field-input" value={draft.title} onChange={event => onEdit('title', event.target.value)} /></label></>}
    {pillar && <><div className="fw-pillar-header"><h3>{{ F: 'What catches their attention, and what passes unnoticed?', A: 'Whom do they trust, and what earns that trust?', T: 'Where do they feel they belong?', E: 'Which feelings return, and how do they usually respond?' }[draft.lastStep]}</h3><button type="button" className="btn" aria-pressed={!!draft.meta.locks[draft.lastStep]} onClick={() => onEdit(`meta.locks.${draft.lastStep}`, !draft.meta.locks[draft.lastStep])}>{draft.meta.locks[draft.lastStep] ? 'Unlock step' : 'Lock step'}</button></div><fieldset className="fw-pillar-fields" disabled={!!draft.meta.locks[draft.lastStep]}><legend className="sr-only">{draft.lastStep}</legend>
      {draft.lastStep === 'F' && <><FateSignalEditor draft={draft} onEdit={onEdit} /><details><summary>Meaning of the signal · optional</summary>{field(selected('focus.hooks'))}</details>{!!draft.focus.channels?.length && <details><summary>Earlier noticing choices</summary>{field(selected('focus.channels'))}</details>}</>}
      {draft.lastStep === 'A' && <>{field(selected('authority.source'))}<FatePeopleEditor draft={draft} section="authority" entities={entities} onEdit={onEdit} advanced={advanced} />{field(selected('authority.challengeable'))}{field(selected('authority.crack'))}{advanced && <details><summary>More detail</summary>{field(selected('authority.basis'))}{field(selected('authority.markers'))}</details>}</>}
      {draft.lastStep === 'T' && <>{field(selected('tribe.pull'))}{field(selected('tribe.statusStakes'))}{field(selected('tribe.position'))}<FatePeopleEditor draft={draft} section="tribe" entities={entities} onEdit={onEdit} advanced={advanced} />{!!draft.tribe.groups?.length && <details><summary>Earlier named relationships</summary>{field(selected('tribe.groups'))}</details>}{text('How do loyalties support or conflict? · optional', draft.tribe.loyalties, value => onEdit('tribe.loyalties', value))}{field(selected('tribe.scriptElements'))}{advanced && <details><summary>Writer notes · optional</summary>{text('Notes', draft.notes.T, value => onEdit('notes.T', value))}</details>}</>}
      {draft.lastStep === 'E' && <>{field(selected('emotion.recurring'))}<FateCharacterPatterns draft={draft} onEdit={onEdit} onTransition={onTransition} advanced={advanced} preferences={{}} onRemember={() => {}} />{advanced && <details><summary>One especially common feeling · optional</summary>{field(selected('emotion.primary'))}</details>}{['direction', 'resistance', 'response'].some(key => draft.emotion[key]) && <details><summary>Earlier general emotional tendencies</summary>{['direction', 'resistance', 'response'].map(key => field(selected(`emotion.${key}`)))}</details>}</>}
      <details open={!!draft[pillar].anchor}><summary>In your own words · optional</summary>{text('Your summary', draft[pillar].anchor, value => onEdit(`${pillar}.anchor`, value), 3)}</details>
    </fieldset></>}
    {draft.lastStep === 'review' && <><label className="nw-field">Character name<input className="field-input" value={draft.title} onChange={event => onEdit('title', event.target.value)} /></label>{text('Character description · FATE contribution', output, value => onEdit('output.text', value), 18)}{draft.output.text !== undefined && <div className="cp-review"><p>Your wording is protected while answers change.</p><button type="button" className="btn" onClick={() => { if (window.confirm('Rebuild this FATE description from the current answers? Your answers and earlier notes are retained.')) onEdit('output.text', undefined); }}>Rebuild from answers</button></div>}</>}
    <FateEarlierWriting draft={draft} onEdit={onEdit} />
    {draft.lastStep !== 'setup' && <div className="fc-ideas-inline"><FateCharacterPreview draft={draft} onGo={onGo} /></div>}
  </>;
}
