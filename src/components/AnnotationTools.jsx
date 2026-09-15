import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppearance } from './AppearanceContext.jsx';
export default function AnnotationTools({ children, className }) {
  const { refreshed } = useAppearance();
  const anchor = useRef(null);
  const [open, setOpen] = useState(false);
  const [host, setHost] = useState(null);
  useLayoutEffect(() => {
    if (!refreshed || !anchor.current) return;
    const toolbar = anchor.current.closest('.toolrow, .wphead, .nodepal-head, .mhead') || anchor.current.parentElement;
    const tray = document.createElement('div');
    tray.className = 'annotation-tray-host';
    toolbar.after(tray);
    setHost(tray);
    return () => { tray.remove(); };
  }, [refreshed]);
  if (!refreshed) return <div className={className}>{children}</div>;
  return <><button ref={anchor} className="annotation-trigger" aria-expanded={open} onClick={() => setOpen(value => !value)}>Annotate {open ? '▴' : '▾'}</button>
    {open && host && createPortal(<div className="annotation-tray" aria-label="Annotation tools"><div className={className}>{children}</div><button onClick={() => setOpen(false)}>Close tools</button></div>, host)}</>;
}
