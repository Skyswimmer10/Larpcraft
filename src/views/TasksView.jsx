import { useAppearance } from '../components/AppearanceContext.jsx';
import React, { useState } from 'react';
import { useGame, useLibrary, useDispatch } from '../state/store.jsx';
import { locateGraph } from '../state/reducer.js';
import GraphEditor from '../components/GraphEditor.jsx';
import { useMechanicsToolbox } from '../components/MechanicsToolbox.jsx';
import { visibleCanvasPlacement } from '../components/FlowCanvas.jsx';
import { mechanicWizardGraph } from '../mechanics/toolbox.js';
import { libraryWithMechanismDraft } from '../mechanics/collections.js';
import CsvButtons from '../components/CsvButtons.jsx';
import NarrativeLibraryBrowser from '../components/NarrativeLibraryBrowser.jsx';
import { TASK_DETAIL_TYPES } from '../data/seed.js';
import {
  buildMechanicsLibrarySections,
  buildMechanicsPaletteGroups,
  mechanicsPayloadToNode,
} from '../mechanics/palette.js';

const TASK_PALETTE = [];
const DETAIL_PALETTE = Object.values(TASK_DETAIL_TYPES);

export default function TasksView({ selection, onSelect }) {
  const { refreshed } = useAppearance();
  const workspaceTitle = refreshed ? "Mechanics Weaver" : "Mechanics Fever";
  const s = useGame();
  const lib = useLibrary();
  const dispatch = useDispatch();
  const [openPath, setOpenPath] = useState([]);
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

  const addFromPayload = (payload, pos = null, record = null) => {
    const graph = locateGraph(s, scope);
    if (payload === 'task') return;
    const point = pos || visibleCanvasPlacement({ x: 90, y: 90 });
    const node = mechanicsPayloadToNode(payload, libraryWithMechanismDraft(lib, record), graph.nodes, point.x, point.y, idPrefix);
    if (!node) return;
    dispatch({ type: 'GRAPH_ADD_NODE', scope, node });
    onSelect({ kind: 'graphnode', scope, id: node.id });
  };

  const createNodeFromPalette = (payload, pos, nodes) => payload === 'task' ? null : mechanicsPayloadToNode(payload, lib, nodes, pos.x, pos.y, idPrefix);
  const paletteGroups = buildMechanicsPaletteGroups(lib, {
    onAdd: (payload) => addFromPayload(payload),
    includeTask: false,
    includeDetail: !!inside,
    includeTemplates: !inside,
  });
  const mechanicsLibrarySections = buildMechanicsLibrarySections(lib, (payload) => addFromPayload(payload));
  const toolbox = useMechanicsToolbox({ groups: paletteGroups, lib,
    onAdd: (payload, record) => addFromPayload(payload, null, record),
    headerAction: <button className="btn tiny" onClick={() => setBrowsingLibrary(true)}>Browse Library</button>,
    onCreateWizard: answers => {
      const graph = locateGraph(s, scope);
      const additions = mechanicWizardGraph(answers, graph.nodes, visibleCanvasPlacement({ x: 90, y: 90 }, { w: 600, h: 420 }));
      dispatch({ type: 'BATCH', actions: [
        ...Object.values(additions.nodes).map(node => ({ type: 'GRAPH_ADD_NODE', scope, node })),
        ...additions.edges.map(edge => ({ type: 'GRAPH_ADD_EDGE', scope, ...edge })),
      ] });
      const node = Object.values(additions.nodes)[0];
      if (node) onSelect({ kind: 'graphnode', scope, id: node.id });
    },
  });

  return (
    <div className="main splitmain">
      {toolbox.palette}
      {toolbox.dialogs}
      <div className="mainpane">
        <div className="mhead">
          <div>
            <div className="crumb">
              {s.meta.name} / {inside
                ? <><button className="crumblink" onClick={() => { setOpenPath([]); onSelect(null); }}>{workspaceTitle}</button> / <b>{openNode?.title || rootTask?.title || 'Detail graph'}</b></>
                : <b>{workspaceTitle}</b>}
            </div>
            <h2>{inside ? (openNode?.title || rootTask?.title || 'Mechanics Detail') : workspaceTitle}</h2>
          </div>
          <div className="right">
            {toolbox.actions}
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
              Build the backbone, adjust the rules, add equipment, then prepare to run it. Add nodes yourself or use the Mechanics Wizard.
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
            : 'Your toolbox shows the categories you choose. Quick Add searches all available nodes.'}</span>
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
