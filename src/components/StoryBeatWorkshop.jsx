import React, { useId, useMemo, useRef, useState } from 'react';
import StoryBeatDialog from './StoryBeatDialog.jsx';
import {BeatFamilyChoices, BeatOccasionPairer} from './StoryBeatCategoryRail.jsx';
import StoryBeatOpener, {BeatParticipantButtons,BeatSectionRoles} from './StoryBeatOpener.jsx';
import StoryBeatParticipants from './StoryBeatParticipants.jsx';
import StoryBeatStructure from './StoryBeatStructure.jsx';
import StoryBeatContextGuidance from './StoryBeatContextGuidance.jsx';
import StoryBeatCharacterInteraction from './StoryBeatCharacterInteraction.jsx';
import { BEAT_APPROACHES } from '../data/storyBeatApproaches.js';
import { PrimIcon } from './bits.jsx';
import { NarrativeWizardButton } from './NarrativeWizard.jsx';
import { FRAMEWORK_TYPES } from '../data/seed.js';
import { VALUES_LIBRARY } from '../data/humanValuesWizard.js';
import {
  BEAT_WORKSHOP_SECTIONS as SECTIONS, BEAT_OPENERS,
  BEAT_COMPLICATIONS, BEAT_COMPLICATION_EFFECTS, BEAT_ENTRIES, BEAT_INTERACTIONS, BEAT_INFLUENCE,
  BEAT_CONDITIONS, BEAT_CONSEQUENCE_EFFECTS, BEAT_TIMING, BEAT_VISIBILITY, BEAT_CHANGE_DOMAINS,
} from '../data/storyBeatWorkshop.js';
import {
  beatWorkshopDetails, beatWorkshopPatch, beatWorkshopApproachPatch, beatEntities,
  beatRefKey, beatConnectedParticipants, beatWorkshopSentences, beatWorkshopText, beatValueSources,
  beatStakesValues,
  beatSectionClauses,beatClauseSegments,beatSlotAllows,beatContextAnswers,beatOpenerDefinition,
} from '../lib/storyBeatWorkshop.js';
import './StoryBeatWorkshop.css';

const EMPTY_GAME = Object.freeze({});
const ROOT_SCOPE = Object.freeze({ coll: 'nodes' });
const TABS = ['opener','complication','involvement','consequences','stakes','occasion'].map(id => SECTIONS.find(row => row.id === id));
const toggle = (values, value) => values.includes(value) ? values.filter(item => item !== value) : [...values, value];
const MORAL_OPTIONS = FRAMEWORK_TYPES.haidtMoralConflicts.phases.map((row, index) => ({
  id: row.key + ' / ' + row.name, label: row.key + ' / ' + row.name,
  icon: ['heart', 'rules', 'branches', 'flag', 'users', 'star'][index],
  tone: ['rose', 'blue', 'teal', 'violet', 'green', 'amber'][index],
}));

