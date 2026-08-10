const rawEndpoint = (frame, endpoint) => endpoint === 'tail'
  ? { x: frame.x, y: frame.y }
  : { x: frame.x + frame.w, y: frame.y + frame.h };

export function resolveSupportEndpoint(frame, endpoint, context, seen = new Set()) {
  const fallback = rawEndpoint(frame, endpoint);
  const anchor = endpoint === 'tail' ? frame.tailAnchor : frame.headAnchor;
  if (!anchor || seen.has(frame.id)) return fallback;
  if (anchor.kind === 'node' || anchor.kind === 'title') {
    return context.resolveEntityAnchor(anchor) || fallback;
  }
  if (anchor.kind === 'support') {
    const target = context.supports?.[anchor.id];
    if (!target || !['arrow', 'spline'].includes(target.shape)) return fallback;
    const nextSeen = new Set(seen);
    nextSeen.add(frame.id);
    return resolveSupportEndpoint(target, anchor.endpoint === 'tail' ? 'tail' : 'head', context, nextSeen);
  }
  return fallback;
}

export function resolveSupportGeometry(frame, context) {
  if (!['arrow', 'spline'].includes(frame.shape)) return { x: frame.x, y: frame.y, w: frame.w, h: frame.h };
  const tail = resolveSupportEndpoint(frame, 'tail', context);
  const head = resolveSupportEndpoint(frame, 'head', context);
  return { x: tail.x, y: tail.y, w: head.x - tail.x, h: head.y - tail.y };
}
