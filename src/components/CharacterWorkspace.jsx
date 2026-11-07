import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { characterExport, CHARACTER_DETAILS, characterSources, characterDescriptionReviews } from '../lib/characterProfile.js';
import { conversationsForCharacter } from '../lib/conversations.js';
import { characterFactsText } from '../lib/characterFacts.js';
import { groupProfileFactsText } from '../lib/groupFoundations.js';
import { groupExport } from '../lib/groupProfile.js';
import CharacterQuestions from './CharacterQuestions.jsx';
import CharacterText from './CharacterText.jsx';
import ConversationBrowser from './Conversations.jsx';
import DescriptionParagraphReview from './DescriptionParagraphReview.jsx';
import CharacterAttributes from './CharacterAttributes.jsx';
import CharacterMediaGallery from './CharacterMediaGallery.jsx';
import CharacterRelationships from './Relationships.jsx';
export { default as CharacterText } from './CharacterText.jsx';

export function downloadCharacterText(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = name.replace(/[^\p{L}\p{N}_.-]/gu, '_') + '.txt'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function CharacterWorkspaceContents({ node, graph, project = {}, characterRef, view, onView, onPatch, onProfilePatch, onDescription, onReviewDescription, onPassage, onResolve }) {
  const isGroup = node.kind === 'group', kind = isGroup ? 'Group' : 'Character';
  const factsText = isGroup ? groupProfileFactsText(node) : characterFactsText(node, graph);
  const profile = node.characterProfile || {};
  const sources = characterSources(node, graph);
  const [format, setFormat] = useState('full'), [includeQuestions, setIncludeQuestions] = useState(false), [status, setStatus] = useState('');
  const [conversationIds, setConversationIds] = useState([]);
  const availableConversations = !isGroup && characterRef ? conversationsForCharacter(project, characterRef) : [];
  const earlier = CHARACTER_DETAILS.filter(([key]) => key !== 'voice' && profile.details?.[key]?.trim());
  const source = sources.find(source => `passage:${source.key}` === view);
  const block = source && profile.blocks?.find(block => block.key === source.key);
  const exportText = isGroup ? groupExport(node, includeQuestions, format, graph) : characterExport(node, graph, format, { includeQuestions, conversations: availableConversations.filter(row => conversationIds.includes(row.id)), conversationProject: project });
  const profileView = view === 'profile' || view === 'export';
  const descriptionReviews = characterDescriptionReviews(node);
  const pendingBox = block => block?.pending !== undefined && <div className="cp-review"><b>Input changed — proposed revision</b><pre>{block.pending || 'This input no longer contributes text.'}</pre><div className="cp-actions"><button type="button" className="btn" onClick={() => onResolve(block.key, true)}>Use revision</button><button type="button" className="btn" onClick={() => onResolve(block.key, false)}>Keep my wording</button></div></div>;
  return <>
    <nav className="cp-workspace-tabs" aria-label={`${kind} writing views`}>{[['profile', `${kind} profile`], ...(!isGroup ? [['voice', 'Voice and dialogue']] : []), ['questions', 'Saved questions'], ['earlier', 'Earlier writing']].map(([key, label]) => <button type="button" className={`btn${view === key || key === 'profile' && profileView ? ' primary' : ''}`} key={key} onClick={() => onView(key)}>{label}</button>)}</nav>
    <main className="cp-workspace-body">
      {profileView && <>
        {format === 'full' ? <>
        {factsText && <pre className="cp-facts-summary">{factsText}</pre>}
        {!isGroup && characterRef && <CharacterRelationships node={node} scope={{ coll: characterRef.coll, parentPath: characterRef.parentPath }} onPatch={onPatch} />}
        <div className="character-extra-tools"><CharacterAttributes node={node} onPatch={onPatch} />{!isGroup && <CharacterMediaGallery node={node} onPatch={onPatch} />}</div>
        <p>Untouched paragraphs follow their answers. Your added paragraphs stay, and rewritten paragraphs are protected. Prose edits do not change saved answers.</p>
        <CharacterText label={`Combined ${kind.toLowerCase()} description`} value={node.description ?? node.body ?? ''} rows={20} onCommit={text => onDescription ? onDescription(text) : onProfilePatch({ manualDescription: text })} />
        {descriptionReviews.length > 0 && <section aria-label="Description updates to review"><h3>Review affected paragraphs</h3>{descriptionReviews.map(paragraph => <DescriptionParagraphReview key={paragraph.id} paragraph={paragraph} sourceLabel={sources.find(source => source.key === paragraph.sourceKey)?.sourceLabel || sources.find(source => source.key === paragraph.sourceKey)?.label || 'Earlier writing'} onResolve={onReviewDescription} />)}</section>}
        </> : <><p>{format === 'short' ? `Short introduction from the saved ${kind.toLowerCase()} profile.` : isGroup ? 'Story context from the saved group profile and inputs.' : 'Dialogue and story context from the saved profile, voice writing and notes.'} Choose Full {kind.toLowerCase()} profile below to edit the description.</p><textarea aria-label={`${kind} output`} className="field-input cp-export-text" rows={24} readOnly value={exportText} /></>}
        <section className="cp-profile-output" aria-label="Profile format and sharing">
          <div className="cp-export-toolbar"><label className="cp-field">Output format<select className="field-input" value={format} onChange={event => setFormat(event.target.value)}><option value="full">Full {kind.toLowerCase()} profile</option><option value="short">Short introduction</option><option value="ai">{isGroup ? 'AI story context' : 'AI dialogue and story context'}</option></select></label>{format === 'ai' && <label className="cp-check"><input type="checkbox" checked={includeQuestions} onChange={event => setIncludeQuestions(event.target.checked)} />Include original wizard questions and answers</label>}</div>
          {format === 'ai' && availableConversations.length > 0 && <fieldset className="cp-conversation-export"><legend>Include selected conversations</legend>{availableConversations.map(conversation => <label className="cp-check" key={conversation.id}><input type="checkbox" checked={conversationIds.includes(conversation.id)} onChange={event => setConversationIds(ids => event.target.checked ? [...ids, conversation.id] : ids.filter(id => id !== conversation.id))} />{conversation.title} · {conversation.status === 'happened' ? 'Happened in the story' : 'Planned script'}</label>)}</fieldset>}
          <div className="cp-actions"><button type="button" className="btn" onClick={async () => { try { await navigator.clipboard.writeText(exportText); setStatus(`Copied ${kind.toLowerCase()} text.`); } catch { setStatus('Select the text and copy it manually.'); } }}>Copy text</button><button type="button" className="btn" onClick={() => downloadCharacterText(`${node.title || kind}-${format}`, exportText)}>Download text</button></div>
          {format === 'ai' && <p>{isGroup ? 'Possible pressures and developments remain separate from established events.' : 'AI context includes any saved secrets and writing notes. Possible changes remain separate from established events.'}</p>}
        </section>
      </>}
      {source && <>
        <h3>{source.label}</h3><p className="cp-source-name">{source.sourceLabel || source.record?.sourceId || 'Concept input'}</p>
        <p>Editing this passage protects your wording. Use Edit wizard on its input card to change the underlying answers.</p>
        <CharacterText label={`${kind} passage`} value={block?.text ?? source.text} rows={18} onCommit={value => onPassage(source.key, value)} />
        {pendingBox(block)}
      </>}
      {!isGroup && view === 'voice' && <>
        <details className="cp-voice-notes" open><summary>Voice notes</summary><p>Vocabulary, delivery, example phrases and monologues. Shared conversations stay below.</p>
        <CharacterText label="Voice notes and performance" rows={24} value={profile.performanceText ?? profile.details?.voice ?? ''} onCommit={performanceText => onProfilePatch({ performanceText })} />
        <button type="button" className="btn" onClick={() => downloadCharacterText(`${node.title || 'Character'}-voice`, profile.performanceText ?? profile.details?.voice ?? '')}>Download voice text</button>
        </details>
        <ConversationBrowser characterRef={characterRef || { coll: 'nodes', parentPath: [], nodeId: node.id }} characterName={node.title || node.name || 'Character'} />
      </>}
      {view === 'questions' && <>
        <p>Answers update untouched description paragraphs. Your added writing stays, and rewritten paragraphs wait for your review. Editing the description does not rewrite these answers.</p>
        {descriptionReviews.length > 0 && <button type="button" className="btn" onClick={() => onView('profile')}>Review {descriptionReviews.length} description paragraph(s)</button>}
        <CharacterQuestions node={node} onPatch={onPatch} />
      </>}
      {view === 'earlier' && <>
        <p>Earlier notes and choices are retained here. Develop new personality and background work through your concepts and frameworks.</p>
        {earlier.map(([key, label]) => <CharacterText key={key} label={`Earlier note: ${label}`} value={profile.details[key]} rows={8} onCommit={value => onProfilePatch({ details: { ...profile.details, [key]: value } })} />)}
        {profile.baseline && <CharacterText label="Earlier authored description" value={profile.baseline} rows={12} onCommit={baseline => onProfilePatch({ baseline })} />}
        {(node.typeGroups || []).map(group => { const option = group.options?.find(option => option.id === group.selectedId); return option ? <p key={group.id}><b>Earlier {group.label}:</b> {option.label}</p> : null; })}
        {(profile.blocks || []).filter(block => !sources.some(source => source.key === block.key) && block.text !== block.generated).map(block => <section key={block.key}><CharacterText label="Protected earlier passage" value={block.text} rows={10} onCommit={value => onPassage(block.key, value)} />{pendingBox(block)}</section>)}
        {!earlier.length && !profile.baseline && !(profile.blocks || []).some(block => block.text !== block.generated) && <p>No earlier writing to review.</p>}
      </>}
      {status && <p role="status">{status}</p>}
    </main>
  </>;
}

export default function CharacterWorkspace({ node, graph, initialView = 'profile', onClose, ...callbacks }) {
  const kind = node.kind === 'group' ? 'Group' : 'Character';
  const ref = useRef(null), [view, setView] = useState(initialView);
  const close = () => { document.activeElement?.blur?.(); onClose(); };
  useEffect(() => {
    const previous = document.activeElement, dialog = ref.current;
    dialog.showModal();
    return () => { dialog.close(); previous?.focus?.(); };
  }, []);
  return createPortal(<dialog ref={ref} className="character-workspace" aria-labelledby="character-workspace-title" onCancel={event => { event.preventDefault(); event.stopPropagation(); close(); }}><header><div><small>{kind} writing</small><h2 id="character-workspace-title">{node.title || node.name || kind}</h2></div><button type="button" className="btn" onClick={close}>Done</button></header><CharacterWorkspaceContents node={node} graph={graph} view={view} onView={setView} {...callbacks} /></dialog>, document.body);
}
