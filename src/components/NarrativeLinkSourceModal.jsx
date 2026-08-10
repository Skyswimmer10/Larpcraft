import React from 'react';
import { useLibrary } from '../state/store.jsx';
import { ADDITIONAL_NODE_TYPES, BASE_NODE_TYPES } from '../data/seed.js';
import { resolveNarrativeLink } from '../lib/narrativeLinks.js';
import StructureThumb from './StructureThumb.jsx';
import { PrimIcon } from './bits.jsx';

export default function NarrativeLinkSourceModal({ targetRef, onClose, onOpenEditor }) {
  const lib = useLibrary();
  const target = resolveNarrativeLink(lib, targetRef);
  const source = targetRef?.type === 'concepts'
    ? lib.concepts?.[targetRef.id]
    : targetRef?.type === 'stories'
      ? lib.stories?.[targetRef.id]
      : lib.narrative?.[targetRef?.id];

  if (!targetRef) return null;

  return (
    <div className="modal-backdrop link-source-backdrop" onClick={onClose}>
      <div className="modal wide link-source-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modalhead">
          <div className="link-source-heading">
            <span className="sq big" style={{ background: target?.color || '#8B92A6' }}>
              <PrimIcon icon={target?.icon || 'link'} color="#fff" size={13} />
            </span>
            <div><small>Linked library source</small><b>{target?.label || 'Missing source'}</b></div>
          </div>
          <button className="x big" onClick={onClose} aria-label="Close">×</button>
        </div>

        {!target || !source ? (
          <div className="empty">This source no longer exists. Close this window and choose a replacement in the Linking Node inspector.</div>
        ) : (
          <div className="link-source-body">
            {targetRef.type !== 'narrative' && (
              <div className="link-source-map">
                <StructureThumb structure={source} lib={lib} width={620} height={310} />
                <small>Read-only overview of the complete source graph.</small>
              </div>
            )}
            <div className="link-source-details">
              <span className="cptbadge">
                {targetRef.type === 'concepts'
                  ? (ADDITIONAL_NODE_TYPES[source.category]?.label || 'Concept')
                  : targetRef.type === 'stories'
                    ? 'Story Structure'
                    : (BASE_NODE_TYPES[source.nodeKind]?.label || 'Narrative Node')}
              </span>
              <h3>{source.name}</h3>
              <p>{source.description || source.body || source.template?.body || 'No description has been added.'}</p>
              {targetRef.type !== 'narrative' && <div className="mono dim">{Object.keys(source.nodes || {}).length} nodes · {(source.edges || []).length} relationships</div>}
            </div>
          </div>
        )}

        <div className="modalfoot">
          <button className="btn" onClick={onClose}>Close</button>
          <button className="btn primary" disabled={!target || !source} onClick={() => onOpenEditor?.(targetRef)}>Open full editor</button>
        </div>
      </div>
    </div>
  );
}
