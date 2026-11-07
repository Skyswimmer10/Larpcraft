import React, { useEffect, useState } from 'react';

export default function DescriptionParagraphReview({ paragraph, sourceLabel, onResolve }) {
  const [draft, setDraft] = useState(paragraph.text);
  useEffect(() => setDraft(paragraph.text), [paragraph.text]);
  return <section className="cp-review cp-paragraph-review" aria-label={`Review description paragraph: ${sourceLabel}`}>
    <h4>{sourceLabel}</h4><p>A source answer changed. Your paragraph stays until you decide.</p>
    {paragraph.layoutChanged && <p>The paragraph layout changed, so the app kept your new paragraphs as independent writing. Applying this revision adds the source paragraph back; your independent writing stays.</p>}
    <div className="cp-review-columns"><div><b>Your current wording</b><pre>{paragraph.text || '(You removed this paragraph.)'}</pre></div><div><b>Proposed revision</b><pre>{paragraph.pending || '(This source no longer contributes a paragraph.)'}</pre></div></div>
    <div className="cp-actions"><button type="button" className="btn" onClick={() => onResolve(paragraph.id, true)}>Use this revision</button><button type="button" className="btn" onClick={() => onResolve(paragraph.id, false)}>Keep my wording</button></div>
    <details><summary>Edit this paragraph</summary><label className="cp-field">Your revised paragraph<textarea className="field-input" rows={6} value={draft} onChange={event => setDraft(event.target.value)} /></label><button type="button" className="btn" onClick={() => onResolve(paragraph.id, false, draft)}>Save edited paragraph</button></details>
  </section>;
}
