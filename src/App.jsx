import React, { useState } from 'react';
import { StoreProvider, useGame, useDispatch, useLibrary, useLibraryDispatch, resetDemoData } from './state/store.jsx';
import Inspector from './components/Inspector.jsx';
import ProjectMenu from './components/ProjectMenu.jsx';
import { PrimIcon } from './components/bits.jsx';
import ItemDatabase from './views/ItemDatabase.jsx';
import ScenarioFlow from './views/ScenarioFlow.jsx';
import Teams from './views/Teams.jsx';
import Players from './views/Players.jsx';
import Locations from './views/Locations.jsx';
import Library from './views/Library.jsx';
import GameMasterRules from './views/GameMasterRules.jsx';
import Weaver from './views/Weaver.jsx';
import TasksView from './views/TasksView.jsx';
import StoryDynamics from './views/StoryDynamics.jsx';

const BUILD_VIEWS = [
  { id: 'weaver', label: 'Master Story', color: 'var(--c-sensor)', comp: Weaver, count: (p) => Object.keys(p.masterNodes ?? {}).length },
  { id: 'storyDynamics', label: 'Story Dynamics Graph', color: '#F08CB4', comp: StoryDynamics, count: (p) => (p.storyDynamicsGraph?.curves?.length ?? 0) + (p.storyDynamicsGraph?.tags?.length ?? 0) },
  { id: 'flow', label: 'Narrative Weaver', color: 'var(--c-narrative)', comp: ScenarioFlow, count: (p) => Object.keys(p.nodes).length },
  { id: 'tasks', label: 'Mechanics Weaver', color: 'var(--c-mechanic)', comp: TasksView, count: (p) => Object.values(p.taskNodes ?? {}).filter((n) => n.kind !== 'travel').length },
  { id: 'locations', label: 'Locations', color: 'var(--c-location)', comp: Locations, count: (p) => Object.keys(p.locations).length },
  { id: 'items', label: 'Items & Gadgets', color: 'var(--c-item)', comp: ItemDatabase, count: (p) => Object.keys(p.items).length },
];
const MANAGE_VIEWS = [
  { id: 'teams', label: 'Teams', color: 'var(--c-mechanic)', comp: Teams, count: (p) => Object.keys(p.teams).length },
  { id: 'players', label: 'Players', color: 'var(--c-sensor)', comp: Players, count: (p) => Object.keys(p.players).length },
];

// The Library, grouped: physical templates, game mechanics, story content.
const LIB_GROUPS = [
  { id: 'physical', label: 'Physical', color: 'var(--c-item)', colls: ['items', 'locations', 'sensors'] },
  { id: 'mechanics', label: 'Game Mechanics', color: 'var(--c-mechanic)', colls: ['mechPrimitives', 'mechSubnodes', 'mechStructures'] },
  { id: 'story', label: 'Story & Narrative', color: 'var(--c-narrative)', colls: ['concepts', 'narrative', 'stories'] },
];

function Shell() {
  const proj = useGame();
  const lib = useLibrary();
  const dispatch = useDispatch();
  const libDispatch = useLibraryDispatch();
  const [view, setView] = useState('items');
  const [libGroup, setLibGroup] = useState('physical');
  const [selection, setSelection] = useState(null);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);

  if (!proj || !lib) return <div className="boot">Loading library &amp; game...</div>;

  const all = [...BUILD_VIEWS, ...MANAGE_VIEWS];
  const isLibrary = view === 'library';
  const isRules = view === 'gmrules';
  const ActiveView = isLibrary || isRules ? null : all.find((v) => v.id === view).comp;

  const navBtn = (v) => (
    <button key={v.id} className={`nav${view === v.id ? ' on' : ''}`} onClick={() => setView(v.id)}>
      <span className="sq" style={{ background: v.color }} />{v.label}<span className="n">{v.count(proj)}</span>
    </button>
  );

  const backdrops = proj.meta.backdrops || {};
  const contentBackdrop = backdrops.content;
  return (
    <div className={`chrome${navCollapsed ? ' nav-collapsed' : ''}${inspectorCollapsed ? ' inspector-collapsed' : ''}${contentBackdrop?.image?.dataUrl ? ' has-content-backdrop' : ''}`}>
      {contentBackdrop?.image?.dataUrl && (
        <div className="contentbg"
          style={{ backgroundImage: `url(${contentBackdrop.image.dataUrl})`, opacity: contentBackdrop.opacity ?? 0.25 }} />
      )}
      <div className={`sidebar${navCollapsed ? ' collapsed' : ''}`}>
        <button className="sidebar-toggle sidebar-open" onClick={() => setNavCollapsed(false)} title="Open game navigation" aria-label="Open game navigation">
          <PrimIcon icon="layers" color="currentColor" size={15} />
        </button>
        <button className="sidebar-toggle sidebar-close" onClick={() => setNavCollapsed(true)} title="Collapse game navigation" aria-label="Collapse game navigation">
          <PrimIcon icon="layers" color="currentColor" size={15} />
        </button>
        <div className="proj"><span className="dot" /><div><b>{proj.meta.name}</b><small>Active game · {Object.keys(proj.items).length} items</small></div></div>
        <div className="navlab">Build</div>
        {BUILD_VIEWS.map(navBtn)}
        {MANAGE_VIEWS.length > 0 && <div className="navlab">Manage</div>}
        {MANAGE_VIEWS.map(navBtn)}
        <div className="navlab">Library · master database</div>
        {LIB_GROUPS.map((g) => (
          <button key={g.id} className={`nav${view === 'library' && libGroup === g.id ? ' on' : ''}`}
            onClick={() => { setView('library'); setLibGroup(g.id); }}>
            <span className="sq" style={{ background: g.color }} />{g.label}
            <span className="n">{g.colls.reduce((sum, c) => sum + Object.keys(lib[c]).length, 0)}</span>
          </button>
        ))}
        <button className={`nav${isRules ? ' on' : ''}`} onClick={() => setView('gmrules')}>
          <span className="sq" style={{ background: '#E8D25C' }} />Game Master Rules
          <span className="n">{Object.keys(lib.gmRules ?? {}).length}</span>
        </button>
        <div className="sidefoot">
          <button className="linkbtn" onClick={() => resetDemoData(libDispatch, dispatch)}>Reset demo data</button>
        </div>
      </div>
      {isLibrary
        ? <Library group={libGroup} selection={selection} onSelect={setSelection} />
        : isRules
          ? <GameMasterRules />
          : <ActiveView selection={selection} onSelect={setSelection} />}
      <Inspector
        selection={isRules ? null : selection}
        onSelect={setSelection}
        collapsed={inspectorCollapsed}
        onCollapsedChange={setInspectorCollapsed}
      />
    </div>
  );
}

function TitleBar() {
  const proj = useGame();
  const headerBackdrop = proj?.meta?.backdrops?.header;
  return (
    <div className={`titlebar${headerBackdrop?.image?.dataUrl ? ' has-header-backdrop' : ''}`}>
      {headerBackdrop?.image?.dataUrl && (
        <div className="titlebar-bg"
          style={{ backgroundImage: `url(${headerBackdrop.image.dataUrl})`, opacity: headerBackdrop.opacity ?? 0.34 }} />
      )}
      <span className="logo" />
      <ProjectMenu />
      <span className="appname">LARP Craft — {proj?.meta?.name || 'Loading game...'}</span>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <div className="frame">
        <TitleBar />
        <Shell />
      </div>
    </StoreProvider>
  );
}
