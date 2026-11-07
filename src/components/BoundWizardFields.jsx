import React, { useState } from 'react';
import { wizardFieldPatch } from '../lib/wizardFields.js';

export default function BoundWizardFields({ node, onPatch, Field, children }) {
  const [otherDetails, setOtherDetails] = useState(false);
  return <>
    <div className="ihead"><h3>{node.title}</h3><p className="hint">Concept answers · changes update the saved wizard and its description.</p></div>
    {Object.entries(node.wizardFields || {}).map(([key, field]) => <Field key={key} label={field.prompt} textarea value={field.answer || ''} onCommit={answer => onPatch(wizardFieldPatch(node, key, answer))} />)}
    {node.body && node.body !== node.wizardFieldGeneratedBody && <details><summary>Retained free-form writing</summary><p style={{ whiteSpace: 'pre-wrap' }}>{node.body}</p></details>}
    {children && <details onToggle={event => setOtherDetails(event.currentTarget.open)}><summary>Other node details</summary>{otherDetails && children}</details>}
  </>;
}
