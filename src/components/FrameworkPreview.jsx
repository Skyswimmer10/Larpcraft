import React, { useLayoutEffect, useRef, useState } from 'react';
import { FRAMEWORK_TYPES } from '../data/seed.js';
import { frameworkBaseSize } from '../lib/frameworkScale.js';
import LanguageSpectrum from './LanguageSpectrum.jsx';
import PreferenceSpectra from './PreferenceSpectra.jsx';

function JourneyDiagram({ framework }) {
  const arc = framework.layout === 'storyArc';
  const learning = framework.layout === 'cycle';
  const points = arc ? [[24,28],[87,74],[160,118],[233,74],[296,28]]
    : framework.phases.map((_, i) => {
      const angle = -Math.PI / 2 + i * Math.PI * 2 / framework.phases.length;
      return [160 + 67 * Math.cos(angle), 82 + 67 * Math.sin(angle)];
    });
  return <svg className="framework-journey" viewBox="0 0 320 166" aria-hidden="true">
    {arc ? <>
      <path className="framework-area" d="M24 28 C77 28 92 118 160 118 S243 28 296 28 L296 152 H24Z" />
      <path className="framework-route" d="M24 28 C77 28 92 118 160 118 S243 28 296 28" />
      <text x="160" y="31" textAnchor="middle">DESCENT → RECOVERY</text>
    </> : <>
      <circle className="framework-area" cx="160" cy="82" r="67" />
      <circle className="framework-route" cx="160" cy="82" r="67" />
      <path className="framework-arrow" d="M213 39l10 3-1-11" />
      {learning ? <><text x="160" y="80" textAnchor="middle">LEARNING</text><text x="160" y="97" textAnchor="middle">CYCLE ↻</text></>
        : <><path className="framework-divider" d="M99 82H221" /><text x="160" y="70" textAnchor="middle">ORDER</text><text x="160" y="103" textAnchor="middle">CHAOS</text><text x="34" y="40">HOME</text><text x="244" y="144">VOYAGE</text><text x="15" y="126">RETURN</text></>}
    </>}
    {points.map(([x,y],i)=><g key={i}><circle className="framework-stop" cx={x} cy={y} r="13" /><text className="framework-stop-label" x={x} y={y+4} textAnchor="middle">{i+1}</text></g>)}
  </svg>;
}

function FrameworkDesign({ fw, className }) {
  const layout = fw.layout || 'fate';
  if (layout === 'preferenceSpectra') return <div className={`framework-design ${className}`} style={{ '--framework-accent': fw.color }}><PreferenceSpectra framework={fw} /></div>;
  if (layout === 'languageSpectrum') return <div className={`framework-design ${className}`} style={{ '--framework-accent': fw.color }}><LanguageSpectrum framework={fw} /></div>;
  if (layout === 'profileDomains') return <div className={`framework-design framework-profile ${className}`} style={{ '--framework-accent': fw.color }}>
    <div className="framework-design-caption"><span>Person · nine dimensions</span><b>9</b></div>
    <div className="profile-root">CHARACTER PROFILE<small>Multiple dimensions · no single type</small></div>
    <div className="profile-branches">{fw.phases.map(phase => <div className="profile-branch" key={phase.key}>
      <span className="framework-stage-index">{phase.key}</span><div><strong>{phase.name}</strong><small>{phase.children.join(' · ')}</small></div>
    </div>)}</div>
    <div className="profile-levels">{fw.levels.map(level => <span key={level}>{level}</span>)}</div>
    <p className="profile-note">Describe each subdomain independently. Writing reference · no clinical scores.</p>
  </div>;
  return <div className={`framework-design framework-${layout} ${className}`} style={{ '--framework-accent': fw.color }} aria-label={`${fw.label} framework`}>
    <div className="framework-design-caption"><span>{layout === 'values' ? 'Opposing values' : layout === 'archetypes' ? (fw.phases.some(phase => phase.childActiveShadow) ? 'Adult · child · shadow' : 'Strengths · shadow tensions') : layout === 'decisionPath' ? 'From question to recipe' : layout === 'fate' ? 'Four lenses for engagement' : 'Follow the numbered stages'}</span><b>{fw.phases.length}</b></div>
    {['cycle','storyArc','storyCircle8'].includes(layout) && <JourneyDiagram framework={fw} />}
    {layout === 'values' ? <div className="framework-poles">
      {fw.phases.map(phase=><div className="framework-pole" key={phase.key} title={phase.short}>
        <strong>{phase.key}</strong><span aria-label="versus">↔</span><b>{phase.name}</b>
      </div>)}
    </div> : layout === 'archetypes' ? <div className="framework-archetype-grid">
      {fw.phases.map(phase=><div className="framework-archetype" key={phase.key}>
        <div className="framework-archetype-adult"><small>ADULT</small><strong>{phase.key}</strong></div>
        <div className="framework-shadow-pair"><span>{phase.adultActiveShadow}</span><span>{phase.adultPassiveShadow}</span></div>
        <div className="framework-archetype-child"><small>{phase.childActiveShadow ? 'CHILD' : 'FOCUS'}</small><b>{phase.name}</b></div>
        {phase.childActiveShadow && <div className="framework-shadow-pair"><span>{phase.childActiveShadow}</span><span>{phase.childPassiveShadow}</span></div>}
      </div>)}
    </div> : <div className={`framework-stages ${layout === 'decisionPath' ? 'framework-timeline' : ''}`}>
      {fw.phases.map((phase,i)=><div className="framework-stage" key={phase.key} title={phase.detail || phase.short}>
        <span className="framework-stage-index">{layout === 'fate' ? phase.key : i+1}</span>
        <div><strong>{phase.name}</strong>{layout === 'cycle' && <em>{phase.key}</em>}
          {(phase.question || layout === 'fate') && <small>{phase.question || phase.short}</small>}
        </div>
      </div>)}
    </div>}
  </div>;
}

export default function FrameworkPreview({ frameworkId, className = '', nodeWidth, nodeHeight }) {
  const fw = FRAMEWORK_TYPES[frameworkId] || FRAMEWORK_TYPES.fate;
  const content = useRef(null);
  const [naturalHeight, setNaturalHeight] = useState(0);
  const onCanvas = Boolean(Number(nodeWidth) || Number(nodeHeight));
  const base = frameworkBaseSize(fw);
  const naturalWidth = Math.max(320, base.w - 24);
  useLayoutEffect(() => {
    if (!onCanvas || !content.current) return;
    const observer = new ResizeObserver(([entry]) => setNaturalHeight(entry.contentRect.height));
    observer.observe(content.current);
    return () => observer.disconnect();
  }, [onCanvas, frameworkId]);
  if (!onCanvas) return <FrameworkDesign fw={fw} className={className} />;
  const scale = Math.min((Math.max(26, Number(nodeWidth) || base.w) - 26) / naturalWidth,
    nodeHeight && naturalHeight ? Math.max(1, Number(nodeHeight) - 58) / naturalHeight : Infinity);
  return <div className="framework-fit" style={{ height: naturalHeight * scale }}>
    <div ref={content} className="framework-fit-content" style={{ width: naturalWidth, transform: `translateX(-50%) scale(${scale})` }}>
      <FrameworkDesign fw={fw} className={className} />
    </div>
  </div>;
}
