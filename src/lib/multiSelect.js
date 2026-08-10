export function shiftToggleSelection(currentSelection, activeId, clickedId) {
  const next = new Set(currentSelection || []);
  if (next.size === 0 && activeId) next.add(activeId);
  if (next.has(clickedId)) next.delete(clickedId);
  else next.add(clickedId);
  return next;
}
