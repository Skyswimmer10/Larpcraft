import React, { createContext, useContext, useState } from 'react';

const AppearanceContext = createContext({ refreshed: false, focus: false });
export const useAppearance = () => useContext(AppearanceContext);
export function AppearanceProvider({ children }) {
  const [refreshed, setRefreshed] = useState(() => {
    try { return localStorage.getItem('larpcraft:refreshed-ui') !== 'off'; } catch { return true; }
  });
  const [focus, setFocus] = useState(false);
  const toggleAppearance = () => {
    const next = !refreshed;
    setRefreshed(next);
    setFocus(false);
    try { localStorage.setItem('larpcraft:refreshed-ui', next ? 'on' : 'off'); } catch { /* In-memory preference still works. */ }
  };
  return <AppearanceContext.Provider value={{ refreshed, focus, toggleAppearance, toggleFocus: () => setFocus(value => !value) }}>
    <div className={`frame${refreshed ? ' ui-refresh' : ''}${refreshed && focus ? ' ui-focus' : ''}`}>{children}</div>
  </AppearanceContext.Provider>;
}
