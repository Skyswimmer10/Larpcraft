import React,{useState} from 'react';
import StoryBeatStructure from './StoryBeatStructure.jsx';
import {StoryBeatWorkshop} from './StoryBeatWorkshop.jsx';

export default function StoryBeatStructureEditor(props){
  const [edit,setEdit]=useState(null);
  return <><StoryBeatStructure {...props} onDevelop={setEdit}/>{edit&&<StoryBeatWorkshop node={props.node} onPatch={props.onPatch} game={props.game} scope={props.scope} initialSection={edit.section} initialBranchId={edit.branchId} initialComplicationId={edit.complicationId} onClose={()=>setEdit(null)}/>}</>;
}
