import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGame, useDispatch, useLibrary, useLibraryDispatch } from '../state/store.jsx';
import { conversationParticipant, conversationCharacters, conversationSpeakerProfile, conversationsForCharacter, createConversation, conversationLibraryRecord, conversationTemplatePatch, conversationFromLibrary } from '../lib/conversations.js';
import { participantIconFallback } from '../lib/conversationIcons.js';
import ConversationWorkbench from './ConversationWorkbench.jsx';
import { ConversationIcon } from './ConversationIcons.jsx';
import NarrativeLibraryBrowser from './NarrativeLibraryBrowser.jsx';
import './Conversations.css';

function ConversationCard({ conversation, project, characters, onOpen }) {
  const participants = (conversation.participants || []).map(row => ({ ...row, name: conversationParticipant(row, project, characters).name }));
  return <button type="button" className="conversation-card" title={[conversation.title, participants.map(row => row.name).join(' · '), conversation.context || conversation.summary].filter(Boolean).join('\n')} onClick={() => onOpen(conversation.id)}>
    <span className="conversation-card-visual"><ConversationIcon value={conversation.icon} fallback={{ symbol: 'users' }} label="Conversation icon" size={20} /><span className="conversation-card-cast">{participants.slice(0, 4).map(row => <ConversationIcon key={row.id} value={row.icon} fallback={participantIconFallback(conversationSpeakerProfile(row, characters), row.name)} label={row.name} size={20} />)}{participants.length > 4 && <span>+{participants.length - 4}</span>}</span></span>
    <span className="conversation-card-main"><b>{conversation.title || 'Untitled conversation'}</b><span className="conversation-card-names">{participants.map(row => row.name).join(' · ') || 'No participants yet'}</span>{(conversation.context || conversation.summary) && <span className="conversation-card-context">{conversation.context || conversation.summary}</span>}</span>
    <span className="conversation-card-footer"><span className={`conversation-status ${conversation.status === 'happened' ? 'happened' : 'planned'}`}>{conversation.status === 'happened' ? 'Happened in the story' : 'Planned script'}</span><small>{conversation.passages?.length || 0} passages</small></span>
  </button>;
}

export function ConversationList({ conversations, project, onOpen }) {
  const characters = conversationCharacters(project);
  return <div className="conversation-list">{conversations.map(conversation => <ConversationCard key={conversation.id} conversation={conversation} project={project} characters={characters} onOpen={onOpen} />)}</div>;
}

export default function ConversationBrowser({ characterRef, characterName, mode = 'game', initialConversationId }) {
  const project = useGame() || {}, dispatch = useDispatch(), library = useLibrary() || {}, libraryDispatch = useLibraryDispatch();
  const libraryMode = mode === 'library', templates = library.conversationTemplates || {};
  const [selected, setSelected] = useState(initialConversationId || null);
  const [gameCopyId, setGameCopyId] = useState(null), [notice, setNotice] = useState('');
  const conversations = libraryMode ? Object.values(templates).map(record => ({ ...record.template, id: record.id, title: record.name }))
    : characterRef ? conversationsForCharacter(project, characterRef) : Object.values(project.conversations || {});
  const browserProject = libraryMode ? {} : project, characters = conversationCharacters(browserProject);
  const open = id => { setSelected(id); setGameCopyId(null); setNotice(''); };
  const add = () => {
    const id = (libraryMode ? 'conversation-template-' : 'conversation-') + crypto.randomUUID();
    const participant = !libraryMode && characterRef ? { id: 'speaker-' + crypto.randomUUID(), name: characterName || 'Character', characterRef } : undefined;
    const conversation = createConversation(id, participant);
    if (libraryMode) libraryDispatch({ type: 'ADD_ENTITY', coll: 'conversationTemplates', entity: conversationLibraryRecord(conversation, {}, id) });
    else dispatch({ type: 'ADD_ENTITY', coll: 'conversations', entity: conversation });
    open(id);
  };
  const editingLibrary = libraryMode && !gameCopyId;
  const record = editingLibrary ? templates[selected] : null;
  const conversation = editingLibrary ? record && { ...record.template, id: record.id } : project.conversations?.[gameCopyId || selected];
  const closeEditor = () => { setSelected(null); setGameCopyId(null); setNotice(''); };
  const saveToLibrary = () => {
    const id = 'conversation-template-' + crypto.randomUUID();
    libraryDispatch({ type: 'ADD_ENTITY', coll: 'conversationTemplates', entity: conversationLibraryRecord(conversation, project, id) });
    setNotice('Saved an independent conversation template to Library → Story & Narrative → Created Content → Conversations.');
  };
  const useTemplate = () => {
    const copy = conversationFromLibrary(record, 'conversation-' + crypto.randomUUID());
    dispatch({ type: 'ADD_ENTITY', coll: 'conversations', entity: copy });
    setGameCopyId(copy.id);
    setNotice('Added a planned copy to this game. Link its speakers to the characters you want.');
  };
  return <section className="conversations-browser" aria-label={libraryMode ? 'Conversation library' : characterRef ? 'Character conversations' : 'Conversations'}>
    <NarrativeLibraryBrowser title={libraryMode ? 'Saved conversation templates' : characterRef ? `Conversations involving ${characterName}` : 'Game conversations'} subtitle="" hideHeader inline categoryPane categoryLabel="Conversation story status" categoryHeading="Story status" allCategoryLabel="All conversations" searchLabel="Search conversations" searchPlaceholder="Search titles, participants and scenes…"
      toolbarAction={<button type="button" className="btn primary" onClick={add}>{libraryMode ? 'New conversation template' : 'New conversation'}</button>}
      sections={[
        { id: 'planned', label: 'Planned scripts', icon: 'book' },
        { id: 'happened', label: 'Happened in the story', icon: 'clock' },
      ].map(section => ({ ...section, items: conversations.filter(row => (row.status === 'happened' ? 'happened' : 'planned') === section.id).map(row => ({ id: row.id, label: row.title, blurb: [row.context, row.summary, ...(row.participants || []).map(person => conversationParticipant(person, browserProject, characters).name)].filter(Boolean).join(' '), conversation: row })) }))}
      renderItem={item => <ConversationCard conversation={item.conversation} project={browserProject} characters={characters} onOpen={open} />}
      emptyMessages={{ search: 'No conversations match this search.', category: 'No conversations with this story status yet.' }}
      emptyMessage={libraryMode ? 'No saved conversations yet. Create a template to begin.' : 'No conversations yet. Create one to start writing.'} />
    {conversation && <ConversationEditor key={(editingLibrary ? 'library:' : 'game:') + conversation.id} conversation={conversation} project={editingLibrary ? {} : project} libraryMode={editingLibrary} notice={notice}
      onPatch={patch => editingLibrary ? libraryDispatch({ type: 'UPDATE_ENTITY', coll: 'conversationTemplates', id: selected, patch: conversationTemplatePatch(record, patch) }) : dispatch({ type: 'UPDATE_ENTITY', coll: 'conversations', id: conversation.id, patch })}
      onDelete={() => { (editingLibrary ? libraryDispatch : dispatch)({ type: 'DELETE_ENTITY', coll: editingLibrary ? 'conversationTemplates' : 'conversations', id: conversation.id }); closeEditor(); }}
      onSaveToLibrary={editingLibrary ? undefined : saveToLibrary} onUse={editingLibrary ? useTemplate : undefined} onClose={closeEditor} />}
  </section>;
}

