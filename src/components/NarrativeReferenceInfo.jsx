import React, { useEffect, useRef } from 'react';
import NarrativeSourceSymbol from './NarrativeSourceSymbol.jsx';
import StructureThumb from './StructureThumb.jsx';
import { sourceGraph } from '../lib/narrativeGraph.js';
import { ARCHETYPE_ATTRIBUTION, storyArchetype } from '../data/storyArchetypes.js';

export default function NarrativeReferenceInfo({ item, library, onClose }) {
  const ref = useRef(null);
  const { source, type, label } = item;
  const graph = sourceGraph(source);
  const parts = [...Object.values(graph.nodes || {}), ...Object.values(graph.subnodes || {}), ...Object.values(graph.frameworks || {})];
  const description = source.description || source.body || source.summary || source.blurb;
  const archetype = type === 'concept' ? storyArchetype(source) : null;
  useEffect(() => {
    const previous = document.activeElement, element = ref.current;
    element.showModal();
    return () => { element.close(); previous?.focus?.(); };
  }, []);
  return <dialog ref={ref} className="framework-detail-dialog nw-reference-info" aria-label={`Information about ${label}`}
    onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose(); }}>
    <header><div><small>{type === 'structure' ? 'Story structure' : type === 'template' ? 'Supporting template' : 'Reference concept'}</small><h2>{label}</h2></div><button type="button" className="btn" onClick={onClose} autoFocus>Close</button></header>
    <div className="nw-reference-body">
      <section><div className={`nw-source-art nw-source-${type}`}><NarrativeSourceSymbol source={source} type={type} /></div>
        {(archetype?.overview || description) && <p>{archetype?.overview || description}</p>}
        {parts.length > 0 && !archetype && <StructureThumb structure={{ ...graph, nodes: Object.fromEntries(parts.map((node, index) => [node.id || index, { ...node, x: node.x || 0, y: node.y || 0 }])), edges: graph.edges || [] }} lib={library} width={720} height={280} />}
      </section>
      <section aria-label="Reference details"><h3>{archetype ? 'The archetype at a glance' : parts.length ? 'Parts of this reference' : 'About this reference'}</h3>
        {archetype ? <><p><b>Gift to others:</b> {archetype.gift.hint}</p><p><b>{archetype.excessive.name}:</b> {archetype.excessive.description}</p><p><b>{archetype.withdrawing.name}:</b> {archetype.withdrawing.description}</p>{!!archetype.blends.length && <details><summary>Combinations from the reference</summary>{archetype.blends.map(blend => <p key={blend.withArchetype}>{archetype.label} + {blend.withArchetype} = {blend.name}</p>)}</details>}<small>{ARCHETYPE_ATTRIBUTION} PDF pages {archetype.pages.join('–')}.</small></> : parts.map((node, index) => <details key={node.id || index}><summary>{node.title || node.name || node.label || node.kind || 'Part'}</summary>{(node.description || node.body || node.prompt) && <p>{node.description || node.body || node.prompt}</p>}</details>)}
        {(Array.isArray(source.templateQuestions) ? source.templateQuestions : []).map((question, index) => <p key={`question:${index}`}>{typeof question === 'string' ? question : question.prompt || question.question || question.label}</p>)}
        {!parts.length && !description && <p>{item.guidance.reason}</p>}
      </section>
    </div>
  </dialog>;
}
