const clampEndpoint = (fixed, moving, minLength) => {
  const dx = moving.x - fixed.x;
  const dy = moving.y - fixed.y;
  const length = Math.hypot(dx, dy);
  if (length >= minLength) return moving;
  const fallback = length > 0 ? { x: dx / length, y: dy / length } : { x: 1, y: 0 };
  return { x: fixed.x + fallback.x * minLength, y: fixed.y + fallback.y * minLength };
};

// Arrow storage uses (x, y) as the tail and (x + w, y + h) as the head.
// Moving either endpoint therefore produces a complete, absolute geometry.
export function arrowEndpointGeometry(frame, endpoint, point, minLength = 30) {
  const tail = { x: frame.x, y: frame.y };
  const head = { x: frame.x + frame.w, y: frame.y + frame.h };
  if (endpoint === 'tail') {
    const nextTail = clampEndpoint(head, point, minLength);
    return {
      x: Math.round(nextTail.x), y: Math.round(nextTail.y),
      w: Math.round(head.x - nextTail.x), h: Math.round(head.y - nextTail.y),
    };
  }
  const nextHead = clampEndpoint(tail, point, minLength);
  return {
    x: Math.round(tail.x), y: Math.round(tail.y),
    w: Math.round(nextHead.x - tail.x), h: Math.round(nextHead.y - tail.y),
  };
}

// Spline control points are stored as offsets from the line midpoint, so the
// curve keeps its shape when the whole support object moves.
export function splineControlOffset(frame, point) {
  return {
    curveX: Math.round(point.x - (frame.x + frame.w / 2)),
    curveY: Math.round(point.y - (frame.y + frame.h / 2)),
  };
}
