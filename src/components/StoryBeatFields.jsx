import React, { useMemo, useState } from 'react';
import { STORY_BEAT_SECTIONS, storyBeatDetails, storyBeatPatch, storyBeatSectionPatch, storyBeatMechanicKey, storyBeatMechanics } from '../lib/storyBeat.js';
import { ConversationBrowserDialog } from './Conversations.jsx';
import { StoryBeatReviewFields } from './StoryPlanningFields.jsx';
import './StoryBeatFields.css';
import StoryBeatDialog from './StoryBeatDialog.jsx';
import StoryBeatWorkshopLaunchers from './StoryBeatWorkshop.jsx';

export function StoryBeatIdentityFields({ node, onPatch, Field, children }) {
  return <section className="story-beat-identity" aria-label="Story Beat identity">
    <Field label="Title" value={node.title || ''} onCommit={title => onPatch({ title })} />
    <Field label="Description" textarea value={node.body || ''} onCommit={body => onPatch({ body })} />
    <div className="story-beat-image">{children}</div>
  </section>;
}

export function StoryBeatMechanicLink({ reference, live, onOpen, onUnlink }) {
  return <div className="story-beat-link">
    {live && onOpen ? <button type="button" className="linkbtn story-beat-mechanic-open" title="Open linked mechanic" aria-label={`Open mechanic ${live.title}`} onClick={() => onOpen(reference)}>{live.title} ↗</button> : <span>{live?.title || reference.title || reference.nodeId}{!live && ' (missing)'}</span>}
    <button type="button" className="linkbtn danger" aria-label={`Unlink mechanic ${live?.title || reference.title || reference.nodeId}`} onClick={onUnlink}>×</button>
  </div>;
}

export default function StoryBeatFields({ node, onPatch, Field, game, scope, MechanicWindow }) {
  const details = storyBeatDetails(node);
  const [conversationId, setConversationId] = useState(null);
  const [mechanicRef, setMechanicRef] = useState(null);
  const [sectionId, setSectionId] = useState(null);
  const mechanics = useMemo(() => storyBeatMechanics(game), [game?.taskNodes, game?.masterNodes, game?.nodes]);
  const patch = values => onPatch(storyBeatPatch(node, values));
  const hidden = STORY_BEAT_SECTIONS.filter(section => !details.sections.includes(section.id));
  return <section className="story-beat-fields" aria-label="Story Beat sections">
    <StoryBeatWorkshopLaunchers node={node} onPatch={onPatch} game={game} scope={scope} />
    <details className="sbw-extra"><summary>Additional details & links</summary>
    <StoryBeatReviewFields node={node} onPatch={onPatch} />
    <div className="isect">
      <label className="lab" htmlFor={`beat-section-${node.id}`}>Add section</label>
      <select id={`beat-section-${node.id}`} className="field-input" value="" disabled={!hidden.length} onChange={event => { if (event.target.value) { onPatch(storyBeatSectionPatch(node, event.target.value, true)); setSectionId(event.target.value); } }}>
        <option value="">{hidden.length ? '+ Choose a section…' : 'All sections are shown'}</option>
        {hidden.map(section => <option key={section.id} value={section.id}>{section.label}</option>)}
      </select>
      {!details.sections.length && <p className="hint">The title and description can be the entire beat. Add details here when you need them.</p>}
    </div>
    <div className="story-beat-section-list">{STORY_BEAT_SECTIONS.filter(section => details.sections.includes(section.id)).map(section => <button type="button" className="btn story-beat-section-launch" aria-haspopup="dialog" key={section.id} onClick={() => setSectionId(section.id)}><span>{section.label}</span><span aria-hidden="true">↗</span></button>)}</div>
    </details>
    {STORY_BEAT_SECTIONS.filter(section => details.sections.includes(section.id) && section.id === sectionId).map(section => <StoryBeatDialog key={section.id} title={section.label} subtitle={node.title || 'Story Beat'} onClose={() => setSectionId(null)}>
      {section.fields.map(([key, label]) => <Field key={key} label={label} textarea value={details[key] || ''} onCommit={value => patch({ [key]: value })} />)}
      {section.id === 'dialogue' && (game ? <>
        <label className="lab">Link an existing conversation
          <select className="field-input" value="" onChange={event => { if (event.target.value) patch({ conversationIds: [...details.conversationIds, event.target.value] }); }}>
            <option value="">Choose a conversation…</option>
            {Object.values(game.conversations || {}).filter(conversation => !details.conversationIds.includes(conversation.id)).map(conversation => <option key={conversation.id} value={conversation.id}>{conversation.title}</option>)}
          </select>
        </label>
        {!Object.keys(game.conversations || {}).length && <p className="hint">You can write the readout above, or create a shared script through Narrative → Conversations and link it here.</p>}
        {details.conversationIds.map(id => <div className="story-beat-link" key={id}>
          <span>{game.conversations?.[id]?.title || `Missing conversation · ${id}`}</span>
          {game.conversations?.[id] && <button className="linkbtn" onClick={() => setConversationId(id)}>Open</button>}
          <button className="linkbtn danger" aria-label={`Unlink conversation ${game.conversations?.[id]?.title || id}`} onClick={() => patch({ conversationIds: details.conversationIds.filter(other => other !== id) })}>×</button>
        </div>)}
      </> : <p className="hint">Write the readout here. Shared conversation links can be assigned after adding this beat to a game.</p>)}
      {section.id === 'gameplay' && (game ? <>
        <label className="lab">Link an existing mechanic · optional
          <select className="field-input" value="" onChange={event => {
            const mechanic = mechanics.find(ref => storyBeatMechanicKey(ref) === event.target.value);
            if (mechanic) patch({ mechanicRefs: [...details.mechanicRefs, { coll: mechanic.coll, parentPath: mechanic.parentPath, nodeId: mechanic.nodeId, title: mechanic.title }] });
          }}>
            <option value="">Choose a mechanic…</option>
            {mechanics.filter(ref => !details.mechanicRefs.some(saved => storyBeatMechanicKey(saved) === storyBeatMechanicKey(ref))).map(ref => <option key={storyBeatMechanicKey(ref)} value={storyBeatMechanicKey(ref)}>{ref.coll === 'taskNodes' ? 'Mechanics' : 'Story'} / {ref.label}</option>)}
          </select>
        </label>
        {details.mechanicRefs.map(ref => {
          const key = storyBeatMechanicKey(ref), live = mechanics.find(record => storyBeatMechanicKey(record) === key);
          return <StoryBeatMechanicLink key={key} reference={ref} live={live} onOpen={MechanicWindow ? setMechanicRef : undefined} onUnlink={() => patch({ mechanicRefs: details.mechanicRefs.filter(saved => storyBeatMechanicKey(saved) !== key) })} />;
        })}
      </> : <p className="hint">Gameplay can be described here in full. Existing mechanics can also be linked when this beat is in a game.</p>)}
      <button type="button" className="linkbtn story-beat-hide-section" title="Hide this section; its writing is kept" onClick={() => { onPatch(storyBeatSectionPatch(node, section.id, false)); setSectionId(null); }}>Hide section</button>
    </StoryBeatDialog>)}
    {conversationId && <ConversationBrowserDialog initialConversationId={conversationId} onClose={() => setConversationId(null)} />}
    {mechanicRef && MechanicWindow && <MechanicWindow mechanicRef={mechanicRef} onClose={() => setMechanicRef(null)} />}
  </section>;
}