export function BeatChoiceGroup({ label, options, value, onChange, multiple = false }) {
  const selected = multiple ? value || [] : [value];
  return <fieldset className="sbw-choice-group"><legend>{label}</legend><div className="sbw-choice-wrap">
    {options.map(option => <button type="button" key={option.id} className={'sbw-choice sbw-tone-' + option.tone} aria-pressed={selected.includes(option.id)}
      onClick={() => onChange(multiple ? toggle(selected, option.id) : value === option.id ? '' : option.id)}>
      <span className="sbw-choice-symbol"><PrimIcon icon={option.icon} size={15} /></span><span>{option.label}</span>
    </button>)}
  </div></fieldset>;
}
function Picker({ label, value, options, onChange, placeholder = 'Choose if useful…' }) {
  const id = useId(), old = value && !options.some(option => option.id === value);
  return <label className="sbw-field" htmlFor={id}><span>{label}</span><select id={id} value={value || ''} onChange={event => onChange(event.target.value)}>
    <option value="">{placeholder}</option>{old && <option value={value}>{value} · earlier choice</option>}
    {options.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
  </select></label>;
}
function Text({ label, value, onChange, multiline = false, placeholder }) {
  const id = useId(), Control = multiline ? 'textarea' : 'input';
  return <label className="sbw-field" htmlFor={id}><span>{label}</span><Control id={id} value={value || ''} rows={multiline ? 3 : undefined} placeholder={placeholder} onChange={event => onChange(event.target.value)} /></label>;
}
function ParticipantChips({ participants }) {
  return <div className="sbw-participant-chips">{participants.map(row => <span key={row.key} title={row.label}><PrimIcon icon={row.kind === 'storyLocation' ? 'pin' : row.kind === 'item' ? 'box' : row.kind === 'group' ? 'users' : 'user'} size={12} />{row.name}</span>)}</div>;
}

export default function StoryBeatWorkshopLaunchers({ node, onPatch, game = EMPTY_GAME, scope = ROOT_SCOPE }) {
  const [open, setOpen] = useState(null);
  const participants = useMemo(() => beatConnectedParticipants(node, game, scope), [node, game, scope]);
  return <section className="sbw-launchers" aria-label="Story Beat workshop">
    <div className="sbw-launcher-groups">{['Context', 'Action', 'Outcomes'].map(group => <div key={group} className="sbw-launcher-group">
      <span className="sbw-group-label">{group}</span><div className="sbw-launcher-row">{SECTIONS.filter(section => section.group === group).map(section => <button type="button" className="sbw-launcher" key={section.id}
        aria-haspopup="dialog" onClick={() => setOpen({ section: section.id })}><PrimIcon icon={section.icon} size={15} /><span>{section.label}</span></button>)}</div>
    </div>)}</div>
    <button type="button" className="btn small sbw-structure-launch" onClick={()=>setOpen({section:'opener',view:'structure'})}><PrimIcon icon="layers" size={14}/>Internal story canvas</button>
    <div className="sbw-launcher-participants"><ParticipantChips participants={participants} /><button type="button" className="linkbtn sbw-participant-button" onClick={() => setOpen({ section: 'occasion', participants: true })}><PrimIcon icon="link" size={12} />Participants</button></div>
    {open && <StoryBeatWorkshop node={node} onPatch={onPatch} game={game} scope={scope} initialSection={open.section} initialView={open.view} initialParticipantsOpen={open.participants} onClose={() => setOpen(null)} />}
  </section>;
}

export function StoryBeatWorkshop({ node, onPatch, game = EMPTY_GAME, scope = ROOT_SCOPE, initialSection = 'opener', initialParticipantsOpen = false, initialView='workshop',initialBranchId=null,initialComplicationId=null,onClose }) {
  const [active, setActive] = useState(initialSection), [participantsOpen, setParticipantsOpen] = useState(initialParticipantsOpen), [branchId, setBranchId] = useState(initialBranchId);
  const [view,setView]=useState(initialView||'workshop'),[complicationId,setComplicationId]=useState(initialComplicationId);
  const [roleSelection,setRoleSelection]=useState(null),[pinned,setPinned]=useState(null),[rolePicker,setRolePicker]=useState(false),[roleQuery,setRoleQuery]=useState('');
  const id = useId(), tabs = useRef(null), editor = useRef(null);
  const w = beatWorkshopDetails(node);
  const isCharacter=w.approach==='characterInteraction';
  const entities = useMemo(() => beatEntities(game,scope), [game,scope]);
  const participants = useMemo(() => beatConnectedParticipants(node, game, scope), [node, game, scope]);
  const sources = useMemo(() => beatValueSources(game), [game]);
  const valueDefinitions = useMemo(() => [...VALUES_LIBRARY, ...(game.humanValuesLibrary || [])], [game.humanValuesLibrary]);
  const sentences = beatWorkshopSentences(node, game), prose = sentences.map(row => row.text).join('\n\n');
  const stakes = beatStakesValues(w, game), currentBranch = w.consequences.find(row => row.id === branchId) || w.consequences[0] || { id: 'unsaved-possibility' };
  const currentComplication=w.complications.find(row=>row.id===complicationId)||w.complication;
  const selectedPartId=active==='consequences'?currentBranch.id:active==='complication'?currentComplication.id:undefined;
  const part = (section, patch) => onPatch(beatWorkshopPatch(node, section, patch));
  const patchComplication=patch=>currentComplication.id?part('complications',w.complications.map(row=>row.id===currentComplication.id?{...row,...patch}:row)):part('complication',patch);
  const changeSection = section => { setActive(section);setRoleSelection(null);setPinned(null);setRolePicker(false);editor.current?.scrollTo?.(0, 0); };
  const clauses=beatSectionClauses(w,active,selectedPartId);
  const slot=clauses.flatMap(clause=>beatClauseSegments(w,game,clause)).find(segment=>segment.role&&segment.clauseKey===roleSelection?.clauseKey&&segment.role===roleSelection?.role);
  const slotValue=slot?.value;
  const pinnedParticipant=participants.find(row=>row.key===pinned);
  const finishRole=()=>{setRoleSelection(null);setPinned(null);setRolePicker(false);setRoleQuery('');};
  const assignRole=(selected,row)=>{part('bindings',{[selected.clauseKey]:{...w.bindings[selected.clauseKey],[selected.role]:{ref:row.ref||null,name:row.name}}});finishRole();};
  const chooseSlot=segment=>{
    if(pinnedParticipant&&beatSlotAllows(segment,pinnedParticipant.node)){assignRole(segment,pinnedParticipant);return;}
    setRoleSelection({clauseKey:segment.clauseKey,role:segment.role});setPinned(null);setRoleQuery('');setParticipantsOpen(false);
    setRolePicker(!participants.some(row=>beatSlotAllows(segment,row.node)));
  };
  const chooseParticipant=row=>{
    if(slot){assignRole(slot,row);return;}
    setPinned(pinned===row.key?null:row.key);setRoleSelection(null);setRolePicker(false);setParticipantsOpen(false);
  };
  const roleMatches=slot?entities.filter(row=>beatSlotAllows(slot,row.node)&&(!roleQuery.trim()||row.name.toLocaleLowerCase().includes(roleQuery.trim().toLocaleLowerCase()))).sort((a,b)=>a.name.localeCompare(b.name)):[];
  const patchBranch = patch => {
    if (w.consequences.length) {
      const next = beatWorkshopPatch(node, 'consequences', w.consequences.map(row => row.id === currentBranch.id ? { ...row, ...patch } : row));
      if ('result' in patch) {
        const key='consequences/'+currentBranch.id+'/'+currentBranch.effect;
        next.storyBeat.workshop.bindings={...w.bindings,[key]:{...w.bindings[key],result:{ref:null,name:''}}};
      }
      onPatch(next);
    }
    else { const newId = crypto.randomUUID(); part('consequences', [{ id: newId, ...patch }]); setBranchId(newId); }
  };
  const patchValue = (rowId, patch) => part('stakes', { values: w.stakes.values.map(row => row.id === rowId ? { ...row, ...patch } : row) });
  const resetContext = (section, savedPart, field) => {
    const key = beatOpenerDefinition(w)?.key;
    return key ? { ...savedPart.context, [key]: { ...beatContextAnswers(w, section, selectedPartId), [field]: '' } } : savedPart.context;
  };
  const contextualOutcome = beatContextAnswers(w, 'consequences', currentBranch.id).outcome;
  const contextGuidance = <StoryBeatContextGuidance workshop={w} section={active} branchId={selectedPartId}
    onChange={patch => { finishRole(); if(active==='complication')patchComplication(patch);else if(active==='consequences')patchBranch(patch);else part(active,patch); }}/>;
  const sourceKey = w.stakes.source ? sources.find(row => beatRefKey(row.ref) === beatRefKey(w.stakes.source.ref) && (w.stakes.source.sessionId ? row.sessionId === w.stakes.source.sessionId : row.title === w.stakes.source.title))?.key || 'missing' : '';
  const section = SECTIONS.find(row => row.id === active) || SECTIONS[0];
  const replacements = <BeatSectionRoles workshop={w} game={game} section={active} branchId={selectedPartId} onlyContext={active==='opener'&&!isCharacter} selectedSlot={slot} onRole={chooseSlot} pinnedParticipant={pinnedParticipant}/>;
  const changeCharacterPart=patch=>{
    if(active==='complication')patchComplication(patch);
    else if(active==='consequences')patchBranch(patch);
    else if(active==='stakes'&&'who' in patch.interaction){
      const next=beatWorkshopPatch(node,active,patch);
      next.storyBeat.workshop.bindings=Object.fromEntries(Object.entries(w.bindings).map(([key,roles])=>{
        if(!key.startsWith('interaction/stakes/'))return[key,roles];
        const {affected,...rest}=roles;return[key,rest];
      }));
      onPatch(next);finishRole();
    }else part(active,patch);
  };
  const characterFields=<StoryBeatCharacterInteraction workshop={w} game={game} section={active}
    part={active==='complication'?currentComplication:active==='consequences'?currentBranch:w[active]}
    onChange={changeCharacterPart} roleEditor={replacements} ChoiceGroup={BeatChoiceGroup}/>;
  const customNotes = <details className="sbw-detail"><summary>Add your own detail</summary><Text label={section.label + ' · your detail'} value={active==='complication'&&currentComplication.id?currentComplication.notes:w.notes[active]} multiline onChange={value => active==='complication'&&currentComplication.id?patchComplication({notes:value}):part('notes', { [active]: value })} /></details>;
  const renderFields = () => {
    if (active === 'occasion') return <>
      <p className="sbw-context">Give this moment a recognisable context.</p>
      <BeatOccasionPairer part={w.occasion} onChange={patch => part('occasion', patch)} />
      {isCharacter?characterFields:<>{contextGuidance}{replacements}</>}
    </>;
    if(active==='opener'&&isCharacter)return characterFields;
    if (active === 'opener') return <>
      <p className="sbw-context">Choose what begins the situation.</p>
      <BeatFamilyChoices key="opener" part={w.opener} catalogue={BEAT_OPENERS} familyLabel="Story family" choicesLabel="Choose a happening" onChange={patch => part('opener', patch)}>
        <StoryBeatOpener workshop={w} game={game} onPatch={patch=>part('opener',patch)} selectedSlot={slot} onRole={chooseSlot} pinnedParticipant={pinnedParticipant}>
          {contextGuidance}
          {beatContextAnswers(w,'opener').distortion||beatContextAnswers(w,'opener').topic ? replacements : null}
        </StoryBeatOpener>
      </BeatFamilyChoices>
    </>;
    if (active === 'complication') return <>
      <p className="sbw-context">{sentences.find(row => row.id === 'opener')?.text || 'Choose what makes this situation difficult or interesting.'}</p>
      {(w.complication.family||isCharacter&&w.complication.interaction?.resistance||beatContextAnswers(w,'complication').difficulty||w.notes.complication||w.complications.length>0)&&<div className="sbw-branch-toolbar">
        {w.complications.length>0&&<><button type="button" className="btn small" aria-pressed={!currentComplication.id} onClick={()=>{setComplicationId(null);finishRole();}}>Complication 1</button>{w.complications.map((row,index)=><button type="button" className="btn small" key={row.id} aria-pressed={currentComplication.id===row.id} onClick={()=>{setComplicationId(row.id);finishRole();}}>Complication {index+2}</button>)}</>}
        <button type="button" className="btn small" onClick={()=>{const id=crypto.randomUUID();part('complications',[...w.complications,{id}]);setComplicationId(id);finishRole();}}>+ Add complication</button>
        {currentComplication.id&&<button type="button" className="linkbtn danger" onClick={()=>{part('complications',w.complications.filter(row=>row.id!==currentComplication.id));setComplicationId(null);finishRole();}}>Remove complication</button>}
      </div>}
      {isCharacter?characterFields:<>{contextGuidance}
      <details className="sbw-detail" open={!beatContextAnswers(w,'complication',currentComplication.id).difficulty}><summary>Browse all complications</summary>
        <BeatFamilyChoices key={'complication-'+(currentComplication.id||'first')} part={currentComplication} catalogue={BEAT_COMPLICATIONS} familyLabel="Kind of difficulty" choicesLabel="Choose a complication" onChange={patch=>patchComplication({...patch,context:resetContext('complication',currentComplication,'difficulty')})}/>
      </details>
      {replacements}
      <BeatChoiceGroup label="Effect on the intended action" options={BEAT_COMPLICATION_EFFECTS} value={currentComplication.effect} onChange={effect => patchComplication({ effect })} />
      </>}
    </>;
    if(active==='involvement'&&isCharacter)return characterFields;
    if (active === 'involvement') return <>
      {contextGuidance}
      <details className="sbw-detail" open={!beatContextAnswers(w,'involvement').actions?.length}><summary>General player involvement</summary>
      <BeatChoiceGroup label="How do players enter?" options={BEAT_ENTRIES} value={w.involvement.entry} onChange={entry => part('involvement', { entry })} />
      <BeatChoiceGroup label="What can they do? · choose any" options={BEAT_INTERACTIONS} value={w.involvement.interactions} multiple onChange={interactions => part('involvement', { interactions })} />
      <BeatChoiceGroup label="What can they influence?" options={BEAT_INFLUENCE} value={w.involvement.influence} onChange={influence => part('involvement', { influence })} />
      </details>
      {replacements}
    </>;
    if (active === 'consequences') return <>
      <div className="sbw-branch-toolbar">{w.consequences.length > 1 && w.consequences.map((row,index) => <button type="button" className="btn small" key={row.id} aria-pressed={currentBranch.id === row.id} onClick={() => setBranchId(row.id)}>{row.label || 'Possibility ' + (index + 1)}</button>)}
        {w.consequences.length > 0 && <button type="button" className="btn small" onClick={() => { const newId = crypto.randomUUID(); part('consequences', [...w.consequences, { id: newId }]); setBranchId(newId); }}>+ Add possibility</button>}</div>
      <>
        <Text label="Name this possibility · optional" value={currentBranch.label} onChange={label => patchBranch({ label })} />
        {isCharacter?characterFields:<>{contextGuidance}
        <details className="sbw-detail" open={!contextualOutcome}><summary>General conditions & outcomes</summary>
        <BeatChoiceGroup label="If this happens…" options={BEAT_CONDITIONS} value={beatContextAnswers(w,'consequences',currentBranch.id).condition?'':currentBranch.condition} onChange={condition => patchBranch({ condition, conditionText: '', context:resetContext('consequences',currentBranch,'condition') })} />
        <Text label="Your condition · optional" value={currentBranch.conditionText} onChange={conditionText => patchBranch({ conditionText, context:resetContext('consequences',currentBranch,'condition') })} />
        <BeatChoiceGroup label="Then…" options={BEAT_CONSEQUENCE_EFFECTS} value={contextualOutcome?'':currentBranch.effect} onChange={effect => patchBranch({ effect, context:resetContext('consequences',currentBranch,'outcome') })} />
        {!contextualOutcome&&<Text label="Result / thing affected" value={currentBranch.result} placeholder="The truth, source, reputation, item…" onChange={result => patchBranch({ result })} />}
        </details>
        {replacements}
        </>}
        <details className="sbw-detail"><summary>Timing & visibility</summary><BeatChoiceGroup label="When?" options={BEAT_TIMING} value={currentBranch.timing} onChange={timing => patchBranch({ timing })} />
          <BeatChoiceGroup label="Who can know?" options={BEAT_VISIBILITY} value={currentBranch.visibility} onChange={visibility => patchBranch({ visibility })} /></details>
        {w.consequences.length > 0 && <button type="button" className="linkbtn danger" onClick={() => part('consequences', w.consequences.filter(row => row.id !== currentBranch.id))}>Remove possibility</button>}
      </>
    </>;
    return <>
      {isCharacter?characterFields:<>{contextGuidance}
      <BeatChoiceGroup label="What could change?" options={BEAT_CHANGE_DOMAINS} value={w.stakes.domain} onChange={domain => part('stakes', { domain })} />
      {replacements}</>}
      {sources.length > 0 || w.stakes.source ? <Picker label="Use saved Human Values work · optional" value={sourceKey} placeholder="Write values on this beat" options={[...(sourceKey === 'missing' ? [{ id: 'missing', label: w.stakes.source.title + ' · saved snapshot' }] : []), ...sources.map(source => ({ id: source.key, label: source.title }))]} onChange={key => {
        const source = sources.find(row => row.key === key);
        part('stakes', { source: source ? { ref: source.ref, sessionId: source.sessionId, title: source.title, snapshot: (source.record.valuesDraft.values || []).filter(row => row.column === 'inPlay') } : null });
      }} /> : null}
      {w.stakes.source ? <div className="sbw-linked-values"><h4>{w.stakes.source.title}</h4>
        {stakes.missing && <p className="sbw-context">Saved values are shown. Link current Human Values work to continue developing them.</p>}
        {stakes.rows.map(value => <p key={value.id}><b>{value.label}</b>{value.from || value.to ? ': ' + [value.from, value.to].filter(Boolean).join(' → ') : ''}</p>)}
        {stakes.source && <NarrativeWizardButton resumeNode={stakes.source.node} resumeRecord={stakes.source.record} gameScope={{ coll: stakes.source.ref.coll, parentPath: stakes.source.ref.parentPath }} label="Develop linked Human Values" className="btn small" />}
      </div> : <>
        {w.stakes.values.map((row, index) => {
          const definition = valueDefinitions.find(value => value.id === row.valueId);
          const stateOptions = (definition?.states || []).map(value => ({ id: value, label: value }));
          return <div className="sbw-value-row" key={row.id}>
            <Picker label={'Human value ' + (index + 1)} value={row.valueId} options={valueDefinitions} onChange={valueId => patchValue(row.id, { valueId, label: valueDefinitions.find(value => value.id === valueId)?.label, from: '', to: '' })} />
            {definition && <><div className="sbw-field-pair"><Picker label="Starting state" value={row.from} options={stateOptions} onChange={from => patchValue(row.id, { from })} /><Picker label="Possible state" value={row.to} options={stateOptions} onChange={to => patchValue(row.id, { to })} /></div>
              <Text label="Who cares, and why?" value={row.why} onChange={why => patchValue(row.id, { why })} /></>}
            <button type="button" className="linkbtn" onClick={() => part('stakes', { values: w.stakes.values.filter(value => value.id !== row.id) })}>Remove value</button>
          </div>;
        })}
        <button type="button" className="btn small" disabled={w.stakes.values.length >= 3} onClick={() => part('stakes', { values: [...w.stakes.values, { id: crypto.randomUUID(), valueId: '' }] })}>+ Add a human value</button>
      </>}
      <details className="sbw-detail"><summary>Moral tensions · Haidt</summary><BeatChoiceGroup label="Which principles are in tension? · choose any" options={MORAL_OPTIONS} value={w.stakes.morals} multiple onChange={morals => part('stakes', { morals })} /></details>
    </>;
  };
  return <StoryBeatDialog title={view==='structure'?'Story Beat structure':'Story workshop'} subtitle={node.title || 'Story Beat'} onClose={onClose} className="sbw-dialog" actions={<div className="sbw-view-switch" aria-label="Story Beat views"><button type="button" className="btn small" aria-pressed={view==='workshop'} onClick={()=>setView('workshop')}>Workshop</button><button type="button" className="btn small" aria-pressed={view==='structure'} onClick={()=>setView('structure')}><PrimIcon icon="layers" size={13}/>Structure</button></div>}>
    {view==='structure'?<StoryBeatStructure node={node} onPatch={onPatch} game={game} scope={scope} onDevelop={target=>{changeSection(target.section);setBranchId(target.branchId||null);setComplicationId(target.complicationId||null);setView('workshop');}}/>:<>
    <div className="sbw-approaches" role="group" aria-label="Starting approach">
      <span>Start from</span>{BEAT_APPROACHES.map(approach=><button type="button" key={approach.id} aria-pressed={w.approach===approach.id}
        disabled={w.version>1} title={approach.description+' Switch anytime; each approach keeps its choices.'}
        onClick={()=>{if(w.approach!==approach.id){onPatch(beatWorkshopApproachPatch(node,approach.id));finishRole();}}}><PrimIcon icon={approach.icon} size={14}/>{approach.label}</button>)}
      <small>{BEAT_APPROACHES.find(approach=>approach.id===w.approach)?.description}</small>
    </div>
    <nav ref={tabs} className="sbw-tabs" role="tablist" aria-label="Story Beat workshop sections">{TABS.map((item,tabIndex) => <React.Fragment key={item.id}><button type="button" role="tab" id={id + '-' + item.id} tabIndex={active === item.id ? 0 : -1} aria-selected={active === item.id} aria-controls={id + '-panel'} onClick={() => changeSection(item.id)} onKeyDown={event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const index = TABS.indexOf(item), next = event.key === 'Home' ? 0 : event.key === 'End' ? TABS.length - 1 : (index + (event.key === 'ArrowLeft' ? -1 : 1) + TABS.length) % TABS.length;
      changeSection(TABS[next].id); tabs.current?.querySelectorAll('button')[next]?.focus();
    }}><PrimIcon icon={item.icon} size={16} /><span>{item.label}</span></button>{tabIndex<3&&<span className="sbw-flow-arrow" aria-hidden="true">→</span>}</React.Fragment>)}</nav>
    {w.version > 1 ? <p className="sbw-context">This workshop was saved by a newer version of LARPCraft.</p> : <div className="sbw-main">
      <section className="sbw-editor" ref={editor} role="tabpanel" id={id + '-panel'} aria-labelledby={id + '-' + active}>
        <div className="sbw-editor-head"><h3>{active === 'involvement' ? 'Player involvement' : active === 'stakes' ? 'Change & stakes' : section.label}</h3><small>Optional</small></div>
        {renderFields()}{customNotes}
      </section>
      <aside className="sbw-preview" aria-label="Story so far"><header><h3>Story so far</h3><small>Live</small></header>
        <div className="sbw-prose" aria-live="polite">{sentences.length ? sentences.map(row => <button type="button" key={row.id} className={'sbw-sentence' + (active === row.id ? ' active' : '')} aria-label={'Edit ' + (SECTIONS.find(item => item.id === row.id)?.label || row.id)} aria-pressed={active === row.id} onClick={() => changeSection(row.id)}>{row.text}</button>) : <p className="sbw-empty-preview">{node.body || 'Your choices will form the story here. Begin with any section.'}</p>}</div>
        {prose && <button type="button" className="linkbtn sbw-use-description" onClick={() => onPatch({ body: beatWorkshopText(node, game) })}>Use as description</button>}
      </aside>
    </div>}
    <footer className="sbw-footer"><small>In this beat</small>
      {(slot||pinnedParticipant)&&<span className="sbw-role-footer-hint" role="status">{slot?'Choose '+slot.label.toLowerCase():clauses.length?'Click a role for '+pinnedParticipant.name:'Choose a story choice, then a role for '+pinnedParticipant.name}<button type="button" aria-label="Cancel role assignment" onClick={finishRole}><PrimIcon icon="cross" size={12}/></button></span>}
      <BeatParticipantButtons participants={participants} slot={slot} pinned={pinned} onPick={chooseParticipant} selectedRefKey={slot?beatRefKey(slotValue?.ref):null}/>
      {slot&&<button type="button" className="btn small" aria-expanded={rolePicker} onClick={()=>setRolePicker(value=>!value)}>Other / custom…</button>}
      <button type="button" className="btn small" aria-expanded={participantsOpen} onClick={() => {finishRole();setParticipantsOpen(value => !value);}}><PrimIcon icon="link" size={12} />Participants</button>
      {slot&&rolePicker&&<div className="sbw-role-chooser">
        <label>Find or name {slot.label.toLowerCase()}<input value={roleQuery} onChange={event=>setRoleQuery(event.target.value)} placeholder="Search existing content or type a name…"/></label>
        <div className="sbw-role-matches">{roleMatches.slice(0,8).map(row=><button type="button" className="btn small" key={row.key} onClick={()=>assignRole(slot,row)}>{row.name}{roleMatches.filter(other=>other.name===row.name).length>1&&<small>{row.ref.nodeId}</small>}</button>)}
          {!roleMatches.length&&<small>No matching story content.</small>}
          {roleQuery.trim()&&<button type="button" className="btn small" onClick={()=>assignRole(slot,{name:roleQuery.trim()})}>Use “{roleQuery.trim()}” as text</button>}
          {(slotValue?.ref||slotValue?.name)&&<button type="button" className="linkbtn" onClick={()=>assignRole(slot,{name:''})}>Clear role</button>}
        </div>
      </div>}
      {participantsOpen && <StoryBeatParticipants entities={entities} participants={participants} workshop={w} onChange={value=>part('participants',value)}/>}
    </footer></>}
  </StoryBeatDialog>;
}
