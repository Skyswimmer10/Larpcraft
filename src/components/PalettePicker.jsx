import React, { useEffect, useRef } from 'react';
import { useAppearance } from './AppearanceContext.jsx';
import { COLOR_PALETTES, colorPalette } from '../lib/colorPalettes.js';

export default function PalettePicker() {
  const { palette, setPalette } = useAppearance();
  const picker = useRef(null), trigger = useRef(null);
  const current = colorPalette(palette);
  useEffect(() => {
    const closeOutside = event => { if (picker.current?.open && !picker.current.contains(event.target)) picker.current.open = false; };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);
  return <details ref={picker} className="palette-picker" onKeyDown={event => { if (event.key === 'Escape' && picker.current.open) { event.preventDefault(); event.stopPropagation(); picker.current.open = false; trigger.current.focus(); } }}>
    <summary ref={trigger} className="palette-trigger" role="button" aria-label={`Color palette: ${current.name}`} title={`Color palette: ${current.name}`}>
      <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1.5-3.3l-.4-.4a1.7 1.7 0 0 1 1.3-2.8H18a3 3 0 0 0 3-3C21 6.8 17 3 12 3Z" /><circle cx="7" cy="10" r="1" /><circle cx="10" cy="6.5" r="1" /><circle cx="15" cy="6.8" r="1" /><circle cx="18" cy="10.5" r="1" /></svg>
    </summary>
    <div className="palette-options" role="group" aria-label="Color palette"><small>Color palette</small>{COLOR_PALETTES.map(option => <button type="button" key={option.id} aria-pressed={option.id === current.id} onClick={() => { setPalette(option.id); picker.current.open = false; trigger.current.focus(); }}>
      <span className="palette-samples" aria-hidden="true">{[option.panel, option.brand, option.secondary].map((color, index) => <i key={index} style={{ background: color }} />)}</span><span>{option.name}</span><span className="palette-check" aria-hidden="true">{option.id === current.id ? '✓' : ''}</span>
    </button>)}</div>
  </details>;
}
