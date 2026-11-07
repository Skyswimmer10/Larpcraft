import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import './StoryBeatFields.css';

export default function StoryBeatDialog({ title, subtitle, onClose, children, className = '', closeLabel = 'Done', actions }) {
  const dialog = useRef(null), id = useId();
  const close = () => { document.activeElement?.blur?.(); onClose(); };
  useEffect(() => {
    const element = dialog.current, previous = document.activeElement;
    element.showModal();
    return () => { element.close(); previous?.focus?.(); };
  }, []);
  return createPortal(<dialog ref={dialog} className={`story-beat-dialog ${className}`} aria-labelledby={id} onCancel={event => { event.preventDefault(); event.stopPropagation(); close(); }}>
    <header><div>{subtitle && <small>{subtitle}</small>}<h2 id={id}>{title}</h2></div>{actions}<button type="button" className="btn" onClick={close}>{closeLabel}</button></header>
    <div className="story-beat-dialog-body">{children}</div>
  </dialog>, document.body);
}
