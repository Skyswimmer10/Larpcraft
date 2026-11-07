import React, { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PrimIcon } from './bits.jsx';
import NarrativeSourceSymbol from './NarrativeSourceSymbol.jsx';
import LibraryAssetCard from './LibraryAssetCard.jsx';

const matchesQuery = (item, query) => {
  if (!query) return true;
  return `${item.label || ''} ${item.blurb || ''} ${item.kicker || ''}`.toLowerCase().includes(query);
};

export function filterLibrarySections(sections, query = '', category = 'all') {
  const q = query.trim().toLowerCase();
  return sections.filter(section => category === 'all' || section.id === category).map(section => ({ ...section, items: (section.items || []).filter(item => matchesQuery(item, q)) }));
}

export default function NarrativeLibraryBrowser({
  sections,
  onClose,
  title = 'Library Browser',
  subtitle = 'Browse reusable templates, references, and structures.',
  emptyMessage = 'No library records match this search.',
  categoryPane = false,
  categoryLabel = 'Created content categories',
  cardVariant = 'reference',
  showEmptySections = false,
  inline = false,
  headerAction,
  hideHeader = false,
  toolbarAction,
  searchLabel = 'Search library',
  searchPlaceholder = 'Search library...',
  categoryHeading = 'Categories',
  allCategoryLabel = 'All content',
  renderItem,
  emptyMessages = {},
}) {
  const [query, setQuery] = useState('');
  const [closed, setClosed] = useState(false);
  const [category, setCategory] = useState('all');
  const [categoriesCollapsed, setCategoriesCollapsed] = useState(false);
  const categoryListId = useId();
  const body = useRef(null);
  const close = (e) => {
    e?.stopPropagation?.();
    setClosed(true);
    onClose?.();
  };
  const q = query.trim().toLowerCase();
  const searchedSections = filterLibrarySections(sections, q);
  const activeCategory = categoryPane && sections.some(section => section.id === category) ? category : 'all';
  const visibleSections = searchedSections.filter(section => (activeCategory === 'all' || section.id === activeCategory) && (!categoryPane || showEmptySections || section.items.length));
  const empty = visibleSections.every((section) => section.items.length === 0);
  const chooseCategory = id => { setCategory(id); body.current?.scrollTo({ top: 0 }); };
  if (closed) return null;

  const content = <div className={`${inline ? 'library-browser library-browser-inline' : 'modal library-browser'}${cardVariant === 'asset' ? ' library-browser-assets' : ''}`} role={inline ? 'region' : 'dialog'} aria-modal={inline ? undefined : true} aria-label={title} onClick={(e) => e.stopPropagation()}>
        {!hideHeader && <div className={inline ? 'mhead library-browser-head' : 'modalhead library-browser-head'}>
          <div>
            {inline ? <h2>{title}</h2> : <b>{title}</b>}
            {subtitle && <small>{subtitle}</small>}
          </div>
          {headerAction}
          {!inline && <button className="x big" onClick={close} aria-label="Close">×</button>}
        </div>}
        {toolbarAction ? <div className="library-browser-toolbar"><input className="search wide" placeholder={searchPlaceholder} aria-label={searchLabel} value={query} onChange={event => setQuery(event.target.value)} />{toolbarAction}</div> : <input
          className="search wide"
          autoFocus={!inline}
          placeholder={searchPlaceholder}
          aria-label={searchLabel}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />}
        <div className={`library-browser-layout${categoryPane ? ` has-categories${categoriesCollapsed ? ' categories-collapsed' : ''}` : ''}`}>
          {categoryPane && <nav className="library-browser-categories" aria-label={categoryLabel}>
            <div className="library-browser-category-head">
              {!categoriesCollapsed && <b>{categoryHeading}</b>}
              <button type="button" className="library-browser-category-toggle" aria-label={categoriesCollapsed ? 'Show categories' : 'Hide categories'} title={categoriesCollapsed ? 'Show categories' : 'Hide categories'} aria-expanded={!categoriesCollapsed} aria-controls={categoryListId} onClick={() => setCategoriesCollapsed(value => !value)}><span aria-hidden="true">{categoriesCollapsed ? '›' : '‹'}</span></button>
            </div>
            <div className="library-browser-category-list" id={categoryListId} hidden={categoriesCollapsed}>
            <button type="button" className={activeCategory === 'all' ? 'on' : ''} aria-pressed={activeCategory === 'all'} onClick={() => chooseCategory('all')}><PrimIcon icon="layers" size={15} /><b>{allCategoryLabel}</b><span>{searchedSections.reduce((count, section) => count + section.items.length, 0)}</span></button>
            {searchedSections.map(section => <button type="button" key={section.id} className={activeCategory === section.id ? 'on' : ''} aria-pressed={activeCategory === section.id} onClick={() => chooseCategory(section.id)}><PrimIcon icon={section.icon || 'layers'} size={15} /><b>{section.label}</b><span>{section.items.length}</span></button>)}
            </div>
          </nav>}
        <div className={`library-browser-body${cardVariant === 'asset' ? ' library-asset-body' : ''}`} ref={body}>
          {visibleSections.map((section) => (
            <section className="library-browser-section" key={section.id}>
              <div className="library-browser-section-head">
                <div>
                  <b>{section.label}</b>
                  {section.hint && <small>{section.hint}</small>}
                </div>
                <div className="library-browser-section-actions"><span>{section.items.length}</span>{section.action}</div>
              </div>
              {section.toolbar && <div className="library-browser-section-toolbar">{section.toolbar}</div>}
              {section.items.length > 0 ? (
                <div className={cardVariant === 'asset' ? 'library-asset-grid' : 'library-browser-grid'}>
                  {section.items.map((item) => (
                    renderItem ? <React.Fragment key={item.id}>{renderItem(item)}</React.Fragment> : cardVariant === 'asset' ? <LibraryAssetCard key={item.id} item={item} onPick={() => {
                      item.onPick?.();
                      if (!inline) onClose?.();
                    }} /> :
                    <button
                      key={item.id}
                      className={`library-browser-card${item.symbolSource ? ` library-browser-reference ${item.symbolType}` : ''}`}
                      style={{ '--accent': item.symbolSource && item.symbolType === 'framework' ? '#73b892' : item.symbolSource && item.symbolType === 'concept' ? '#c29360' : item.color || '#8B7BF5' }}
                      onClick={() => {
                        item.onPick?.();
                        if (!inline) onClose?.();
                      }}
                    >
                      {item.symbolSource ? <span className="library-browser-emblem"><NarrativeSourceSymbol source={item.symbolSource} type={item.symbolType} /></span> : item.image?.dataUrl ? <img className="library-browser-image" src={item.image.dataUrl} alt="" /> : <span className="library-browser-icon">
                        <PrimIcon icon={item.icon || 'layers'} color="#fff" size={16} />
                      </span>}
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
          {empty && (!showEmptySections || !visibleSections.length) && <div className="empty">{q ? emptyMessages.search || 'No library records match this search.' : activeCategory !== 'all' ? emptyMessages.category || 'No saved content in this category yet.' : emptyMessage}</div>}
        </div>
        </div>
      </div>;
  return inline ? content : createPortal(<div className="modal-backdrop" onClick={close}>{content}</div>, document.body);
}
