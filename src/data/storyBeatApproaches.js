import { BEAT_SLOT_DEFAULTS } from './storyBeatOpenerGuidance.js';

export const BEAT_APPROACHES = [
  { id: 'general', label: 'General', icon: 'branches', description: 'A happening → a difficulty → a player response → what changes.' },
  { id: 'characterInteraction', label: 'Character Interaction', icon: 'users', description: 'An intention → resistance → a player choice → whose position changes.' },
];
export const beatApproach = w => w.approach === 'characterInteraction' ? 'characterInteraction' : 'general';
const tones = ['blue','teal','amber','violet','rose','green'];
const choices = rows => rows.map(([id,label,text,icon],i)=>({id,label,text,icon,tone:tones[i%tones.length]}));
const subject = { label:'Aim / thing involved', kinds:['character','group','item','storyLocation'], icon:'target' };
const roles = { ...BEAT_SLOT_DEFAULTS,
  actor:{...BEAT_SLOT_DEFAULTS.actor,label:'Person pursuing the aim'},
  other:{...BEAT_SLOT_DEFAULTS.other,label:'Other person involved'},
  subject,
  affected:{...BEAT_SLOT_DEFAULTS.actor,label:'Person at risk'},
};
export const CHARACTER_INTENTIONS = choices([
  ['obtain','Obtain','obtain {subject} from {other}','box'],
  ['protect','Protect','protect {subject} from {other}','shield'],
  ['reveal','Reveal','reveal {subject} to {other}','search'],
  ['conceal','Conceal','conceal {subject} from {other}','lock'],
  ['prevent','Prevent','prevent {other} from taking control of {subject}','cross'],
  ['persuade','Persuade','persuade {other} to support {subject}','users'],
  ['fulfil','Fulfil a commitment','fulfil a commitment to {other} concerning {subject}','heart'],
]);
export const CHARACTER_MOTIVES = choices([
  ['safety','Protect someone','{actor} acts out of concern for someone’s safety','shield'],
  ['promise','Keep a promise','{actor} is trying to honour an earlier promise','link'],
  ['standing','Preserve standing','{actor} wants to preserve their standing with {other}','badge'],
  ['bond','Preserve the relationship','{actor} wants to protect the relationship with {other}','heart'],
]);
export const CHARACTER_RESISTANCE = choices([
  ['intention','Conflicting intention','{other} wants {focus}, which conflicts with {actor}’s aim','branches'],
  ['duty','A duty','{other} has a duty to {focus}, which conflicts with {actor}’s aim','rules'],
  ['belief','A belief','{other} believes {focus}, and resists {actor}’s plan','book'],
  ['demand','A demand','{other} will cooperate with {actor} only if {focus}','link'],
]);
const resistanceDetails = {
  intention: choices([
    ['control','Keep control','to keep control of the situation','flag'],
    ['stop','Stop the plan','to stop the plan from proceeding','cross'],
    ['share','A share of the benefit','a share of what the plan would achieve','split-gift'],
    ['neutral','Remain uninvolved','to remain uninvolved','user'],
  ]),
  duty: choices([
    ['admission','Record every arrival','record every arrival','book'],
    ['safety','Protect those present','protect those present','shield'],
    ['fairness','Apply the same rules','apply the same rules to everyone','rules'],
    ['promise','Honour an earlier promise','honour an earlier promise','link'],
  ]),
  belief: choices([
    ['harm','Someone will be harmed','the plan will harm someone','alert'],
    ['lie','The account is false','the account behind the plan is false','search'],
    ['betrayal','Trust will be broken','the plan will betray a shared commitment','heart'],
    ['failure','The plan cannot work','the plan cannot work as intended','cross'],
  ]),
  demand: choices([
    ['explain','Explain the intention','{actor} explains the intention openly','book'],
    ['proof','Provide proof','{actor} provides convincing evidence','search'],
    ['protection','Protect someone at risk','someone at risk is protected first','shield'],
    ['cost','Accept a cost','{actor} accepts a cost for the cooperation','box'],
  ]),
};
export const characterResistanceDetails = part => resistanceDetails[part?.interaction?.resistance] || [];
export const CHARACTER_RESPONSES = choices([
  ['help','Help the intention','help {actor} to {aim}','heart'],
  ['oppose','Support the resistance','support {other} in resisting {actor}’s plan','shield'],
  ['mediate','Mediate','negotiate between {actor} and {other} over {subject}','users'],
  ['investigate','Investigate before choosing','investigate {other}’s reasons for resisting before choosing whom to support','search'],
  ['alternative','Offer another solution','propose a different way for {actor} and {other} to resolve the disagreement','branches'],
]);
export const CHARACTER_OUTCOMES = choices([
  ['success','Intention succeeds','{actor} could achieve the aim: {aim}','check'],
  ['failure','Intention fails','{actor} could be prevented from carrying out the aim: {aim}','cross'],
  ['change','Intention changes','{actor} could revise the aim after hearing {other}’s concerns','swap'],
  ['cost','Success at a cost','{actor} could achieve the aim at the cost of trust with {other}','heart'],
  ['compromise','A compromise','{actor} and {other} could agree on another way forward concerning {subject}','link'],
]);
export const CHARACTER_RISKS = choices([
  ['authority','Authority','{affected} could lose authority over {subject}','flag'],
  ['reputation','Reputation','Trust in {affected}’s judgement concerning {subject} could be damaged','badge'],
  ['relationship','Relationship','The relationship between {affected} and {other} could be strengthened or broken','heart'],
  ['commitment','Commitment','{affected} could become unable to honour a commitment concerning {subject}','link'],
  ['acceptance','Acceptance','{affected} could lose acceptance because of their involvement with {subject}','users'],
  ['safety','Safety','{affected} could be put at risk through their involvement with {subject}','shield'],
]);
export const CHARACTER_RESPONSIBILITIES = choices([
  ['responsible','Responsible for it','{affected} is responsible for {subject}','rules'],
  ['promised','Made a promise','{affected} has made a promise concerning {subject}','link'],
  ['endorsed','Publicly supported it','{affected} has publicly supported {subject}','flag'],
  ['depends','Depends on it','{affected} depends on {subject} to retain their position','target'],
]);
export const CHARACTER_OCCASION_LINKS = choices([
  ['opportunity','Provides an opportunity','The {occasion} gives {actor} an opportunity to {aim}','star'],
  ['expectation','Creates an expectation','The {occasion} creates an expectation that {other} will uphold their responsibilities','rules'],
  ['deadline','Sets a deadline','The end of the {occasion} is the deadline for {actor}’s plan','clock'],
  ['audience','Adds an audience','People attending the {occasion} could witness how {actor} and {other} handle the disagreement','users'],
]);

