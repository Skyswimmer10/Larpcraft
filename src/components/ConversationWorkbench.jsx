import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ConversationIcon, ConversationIconButton, ConversationIconPicker } from './ConversationIcons.jsx';
import { participantIconFallback, resolveConversationIcon } from '../lib/conversationIcons.js';
import { characterFactsText } from '../lib/characterFacts.js';
import { conversationScreenplay, downloadConversationFile, exportConversationPdf } from '../lib/conversationExport.js';
import ConversationParticipantPicker from './ConversationParticipantPicker.jsx';
import ConversationPortraitPreview from './ConversationPortraitPreview.jsx';
import { PrimIcon } from './bits.jsx';
import { conversationPaneLayout } from '../lib/conversationLayout.js';
import { CONVERSATION_GOALS, CONVERSATION_SPEAKER_COLORS, addConversationParticipant, removeConversationParticipant, characterReferenceKey, conversationCharacters, conversationCharacterGraph, conversationParticipant, conversationDialogueName, conversationSpeakerProfile, conversationLocations, conversationText } from '../lib/conversations.js';

function Portrait({ profile, name, icon, small = false, size = 36 }) {
  return <ConversationIcon value={icon} fallback={participantIconFallback(profile, name)} label={`Portrait of ${name}`} size={small ? 33 : size} className={`cw-avatar${small ? ' tiny' : ''}`} />;
}

