// Paragraph ownership is deliberately one way: prose edits never infer answers.
const paragraphs = value => (value || '').split(/\n\s*\n/).map(text => text.trim()).filter(Boolean);
const keyFor = (sourceKey, sourceIndex) => JSON.stringify([sourceKey, sourceIndex]);

export function generatedDescriptionParagraphs(blocks = []) {
  const seen = new Set(), rows = [];
  for (const block of blocks) {
    const text = block.text?.trim();
    if (!text || seen.has(text.toLocaleLowerCase())) continue;
    seen.add(text.toLocaleLowerCase());
    paragraphs(text).forEach((text, sourceIndex) => rows.push({ id: keyFor(block.key, sourceIndex), sourceKey: block.key, sourceIndex, generated: text, text }));
  }
  return rows;
}

export const descriptionParagraphText = rows => rows.filter(row => row.text).map(row => row.text).join('\n\n');

export function syncDescriptionParagraphs(rows, blocks) {
  const generated = generatedDescriptionParagraphs(blocks);
  const candidates = new Map(generated.map(row => [keyFor(row.sourceKey, row.sourceIndex), row]));
  const seen = new Set();
  const next = [];
  for (const row of rows) {
    if (!row.sourceKey) { next.push(row); continue; }
    const key = keyFor(row.sourceKey, row.sourceIndex), candidate = candidates.get(key);
    seen.add(key);
    const updated = candidate?.text || '';
    if (row.text === row.generated) {
      if (candidate) next.push({ ...row, generated: updated, text: updated, pending: undefined });
    } else {
      next.push({ ...row, pending: updated !== row.generated ? updated : undefined });
    }
  }
  for (const row of generated) if (!seen.has(keyFor(row.sourceKey, row.sourceIndex))) {
    const last = next.findLastIndex(other => other.sourceKey === row.sourceKey);
    if (last < 0) next.push(row); else next.splice(last + 1, 0, row);
  }
  return next;
}

// Exact matches anchor the edit. Equal-size gaps are rewrites. Ambiguous merges
// and splits remain authored text, with deleted-source markers for later review.
export function editDescriptionParagraphs(previous, value) {
  const visible = previous.filter(row => row.text), nextText = paragraphs(value);
  const lengths = Array.from({ length: visible.length + 1 }, () => Array(nextText.length + 1).fill(0));
  for (let i = visible.length - 1; i >= 0; i--) for (let j = nextText.length - 1; j >= 0; j--) {
    lengths[i][j] = visible[i].text === nextText[j] ? lengths[i + 1][j + 1] + 1 : Math.max(lengths[i + 1][j], lengths[i][j + 1]);
  }
  const anchors = [];
  let i = 0, j = 0;
  while (i < visible.length && j < nextText.length) {
    if (visible[i].text === nextText[j]) { anchors.push([i++, j++]); }
    else if (lengths[i + 1][j] >= lengths[i][j + 1]) i++; else j++;
  }
  anchors.push([visible.length, nextText.length]);
  const usedIds = new Set(previous.map(row => row.id)), result = previous.filter(row => !row.text && row.sourceKey);
  let serial = 1, oldStart = 0, newStart = 0;
  const custom = text => { while (usedIds.has('authored:' + serial)) serial++; const id = 'authored:' + serial++; usedIds.add(id); return { id, text }; };
  for (const [oldEnd, newEnd] of anchors) {
    const oldGap = visible.slice(oldStart, oldEnd), newGap = nextText.slice(newStart, newEnd);
    if (oldGap.length === newGap.length) result.push(...oldGap.map((row, index) => ({ ...row, text: newGap[index] })));
    else {
      result.push(...oldGap.filter(row => row.sourceKey).map(row => ({ ...row, text: '', ...(newGap.length ? { layoutChanged: true } : {}) })));
      result.push(...newGap.map(custom));
    }
    if (oldEnd < visible.length) result.push(visible[oldEnd]);
    oldStart = oldEnd + 1; newStart = newEnd + 1;
  }
  return result;
}

export function resolveDescriptionParagraph(rows, id, accept, editedText) {
  return rows.map(row => row.id !== id || row.pending === undefined ? row : {
    ...row, generated: row.pending, text: editedText ?? (accept ? row.pending : row.text), pending: undefined,
  });
}
