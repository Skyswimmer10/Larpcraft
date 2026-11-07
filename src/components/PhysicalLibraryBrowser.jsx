import React, { useState } from 'react';
import NarrativeLibraryBrowser from './NarrativeLibraryBrowser.jsx';
import TypeChips from './TypeChips.jsx';
import { ENTITY_COLORS } from './bits.jsx';

const CATEGORIES = [
  { id: 'items', label: 'Items & Gadgets', icon: 'box', addLabel: '+ New item template' },
  { id: 'locations', label: 'Locations', icon: 'pin', addLabel: '+ New location template' },
  { id: 'sensors', label: 'Sensor hardware', icon: 'zap', addLabel: '+ New sensor type' },
];

export function physicalLibrarySections(library, onPick, selectedId, typeFilter = 'all') {
  return CATEGORIES.map(category => ({ ...category, items: Object.values(library[category.id] || {})
    .filter(record => category.id !== 'items' || typeFilter === 'all' || record.type === typeFilter)
    .map(record => ({
      id: `${category.id}:${record.id}`, label: record.name || record.kind || record.id,
      blurb: record.description || record.label || '', image: record.image,
      thumbnailType: category.id === 'locations' ? 'location' : category.id === 'items' ? record.type || 'artifact' : undefined,
      icon: category.icon, color: ENTITY_COLORS.sensor,
      kicker: `Template · ${record.id}`, selected: selectedId === record.id,
      onPick: () => onPick(category.id, record.id),
    })) }));
}

export default function PhysicalLibraryBrowser({ library, onPick, onCreate, selectedId }) {
  const [typeFilter, setTypeFilter] = useState('all');
  const sections = physicalLibrarySections(library, onPick, selectedId, typeFilter).map(section => ({ ...section,
    action: <button type="button" className="btn tiny" onClick={() => onCreate(section.id)}>{section.addLabel}</button>,
    toolbar: section.id === 'items' ? <TypeChips value={typeFilter} onChange={setTypeFilter} totalLabel={`All types · ${Object.keys(library.items || {}).length}`} /> : null,
  }));
  return <NarrativeLibraryBrowser title="Library — Physical" subtitle="Real items, venues and sensor hardware."
    sections={sections} inline categoryPane categoryLabel="Physical content categories" cardVariant="asset" showEmptySections
    headerAction={<span className="libbadge">Templates — reusable across games</span>} />;
}
