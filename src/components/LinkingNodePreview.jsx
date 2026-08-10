import React from 'react';
import { useLibrary } from '../state/store.jsx';
import { resolveNarrativeLink } from '../lib/narrativeLinks.js';

export default function LinkingNodePreview({ node, onNavigate, onInsert }) {
  const lib = useLibrary();
  const target = resolveNarrativeLink(lib, node.linkTarget);
  const confirmGo = (e) => {
    e.stopPropagation();
    if (!target) return;
    if (window.confirm(`Open "${target.label}" in a source window above this canvas?`)) onNavigate?.(node.linkTarget);
  };
  const confirmInsert = (e) => {
    e.stopPropagation();
    if (!target) return;
    if (window.confirm(`Insert "${target.label}" here as one ${node.linkTarget.type === 'narrative' ? 'node' : 'collapsed container'}?`)) onInsert?.(node.linkTarget);
  };
  return (
    <div className={`linking-node-preview${target ? '' : ' missing'}`}>
      <span className="linking-node-type">{target ? target.type === 'narrative' ? 'Node' : target.type === 'concepts' ? 'Concept' : 'Story Structure' : 'Unassigned link'}</span>
      <b>{target?.label || 'Choose a library target'}</b>
      <small>{target?.description || 'Select the destination in the inspector.'}</small>
      {target && (
        <div className="linking-node-actions">
          <button className="linkbtn" onClick={confirmGo}>Go to source</button>
          <button className="linkbtn" onClick={confirmInsert}>Insert here</button>
        </div>
      )}
    </div>
  );
}
