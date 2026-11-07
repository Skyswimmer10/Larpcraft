import React from 'react';
import { PrimIcon } from './bits.jsx';
import { beatContextAnswers, beatContextChoices, beatContextPart, beatOpenerDefinition } from '../lib/storyBeatWorkshop.js';
import './StoryBeatOpener.css';

export default function StoryBeatContextGuidance({ workshop, section, branchId, onChange }) {
  const prompts = beatContextChoices(workshop, section);
  if (!prompts.length) return null;
  const opener = beatOpenerDefinition(workshop), part = beatContextPart(workshop, section, branchId);
  const answers = beatContextAnswers(workshop, section, branchId);
  const choose=(prompt,option,selected)=>{
    const value=prompt.multiple?selected.includes(option.id)?selected.filter(id=>id!==option.id):[...selected,option.id]:selected.includes(option.id)?'':option.id;
    const next={...answers,[prompt.id]:value};
    if(prompt.id==='condition')next.conditionSource=value&&option.source?option.source:null;
    onChange({context:{...part.context,[opener.key]:next}});
  };
  return <section className="sbw-context-guidance" aria-label="Connected story suggestions">
    <header><PrimIcon icon="link" size={13}/><span>From this opener</span><strong>{opener.label}</strong><small>Optional</small></header>
    {prompts.map(prompt => <fieldset key={prompt.id} className="sbw-opener-prompt"><legend>{prompt.label}</legend><div>
      {prompt.options.map(option => {
        const selected = prompt.multiple ? (Array.isArray(answers[prompt.id]) ? answers[prompt.id] : []) : [answers[prompt.id]];
        return <button type="button" key={option.id} className={'sbw-choice sbw-tone-' + option.tone}
          aria-pressed={selected.includes(option.id)} title={option.text.replace(/\{(\w+)\}/g, '$1')}
          onClick={() => choose(prompt,option,selected)}>
          <span className="sbw-choice-symbol"><PrimIcon icon={option.icon} size={14}/></span>{option.label}
        </button>;
      })}
    </div></fieldset>)}
  </section>;
}
