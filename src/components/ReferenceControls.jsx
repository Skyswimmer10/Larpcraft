import React, { useEffect, useRef, useState } from 'react';
import { safeReferenceUrl, validateReferenceFile, newReferenceId, setReferenceCell, removeReferenceColumn } from '../lib/research.js';
import './References.css';

export function ReferenceField({ label, value = '', onCommit, multiline = false, ...props }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const control = { className: 'field-input', value: draft, onChange: event => setDraft(event.target.value), onBlur: () => { if (draft !== String(value)) onCommit(draft); }, ...props };
  return <label className="reference-field"><span>{label}</span>{multiline ? <textarea rows={4} {...control} /> : <input {...control} />}</label>;
}

export function ReferenceFileButton({ onAdd, imagesOnly = false, multiple = true, label = 'Attach files' }) {
  const input = useRef(null), readers = useRef(new Set()), alive = useRef(true), latest = useRef(onAdd);
  latest.current = onAdd;
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => { alive.current = true; return () => { alive.current = false; for (const reader of readers.current) reader.abort(); }; }, []);
  const choose = async event => {
    const files = [...event.target.files]; event.target.value = ''; if (!files.length) return;
    setError(''); setBusy(true);
    try {
      files.forEach(file => validateReferenceFile(file, imagesOnly));
      const result = await Promise.all(files.map(file => new Promise((resolve, reject) => {
        const reader = new FileReader(); readers.current.add(reader);
        const finish = callback => { readers.current.delete(reader); callback(); };
        reader.onload = () => finish(() => resolve({ id: newReferenceId('FILE'), name: file.name, type: file.type || 'application/octet-stream', size: file.size, dataUrl: reader.result }));
        reader.onerror = () => finish(() => reject(new Error(`Could not read ${file.name}.`)));
        reader.onabort = () => finish(() => reject(new Error('File reading cancelled.')));
        reader.readAsDataURL(file);
      })));
      if (alive.current) latest.current(result);
    } catch (reason) { if (alive.current) setError(reason.message); }
    finally { if (alive.current) setBusy(false); }
  };
  return <div className="reference-upload"><button type="button" className="btn small" disabled={busy} onClick={() => input.current.click()}>{busy ? 'Reading files…' : label}</button><input ref={input} type="file" multiple={multiple} accept={imagesOnly ? 'image/*' : undefined} hidden aria-label={label} onChange={choose} />{error && <p role="alert">{error}</p>}</div>;
}

export function ReferenceLink({ url, children = 'Open source' }) {
  const safe = safeReferenceUrl(url);
  return safe ? <a className="reference-link" href={safe} target="_blank" rel="noopener noreferrer">{children} ↗</a> : url ? <span className="hint">Enter a complete http:// or https:// URL.</span> : null;
}

export function ReferenceFilePreview({ file }) {
  const [preview, setPreview] = useState(false);
  if (!file?.dataUrl?.startsWith('data:')) return <p className="hint">File unavailable.</p>;
  const image = file.type?.startsWith('image/') && file.dataUrl.startsWith('data:image/');
  const pdf = file.type === 'application/pdf' && file.dataUrl.startsWith('data:application/pdf');
  return <div className="reference-file-preview">{image && <img src={file.dataUrl} alt={file.name || 'Reference image'} loading="lazy" />}<div><b>{file.name}</b>{Number.isFinite(file.size) && <small>{(file.size / 1024 / 1024).toFixed(2)} MB</small>}<a className="reference-link" href={file.dataUrl} download={file.name || 'reference-file'}>Download {pdf ? 'PDF' : 'file'}</a>{pdf && <button type="button" className="btn small" aria-expanded={preview} onClick={() => setPreview(value => !value)}>{preview ? 'Hide PDF' : 'Preview PDF'}</button>}</div>{pdf && preview && <object className="reference-pdf" data={file.dataUrl} type="application/pdf" aria-label={`PDF preview: ${file.name}`}><p>Use Download PDF if your browser cannot show the preview.</p></object>}</div>;
}

export function ReferenceTable({ panel, onChange, readOnly = false }) {
  const columns = panel.columns || [], rows = panel.rows || [];
  return <div className="reference-table-panel"><div className="reference-table-scroll"><table><thead><tr>{columns.map((column, index) => <th key={column.id}>{readOnly ? column.label : <><ReferenceField label={`Column ${index + 1} heading`} value={column.label} onCommit={label => onChange({ ...panel, columns: columns.map(row => row.id === column.id ? { ...row, label } : row) })} /><button type="button" className="reference-remove" disabled={columns.length <= 1} aria-label={`Remove column ${index + 1}`} onClick={() => onChange(removeReferenceColumn(panel, column.id))}>Remove column</button></>}</th>)}{!readOnly && <th>Row</th>}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.id}>{columns.map(column => <td key={column.id}>{readOnly ? row.cells?.[column.id] : <ReferenceField label={`Row ${index + 1}, ${column.label}`} value={row.cells?.[column.id] ?? ''} onCommit={value => onChange(setReferenceCell(panel, row.id, column.id, value))} />}</td>)}{!readOnly && <td><button type="button" className="btn small reference-remove" aria-label={`Delete row ${index + 1}`} onClick={() => onChange({ ...panel, rows: rows.filter(item => item.id !== row.id) })}>×</button></td>}</tr>)}</tbody></table></div>{!rows.length && <p className="hint">No rows yet.</p>}{!readOnly && <div className="reference-actions"><button type="button" className="btn small" onClick={() => onChange({ ...panel, rows: [...rows, { id: newReferenceId('ROW'), cells: {} }] })}>Add row</button><button type="button" className="btn small" onClick={() => onChange({ ...panel, columns: [...columns, { id: newReferenceId('COL'), label: `Column ${columns.length + 1}` }] })}>Add column</button></div>}</div>;
}
