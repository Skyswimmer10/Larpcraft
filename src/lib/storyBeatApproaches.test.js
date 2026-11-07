import {describe,expect,it} from 'vitest';
import {beatWorkshopDetails,beatWorkshopApproachPatch,beatWorkshopText,beatSectionClauses,beatClauseSegments,beatContextChoices,detachBeatWorkshopLinks} from './storyBeatWorkshop.js';
import {storyBeatStructure} from './storyBeatStructure.js';
import {characterConditions} from '../data/storyBeatApproaches.js';
import {CSV_SCHEMAS} from '../data/csvSchemas.js';
import {toCsv,parseCsv} from './csv.js';

const ref=id=>({coll:'nodes',parentPath:[],nodeId:id});
function sample(){return{id:'B',kind:'storyBeat',body:'Keep my authored description.',sub:{nodes:{OLD:{id:'OLD',kind:'concept',title:'Keep this'}},edges:[]},storyBeat:{workshop:{
 approach:'characterInteraction',
 opener:{family:'information',selections:{information:'rumour'},interaction:{intention:'conceal',motive:'standing'}},
 complication:{family:'time',selections:{time:'deadline'},effect:'exposes',interaction:{resistance:'duty',detail:'admission'}},
 involvement:{interaction:{responses:['help','investigate','mediate']}},
 consequences:[{id:'yes',effect:'conceal',result:'the earlier secret',interaction:{condition:'help',outcome:'success'}},{id:'no',interaction:{condition:'decline',outcome:'failure'}}],
 stakes:{interaction:{who:'other',risk:'authority',responsibility:'responsible'}},
 occasion:{family:'social',selections:{social:'Celebration'},interaction:{connection:'opportunity'}},
 bindings:{'interaction/opener/conceal':{actor:{ref:ref('P'),name:'Pinky'},other:{ref:ref('H'),name:'HOBO'},subject:{ref:null,name:'the visitor’s invitation'}},
 'interaction/stakes/risk/authority':{subject:{name:'admission to the cave'}},'interaction/stakes/responsibility/responsible':{subject:{name:'admission to the cave'}}},
}}};}
const game={nodes:{P:{id:'P',kind:'character',title:'Pinky'},H:{id:'H',kind:'character',title:'HOBO'}},edges:[]};

