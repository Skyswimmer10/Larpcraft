import React, { useRef, useState } from 'react';
import { useGame, useLibrary, useDispatch } from '../state/store.jsx';
import { locateGraph } from '../state/reducer.js';
import { BASE_NODE_TYPES } from '../data/seed.js';
import { genId } from '../data/csvSchemas.js';
import { buildNarrativeLinkInsertion } from '../lib/narrativeLinks.js';
import { buildMechanicsPaletteGroups, mechanicsPayloadToNode } from '../mechanics/palette.js';
import GraphEditor from '../components/GraphEditor.jsx';
import { useMechanicsToolbox } from '../components/MechanicsToolbox.jsx';
import { visibleCanvasPlacement } from '../components/FlowCanvas.jsx';
import { mechanicWizardGraph } from '../mechanics/toolbox.js';
import { libraryWithMechanismDraft } from '../mechanics/collections.js';
import NarrativeLibraryBrowser from '../components/NarrativeLibraryBrowser.jsx';
import StoryLibraryBrowser from '../components/StoryLibraryBrowser.jsx';
import { ConversationBrowserDialog } from '../components/Conversations.jsx';
import { conversationFromLibrary } from '../lib/conversations.js';
import { CharacterCanvasWizard } from '../components/CharacterInputNode.jsx';
import './MasterAct.css';
import { StoryPlanningButton } from '../components/StoryPlanning.jsx';

function ActLane({ actId, lane, selection, onSelect, expanded, onExpand, visible = true }) {
  const game = useGame(), lib = useLibrary(), dispatch = useDispatch();
  const [path, setPath] = useState([]);
  const [browsing, setBrowsing] = useState(false);
  const [conversationBrowser, setConversationBrowser] = useState(null);
  const act = game.masterNodes[actId];
  const root = [actId, act.actLanes[lane]];
  const scope = { coll: 'masterNodes', parentPath: [...root, ...path] };
  const graph = locateGraph(game, scope);
  const story = lane === 'story';
  const title = story ? 'Story' : 'Game Mechanics';
  const palette = story ? Object.values(BASE_NODE_TYPES) : [{ id: 'task', label: 'Site time', color: '#5BC0BE', icon: 'layers' }];
  const add = node => {
    if (!node) return;
    dispatch({ type: 'GRAPH_ADD_NODE', scope, node });
    onSelect({ kind: 'graphnode', scope, id: node.id });
    setBrowsing(false);
  };
  const position = { x: 90 + Object.keys(graph.nodes).length % 4 * 60, y: 90 + Object.keys(graph.nodes).length % 4 * 60 };
  const sections = story ? [] : buildMechanicsPaletteGroups(lib, { includeTask: true, includeTemplates: true, includeDetail: true, onAdd: payload => add(mechanicsPayloadToNode(payload, lib, graph.nodes, position.x, position.y, 'ACT-MECH-')) }).filter(Boolean).map(group => ({ ...group, items: group.items.map(item => ({ ...item, onPick: item.onClick })) }));
  const insertStoryLibraryRecord = ({ coll, id, record }) => {
    const point = visibleCanvasPlacement(position);
    if (coll === 'conversationTemplates') {
      const conversation = conversationFromLibrary(record, 'conversation-' + crypto.randomUUID());
      dispatch({ type: 'ADD_ENTITY', coll: 'conversations', entity: conversation });
      setBrowsing(false); setConversationBrowser({ id: conversation.id });
    } else if (coll === 'frameworks') add({ id: genId(graph.nodes, 'ACT-FW-'), kind: 'framework', frameworkId: id, title: record.title || record.label, body: record.summary, color: record.color, ...point });
    else add(buildNarrativeLinkInsertion(lib, { type: coll, id }, graph.nodes, point, 'ACT-STORY-'));
  };
  const create = (kind, pos, nodes) => story
    ? { id: genId(nodes, 'ACT-STORY-'), kind, title: BASE_NODE_TYPES[kind]?.label || kind, body: '', ...pos, sub: { nodes: {}, edges: [] } }
    : mechanicsPayloadToNode(kind, lib, nodes, pos.x, pos.y, 'ACT-MECH-');
  const toolbox = useMechanicsToolbox({ lib, enabled: !story && visible, onAdd: (payload, record) => { const point = visibleCanvasPlacement(position); add(mechanicsPayloadToNode(payload, libraryWithMechanismDraft(lib, record), graph.nodes, point.x, point.y, 'ACT-MECH-')); }, groups: story ? [] : buildMechanicsPaletteGroups(lib, {
    includeTemplates: true, includeDetail: path.length > 0,
    onAdd: payload => { const point = visibleCanvasPlacement(position); add(mechanicsPayloadToNode(payload, lib, graph.nodes, point.x, point.y, 'ACT-MECH-')); },
  }), onCreateWizard: answers => {
    const additions = mechanicWizardGraph(answers, graph.nodes, visibleCanvasPlacement(position, { w: 600, h: 420 }));
    dispatch({ type: 'BATCH', actions: [
      ...Object.values(additions.nodes).map(node => ({ type: 'GRAPH_ADD_NODE', scope, node })),
      ...additions.edges.map(edge => ({ type: 'GRAPH_ADD_EDGE', scope, ...edge })),
    ] });
    const node = Object.values(additions.nodes)[0];
    if (node) onSelect({ kind: 'graphnode', scope, id: node.id });
  } });
  const crumbs = path.map((id, index) => locateGraph(game, { coll: 'masterNodes', parentPath: [...root, ...path.slice(0, index)] }).nodes[id]?.title || 'Node');
  const go = depth => { setPath(path.slice(0, depth)); onSelect(null); };
  return <section className={`act-lane act-lane-${lane}`} aria-label={`${title} canvas`}>
    <header className="act-lane-header">
      <div className="act-crumbs"><button className="crumblink" onClick={() => go(0)}><b>{title}</b></button>{crumbs.map((name, index) => <React.Fragment key={path[index]}><span> / </span><button className="crumblink" onClick={() => go(index + 1)}>{name}</button></React.Fragment>)}</div>
      <div className="right">{story ? <><CharacterCanvasWizard scope={scope} className="btn small" onInsert={insertStoryLibraryRecord} /><button className="btn small" onClick={() => setBrowsing('content')}>Created Content</button></> : <>{toolbox.actions}<button className="btn small" onClick={() => setBrowsing(true)}>Browse Mechanics</button></>}<button className="btn ghost small" onClick={onExpand}>{expanded ? 'Restore split' : 'Expand'}</button></div>
    </header>
    <div className="act-mechanics-workspace">{!story && toolbox.palette}<div className="act-graph-editor"><GraphEditor key={scope.parentPath.join('/')} scope={scope} palette={palette} showToolbar={story} createNodeFromPalette={create} enableFrames allowOpen onOpen={id => { setPath([...path, id]); onSelect(null); }} selection={selection} onSelect={onSelect} /></div></div>
    {!story && toolbox.dialogs}
    {conversationBrowser && <ConversationBrowserDialog initialConversationId={conversationBrowser.id} onClose={() => setConversationBrowser(null)} />}
    {browsing && (story ? <StoryLibraryBrowser library={lib} mode={browsing} includeSubnodes={false} onPick={insertStoryLibraryRecord} onClose={() => setBrowsing(false)} /> : <NarrativeLibraryBrowser title={`${title} Library`} subtitle="Add an editable copy to this act. Templates stay unchanged." sections={sections} onClose={() => setBrowsing(false)} />)}
  </section>;
}

