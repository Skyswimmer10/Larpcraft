export const PALETTE_STORAGE_KEY = 'larpcraft:color-palette';
export const DEFAULT_PALETTE = 'violet';
export const COLOR_PALETTES = [
  { id: 'violet', name: 'Midnight Violet', tone: 'dark', ground: '#10131D', panel: '#191F2E', raised: '#252D40', line: '#3C4862', ink: '#ECF0FA', muted: '#AFBAD0', brand: '#9D8CFF', onBrand: '#17112E', secondary: '#76D5C3', selected: '#343058', grid: '#303B53' },
  { id: 'ocean', name: 'Deep Ocean', tone: 'dark', ground: '#0B1722', panel: '#122B3C', raised: '#1B3C50', line: '#365D73', ink: '#E8F3FA', muted: '#ABC4D3', brand: '#65CCEF', onBrand: '#082331', secondary: '#E6B978', selected: '#1D465E', grid: '#284451' },
  { id: 'forest', name: 'Forest Glass', tone: 'dark', ground: '#0F1C1D', panel: '#172D2C', raised: '#243D38', line: '#43645A', ink: '#E8F2ED', muted: '#ADC5B8', brand: '#9DD9B5', onBrand: '#122B20', secondary: '#D9B681', selected: '#304E3D', grid: '#2B453D' },
  { id: 'graphite', name: 'Warm Graphite', tone: 'dark', ground: '#1B1A19', panel: '#272522', raised: '#35322D', line: '#59534A', ink: '#F2EEE7', muted: '#C3BAAB', brand: '#E5B66C', onBrand: '#2F210B', secondary: '#A5C5CE', selected: '#4A3D2C', grid: '#3E3B34' },
  { id: 'burgundy', name: 'Burgundy & Brass', tone: 'dark', ground: '#20161D', panel: '#30232D', raised: '#42313A', line: '#6D515F', ink: '#F7EDF1', muted: '#D2B7C3', brand: '#DFBC78', onBrand: '#312208', secondary: '#D5A9D0', selected: '#51402E', grid: '#48303F' },
  { id: 'daylight', name: 'Soft Daylight', tone: 'light', ground: '#E9EEF2', panel: '#F5F7F8', raised: '#FFFFFF', line: '#B5C1CD', ink: '#223141', muted: '#526477', brand: '#5B4DBC', onBrand: '#FFFFFF', secondary: '#176E63', selected: '#E5E1F6', grid: '#C9D3DC' },
];

export const colorPalette = id => COLOR_PALETTES.find(palette => palette.id === id) || COLOR_PALETTES[0];
export function readColorPalette(storage) {
  try { return colorPalette((storage || globalThis.localStorage)?.getItem(PALETTE_STORAGE_KEY)).id; }
  catch { return DEFAULT_PALETTE; }
}
export function saveColorPalette(id, storage) {
  const palette = colorPalette(id);
  try { (storage || globalThis.localStorage)?.setItem(PALETTE_STORAGE_KEY, palette.id); } catch { /* Keep working in memory when browser storage is unavailable. */ }
  return palette.id;
}
export function applyColorPalette(id, root = globalThis.document?.documentElement) {
  const palette = colorPalette(id);
  if (!root) return palette.id;
  root.dataset.palette = palette.id;
  root.dataset.tone = palette.tone;
  for (const token of ['ground', 'panel', 'raised', 'line', 'ink', 'muted', 'brand', 'secondary', 'selected']) root.style.setProperty('--' + token, palette[token]);
  root.style.setProperty('--on-brand', palette.onBrand);
  root.style.setProperty('--canvas-grid', palette.grid);
  root.style.setProperty('--theme-muted', palette.muted);
  root.style.setProperty('color-scheme', palette.tone);
  return palette.id;
}
