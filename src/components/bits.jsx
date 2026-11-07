import React from 'react';

export const ENTITY_COLORS = {
  story: '#5CA8F5', narrative: '#5CA8F5',
  location: '#43BF87',
  enemy: '#E86464',
  objective: '#E0A23C', item: '#E0A23C', artifact: '#E0A23C', gadget: '#3EC6D6', consumable: '#E88F8F',
  mechanic: '#A87BF0',
  sensor: '#3EC6D6',
  // Narrative v2 typed nodes.
  beat: '#5CA8F5', reveal: '#F08CB4', branch: '#E0A23C', fact: '#3EC6D6', converge: '#A87BF0', timed: '#E8D25C', recovery: '#E86464',
  // Tasks + task-detail node types.
  task: '#5BC0BE', travel: '#E0A23C', placement: '#43BF87', rule: '#E0A23C', prop: '#3EC6D6', power: '#A87BF0', effect: '#F08CB4',
  // Narrative Weaver base nodes + concept containers.
  storyBeat: '#5CA8F5', event: '#5CA8F5', character: '#E0A23C', storyLocation: '#43BF87', quest: '#A87BF0', concept: '#E8D25C', framework: '#E8D25C',
  group: '#73CCB2',
};

export const AVAILABILITY = {
  ready: { label: 'Ready', cls: 'p-ok' },
  'in-use': { label: 'In use', cls: 'p-info' },
  deployed: { label: 'Deployed', cls: 'p-purple' },
  missing: { label: 'Missing', cls: 'p-bad' },
};

export const BUILD_STEPS = ['concept', 'design', 'build', 'tested', 'packed'];

export function Pill({ availability }) {
  const a = AVAILABILITY[availability] ?? { label: availability, cls: '' };
  return <span className={`pill ${a.cls}`}><i />{a.label}</span>;
}

export function Chip({ color, children, onClick, onRemove, title }) {
  return (
    <span className={`lchip${onClick ? ' clickable' : ''}`} onClick={onClick} title={title}>
      <span className="sq" style={{ background: color }} />
      {children}
      {onRemove && <button className="x" onClick={(e) => { e.stopPropagation(); onRemove(); }} aria-label="Remove">×</button>}
    </span>
  );
}

export function SectionLabel({ children }) {
  return <div className="lab">{children}</div>;
}

