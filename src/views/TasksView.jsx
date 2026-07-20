import React, { useState } from 'react';
import { useGame, useLibrary, useDispatch } from '../state/store.jsx';
import { locateGraph } from '../state/reducer.js';
import GraphEditor from '../components/GraphEditor.jsx';
import NodePalette from '../components/NodePalette.jsx';
import CsvButtons from '../components/CsvButtons.jsx';
import NarrativeLibraryBrowser from '../components/NarrativeLibraryBrowser.jsx';
import { TASK_DETAIL_TYPES } from '../data/seed.js';
import {
  buildMechanicsLibrarySections,
  buildMechanicsPaletteGroups,
  filterMechanicsPaletteGroups,
  mechanicsPayloadToNode,
  MECHANICS_PALETTE_FILTERS,
} from '../mechanics/palette.js';

const TASK_PALETTE = [{ id: 'task', label: 'Task', color: '#5BC0BE', icon: 'layers', blurb: 'A clean session task. Double-click it to build its details.' }];
const DETAIL_PALETTE = Object.values(TASK_DETAIL_TYPES);

export default function TasksView({ selection, onSelect }) {
  const s = useGame();
  const lib = useLibrary();
  const dispatch = useDispatch();
  const [openPath, setOpenPath] = useState([]);
  const [query, setQuery] = useState('');
  const [paletteFilter, setPaletteFilter] = useState('all');
  const [browsingLibrary, setBrowsingLibrary] = useState(false);
  const inside = openPath.length > 0;
  const scope = inside ? { coll: 'taskNodes', parentPath: openPath } : { coll: 'taskNodes' };
  const idPrefix = inside ? `${s.meta.prefix}-DET` : `${s.meta.prefix}-TSK`;
  const nodeAtPath = (path) => {
    let nodes = s.taskNodes || {};
    let current = null;
    for (const id of path) {
      current = nodes[id];
      nodes = current?.sub?.nodes || {};
    }
    return current;
  };
  const openNode = inside ? nodeAtPath(openPath) : null;
  const rootTask = inside ? s.taskNodes?.[openPath[0]] : null;
  const backOneLevel = () => {
    setOpenPath((path) => path.slice(0, -1));
    onSelect(null);
  };

  const addFromPayload = (payload, pos = null) => {
    const graph = locateGraph(s, scope);
    const node = mechanicsPayloadToNode(payload, lib, graph.nodes, pos?.x ?? 90, pos?.y ?? 90, idPrefix);
    if (!node) return;
    dispatch({ type: 'GRAPH_ADD_NODE', scope, node });
    onSelect({ kind: 'graphnode', scope, id: node.id });
  };

  const createNodeFromPalette = (payload, pos, nodes) => mechanicsPayloadToNode(payload, lib, nodes, pos.x, pos.y, idPrefix);
  const paletteGroups = buildMechanicsPaletteGroups(lib, {
    onAdd: (payload) => addFromPayload(payload),
    includeTask: !inside,
    includeDetail: !!inside,
    includeTemplates: !inside,
  });
  const visiblePaletteGroups = filterMechanicsPaletteGroups(paletteGroups, paletteFilter);
  const mechanicsLibrarySections = buildMechanicsLibrarySections(lib, (payload) => addFromPayload(payload));

  return (
    <div className="main splitmain">
      <NodePalette
        title="Mechanics Nodes"
        subtitle="Click or drag onto the canvas"
        search={query}
        onSearch={setQuery}
        filters={MECHANICS_PALETTE_FILTERS}
        activeFilter={paletteFilter}
        onFilter={setPaletteFilter}
        groups={visiblePaletteGroups}
        headerAction={<button className="btn tiny" onClick={() => setBrowsingLibrary(true)}>Browse Library</button>}
      />
      <div className="mainpane">
        <div className="mhead">
          <div>
            <div className="crumb">
              {s.meta.name} / {inside
                ? <><button className="crumblink" onClick={() => { setOpenPath([]); onSelect(null); }}>Mechanics Fever</button> / <b>{openNode?.title || rootTask?.title || 'Detail graph'}</b></>
                : <b>Mechanics Fever</b>}
            </div>
            <h2>{inside ? (openNode?.title || rootTask?.title || 'Mechanics Detail') : 'Mechanics Fever'}</h2>
          </div>
          <div className="right">
            <CsvButtons coll="taskNodes" />
            {inside && <button className="btn" onClick={backOneLevel}>{openPath.length > 1 ? 'Back one level' : 'Back to task flow'}</button>}
          </div>
        </div>

        {inside ? (
          <>
            <div className="subintro dim">
              Detail nodes for <b>{openNode?.title || rootTask?.title}</b>: restrictions, prop interactions, sensors, subnodes, physical references, and staged effects.
            </div>
            <GraphEditor
              scope={scope}
              palette={DETAIL_PALETTE}
              idPrefix={idPrefix}
              enableFrames
              showToolbar={false}
              createNodeFromPalette={createNodeFromPalette}
              allowOpen
              onOpen={(id) => { setOpenPath((path) => [...path, id]); onSelect(null); }}
              selection={selection}
              onSelect={onSelect}
            />
          </>
        ) : (
          <>
            <div className="subintro dim">
              Runtime task view for actual sessions. Drop Task Templates as clean collapsed nodes, then drill in only when detail is needed.
            </div>
            <GraphEditor
              scope={scope}
              palette={TASK_PALETTE}
              idPrefix={idPrefix}
              filterNode={(n) => n.kind !== 'travel'}
              enableFrames
              showToolbar={false}
              createNodeFromPalette={createNodeFromPalette}
              allowOpen
              onOpen={(id) => { setOpenPath([id]); onSelect(null); }}
              selection={selection}
              onSelect={onSelect}
            />
          </>
        )}
        <div className="statusbar">
          <span>{inside
            ? 'Build this task with mechanic nodes, subnodes, physical refs and sensors. Back returns to the clean session task view.'
            : 'Mechanics Fever shows collapsed session tasks by default. Use the sidebar to add tasks, task templates, mechanic nodes, and physical refs.'}</span>
        </div>
        {browsingLibrary && (
          <NarrativeLibraryBrowser
            title="Mechanics Library Browser"
            subtitle="Browse task templates, physical elements, sensors, and locations."
            sections={mechanicsLibrarySections}
            onClose={() => setBrowsingLibrary(false)}
          />
        )}
      </div>
    </div>
  );
}
