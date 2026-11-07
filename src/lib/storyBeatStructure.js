import {BEAT_COMPLICATIONS,BEAT_CONDITIONS} from '../data/storyBeatWorkshop.js';
import {beatWorkshopDetails,beatWorkshopSentences,beatSelectedOption,beatComplicationText,beatContextClauses,beatContextChoices,beatContextAnswers,beatOpenerDefinition} from './storyBeatWorkshop.js';
import {beatApproach,characterSectionClauses,characterCondition} from '../data/storyBeatApproaches.js';

export const BEAT_PARTS=[
  {id:'opener',label:'Opener',icon:'flag',color:'#5CA8F5'},
  {id:'complication',label:'Complication',icon:'alert',color:'#E5AA58'},
  {id:'involvement',label:'Players',icon:'users',color:'#68C6AD'},
  {id:'consequences',label:'Consequences',icon:'branches',color:'#B69AF3'},
  {id:'occasion',label:'Occasion',icon:'clock',color:'#E596B7'},
  {id:'stakes',label:'Stakes',icon:'heart',color:'#D4B65D'},
];

// Projection only: the workshop owns all story content. Persisted canvas data
// contains geometry/colour, never another copy of the generated nodes or edges.
export function storyBeatStructure(node,game={}){
  const w=beatWorkshopDetails(node),nodes={},edges=[],flow=[];
  const paragraphs=Object.fromEntries(beatWorkshopSentences(node,game).map(row=>[row.id,row.text]));
  const add=(id,section,title,body,x,y,partId=null)=>{
    const meta=BEAT_PARTS.find(row=>row.id===section),layout=w.canvasLayout?.[id]||{};
    nodes[id]={id,kind:'storyBeatPart',kindLabel:meta.label,title,body,section,partId,icon:meta.icon,color:meta.color,x,y,w:280,h:190,...Object.fromEntries(Object.entries(layout).filter(([key,value])=>['x','y','w','h'].includes(key)&&Number.isFinite(value)||key==='color'&&typeof value==='string'))};
    return id;
  };
  const link=(from,to,label='Then')=>{if(from&&to&&from!==to)edges.push({from,to,label});};
  if(paragraphs.opener)flow.push(add('SB-OPENER','opener',beatOpenerDefinition(w)?.label||'Opening situation',paragraphs.opener,70,300));
  for(const [index,id] of [null,...w.complications.map(row=>row.id)].entries()){
    const part=id?w.complications.find(row=>row.id===id):w.complication;
    const body=[beatComplicationText(w,game,id),!id?w.notes.complication:''].filter(Boolean).join('\n');
    const title=beatApproach(w)==='characterInteraction'?characterSectionClauses(w,'complication',id)[0]?.label:beatContextClauses(w,'complication',id)[0]?.label||beatSelectedOption(part,BEAT_COMPLICATIONS)?.label;
    if(body||id)flow.push(add(id?'SB-COMPLICATION:'+id:'SB-COMPLICATION','complication',title||'New complication',body,70+flow.length*350,300,id));
  }
  if(paragraphs.involvement)flow.push(add('SB-PLAYERS','involvement','Player involvement',paragraphs.involvement,70+flow.length*350,300));
  for(let i=1;i<flow.length;i++)link(flow[i-1],flow[i]);
  const outcomes=w.consequences.map((row,index)=>{
    const only={...node,storyBeat:{...node.storyBeat,workshop:{...w,consequences:[row],notes:{...w.notes,consequences:''}}}};
    const body=beatWorkshopSentences(only,game).find(part=>part.id==='consequences')?.text||'';
    const id=add('SB-OUTCOME:'+row.id,'consequences',row.label||'Possibility '+(index+1),body,70+flow.length*350,300+index*240,row.id);
    const contextCondition=beatContextChoices(w,'consequences').find(prompt=>prompt.id==='condition')?.options.find(option=>option.id===beatContextAnswers(w,'consequences',row.id).condition)?.label;
    link(flow.at(-1),id,(beatApproach(w)==='characterInteraction'?characterCondition(w,row)?.label:contextCondition||row.conditionText||BEAT_CONDITIONS.find(option=>option.id===row.condition)?.label)||'Possible outcome');return id;
  });
  if(!outcomes.length&&paragraphs.consequences)outcomes.push(add('SB-CONSEQUENCES','consequences','Consequences',paragraphs.consequences,70+flow.length*350,300));
  const anchor=flow[0]||outcomes[0];
  if(paragraphs.occasion){const id=add('SB-OCCASION','occasion','Occasion',paragraphs.occasion,70,40);link(id,anchor,'Context');}
  if(paragraphs.stakes){const id=add('SB-STAKES','stakes','Change & stakes',paragraphs.stakes,420,40);link(anchor,id,'At stake');}
  return {nodes,edges};
}

export function beatStructureDetail(node,part){
  const w=beatWorkshopDetails(node);
  if(part.section==='consequences'&&part.partId)return w.consequences.find(row=>row.id===part.partId)?.notes||'';
  if(part.section==='complication'&&part.partId)return w.complications.find(row=>row.id===part.partId)?.notes||'';
  return w.notes[part.section]||'';
}
export function beatStructureDetailPatch(node,part,value){
  const w=beatWorkshopDetails(node);
  if(part.section==='consequences'&&part.partId)w.consequences=w.consequences.map(row=>row.id===part.partId?{...row,notes:value}:row);
  else if(part.section==='complication'&&part.partId)w.complications=w.complications.map(row=>row.id===part.partId?{...row,notes:value}:row);
  else w.notes={...w.notes,[part.section]:value};
  return {storyBeat:{...node.storyBeat,workshop:w}};
}
export function beatStructureRemovePatch(node,part){
  const w=beatWorkshopDetails(node);
  if(part.section==='consequences'&&part.partId)w.consequences=w.consequences.filter(row=>row.id!==part.partId);
  else if(part.section==='complication'&&part.partId)w.complications=w.complications.filter(row=>row.id!==part.partId);
  else{
    const empty={opener:{},complication:{},involvement:{interactions:[]},consequences:[],occasion:{},stakes:{values:[],morals:[]}};
    w[part.section]=empty[part.section];w.notes={...w.notes,[part.section]:''};
  }
  return {storyBeat:{...node.storyBeat,workshop:w}};
}
