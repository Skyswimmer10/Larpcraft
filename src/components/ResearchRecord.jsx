import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { newReferenceId, newReferencePanel, referencePanels, referenceStorageFits, moveReferenceRow } from '../lib/research.js';
import { ReferenceField, ReferenceFileButton, ReferenceFilePreview, ReferenceLink, ReferenceTable } from './ReferenceControls.jsx';

export function ReferenceDialog({ title, onClose, children, className = '' }) {
  const dialog = useRef(null), titleId = useId();
  const close = () => { document.activeElement?.blur?.(); onClose(); };
  useEffect(() => {
    const previous = document.activeElement, element = dialog.current;
    element.showModal();
    return () => { element.close(); previous?.focus?.(); };
  }, []);
  return createPortal(<dialog ref={dialog} className={`reference-dialog ${className}`} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); event.stopPropagation(); close(); }} onClick={event => event.stopPropagation()}>
    <header><h2 id={titleId}>{title}</h2><button type="button" className="btn" onClick={close}>Done</button></header><div className="reference-dialog-body">{children}</div>
  </dialog>, document.body);
}

export function ResearchRecordContents({ record, onPatch, storageState = {}, readOnly = false }) {
  const panels = referencePanels(record);
  const replace = next => onPatch({ panels: next });
  const change = (id, patch) => replace(panels.map(panel => panel.id === id ? { ...panel, ...patch } : panel));
  const addFiles = files => {
    if (!referenceStorageFits(storageState, files)) throw new Error('These files would make this save too large. Add external links or file references instead.');
    replace([...panels, ...files.map(file => ({ id: newReferenceId('PANEL'), type: file.type.startsWith('image/') ? 'image' : 'file', title: file.name, caption: '', file }))]);
  };
  return <article className="research-record" aria-label={`Research reference: ${record.title || 'Untitled'}`}>
    {readOnly ? <><h2>{record.title}</h2>{record.summary && <p className="reference-prose">{record.summary}</p>}{record.credit && <p>Credit: {record.credit}</p>}<ReferenceLink url={record.sourceUrl} /></> : <>
      <ReferenceField label="Reference title" value={record.title} onCommit={title => onPatch({ title })} />
      <ReferenceField label="Summary / notes" value={record.summary} multiline onCommit={summary => onPatch({ summary })} />
      <div className="reference-two-columns"><ReferenceField label="Source / author credit" value={record.credit} onCommit={credit => onPatch({ credit })} /><ReferenceField label="Source URL" value={record.sourceUrl} onCommit={sourceUrl => onPatch({ sourceUrl })} /></div>
      <ReferenceLink url={record.sourceUrl} />
      <div className="reference-actions reference-add-panels"><span>Add panel</span>{[['note', 'Text note'], ['link', 'Web / video link'], ['table', 'Table / stats']].map(([type, label]) => <button type="button" className="btn small" key={type} onClick={() => replace([...panels, newReferencePanel(type)])}>{label}</button>)}<ReferenceFileButton label="Images / PDF / files" onAdd={addFiles} /></div>
    </>}
    {!panels.length && <p className="hint">{readOnly ? 'No reference panels yet.' : 'Add text, links, files or a table. Images and small files travel with the library; videos stay linked.'}</p>}
    <div className="research-panels">{panels.map((panel, index) => <section className={`research-panel research-panel-${panel.type}`} key={panel.id} aria-label={`${panel.type} panel ${index + 1}`}>
      <header>{readOnly ? <h3>{panel.title || panel.type}</h3> : <><ReferenceField label="Panel title" value={panel.title || ''} onCommit={title => change(panel.id, { title })} /><div className="reference-actions"><button type="button" className="btn small" disabled={index === 0} aria-label={`Move panel ${index + 1} up`} onClick={() => replace(moveReferenceRow(panels, panel.id, -1))}>↑</button><button type="button" className="btn small" disabled={index === panels.length - 1} aria-label={`Move panel ${index + 1} down`} onClick={() => replace(moveReferenceRow(panels, panel.id, 1))}>↓</button><button type="button" className="btn small reference-remove" aria-label={`Delete panel ${index + 1}`} onClick={() => replace(panels.filter(row => row.id !== panel.id))}>Delete</button></div></>}</header>
      {panel.type === 'note' && (readOnly ? <p className="reference-prose">{panel.text}</p> : <ReferenceField label="Note text" value={panel.text} multiline onCommit={text => change(panel.id, { text })} />)}
      {panel.type === 'link' && <>{!readOnly && <><ReferenceField label="Web or video URL" value={panel.url} onCommit={url => change(panel.id, { url })} /><ReferenceField label="Link notes / timestamps" value={panel.text} multiline onCommit={text => change(panel.id, { text })} /></>}<ReferenceLink url={panel.url}>Open link</ReferenceLink>{readOnly && panel.text && <p className="reference-prose">{panel.text}</p>}</>}
      {['image', 'file'].includes(panel.type) && <><ReferenceFilePreview file={panel.file} />{readOnly ? panel.caption && <p>{panel.caption}</p> : <ReferenceField label="File caption / source notes" value={panel.caption} onCommit={caption => change(panel.id, { caption })} />}</>}
      {panel.type === 'table' && <ReferenceTable panel={panel} readOnly={readOnly} onChange={next => change(panel.id, next)} />}
    </section>)}</div>
  </article>;
}
