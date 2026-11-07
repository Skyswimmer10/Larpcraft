export const REFERENCE_FILE_LIMIT = 8 * 1024 * 1024;
export const newReferenceId = prefix => `${prefix}:${crypto.randomUUID()}`;
export const safeReferenceUrl = value => {
  try { const url = new URL(String(value || '').trim()); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
};
export const referencePanels = record => Array.isArray(record?.panels) ? record.panels : [];
export const characterMedia = node => Array.isArray(node?.mediaGallery) ? node.mediaGallery : [];

export function newReference(title = 'New reference', id = newReferenceId('REF')) {
  return { id, title, summary: '', credit: '', sourceUrl: '', panels: [], createdAt: Date.now() };
}
export function newReferencePanel(type, id = newReferenceId('PANEL')) {
  return { id, type, title: '', ...(type === 'note' ? { text: '' } : type === 'link' ? { url: '', text: '' } : type === 'table' ? {
    columns: [{ id: 'name', label: 'Name' }, { id: 'value', label: 'Value' }, { id: 'unit', label: 'Unit' }], rows: [],
  } : {}) };
}
export function moveReferenceRow(rows, id, direction) {
  const index = rows.findIndex(row => row.id === id), next = index + direction;
  if (index < 0 || next < 0 || next >= rows.length) return rows;
  const copy = [...rows]; [copy[index], copy[next]] = [copy[next], copy[index]]; return copy;
}
export function setReferenceCell(table, rowId, columnId, value) {
  return { ...table, rows: (table.rows || []).map(row => row.id === rowId ? { ...row, cells: { ...row.cells, [columnId]: value } } : row) };
}
export function removeReferenceColumn(table, columnId) {
  return { ...table, columns: (table.columns || []).filter(column => column.id !== columnId), rows: (table.rows || []).map(row => {
    const cells = { ...row.cells }; delete cells[columnId]; return { ...row, cells };
  }) };
}
export function referenceSearchText(record) {
  return [record.title, record.summary, record.credit, record.sourceUrl, ...referencePanels(record).flatMap(panel => [panel.title, panel.text, panel.url, panel.file?.name, ...(panel.columns || []).map(column => column.label), ...(panel.rows || []).flatMap(row => Object.values(row.cells || {}))])].filter(Boolean).join(' ').toLocaleLowerCase();
}
export function validateReferenceFile(file, imagesOnly = false) {
  if (!file || file.size > REFERENCE_FILE_LIMIT) throw new Error('Choose files up to 8 MB each. Keep larger media in an external folder or use a link.');
  if (imagesOnly && !file.type.startsWith('image/')) throw new Error('Choose image files for the gallery. Add videos as links or file references.');
  if (file.type.startsWith('video/')) throw new Error('Add videos as links or external file references to keep game saves manageable.');
}
export function referenceStorageFits(state, added) {
  // Leave headroom below the local API's 100 MB request limit, including UTF-8.
  return new TextEncoder().encode(JSON.stringify(state)).length + new TextEncoder().encode(JSON.stringify(added)).length < 90 * 1024 * 1024;
}
export function characterMediaText(node) {
  return characterMedia(node).map(row => [row.title || row.file?.name || row.type, row.caption, row.credit && `Credit: ${row.credit}`, row.url || row.path].filter(Boolean).join(' · ')).join('\n');
}
