import React, {useId, useState} from 'react';
import {PrimIcon} from './bits.jsx';
import {BEAT_OCCASIONS, BEAT_COLLISIONS} from '../data/storyBeatWorkshop.js';
import {beatSelectedOption} from '../lib/storyBeatWorkshop.js';
import './StoryBeatCategoryRail.css';

const FAMILY_ICONS = {social:'users',undertaking:'target',transition:'swap',rules:'rules',distribution:'layers',information:'book',bargain:'link',conflict:'alert',possession:'box',loyalty:'heart',disruption:'zap',pressure:'target',encounter:'pin',resistance:'cross',means:'box',time:'clock',commitments:'branches',exposure:'user',cost:'heart',unexpected:'zap'};

export function BeatCatalogueRail({catalogue, familyId, selected, onBrowse, onChoose, label, choicesLabel, children}) {
  const [query,setQuery]=useState('');
  const searchId=useId();
  const family=catalogue.find(row=>row.id===familyId)||catalogue[0];
  const search=query.trim().toLocaleLowerCase();
  const rows=(search?catalogue:[family]).flatMap(group=>group.options.map(option=>({...option,familyId:group.id,familyLabel:group.label})))
    .filter(option=>!search||(option.label+' '+option.familyLabel).toLocaleLowerCase().includes(search))
    .sort((a,b)=>a.label.localeCompare(b.label)||a.familyLabel.localeCompare(b.familyLabel));
  return <section className="sbw-catalogue" aria-label={label}>
    <label className="sbw-catalogue-search" htmlFor={searchId}><PrimIcon icon="search" size={15}/><input id={searchId} type="search" value={query} placeholder="Search all families…" aria-label={'Search '+label.toLowerCase()} onChange={event=>setQuery(event.target.value)}/></label>
    <div className="sbw-catalogue-columns">
      <nav className="sbw-category-rail" aria-label={label+' categories'}>{catalogue.map(group=><button type="button" key={group.id} aria-pressed={!search&&family.id===group.id}
        onClick={()=>{setQuery('');onBrowse(group.id);}}><PrimIcon icon={FAMILY_ICONS[group.id]||group.options[0]?.icon||'flag'} size={15}/><span>{group.label}</span></button>)}</nav>
      <fieldset className="sbw-catalogue-results"><legend>{search?'Matches across all families':choicesLabel+' · '+family.label}</legend>
        <div className="sbw-catalogue-options">{rows.map(option=><button type="button" key={option.familyId+':'+option.id}
          className={'sbw-choice sbw-tone-'+option.tone} aria-pressed={selected?.familyId===option.familyId&&selected?.optionId===option.id}
          onClick={()=>onChoose(option)}><span className="sbw-choice-symbol"><PrimIcon icon={option.icon} size={15}/></span><span>{option.label}{search&&<small>{option.familyLabel}</small>}</span></button>)}</div>
        {!rows.length&&<p className="sbw-context" role="status">No matching choices.</p>}
        {children}
      </fieldset>
    </div>
  </section>;
}

export function BeatFamilyChoices({part,catalogue,onChange,familyLabel,choicesLabel,children}) {
  const [browsing,setBrowsing]=useState(null);
  return <BeatCatalogueRail catalogue={catalogue} familyId={browsing||part.family} label={familyLabel} choicesLabel={choicesLabel}
    selected={{familyId:part.family,optionId:beatSelectedOption(part,catalogue)?.id}}
    onBrowse={setBrowsing}
    onChoose={option=>{setBrowsing(option.familyId);onChange({family:option.familyId,selections:{...part.selections,[option.familyId]:part.family===option.familyId&&part.selections?.[option.familyId]===option.id?'':option.id}});}}>{children}</BeatCatalogueRail>;
}

export function BeatOccasionPairer({part,onChange}) {
  const [target,setTarget]=useState(()=>part.collisionEnabled?'second':'first');
  const [secondFamily,setSecondFamily]=useState(null);
  const [firstFamily,setFirstFamily]=useState(null);
  const first=beatSelectedOption(part,BEAT_OCCASIONS);
  const secondGroup=BEAT_OCCASIONS.find(group=>group.options.some(option=>option.id===part.second));
  const second=secondGroup?.options.find(option=>option.id===part.second);
  const combined=!!part.collisionEnabled;
  const chooseTarget=next=>{setTarget(next);if(next==='second'&&!combined)onChange({collisionEnabled:true});};
  const choose=option=>{
    if(target==='first'){setFirstFamily(option.familyId);onChange({family:option.familyId,selections:{...part.selections,[option.familyId]:option.id}});}
    else {setSecondFamily(option.familyId);onChange({second:option.id,collisionEnabled:true});}
  };
  return <section className="sbw-occasion-pairer" aria-label="Occasion pairing">
    <div className="sbw-occasion-pair">
      <button type="button" className="sbw-occasion-slot" aria-label="Edit first occasion" aria-pressed={target==='first'} onClick={()=>chooseTarget('first')}>
        <PrimIcon icon={first?.icon||'clock'} size={17}/><span><small>First occasion</small><strong>{first?.label||'Choose an occasion'}</strong></span>
      </button>
      <PrimIcon icon="link" size={15}/>
      <button type="button" className="sbw-occasion-slot" aria-label="Edit second occasion" aria-pressed={target==='second'} onClick={()=>chooseTarget('second')}>
        <PrimIcon icon={combined?(second?.icon||'flag'):'link'} size={17}/><span><small>Second occasion</small><strong>{combined?(second?.label||part.second||'Choose an occasion'):'Combine with another'}</strong></span>
      </button>
    </div>
    {target&&<><p className="sbw-catalogue-target">Choose the {target} occasion</p>
      <BeatCatalogueRail key={target} catalogue={BEAT_OCCASIONS} label={target==='first'?'First occasion':'Second occasion'} choicesLabel="Choose an occasion"
        familyId={target==='first'?firstFamily||part.family:secondFamily||secondGroup?.id}
        selected={target==='first'?{familyId:part.family,optionId:first?.id}:{familyId:secondGroup?.id,optionId:part.second}}
        onBrowse={family=>target==='first'?setFirstFamily(family):setSecondFamily(family)} onChoose={choose}/>
    </>}
    {combined&&part.second&&<fieldset className="sbw-occasion-relations"><legend>How does {second?.label||'the second occasion'} connect to {first?.label||'the first occasion'}?</legend>
      <div className="sbw-choice-wrap">{BEAT_COLLISIONS.map(option=><button key={option.id} type="button" className={'sbw-choice sbw-tone-'+option.tone} aria-pressed={part.collision===option.id} onClick={()=>onChange({collision:part.collision===option.id?'':option.id})}>
        <span className="sbw-choice-symbol"><PrimIcon icon={option.icon} size={15}/></span>{option.label}
      </button>)}</div>
    </fieldset>}
    <div className="sbw-occasion-actions">
      {combined&&<button type="button" className="linkbtn" onClick={()=>{onChange({collisionEnabled:false,second:'',collision:''});setSecondFamily(null);setTarget('first');}}>Remove second occasion</button>}
      {combined&&first&&second&&target&&<button type="button" className="btn small" onClick={()=>setTarget(null)}>Use this pair</button>}
    </div>
  </section>;
}
