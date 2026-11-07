import { BASE_NODE_TYPES, SUBNODE_TYPES, FRAMEWORK_TYPES } from '../data/seed.js';

export const STORY_LIBRARY_MODES = {
  tools: { title: 'Story Tools', subtitle: 'Frameworks, reference concepts and reusable story structures.' },
  content: { title: 'Created Content', subtitle: 'Saved characters, places, groups, items, conversations and developed story plans.' },
};

export function narrativeLibraryMode(record, coll) {
  if (coll === 'conversationTemplates') return 'content';
  if (coll === 'narrative' && record.nodeClass) return 'content';
  if (['tools', 'content'].includes(record.libraryRole)) return record.libraryRole;
  if (coll === 'frameworks' || coll === 'stories') return 'tools';
  if (coll === 'concepts') return record.narrativeWizard || record.narrativeWizardHistory?.length ? 'content' : 'tools';
  return record.nodeClass === 'subnode' ? 'tools' : 'content';
}

const contentSections = [
  ['characters', 'Characters', ['character'], 'user'], ['places', 'Story Locations', ['storyLocation', 'location'], 'pin'],
  ['groups', 'Groups & institutions', ['group'], 'users'], ['items', 'Story Items', ['item'], BASE_NODE_TYPES.item.icon],
  ['conversations', 'Conversations', ['conversation'], 'users'],
  ['events', 'Story Beats & acts', ['storyBeat', 'event', 'quest', 'masterAct'], 'flag'], ['plans', 'Developed story plans', ['concept'], 'book'],
  ['templates', 'Saved node templates', ['subnodeTemplate'], 'layers'],
  ['other', 'Other saved content', [], 'layers'],
];

// These are views over existing records. Browsing never moves or rewrites them.
export function buildStoryLibrarySections(lib, mode, onPick, { includeSubnodes = true } = {}) {
  const sections = mode === 'content' ? contentSections.map(([id, label, , icon]) => ({ id, label, icon, items: [] }))
    : [['frameworks', 'Reference frameworks'], ['concepts', 'Reference concepts'], ['stories', 'Story structures'], ['support', 'Supporting templates']].map(([id, label]) => ({ id, label, items: [] }));
  const add = (coll, record, meta) => {
    if (narrativeLibraryMode(record, coll) !== mode || !includeSubnodes && record.nodeClass === 'subnode') return;
    const kind = record.nodeClass === 'subnode' ? 'subnodeTemplate' : coll === 'conversationTemplates' ? 'conversation' : record.template?.kind || record.nodeKind || (coll === 'concepts' ? 'concept' : '');
    const sectionId = mode === 'content' ? contentSections.find(([, , kinds]) => kinds.includes(kind))?.[0] || 'other'
      : coll === 'frameworks' ? 'frameworks' : coll === 'concepts' ? 'concepts' : coll === 'stories' ? 'stories' : 'support';
    const sourceType = coll === 'frameworks' ? 'framework' : coll === 'concepts' ? 'concept' : 'structure';
    sections.find(section => section.id === sectionId).items.push({
      id: `${coll}:${record.id}`, label: record.name || record.label || record.title || record.id,
      blurb: record.description || record.body || meta?.blurb || '',
      color: record.color || meta?.color || '#5CA8F5', icon: record.icon || meta?.icon || 'layers',
      image: mode === 'content' ? record.template?.image || record.image : null,
      hideIcon: !!record.hideIcon,
      kicker: mode === 'tools' ? coll === 'frameworks' ? 'Framework' : coll === 'concepts' ? 'Concept' : coll === 'stories' ? 'Structure' : 'Supporting template' : meta?.label || 'Saved content',
      ...(mode === 'tools' && coll !== 'narrative' ? { symbolSource: coll === 'stories' ? { ...record, category: 'structureConcept' } : record, symbolType: sourceType } : {}),
      onPick: () => onPick?.({ coll, id: record.id, record }),
    });
  };
  for (const record of Object.values(FRAMEWORK_TYPES)) add('frameworks', record, record);
  for (const coll of ['concepts', 'stories', 'narrative', 'conversationTemplates']) for (const record of Object.values(lib?.[coll] || {})) {
    const meta = record.nodeClass === 'subnode' ? SUBNODE_TYPES[record.subKind] : BASE_NODE_TYPES[record.nodeKind || record.template?.kind];
    add(coll, record, meta);
  }
  return mode === 'content' ? sections : sections.filter(section => section.items.length);
}

export function buildGameContentSections(game,onPick,onDelete){
  const sections=contentSections.map(([id,label,,icon])=>({id,label,icon,items:[]}));
  const add=(node,ref)=>{
    const kind=ref.coll==='conversations'?'conversation':node.kind;
    const meta=BASE_NODE_TYPES[kind];
    const section=sections.find(row=>row.id===(contentSections.find(([, ,kinds])=>kinds.includes(kind))?.[0]||'other'));
    const payload={source:'game',ref,record:node};
    section.items.push({id:'game:'+JSON.stringify([ref.coll,ref.parentPath||[],ref.nodeId]),label:node.title||node.name||node.id,blurb:node.body||node.summary||'',image:node.image,color:node.color||meta?.color,icon:meta?.icon||'book',kicker:meta?.label||(kind==='concept'?'Story concept':kind==='conversation'?'Conversation':'Saved content'),onPick:()=>onPick?.(payload),...(onDelete?{onDelete:()=>onDelete(payload)}:{})});
  };
  const walk=(nodes,path=[])=>{
    for(const node of Object.values(nodes||{})){
      if(node.characterInput||node.groupRoster||node.groupInput||node.kind==='framework')continue;
      if(['character','group','item','storyLocation','storyBeat','event','quest','concept','storyStructureContainer'].includes(node.kind))add(node,{coll:'nodes',parentPath:path,nodeId:node.id});
      if(node.sub?.nodes)walk(node.sub.nodes,[...path,node.id]);
    }
  };
  walk(game?.nodes);
  for(const conversation of Object.values(game?.conversations||{}))add(conversation,{coll:'conversations',nodeId:conversation.id});
  return sections;
}

export function gameContentDeleteAction(payload){
  if(payload?.source!=='game')return null;
  const ref=payload.ref;
  if(ref?.coll==='conversations')return {type:'DELETE_ENTITY',coll:'conversations',id:ref.nodeId};
  if(ref?.coll!=='nodes'||typeof ref.nodeId!=='string')return null;
  return ref.parentPath?.length?{type:'GRAPH_DELETE_NODE',scope:{coll:'nodes',parentPath:ref.parentPath},id:ref.nodeId}:{type:'DELETE_NODE',nodeId:ref.nodeId};
}
