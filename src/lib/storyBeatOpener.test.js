import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {BEAT_OPENERS,BEAT_OCCASIONS} from '../data/storyBeatWorkshop.js';
import {beatOpenerGuide} from '../data/storyBeatOpenerGuidance.js';
import {beatOpenerDefinition,beatOpenerSegments,beatSlotAllows,beatWorkshopText,beatWorkshopPatch,detachBeatWorkshopLinks} from './storyBeatWorkshop.js';
import {PrimIcon} from '../components/bits.jsx';
import {CSV_SCHEMAS} from '../data/csvSchemas.js';
import {parseCsv,toCsv} from './csv.js';

const node=()=>({id:'B',kind:'storyBeat',body:'Keep this authored description.',storyBeat:{workshop:{roles:{},opener:{family:'information',selections:{information:'conceal'}}}}});
describe('guided opener roles and symbols',()=>{
 it('defines typed slots and optional concrete guidance for every opener',()=>{
   for(const family of BEAT_OPENERS)for(const option of family.options){
     const guide=beatOpenerGuide(family.id,option.id);
     expect(guide.prompts.length).toBe(2);
     expect(new Set(guide.prompts.map(row=>row.id)).size).toBe(2);
     for(const token of option.text.matchAll(/\{(\w+)\}/g))expect(guide.roles[token[1]].kinds.length).toBeGreaterThan(0);
     for(const prompt of guide.prompts){
       expect(prompt.options).toHaveLength(4);
       expect(new Set(prompt.options.map(row=>row.id)).size).toBe(4);
       for(const choice of prompt.options){
         expect(choice.text).not.toContain('{choice}');
         expect(renderToStaticMarkup(React.createElement(PrimIcon,{icon:choice.icon}))).not.toContain('x="5" y="5" width="14" height="14" rx="3"');
       }
     }
   }
 });
 it('gives every occasion a specific, implemented glyph, retaining each option ID',()=>{
   const occasions=BEAT_OCCASIONS.flatMap(family=>family.options);
   expect(occasions).toHaveLength(36);
   expect(new Set(occasions.map(row=>row.icon)).size).toBe(36);
   for(const option of occasions){
     expect(option.id).toBe(option.label);
     expect(renderToStaticMarkup(React.createElement(PrimIcon,{icon:option.icon}))).not.toContain('x="5" y="5" width="14" height="14" rx="3"');
   }
 });
 it('makes structured placeholders assignable while leaving verbs literal and filtering by type',()=>{
   const n=node(),parts=beatOpenerSegments(n.storyBeat.workshop,{});
   expect(parts.filter(row=>row.role).map(row=>row.role)).toEqual(['actor','item','other']);
   expect(parts.find(row=>row.text?.includes('conceals evidence')).role).toBeUndefined();
   const actor=parts.find(row=>row.role==='actor'),subject=parts.find(row=>row.role==='item');
   expect(beatSlotAllows(actor,{kind:'character'})).toBe(true);
   expect(beatSlotAllows(actor,{kind:'group'})).toBe(true);
   expect(beatSlotAllows(actor,{kind:'item'})).toBe(false);
   expect(beatSlotAllows(subject,{kind:'character'})).toBe(true);
   expect(beatSlotAllows(subject,{kind:'storyLocation'})).toBe(true);
   expect(beatSlotAllows(subject,{kind:'player'})).toBe(false);
 });
 it('generates contextual details only for the selected opener and retains earlier answers',()=>{
   let n=node();
   n={...n,...beatWorkshopPatch(n,'opener',{guidance:{'information/conceal':{reason:'Protect someone',exposure:'A witness'},'information/rumour':{accuracy:'Distorted'}}})};
   expect(beatWorkshopText(n)).toContain('The evidence is hidden to protect someone.');
   expect(beatWorkshopText(n)).not.toContain('distorted');
   n={...n,...beatWorkshopPatch(n,'opener',{selections:{information:'rumour'}})};
   expect(beatWorkshopText(n)).toContain('The rumour is distorted.');
   expect(beatWorkshopText(n)).not.toContain('evidence is hidden');
   expect(n.storyBeat.workshop.opener.guidance['information/conceal'].reason).toBe('Protect someone');
   expect(n.body).toBe('Keep this authored description.');
 });
 it('keeps scoped references live and retains labels and prompt banks through template detachment and CSV',()=>{
   const n=node();
   n.storyBeat.workshop.roles={actor:{ref:{coll:'nodes',parentPath:['P'],nodeId:'C'},name:'Earlier name'},other:{name:'Pinky'},item:{name:'the agreement'}};
   n.storyBeat.workshop.opener.guidance={'information/conceal':{reason:'Avoid blame'}};
   const game={nodes:{B:n,P:{id:'P',sub:{nodes:{C:{id:'C',kind:'character',title:'Winning Guy'}}}}},edges:[]};
   expect(beatWorkshopText(n,game)).toContain('Winning Guy conceals evidence about the agreement from Pinky.');
   expect(beatOpenerSegments(n.storyBeat.workshop,game).find(row=>row.role==='actor').name).toBe('Winning Guy');
   const detached=detachBeatWorkshopLinks(n.storyBeat.workshop);
   expect(detached.roles.actor).toEqual({ref:null,name:'Earlier name'});
   expect(detached.opener.guidance).toEqual(n.storyBeat.workshop.opener.guidance);
   const row=parseCsv(toCsv(CSV_SCHEMAS.nodes.headers,CSV_SCHEMAS.nodes.toRows(game))).rows.find(row=>row.id==='B');
   expect(CSV_SCHEMAS.nodes.fromRow(row,game).storyBeat).toEqual(n.storyBeat);
 });
});
