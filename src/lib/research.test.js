import { describe, expect, it } from 'vitest';
import { newReference, newReferencePanel, setReferenceCell, removeReferenceColumn, moveReferenceRow, referenceSearchText, safeReferenceUrl, validateReferenceFile, characterMediaText } from './research.js';
import { makeEmptyProject, makeLibrarySeed, migrateLibrary } from '../data/seed.js';
import { undoableReducer } from '../state/store.jsx';
import { masterCollectionForAction, enforceStorageOwnership } from './storageOwnership.js';
import { createWorkspaceBackup, readWorkspaceBackup } from './workspaceTransfer.js';
import { wizardLibraryRecord } from './narrativeWizard.js';
import { createCanvasClipboard, remapCanvasClipboard } from './canvasClipboard.js';
import { characterExport } from './characterProfile.js';

const image = { id: 'IMG', name: 'portrait.png', type: 'image/png', size: 3, dataUrl: 'data:image/png;base64,YWJj' };
const table = () => ({ ...newReferencePanel('table', 'T'), rows: [{ id: 'R1', cells: { name: 'Cloth', value: '20', unit: 'm' } }, { id: 'R2', cells: { name: 'Wire', value: '8', unit: 'm' } }] });
const reference = () => ({ ...newReference('Prop research', 'REF'), createdAt: 1, credit: 'An author', sourceUrl: 'https://example.com/source', panels: [table(), { id: 'FILE', type: 'image', title: 'Costume', file: image }] });
const character = () => ({ id: 'C', kind: 'character', title: 'Mira', body: 'Protected existing prose.', image, researchIds: ['REF'], mediaGallery: [{ id: 'M1', type: 'image', title: 'Costume study', caption: 'Blue cloak', file: image }, { id: 'M2', type: 'video', title: 'Greeting', caption: 'Play at dusk', url: 'https://example.com/greeting.mp4', credit: 'The actor' }] });

describe('research and character media', () => {
  it('keeps reusable research in the library, available after game changes and additive migration', () => {
    expect(masterCollectionForAction({ type: 'UPDATE_ENTITY', coll: 'research' })).toBe('research');
    const library = migrateLibrary({ ...makeLibrarySeed(), research: { REF: reference() } });
    expect(library.research.REF).toEqual(reference());
    const project = { ...makeEmptyProject(), research: { REF: reference() } };
    const owned = enforceStorageOwnership(library, project);
    expect(owned.library.research.REF.title).toBe('Prop research');
    expect(owned.project).not.toHaveProperty('research');
  });

  it('supports independent table cells, customizable columns and rows without turning values into game logic', () => {
    const original = table(), changed = setReferenceCell(original, 'R1', 'value', '35');
    expect(changed.rows[0].cells).toEqual({ name: 'Cloth', value: '35', unit: 'm' });
    expect(original.rows[0].cells.value).toBe('20');
    const removed = removeReferenceColumn(changed, 'unit');
    expect(removed.columns.map(column => column.id)).toEqual(['name', 'value']);
    expect(removed.rows.every(row => !('unit' in row.cells))).toBe(true);
    expect(changed.rows[1].cells.unit).toBe('m');
  });

  it('preserves media and panel order and makes deletion undoable', () => {
    const rows = [{ id: '1' }, { id: '2' }, { id: '3' }];
    expect(moveReferenceRow(rows, '2', -1).map(row => row.id)).toEqual(['2', '1', '3']);
    expect(moveReferenceRow(rows, '1', -1)).toBe(rows);
    const library = { research: { REF: reference() } };
    const removed = undoableReducer({ present: library, past: [] }, { type: 'DELETE_ENTITY', coll: 'research', id: 'REF' });
    expect(removed.present.research.REF).toBeUndefined();
    expect(undoableReducer(removed, { type: 'UNDO' }).present.research.REF).toEqual(library.research.REF);
  });

  it('round-trips embedded assets, tables, credits and linked character IDs through complete workspace backups', () => {
    const backup = createWorkspaceBackup({ ...makeLibrarySeed(), research: { REF: reference() } }, { ...makeEmptyProject(), nodes: { C: character() } });
    const restored = readWorkspaceBackup(JSON.stringify(backup));
    expect(restored.library.research.REF).toEqual(backup.library.research.REF);
    expect(restored.project.nodes.C.mediaGallery).toEqual(character().mediaGallery);
    expect(restored.project.nodes.C.researchIds).toEqual(['REF']);
  });

  it('retains gallery data through independent library templates, clipboard copies and undo without changing the portrait or prose', () => {
    const node = character(), template = wizardLibraryRecord(node, 'LIB-C').entity.template;
    template.mediaGallery[0].caption = 'Changed in template';
    expect(node.mediaGallery[0].caption).toBe('Blue cloak');
    const copy = remapCanvasClipboard(createCanvasClipboard({ C: node }, [], ['C']), {});
    expect(copy.nodes[copy.idMap.C].mediaGallery).toEqual(node.mediaGallery);
    const original = { present: { ...makeEmptyProject(), nodes: { C: node } }, past: [] };
    const changed = undoableReducer(original, { type: 'UPDATE_ENTITY', coll: 'nodes', id: 'C', patch: { mediaGallery: [] } });
    expect(changed.present.nodes.C.image).toEqual(image);
    expect(changed.present.nodes.C.body).toBe(node.body);
    expect(undoableReducer(changed, { type: 'UNDO' }).present.nodes.C.mediaGallery).toEqual(node.mediaGallery);
  });

  it('searches source credits, attachment names and table values', () => {
    const haystack = referenceSearchText(reference());
    for (const term of ['an author', 'portrait.png', 'cloth', '20', 'example.com/source']) expect(haystack).toContain(term);
  });

  it('allows ordinary web links and blocks executable or local-file URLs', () => {
    expect(safeReferenceUrl('https://example.com/watch?v=1')).toBe('https://example.com/watch?v=1');
    for (const value of ['javascript:alert(1)', 'data:text/html,a', 'file:///C:/private/file', 'not a URL']) expect(safeReferenceUrl(value)).toBe('');
  });

  it('keeps large or video binaries out of embedded uploads', () => {
    expect(() => validateReferenceFile({ name: 'small.pdf', size: 100, type: 'application/pdf' })).not.toThrow();
    expect(() => validateReferenceFile({ size: 9 * 1024 * 1024, type: 'image/png' })).toThrow('8 MB');
    expect(() => validateReferenceFile({ size: 100, type: 'video/mp4' })).toThrow('links');
    expect(() => validateReferenceFile({ size: 100, type: 'application/pdf' }, true)).toThrow('image files');
  });

  it('exports media notes without image binaries and leaves the full prose output unchanged', () => {
    const node = character();
    expect(characterMediaText(node)).toContain('Greeting · Play at dusk · Credit: The actor');
    const ai = characterExport(node, {}, 'ai');
    expect(ai).toContain('## Media reference notes');
    expect(ai).toContain('https://example.com/greeting.mp4');
    expect(ai).not.toContain('base64');
    expect(characterExport(node, {}, 'full')).toBe(node.body);
  });
});