describe('Story Beat starting approaches',()=>{
 it('defaults earlier beats to General without writing or converting their choices',()=>{
   const node=sample();delete node.storyBeat.workshop.approach;const before=JSON.stringify(node);
   expect(beatWorkshopDetails(node).approach).toBe('general');
   expect(beatWorkshopText(node,game)).toContain('A rumour about someone reaches another person.');
   expect(JSON.stringify(node)).toBe(before);
   const character={...node,...beatWorkshopApproachPatch(node,'characterInteraction')};
   expect(beatWorkshopText(character,game)).toContain('Pinky wants to conceal the visitor’s invitation from HOBO.');
   const restored={...character,...beatWorkshopApproachPatch(character,'general')};
   expect(beatWorkshopText(restored,game)).toBe(beatWorkshopText(node,game));
   expect(restored.body).toBe(node.body);expect(restored.sub).toBe(node.sub);
   expect(restored.storyBeat.workshop.opener.interaction).toEqual(node.storyBeat.workshop.opener.interaction);
 });
 it('carries an intention and live people through resistance, player response, outcomes, accountability and occasion',()=>{
   const node=sample(),before=JSON.stringify(node),prose=beatWorkshopText(node,game);
   expect(prose).toContain('Pinky wants to conceal the visitor’s invitation from HOBO.');
   expect(prose).toContain('HOBO has a duty to record every arrival, which conflicts with Pinky’s aim.');
   expect(prose).toContain('Players can help Pinky to conceal the visitor’s invitation from HOBO.');
   expect(prose).toContain('If players help Pinky to conceal the visitor’s invitation from HOBO, Pinky could achieve the aim: conceal the visitor’s invitation from HOBO.');
   expect(prose).toContain('If players leave the disagreement unresolved, Pinky could be prevented');
   expect(prose).toContain('HOBO could lose authority over admission to the cave.');
   expect(prose).toContain('HOBO is responsible for admission to the cave.');
   expect(prose).toContain('The celebration gives Pinky an opportunity to conceal the visitor’s invitation from HOBO.');
   expect(prose).not.toContain('A deadline approaches');expect(prose).not.toContain('exposing the situation');
   const graph=storyBeatStructure(node,game);expect(Object.keys(graph.nodes)).toHaveLength(7);
   expect(graph.nodes['SB-COMPLICATION'].title).toBe('Record every arrival');
   expect(graph.nodes['SB-OUTCOME:yes'].body).toContain('Pinky could achieve');
   expect(graph.edges.find(edge=>edge.to==='SB-OUTCOME:yes').label).toBe('Help the intention');
   expect(beatWorkshopText(node,{nodes:{...game.nodes,H:{title:'HOBO renamed'}}})).toContain('HOBO renamed has a duty');
   expect(JSON.stringify(node)).toBe(before);
 });
 it('keeps branch role overrides independent and retains the approach and choices in CSV and templates',()=>{
   const node=sample();node.storyBeat.workshop.bindings['interaction/consequences/yes/success']={other:{name:'The council'}};
   const prose=beatWorkshopText(node,game);
   expect(prose).toContain('If players help Pinky to conceal the visitor’s invitation from The council');
   expect(prose).toContain('Pinky wants to conceal the visitor’s invitation from HOBO.');
   const row=parseCsv(toCsv(CSV_SCHEMAS.nodes.headers,CSV_SCHEMAS.nodes.toRows({nodes:{B:node},edges:[]}))).rows[0];
   expect(CSV_SCHEMAS.nodes.fromRow(row,{}).storyBeat.workshop).toEqual(node.storyBeat.workshop);
   const detached=detachBeatWorkshopLinks(node.storyBeat.workshop);
   expect(detached.approach).toBe('characterInteraction');
   expect(detached.bindings['interaction/opener/conceal'].actor.ref).toBe(null);
   expect(beatWorkshopText({storyBeat:{workshop:detached}})).toContain('Pinky wants to conceal');
   const w=beatWorkshopDetails(node),clause=beatSectionClauses(w,'opener')[0];
   expect(beatClauseSegments(w,game,clause).find(row=>row.role==='subject').kinds).toContain('storyLocation');
   w.involvement.interaction.responses=[];
   expect(characterConditions(w).some(row=>row.id==='help')).toBe(false);
   expect(beatWorkshopText({storyBeat:{workshop:w}},game)).toContain('If players help Pinky');
 });
 it('lets General consequences follow the selected player action and its live targets',()=>{
   const node={storyBeat:{workshop:{opener:{family:'encounter',selections:{encounter:'meal'}},
     involvement:{context:{'encounter/meal':{actions:['follow']}}},
     bindings:{'context/involvement/primary/encounter/meal/actions/follow':{other:{ref:ref('H'),name:'HOBO'}}},
     consequences:[{id:'C',context:{'encounter/meal':{outcome:'contact'}}}],
   }}};
   let w=beatWorkshopDetails(node),option=beatContextChoices(w,'consequences')[0].options.find(row=>row.id.startsWith('response:'));
   node.storyBeat.workshop.consequences[0].context['encounter/meal']={condition:option.id,conditionSource:option.source,outcome:'contact'};
   node.storyBeat.workshop.bindings['context/consequences/C/encounter/meal/outcome/contact']={other:{ref:ref('P'),name:'Pinky'}};
   const prose=beatWorkshopText(node,game);
   expect(prose).toContain('If players follow a clue from the encounter to HOBO, the encounter could connect the players with Pinky.');
   node.storyBeat.workshop.involvement.context['encounter/meal'].actions=[];
   expect(beatWorkshopText(node,game)).toContain('If players follow a clue from the encounter to HOBO');
 });
});
