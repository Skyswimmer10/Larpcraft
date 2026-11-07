import React, { useEffect, useRef, useState } from 'react';
import { useGame, useDispatch } from '../state/store.jsx';
import { ENTITY_COLORS } from './bits.jsx';
import { STAGE_W, STAGE_H } from '../data/seed.js';
import LocationAnnotationPanel, { LocationAnnotationLayer } from './LocationAnnotations.jsx';
import { mapRows, mapAudienceVisible, mapZoneRect, moveMapAnnotation, resizeMapZone, updateMapOverlay, removeMapOverlay, anchorMapAnnotation, projectMapAnnotation } from '../lib/locationAnnotations.js';

// ---------------- OpenStreetMap base layer (outdoor locations) ----------------
// Plain slippy-tile math, no map library. Tiles come straight from
// tile.openstreetmap.org; when the network blocks them (e.g. the hosted
// artifact's sandbox) the stage falls back to the grid and everything else
// keeps working.
const toTile = (lat, lon, z) => {
  const n = 2 ** z;
  const x = ((lon + 180) / 360) * n;
  const rad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n;
  return { x, y };
};
const fromPx = (px, py, z) => {
  const n = 2 ** z;
  const lon = (px / (256 * n)) * 360 - 180;
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * py) / (256 * n)))) * 180) / Math.PI;
  return { lat, lon };
};