export function ConversationBrowserDialog({ onClose, mode = 'game', initialConversationId }) {
  const ref = useRef(null), [ready, setReady] = useState(false);
  const close = () => { document.activeElement?.blur?.(); onClose(); };
  useEffect(() => {
    const dialog = ref.current, previous = document.activeElement;
    dialog.showModal(); setReady(true);
    return () => { dialog.close(); previous?.focus?.(); };
  }, []);
  return createPortal(<dialog ref={ref} className="conversation-editor conversation-browser-dialog" aria-label={mode === 'library' ? 'Saved conversations' : 'Narrative conversations'} onCancel={event => { event.preventDefault(); event.stopPropagation(); close(); }} onClick={event => event.stopPropagation()}>
    <header><h2>{mode === 'library' ? 'Conversation library' : 'Narrative · Conversations'}</h2><button type="button" className="btn" onClick={close}>Done</button></header>
    <div className="conversation-browser-body">{ready && <ConversationBrowser mode={mode} initialConversationId={initialConversationId} />}</div>
  </dialog>, document.body);
}

export { default as ConversationEditorContents } from './ConversationWorkbench.jsx';

export function ConversationEditor({ conversation, project, onPatch, onDelete, onClose, libraryMode = false, onSaveToLibrary, onUse, notice }) {
  const ref = useRef(null);
  const close = () => { document.activeElement?.blur?.(); onClose(); };
  useEffect(() => { const dialog = ref.current, previous = document.activeElement; dialog.showModal(); return () => { dialog.close(); previous?.focus?.(); }; }, []);
  return createPortal(<dialog ref={ref} className="conversation-editor" aria-label={conversation.title || 'Untitled conversation'} onCancel={event => { event.preventDefault(); event.stopPropagation(); close(); }} onClick={event => event.stopPropagation()}>
    <header><div className="cw-editor-identity"><label className="cw-title-field"><span className="cw-visually-hidden">Conversation title</span><input value={conversation.title || ''} placeholder="Untitled conversation" onChange={event => onPatch({ title: event.target.value })} /></label><div className="cw-editor-meta"><label><span className="cw-visually-hidden">Story status</span><select value={conversation.status || 'planned'} onChange={event => onPatch({ status: event.target.value })}><option value="planned">Planned script</option><option value="happened">Happened in the story</option></select></label><small>{libraryMode ? 'Conversation template · saved in the Library' : 'Shared conversation · saved in this game'}</small></div></div><div className="cp-actions">{onSaveToLibrary && <button type="button" className="btn" onClick={onSaveToLibrary}>Save conversation to library</button>}{onUse && <button type="button" className="btn" onClick={onUse}>Add copy to current game</button>}<button type="button" className="btn" onClick={onDelete}>{libraryMode ? 'Delete template' : 'Delete conversation'}</button><button type="button" className="btn primary" onClick={close}>Done</button></div></header>
    {notice && <p className="cw-editor-notice" role="status">{notice}</p>}
    <ConversationWorkbench conversation={conversation} project={project} onPatch={onPatch} libraryMode={libraryMode} />
  </dialog>, document.body);
}
