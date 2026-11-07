import React, { createContext, useContext, useEffect, useState } from 'react';
import { applyColorPalette, readColorPalette, saveColorPalette, PALETTE_STORAGE_KEY } from '../lib/colorPalettes.js';

const AppearanceContext = createContext({ refreshed: true, focus: false });
export const useAppearance = () => useContext(AppearanceContext);
export function AppearanceProvider({ children }) {
  const [focus, setFocus] = useState(false);
  const [palette, setPaletteState] = useState(readColorPalette);
  const setPalette = id => { const next = saveColorPalette(id); applyColorPalette(next); setPaletteState(next); };
  useEffect(() => {
    applyColorPalette(palette);
  }, [palette]);
  useEffect(() => {
    const sync = event => { if (event.key === PALETTE_STORAGE_KEY || event.key === null) { const next = readColorPalette(); applyColorPalette(next); setPaletteState(next); } };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  return <AppearanceContext.Provider value={{ refreshed: true, focus, palette, setPalette, toggleFocus: () => setFocus(value => !value) }}>
    <div className={`frame ui-refresh${focus ? ' ui-focus' : ''}`}>{children}</div>
  </AppearanceContext.Provider>;
}