// Designated icons for Narrative Primitives.
const PRIM_PATHS = {
  arrival: <><path d="M13 3h7v18h-7M3 12h12M10 7l5 5-5 5"/><path d="M17 12h.1"/></>,
  departure: <><path d="M10 3H3v18h7M9 12h12M16 7l5 5-5 5"/><path d="M6 12h.1"/></>,
  delivery: <><path d="M9 3l11 5v11H9L4 16V6l5-3zM9 8h11M9 8v11M4 6l5 2M14 6v5"/><path d="M1 11h4M1 14h4"/></>,
  candle: <><path d="M9 11h6v10H9zM7 21h10M12 11V8"/><path d="M12 2c-1 3-4 3-3 5a3 3 0 006 0c0-2-2-3-3-5z"/></>,
  reunion: <><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="7" r="2.5"/><path d="M3 17v-3a4 4 0 018 0v3M13 17v-3a4 4 0 018 0v3M7 21h10M14 18l3 3-3 2"/></>,
  rings: <><circle cx="8" cy="14" r="5.5"/><circle cx="16" cy="14" r="5.5"/><path d="M6 5l2-3 2 3-2 3-2-3zM14 5l2-3 2 3-2 3-2-3z"/></>,
  celebration: <><path d="M3 21l4-13 9 9-13 4zM7 8l9 9M12 7l2-4M17 10l4-2M17 5l2-2M19 15h3M8 2v2"/><circle cx="20" cy="2.5" r=".5"/></>,
  handover: <><path d="M2 15h4l3-3h4a2 2 0 010 4h-3M6 19h9l6-5-2-2M2 20h4v-6M12 3h7v6h-7zM15.5 3v3"/></>,
  'life-ring': <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M5.6 5.6l3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6"/></>,
  escape: <><path d="M3 20V4h8v4M3 20h8v-5M8 12h13M17 8l4 4-4 4"/><path d="M7 5v3"/></>,
  escort: <><circle cx="8" cy="6" r="2.5"/><path d="M3 18v-5a5 5 0 0110 0v5M7 18v4M10 18v4M15 10h7M19 7l3 3-3 3"/></>,
  recover: <><path d="M4 9a8 8 0 111 10M4 4v5h5"/><path d="M10 11h7v7h-7zM13.5 11v3"/></>,
  theft: <><path d="M3 20l4-4 2-6a1.5 1.5 0 013 1v3l2-2 5-1a2 2 0 012 3l-5 5-7 2M3 16l5 5"/><path d="M14 3l3-2 3 2-3 4-3-4z"/></>,
  sabotage: <><path d="M5 3l2 5-3 3 4 4-2 6M20 3l-4 5 3 4-5 4 2 5M10 3l4 4M3 20l4-2M20 18l2 3"/><path d="M12 9l-3 5h4l-1 4 5-7h-4l1-2"/></>,
  badge: <><path d="M12 2l3 3 4 1v5l-1 4-6 5-6-5-1-4V6l4-1 3-3z"/><path d="M12 7l1 2 2 .4-1.5 1.5.4 2.1-1.9-1-1.9 1 .4-2.1L9 9.4l2-.4 1-2z"/></>,
  'user-minus': <><circle cx="8" cy="7" r="3"/><path d="M2 21v-3a6 6 0 0112 0v3M16 9h6"/></>,
  inheritance: <><path d="M5 2h10l4 4v6M15 2v4h4M5 2v17h5M8 7h4M8 10h5"/><path d="M13 14h9v7h-9zM17.5 14v7M12 14h11v-3H12zM17.5 11c-4 0-4-4-2-3l2 3c4 0 4-4 2-3l-2 3z"/></>,
  exile: <><path d="M3 3h7v18H3M13 11h9M18 7l4 4-4 4"/><ellipse cx="14" cy="19" rx="1.5" ry="2"/><ellipse cx="19" cy="21" rx="1.5" ry="1"/></>,
  'user-check': <><circle cx="8" cy="7" r="3"/><path d="M2 21v-3a6 6 0 0112 0v3M15 10l3 3 5-6"/></>,
  chair: <><path d="M7 13V4a3 3 0 013-3h4a3 3 0 013 3v9M4 10v7h16v-7M7 17v5M17 17v5M7 13h10"/></>,
  'return-path': <path d="M9 4L3 10l6 6M3 10h10a5 5 0 010 10h-2"/>,
  'status-down': <><path d="M4 4l4 4 4-3 8 10M15 15h5v-5M4 21h16M4 17h8"/></>,
  inspection: <><circle cx="10" cy="10" r="7"/><path d="M15 15l6 6M6 10l3 3 5-6"/></>,
  gavel: <><path d="M13 4l7 7M10 7l7 7M12 3l9 9-3 3-9-9 3-3zM11 12l-7 7 2 2 7-7M13 20h9v3h-9z"/></>,
  flame: <path d="M12 2c1 6 7 6 7 12a7 7 0 01-14 0c0-3 2-6 4-8v6c4-2 4-6 3-10z"/>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 018 0v4M12 14v3"/></>,
  ballot: <><path d="M3 12h18v9H3zM7 16h10M5 12V8h3M19 12V8h-3"/><path d="M9 2l9 4-4 8-9-4 4-8zM9 7l1 2 4-2"/></>,
  deed: <><path d="M5 2h10l4 4v15H5zM15 2v4h4M8 8h7M8 11h5"/><circle cx="12" cy="16" r="2.5"/><path d="M10 18l-1 4 3-2 3 2-1-4"/></>,
  parcels: <><path d="M8 2h8v7H8zM12 2v3M2 14h8v7H2zM6 14v3M14 14h8v7h-8zM18 14v3M12 10v2M6 12h12"/></>,
  medal: <><circle cx="12" cy="15" r="6"/><path d="M8 9L4 2h6l2 4 2-4h6l-4 7M12 12v6M10 15h4"/></>,
  'split-gift': <><path d="M7 7h10v7H7zM6 7h12V4H6zM12 4v10M12 4c-5 0-5-4-2-3l2 3c5 0 5-4 2-3l-2 3zM12 16v3M4 21v-2h16v2"/></>,
  house: <><path d="M2 11L12 2l10 9M5 9v12h14V9M10 21v-7h4v7"/></>,
  hierarchy: <><rect x="9" y="2" width="6" height="5" rx="1"/><path d="M12 7v6M5 13h14M5 13v3M19 13v3"/><rect x="2" y="16" width="6" height="5" rx="1"/><rect x="16" y="16" width="6" height="5" rx="1"/></>,
  key: <><circle cx="7" cy="8" r="4.5"/><path d="M10 11l11 11M15 16l3-3M18 19l3-3"/></>,
  check: <path d="M4 12l5 5L21 5"/>,
  filter: <path d="M3 4h18l-7 8v7l-4 2v-9L3 4z"/>,
  ear: <><path d="M5 10a7 7 0 1112 5c-3 2-2 6-6 6a4 4 0 01-4-4M9 10a3 3 0 116 0c0 2-3 2-3 5"/></>,
  shield: <><path d="M12 2l8 3v7c0 5-8 10-8 10S4 17 4 12V5l8-3zM8 12l3 3 5-6"/></>,
  star: <path d="m12 3 2.8 5.7 6.3.9-4.55 4.45 1.07 6.28L12 17.36l-5.62 2.97 1.07-6.28L2.9 9.6l6.3-.9L12 3z" />,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="M16 16l5 5" /></>,
  wrench: <path d="M14 4a5 5 0 00-5 7L3.5 16.5a2.8 2.8 0 004 4L13 15a5 5 0 007-5l-3 3-4-4 3-3z" />,
  wrenches: <>{[0, 11].map(x => <g key={x} transform={`translate(${x} 0)`}><path d="M3 3v5h4V3a4 4 0 012 7l-2 1v8a2 2 0 01-4 0v-8l-2-1a4 4 0 012-7z" /></g>)}</>,
  workflow: <><rect x="3" y="3" width="7" height="6" rx="1.5" /><rect x="14" y="15" width="7" height="6" rx="1.5" /><path d="M6.5 9v9H14M11 15l3 3-3 3" /></>,
  dice: <><rect x="3.5" y="3.5" width="17" height="17" rx="3" /><circle cx="8" cy="8" r=".8" /><circle cx="16" cy="8" r=".8" /><circle cx="12" cy="12" r=".8" /><circle cx="8" cy="16" r=".8" /><circle cx="16" cy="16" r=".8" /></>,
  pulse: <><path d="M3 18V5M3 18h18M5 13l4-5 4 7 6-10" /></>,
  branches: <><circle cx="6" cy="5" r="2" /><circle cx="18" cy="12" r="2" /><circle cx="6" cy="19" r="2" /><path d="M6 7v10M6 9c0 3 6 3 10 3" /></>,
  rules: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 3h6v3H9zM8 11l1 1 2-2M13 11h3M8 16l1 1 2-2M13 16h3" /></>,
  flag: <path d="M6 21V4h12l-2.5 4L18 12H6" />,
  pin: <><path d="M12 21s-6.5-5.4-6.5-10a6.5 6.5 0 0113 0c0 4.6-6.5 10-6.5 10z" /><circle cx="12" cy="10.6" r="2.3" /></>,
  zap: <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />,
  swap: <><path d="M4 8h13l-3-3M20 16H7l3 3" /></>,
  cog: <><circle cx="12" cy="12" r="3.2" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2 2M16.5 16.5l2 2M18.5 5.5l-2 2M7.5 16.5l-2 2" /></>,
  cross: <path d="M5 5l14 14M19 5L5 19" />,
  trash: <><path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/></>,
  alert: <><path d="M12 3l10 18H2L12 3z" /><path d="M12 10v5M12 18.4v.3" /></>,
  clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
  user: <><circle cx="12" cy="8" r="3.4" /><path d="M5 20c1.2-3.6 4-5.4 7-5.4s5.8 1.8 7 5.4" /></>,
  users: <><circle cx="8" cy="8" r="2.7" /><circle cx="16" cy="8" r="2.7" /><path d="M2.5 20c.8-3.4 2.8-5.2 5.5-5.2s4.7 1.8 5.5 5.2M10.5 20c.8-3.4 2.8-5.2 5.5-5.2s4.7 1.8 5.5 5.2" /></>,
  box: <><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" /><path d="M12 12l8-4.5M12 12L4 7.5M12 12v9" /></>,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /></>,
  book: <><path d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5v-15z" /><path d="M4 20.5A2.5 2.5 0 016.5 18H20" /></>,
  layers: <><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></>,
  link: <><path d="M9.5 14.5l5-5" /><path d="M7.5 16.5l-1 1a3.5 3.5 0 01-5-5l3-3a3.5 3.5 0 015 0" /><path d="M16.5 7.5l1-1a3.5 3.5 0 015 5l-3 3a3.5 3.5 0 01-5 0" /></>,
  heart: <path d="M12 20s-7-4.6-7-9.3C5 7.6 7 5.7 9.4 5.7c1.2 0 2.3.8 2.6 1.8.3-1 1.4-1.8 2.6-1.8C17 5.7 19 7.6 19 10.7c0 4.7-7 9.3-7 9.3z" />,
};

