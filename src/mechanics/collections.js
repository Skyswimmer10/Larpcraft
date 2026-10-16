import { MECHANISM_COLLECTIONS } from '../data/mechanismCatalog.js';

export const collectionPayload = (kind, id) => `catalogue:${kind}|${encodeURIComponent(id)}`;
export const collectionSources = lib => [{ id: 'board', label: 'Board Games' }, { id: 'saved', label: 'My Saved' }, ...Object.values(lib.mechanicsSources || {}).filter(s => !['board', 'saved'].includes(s.id))];
export const savedMechanicSource = (record, lib) => collectionSources(lib).some(s => s.id === record.sourceId && s.id !== 'board') ? record.sourceId : 'saved';
export const savedMechanicCategory = record => record.collectionCategoryId || 'unsorted';
export const savedMechanicsForSource = (lib, source) => Object.values(lib.mechStructures || {}).filter(record => record.templateKind !== 'action' && savedMechanicSource(record, lib) === source);
export const catalogueRecords = lib => Object.entries(MECHANISM_COLLECTIONS).flatMap(([kind, coll]) => Object.values(lib[coll] || {}).map(record => ({ ...record, kind })));
export const favoritesFirst = (a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite));
export const libraryWithMechanismDraft = (lib, record) => {
  const coll = record && MECHANISM_COLLECTIONS[record.kind];
  return coll ? { ...lib, [coll]: { ...lib[coll], [record.id]: record } } : lib;
};
export const readableColumnCount = (width, preferred = 4) => Math.max(1, Math.min(preferred === 5 ? 5 : 4, Math.floor((width + 10) / 182)));
