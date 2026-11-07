import React,{useId,useMemo,useState} from 'react';
import FlowCanvas from './FlowCanvas.jsx';
import {PrimIcon} from './bits.jsx';
import {beatWorkshopDetails,beatWorkshopPatch} from '../lib/storyBeatWorkshop.js';
import {BEAT_PARTS,storyBeatStructure,beatStructureDetail,beatStructureDetailPatch,beatStructureRemovePatch} from '../lib/storyBeatStructure.js';
import './StoryBeatStructure.css';

export default function StoryBeatStructure({node,onPatch,game,scope,onDevelop,onShowLegacy,legacyCount=0}){
  const [selection,setSelection]=useState(null),fieldId=useId();
  const graph=useMemo(()=>storyBeatStructure(node,game),[node,game]);
  const w=beatWorkshopDetails(node),selected=graph.nodes[selection];
  const develop=part=>onDevelop({section:part.section,branchId:part.section==='consequences'?part.partId:null,complicationId:part.section==='complication'?part.partId:null});
  const add=section=>{
    if(section==='complication'&&(graph.nodes['SB-COMPLICATION']||w.complications.length)){
      const id=crypto.randomUUID();onPatch(beatWorkshopPatch(node,'complications',[...w.complications,{id}]));onDevelop({section,complicationId:id});
    }else if(section==='consequences'){
      const id=crypto.randomUUID();onPatch(beatWorkshopPatch(node,'consequences',[...w.consequences,{id}]));onDevelop({section,branchId:id});
    }else onDevelop({section});
  };
  const layout=patches=>onPatch(beatWorkshopPatch(node,'canvasLayout',Object.fromEntries(Object.entries(patches).map(([id,patch])=>[id,{...w.canvasLayout?.[id],...patch}]))));
  const remove=ids=>{
    let next=node;
    for(const id of ids)if(graph.nodes[id])next={...next,...beatStructureRemovePatch(next,graph.nodes[id])};
    onPatch({storyBeat:next.storyBeat});setSelection(null);
  };
  return <section className="sb-structure" aria-label="Story Beat internal canvas">
    <div className="sb-structure-actions" aria-label="Develop story parts">{BEAT_PARTS.map(part=><button type="button" className="btn small" key={part.id} onClick={()=>add(part.id)}><PrimIcon icon={part.icon} color={part.color} size={14}/>{part.id==='complication'?'+ Complication':part.id==='consequences'?'+ Possibility':part.label}</button>)}
      {legacyCount>0&&onShowLegacy&&<button type="button" className="linkbtn" onClick={onShowLegacy}>Existing canvas · {legacyCount}</button>}
    </div>
    <div className="sb-structure-layout">
      <div className="sb-structure-stage">
        <FlowCanvas key={node.id} fitOnMount minZoom={0.15} graphScope={scope} nodes={graph.nodes} edges={graph.edges} selId={selected?.id} colorOf={part=>part.color} iconOf={part=>part.icon} nodeClass={()=>'story-beat-structure-part'}
          onSelect={setSelection} onMove={(id,x,y)=>layout({[id]:{x,y}})} onMoveNodes={layout} onResizeNode={(id,patch)=>layout({[id]:patch})} onSetColor={(id,color)=>layout({[id]:{color}})}
          onDeleteNode={id=>remove([id])} onDeleteNodes={remove} onOpenNode={id=>develop(graph.nodes[id])}
          renderBody={part=>part.body.length>260?part.body.slice(0,257)+'…':part.body}
          renderExtra={part=><button type="button" className="btn tiny sb-structure-develop" onPointerDown={event=>event.stopPropagation()} onClick={event=>{event.stopPropagation();develop(part);}}>Develop ↗</button>}/>
        {!Object.keys(graph.nodes).length&&<div className="sb-structure-empty"><h3>Build this story moment</h3><p>Choose a part above. Its node appears as you develop it.</p><button type="button" className="btn primary" onClick={()=>add('opener')}>Choose an opener</button></div>}
      </div>
      <aside className="sb-structure-inspector" aria-label="Story part details">{selected?<>
        <small>{BEAT_PARTS.find(part=>part.id===selected.section)?.label}</small><h3>{selected.title}</h3>
        <button type="button" className="btn" onClick={()=>develop(selected)}>Develop in workshop ↗</button>
        <p>{selected.body}</p>
        <label htmlFor={fieldId}>Your detail</label><textarea id={fieldId} value={beatStructureDetail(node,selected)} rows={6} placeholder="Add detail to this part…" onChange={event=>onPatch(beatStructureDetailPatch(node,selected,event.target.value))}/>
        <button type="button" className="linkbtn danger" onClick={()=>remove([selected.id])}>Remove this part</button>
      </>:<><h3>Inside this beat</h3><p>Select a part to edit its detail, or open it for guided choices.</p><p className="dim">Opener → Complication → Players → possible outcomes.</p></>}</aside>
    </div>
  </section>;
}
