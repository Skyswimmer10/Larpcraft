import React, {useState} from 'react';
import {PrimIcon} from './bits.jsx';
import StoryBeatDialog from './StoryBeatDialog.jsx';
import {BeatChoiceGroup} from './StoryBeatWorkshop.jsx';
import {locateGraph} from '../state/reducer.js';
import {storyConnectionPair, storyConnectionFill, storyConnectionActions, connectedStory} from '../lib/storyConnections.js';
import {STORY_CONNECTION_REASONS} from '../data/storyConnections.js';
import {relationshipCanvasEdges} from '../lib/relationships.js';
import {BEAT_COMPLICATIONS,BEAT_ENTRIES,BEAT_INTERACTIONS,BEAT_CONDITIONS,BEAT_CONSEQUENCE_EFFECTS} from '../data/storyBeatWorkshop.js';
import './StoryConnections.css';

export function useStoryConnectionMode(game,dispatch) {
  const [enabled,setEnabled]=useState(false), [pending,setPending]=useState(null);
  const connect=(scope,from,to,edgePatch={}, fallback)=>{
    const graph=locateGraph(game,scope);
    if(enabled&&storyConnectionPair(graph.nodes,from,to)) setPending({scope,from,to,edgePatch});
    else if(fallback) fallback();
    else dispatch({type:'GRAPH_ADD_EDGE',scope,from,to,...edgePatch});
  };
  const open=(scope,edge)=>setPending({scope,from:edge.from,to:edge.to,edgePatch:{}});
  return {
    enabled,connect,open,
    button:<button type="button" className="btn story-connect-toggle" aria-pressed={enabled} title={enabled?'Story linking on: connect characters, groups, items, locations or beats':'Turn on guided story linking'} onClick={()=>setEnabled(value=>!value)}><PrimIcon icon="link" size={14}/>Connect story<span className="story-connect-dot" aria-hidden="true"/></button>,
    dialog:pending&&<StoryConnectionWizard key={JSON.stringify([pending.scope,pending.from,pending.to])} game={game} {...pending} onClose={()=>setPending(null)} onSave={draft=>{
      const actions=storyConnectionActions(locateGraph(game,pending.scope),pending.scope,pending.from,pending.to,pending.edgePatch,draft);
      if(actions.length)dispatch({type:'BATCH',actions});
      setPending(null);
    }}/>,
  };
}