const selected = (options,id) => options.find(row=>row.id===id);
export function characterOpener(w) {
  const intention=selected(CHARACTER_INTENTIONS,w.opener?.interaction?.intention);
  return intention ? {...intention,key:'character/'+intention.id,text:'{actor} wants to '+intention.text,roles,prompts:[]} : null;
}
export function characterConditions(w) {
  const chosen=Array.isArray(w.involvement?.interaction?.responses)?w.involvement.interaction.responses:[];
  const responses=CHARACTER_RESPONSES.filter(row=>chosen.includes(row.id));
  return [...responses.map(row=>({...row,text:'players '+row.text})),
    {id:'decline',label:'Players leave it unresolved',text:'players leave the disagreement unresolved',icon:'clock',tone:'amber'},
    {id:'resistance',label:'The resistance is overcome',text:'the resistance to {actor}’s plan is overcome',icon:'check',tone:'green'}];
}
export function characterCondition(w,row) {
  return selected(characterConditions(w),row.interaction?.condition)
    || CHARACTER_RESPONSES.map(option=>({...option,label:option.label+' · earlier response',text:'players '+option.text})).find(option=>option.id===row.interaction?.condition);
}
export function characterSectionClauses(w,section,branchId) {
  const opener=characterOpener(w), rows=[];
  const add=(key,template,extra={})=>rows.push({key:'interaction/'+key,template,roles,fallbacks:key.startsWith('opener/')?{subject:'something important'}:{},inheritsOpener:section!=='opener',...extra});
  if(section==='opener') {
    if(opener)add('opener/'+opener.id,opener.text,{inheritsOpener:false,label:opener.label});
    const motive=selected(CHARACTER_MOTIVES,w.opener?.interaction?.motive);
    if(motive)add('motive/'+motive.id,motive.text,{inheritsOpener:true});
  }
  if(section==='complication') {
    const part=branchId?w.complications.find(row=>row.id===branchId):w.complication;
    const resistance=selected(CHARACTER_RESISTANCE,part?.interaction?.resistance);
    const detail=selected(characterResistanceDetails(part),part?.interaction?.detail);
    if(resistance)add('complication/'+(branchId||'primary')+'/'+resistance.id,resistance.text.replace('{focus}',detail?.text||({intention:'a different outcome',duty:'uphold a responsibility',belief:'the plan will cause harm',demand:'a condition is met'}[resistance.id])),{label:detail?.label||resistance.label});
  }
  if(section==='involvement') for(const response of CHARACTER_RESPONSES.filter(row=>w.involvement?.interaction?.responses?.includes(row.id)))add('response/'+response.id,'Players can '+response.text,{label:response.label});
  if(section==='consequences') for(const row of w.consequences.filter(row=>!branchId||row.id===branchId)) {
    const outcome=selected(CHARACTER_OUTCOMES,row.interaction?.outcome),condition=characterCondition(w,row);
    if(outcome)add('consequences/'+row.id+'/'+outcome.id,(condition?'If '+condition.text+', ':'')+outcome.text,{label:outcome.label});
    else if(condition)add('consequences/'+row.id+'/condition','A possible consequence can follow if '+condition.text,{label:condition.label});
  }
  if(section==='stakes') {
    for(const [key,definitions]of [['risk',CHARACTER_RISKS],['responsibility',CHARACTER_RESPONSIBILITIES]]) {
      const option=selected(definitions,w.stakes?.interaction?.[key]);
      if(option)add('stakes/'+key+'/'+option.id,option.text,{label:option.label,affectedFrom:w.stakes?.interaction?.who||'actor'});
    }
  }
  if(section==='occasion') {
    const link=selected(CHARACTER_OCCASION_LINKS,w.occasion?.interaction?.connection);
    const occasion=w.occasion?.selections?.[w.occasion?.family];
    if(link&&occasion)add('occasion/'+link.id,link.text.replace('{occasion}',occasion.toLowerCase()),{label:link.label});
  }
  return rows.map(row=>({...row,template:row.template.replace(/\{aim\}/g,opener?opener.text.replace('{actor} wants to ',''):'pursue the intended aim')}));
}
