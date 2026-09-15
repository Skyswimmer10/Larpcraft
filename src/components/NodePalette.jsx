import React from 'react';
import { createPortal } from 'react-dom';
import { PrimIcon } from './bits.jsx';
import { useAppearance } from './AppearanceContext.jsx';

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
  const { refreshed } = useAppearance();
  const [closedGroups, setClosedGroups] = React.useState({});
  const [paletteWidth, setPaletteWidth] = React.useState(280);
  const [tooltip, setTooltip] = React.useState(null);
  const tooltipTimer = React.useRef(null);
  const tooltipId = React.useId();
  const hideTooltip = () => { clearTimeout(tooltipTimer.current); tooltipTimer.current = setTimeout(() => setTooltip(null), 160); };
  const showTooltip = (event, item) => {
    if (!refreshed || !item.blurb) return;
    clearTimeout(tooltipTimer.current);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({ ...item, x: Math.max(12, Math.min(rect.right + 12, window.innerWidth - 372)), y: Math.max(12, Math.min(rect.top, window.innerHeight - 300)) });
  };
  React.useEffect(() => {
    const clear = () => setTooltip(null);
    const key = event => { if (event.key === 'Escape') clear(); };
    window.addEventListener('keydown', key);
    window.addEventListener('resize', clear);
    return () => { clearTimeout(tooltipTimer.current); window.removeEventListener('keydown', key); window.removeEventListener('resize', clear); };
  }, []);
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
    <aside className="nodepal" style={refreshed ? { '--palette-width': `${paletteWidth}px` } : undefined}>
      {refreshed && <div className="palette-resizer" role="separator" aria-label="Resize node palette" aria-orientation="vertical" tabIndex={0}
        aria-valuemin={240} aria-valuemax={420} aria-valuenow={paletteWidth}
        onKeyDown={event => { if (['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); setPaletteWidth(value => Math.max(240, Math.min(420, value + (event.key === 'ArrowRight' ? 20 : -20)))); } }}
        onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.dataset.startX = event.clientX; event.currentTarget.dataset.startWidth = paletteWidth; }}
        onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) setPaletteWidth(Math.max(240, Math.min(420, Number(event.currentTarget.dataset.startWidth) + event.clientX - Number(event.currentTarget.dataset.startX)))); }}
        onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }} />}
      <div className="nodepal-head">
        <div>
          <span className="nodepal-kind">Nodes</span>
          <b>{refreshed ? title.replace('NodeStructureBuilder', 'Structure Builder') : title}</b>
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
      <div className="nodepal-body" onScroll={() => setTooltip(null)}>
        {visibleGroups.map((group) => (
          <section className="nodepal-group" key={group.id}>
            {refreshed ? <button className="nodepal-label group-toggle" aria-expanded={!closedGroups[group.id] || Boolean(q)} onClick={() => setClosedGroups(value => ({ ...value, [group.id]: !value[group.id] }))}>{closedGroups[group.id] && !q ? '▸' : '▾'} {group.label}<span>{group.items.length}</span></button> : <div className="nodepal-label">{group.label}</div>}
            {(!refreshed || !closedGroups[group.id] || q) && <>
            {group.hint && <div className="nodepal-hint">{group.hint}</div>}
            <div className="nodepal-grid">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  className={`nodepal-card${item.compact ? ' compact' : ''}`}
                  style={{ '--accent': item.color || '#8B7BF5' }}
                  draggable={Boolean(item.dragPayload)}
                  onDragStart={(e) => {
                    setTooltip(null);
                    if (!item.dragPayload) return;
                    e.dataTransfer.setData('text/x-palette', item.dragPayload);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={(event) => { setTooltip(null); item.onClick?.(event); }}
                  onMouseEnter={event => showTooltip(event, item)}
                  onMouseLeave={hideTooltip}
                  onFocus={event => showTooltip(event, item)}
                  onBlur={hideTooltip}
                  aria-describedby={refreshed && tooltip?.id === item.id ? tooltipId : undefined}
                  title={refreshed ? undefined : item.blurb}
                >
                  <span className="nodepal-wash"><PrimIcon icon={item.icon || 'flag'} color="currentColor" size={44} /></span>
                  <span className="nodepal-icon"><PrimIcon icon={item.icon || 'flag'} color="#fff" size={15} /></span>
                  <span className="nodepal-title">{item.label}</span>
                  {item.blurb && <span className="nodepal-copy">{item.blurb}</span>}
                  {item.kicker && <span className="nodepal-kicker">{item.kicker}</span>}
                </button>
              ))}
            </div>
            </>}
          </section>
        ))}
        {visibleGroups.every((g) => g.items.length === 0) && (
          <div className="nodepal-empty">No matching nodes.</div>
        )}
      </div>
      {footer && <div className="nodepal-footer">{footer}</div>}
      {refreshed && tooltip && createPortal(<div id={tooltipId} role="tooltip" className="palette-description-popup" style={{ left: tooltip.x, top: tooltip.y, maxHeight: `calc(100vh - ${tooltip.y + 12}px)` }} onMouseEnter={() => clearTimeout(tooltipTimer.current)} onMouseLeave={hideTooltip}><strong>{tooltip.label}</strong><p>{tooltip.blurb}</p></div>, document.body)}
    </aside>
  );
}
