export const BEAT_SLOT_DEFAULTS = {
  actor: {label:'Person acting',kinds:['character','group'],icon:'user'},
  other: {label:'Other person',kinds:['character','group'],icon:'users'},
  item: {label:'Item',kinds:['item'],icon:'box'},
  place: {label:'Place',kinds:['storyLocation'],icon:'pin'},
};
const subject={label:'Subject',kinds:['character','group','item','storyLocation'],icon:'book'};
const q=(id,label,template,labels,icons)=>({id,label,options:labels.map((value,index)=>({id:value,label:value,text:template.replace('{choice}',value.charAt(0).toLowerCase()+value.slice(1)),icon:icons[index],tone:['blue','amber','teal','rose'][index]}))});
const guide=(prompts,roles={})=>({prompts,roles});
export const BEAT_OPENER_GUIDANCE = {
 'information/conceal':guide([
   q('reason','Why hide it?','The evidence is hidden to {choice}.',['Protect someone','Avoid blame','Keep an advantage','Honour a promise'],['heart','cross','target','link']),
   q('exposure','What could expose it?','It could be exposed by {choice}.',['A witness','A missing object','Contradictory accounts','A careless remark'],['user','box','swap','alert']),
 ],{actor:{label:'Person hiding'},item:subject,other:{label:'Person kept unaware'}}),
 'information/reveal':guide([
   q('reveal','How is the secret revealed?','The revelation comes through {choice}.',['A voluntary confession','Physical evidence','An accidental disclosure','A forced admission'],['heart','box','zap','rules']),
   q('audience','Who learns first?','The first to learn are {choice}.',['The players','Everyone present','A trusted few','A rival group'],['user','users','link','flag']),
 ],{actor:{label:'Person revealing'},item:subject}),
 'information/contradiction':guide([
   q('cause','Why do the accounts differ?','The accounts differ because of {choice}.',['Different viewpoints','Partial knowledge','A deliberate lie','A protective omission'],['users','book','cross','heart']),
   q('test','What could settle it?','The accounts could be tested through {choice}.',['An independent witness','A physical clue','A written record','Reconstructing events'],['user','box','book','clock']),
 ],{actor:{label:'First speaker'},other:{label:'Second speaker'}}),
 'information/rumour':guide([
   q('accuracy','How accurate is the rumour?','The rumour is {choice}.',['True','Distorted','False','Uncertain'],['check','filter','cross','search']),
   q('spread','How does it travel?','It travels {choice}.',['Through whispers','As a direct warning','In an overheard exchange','Through a public announcement'],['users','alert','ear','flag']),
 ],{actor:{label:'Person the rumour concerns'},other:{label:'Listener'}}),
 'bargain/help':guide([
   q('need','Why is help needed?','Help is needed because of {choice}.',['Missing equipment','Too little time','A need for trusted allies','A need for an outsider'],['box','clock','link','user']),
   q('offer','What is offered in return?','The request comes with an offer of {choice}.',['A reward','A future favour','Information','Protection'],['medal','link','book','shield']),
 ],{actor:{label:'Person asking'},other:{label:'Person asked'},item:{label:'Thing they need help with',kinds:['character','group','item','storyLocation']}}),
 'bargain/offer':guide([
   q('condition','What is the condition?','The offer requires {choice}.',['Proof of trust','Secrecy','Delivery first','Accepting an obligation'],['search','lock','delivery','link']),
   q('appeal','What makes the offer tempting?','Its appeal is {choice}.',['Scarce resources','Access to a place','Recognition','Safety for someone'],['box','key','badge','shield']),
 ],{actor:{label:'Person offering'},other:{label:'Person receiving the offer'},item:{label:'Thing offered'}}),
 'bargain/debt':guide([
   q('timing','Why call in the debt now?','The debt becomes urgent because of {choice}.',['An approaching deadline','A sudden danger','An unexpected opportunity','Pressure from someone else'],['clock','alert','star','users']),
   q('payment','What could settle it?','The debt could be settled through {choice}.',['A service','A payment','Public support','Sharing a secret'],['wrench','box','flag','book']),
 ],{actor:{label:'Person owed'},other:{label:'Person who owes'}}),
 'bargain/promise':guide([
   q('test','What tests the promise?','Keeping the promise is difficult because of {choice}.',['Conflicting duties','A personal risk','An unexpected cost','Changed circumstances'],['branches','alert','box','swap']),
   q('response','What response is possible?','A possible response is {choice}.',['Keeping the promise at a cost','Asking for release','Finding another way','Breaking it in secret'],['heart','users','search','lock']),
 ],{actor:{label:'Person who promised'},other:{label:'Person relying on the promise'}}),
 'conflict/refuse-order':guide([
   q('reason','Why refuse the order?','The refusal is driven by {choice}.',['A moral objection','Doubt about authority','Fear of the cost','Loyalty to someone else'],['heart','flag','alert','link']),
   q('response','What follows the refusal?','The refusal could lead to {choice}.',['Negotiation','Punishment','An exception','Open resistance'],['users','gavel','key','cross']),
 ],{actor:{label:'Person refusing'},other:{label:'Person giving the order'}}),
 'conflict/accusation':guide([
   q('grounds','What supports the accusation?','The accusation rests on {choice}.',['A witness account','A suspicious object','A past grievance','An assumption'],['user','box','clock','search']),
   q('purpose','What does the accuser want?','The accuser wants {choice}.',['An explanation','Restitution','A punishment','A public admission'],['book','delivery','gavel','flag']),
 ],{actor:{label:'Accuser'},other:{label:'Accused person'}}),
 'conflict/contest':guide([
   q('grounds','Why challenge the decision?','The challenge concerns {choice}.',['An unfair process','Hidden information','Who has authority','An unacceptable cost'],['rules','book','flag','heart']),
   q('remedy','What change is sought?','The challenger seeks {choice}.',['A new hearing','A different outcome','An exception','Shared responsibility'],['gavel','swap','key','users']),
 ],{actor:{label:'Challenger'},other:{label:'Decision maker'}}),
 'conflict/same-goal':guide([
   q('scarcity','Why cannot both have it?','The competition arises from {choice}.',['A single available item','A limited opportunity','Exclusive ownership','Incompatible intentions'],['box','clock','deed','branches']),
   q('settlement','How could the claim be settled?','The competing claims could lead to {choice}.',['Sharing','A contest','A bargain','One side yielding'],['layers','target','link','handover']),
 ],{actor:{label:'First claimant'},other:{label:'Second claimant'}}),
 'possession/withhold':guide([
   q('reason','Why withhold the item?','The item is withheld because of {choice}.',['Distrust','A disputed claim','A condition not yet met','A wish to protect someone'],['search','deed','rules','shield']),
   q('release','What could secure its release?','It could be released in exchange for {choice}.',['Proof','A promise','Another item','A service'],['book','link','box','wrench']),
 ],{actor:{label:'Holder'},other:{label:'Person seeking the item'}}),
 'possession/missing':guide([
   q('cause','How did the item disappear?','Its disappearance may involve {choice}.',['Theft','A mistaken delivery','Someone hiding it','An accidental loss'],['theft','delivery','lock','alert']),
   q('trace','What trace remains?','A possible trace is {choice}.',['A witness','A replacement object','A delivery record','An unusual mark'],['user','box','book','search']),
 ],{item:{label:'Missing item'},other:{label:'Intended recipient'}}),
 'possession/ownership':guide([
   q('claim','What makes ownership disputed?','The dispute concerns {choice}.',['An inheritance','An earlier promise','A disputed sale','A claim of theft'],['inheritance','link','handover','theft']),
   q('proof','What could establish the claim?','The claim could be supported by {choice}.',['A document','A witness','An identifying detail','An agreed rule'],['deed','user','search','rules']),
 ],{actor:{label:'Challenger'},other:{label:'Current claimant'}}),
 'possession/wrong-person':guide([
   q('cause','Why does it reach the wrong person?','The delivery goes astray through {choice}.',['A mistaken identity','A changed route','Deliberate interception','An unread instruction'],['users','pin','theft','book']),
   q('choice','What can the recipient do?','The unexpected recipient can {choice}.',['Return it','Keep it','Use it as leverage','Discover what it means'],['return-path','box','target','search']),
 ],{actor:{label:'Actual recipient'},other:{label:'Intended recipient'},item:{label:'Delivered item'}}),
 'loyalty/side':guide([
   q('pressure','Why must a side be chosen?','The choice becomes urgent because of {choice}.',['Conflicting promises','A public demand','A threatened relationship','An approaching decision'],['link','flag','heart','clock']),
   q('cost','What might the choice cost?','The choice may cost {choice}.',['Trust','Belonging','Protection','A valued opportunity'],['heart','users','shield','star']),
 ],{actor:{label:'Person choosing'},other:{label:'One allegiance'}}),
 'loyalty/protect':guide([
   q('reason','Why protect an enemy?','The protection is motivated by {choice}.',['A shared past','A moral boundary','A hidden debt','A common danger'],['clock','heart','link','alert']),
   q('discovery','What could reveal this protection?','It could be revealed through {choice}.',['A witness','Missing supplies','A contradictory order','An act of mercy'],['user','box','flag','shield']),
 ],{actor:{label:'Protector'},other:{label:'Person who considers them an enemy'}}),
 'loyalty/favour':guide([
   q('weight','Why does the favour carry weight?','The favour mattered because of {choice}.',['Personal risk','A scarce resource','A timely intervention','Keeping a secret'],['alert','box','clock','lock']),
   q('return','What might be expected in return?','The return favour might require {choice}.',['Support','Silence','Access','Taking a risk'],['users','lock','key','alert']),
 ],{actor:{label:'Person giving the favour'},other:{label:'Person now obliged'}}),
 'loyalty/test':guide([
   q('test','How is commitment tested?','The test asks for {choice}.',['Keeping a secret','A costly favour','Public support','Choosing under pressure'],['lock','handover','flag','branches']),
   q('meaning','What would passing demonstrate?','Passing would demonstrate {choice}.',['Trustworthiness','Shared priorities','Courage','Willingness to sacrifice'],['link','target','shield','heart']),
 ],{actor:{label:'Person testing'},other:{label:'Person being tested'}}),
 'disruption/resource':guide([
   q('cause','Why is the resource unavailable?','The shortage may be caused by {choice}.',['Overuse','A blocked supply route','Sabotage','A competing claim'],['layers','pin','sabotage','deed']),
   q('response','What alternatives exist?','An alternative is {choice}.',['A substitute','Rationing','Another supplier','Changing the plan'],['swap','layers','delivery','cog']),
 ],{actor:{label:'Person who needs it'},item:{label:'Missing resource'}}),
 'disruption/absent':guide([
   q('cause','Why has someone not arrived?','The absence may involve {choice}.',['A delay','A changed intention','Being prevented from coming','A misunderstood message'],['clock','swap','lock','book']),
   q('effect','What does their absence disrupt?','Their absence disrupts {choice}.',['A handover','A decision','Access to information','Someone’s confidence'],['handover','rules','book','heart']),
 ],{actor:{label:'Missing person'},other:{label:'Person waiting'}}),
 'disruption/plan':guide([
   q('cause','Which assumption fails?','The plan depended on {choice}.',['Reliable equipment','Someone cooperating','A route staying open','Accurate information'],['wrench','users','pin','book']),
   q('response','What can be changed?','A possible adjustment is {choice}.',['The method','The timing','Who helps','The intended result'],['cog','clock','users','target']),
 ],{actor:{label:'Person with the plan'},item:{label:'Thing the plan depends on',kinds:['item','character','group','storyLocation']}}),
 'disruption/access':guide([
   q('cause','Why is access lost?','Access is lost because of {choice}.',['A new restriction','A physical obstruction','Lost permission','A danger inside'],['rules','box','key','alert']),
   q('route','What could restore access?','Access might be restored through {choice}.',['Permission','An alternative route','Removing the obstruction','An agreed exception'],['deed','pin','wrench','link']),
 ],{actor:{label:'Person denied access'},place:{label:'Inaccessible place'}}),
 'pressure/need':guide([
   q('urgency','What makes the need urgent?','The need is urgent because of {choice}.',['An approaching deadline','Someone’s safety','A dwindling supply','A brief opportunity'],['clock','shield','box','star']),
   q('price','What might meeting it require?','Meeting the need may require {choice}.',['Help from a rival','Giving up something valued','Taking a risk','Breaking a rule'],['users','heart','alert','rules']),
 ],{actor:{label:'Person in need'},item:{label:'Thing needed'}}),
 'pressure/obstacle':guide([
   q('barrier','What kind of obstacle is it?','The obstacle is {choice}.',['A physical barrier','A rule','Someone’s refusal','Missing knowledge'],['box','rules','cross','book']),
   q('approach','What approach could help?','A possible approach is {choice}.',['Finding another way','Negotiation','Obtaining help','Changing the goal'],['pin','users','link','target']),
 ],{actor:{label:'Person blocked'},item:{label:'Goal or thing sought',kinds:['item','storyLocation','character','group']}}),
 'pressure/discovery':guide([
   q('meaning','What does the discovery change?','The discovery changes {choice}.',['Who can be trusted','What an item means','Who has a rightful claim','What is possible'],['heart','box','deed','star']),
   q('reveal','Who could learn about it?','It could become known to {choice}.',['The players first','A trusted few','A rival','Everyone present'],['user','link','flag','users']),
 ],{actor:{label:'Discoverer'},item:subject}),
 'pressure/clash':guide([
   q('clash','Why do the intentions clash?','The clash concerns {choice}.',['A scarce resource','Different principles','Incompatible promises','Who should decide'],['box','heart','link','flag']),
   q('common','What common ground might exist?','Possible common ground is {choice}.',['A shared danger','A mutual responsibility','A third option','Something neither will sacrifice'],['alert','users','branches','shield']),
 ],{actor:{label:'First person'},other:{label:'Second person'}}),
 'pressure/obligation':guide([
   q('source','Where does the obligation come from?','The obligation comes from {choice}.',['A promise','A position of responsibility','A debt','A group’s rules'],['link','badge','handover','rules']),
   q('cost','What makes acting difficult?','Acting is difficult because of {choice}.',['Another duty','A personal risk','Uncertain information','A relationship at stake'],['branches','alert','book','heart']),
 ],{actor:{label:'Person obliged to act'}}),
 'pressure/opportunity':guide([
   q('timing','Why is this opportunity available now?','The opportunity comes from {choice}.',['An unexpected vacancy','A temporary opening','Someone’s mistake','A recent change'],['badge','clock','search','swap']),
   q('risk','What makes taking it uncertain?','Taking it involves {choice}.',['A hidden cost','A competing claimant','A short deadline','A difficult commitment'],['box','users','clock','link']),
 ],{actor:{label:'Person with the opportunity'},item:{label:'Possible gain'}}),
 'encounter/camp':guide([
   q('sign','What suggests what happened?','The camp contains {choice}.',['An interrupted meal','Signs of a struggle','Carefully packed belongings','Something left behind'],['celebration','alert','box','search']),
   q('discovery','What can players discover?','Players could discover {choice}.',['Who stayed there','Why they left','Where they went','What they were protecting'],['user','book','pin','shield']),
 ],{place:{label:'Camp location'}}),
 'encounter/delivery':guide([
   q('contents','What makes the delivery interesting?','The delivery contains {choice}.',['Something unexpected','A personal message','A disputed possession','A dangerous object'],['star','book','deed','alert']),
   q('choice','What can players decide?','Players can decide whether to {choice}.',['Deliver it unopened','Inspect it','Find its sender','Keep it safe'],['delivery','search','user','shield']),
 ],{other:{label:'Intended recipient'}}),
 'encounter/waiting':guide([
   q('expectation','What is expected of the arrival?','The gathering expects {choice}.',['A decision','A delivery','An explanation','A ceremony'],['rules','delivery','book','candle']),
   q('delay','What does waiting create?','Waiting creates {choice}.',['Suspicion','An opportunity to talk','A practical problem','Pressure to act'],['search','users','wrench','clock']),
 ],{actor:{label:'Expected person'},place:{label:'Meeting place'}}),
 'encounter/doorway':guide([
   q('rule','Why is the entrance guarded?','The entrance is guarded to {choice}.',['Protect something','Keep a secret','Enforce a rule','Contain a danger'],['shield','lock','rules','alert']),
   q('entry','What could gain entry?','Entry could depend on {choice}.',['Permission','Proof of identity','An exchange','An exception'],['deed','user-check','handover','key']),
 ],{place:{label:'Guarded place'}}),
 'encounter/meal':guide([
   q('interruption','What interrupted the meal?','The interruption may involve {choice}.',['An urgent summons','An unexpected visitor','A disagreement','A sudden danger'],['flag','arrival','users','alert']),
   q('trace','What remains to investigate?','Players can examine {choice}.',['The place settings','A discarded message','A missing personal item','Signs of a hurried departure'],['layers','book','box','departure']),
 ],{place:{label:'Meal location'}}),
 'encounter/instructions':guide([
   q('cause','Why do the instructions conflict?','The instructions conflict because of {choice}.',['Different information','Competing authority','A changed plan','Deliberate deception'],['book','flag','cog','lock']),
   q('choice','What can players do?','Players can {choice}.',['Ask for clarification','Check the evidence','Choose whose authority to follow','Find a way to satisfy both'],['users','search','rules','branches']),
 ],{actor:{label:'First instructor'},other:{label:'Second instructor'}}),
};

export function beatOpenerGuide(familyId,optionId) {
  const specific=BEAT_OPENER_GUIDANCE[familyId+'/'+optionId]||{prompts:[],roles:{}};
  return {...specific,roles:Object.fromEntries(Object.entries(BEAT_SLOT_DEFAULTS).map(([key,value])=>[key,{...value,...specific.roles[key]}]))};
}