export default function MasterAct({ actId, selection, onSelect, onClose }) {
  const game = useGame();
  const [ratio, setRatio] = useState(50), [expanded, setExpanded] = useState(null);
  const split = useRef(null);
  const clamp = value => Math.min(75, Math.max(25, value));
  return <div className="main master-act-workspace">
    <header className="mhead"><div><div className="crumb">Master Story / Act contents</div><h2>{game.masterNodes[actId]?.title}</h2></div><div className="right"><StoryPlanningButton /><button className="btn" onClick={onClose}>Back to Master Story</button></div></header>
    <div ref={split} className="master-act-split" style={{ gridTemplateRows: expanded ? 'minmax(0, 1fr)' : `minmax(0, ${ratio}fr) 9px minmax(0, ${100 - ratio}fr)` }}>
      <div className="act-lane-host" hidden={expanded === 'mechanics'}><ActLane actId={actId} lane="story" selection={selection} onSelect={onSelect} expanded={expanded === 'story'} onExpand={() => setExpanded(expanded ? null : 'story')} /></div>
      {!expanded && <div className="act-divider" role="separator" aria-label="Resize Story and Game Mechanics" aria-orientation="horizontal" aria-valuemin={25} aria-valuemax={75} aria-valuenow={Math.round(ratio)} tabIndex={0}
        onKeyDown={e => { if (['ArrowUp', 'ArrowDown', 'Home'].includes(e.key)) { e.preventDefault(); setRatio(e.key === 'Home' ? 50 : clamp(ratio + (e.key === 'ArrowUp' ? -5 : 5))); } }}
        onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={e => { if (!e.currentTarget.hasPointerCapture(e.pointerId)) return; const r = split.current.getBoundingClientRect(); setRatio(clamp((e.clientY - r.top) / r.height * 100)); }} onPointerUp={e => { e.currentTarget.releasePointerCapture(e.pointerId); }} />}
      <div className="act-lane-host" hidden={expanded === 'story'}><ActLane actId={actId} lane="mechanics" selection={selection} onSelect={onSelect} visible={expanded !== 'story'} expanded={expanded === 'mechanics'} onExpand={() => setExpanded(expanded ? null : 'mechanics')} /></div>
    </div>
  </div>;
}