export function PrimIcon({ icon, color, size = 15 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"
      style={{ color, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', flex: 'none' }}>
      {PRIM_PATHS[icon] ?? <rect x="5" y="5" width="14" height="14" rx="3" />}
    </svg>
  );
}

// Clickable build pipeline: Concept → … → Packed
export function BuildFlow({ value, onChange }) {
  return (
    <div className="flow">
      {BUILD_STEPS.map((step) => {
        const idx = BUILD_STEPS.indexOf(step);
        const cur = BUILD_STEPS.indexOf(value);
        const cls = idx < cur ? 'done' : idx === cur ? 'now' : '';
        return (
          <button key={step} className={cls} onClick={() => onChange?.(step)} title={`Set build status: ${step}`}>
            {step}
          </button>
        );
      })}
    </div>
  );
}

// Placeholder art when an item/location has no uploaded image yet.
export function Placeholder({ type, big }) {
  const color = ENTITY_COLORS[type] || '#8B92A6';
  return (
    <div className={`ph${big ? ' big' : ''}`} style={{ color }}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {type === 'artifact' && <><circle cx="8" cy="8" r="4.5" /><path d="M11.5 11.5L20 20M16.5 16.5l2-2" /></>}
        {type === 'gadget' && <><rect x="6" y="4" width="12" height="16" rx="2.5" /><path d="M9 8h6M9 11h6M10 17h4" /></>}
        {type === 'consumable' && <><rect x="4" y="6" width="16" height="14" rx="2.5" /><path d="M12 10.5v5M9.5 13h5" /></>}
        {type === 'location' && <><path d="M12 21s-6.5-5.4-6.5-10a6.5 6.5 0 0113 0c0 4.6-6.5 10-6.5 10z" /><circle cx="12" cy="10.6" r="2.3" /></>}
        {!['artifact', 'gadget', 'consumable', 'location'].includes(type) && <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M4 15l4-4 5 5 3-3 4 4" /></>}
      </svg>
    </div>
  );
}

// Renders an uploaded image (photo/SVG data URL) or a 3D-model badge, else placeholder.
export function Thumb({ image, type, big }) {
  if (image?.kind === 'model') {
    return (
      <div className={`ph model${big ? ' big' : ''}`}>
        <svg viewBox="0 0 24 24"><path d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2z" /><path d="M12 2v9m0 0l8-4.5M12 11L4 6.5" /></svg>
        <small>{image.name}</small>
      </div>
    );
  }
  if (image?.dataUrl) return <img className={`thumb-img${big ? ' big' : ''}`} src={image.dataUrl} alt="" />;
  return <Placeholder type={type} big={big} />;
}
