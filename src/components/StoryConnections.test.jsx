// @vitest-environment jsdom
import React,{act,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {useStoryConnectionMode} from './StoryConnections.jsx';
import {reducer} from '../state/reducer.js';
import {makeEmptyProject} from '../data/seed.js';
vi.mock('./NarrativeWizard.jsx',()=>({NarrativeWizardButton:()=>null}));
let container,root,current;
const scope={coll:'nodes'};
const btn=(text,where=document)=>[...where.querySelectorAll('button')].find(el=>el.textContent.trim()===text||el.getAttribute('aria-label')===text);
const click=async el=>{expect(el).toBeTruthy();await act(async()=>el.click());};
function Harness(){
  const [game,setGame]=useState({...makeEmptyProject('Connect test'),nodes:{C:{id:'C',kind:'character',title:'Nera'},I:{id:'I',kind:'item',title:'Ring'},L:{id:'L',kind:'storyLocation',title:'Chapel'}}});
  current=game;
  const mode=useStoryConnectionMode(game,action=>setGame(old=>reducer(old,action)));
  return <>{mode.button}<button onClick={()=>mode.connect(scope,'I','C',{fromSide:'top',toSide:'bottom'})}>Draw item to character</button><button onClick={()=>mode.connect(scope,'I','L')}>Draw item to place</button>{game.edges.map(edge=><button key={edge.from+edge.to} onClick={()=>mode.open(scope,edge)}>Edit {edge.from} {edge.to}</button>)}{mode.dialog}</>;
}
beforeEach(async()=>{
  globalThis.IS_REACT_ACT_ENVIRONMENT=true;
  HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  HTMLDialogElement.prototype.close=function(){this.open=false;};
  container=document.createElement('div');document.body.append(container);root=createRoot(container);
  await act(async()=>root.render(<Harness/>));
});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();});
it('toggles visibly without opening a window; mode off keeps ordinary links',async()=>{
  expect(btn('Connect story').getAttribute('aria-pressed')).toBe('false');
  await click(btn('Connect story'));expect(document.querySelector('dialog')).toBeNull();
  expect(btn('Connect story').getAttribute('aria-pressed')).toBe('true');
  await click(btn('Connect story'));await click(btn('Draw item to character'));
  expect(current.edges).toHaveLength(1);expect(current.edges[0].storyLink).toBeUndefined();
});
it('opens typed guidance, previews changes, cancels without creating anything and saves one editable link',async()=>{
  await click(btn('Connect story'));await click(btn('Draw item to character'));
  expect(document.querySelector('dialog')).toBeTruthy();expect(current.edges).toEqual([]);
  await click(btn('Seeks'));expect(document.querySelector('.story-connect-preview').textContent).toContain('Nera seeks Ring.');
  await click(btn('Cancel'));expect(current.edges).toEqual([]);
  await click(btn('Draw item to character'));await click(btn('Conceals'));
  await click(btn('Consequence'));
  expect(btn('Gain')).toBeTruthy();expect(current.edges).toEqual([]);
  await click(btn('Connect & save'));
  expect(current.edges[0].storyLink.patternId).toBe('conceal');
  await click(btn('Edit I C'));expect(btn('Conceals').getAttribute('aria-pressed')).toBe('true');
  await click(btn('Seeks'));await click(btn('Save connection'));
  expect(current.edges).toHaveLength(1);expect(current.edges[0].storyLink.patternId).toBe('seek');
});
it('adds a new typed connection to the existing story and keeps the original interaction live',async()=>{
  await click(btn('Connect story'));await click(btn('Draw item to character'));await click(btn('Seeks'));await click(btn('Connect & save'));
  await click(btn('Draw item to place'));await click(btn('Unlocks access'));
  const preview=document.querySelector('.story-connect-preview');
  expect(preview.textContent).toContain('Nera seeks Ring.');
  expect(preview.textContent).toContain('Ring unlocks access to Chapel.');
  await click(btn('Connect & save'));expect(current.edges).toHaveLength(2);
  await click(btn('Edit I C'));
  expect(document.querySelectorAll('.story-connect-paragraph')).toHaveLength(2);
  await click(btn('Pressure'));await click(btn('Resistance'));await click(btn('Demands proof'));
  expect(document.querySelector('.story-connect-preview').textContent).toContain('Nera demands proof');
  await click(btn('Save connection'));
  expect(current.edges[0].storyLink.workshop.complication.selections.resistance).toBe('proof');
});