function OsmLayer({ osm, blocked, onBlocked }) {
  const ref = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const tiles = [];
  if (size.w && !blocked) {
    const n = 2 ** osm.zoom;
    const c = toTile(osm.lat, osm.lon, osm.zoom);
    const left = c.x * 256 - size.w / 2;
    const top = c.y * 256 - size.h / 2;
    for (let tx = Math.floor(left / 256); tx * 256 < left + size.w; tx++) {
      for (let ty = Math.floor(top / 256); ty * 256 < top + size.h; ty++) {
        if (ty < 0 || ty >= n) continue;
        const wx = ((tx % n) + n) % n;
        tiles.push({
          key: `${osm.zoom}:${tx}:${ty}`,
          src: `https://tile.openstreetmap.org/${osm.zoom}/${wx}/${ty}.png`,
          l: tx * 256 - left, t: ty * 256 - top,
        });
      }
    }
  }
  return (
    <div className="osmlayer" ref={ref}>
      {tiles.map((t) => <img key={t.key} src={t.src} style={{ left: t.l, top: t.t }} alt="" draggable={false} onError={onBlocked} />)}
      {blocked && <div className="osmblocked">Street map tiles can't load here (offline / sandboxed).<br />Markers and arrows still work — run the app locally for live maps.</div>}
      <span className="osmattr">© OpenStreetMap contributors</span>
    </div>
  );
}

// ---------------- The stage: base layer + markers + movement arrows ----------------
export default function LocationStage({ location, onBack, onSelect }) {
  const s = useGame();
  const dispatch = useDispatch();
  return <LocationStageEditor location={location} onBack={onBack} onSelect={onSelect} game={s} dispatch={dispatch} />;
}

export function LocationStageEditor({ location, onBack, onSelect, game: s, dispatch }) {
  const stageRef = useRef(null);
  const [tool, setTool] = useState('move');
  const [pending, setPending] = useState(null); // marker waiting for a click: {kind, refId}
  const [drawing, setDrawing] = useState(null); // arrow preview {x1,y1,x2,y2}
  const [tilesBlocked, setTilesBlocked] = useState(false);
  const dragRef = useRef(null);
  const suppressMarkerClick = useRef(false);
  const [dragPreview, setDragPreview] = useState(null);
  const [selected, setSelected] = useState(null), [notesOpen, setNotesOpen] = useState(false);
  const [audience, setAudience] = useState('facilitator');
  const [stageSize, setStageSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const element = stageRef.current;
    const measure = () => { const rect = element.getBoundingClientRect(); setStageSize({ w: rect.width, h: rect.height }); };
    measure();
    const observer = new ResizeObserver(measure); observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const editing = audience !== 'player';
  const interactive = editing && tool === 'move' && !pending;
  const markers = mapRows(location, 'markers'), arrows = mapRows(location, 'arrows');
  const projectedLocation = location.mapKind === 'osm' ? { ...location, mapLabels: mapRows(location, 'mapLabels').map(row => projectMapAnnotation(row, location.osm, stageSize)), mapZones: mapRows(location, 'mapZones').map(row => projectMapAnnotation(row, location.osm, stageSize)) } : location;
  const displayLocation = dragPreview ? { ...projectedLocation, [dragPreview.collection]: mapRows(projectedLocation, dragPreview.collection).map(row => row.id === dragPreview.row.id ? dragPreview.row : row) } : projectedLocation;

  const patch = (p) => {
    dispatch({ type: 'UPDATE_ENTITY', coll: 'locations', id: location.id, patch: p });
    dispatch({ type: 'END_UNDO_GROUP' });
  };
  const chooseTool = next => { setTool(next); setPending(null); setDrawing(null); setDragPreview(null); dragRef.current = null; };
  const selectNote = selection => { setSelected(selection); setNotesOpen(true); };
  const anchor = row => {
    const rect = stageRef.current.getBoundingClientRect();
    return location.mapKind === 'osm' ? anchorMapAnnotation(row, location.osm, { w: rect.width, h: rect.height }) : { ...row, osmAnchor: undefined };
  };
  const changeNote = (collection, id, changes) => {
    const row = mapRows(projectedLocation, collection).find(item => item.id === id);
    const geometry = ['mapLabels', 'mapZones'].includes(collection) && ['x', 'y', 'w', 'h'].some(key => key in changes);
    patch(updateMapOverlay(location, collection, id, geometry && row ? anchor({ ...row, ...changes }) : changes));
  };
  const removeNote = (collection, id) => { patch(removeMapOverlay(location, collection, id)); setSelected(null); };
  const newId = prefix => `${prefix}:${crypto.randomUUID()}`;

  const stagePoint = (e) => {
    const r = stageRef.current.getBoundingClientRect();
    return {
      x: Math.min(STAGE_W, Math.max(0, ((e.clientX - r.left) / r.width) * STAGE_W)),
      y: Math.min(STAGE_H, Math.max(0, ((e.clientY - r.top) / r.height) * STAGE_H)),
    };
  };
  const round1 = (v) => Math.round(v * 10) / 10;

  const markerMeta = (m) => {
    if (m.kind === 'item') { const it = s.items[m.refId]; return it && { name: it.name, color: ENTITY_COLORS.item }; }
    if (m.kind === 'sensor') { const sen = s.sensors[m.refId]; return sen && { name: sen.id, color: ENTITY_COLORS.sensor }; }
    const n = s.nodes[m.refId]; return n && { name: n.title, color: n.color || ENTITY_COLORS[n.kind] };
  };

  // Placing a marker also wires the game state: items deploy here, sensors move here.
  const placeMarker = (p) => {
    const id = newId('M');
    const marker = { id, kind: pending.kind, refId: pending.refId, x: round1(p.x), y: round1(p.y) };
    const extra = pending.kind === 'sensor' && !(location.sensorIds || []).includes(pending.refId)
      ? { sensorIds: [...(location.sensorIds || []), pending.refId] } : {};
    patch({ markers: [...markers, marker], ...extra });
    if (pending.kind === 'item') dispatch({ type: 'DEPLOY_ITEM', itemId: pending.refId, locationId: location.id });
    if (pending.kind === 'sensor') dispatch({ type: 'UPDATE_ENTITY', coll: 'sensors', id: pending.refId, patch: { locationId: location.id } });
    setPending(null);
  };

  // stage-level pointer handlers: place pending marker, or draw an arrow
  const onStageDown = (e) => {
    if (!editing || e.button !== 0 || e.target.closest('[data-map-overlay], .marker')) return;
    const p = stagePoint(e);
    if (pending) { placeMarker(p); return; }
    if (tool === 'label') {
      const label = anchor({ id: newId('L'), text: 'New label', x: round1(p.x), y: round1(p.y), color: '#e8d25c', audience: 'all' });
      patch({ mapLabels: [...mapRows(location, 'mapLabels'), label] });
      selectNote({ collection: 'mapLabels', id: label.id }); setTool('move'); return;
    }
    if (tool === 'arrow' || tool === 'zone') {
      setDrawing({ x1: p.x, y1: p.y, x2: p.x, y2: p.y });
      e.currentTarget.setPointerCapture(e.pointerId);
    } else setSelected(null);
  };
  const onStageMove = (e) => {
    if (dragRef.current) {
      const drag = dragRef.current, p = stagePoint(e);
      const dx = p.x - drag.start.x, dy = p.y - drag.start.y;
      if (Math.hypot(dx, dy) > 0.4) drag.moved = true;
      setDragPreview({ collection: drag.collection, row: drag.resize ? resizeMapZone(drag.row, p) : moveMapAnnotation(drag.row, dx, dy) });
      return;
    }
    if (drawing) { const p = stagePoint(e); setDrawing((d) => ({ ...d, x2: p.x, y2: p.y })); }
  };
  const onStageUp = (e) => {
    if (dragRef.current) {
      const drag = dragRef.current, p = stagePoint(e);
      const dx = p.x - drag.start.x, dy = p.y - drag.start.y;
      const moved = drag.moved || Math.hypot(dx, dy) > 0.4;
      if (moved) changeNote(drag.collection, drag.row.id, drag.resize ? resizeMapZone(drag.row, p) : moveMapAnnotation(drag.row, dx, dy));
      suppressMarkerClick.current = moved && drag.collection === 'markers';
      if (!moved) setNotesOpen(true);
      dragRef.current = null; setDragPreview(null); return;
    }
    if (!drawing) return;
    const p = stagePoint(e);
    if (tool === 'zone') {
      const rect = mapZoneRect({ x: drawing.x1, y: drawing.y1 }, p);
      if (rect.w >= 2 && rect.h >= 2) {
        const zone = anchor({ id: newId('Z'), name: 'New zone', ...rect, color: '#79c9a5', audience: 'all' });
        patch({ mapZones: [...mapRows(location, 'mapZones'), zone] });
        selectNote({ collection: 'mapZones', id: zone.id }); setTool('move');
      }
    } else if (Math.hypot(p.x - drawing.x1, p.y - drawing.y1) > 4) {
      patch({ arrows: [...arrows, { id: newId('A'), x1: round1(drawing.x1), y1: round1(drawing.y1), x2: round1(p.x), y2: round1(p.y) }] });
    }
    setDrawing(null);
  };

  // marker dragging (move tool)
  const onOverlayDown = (e, collection, row, resize = false) => {
    if (!interactive || e.button !== 0) return;
    e.stopPropagation();
    suppressMarkerClick.current = false;
    setSelected({ collection, id: row.id });
    dragRef.current = { collection, row, start: stagePoint(e), resize, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const cancelGesture = () => { dragRef.current = null; setDragPreview(null); setDrawing(null); };

  // OSM pan/zoom controls
  const panBy = (dx, dy) => {
    const c = toTile(location.osm.lat, location.osm.lon, location.osm.zoom);
    const next = fromPx(c.x * 256 + dx, c.y * 256 + dy, location.osm.zoom);
    patch({ osm: { ...location.osm, lat: round1(next.lat * 10000) / 10000 || next.lat, lon: next.lon } });
  };
  const zoomBy = (dz) => patch({ osm: { ...location.osm, zoom: Math.min(19, Math.max(3, location.osm.zoom + dz)) } });
  const setCoords = () => {
    const v = window.prompt('Center coordinates as "lat, lon":', `${location.osm.lat}, ${location.osm.lon}`);
    if (!v) return;
    const [lat, lon] = v.split(',').map((x) => parseFloat(x.trim()));
    if (Number.isFinite(lat) && Number.isFinite(lon)) patch({ osm: { ...location.osm, lat, lon } });
  };

  const placedIds = new Set(markers.map((m) => `${m.kind}:${m.refId}`));
  const arrowHead = (a) => {
    const ang = Math.atan2(a.y2 - a.y1, a.x2 - a.x1);
    const L = 3.4;
    return `M ${a.x2} ${a.y2} L ${a.x2 - L * Math.cos(ang - 0.45)} ${a.y2 - L * Math.sin(ang - 0.45)} M ${a.x2} ${a.y2} L ${a.x2 - L * Math.cos(ang + 0.45)} ${a.y2 - L * Math.sin(ang + 0.45)}`;
  };

  return (
    <div className="main">
      <div className="mhead">
        <div>
          <div className="crumb"><button className="linkbtn" onClick={onBack}>← Locations</button></div>
          <h2>{location.name} <span className="mono dim" style={{ fontSize: 12 }}>{location.id}</span></h2>
        </div>
        <div className="right">
          <div className="viewtog">
            <button disabled={!editing} className={location.mapKind === 'schematic' ? 'on' : ''} onClick={() => patch({ mapKind: 'schematic' })}>Room schematic</button>
            <button disabled={!editing} className={location.mapKind === 'osm' ? 'on' : ''} onClick={() => patch({ mapKind: 'osm' })}>Street map</button>
          </div>
        </div>
      </div>

      <div className="toolrow location-stage-toolbar">
        {editing && <><select aria-label="Place map marker" className="chip-add" value="" onChange={(e) => {
          const [kind, refId] = e.target.value.split('|');
          if (kind) { setPending({ kind, refId }); setTool('move'); }
        }}>
          <option value="">＋ Place marker…</option>
          <optgroup label="Items">
            {Object.values(s.items).filter((i) => !placedIds.has(`item:${i.id}`)).map((i) => <option key={i.id} value={`item|${i.id}`}>{i.name} · {i.id}</option>)}
          </optgroup>
          <optgroup label="Sensors">
            {Object.values(s.sensors).filter((x) => !placedIds.has(`sensor:${x.id}`)).map((x) => <option key={x.id} value={`sensor|${x.id}`}>{x.id} — {x.kind}</option>)}
          </optgroup>
          <optgroup label="Narrative nodes">
            {Object.values(s.nodes).filter((n) => !placedIds.has(`node:${n.id}`)).map((n) => <option key={n.id} value={`node|${n.id}`}>{n.title}</option>)}
          </optgroup>
        </select>
        {[['move', '↔ Move'], ['label', 'T Add label'], ['zone', '▧ Draw zone'], ['arrow', '↗ Movement arrow']].map(([id, label]) => <button type="button" className={`chip${tool === id && !pending ? ' on' : ''}`} key={id} aria-pressed={tool === id && !pending} onClick={() => chooseTool(id)}>{label}</button>)}
        <button type="button" className="chip" aria-expanded={notesOpen} onClick={() => setNotesOpen(value => !value)}>Map notes {notesOpen ? '▴' : '▾'}</button></>}
        <div className="viewtog map-audience-toggle" aria-label="Map audience"><button type="button" className={editing ? 'on' : ''} aria-pressed={editing} onClick={() => setAudience('facilitator')}>Facilitator edit</button><button type="button" className={!editing ? 'on' : ''} aria-pressed={!editing} onClick={() => { chooseTool('move'); setSelected(null); setAudience('player'); }}>Player preview</button></div>
        {pending && <span className="csvmsg">Click on the map to place the marker</span>}
        {tool === 'arrow' && !pending && <span className="dim" style={{ fontSize: 11.5 }}>Drag to draw an arrow. Select it with Move to edit or delete.</span>}
        {tool === 'label' && <span className="dim">Click on the map to place a label.</span>}
        {tool === 'zone' && <span className="dim">Drag a rectangle, then name the zone in Map notes.</span>}
        {!editing && <span className="dim">Player view · facilitator-only notes, markers and arrows are hidden.</span>}
        {location.mapKind === 'osm' && editing && (
          <span className="osmctl">
            <button className="btn ghost small" onClick={() => panBy(0, -128)}>↑</button>
            <button className="btn ghost small" onClick={() => panBy(0, 128)}>↓</button>
            <button className="btn ghost small" onClick={() => panBy(-128, 0)}>←</button>
            <button className="btn ghost small" onClick={() => panBy(128, 0)}>→</button>
            <button className="btn ghost small" onClick={() => zoomBy(1)}>＋</button>
            <button className="btn ghost small" onClick={() => zoomBy(-1)}>−</button>
            <button className="btn ghost small" onClick={setCoords}>Set coords…</button>
            <span className="mono dim">z{location.osm.zoom}</span>
          </span>
        )}
      </div>

      <div className="location-stage-layout"><div className="stagewrap">
        <div
          className={`stage${pending || tool === 'label' ? ' placing' : ''}${tool === 'arrow' || tool === 'zone' ? ' drawing' : ''}${!editing ? ' map-player-preview' : ''}`}
          ref={stageRef}
          onPointerDown={onStageDown} onPointerMove={onStageMove} onPointerUp={onStageUp} onPointerCancel={cancelGesture}
        >
          {location.mapKind === 'osm'
            ? <OsmLayer osm={location.osm} blocked={tilesBlocked} onBlocked={() => setTilesBlocked(true)} />
            : location.schematic?.dataUrl
              ? <img className="schematic" src={location.schematic.dataUrl} alt="" draggable={false} />
              : <div className="schematic empty"><b>No schematic uploaded</b><span>Add a floor plan under "Room schematic" in the panel on the right — the cover image is separate. Markers and arrows work meanwhile.</span></div>}

          <LocationAnnotationLayer location={displayLocation} audience={audience} selected={editing ? selected : null} interactive={interactive} onDrag={onOverlayDown} onSelect={selectNote} />
          {drawing && tool === 'zone' && (() => { const rect = mapZoneRect({ x: drawing.x1, y: drawing.y1 }, { x: drawing.x2, y: drawing.y2 }); return <div className="map-zone-preview" style={{ left: `${rect.x / STAGE_W * 100}%`, top: `${rect.y / STAGE_H * 100}%`, width: `${rect.w / STAGE_W * 100}%`, height: `${rect.h / STAGE_H * 100}%` }} />; })()}
          <svg className="stagesvg" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} preserveAspectRatio="none">
            {arrows.filter(row => mapAudienceVisible(row, audience)).map((a) => (
              <g key={a.id} className={`parrow${editing && selected?.collection === 'arrows' && selected.id === a.id ? ' selected' : ''}`} role={interactive ? 'button' : undefined} tabIndex={interactive ? 0 : undefined} aria-label="Movement arrow" onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectNote({ collection: 'arrows', id: a.id }); } }} onPointerDown={(e) => { if (interactive) { e.stopPropagation(); selectNote({ collection: 'arrows', id: a.id }); } }}>
                <path d={`M ${a.x1} ${a.y1} L ${a.x2} ${a.y2} ${arrowHead(a)}`} className="arrowline" />
                {/* Selection hitbox is inert while placing or drawing. */}
                <path d={`M ${a.x1} ${a.y1} L ${a.x2} ${a.y2}`} className="arrowhit"
                  style={{ pointerEvents: interactive ? 'stroke' : 'none' }} />
              </g>
            ))}
            {drawing && tool === 'arrow' && <path d={`M ${drawing.x1} ${drawing.y1} L ${drawing.x2} ${drawing.y2} ${arrowHead(drawing)}`} className="arrowline preview" />}
          </svg>

          {mapRows(displayLocation, 'markers').filter(row => mapAudienceVisible(row, audience)).map((m) => {
            const meta = markerMeta(m);
            if (!meta) return null;
            return (
              <div key={m.id} className="marker" style={{ left: `${(m.x / STAGE_W) * 100}%`, top: `${(m.y / STAGE_H) * 100}%`, pointerEvents: interactive ? 'auto' : 'none' }}
                onPointerDown={(e) => onOverlayDown(e, 'markers', m)}
                onClick={() => { if (!interactive || suppressMarkerClick.current) { suppressMarkerClick.current = false; return; } if (m.kind === 'item') onSelect?.({ kind: 'item', id: m.refId }); else if (m.kind === 'node') onSelect?.({ kind: 'node', id: m.refId }); }}>
                <span className="mdot" style={{ background: meta.color }} />
                <span className="mlabel" style={{ borderColor: meta.color }}>{meta.name}
                  {editing && <button className="x" title="Remove marker" aria-label={`Remove marker: ${meta.name}`} onPointerDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); removeNote('markers', m.id); }}>×</button>}
                </span>
              </div>
            );
          })}
        </div>
      </div>{editing && notesOpen && <LocationAnnotationPanel location={displayLocation} selected={selected} onSelect={selectNote} onChange={changeNote} onRemove={removeNote} markerName={row => markerMeta(row)?.name || row.refId || 'Missing marker reference'} storyLocations={Object.values(s.nodes).filter(node => node.kind === 'storyLocation')} />}</div>

      <div className="statusbar">
        <span><b>{markers.filter(row => mapAudienceVisible(row, audience)).length}</b> markers · <b>{arrows.filter(row => mapAudienceVisible(row, audience)).length}</b> arrows · <b>{mapRows(location, 'mapLabels').filter(row => mapAudienceVisible(row, audience)).length}</b> labels · <b>{mapRows(location, 'mapZones').filter(row => mapAudienceVisible(row, audience)).length}</b> zones{editing && ' · Changes save with this location. Undo restores deleted notes.'}</span>
      </div>
    </div>
  );
}
