import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PrimIcon } from './bits.jsx';
import { ACTION_PATTERN_SYSTEMS } from '../data/actionMechanics.js';

const FILTERS = [
  { id: 'token', label: 'Token Systems', group: 'Action Type Pattern' },
  { id: 'order', label: 'Order Systems', group: 'Action Type Pattern' },
  { id: 'special', label: 'Special Systems', group: 'Action Type Pattern' },
  { id: 'probability', label: 'Resolution', group: 'Resolution' },
];

const recordFilter = (record) => record.kind === 'probability' ? 'probability' : record.system;
const cloneRecord = (record) => record ? { ...record, image: record.image ? { ...record.image } : null } : null;
const clampImagePosition = (value) => Math.min(100, Math.max(-100, Number(value) || 0));
const imageTransform = (record) => `translate(${clampImagePosition(record?.imagePositionX)}%, ${clampImagePosition(record?.imagePositionY)}%) scale(${Number(record?.imageScale) || 1})`;

function RepeatableMechanismField({ label, values, onChange }) {
  const entries = Array.isArray(values) && values.length ? values : [''];
  const update = (index, value) => onChange(entries.map((entry, entryIndex) => entryIndex === index ? value : entry));
  const remove = (index) => entries.length > 1 && onChange(entries.filter((_, entryIndex) => entryIndex !== index));
  return (
    <div className="mechanism-editor-field mechanism-repeat-field">
      <span>{label}</span>
      {entries.map((entry, index) => (
        <div className="mechanism-repeat-row" key={`${label}-${index}`}>
          <textarea className="field-input" rows="2" maxLength="320" value={entry || ''}
            onChange={(event) => update(index, event.target.value)} />
          {entries.length > 1 && <button className="iconbtn danger" title={`Remove ${label.toLowerCase()}`} onClick={() => remove(index)}>×</button>}
        </div>
      ))}
      <button className="btn tiny mechanism-repeat-add" onClick={() => onChange([...entries, ''])}>+ Add {label.toLowerCase()}</button>
    </div>
  );
}

