import {describe,it,expect} from 'vitest';
import {storyConnectionPair,storyConnectionText,connectedStory,storyConnectionActions} from './storyConnections.js';
import {reducer,locateGraph} from '../state/reducer.js';
import {undoableReducer} from '../state/store.jsx';
import {makeEmptyProject,migrateProject} from '../data/seed.js';
import {createCanvasClipboard,remapCanvasClipboard} from './canvasClipboard.js';
import {CSV_SCHEMAS} from '../data/csvSchemas.js';
import {parseCsv,toCsv} from './csv.js';
import {importStory} from '../state/bridge.js';

const nodes={C:{id:'C',kind:'character',title:'Nera',body:'This biography is not a story action.'},I:{id:'I',kind:'item',title:'Silver ring'},L:{id:'L',kind:'storyLocation',title:'Chapel'},G:{id:'G',kind:'group',title:'Keepers'},B:{id:'B',kind:'storyBeat',title:'The handover',body:'The chapel bell rings.'}};
const link=(from,to,patternId)=>({from,to,storyLink:{version:1,patternId}});
describe('node-to-node story creation',()=>{
  it('offers specific guidance for all fifteen pair types, in either drawing direction',()=>{
    const values=Object.values(nodes);
    for(let a=0;a<values.length;a++)for(let b=a;b<values.length;b++){
      const other={...values[b],id:'OTHER'};
      const graph={...nodes,OTHER:other};
      const pair=storyConnectionPair(graph,values[a].id,'OTHER');
      expect(pair.patterns.length).toBe(6);
      expect(pair.patterns.every(row=>row.question&&row.icon&&row.tone)).toBe(true);
      expect(storyConnectionPair(graph,'OTHER',values[a].id).key).toBe(pair.key);
    }
    expect(storyConnectionPair({...nodes,P:{id:'P',kind:'player'}},'P','C')).toBeNull();
    expect(storyConnectionPair(nodes,'C','C')).toBeNull();
    expect(storyConnectionText(nodes,link('I','C','seek'))).toBe('Nera seeks Silver ring.');
  });
  it('merges two existing connected stories transitively, once each, even through cycles',()=>{
    const graph={nodes,edges:[link('C','I','conceal'),link('G','L','protect'),{from:'L',to:'B'}]};
    const story=connectedStory(graph,'I','L',{patternId:'unlock'});
    expect(story.participants).toHaveLength(5);
    expect(story.text).toContain('Nera conceals Silver ring.');
    expect(story.text).toContain('Keepers protects Chapel.');
    expect(story.text).toContain('Silver ring unlocks access to Chapel.');
    expect(story.text).toContain('The chapel bell rings.');
    expect(story.text).not.toContain('biography');
    const cyclic=connectedStory({...graph,edges:[...graph.edges,link('L','C','return')]},'I','L',{patternId:'unlock'});
    expect(cyclic.text.match(/Nera conceals Silver ring/g)).toHaveLength(1);
  });
  it('reads current names and edits existing paragraphs without changing their order or duplicating edges',()=>{
    const graph={nodes,edges:[link('C','I','seek'),link('G','L','protect')]};
    const preview=connectedStory(graph,'C','I',{patternId:'conceal'});
    expect(preview.paragraphs[0].text).toBe('Nera conceals Silver ring.');
    expect(preview.paragraphs).toHaveLength(1);
    expect(storyConnectionText({...nodes,C:{...nodes.C,title:'Mara'}},graph.edges[0])).toContain('Mara seeks');
    const actions=storyConnectionActions(graph,{coll:'nodes'},'C','I',{}, {patternId:'conceal'});
    expect(actions.map(row=>row.type)).toEqual(['GRAPH_UPDATE_EDGE']);
  });
  it('saves a reversed drawing as a correctly attributed interaction and round-trips nested scope with undo',()=>{
    const scope={coll:'nodes',parentPath:['P']};
    let game={...makeEmptyProject('Connections'),nodes:{P:{id:'P',kind:'concept',sub:{nodes,edges:[]}},C:{id:'C',kind:'character',title:'Unrelated root'}}};
    const actions=storyConnectionActions(locateGraph(game,scope),scope,'I','C',{fromSide:'top',toSide:'bottom'},{patternId:'seek',detail:'She needs it tonight.'});
    const history=undoableReducer({present:game,past:[],undoGroup:null},{type:'BATCH',actions});
    expect(locateGraph(history.present,scope).edges[0]).toMatchObject({from:'I',to:'C',label:'Nera: seeks',fromSide:'top',toSide:'bottom'});
    const reopened=migrateProject(JSON.parse(JSON.stringify(history.present)));
    expect(storyConnectionText(locateGraph(reopened,scope).nodes,locateGraph(reopened,scope).edges[0])).toContain('She needs it tonight.');
    expect(history.present.nodes.C.title).toBe('Unrelated root');
    expect(locateGraph(undoableReducer(history,{type:'UNDO'}).present,scope).edges).toEqual([]);
    game=reducer(history.present,{type:'GRAPH_REMOVE_EDGE',scope,from:'I',to:'C'});
    expect(locateGraph(game,scope).edges).toEqual([]);
  });
  it('keeps story writing through copy/paste, library structures and narrative CSV',()=>{
    const edge=link('C','I','seek');
    edge.storyLink.detail='A note with "quotes".\nAnd another line.';
    const game={...makeEmptyProject('Transfers'),nodes,edges:[edge]};
    const clipboard=createCanvasClipboard(nodes,[edge],['C','I']);
    const copy=remapCanvasClipboard(clipboard,nodes,'COPY-');
    let pasted=reducer(game,{type:'BATCH',actions:[...Object.values(copy.nodes).map(node=>({type:'GRAPH_ADD_NODE',scope:{coll:'nodes'},node})),...copy.edges.map(row=>({type:'GRAPH_ADD_EDGE',scope:{coll:'nodes'},...row}))]});
    expect(pasted.edges[1].storyLink).toEqual(edge.storyLink);
    const structure=importStory({stories:{S:{nodes,edges:[edge]}}},makeEmptyProject('Library copy'),'S');
    expect(structure.edges[0].storyLink).toEqual(edge.storyLink);
    const rows=parseCsv(toCsv(CSV_SCHEMAS.nodes.headers,CSV_SCHEMAS.nodes.toRows(game))).rows;
    let restored={...game,edges:[]};
    rows.forEach(row=>CSV_SCHEMAS.nodes.extra(row).forEach(action=>{restored=reducer(restored,action);}));
    expect(restored.edges[0].storyLink).toEqual(edge.storyLink);
    expect(CSV_SCHEMAS.nodes.extra({id:'C',storyLinks:'{broken'})).toEqual([]);
  });
});
