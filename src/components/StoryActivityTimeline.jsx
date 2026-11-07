import React from 'react';
import { storyDynamicsSourceKey } from '../data/storyDynamics.js';

export const journeyTime = minutes => `${Math.round(minutes * 10) / 10} min`;

export default function StoryActivityTimeline({ activities, duration, activeId, onOpen }) {
  return <div className="dynamics-activities" aria-label="Activities on the whole-game timeline">
    <div className="dynamics-activities-heading"><b>Activities within the whole game</b><span>0 min → {journeyTime(duration)}</span></div>
    {activities.length ? activities.map(activity => <div className="dynamics-activity-row" key={activity.id}>
      <button className={`dynamics-activity-name${activeId === activity.id ? ' on' : ''}`} aria-current={activeId === activity.id ? 'page' : undefined} onClick={() => onOpen(activity.id)}>
        <span className="sq" style={{ background: activity.color }} />{activity.title}
        <small>{journeyTime(activity.start / 100 * duration)}–{journeyTime(activity.end / 100 * duration)}</small>
      </button>
      <div className="dynamics-activity-track">
        <button className={`dynamics-activity-band${activeId === activity.id ? ' on' : ''}`} style={{ left: `${activity.start}%`, width: `${activity.end - activity.start}%`, '--activity-color': activity.color }} onClick={() => onOpen(activity.id)} aria-label={`Open ${activity.title}: ${journeyTime(activity.start / 100 * duration)} to ${journeyTime(activity.end / 100 * duration)}`} title={`Open ${activity.title}`} />
      </div>
    </div>) : <p className="hint">Add an activity to plan a shorter emotional journey inside this overview.</p>}
  </div>;
}

export function StoryActivityDetails({ activity, duration, sources, onPatch, onInspect }) {
  const selectedKeys = new Set(activity.sources.map(storyDynamicsSourceKey));
  const liveSources = new Map(sources.map(source => [storyDynamicsSourceKey(source), source]));
  const changeBoundary = (value, edge) => {
    if (value === '' || !Number.isFinite(Number(value))) return;
    const percent = Math.max(0, Math.min(100, Number(value) / duration * 100));
    if (edge === 'start') onPatch({ start: Math.min(percent, activity.end - 0.1) }, 'timing');
    else onPatch({ end: Math.max(percent, activity.start + 0.1) }, 'timing');
  };
  return <section className="dynamics-activity-details" aria-label="Activity details">
    <div className="dynamics-activity-fields">
      <label>Activity name<input className="field-input" value={activity.title} onChange={e => onPatch({ title: e.target.value }, 'title')} /></label>
      <label>Starts at (elapsed minutes)<input className="field-input" type="number" min="0" max={activity.end / 100 * duration} step="0.1" value={Math.round(activity.start / 100 * duration * 10) / 10} onChange={e => changeBoundary(e.target.value, 'start')} /></label>
      <label>Ends at (elapsed minutes)<input className="field-input" type="number" min={activity.start / 100 * duration} max={duration} step="0.1" value={Math.round(activity.end / 100 * duration * 10) / 10} onChange={e => changeBoundary(e.target.value, 'end')} /></label>
      <span className="hint">Local journey: {journeyTime((activity.end - activity.start) / 100 * duration)}. Draw this activity’s own highs and lows below.</span>
    </div>
    <details>
      <summary>Story and mechanics contributing to this activity · {activity.sources.length}</summary>
      <label className="lab">Link a story or mechanics node
        <select className="field-input" value="" onChange={e => {
          const source = liveSources.get(e.target.value);
          if (source) onPatch({ sources: [...activity.sources, { coll: source.coll, parentPath: source.parentPath, nodeId: source.nodeId, title: source.title }] });
        }}>
          <option value="">Choose a node…</option>
          {[['masterNodes', 'Master Story'], ['nodes', 'Narrative'], ['taskNodes', 'Mechanics']].map(([coll, label]) => <optgroup key={coll} label={label}>
            {sources.filter(source => source.coll === coll && !selectedKeys.has(storyDynamicsSourceKey(source))).map(source => <option key={storyDynamicsSourceKey(source)} value={storyDynamicsSourceKey(source)}>{source.label}</option>)}
          </optgroup>)}
        </select>
      </label>
      <div className="dynamics-activity-sources">
        {activity.sources.map(source => {
          const key = storyDynamicsSourceKey(source), live = liveSources.get(key);
          return <span key={key} className="dynamics-activity-source">
            <span>{live?.title || source.title}{!live && ' (missing)'} · {source.coll === 'taskNodes' ? 'Mechanics' : 'Story'}</span>
            {live && onInspect && <button className="linkbtn" onClick={() => onInspect({ kind: 'graphnode', scope: { coll: source.coll, parentPath: source.parentPath }, id: source.nodeId })}>Inspect</button>}
            <button className="linkbtn danger" aria-label={`Unlink ${live?.title || source.title}`} onClick={() => onPatch({ sources: activity.sources.filter(item => storyDynamicsSourceKey(item) !== key) })}>×</button>
          </span>;
        })}
      </div>
      <label className="lab">Intended experience / notes<textarea className="field-input" rows="2" value={activity.notes} onChange={e => onPatch({ notes: e.target.value }, 'notes')} placeholder="How do the story and gameplay shape this activity’s experience?" /></label>
    </details>
  </section>;
}
