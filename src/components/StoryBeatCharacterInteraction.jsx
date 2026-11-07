import React from 'react';
import {
  CHARACTER_INTENTIONS,CHARACTER_MOTIVES,CHARACTER_RESISTANCE,characterResistanceDetails,
  CHARACTER_RESPONSES,CHARACTER_OUTCOMES,characterConditions,characterCondition,
  CHARACTER_RISKS,CHARACTER_RESPONSIBILITIES,CHARACTER_OCCASION_LINKS,
} from '../data/storyBeatApproaches.js';
import {beatClauseNames,beatSectionClauses} from '../lib/storyBeatWorkshop.js';

export default function StoryBeatCharacterInteraction({workshop,game,section,part,onChange,roleEditor,ChoiceGroup}) {
  const answers=part.interaction||{};
  const patch=value=>onChange({interaction:{...answers,...value}});
  const opener=beatSectionClauses(workshop,'opener')[0];
  const names=opener?beatClauseNames(workshop,game,opener):{actor:'Person pursuing the aim',other:'Other person'};
  if(section==='opener')return <>
    <p className="sbw-context">Choose an intention, then assign the person, the aim and who else is involved using the italic words.</p>
    <ChoiceGroup label="What is someone trying to do?" options={CHARACTER_INTENTIONS} value={answers.intention} onChange={intention=>patch({intention})}/>
    {answers.intention&&<section className="sbw-shape-opener" aria-label="Shape this opener"><h4>Shape this opener</h4>
      {roleEditor}
      <ChoiceGroup label="What drives the intention? · optional" options={CHARACTER_MOTIVES} value={answers.motive} onChange={motive=>patch({motive})}/>
    </section>}
  </>;
  if(section==='complication')return <>
    <ChoiceGroup label="Why does the other person resist?" options={CHARACTER_RESISTANCE} value={answers.resistance} onChange={resistance=>patch({resistance,detail:''})}/>
    {!!characterResistanceDetails(part).length&&<ChoiceGroup label="What does that mean here?" options={characterResistanceDetails(part)} value={answers.detail} onChange={detail=>patch({detail})}/>}
    {roleEditor}
  </>;
  if(section==='involvement')return <>
    <ChoiceGroup label="How can players respond to these intentions? · choose any" options={CHARACTER_RESPONSES} value={answers.responses||[]} multiple onChange={responses=>patch({responses})}/>
    {roleEditor}
  </>;
  if(section==='consequences'){
    const options=characterConditions(workshop),earlier=characterCondition(workshop,part);
    if(earlier&&!options.some(option=>option.id===earlier.id))options.unshift(earlier);
    return <>
      <ChoiceGroup label="Which player response leads here?" options={options} value={answers.condition} onChange={condition=>patch({condition})}/>
      <ChoiceGroup label="What happens to the intention?" options={CHARACTER_OUTCOMES} value={answers.outcome} onChange={outcome=>patch({outcome})}/>
      {roleEditor}
    </>;
  }
  if(section==='stakes')return <>
    <ChoiceGroup label="Whose position is at risk?" options={[
      {id:'actor',label:names.actor,icon:'user',tone:'blue'},
      {id:'other',label:names.other,icon:'users',tone:'teal'},
    ]} value={answers.who||'actor'} onChange={who=>patch({who:who||'actor'})}/>
    <ChoiceGroup label="What could they gain or lose?" options={CHARACTER_RISKS} value={answers.risk} onChange={risk=>patch({risk})}/>
    <ChoiceGroup label="Why are they accountable or exposed?" options={CHARACTER_RESPONSIBILITIES} value={answers.responsibility} onChange={responsibility=>patch({responsibility})}/>
    {roleEditor}
  </>;
  return <>
    <ChoiceGroup label="How does the occasion shape their interaction?" options={CHARACTER_OCCASION_LINKS} value={answers.connection} onChange={connection=>patch({connection})}/>
    {roleEditor}
  </>;
}