export function StoryConnectionWizard({game,scope,from,to,onClose,onSave}) {
  const graph=locateGraph(game,scope), old=graph.edges.find(edge=>edge.from===from&&edge.to===to)?.storyLink;
  const [draft,setDraft]=useState(()=>old?structuredClone(old):{version:1,patternId:'',detail:'',workshop:{}});
  const [phase,setPhase]=useState('action');
  const pair=storyConnectionPair(graph.nodes,from,to,draft.reverse);
  const update=patch=>setDraft(previous=>({...previous,...patch}));
  const w=draft.workshop||{};
  const part=(key,patch)=>setDraft(previous=>({...previous,workshop:{...previous.workshop,[key]:{...previous.workshop?.[key],...patch}}}));
  const preview=connectedStory({...graph,edges:[...graph.edges,...relationshipCanvasEdges(game,scope,graph.nodes)]},from,to,draft,game);
  const phases=[['action','Interaction','link'],['complication','Pressure','alert'],['involvement','Players','users'],['consequences','Consequence','branches']];
  const currentPattern=pair?.patterns.find(row=>row.id===draft.patternId);
  const complication=w.complication||{}, involvement=w.involvement||{}, consequence=w.consequences?.[0]||{};
  const patchConsequence=patch=>update({workshop:{...w,consequences:[{...consequence,id:consequence.id||crypto.randomUUID(),...patch}]}});
  const custom=pair&&storyConnectionFill(currentPattern?.question||'What happens between {a} and {b}?',pair);
  return <StoryBeatDialog title="Connect a story" subtitle={pair?((pair.a.title||pair.a.id)+' · '+(pair.b.title||pair.b.id)):'Connection unavailable'} closeLabel="Cancel" onClose={onClose} className="story-connect-dialog">
    {!pair?<p>The connected nodes are no longer available.</p>:<>
      <nav className="story-connect-steps" aria-label="Connection workshop">{phases.map(([id,label,icon],index)=><React.Fragment key={id}>{index>0&&<span aria-hidden="true">→</span>}<button type="button" aria-pressed={phase===id} onClick={()=>setPhase(id)}><PrimIcon icon={icon} size={14}/>{label}</button></React.Fragment>)}</nav>
      <div className="story-connect-main">
        <section className="story-connect-fields" aria-label="Connection guidance">
          {phase==='action'&&<>
            <div className="story-connect-question"><h3>{storyConnectionFill('How do {a} and {b} interact?',pair)}</h3>{pair.ak===pair.bk&&<button type="button" className="btn small" title="Swap who acts on whom" aria-label="Reverse story interaction" onClick={()=>update({reverse:!draft.reverse})}><PrimIcon icon="swap" size={14}/></button>}</div>
            <BeatChoiceGroup label="Choose what happens · optional" options={pair.patterns} value={draft.patternId} onChange={patternId=>update({patternId})}/>
            <label className="story-connect-detail">{custom}<textarea value={draft.detail} onChange={event=>update({detail:event.target.value})} placeholder="Add a detail if useful…" rows={3}/></label>
            <details className="story-connect-more"><summary>What drives this interaction?</summary><BeatChoiceGroup label="Choose a reason" options={STORY_CONNECTION_REASONS} value={draft.reason} onChange={reason=>update({reason})}/></details>
          </>}
          {phase==='complication'&&<>
            <p className="story-connect-context">{currentPattern?storyConnectionFill(currentPattern.text,pair):custom}</p>
            <BeatChoiceGroup label="What makes this interaction difficult?" options={BEAT_COMPLICATIONS.map((group,index)=>({id:group.id,label:group.label,icon:['cross','box','search','clock','branches','user','heart','zap'][index],tone:['rose','amber','blue','violet','teal','green','rose','amber'][index]}))} value={complication.family} onChange={family=>part('complication',{family})}/>
            {BEAT_COMPLICATIONS.find(group=>group.id===complication.family)&&<BeatChoiceGroup label="How does that appear here?" options={BEAT_COMPLICATIONS.find(group=>group.id===complication.family).options} value={complication.selections?.[complication.family]} onChange={value=>part('complication',{selections:{...complication.selections,[complication.family]:value}})}/>}
          </>}
          {phase==='involvement'&&<>
            <BeatChoiceGroup label="How do players enter this situation?" options={BEAT_ENTRIES} value={involvement.entry} onChange={entry=>part('involvement',{entry})}/>
            <BeatChoiceGroup label="What can players do? · choose any" options={BEAT_INTERACTIONS} value={involvement.interactions||[]} multiple onChange={interactions=>part('involvement',{interactions})}/>
          </>}
          {phase==='consequences'&&<>
            <BeatChoiceGroup label="If…" options={BEAT_CONDITIONS} value={consequence.condition} onChange={condition=>patchConsequence({condition})}/>
            <BeatChoiceGroup label="Then…" options={BEAT_CONSEQUENCE_EFFECTS} value={consequence.effect} onChange={effect=>patchConsequence({effect})}/>
            <label className="story-connect-detail">What could be gained, lost or changed?<input value={consequence.result||''} onChange={event=>patchConsequence({result:event.target.value})} placeholder="Optional result"/></label>
          </>}
        </section>
        <aside className="story-connect-preview" aria-label="Connected story preview"><h3>Connected story</h3><div aria-live="polite">{preview.paragraphs.length?preview.paragraphs.map(row=><div key={row.key} className={'story-connect-paragraph'+(row.current?' current':'')}><small>{row.current?'This connection':row.nodeId?'Existing beat':'Connected material'}</small><p>{row.text}</p></div>):<p className="story-connect-context">Choose an interaction to start the story. Later connections will join the same connected material.</p>}</div></aside>
      </div>
      <footer className="story-connect-footer"><div>{preview.participants.map(node=><span key={node.id}><PrimIcon icon={node.kind==='item'?'box':node.kind==='storyLocation'?'pin':node.kind==='group'?'users':'user'} size={12}/>{node.title||node.id}</span>)}</div><button type="button" className="btn primary" disabled={!draft.patternId&&!draft.detail?.trim()} onClick={()=>onSave(draft)}>{old?'Save connection':'Connect & save'}</button></footer>
    </>}
  </StoryBeatDialog>;
}
