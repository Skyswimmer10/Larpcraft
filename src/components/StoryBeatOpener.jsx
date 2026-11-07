import React from 'react';
import {PrimIcon} from './bits.jsx';
import {beatOpenerDefinition,beatSectionClauses,beatClauseSegments,beatSlotAllows} from '../lib/storyBeatWorkshop.js';
import './StoryBeatOpener.css';

export function BeatSectionRoles({workshop,game,section,branchId,selectedSlot,onRole,pinnedParticipant,onlyContext=false,excludeContext=false}) {
  const clauses=beatSectionClauses(workshop,section,branchId).filter(clause=>(!onlyContext||clause.contextual)&&(!excludeContext||!clause.contextual)&&/\{\w+\}/.test(clause.template));
  if(!clauses.length)return null;
  return <section className="sbw-replacements" aria-label="Replace words with story content">
    <header><PrimIcon icon="swap" size={13}/><span>Replace in this sentence</span><small>Click the italic words</small></header>
    {clauses.map(clause=><p className="sbw-role-sentence" key={clause.key}>{beatClauseSegments(workshop,game,clause).map(segment=>segment.role?<button type="button" key={segment.key}
      className={'sbw-role-slot'+(segment.assigned?' assigned':'')+(pinnedParticipant&&beatSlotAllows(segment,pinnedParticipant.node)?' compatible':'')}
      aria-label={'Assign '+segment.label.toLowerCase()} aria-pressed={selectedSlot?.clauseKey===clause.key&&selectedSlot?.role===segment.role} title={segment.label+(segment.missing?' · linked node unavailable; saved name retained':'')}
      onClick={()=>onRole(segment)}><PrimIcon icon={segment.icon} size={11}/>{segment.assigned?segment.name:segment.label}</button>:<React.Fragment key={segment.key}>{segment.text}</React.Fragment>)}{/[.!?]$/.test(clause.template)?'':'.'}</p>)}
    <span className="sbw-role-help">Choose a highlighted word, then a character, group, item or location from In this beat.</span>
  </section>;
}

export default function StoryBeatOpener({workshop,game,onPatch,selectedSlot,onRole,pinnedParticipant,children}) {
  const guide=beatOpenerDefinition(workshop);
  if(!guide)return null;
  const answers=workshop.opener.guidance?.[guide.key]||{};
  return <section className="sbw-shape-opener" aria-label="Shape this opener">
    <h4>Shape this opener</h4>
    <BeatSectionRoles workshop={workshop} game={game} section="opener" excludeContext selectedSlot={selectedSlot} onRole={onRole} pinnedParticipant={pinnedParticipant}/>
    {guide.prompts.map(prompt=><fieldset className="sbw-opener-prompt" key={prompt.id}><legend>{prompt.label}</legend><div>{prompt.options.map(option=><button type="button" key={option.id}
      className={'sbw-choice sbw-tone-'+option.tone} aria-pressed={answers[prompt.id]===option.id}
      onClick={()=>onPatch({guidance:{...workshop.opener.guidance,[guide.key]:{...answers,[prompt.id]:answers[prompt.id]===option.id?'':option.id}}})}>
      <span className="sbw-choice-symbol"><PrimIcon icon={option.icon} size={14}/></span>{option.label}
    </button>)}</div></fieldset>)}
    {children}
  </section>;
}

export function BeatParticipantButtons({participants,slot,pinned,onPick,selectedRefKey}) {
  return <div className="sbw-participant-chips sbw-participant-buttons">{participants.filter(row=>!slot||beatSlotAllows(slot,row.node)).map(row=><button type="button" key={row.key}
    className={(pinned===row.key?' pinned':'')} aria-pressed={pinned===row.key||!!slot&&selectedRefKey===row.key}
    title={row.name} aria-label={(slot?'Use ':'Select ')+row.name}
    onClick={()=>onPick(row)}>{row.node.image?.dataUrl?<img src={row.node.image.dataUrl} alt=""/>:<PrimIcon icon={row.kind==='storyLocation'?'pin':row.kind==='item'?'box':row.kind==='group'?'users':'user'} size={12}/>}<span>{row.name}</span>{participants.filter(other=>other.name===row.name).length>1&&<small>{row.ref.nodeId}</small>}</button>)}</div>;
}
