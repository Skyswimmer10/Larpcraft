import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { readableColumnCount } from '../mechanics/collections.js';

export function useCollectionColumns(ref, preferred, active = true) {
  const [columns, setColumns] = useState(4);
  useLayoutEffect(() => {
    if (!active || !ref.current) return;
    const element = ref.current;
    const resize = () => setColumns(readableColumnCount(element.clientWidth, preferred));
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, preferred, active]);
  return columns;
}

export function useCollectionModal(ref, close, active = true) {
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!active) return;
    const before = document.activeElement;
    const modal = ref.current;
    modal?.querySelector('input,button,select')?.focus();
    const key = event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeRef.current(); }
      if (event.key !== 'Tab') return;
      const controls = [...(modal?.querySelectorAll('button,input,select,textarea,a[href]') || [])].filter(el => !el.disabled && el.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && (document.activeElement === first || !modal?.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !modal?.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
    };
    modal?.addEventListener('keydown', key);
    return () => { modal?.removeEventListener('keydown', key); if (before?.isConnected) before.focus(); };
  }, [ref, active]);
}

export function useColumnPreference() {
  const [value, setValue] = useState(() => { try { return localStorage.getItem('larpcraft:mechanics-columns') === '5' ? 5 : 4; } catch { return 4; } });
  return [value, next => { setValue(Number(next)); try { localStorage.setItem('larpcraft:mechanics-columns', String(next)); } catch { /* Current preference still works. */ } }];
}
