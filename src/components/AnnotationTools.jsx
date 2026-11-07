import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PrimIcon } from './bits.jsx';
import './AnnotationTools.css';

export function AnnotationButtons({ onFrame, onCircle, onVisualMarker, onTitle, onArrow, onSpline }) {
  return <>
    <button type="button" className="addnode frameadd" title="Add a visual grouping frame" onClick={() => onFrame()}><span className="sq" style={{ background: '#8B92A6' }}><PrimIcon icon="layers" color="#fff" size={11} /></span>Frame</button>
    <button type="button" className="addnode frameadd" title="Add a resizable circle" onClick={() => onCircle()}><span className="sq shapecircle" style={{ borderColor: '#5CA8F5' }} />Circle</button>
    <button type="button" className="addnode frameadd" title="Add a visual number marker" onClick={() => onVisualMarker('number')}><span className="sq" style={{ background: '#E8D25C', color: '#111' }}>1</span>Number</button>
    <button type="button" className="addnode frameadd" title="Add a visual letter marker (A-Z)" onClick={() => onVisualMarker('letter')}><span className="sq" style={{ background: '#E8D25C', color: '#111' }}>A</span>Letter</button>
    <button type="button" className="addnode frameadd" title="Add a draggable title label" onClick={() => onTitle()}><span className="sq" style={{ background: '#E9EBF3', color: '#111' }}>T</span>Title</button>
    <button type="button" className="addnode frameadd" title="Add a directional support arrow" onClick={() => onArrow()}><span className="sq arrowglyph" style={{ color: '#5CA8F5' }}>→</span>Arrow</button>
    <button type="button" className="addnode frameadd" title="Add an editable curved support line" onClick={() => onSpline()}><span className="sq splineglyph" style={{ color: '#5CA8F5' }}>∿</span>Spline</button>
  </>;
}
export default function AnnotationTools({ children, className }) {
  const trayId = useId();
  const anchor = useRef(null);
  const [open, setOpen] = useState(false);
  const [host, setHost] = useState(null);
  useEffect(() => {
    if (!anchor.current) return;
    const toolbar = anchor.current.closest('.toolrow, .wphead, .nodepal-head, .mhead') || anchor.current.parentElement;
    const tray = document.createElement('div');
    tray.className = 'annotation-tray-host';
    toolbar.after(tray);
    setHost(tray);
    return () => { tray.remove(); };
  }, []);
  return <><button type="button" ref={anchor} className="annotation-trigger" aria-expanded={open} aria-controls={open ? trayId : undefined} onClick={() => setOpen(value => !value)}>Annotate {open ? '▴' : '▾'}</button>
    {open && host && createPortal(<div id={trayId} className="annotation-tray" role="group" aria-label="Annotation tools" onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); anchor.current?.focus(); } }}><div className={className}>{children}</div><button type="button" className="annotation-close" onClick={() => { setOpen(false); anchor.current?.focus(); }}>Close tools</button></div>, host)}</>;
}
