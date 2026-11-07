import React, { useId, useState } from 'react';
import CharacterText from './CharacterText.jsx';
import { STORY_IMPACTS, STORY_THEMES, STORY_TONES, storyDirection, uniqueStoryTags } from '../lib/storyPlanning.js';
import { storyBeatDetails, storyBeatPatch } from '../lib/storyBeat.js';
import './StoryPlanning.css';
import StoryBeatDialog from './StoryBeatDialog.jsx';

export function StoryBeatImpactButton({ node, onPatch }) {
  const [open, setOpen] = useState(false), details = storyBeatDetails(node);
  return <>
    <button type="button" className="btn story-beat-impact-launch" onClick={() => setOpen(true)} aria-haspopup="dialog"><span>Story impact ↗</span><small>{details.impacts.length ? `${details.impacts.length} selected` : 'Optional'}</small></button>
    {open && <StoryBeatDialog title="Story impact" subtitle={node.title || 'Story Beat'} onClose={() => setOpen(false)}><StoryPromptTags label="Story impact" values={details.impacts} options={STORY_IMPACTS} onChange={impacts => onPatch(storyBeatPatch(node, { impacts }))} /></StoryBeatDialog>}
  </>;
}

export function StoryPromptTags({ label, values = [], options, onChange }) {
  const [custom, setCustom] = useState('');
  const selected = uniqueStoryTags(values), id = useId();
  const add = event => {
    event?.preventDefault();
    if (custom.trim()) { onChange(uniqueStoryTags([...selected, custom])); setCustom(''); }
  };
  return <div className="story-prompt-tags" role="group" aria-label={label}>
    <div className="story-tag-choices">{uniqueStoryTags([...options, ...selected]).map(tag => <button type="button" key={tag} aria-pressed={selected.includes(tag)} onClick={() => onChange(selected.includes(tag) ? selected.filter(value => value !== tag) : [...selected, tag])}>{tag}</button>)}</div>
    <div className="story-tag-custom"><label htmlFor={id} className="sr-only">Custom {label.toLowerCase()}</label><input id={id} className="field-input" value={custom} placeholder="Add your own…" onChange={event => setCustom(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') add(event); }} /><button type="button" className="btn small" disabled={!custom.trim()} onClick={add}>Add</button></div>
  </div>;
}

export function StoryDirectionFields({ value = {}, onPatch, inherited }) {
  const resolved = storyDirection(value, inherited);
  return <section className="story-direction-fields" aria-label="Story themes and tone">
    {[['themes', 'Theme / idea to explore', STORY_THEMES], ['tones', 'Tone / setting flavor', STORY_TONES]].map(([key, label, options]) => <details key={key} className="story-planning-disclosure">
      <summary>{label}{resolved[key].length ? <span className="story-tag-summary">{resolved[key].join(' · ')}</span> : <span className="dim">Optional</span>}</summary>
      {inherited && <label className="story-inherit"><input type="checkbox" checked={value[key] === undefined} onChange={event => onPatch({ [key]: event.target.checked ? undefined : [...resolved[key]] })} />Use Master Story {key === 'themes' ? 'themes' : 'tone'}</label>}
      {(!inherited || value[key] !== undefined) && <StoryPromptTags label={label} options={options} values={resolved[key]} onChange={tags => onPatch({ [key]: tags })} />}
    </details>)}
  </section>;
}

export function StoryBeatReviewFields({ node, onPatch, initialOpen = false, kindFilter, showResolved = true, hideImpacts = false }) {
  const details = storyBeatDetails(node), patch = values => onPatch(storyBeatPatch(node, values));
  const [recent, setRecent] = useState(null);
  const changeThread = (id, value) => patch({ threads: details.threads.map(row => row.id === id ? { ...row, ...value } : row) });
  const relevant = details.threads.filter(row => !kindFilter || (kindFilter === 'issues' ? row.kind === 'inconsistency' : row.kind !== 'inconsistency'));
  const unresolved = relevant.filter(row => row.status !== 'resolved');
  const visible = relevant.filter(row => showResolved || row.status !== 'resolved');
  return <section className="story-beat-review" aria-label="Story impact and open threads">
    {!hideImpacts && <StoryBeatImpactButton node={node} onPatch={onPatch} />}
    <details className="story-planning-disclosure" open={initialOpen || undefined}><summary>{kindFilter === 'issues' ? 'Authoring issues' : 'Open threads'}{relevant.length ? <span className="dim">{unresolved.length} open · {relevant.length} total</span> : <span className="dim">Optional</span>}</summary>
      <div className="story-thread-add"><button type="button" className="btn small" onClick={() => { const id = 'thread-' + crypto.randomUUID(); patch({ threads: [...details.threads, { id, kind: kindFilter === 'issues' ? 'inconsistency' : 'story', title: '', status: 'open', notes: '', resolution: '' }] }); setRecent(id); }}>Add thread</button></div>
      {visible.map(row => <details className={`story-thread ${row.kind === 'inconsistency' ? 'story-issue' : ''}`} key={row.id} open={row.id === recent || undefined}>
        <summary><b>{row.title || 'New story thread'}</b><span>{row.status === 'resolved' ? 'Resolved' : row.status === 'revealed' ? 'Revealed' : 'Open'}</span></summary>
        <label className="cp-field">Title<input className="field-input" defaultValue={row.title} key={row.title} onBlur={event => { if (event.target.value !== row.title) changeThread(row.id, { title: event.target.value }); }} /></label>
        <label className="cp-field">Status<select className="field-input" value={row.status || 'open'} onChange={event => changeThread(row.id, { status: event.target.value })}><option value="open">Open</option><option value="revealed">Revealed to players</option><option value="resolved">Resolved</option></select></label>
        <CharacterText label="What remains unanswered, or needs attention?" value={row.notes || ''} rows={3} onCommit={notes => changeThread(row.id, { notes })} />
        <CharacterText label="Resolution / payoff · optional" value={row.resolution || ''} rows={3} onCommit={resolution => changeThread(row.id, { resolution })} />
        <button type="button" className="linkbtn danger" onClick={() => patch({ threads: details.threads.filter(other => other.id !== row.id) })}>Remove thread</button>
      </details>)}
    </details>
  </section>;
}
