import React, { useState } from 'react';
import { useLibrary, useLibraryDispatch } from '../state/store.jsx';
import { characterMedia, newReferenceId, safeReferenceUrl, referenceStorageFits, moveReferenceRow } from '../lib/research.js';
import { ReferenceField, ReferenceFileButton, ReferenceFilePreview, ReferenceLink } from './ReferenceControls.jsx';
import { ReferenceDialog, ResearchRecordContents } from './ResearchRecord.jsx';

export function CharacterMediaContents({ node, onPatch, library = {}, onOpenResearch }) {
  const rows = characterMedia(node), ids = node.researchIds || [], editing = !!onPatch;
  const patch = next => onPatch({ mediaGallery: next });
  const change = (id, values) => patch(rows.map(row => row.id === id ? { ...row, ...values } : row));
  const [researchId, setResearchId] = useState('');
  const addImages = files => {
    if (!referenceStorageFits(node, files)) throw new Error('These images would make this character too large. Use smaller images.');
    patch([...rows, ...files.map(file => ({ id: newReferenceId('MEDIA'), type: 'image', title: file.name, caption: '', credit: '', file }))]);
  };
  return <section className="character-media-content" aria-label="Character media and references">
    {editing && <div className="reference-actions"><ReferenceFileButton label="Add images" imagesOnly onAdd={addImages} /><button type="button" className="btn small" onClick={() => patch([...rows, { id: newReferenceId('MEDIA'), type: 'video', title: '', url: '', caption: '', credit: '' }])}>Add video link</button><button type="button" className="btn small" onClick={() => patch([...rows, { id: newReferenceId('MEDIA'), type: 'external', title: '', path: '', caption: '', credit: '' }])}>Add file reference</button><span className="hint">Images embed · videos stay linked</span></div>}
    {!rows.length && <p className="hint">No gallery media yet. The character portrait remains its main image.</p>}
    <div className="character-media-grid">{rows.map((row, index) => <article className="character-media-card" key={row.id} aria-label={`Media ${index + 1}`}>
      {row.type === 'image' && <ReferenceFilePreview file={row.file} />}
      {row.type === 'video' && <>{safeReferenceUrl(row.url) && /\.(mp4|webm|ogg)(?:[?#]|$)/i.test(safeReferenceUrl(row.url)) && <video controls preload="none" src={safeReferenceUrl(row.url)} aria-label={row.title || `Video ${index + 1}`} />}<ReferenceLink url={row.url}>Open video</ReferenceLink></>}
      {editing ? <>
        <ReferenceField label="Media title" value={row.title} onCommit={title => change(row.id, { title })} />
        {row.type === 'video' && <ReferenceField label="Video URL" value={row.url} placeholder="https://…" onCommit={url => change(row.id, { url })} />}
        {row.type === 'external' && <><ReferenceField label="External file path" value={row.path} onCommit={path => change(row.id, { path })} /><p className="hint">Path reference only. Open the file from its folder; it is not included in backups.</p></>}
        <ReferenceField label="Caption / timing notes" value={row.caption} multiline onCommit={caption => change(row.id, { caption })} />
        <ReferenceField label="Media source / credit" value={row.credit} onCommit={credit => change(row.id, { credit })} />
        <div className="reference-actions"><button type="button" className="btn small" disabled={index === 0} aria-label={`Move media ${index + 1} up`} onClick={() => patch(moveReferenceRow(rows, row.id, -1))}>↑</button><button type="button" className="btn small" disabled={index === rows.length - 1} aria-label={`Move media ${index + 1} down`} onClick={() => patch(moveReferenceRow(rows, row.id, 1))}>↓</button>{row.type === 'image' && <button type="button" className="btn small" onClick={() => onPatch({ image: { ...row.file } })}>Use as portrait</button>}<button type="button" className="btn small reference-remove" aria-label={`Delete media ${index + 1}`} onClick={() => patch(rows.filter(item => item.id !== row.id))}>Delete</button></div>
      </> : <><h3>{row.title || row.file?.name || row.type}</h3>{row.path && <code>{row.path}</code>}{row.caption && <p className="reference-prose">{row.caption}</p>}{row.credit && <p>Credit: {row.credit}</p>}</>}
    </article>)}</div>
    <section className="character-linked-research"><h3>Linked research</h3>
      {editing && <div className="reference-actions"><label className="reference-field"><span>Library reference</span><select className="field-input" value={researchId} onChange={event => setResearchId(event.target.value)}><option value="">Choose a reference…</option>{Object.values(library.research || {}).filter(record => !ids.includes(record.id)).map(record => <option key={record.id} value={record.id}>{record.title || 'Untitled reference'}</option>)}</select></label><button type="button" className="btn small" disabled={!researchId} onClick={() => { onPatch({ researchIds: [...ids, researchId] }); setResearchId(''); }}>Link reference</button></div>}
      {!ids.length && <p className="hint">{editing ? 'Create source material in Library → Research & References, then link it here.' : 'No linked research.'}</p>}
      {ids.map(id => <div className="character-research-link" key={id}><button type="button" className="btn small" disabled={!library.research?.[id] || !onOpenResearch} onClick={() => onOpenResearch(id)}>{library.research?.[id]?.title || 'Unavailable library reference'}</button>{editing && <button type="button" className="btn small reference-remove" aria-label={`Unlink ${library.research?.[id]?.title || 'reference'}`} onClick={() => onPatch({ researchIds: ids.filter(value => value !== id) })}>×</button>}</div>)}
    </section>
  </section>;
}

function CharacterMediaDialog({ node, onPatch, onClose }) {
  const library = useLibrary() || {}, dispatch = useLibraryDispatch();
  const [researchId, setResearchId] = useState(null);
  const record = library.research?.[researchId];
  return <><ReferenceDialog title={`${node.title || node.name || 'Character'} · Media & references`} onClose={onClose}><CharacterMediaContents node={node} onPatch={onPatch} library={library} onOpenResearch={setResearchId} /></ReferenceDialog>
    {record && <ReferenceDialog title={record.title || 'Research reference'} onClose={() => setResearchId(null)}><ResearchRecordContents record={record} readOnly={!onPatch} storageState={library} onPatch={patch => dispatch({ type: 'UPDATE_ENTITY', coll: 'research', id: record.id, patch })} /></ReferenceDialog>}
  </>;
}

export default function CharacterMediaGallery({ node, onPatch }) {
  const [open, setOpen] = useState(false), count = characterMedia(node).length;
  return <><button type="button" className="btn small character-media-trigger" aria-haspopup="dialog" onClick={() => setOpen(true)}>Media &amp; references{count ? ` · ${count}` : ''}</button>{open && <CharacterMediaDialog node={node} onPatch={onPatch} onClose={() => setOpen(false)} />}</>;
}
