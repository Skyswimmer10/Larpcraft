import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { PrimIcon } from './bits.jsx';

const matchesQuery = (item, query) => {
  if (!query) return true;
  return `${item.label || ''} ${item.blurb || ''} ${item.kicker || ''}`.toLowerCase().includes(query);
};

export default function NarrativeLibraryBrowser({
  sections,
  onClose,
  title = 'Library Browser',
  subtitle = 'Browse reusable templates, references, and structures.',
}) {
  const [query, setQuery] = useState('');
  const [closed, setClosed] = useState(false);
  const close = (e) => {
    e?.stopPropagation?.();
    setClosed(true);
    onClose();
  };
  const q = query.trim().toLowerCase();
  const visibleSections = sections.map((section) => ({
    ...section,
    items: (section.items || []).filter((item) => matchesQuery(item, q)),
  }));
  const empty = visibleSections.every((section) => section.items.length === 0);
  if (closed) return null;

  return createPortal(
    <div className="modal-backdrop" onClick={close}>
      <div className="modal library-browser" onClick={(e) => e.stopPropagation()}>
        <div className="modalhead library-browser-head">
          <div>
            <b>{title}</b>
            {subtitle && <small>{subtitle}</small>}
          </div>
          <button className="x big" onClick={close} aria-label="Close">×</button>
        </div>
        <input
          className="search wide"
          autoFocus
          placeholder="Search library..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="library-browser-body">
          {visibleSections.map((section) => (
            <section className="library-browser-section" key={section.id}>
              <div className="library-browser-section-head">
                <div>
                  <b>{section.label}</b>
                  {section.hint && <small>{section.hint}</small>}
                </div>
                <span>{section.items.length}</span>
              </div>
              {section.items.length > 0 ? (
                <div className="library-browser-grid">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      className="library-browser-card"
                      style={{ '--accent': item.color || '#8B7BF5' }}
                      onClick={() => {
                        item.onPick?.();
                        onClose();
                      }}
                    >
                      <span className="library-browser-icon">
                        <PrimIcon icon={item.icon || 'layers'} color="#fff" size={16} />
                      </span>
                      <span className="library-browser-card-main">
                        <b>{item.label}</b>
                        {item.blurb && <small>{item.blurb}</small>}
                      </span>
                      {item.kicker && <span className="library-browser-kicker">{item.kicker}</span>}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="library-browser-empty">No matches in this section.</div>
              )}
            </section>
          ))}
          {empty && <div className="empty">No library records match this search.</div>}
        </div>
      </div>
    </div>,
    document.body,
  );
}
