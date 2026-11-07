import React, {useEffect,useId,useRef,useState} from 'react';
import {PrimIcon} from './bits.jsx';
import {beatRefKey} from '../lib/storyBeatWorkshop.js';

const TYPES=[['character','Characters','user'],['group','Groups','users'],['item','Items','box'],['storyLocation','Locations','pin']];

export default function StoryBeatParticipants({entities,participants,workshop,onChange}) {
  const [kind,setKind]=useState('character'),[query,setQuery]=useState(''),[expanded,setExpanded]=useState(false);
  const picker=useRef(null),triggers=useRef({}),dropdownId=useId();
  const selected=new Set(participants.map(row=>row.key));
  const matches=entities.filter(row=>row.kind===kind&&row.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).sort((a,b)=>a.name.localeCompare(b.name));
  const current=TYPES.find(row=>row[0]===kind),nameCounts=new Map();
  for(const row of entities.filter(row=>row.kind===kind))nameCounts.set(row.name,(nameCounts.get(row.name)||0)+1);
  const close=()=>{setExpanded(false);triggers.current[kind]?.focus();};
  useEffect(()=>{
    if(!expanded)return;
    const outside=event=>{if(!picker.current?.contains(event.target))setExpanded(false);};
    document.addEventListener('pointerdown',outside);
    return()=>document.removeEventListener('pointerdown',outside);
  },[expanded]);
  const add=row=>{onChange([...workshop.participants.filter(value=>beatRefKey(value.ref)!==row.key),{ref:row.ref,name:row.name}]);if(expanded)close();};
  const choice=row=><button type="button" key={row.key} aria-label={row.name+(nameCounts.get(row.name)>1?' · '+row.ref.nodeId:'')} disabled={selected.has(row.key)} onClick={()=>add(row)}>
    {row.node.image?.dataUrl?<img src={row.node.image.dataUrl} alt=""/>:<PrimIcon icon={current[2]} size={15}/>}
    <span>{row.name}</span>{nameCounts.get(row.name)>1&&<small>{row.ref.nodeId}</small>}{selected.has(row.key)?<PrimIcon icon="check" size={12}/>:<span className="sbw-cast-add-icon" aria-hidden="true">+</span>}
  </button>;
  return <section ref={picker} className="sbw-cast-picker" aria-label="Add participants" onKeyDown={event=>{if(event.key==='Escape'&&expanded){event.preventDefault();event.stopPropagation();close();}}}>
    <div className="sbw-cast-types" aria-label="Participant categories">{TYPES.map(([type,label,icon])=><button type="button" key={type} ref={element=>{triggers.current[type]=element;}} aria-label={label} aria-pressed={kind===type} aria-expanded={kind===type&&expanded} aria-haspopup="dialog" aria-controls={kind===type&&expanded?dropdownId:undefined} title={'Click again to browse all '+label.toLowerCase()} onClick={()=>{if(kind===type)setExpanded(value=>!value);else{setKind(type);setQuery('');setExpanded(false);}}}><PrimIcon icon={icon} size={13}/>{label}<span className="sbw-cast-count">{entities.filter(row=>row.kind===type).length}</span><span aria-hidden="true">▾</span></button>)}</div>
    <input aria-label="Find participants" placeholder={'Find '+TYPES.find(row=>row[0]===kind)[1].toLowerCase()+'…'} value={query} onChange={event=>setQuery(event.target.value)}/>
    <div className="sbw-cast-results">{matches.slice(0,6).map(choice)}{matches.length>6&&<button type="button" aria-haspopup="dialog" aria-expanded={expanded} onClick={()=>setExpanded(value=>!value)}>Browse all {matches.length}…</button>}{!matches.length&&<p>No {current[1].toLowerCase()} {query?'match this search.':'in this narrative yet.'}</p>}</div>
    {expanded&&<div className="sbw-cast-dropdown" role="dialog" aria-label={'All '+current[1].toLowerCase()} id={dropdownId}>
      <header><b>{current[1]}</b><small>{matches.length} {query?'matching':'total'}</small><button type="button" aria-label="Close participant list" onClick={close}>×</button></header>
      <div className="sbw-cast-dropdown-list" tabIndex={0} aria-label={'Scrollable '+current[1].toLowerCase()}>{matches.map(choice)}{!matches.length&&<p>No {current[1].toLowerCase()} {query?'match this search.':'in this narrative yet.'}</p>}</div>
    </div>}
  </section>;
}
