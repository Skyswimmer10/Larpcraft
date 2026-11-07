import {describe,it,expect} from 'vitest';
import {storyBeatStructure,beatStructureDetailPatch,beatStructureRemovePatch} from './storyBeatStructure.js';
import {beatWorkshopDetails,beatWorkshopPatch,beatWorkshopText} from './storyBeatWorkshop.js';
import {CSV_SCHEMAS} from '../data/csvSchemas.js';
import {parseCsv,toCsv} from './csv.js';
import {detachStoryBeatLinks} from './storyBeat.js';

const fixture=()=>({id:'B',kind:'storyBeat',body:'Keep the authored overview.',sub:{nodes:{OLD:{id:'OLD',kind:'character',title:'An existing character'}},edges:[]},storyBeat:{dialogue:'Earlier readout',workshop:{opener:{family:'bargain',selections:{bargain:'help'}},complication:{family:'resistance',selections:{resistance:'proof'}},complications:[{id:'C2',family:'means',selections:{means:'item'}}],involvement:{entry:'asked',interactions:['investigate']},consequences:[{id:'YES',effect:'gain',result:'the letter'},{id:'NO',effect:'lose',result:'access'}],occasion:{family:'social',selections:{social:'Delivery'}},stakes:{domain:'relationships'}}}});

describe('Story Beat structure as a view of workshop data',()=>{
  it('opens empty beats without materialising data and projects a flow with separate outcome branches',()=>{
    const empty={id:'E',kind:'storyBeat'},before=JSON.stringify(empty);
    expect(storyBeatStructure(empty).nodes).toEqual({});expect(JSON.stringify(empty)).toBe(before);
    const node=fixture(),original=JSON.stringify(node),graph=storyBeatStructure(node);
    expect(Object.values(graph.nodes).map(row=>row.section)).toEqual(['opener','complication','complication','involvement','consequences','consequences','occasion','stakes']);
    expect(graph.edges).toContainEqual({from:'SB-COMPLICATION',to:'SB-COMPLICATION:C2',label:'Then'});
    expect(graph.edges.filter(edge=>edge.from==='SB-PLAYERS').map(edge=>edge.to)).toEqual(['SB-OUTCOME:YES','SB-OUTCOME:NO']);
    expect(graph.edges.some(edge=>edge.from==='SB-OUTCOME:YES'&&edge.to==='SB-OUTCOME:NO')).toBe(false);
    expect(JSON.stringify(node)).toBe(original);
  });
  it('shares direct canvas detail edits, scoped names and multiple complication roles with the workshop',()=>{
    let node=fixture();
    const ref={coll:'nodes',parentPath:['INNER'],nodeId:'P'};
    node.storyBeat.workshop.bindings={'complications/C2/means/item':{actor:{ref,name:'Pinky'}}};
    const game={nodes:{INNER:{id:'INNER',sub:{nodes:{P:{id:'P',kind:'character',title:'Pinky renamed'}}}}}};
    let graph=storyBeatStructure(node,game);
    expect(graph.nodes['SB-COMPLICATION:C2'].body).toContain('Pinky renamed');
    node={...node,...beatStructureDetailPatch(node,graph.nodes['SB-COMPLICATION:C2'],'The letter is locked away.')};
    expect(beatWorkshopText(node,game)).toContain('The letter is locked away.');
    expect(beatWorkshopDetails(node).notes.complication).toBeUndefined();
    node={...node,...beatWorkshopPatch(node,'opener',{family:'information',selections:{information:'rumour'}})};
    graph=storyBeatStructure(node,game);expect(graph.nodes['SB-OPENER'].title).toBe('A rumour spreads');
    expect(node.body).toBe('Keep the authored overview.');expect(node.sub.nodes.OLD.title).toBe('An existing character');
  });
  it('retains layout across pattern changes, removal, CSV and template reuse',()=>{
    let node=fixture();node={...node,...beatWorkshopPatch(node,'canvasLayout',{'SB-OPENER':{x:-180,y:450,w:310,h:220}})};
    node={...node,...beatWorkshopPatch(node,'opener',{family:'information',selections:{information:'rumour'}})};
    expect(storyBeatStructure(node).nodes['SB-OPENER']).toMatchObject({x:-180,y:450,w:310,h:220});
    const graph=storyBeatStructure(node);node={...node,...beatStructureRemovePatch(node,graph.nodes['SB-OUTCOME:YES'])};
    expect(storyBeatStructure(node).nodes['SB-OUTCOME:YES']).toBeUndefined();expect(storyBeatStructure(node).nodes['SB-OUTCOME:NO']).toBeTruthy();
    const game={nodes:{B:node},edges:[]};
    const row=parseCsv(toCsv(CSV_SCHEMAS.nodes.headers,CSV_SCHEMAS.nodes.toRows(game))).rows[0];
    expect(CSV_SCHEMAS.nodes.fromRow(row,game).storyBeat).toEqual(node.storyBeat);
    expect(storyBeatStructure(detachStoryBeatLinks(node)).nodes['SB-OPENER']).toMatchObject({x:-180,y:450});
    expect(node.storyBeat.dialogue).toBe('Earlier readout');
  });
});
