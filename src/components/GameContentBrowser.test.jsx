// @vitest-environment jsdom
import React,{act,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import StoryLibraryBrowser from './StoryLibraryBrowser.jsx';
import {gameContentDeleteAction,buildGameContentSections} from '../lib/narrativeLibrary.js';
import {makeEmptyProject} from '../data/seed.js';
import {reducer} from '../state/reducer.js';

let root,container,current,library,pick,close;
const click=async el=>{expect(el).toBeTruthy();await act(async()=>el.click());};
const button=label=>[...document.querySelectorAll('button')].find(el=>el.getAttribute('aria-label')===label||el.textContent.trim()===label);
function Harness(){const [game,setGame]=useState(current);current=game;return <StoryLibraryBrowser library={library} mode="content" game={game} onPick={pick} onPickGame={pick} onDeleteGame={payload=>{const action=gameContentDeleteAction(payload);if(action)setGame(previous=>reducer(previous,action));}} onClose={close}/>;}
beforeEach(async()=>{
  globalThis.IS_REACT_ACT_ENVIRONMENT=true;pick=vi.fn();close=vi.fn();
  current={...makeEmptyProject('Operation test'),nodes:{C:{id:'C',kind:'character',title:'Game character'},B:{id:'B',kind:'storyBeat',title:'Game beat'}},edges:[{from:'C',to:'B'}]};
  library={narrative:{C:{id:'C',nodeClass:'base',nodeKind:'character',name:'Database character',template:{id:'C',kind:'character',title:'Database character'}}}};
  container=document.createElement('div');document.body.append(container);root=createRoot(container);await act(async()=>root.render(<Harness/>));
});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();});
describe('Created Content ownership switch',()=>{
  it('shows both repositories, with deletion exclusively on game cards and no database mutations',async()=>{
    const before=JSON.stringify(library);
    expect(button('Game').getAttribute('aria-pressed')).toBe('true');expect(document.body.textContent).toContain('Game character');expect(document.body.textContent).not.toContain('Database character');
    expect(document.querySelectorAll('.library-asset-delete')).toHaveLength(2);
    await click(button('Database'));expect(button('Database').getAttribute('aria-pressed')).toBe('true');
    expect(document.body.textContent).toContain('Database character');expect(document.body.textContent).not.toContain('Game character');expect(document.querySelectorAll('.library-asset-delete')).toHaveLength(0);
    await click(document.querySelector('.library-asset-card'));expect(pick).toHaveBeenCalledWith({coll:'narrative',id:'C',record:library.narrative.C});
    await click(button('Game'));await click(button('Remove Game character from this game'));
    expect(current.nodes.C).toBeUndefined();expect(current.edges).toEqual([]);expect(current.nodes.B.title).toBe('Game beat');
    expect(JSON.stringify(library)).toBe(before);expect(pick).toHaveBeenCalledTimes(1);
    await click(button('Database'));expect(document.body.textContent).toContain('Database character');expect(document.querySelector('.library-asset-delete')).toBeNull();
  });
  it('routes game picks to originals, excludes generated inputs and rejects database delete payloads',async()=>{
    await click([...document.querySelectorAll('.library-asset-card')].find(el=>el.textContent.includes('Game character')));
    expect(pick).toHaveBeenCalledWith(expect.objectContaining({source:'game',ref:{coll:'nodes',parentPath:[],nodeId:'C'}}));
    expect(gameContentDeleteAction({source:'database',ref:{coll:'nodes',nodeId:'C'}})).toBeNull();
    expect(gameContentDeleteAction({source:'game',ref:{coll:'narrative',nodeId:'C'}})).toBeNull();
    const game={nodes:{P:{id:'P',kind:'character',title:'Pinky',sub:{nodes:{I:{id:'I',kind:'concept',title:'Artist',characterInput:{},sub:{nodes:{C:{id:'C',kind:'character',title:'The artist'}}}}}}}}};
    expect(buildGameContentSections(game).flatMap(row=>row.items).map(row=>row.label)).toEqual(['Pinky']);
  });
});
