import React from 'react';
import { ACTION_MECHANISM_NODE_KIND, ACTION_PATTERN_SYSTEMS } from '../data/actionMechanics.js';

const detail = (label, value) => value ? <div><b>{label}</b><span>{value}</span></div> : null;
const detailList = (label, values) => {
  const entries = (Array.isArray(values) ? values : []).map((value) => `${value || ''}`.trim()).filter(Boolean);
  return entries.length ? <div><b>{label}</b><span>{entries.map((entry, index) => <i key={`${label}-${index}`}>{entry}</i>)}</span></div> : null;
};

export const isMechanismPreviewNode = (node) => (
  node?.subnodeKind === 'actionTypePattern'
  || node?.mechKind === 'action'
  || node?.mechKind === ACTION_MECHANISM_NODE_KIND
  || node?.mechKind === 'actionProbability'
);

export default function MechanismNodePreview({ node, lib }) {
  if (node?.mechKind === ACTION_MECHANISM_NODE_KIND) {
    const record = lib.actionPatternMechanisms?.[node.actionMechanismId];
    const advantages = Array.isArray(node.advantages) ? node.advantages : record?.advantages;
    const effects = Array.isArray(node.effects) ? node.effects : record?.effects;
    const variations = Array.isArray(node.variations) ? node.variations : record?.variations;
    return (
      <div className="mechanism-node-records applied">
        <section style={{ '--accent': node.color || record?.color || '#58C7A6' }}>
          <div className="mechanism-node-record-copy">
            <small>{node.mechanismCategory || ACTION_PATTERN_SYSTEMS[node.mechanismSystem]?.label || 'Action Mechanism'}</small>
            {(node.body || record?.description) && <p>{node.body || record.description}</p>}
            {detailList('Advantage', advantages)}
            {detailList('Effect', effects)}
            {detailList('Variation', variations)}
          </div>
        </section>
      </div>
    );
  }

  if (node?.subnodeKind === 'actionTypePattern' || node?.mechKind === 'action') {
    const fields = node.subnodeKind === 'actionTypePattern' ? (node.fields || {}) : node;
    const selected = Object.keys(ACTION_PATTERN_SYSTEMS)
      .map((system) => lib.actionPatternMechanisms?.[fields[`${system}MechanismId`]])
      .filter(Boolean);
    if (!selected.length) return <div className="mechanism-node-empty">Choose Token, Order, or Special in the inspector.</div>;
    return (
      <div className="mechanism-node-records">
        {selected.map((record) => (
          <section key={record.id} style={{ '--accent': record.color || '#58C7A6' }}>
            {record.image?.dataUrl && (
              <span className="mechanism-node-record-image">
                <img src={record.image.dataUrl} alt="" style={{ transform: `translate(${record.imagePositionX || 0}%, ${record.imagePositionY || 0}%) scale(${record.imageScale || 1})` }} />
              </span>
            )}
            <div className="mechanism-node-record-copy">
              <small>{ACTION_PATTERN_SYSTEMS[record.system]?.label}</small>
              <strong>{record.label}</strong>
              {record.description && <p>{record.description}</p>}
              {detailList('Advantage', record.advantages)}
              {detailList('Effect', record.effects)}
              {detailList('Variation', record.variations)}
            </div>
          </section>
        ))}
      </div>
    );
  }

  if (node?.mechKind === 'actionProbability') {
    const record = lib.actionProbabilityMechanisms?.[node.resolutionMechanismId]
      || Object.values(lib.actionProbabilityMechanisms || {}).find((candidate) => candidate.label === node.resolutionType);
    if (!record) return null;
    const variations = Array.isArray(node.variations) ? node.variations : record.variations;
    const effects = Array.isArray(node.effects) ? node.effects : record.effects;
    return (
      <div className="mechanism-node-records probability">
        <section style={{ '--accent': record.color || '#F08CB4' }}>
          <div className="mechanism-node-record-copy">
            <small>Resolution</small>
            <strong>{record.label}</strong>
            {(node.body || record.description) && <p>{node.body || record.description}</p>}
            {detailList('Variation', variations)}
            {detail('Emotional spike', node.emotionalSpike ?? record.emotionalSpike)}
            {detailList('Effect', effects)}
          </div>
        </section>
      </div>
    );
  }
  return null;
}
