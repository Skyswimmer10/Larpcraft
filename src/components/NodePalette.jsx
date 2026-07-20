import React from 'react';
import { PrimIcon } from './bits.jsx';

export default function NodePalette({
  title = 'NodeStructureBuilder',
  subtitle,
  search,
  onSearch,
  groups = [],
  filters = [],
  activeFilter = 'all',
  onFilter,
  lane,
  teams = [],
  onLane,
  headerAction,
  footer,
}) {
  const [collapsed, setCollapsed] = React.useState(false);
  const q = (search || '').trim().toLowerCase();
  const visibleGroups = groups.map((group) => ({
    ...group,
    items: (group.items || []).filter((item) => {
      if (!q) return true;
      return `${item.label} ${item.blurb || ''} ${item.kicker || ''}`.toLowerCase().includes(q);
    }),
  }));

  if (collapsed) {
    return (
      <aside className="nodepal collapsed">
        <button className="nodepal-toggle" onClick={() => setCollapsed(false)} title="Open node structure builder" aria-label="Open node structure builder">
          <PrimIcon icon="layers" color="currentColor" size={15} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="nodepal">
      <div className="nodepal-head">
        <div>
          <span className="nodepal-kind">Nodes</span>
          <b>{title}</b>
          {subtitle && <small>{subtitle}</small>}
        </div>
        <div className="nodepal-actions">
          {headerAction}
          <button className="nodepal-toggle" onClick={() => setCollapsed(true)} title="Collapse node structure builder" aria-label="Collapse node structure builder">
            <PrimIcon icon="layers" color="currentColor" size={15} />
          </button>
        </div>
      </div>
      {onSearch && (
        <input
          className="field-input nodepal-search"
          placeholder="Search nodes..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      )}
      {onFilter && filters.length > 0 ? (
        <div className="nodepal-lanes">
          {filters.map((filter) => (
            <button
              key={filter.id}
              className={`lanetab${activeFilter === filter.id ? ' on' : ''}`}
              onClick={() => onFilter(filter.id)}
              title={filter.label}
            >
              {filter.color && <span className="sq" style={{ background: filter.color }} />}
              {filter.label}
            </button>
          ))}
        </div>
      ) : onLane && teams.length > 0 && (
        <div className="nodepal-lanes">
          <button className={`lanetab${lane === 'all' ? ' on' : ''}`} onClick={() => onLane('all')}>All</button>
          {teams.map((t) => (
            <button key={t.id} className={`lanetab${lane === t.id ? ' on' : ''}`} onClick={() => onLane(t.id)} title={t.name}>
              <span className="sq" style={{ background: t.color }} />{t.name.replace(/^Team\s+/i, '')}
            </button>
          ))}
        </div>
      )}
      <div className="nodepal-body">
        {visibleGroups.map((group) => (
          <section className="nodepal-group" key={group.id}>
            <div className="nodepal-label">{group.label}</div>
            {group.hint && <div className="nodepal-hint">{group.hint}</div>}
            <div className="nodepal-grid">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  className={`nodepal-card${item.compact ? ' compact' : ''}`}
                  style={{ '--accent': item.color || '#8B7BF5' }}
                  draggable={Boolean(item.dragPayload)}
                  onDragStart={(e) => {
                    if (!item.dragPayload) return;
                    e.dataTransfer.setData('text/x-palette', item.dragPayload);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={item.onClick}
                  title={item.blurb}
                >
                  <span className="nodepal-wash"><PrimIcon icon={item.icon || 'flag'} color="currentColor" size={44} /></span>
                  <span className="nodepal-icon"><PrimIcon icon={item.icon || 'flag'} color="#fff" size={15} /></span>
                  <span className="nodepal-title">{item.label}</span>
                  {item.blurb && <span className="nodepal-copy">{item.blurb}</span>}
                  {item.kicker && <span className="nodepal-kicker">{item.kicker}</span>}
                </button>
              ))}
            </div>
          </section>
        ))}
        {visibleGroups.every((g) => g.items.length === 0) && (
          <div className="nodepal-empty">No matching nodes.</div>
        )}
      </div>
      {footer && <div className="nodepal-footer">{footer}</div>}
    </aside>
  );
}
