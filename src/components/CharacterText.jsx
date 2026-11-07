import React, { useEffect, useState } from 'react';

export default function CharacterText({ label, value = '', onCommit, rows = 12 }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return <label className="cp-field">{label}<textarea className="field-input" rows={rows} value={draft} onChange={event => setDraft(event.target.value)} onBlur={() => { if (draft !== value) onCommit(draft); }} /></label>;
}
