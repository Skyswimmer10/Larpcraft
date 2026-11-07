import React from 'react';
import { useGame, useDispatch } from '../state/store.jsx';
import { characterCanvasOwner } from './CharacterInputNode.jsx';
import { groupFacts, resolveGroupRef } from '../lib/groupFoundations.js';
import GroupMembers from './GroupMembers.jsx';
import { GroupWizardButton } from './GroupWizard.jsx';

export default function GroupRoster({ scope, onSelect, detailed = false }) {
  const game = useGame(), dispatch = useDispatch(), owner = characterCanvasOwner(game, scope);
  if (owner?.node.kind !== 'group') return <p className="hint">Open this roster from its group.</p>;
  const facts = groupFacts(owner.node);
  if (detailed) return <div className="group-panel"><GroupMembers facts={facts} game={game} ownerRef={{ coll: owner.scope.coll, path: [...owner.scope.parentPath, owner.node.id] }} onChange={groupFacts => dispatch({ type: 'GRAPH_UPDATE_NODE', scope: owner.scope, id: owner.node.id, patch: { groupFacts } })} /></div>;
  return <div className="group-member-preview" onPointerDown={e => e.stopPropagation()} onDoubleClick={e => e.stopPropagation()}>
    {facts.members.map(row => {
      const live = resolveGroupRef(game, row.ref);
      return live && onSelect ? <button type="button" className="btn small" key={row.id} onClick={() => onSelect({ kind: 'graphnode', scope: { coll: row.ref.coll, parentPath: row.ref.path.slice(0, -1) }, id: row.ref.path.at(-1) })}>{live.title || live.name}{row.role ? ` · ${row.role}` : ''}</button>
        : <span key={row.id}>{row.name}{row.role ? ` · ${row.role}` : ''}{row.ref && !live ? ' · profile unavailable' : ''}</span>;
    })}
    {!facts.members.length && <span>No members recorded yet.</span>}
    <GroupWizardButton node={owner.node} scope={owner.scope} startStep="members" label="Edit members & relationships" className="btn small" />
  </div>;
}
