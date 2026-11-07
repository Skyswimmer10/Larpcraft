import React from 'react';
import { useGame, useDispatch } from '../state/store.jsx';
import { locateGraph } from '../state/reducer.js';
import { characterSources } from '../lib/characterProfile.js';
import { NarrativeWizardButton } from './NarrativeWizard.jsx';
import './CharacterInputNode.css';

export function characterCanvasOwner(game, scope) {
  const path = scope.parentPath || (scope.parentId ? [scope.parentId] : []);
  if (!path.length) return null;
  const parentScope = { coll: scope.coll, parentPath: path.slice(0, -1) };
  const graph = locateGraph(game, parentScope);
  const node = graph.nodes[path.at(-1)];
  return ['character', 'group'].includes(node?.kind) ? { node, scope: parentScope, graph } : null;
}

export function characterInputAncestor(game, scope) {
  const path = scope.parentPath || (scope.parentId ? [scope.parentId] : []);
  for (let index = path.length - 1; index >= 0; index--) {
    const parentScope = { coll: scope.coll, parentPath: path.slice(0, index) };
    const node = locateGraph(game, parentScope).nodes[path[index]];
    if (node?.characterInput) return { node, scope: parentScope };
  }
  return null;
}

export function CharacterCanvasWizard({ scope, className = 'btn', onInsert }) {
  const game = useGame(), dispatch = useDispatch();
  const owner = characterCanvasOwner(game, scope);
  return <><NarrativeWizardButton gameScope={owner?.scope || scope} targetId={owner?.node.id}
    label={owner ? 'Add a framework or concept' : 'Story wizard'} className={className} onInsert={owner ? undefined : onInsert} />
    {!!owner?.node.characterCanvas?.hidden?.length && <button type="button" className="btn small" onClick={() => dispatch({
      type: 'GRAPH_UPDATE_NODE', scope: owner.scope, id: owner.node.id, patch: { characterCanvas: { ...owner.node.characterCanvas, hidden: [] } },
    })}>Show hidden inputs ({owner.node.characterCanvas.hidden.length})</button>}</>;
}

export default function CharacterInputNode({ node, scope, detailed = false }) {
  const game = useGame(), dispatch = useDispatch();
  const owner = characterCanvasOwner(game, scope);
  const graph = owner && { ...owner.graph, nodes: { ...owner.graph.nodes, ...(!owner.scope.parentPath.length && owner.scope.coll === 'nodes' ? game.frameworks : {}) } };
  const row = owner && characterSources(owner.node, graph).find(source => source.key === node.characterInput.key);
  if (!row) return <p className="hint">Saved input view. Open this input from its character or group to edit the wizard.</p>;
  const framework = node.kind === 'framework';
  const records = row.record ? [row.record] : row.records || [];
  const wizardOwner = row.record ? owner.node : !row.missing && graph.nodes[row.nodeId];
  return <div className={`character-input-node${detailed ? ' ci-detailed' : ''}`}
    onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()} onDoubleClick={event => event.stopPropagation()}>
    <small>{framework ? 'Framework' : 'Concept'} for {owner.node.title || owner.node.name}</small>
    {row.label && row.label !== owner.node.title && <b>{row.label}</b>}
    {row.nodeId && <small>Linked input · wizard edits update its original canvas source.</small>}
    {detailed && <h3>{row.sourceLabel}</h3>}
    <label className="ci-enabled"><input type="checkbox" checked={row.enabled} onChange={event => {
      const excluded = owner.node.characterProfile?.excluded || [];
      dispatch({ type: 'GRAPH_UPDATE_NODE', scope: owner.scope, id: owner.node.id, patch: {
        characterProfile: { ...owner.node.characterProfile, excluded: event.target.checked ? excluded.filter(key => key !== row.key) : [...excluded, row.key] },
      } });
    }} />Include in description</label>
    {records.map(record => wizardOwner && <NarrativeWizardButton key={record.sessionId || record.sourceId}
      resumeNode={wizardOwner} resumeRecord={record} gameScope={owner.scope} className="btn small"
      label={records.length > 1 ? `Edit ${record.sourceLabel || record.sourceId}` : framework ? 'Edit this framework' : 'Edit this concept'} />)}
    {row.missing && <p className="hint">Saved contribution retained. Recover its editable wizard from the profile inspector.</p>}
    <p className="ci-description">{row.text || 'No answers recorded yet.'}</p>
    {Object.keys(node.sub?.nodes || {}).length > 0 && <small>Double-click the card header to open its filled nodes.</small>}
  </div>;
}