function RibbonIcon({ kind }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{kind === 'add' ? <path d="M4 4h16v12H9l-5 4V4ZM8 10h8m-4-4v8" /> : kind === 'stage' ? <path d="M3 4h18v16H3V4ZM3 9h18M6 4l4 5m3-5 4 5" /> : kind === 'edit' ? <path d="m4 16 11-11 4 4L8 20H4v-4ZM13 7l4 4" /> : <path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7" />}</svg>;
}

export default function ConversationWorkbench({ conversation, project, onPatch, libraryMode = false }) {
  const characters = useMemo(() => libraryMode ? [] : conversationCharacters(project), [project, libraryMode]);
  const locations = useMemo(() => libraryMode ? [] : conversationLocations(project), [project, libraryMode]);
  const latest = useRef(conversation); latest.current = conversation;
  const patch = changes => { latest.current = { ...latest.current, ...changes }; onPatch(changes); };
  const participants = conversation.participants || [], passages = conversation.passages || [];
  const [selectedId, setSelectedId] = useState(passages[0]?.id || null);
  const [speakerId, setSpeakerId] = useState(participants[0]?.id || 'narration');
  const [draft, setDraft] = useState(''), [copyStatus, setCopyStatus] = useState('');
  const [showAdd, setShowAdd] = useState(!participants.length);
  const [iconTarget, setIconTarget] = useState(null);
  const [preview, setPreview] = useState(null), [speakerSetting, setSpeakerSetting] = useState(null);
  const previewTimer = useRef(null);
  const keepPreview = () => clearTimeout(previewTimer.current);
  const leavePreview = () => { keepPreview(); previewTimer.current = setTimeout(() => setPreview(current => current?.pinned ? current : null), 180); };
  const showPreview = (event, participantId, lineId, pin = false) => {
    keepPreview();
    const anchor = event.currentTarget;
    setPreview(current => {
      if (!pin && current?.pinned) return current;
      return { participantId, lineId, anchor, pinned: pin && !(current?.pinned && current.anchor === anchor) };
    });
  };
  const closePreview = () => { keepPreview(); setPreview(null); };
  useEffect(() => () => clearTimeout(previewTimer.current), []);
  const scroller = useRef(null), composer = useRef(null), center = useRef(null), exportMenu = useRef(null);
  const [exporting, setExporting] = useState(false);
  const exportFile = async format => {
    exportMenu.current.open = false; setExporting(true); setCopyStatus('');
    try {
      if (format === 'pdf') { const pages = await exportConversationPdf(center.current, latest.current); setCopyStatus(`Exported full conversation as PDF (${pages} page${pages === 1 ? '' : 's'}).`); }
      else { downloadConversationFile(latest.current.title + (format === 'screenplay' ? '-screenplay' : '-notes'), format === 'screenplay' ? conversationScreenplay(latest.current, project) : conversationText(latest.current, project)); setCopyStatus('Exported ' + (format === 'screenplay' ? 'screenplay text.' : 'conversation notes.')); }
    } catch (error) { setCopyStatus('Export failed: ' + (error.message || 'Please try again.')); }
    finally { setExporting(false); }
  };
  const workbench = useRef(null), sidebar = useRef(null), inspector = useRef(null), drag = useRef(null), sidebarId = useId(), inspectorId = useId();
  const [preferredSidebar, setPreferredSidebar] = useState(220), [preferredInspector, setPreferredInspector] = useState(null), [paneWidth, setPaneWidth] = useState(1000), [defaultInspector, setDefaultInspector] = useState(354), [resizing, setResizing] = useState(false);
  const panes = conversationPaneLayout(paneWidth, preferredSidebar, preferredInspector ?? defaultInspector);
  const sidebarWidth = panes.left, sidebarMax = panes.leftMax, inspectorWidth = panes.right, inspectorMax = panes.rightMax;
  useEffect(() => {
    const element = workbench.current;
    const measure = () => {
      if (!element.clientWidth) return;
      setPaneWidth(element.clientWidth);
      setDefaultInspector(Number.parseFloat(getComputedStyle(element).getPropertyValue('--cw-inspector-default')) || 354);
    };
    measure();
    const observer = new ResizeObserver(measure); observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const resizeSidebar = width => setPreferredSidebar(Math.max(180, Math.min(sidebarMax, width)));
  const resizeInspector = width => setPreferredInspector(Math.max(260, Math.min(inspectorMax, width)));
  const finishResize = event => {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null; setResizing(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const selected = passages.find(row => row.id === selectedId);
  const activeId = selected ? selected.speakerId : speakerId;
  const active = participants.find(row => row.id === activeId);
  const person = row => conversationParticipant(row, project, characters);
  const profile = row => conversationSpeakerProfile(row, characters);
  const activePerson = active && person(active), activeProfile = profile(active);
  const activeCharacter = active && characters.find(row => row.key === characterReferenceKey(active.characterRef));
  const previewParticipant = preview && participants.find(row => row.id === preview.participantId);
  const visiblePreview = previewParticipant && passages.some(row => row.id === preview.lineId && row.speakerId === preview.participantId) && resolveConversationIcon(previewParticipant.icon, participantIconFallback(profile(previewParticipant), person(previewParticipant).name));
  const location = locations.find(row => characterReferenceKey(row.ref) === characterReferenceKey(conversation.location?.ref)) || conversation.location || {};
  const patchParticipant = (id, changes) => patch({ participants: latest.current.participants.map(row => row.id === id ? { ...row, ...changes } : row) });
  const patchLine = changes => patch({ passages: latest.current.passages.map(row => row.id === selected.id ? { ...row, ...changes } : row) });
  const addParticipant = participant => {
    const next = addConversationParticipant(latest.current, participant);
    if (next === latest.current) return false;
    patch({ participants: next.participants }); setSpeakerId(participant.id); setSelectedId(null); setShowAdd(false);
    return true;
  };
  const addLine = (speaker, text = '') => {
    const line = { id: 'passage-' + crypto.randomUUID(), speakerId: speaker, text };
    patch({ passages: [...latest.current.passages, line] }); setSelectedId(line.id);
    requestAnimationFrame(() => scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' }));
  };
  const move = offset => {
    const next = [...latest.current.passages], index = next.findIndex(row => row.id === selected.id);
    if (index + offset < 0 || index + offset >= next.length) return;
    [next[index], next[index + offset]] = [next[index + offset], next[index]]; patch({ passages: next });
  };
  const removeLine = () => { closePreview(); patch({ passages: latest.current.passages.filter(row => row.id !== selected.id) }); setSelectedId(null); };
  const toggleSetting = setting => setSpeakerSetting(current => current === setting ? null : setting);
  const passageActions = selected && <>
    <button type="button" className="cw-tool" aria-label={`Move passage ${passages.indexOf(selected) + 1} up`} title="Move passage up" disabled={passages.indexOf(selected) === 0} onClick={() => move(-1)}>↑</button>
    <button type="button" className="cw-tool" aria-label={`Move passage ${passages.indexOf(selected) + 1} down`} title="Move passage down" disabled={passages.indexOf(selected) === passages.length - 1} onClick={() => move(1)}>↓</button>
    <button type="button" className="cw-tool" aria-label="Add passage" title="Add passage" onClick={() => addLine(speakerId)}><RibbonIcon kind="add" /></button>
    <button type="button" className="cw-tool" aria-label="Add stage directions" title="Add stage directions" onClick={() => addLine('narration')}><RibbonIcon kind="stage" /></button>
    <button type="button" className="cw-tool cw-tool-danger" aria-label="Remove passage" title="Remove passage" onClick={removeLine}><RibbonIcon kind="trash" /></button>
  </>;
  const submit = event => { event.preventDefault(); if (draft.trim()) { addLine(speakerId, draft.trim()); setDraft(''); composer.current?.focus(); } };
  const targetParticipant = participants.find(row => row.id === iconTarget?.participantId);
  const targetGoal = CONVERSATION_GOALS.find(row => row.id === iconTarget?.goalId);
  const iconSettings = !iconTarget ? null : iconTarget.type === 'conversation'
    ? { label: 'Conversation', value: conversation.icon, fallback: { symbol: 'users' }, save: icon => patch({ icon }) }
    : !targetParticipant ? null : targetGoal
      ? { label: `${person(targetParticipant).name}: ${targetParticipant.goalLabels?.[targetGoal.id] || targetGoal.label}`, value: targetParticipant.goalIcons?.[targetGoal.id], fallback: { symbol: targetGoal.icon }, save: icon => patchParticipant(targetParticipant.id, { goalIcons: { ...targetParticipant.goalIcons, [targetGoal.id]: icon } }) }
      : { label: person(targetParticipant).name, value: targetParticipant.icon, fallback: participantIconFallback(profile(targetParticipant), person(targetParticipant).name), save: icon => patchParticipant(targetParticipant.id, { icon }) };
  return <div ref={workbench} className={`conversation-editor-body cw-workbench${resizing ? ' cw-resizing' : ''}`} style={{ '--cw-sidebar-width': `${sidebarWidth}px`, '--cw-inspector-width': `${inspectorWidth}px` }}>
    <aside ref={sidebar} id={sidebarId} className="cw-sidebar" aria-label="Conversation characters and author goals">
      <div className="cw-section-heading"><h3>Participants</h3><button type="button" className="btn small" aria-expanded={showAdd} onClick={() => setShowAdd(value => !value)}>+ Add</button></div>
      <div className="cw-roster">{participants.map((row, index) => <button type="button" className="cw-speaker" key={row.id} aria-pressed={activeId === row.id} onClick={() => { setSelectedId(null); setSpeakerId(row.id); }}><Portrait size={48} icon={row.icon} profile={profile(row)} name={person(row).name} /><span><b>{person(row).name}</b><small>{row.side || (index % 2 ? 'Right' : 'Left')}{person(row).missing ? ' · profile missing' : ''}</small></span></button>)}</div>
      {showAdd && <section className="cw-add-speaker" aria-label="Add participants"><ConversationParticipantPicker characters={characters} participants={participants} onAdd={addParticipant} libraryMode={libraryMode} /></section>}
      <section className="cw-author"><h3>Story relevance & author goals</h3><label className="cw-field">What should this exchange reveal or change?<textarea className="field-input" rows={4} value={conversation.authorGoals || ''} placeholder="Reveal a partial truth, test a loyalty…" onChange={e => patch({ authorGoals: e.target.value })} /></label></section>
      <section className="cw-location"><h3>Location</h3>{location.image && <img src={location.image} alt={location.name || 'Scene location'} />}
        {!libraryMode && <label className="cw-field">Use a game location<select className="field-input" value={locations.find(row => characterReferenceKey(row.ref) === characterReferenceKey(conversation.location?.ref))?.key || ''} onChange={e => { const row = locations.find(item => item.key === e.target.value); patch({ location: row ? { ...row } : { ...location, ref: undefined } }); }}><option value="">Custom / saved location</option>{locations.map(row => <option key={row.key} value={row.key}>{row.name}</option>)}</select></label>}
        <label className="cw-field">Location name<input className="field-input" value={location.name || ''} readOnly={!!locations.find(row => characterReferenceKey(row.ref) === characterReferenceKey(conversation.location?.ref))} onChange={e => patch({ location: { ...location, name: e.target.value } })} /></label>
        <label className="cw-field">Location description<textarea className="field-input" rows={3} value={conversation.locationNotes ?? location.description ?? ''} onChange={e => patch({ locationNotes: e.target.value })} /></label>
      </section>
    </aside>
    <div className="cw-sidebar-resizer" role="separator" aria-label="Resize conversation character pane" aria-orientation="vertical" aria-controls={sidebarId} aria-valuemin={180} aria-valuemax={sidebarMax} aria-valuenow={Math.round(sidebarWidth)} tabIndex={0} title="Drag left or right to resize. Double-click to reset."
      onPointerDown={event => { if (event.button !== 0) return; event.preventDefault(); event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId); drag.current = { pointerId: event.pointerId, x: event.clientX, width: sidebar.current.getBoundingClientRect().width }; setResizing(true); }}
      onPointerMove={event => { if (drag.current?.pointerId === event.pointerId) resizeSidebar(drag.current.width + event.clientX - drag.current.x); }}
      onPointerUp={finishResize} onPointerCancel={finishResize} onLostPointerCapture={finishResize}
      onDoubleClick={() => resizeSidebar(220)}
      onKeyDown={event => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); resizeSidebar(event.key === 'Home' ? 180 : event.key === 'End' ? sidebarMax : sidebarWidth + (event.key === 'ArrowRight' ? 1 : -1) * (event.shiftKey ? 5 : 20)); }}><span aria-hidden="true" /></div>
    <main ref={center} className="cw-center" aria-label="Dialogue and stage directions" onKeyDown={event => { if (event.key === 'Escape' && visiblePreview) { event.preventDefault(); event.stopPropagation(); closePreview(); preview.anchor?.closest('.cw-message-content')?.querySelector('.cw-message')?.focus(); } }}>
      <label className="cw-scene"><span>SCENE</span><input className="field-input" aria-label="Scene / story context" value={conversation.context || ''} placeholder="Where is this happening? What is happening now?" onChange={e => patch({ context: e.target.value })} /></label>
      <div className="cw-conversation-heading"><ConversationIconButton value={conversation.icon} fallback={{ symbol: 'users' }} label="Conversation" size={22} onClick={() => setIconTarget({ type: 'conversation' })} /><h3>Conversation <small>{passages.length} lines</small></h3><button type="button" className="btn small" onClick={async () => { try { await navigator.clipboard.writeText(conversationText(latest.current, project)); setCopyStatus('Copied conversation.'); } catch { setCopyStatus('Clipboard unavailable. Use Export.'); } }}>Copy conversation</button><details className="cw-export-menu" ref={exportMenu} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); exportMenu.current.open = false; exportMenu.current.querySelector('summary').focus(); } }}><summary className="btn small" aria-label="Export conversation">{exporting ? 'Exporting…' : 'Export ▾'}</summary><div className="cw-export-options"><button type="button" className="btn small" disabled={exporting} onClick={() => exportFile('pdf')}>Visual PDF · portraits & bubbles</button><button type="button" className="btn small" disabled={exporting} onClick={() => exportFile('screenplay')}>Screenplay · text (.txt)</button><button type="button" className="btn small" disabled={exporting} onClick={() => exportFile('notes')}>Conversation notes · text (.txt)</button></div></details></div>
      {copyStatus && <small role="status" className="cw-copy-status">{copyStatus}</small>}
      <div className="cw-messages" ref={scroller} aria-label="Conversation lines" onScroll={() => setPreview(current => current?.pinned ? current : null)}>{!passages.length && <p className="cw-empty">Add characters, then write the first line below. Select any line to edit it in the inspector.</p>}{passages.map((line, index) => {
        const row = participants.find(row => row.id === line.speakerId), narration = line.speakerId === 'narration', name = row ? conversationDialogueName(person(row)) : narration ? 'Stage directions' : 'Unknown speaker';
        const originalSide = row?.side || (participants.indexOf(row) % 2 ? 'right' : 'left');
        const centered = line.position === 'center';
        const side = narration ? 'narration' : centered ? 'center' : originalSide;
        const colors = CONVERSATION_SPEAKER_COLORS[Math.max(0, participants.indexOf(row)) % CONVERSATION_SPEAKER_COLORS.length];
        const arrowLeft = centered ? originalSide === 'left' : originalSide === 'right';
        const hasPortrait = !narration && resolveConversationIcon(row?.icon, participantIconFallback(profile(row), row ? person(row).name : name));
        return <div className={`cw-message-row ${side}`} key={line.id}><div className="cw-message-group">
          <div className="cw-message-content">
          {hasPortrait && <button type="button" className="cw-portrait-trigger" aria-label={`Preview ${row ? person(row).name : name} portrait`} aria-expanded={!!visiblePreview && preview.anchor?.dataset.lineId === line.id} data-line-id={line.id} onMouseEnter={event => showPreview(event, row?.id, line.id)} onMouseLeave={leavePreview} onFocus={event => showPreview(event, row?.id, line.id)} onBlur={leavePreview} onClick={event => showPreview(event, row?.id, line.id, true)}><Portrait small icon={row?.icon} profile={profile(row)} name={row ? person(row).name : name} /></button>}
          <button type="button" className="cw-message" style={narration ? undefined : { '--speaker-from': colors.from, '--speaker-to': colors.to, '--speaker-edge': colors.edge, '--speaker-label': colors.label }} aria-label={`Edit line ${index + 1}: ${name}`} aria-pressed={selected?.id === line.id} onClick={() => { setSelectedId(line.id); setSpeakerId(row?.id || 'narration'); }}>
            <span className="cw-bubble"><span className="cw-message-meta">{name}<span>{String(index + 1).padStart(2, '0')}</span></span><span className="cw-message-text">{line.text || 'Empty line — select to write'}</span>{!narration && line.tags?.trim() && <span className="cw-message-tags">{line.tags.trim()}</span>}</span>
          </button>
          </div>
          {!narration && <button type="button" className={`cw-center-toggle${arrowLeft ? ' points-left' : ''}`} aria-label={centered ? `Restore line ${index + 1} to ${originalSide}` : `Center line ${index + 1}`} aria-pressed={centered} title={centered ? 'Restore speaker’s side' : 'Center this message'} onClick={() => patch({ passages: latest.current.passages.map(row => row.id === line.id ? { ...row, position: row.position === 'center' ? undefined : 'center' } : row) })}><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M3 12h14m-5-5 5 5-5 5M21 5v14" /></svg></button>}
          {selected?.id === line.id && <div className="cw-message-tools" role="toolbar" aria-label={`Actions for line ${index + 1}`}>{passageActions}</div>}
        </div></div>;

      })}</div>
      <form className="cw-composer" onSubmit={submit}><label className="cw-field">Write as<select className="field-input" value={speakerId} onChange={e => setSpeakerId(e.target.value)}><option value="narration">Narration / stage directions</option>{participants.map(row => <option key={row.id} value={row.id}>{person(row).name}</option>)}</select></label><textarea ref={composer} className="field-input" rows={2} aria-label="New dialogue line" placeholder="Write a new line… (Ctrl+Enter to add)" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(e); }} /><button type="submit" className="btn primary" disabled={!draft.trim()}>Add line</button></form>
      <footer className="cw-summary"><label className="cw-field">Conversation summary<textarea className="field-input" rows={2} value={conversation.summary || ''} placeholder="Summarize the exchange and what changes." onChange={e => patch({ summary: e.target.value })} /></label></footer>
      {visiblePreview && <ConversationPortraitPreview preview={preview} participant={previewParticipant} person={person(previewParticipant)} profile={profile(previewParticipant)} container={center} boundary={scroller} onEnter={keepPreview} onLeave={leavePreview} onPin={() => { keepPreview(); setPreview(current => ({ ...current, pinned: !current.pinned })); }} onClose={() => { closePreview(); preview.anchor?.closest('.cw-message-content')?.querySelector('.cw-message')?.focus(); }} />}
    </main>
    <div className="cw-sidebar-resizer cw-inspector-resizer" role="separator" aria-label="Resize conversation inspector" aria-orientation="vertical" aria-controls={inspectorId} aria-valuemin={260} aria-valuemax={inspectorMax} aria-valuenow={Math.round(inspectorWidth)} tabIndex={0} title="Drag left or right to resize. Double-click to reset."
      onPointerDown={event => { if (event.button !== 0) return; event.preventDefault(); event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId); drag.current = { pointerId: event.pointerId, x: event.clientX, width: inspector.current.getBoundingClientRect().width }; setResizing(true); }}
      onPointerMove={event => { if (drag.current?.pointerId === event.pointerId) resizeInspector(drag.current.width + drag.current.x - event.clientX); }}
      onPointerUp={finishResize} onPointerCancel={finishResize} onLostPointerCapture={finishResize}
      onDoubleClick={() => setPreferredInspector(null)}
      onKeyDown={event => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); resizeInspector(event.key === 'Home' ? 260 : event.key === 'End' ? inspectorMax : inspectorWidth + (event.key === 'ArrowLeft' ? 1 : -1) * (event.shiftKey ? 5 : 20)); }}><span aria-hidden="true" /></div>
    <aside ref={inspector} id={inspectorId} className="cw-inspector" aria-label="Selected line and character inspector">
      <h3>Inspector</h3>
      {active && <><div className="cw-person-heading"><b>{activePerson.name}</b><ConversationIconButton value={active.icon} fallback={participantIconFallback(activeProfile, activePerson.name)} label={activePerson.name} size={104} onClick={() => setIconTarget({ type: 'participant', participantId: active.id })} /></div><h3>Goals in this conversation</h3>
        <div className="cw-goals">{CONVERSATION_GOALS.map(goal => <div className="cw-goal" key={goal.id} style={{ '--goal-color': goal.color }}><ConversationIconButton className="cw-goal-icon" size={19} value={active.goalIcons?.[goal.id]} fallback={{ symbol: goal.icon }} label={`${activePerson.name}: ${active.goalLabels?.[goal.id] || goal.label}`} onClick={() => setIconTarget({ type: 'goal', participantId: active.id, goalId: goal.id })} /><input className="cw-goal-title" aria-label={`${activePerson.name}: ${goal.label} goal heading`} value={active.goalLabels?.[goal.id] ?? goal.label} onChange={e => patchParticipant(active.id, { goalLabels: { ...active.goalLabels, [goal.id]: e.target.value } })} /><textarea className="field-input" aria-label={`${activePerson.name}: ${goal.label} goal`} rows={2} placeholder="Optional goal…" value={active.goals?.[goal.id] || ''} onChange={e => patchParticipant(active.id, { goals: { ...active.goals, [goal.id]: e.target.value } })} /></div>)}</div>
        <section className="cw-profile-context"><h3>Profile traits</h3><div className="cw-tags">{activeProfile.traits?.length ? activeProfile.traits.map(trait => <span key={trait}>{trait}</span>) : <small>No traits recorded.</small>}</div><h3>Bio snippet</h3><p className="cw-bio">{activeProfile.bio || 'No description recorded.'}</p></section>
      </>}
      <section className="cw-line-editor"><h3>Line text editor</h3>{selected ? <>
        <label className="cw-field">Selected line<textarea className="field-input" rows={5} value={selected.text} onChange={e => patchLine({ text: e.target.value })} /></label>
        <label className="cw-field">Speaker<select className="field-input" value={selected.speakerId} onChange={e => { patchLine({ speakerId: e.target.value }); setSpeakerId(e.target.value); }}><option value="narration">Narration / stage directions</option>{participants.map(row => <option key={row.id} value={row.id}>{person(row).name}</option>)}</select></label>
        <label className="cw-field">Line tags<input className="field-input" value={selected.tags || ''} placeholder="Suspicion, deflection, history…" onChange={e => patchLine({ tags: e.target.value })} /></label>
      </> : <p>Select a message to edit its words, speaker and tags.</p>}</section>
      <section className="cw-speaker-controls" aria-label="Speaker settings and reference" key={activeId}>
        {active && <>
          <div className="cw-speaker-ribbon" role="group" aria-label={`${activePerson.name} speaker controls`}>
            <button type="button" className="cw-tool cw-alias-tool" aria-label="Edit name in dialogue" title={`Name in dialogue: ${conversationDialogueName(activePerson)}`} aria-expanded={speakerSetting === 'alias'} onClick={() => toggleSetting('alias')}><RibbonIcon kind="edit" /><span>{conversationDialogueName(activePerson)}</span></button>
            {!libraryMode && <button type="button" className="cw-tool" aria-label={`Link ${activePerson.name} to a character`} title="Link character profile" aria-expanded={speakerSetting === 'profile'} onClick={() => toggleSetting('profile')}><PrimIcon icon="link" /></button>}
            <button type="button" className="cw-tool" aria-label="Character and relationship reference" title="Character and relationship reference" aria-expanded={speakerSetting === 'reference'} onClick={() => toggleSetting('reference')}><PrimIcon icon="book" /></button>
            <button type="button" className="cw-tool cw-tool-danger" aria-label="Remove participant" title={passages.some(row => row.speakerId === active.id) ? 'Reassign or remove their passages first' : 'Remove participant'} disabled={passages.some(row => row.speakerId === active.id)} onClick={() => { closePreview(); patch({ participants: removeConversationParticipant(latest.current, active.id).participants }); setSelectedId(null); setSpeakerId('narration'); }}><PrimIcon icon="user" /><span className="cw-remove-mark" aria-hidden="true">−</span></button>
            <div className="cw-side-buttons" role="group" aria-label="Dialogue side">{['left', 'right'].map(side => <button type="button" key={side} className="cw-tool" title={`Place speaker on ${side}`} aria-label={`Place ${activePerson.name} on ${side}`} aria-pressed={(active.side || (participants.indexOf(active) % 2 ? 'right' : 'left')) === side} onClick={() => patchParticipant(active.id, { side })}>{side === 'left' ? '←' : '→'}</button>)}</div>
          </div>
          <div className="cw-ribbon-detail" hidden={speakerSetting !== 'alias'}><label className="cw-field">Name in dialogue<input className="field-input" value={active.sceneName || ''} placeholder={activePerson.name} title="Only changes this speaker’s name in the dialogue. Leave blank to use their participant name." onChange={e => patchParticipant(active.id, { sceneName: e.target.value })} /></label></div>
          {!libraryMode && <div className="cw-ribbon-detail" hidden={speakerSetting !== 'profile'}>{activePerson.missing && <p>Profile missing — saved name retained</p>}<label className="cw-field">Character profile<select className="field-input" aria-label="Character profile" value={activePerson.missing ? '' : characterReferenceKey(active.characterRef)} onChange={e => { const row = characters.find(item => item.key === e.target.value); patchParticipant(active.id, { characterRef: row?.ref, name: row?.name || activePerson.name, profileSnapshot: row ? profile({ characterRef: row.ref }) : activeProfile }); }}><option value="">Name only</option>{characters.map(row => <option key={row.key} value={row.key} disabled={participants.some(other => other.id !== active.id && characterReferenceKey(other.characterRef) === row.key)}>{row.name} · {row.location}</option>)}</select></label></div>}
          <div className="cw-ribbon-detail" hidden={speakerSetting !== 'reference'}><h3>Character and relationship reference</h3><pre>{activeCharacter ? characterFactsText(activeCharacter.node, conversationCharacterGraph(project, activeCharacter.ref)) || 'No brief details recorded.' : [activeProfile.traits?.join(' · '), activeProfile.bio].filter(Boolean).join('\n\n') || 'No character reference recorded.'}</pre></div>
        </>}
        {!selected && <div className="cw-idle-passage-tools"><button type="button" className="cw-tool" aria-label="Add passage" title="Add passage" onClick={() => addLine(speakerId)}><RibbonIcon kind="add" /></button><button type="button" className="cw-tool" aria-label="Add stage directions" title="Add stage directions" onClick={() => addLine('narration')}><RibbonIcon kind="stage" /></button></div>}
      </section>
    </aside>
    {iconSettings && <ConversationIconPicker key={JSON.stringify(iconTarget)} value={iconSettings.value} fallback={iconSettings.fallback} label={iconSettings.label} onChange={iconSettings.save} onClose={() => setIconTarget(null)} />}
  </div>;
}