export default function MechanismBrowser({
  initialFilter,
  patternMechanisms = [],
  probabilityMechanisms = [],
  selectedPatternIds = [],
  selectedProbability = '',
  allowedKind,
  onPick,
  onSave,
  onClose,
}) {
  const records = useMemo(() => [
    ...patternMechanisms.map((record) => ({ ...record, kind: 'pattern', category: record.category || ACTION_PATTERN_SYSTEMS[record.system]?.label || 'Action Type Pattern' })),
    ...probabilityMechanisms.map((record) => ({ ...record, kind: 'probability' })),
  ], [patternMechanisms, probabilityMechanisms]);
  const initialSelected = allowedKind === 'probability'
    ? records.find((record) => record.kind === 'probability' && (record.id === selectedProbability || record.label === selectedProbability))
    : records.find((record) => record.kind === 'pattern' && selectedPatternIds.includes(record.id) && record.system === initialFilter);
  const firstInitial = initialSelected || records.find((record) => recordFilter(record) === initialFilter) || null;
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('name');
  const [visible, setVisible] = useState(() => Object.fromEntries(FILTERS.map((filter) => [filter.id, filter.id === initialFilter])));
  const [focusedId, setFocusedId] = useState(firstInitial?.id || '');
  const [draft, setDraft] = useState(() => cloneRecord(firstInitial));
  const [imageDropActive, setImageDropActive] = useState(false);
  const imageDrag = useRef(null);
  const counts = Object.fromEntries(FILTERS.map((filter) => [filter.id, records.filter((record) => recordFilter(record) === filter.id).length]));
  const q = query.trim().toLowerCase();
  const shown = records
    .filter((record) => visible[recordFilter(record)])
    .filter((record) => !q || `${record.label} ${record.description} ${record.category}`.toLowerCase().includes(q))
    .sort((a, b) => {
      if (sort === 'category') return String(a.category).localeCompare(String(b.category)) || a.label.localeCompare(b.label);
      if (sort === 'custom') return Number(!!a.custom) - Number(!!b.custom) || a.label.localeCompare(b.label);
      return a.label.localeCompare(b.label);
    });
  const selected = new Set([...selectedPatternIds.filter(Boolean), selectedProbability]);
  const compatible = draft?.kind === allowedKind;
  const stored = records.find((record) => record.id === draft?.id);
  const dirty = !!draft && JSON.stringify(draft) !== JSON.stringify(stored);

  useEffect(() => {
    const updated = records.find((record) => record.id === focusedId);
    if (updated) setDraft(cloneRecord(updated));
  }, [focusedId, records]);

  const toggle = (id) => setVisible((current) => ({ ...current, [id]: !current[id] }));
  const focus = (record) => {
    setFocusedId(record.id);
    setDraft(cloneRecord(record));
  };
  const updateDraft = (patch) => setDraft((current) => ({ ...current, ...patch }));
  const uploadImage = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateDraft({
      image: { kind: 'upload', name: file.name, dataUrl: reader.result },
      imageScale: 1,
      imagePositionX: 0,
      imagePositionY: 0,
    });
    reader.readAsDataURL(file);
  };
  const dropImage = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setImageDropActive(false);
    const file = Array.from(event.dataTransfer?.files || []).find((candidate) => (
      candidate.type?.startsWith('image/') || /\.svg$/i.test(candidate.name || '')
    ));
    if (file) uploadImage(file);
  };
  const startImageDrag = (event) => {
    if (!draft?.image) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    imageDrag.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPositionX: clampImagePosition(draft.imagePositionX),
      startPositionY: clampImagePosition(draft.imagePositionY),
      width: Math.max(1, event.currentTarget.clientWidth),
      height: Math.max(1, event.currentTarget.clientHeight),
    };
  };
  const moveImage = (event) => {
    const drag = imageDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    updateDraft({
      imagePositionX: clampImagePosition(drag.startPositionX + ((event.clientX - drag.startClientX) / drag.width) * 100),
      imagePositionY: clampImagePosition(drag.startPositionY + ((event.clientY - drag.startClientY) / drag.height) * 100),
    });
  };
  const stopImageDrag = (event) => {
    if (imageDrag.current?.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    imageDrag.current = null;
  };

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal mechanism-browser" onClick={(event) => event.stopPropagation()}>
        <div className="modalhead mechanism-browser-head">
          <div>
            <b>Mechanism Browser</b>
            <small>Browse in the middle, edit the selected library record on the right, then use it on the current node.</small>
          </div>
          <button className="x big" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="mechanism-browser-layout">
          <aside className="mechanism-browser-filters">
            <b>Show / Hide</b>
            <section>
              <small>Mechanism Categories</small>
              {FILTERS.map((filter) => (
                <label key={filter.id} className={visible[filter.id] ? 'on' : ''}>
                  <input type="checkbox" checked={!!visible[filter.id]} onChange={() => toggle(filter.id)} />
                  <span>{filter.label}</span>
                  <em>{counts[filter.id]}</em>
                </label>
              ))}
            </section>
          </aside>
          <main className="mechanism-browser-main">
            <div className="mechanism-browser-toolbar">
              <input className="search" autoFocus placeholder="Search mechanisms..." value={query} onChange={(event) => setQuery(event.target.value)} />
              <label>
                <span>Sort</span>
                <select className="field-input" value={sort} onChange={(event) => setSort(event.target.value)}>
                  <option value="name">Name</option>
                  <option value="category">Category</option>
                  <option value="custom">Built-in / Custom</option>
                </select>
              </label>
            </div>
            {shown.length > 0 ? (
              <div className="mechanism-browser-grid">
                {shown.map((record) => (
                  <button
                    key={record.id}
                    className={`mechanism-tile${selected.has(record.id) || selected.has(record.label) ? ' selected' : ''}${focusedId === record.id ? ' focused' : ''}`}
                    style={{ '--accent': record.color || '#8B7BF5' }}
                    onClick={() => focus(record)}
                  >
                    <span className={`mechanism-tile-image${record.image?.dataUrl ? ' has-image' : ''}`}>
                      {record.image?.dataUrl
                        ? <img src={record.image.dataUrl} alt="" style={{ transform: imageTransform(record) }} />
                        : <PrimIcon icon={record.icon || 'cog'} color="#fff" size={28} />}
                    </span>
                    <span className="mechanism-tile-copy">
                      <b>{record.label}</b>
                      <small>{record.description || 'No description yet.'}</small>
                    </span>
                    <span className="mechanism-tile-meta">
                      <i>{record.kind === 'probability' ? 'Resolution' : record.category}</i>
                      <i>{record.custom ? 'Custom' : 'Built-in'}</i>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mechanism-browser-empty">No visible mechanisms match the current search and Show / Hide filters.</div>
            )}
          </main>
          <aside className="mechanism-browser-editor">
            {draft ? (
              <>
                <div className="mechanism-editor-head">
                  <span style={{ background: draft.color || '#8B7BF5' }}><PrimIcon icon={draft.icon || 'cog'} color="#fff" size={14} /></span>
                  <div><b>{draft.label}</b><small>{draft.kind === 'probability' ? 'Resolution' : ACTION_PATTERN_SYSTEMS[draft.system]?.label}</small></div>
                </div>
                <div
                  className={`mechanism-image-editor${draft.image ? ' movable' : ''}${imageDropActive ? ' drop-active' : ''}`}
                  role="img"
                  aria-label={draft.image ? 'Drag to position or drop a replacement mechanism image' : 'Drop a mechanism image'}
                  title={draft.image ? 'Drag to position image' : undefined}
                  onPointerDown={startImageDrag}
                  onPointerMove={moveImage}
                  onPointerUp={stopImageDrag}
                  onPointerCancel={stopImageDrag}
                  onDragEnter={(event) => { event.preventDefault(); setImageDropActive(true); }}
                  onDragOver={(event) => { event.preventDefault(); if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'; }}
                  onDragLeave={() => setImageDropActive(false)}
                  onDrop={dropImage}
                >
                  {draft.image?.dataUrl ? <img src={draft.image.dataUrl} alt="" draggable={false} style={{ transform: imageTransform(draft) }} /> : <span>No image</span>}
                </div>
                <div className="mechanism-image-actions">
                  <label className="btn tiny">{draft.image ? 'Change image' : 'Insert picture'}<input type="file" accept="image/*,.svg" onChange={(event) => uploadImage(event.target.files?.[0])} /></label>
                  <button className="btn tiny" disabled={!draft.image} onClick={() => updateDraft({ imagePositionX: 0, imagePositionY: 0 })}>Center</button>
                  <button className="btn tiny" disabled={!draft.image} onClick={() => updateDraft({ image: null, imagePositionX: 0, imagePositionY: 0 })}>Remove image</button>
                </div>
                {draft.image && (
                  <div className="mechanism-image-framing">
                    <label className="mechanism-editor-field mechanism-image-scale">
                      <span>Image scale · {Number(draft.imageScale || 1).toFixed(2)}×</span>
                      <input type="range" min="0.5" max="3" step="0.05" value={draft.imageScale || 1}
                        onChange={(event) => updateDraft({ imageScale: Number(event.target.value) })} />
                    </label>
                    <div className="mechanism-image-position-controls">
                      <label><span>X · {Math.round(clampImagePosition(draft.imagePositionX))}</span><input type="range" min="-100" max="100" step="1" value={clampImagePosition(draft.imagePositionX)} onChange={(event) => updateDraft({ imagePositionX: Number(event.target.value) })} /></label>
                      <label><span>Y · {Math.round(clampImagePosition(draft.imagePositionY))}</span><input type="range" min="-100" max="100" step="1" value={clampImagePosition(draft.imagePositionY)} onChange={(event) => updateDraft({ imagePositionY: Number(event.target.value) })} /></label>
                    </div>
                  </div>
                )}
                <label className="mechanism-editor-field"><span>Name</span><input className="field-input" value={draft.label || ''} onChange={(event) => updateDraft({ label: event.target.value })} /></label>
                <label className="mechanism-editor-field"><span>Description</span><textarea className="field-input" value={draft.description || ''} onChange={(event) => updateDraft({ description: event.target.value })} /></label>
                {draft.kind === 'pattern' ? (
                  <>
                    <label className="mechanism-editor-field"><span>System</span><input className="field-input" value={ACTION_PATTERN_SYSTEMS[draft.system]?.label || draft.system} readOnly /></label>
                    <RepeatableMechanismField label="Advantage" values={draft.advantages} onChange={(advantages) => updateDraft({ advantages })} />
                    <RepeatableMechanismField label="Effect" values={draft.effects} onChange={(effects) => updateDraft({ effects })} />
                    <RepeatableMechanismField label="Variation" values={draft.variations} onChange={(variations) => updateDraft({ variations })} />
                  </>
                ) : (
                  <>
                    <RepeatableMechanismField label="Variation" values={draft.variations} onChange={(variations) => updateDraft({ variations })} />
                    <label className="mechanism-editor-field"><span>Emotional Spike</span><textarea className="field-input" value={draft.emotionalSpike || ''} onChange={(event) => updateDraft({ emotionalSpike: event.target.value })} /></label>
                    <RepeatableMechanismField label="Effect" values={draft.effects} onChange={(effects) => updateDraft({ effects })} />
                    <label className="mechanism-editor-field"><span>Color</span><input className="mechanism-color-input" type="color" value={draft.color || '#F08CB4'} onChange={(event) => updateDraft({ color: event.target.value })} /></label>
                  </>
                )}
                <div className="mechanism-editor-actions">
                  <button className="btn" disabled={!dirty} onClick={() => onSave?.(draft)}>Save Changes</button>
                  <button className="btn primary" disabled={!compatible || dirty}
                    title={!compatible ? 'This record can be edited here but cannot be assigned to the current node type.' : dirty ? 'Save your changes before using this mechanism.' : ''}
                    onClick={() => onPick(draft)}>Use Mechanism</button>
                </div>
              </>
            ) : <div className="mechanism-browser-empty">Select a tile to inspect and edit it.</div>}
          </aside>
        </div>
      </div>
    </div>,
    document.body,
  );
}
