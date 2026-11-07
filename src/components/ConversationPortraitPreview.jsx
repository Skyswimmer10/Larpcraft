import React, { useEffect, useRef, useState } from 'react';
import { ConversationIcon } from './ConversationIcons.jsx';
import { participantIconFallback } from '../lib/conversationIcons.js';

// Coordinates are relative to the dialogue pane, never the page or scroll area.
export function portraitPreviewPosition(anchor, bounds, size) {
  const gap = 12, inset = 8;
  const right = anchor.right - bounds.left + gap;
  const left = anchor.left - bounds.left - size.width - gap;
  const preferred = right + size.width <= bounds.width - inset ? right : left;
  return {
    left: Math.max(inset, Math.min(preferred, bounds.width - size.width - inset)),
    top: Math.max(inset, Math.min(anchor.top - bounds.top - 20, bounds.height - size.height - inset)),
  };
}

export default function ConversationPortraitPreview({ preview, participant, person, profile, container, boundary, onPin, onClose, onEnter, onLeave }) {
  const card = useRef(null);
  const [position, setPosition] = useState(null);
  useEffect(() => {
    const element = container.current, area = boundary.current, popup = card.current;
    if (!element || !area || !popup || !preview.anchor.isConnected) return;
    const place = () => {
      const bounds = area.getBoundingClientRect(), origin = element.getBoundingClientRect();
      const next = portraitPreviewPosition(preview.anchor.getBoundingClientRect(), bounds, popup.getBoundingClientRect());
      setPosition({ left: next.left + bounds.left - origin.left, top: next.top + bounds.top - origin.top, maxHeight: Math.max(0, bounds.height - 16), width: Math.min(210, bounds.width - 16) });
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(element); observer.observe(area); observer.observe(popup);
    // A pinned portrait remains in view while the transcript scrolls.
    element.addEventListener('scroll', place, true);
    return () => { observer.disconnect(); element.removeEventListener('scroll', place, true); };
  }, [preview.anchor, container, boundary]);
  return <section ref={card} className="cw-floating-profile" aria-label={`Portrait preview: ${person.name}`} style={{ ...position, visibility: position ? 'visible' : 'hidden' }} onMouseEnter={onEnter} onMouseLeave={event => { if (!event.currentTarget.contains(document.activeElement)) onLeave(); }} onFocus={onEnter} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) onLeave(); }}>
    <ConversationIcon value={participant.icon} fallback={participantIconFallback(profile, person.name)} label={`Enlarged portrait of ${person.name}`} size={210} className="cw-floating-image" />
    <footer><span><b>{person.name}</b>{profile.traits?.length > 0 && <small>{profile.traits.slice(0, 3).join(' · ')}</small>}</span><button type="button" className="cw-tool" aria-label={preview.pinned ? 'Unpin portrait preview' : 'Pin portrait preview'} title={preview.pinned ? 'Unpin portrait preview' : 'Keep portrait visible'} aria-pressed={preview.pinned} onClick={onPin}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 3 8 0-1 6 4 5H5l4-5-1-6ZM12 14v7" /></svg></button><button type="button" className="cw-tool" aria-label="Close portrait preview" title="Close preview" onClick={onClose}>×</button></footer>
  </section>;
}
