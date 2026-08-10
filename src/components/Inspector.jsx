import React, { useState } from 'react';
import { useGame, useDispatch, useLibrary, useLibraryDispatch } from '../state/store.jsx';
import { resolveNode, itemsAssignedToPlayer, sensorsAssignedToPlayer, locateGraph, playersOfTeam } from '../state/reducer.js';
import { importItem, importLocation, importSensor, importStory, importNarrative, importMechPrimitive } from '../state/bridge.js';
import { Chip, SectionLabel, BuildFlow, Pill, ENTITY_COLORS, PrimIcon } from './bits.jsx';
import ImageUploader from './ImageUploader.jsx';
import {
  NARR_NODE_TYPES, NARRATIVE_KINDS, FACT_KINDS, TASK_DETAIL_TYPES,
  BASE_NODE_TYPES, BASE_KINDS, CONCEPT_INTERNAL_NODE_TYPES, MASTER_ACT_TYPE, ADDITIONAL_NODE_TYPES, SUBNODE_TYPES, SUBNODE_BLANK,
  GRADUATED_OUTCOMES, LOCATION_ARCHETYPES, FRAMEWORK_TYPES, MECHANIC_SUBNODE_TYPES,
  LIB_PREFIX, DEFAULT_CHARACTER_CARD_TEMPLATE, cloneCharacterCardTemplateForSettings, normalizeCharacterCard,
} from '../data/seed.js';
import { genId } from '../data/csvSchemas.js';
import {
  MARKER_LETTERS,
  VISUAL_MARKER_MAX_SIZE,
  VISUAL_MARKER_MIN_SIZE,
  visualMarkerLabel,
  visualMarkerPixelSize,
  visualMarkerScaleFromPixels,
} from '../lib/visualMarkers.js';
import { frameBackgroundOpacity } from '../lib/frameAppearance.js';
import { frameworkBaseSize } from '../lib/frameworkScale.js';
import { effectiveNodeBoxSize, normalizeNodeBoxDimension } from '../lib/nodeBoxSize.js';
import { CHARACTER_ARCHETYPE_COMBINATIONS_KIND, CHARACTER_ARCHETYPE_FACET_KIND, CHARACTER_SHADOW_SIDES, syncCharacterArchetypeGraph } from '../lib/characterArchetype.js';
import {
  buildNarrativeLinkInsertion,
  LINKING_NODE_KIND,
  LINK_TARGET_TYPES,
  narrativeLinkRecords,
  resolveNarrativeLink,
} from '../lib/narrativeLinks.js';
import {
  ACTION_MECHANISM_NODE_KIND,
  ACTION_PATTERN_SYSTEMS,
  actionMechanismNodePatch,
  updateActionPatternSelection,
} from '../data/actionMechanics.js';
import MechanismBrowser from './MechanismBrowser.jsx';

const minToTime = (m) => (Number.isFinite(m) ? `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}` : '');
const timeToMin = (t) => { const [h, m] = (t || '').split(':').map(Number); return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null; };
const baseTemplateMeta = (kind) => BASE_NODE_TYPES[kind] || (kind === 'masterAct' ? MASTER_ACT_TYPE : null);
const STORY_ITEM_TYPES = ['Artifact', 'Gadget', 'Consumable', 'Key', 'Status', 'Tool', 'Wearable'];
const CONCEPT_UNSET = 'unset';
const opt = (id, label) => ({ id, label });
const CONCEPT_CORE_SELECTS = {
  conceptType: [
    opt(CONCEPT_UNSET, 'Unset'),
    opt('theme', 'Theme'),
    opt('faction_ideology', 'Faction Ideology'),
    opt('lore_element', 'Lore Element'),
    opt('mystery_thread', 'Mystery Thread'),
    opt('symbolic_object', 'Symbolic Object'),
    opt('archetype_figure', 'Archetype Figure'),
    opt('value_conflict', 'Value Conflict'),
  ],
  status: [opt('seed', 'Seed'), opt('in_development', 'In Development'), opt('locked', 'Locked'), opt('retired', 'Retired')],
  primaryFunction: [
    opt(CONCEPT_UNSET, 'Unset'),
    opt('raise_stakes', 'Raise Stakes'),
    opt('hook_attention', 'Hook Attention'),
    opt('sustain_intrigue', 'Sustain Intrigue'),
    opt('moral_weight', 'Moral Weight'),
    opt('build_relatability', 'Build Relatability'),
    opt('explain_motivation', 'Explain Motivation'),
    opt('common_ground', 'Common Ground'),
    opt('clarify_mission', 'Clarify Mission'),
  ],
  storyPosition: [opt('setup', 'Setup'), opt('escalation', 'Escalation'), opt('payoff', 'Payoff'), opt('ambient_texture', 'Ambient Texture')],
};
const CONCEPT_TYPE_DEFAULT_MODULES = {
  theme: ['conflict_engine', 'universal_resonance'],
  faction_ideology: ['conflict_engine', 'rules_transgression', 'motivation_driver'],
  lore_element: ['order_chaos', 'information_mystery'],
  mystery_thread: ['information_mystery', 'conflict_engine'],
  symbolic_object: ['symbolic_anchor', 'information_mystery'],
  archetype_figure: ['universal_resonance', 'motivation_driver'],
  value_conflict: ['conflict_engine', 'rules_transgression'],
};
const CONCEPT_MODULES = {
  conflict_engine: {
    label: 'Conflict Engine',
    fields: [
      { key: 'conflictArena', label: 'Arena', type: 'select', options: [opt('against_self', 'Against Self'), opt('against_society', 'Against Society'), opt('against_world', 'Against World')] },
      { key: 'moralAxis', label: 'Moral Axis', type: 'multi', max: 2, options: [opt('care_harm', 'Care / Harm'), opt('fairness_cheating', 'Fairness / Cheating'), opt('liberty_oppression', 'Liberty / Oppression'), opt('authority_subversion', 'Authority / Subversion'), opt('loyalty_betrayal', 'Loyalty / Betrayal'), opt('purity_corruption', 'Purity / Corruption')] },
      { key: 'conflictShape', label: 'Shape', type: 'select', options: [opt('right_vs_wrong', 'Right vs Wrong'), opt('right_vs_right', 'Right vs Right'), opt('lesser_evil', 'Lesser Evil')] },
      { key: 'idealState', label: 'Ideal State', type: 'text', placeholder: "If this conflict didn't exist, what would the world look like?" },
      { key: 'fearedState', label: 'Feared State', type: 'text', placeholder: "If this conflict is lost, what's the worst version of the world?" },
      { key: 'resolutionStance', label: 'Resolution', type: 'select', options: [opt('must_resolve', 'Must Resolve'), opt('may_resolve', 'May Resolve'), opt('never_resolves', 'Never Resolves')] },
    ],
  },
  order_chaos: {
    label: 'Order - Chaos Position',
    fields: [
      { key: 'worldPole', label: 'World Pole', type: 'slider', min: -5, max: 5, left: 'Order / Known', right: 'Chaos / Unknown' },
      { key: 'giftOfState', label: 'Gift', type: 'text', placeholder: 'What does this state give the people living in it?' },
      { key: 'costOfState', label: 'Cost', type: 'text', placeholder: 'What does it deny them?' },
      { key: 'disruptionVector', label: 'Disruption', type: 'text', placeholder: 'What force could flip this concept toward the opposite pole?' },
    ],
  },
  information_mystery: {
    label: 'Information & Mystery',
    fields: [
      { key: 'hookType', label: 'Hook', type: 'select', options: [opt('secret', 'Secret'), opt('anomaly', 'Anomaly'), opt('irony', 'Irony'), opt('inconsistency', 'Inconsistency'), opt('none', 'None')] },
      { key: 'whatIsHidden', label: 'Hidden', type: 'text', placeholder: 'The specific fact, object, or truth being withheld' },
      { key: 'keeper', label: 'Keeper', type: 'nodeRef' },
      { key: 'costOfDiscovery', label: 'Cost', type: 'text', placeholder: 'What must a team spend, risk, or sacrifice to learn it?' },
      { key: 'discoveryPayoff', label: 'Payoff', type: 'text', placeholder: 'What can a team do once they know?' },
      { key: 'revealScope', label: 'Reveal Scope', type: 'select', options: [opt('one_team', 'One Team'), opt('spreads_by_rumor', 'Spreads by Rumor'), opt('global_broadcast', 'Global Broadcast')] },
    ],
  },
  rules_transgression: {
    label: 'Rules & Transgression',
    fields: [
      { key: 'ruleAtStake', label: 'Rule', type: 'text', placeholder: 'The law, custom, or taboo this concept centers on' },
      { key: 'ruleVisibility', label: 'Visibility', type: 'toggle', options: [opt('written', 'Written'), opt('unwritten', 'Unwritten')] },
      { key: 'breakerProfile', label: 'Breaker', type: 'select', options: [opt('rebel', 'Rebel'), opt('cheat', 'Cheat'), opt('both', 'Both')] },
      { key: 'intendedVerdict', label: 'Verdict', type: 'select', options: [opt('vindicated', 'Vindicated'), opt('punished', 'Punished'), opt('ambiguous', 'Ambiguous')] },
    ],
  },
  universal_resonance: {
    label: 'Universal Resonance',
    fields: [
      { key: 'universalTraits', label: 'Traits', type: 'multi', options: [opt('free_choice', 'Free Choice'), opt('cooperation_rivalry', 'Cooperation / Rivalry'), opt('say_do_gap', 'Say-Do Gap'), opt('fear_overcome', 'Fear Overcome'), opt('fairness_judgement', 'Fairness Judgement'), opt('rite_of_passage', 'Rite of Passage')] },
      { key: 'archetypeStage', label: 'Stage', type: 'select', options: [opt('novice', 'Novice'), opt('adventurer', 'Adventurer'), opt('elder', 'Elder'), opt('none', 'None')] },
      { key: 'archetypeShading', label: 'Shading', type: 'toggle', options: [opt('light', 'Light'), opt('shadow', 'Shadow')], enabledWhen: (m) => m.archetypeStage && m.archetypeStage !== 'none' },
      { key: 'passageMarked', label: 'Passage', type: 'text', placeholder: 'If this concept marks a transition, from what state to what state?' },
    ],
  },
  motivation_driver: {
    label: 'Motivation Driver',
    fields: [
      { key: 'driver', label: 'Driver', type: 'select', options: [opt('curiosity', 'Curiosity'), opt('caution', 'Caution'), opt('mastery_flow', 'Mastery Flow'), opt('aspiration', 'Aspiration'), opt('sacrifice', 'Sacrifice')] },
      { key: 'driverEvidence', label: 'Evidence', type: 'text', placeholder: 'What moment or detail proves this drive exists?' },
    ],
  },
  symbolic_anchor: {
    label: 'Symbolic Anchor',
    fields: [
      { key: 'anchorObject', label: 'Object', type: 'text', placeholder: 'The physical thing that embodies this concept' },
      { key: 'surfacePurpose', label: 'Surface Purpose', type: 'text', placeholder: 'What it obviously does' },
      { key: 'hiddenPurpose', label: 'Hidden Purpose', type: 'text', placeholder: 'What it secretly does or means' },
      { key: 'emotionalCharge', label: 'Charge', type: 'multi', options: [opt('trust', 'Trust'), opt('dread', 'Dread'), opt('nostalgia', 'Nostalgia'), opt('pride', 'Pride'), opt('guilt', 'Guilt'), opt('wonder', 'Wonder')] },
      { key: 'ritualPotential', label: 'Ritual', type: 'toggleText', placeholder: 'Can interacting with it become a repeatable ceremony at a station?' },
    ],
  },
  graph_connections: {
    label: 'Graph Connections',
    fields: [
      { key: 'factionAlignment', label: 'Factions', type: 'nodeRefs' },
      { key: 'relatedConcepts', label: 'Related Concepts', type: 'nodeRefs' },
      { key: 'surfacingIntent', label: 'Surfacing', type: 'multi', options: [opt('hub_narrative', 'Hub Narrative'), opt('spoke_station', 'Spoke Station'), opt('pre_event_lore', 'Pre-Event Lore'), opt('post_event_debrief', 'Post-Event Debrief')] },
      { key: 'pathTagHooks', label: 'Path Tags', type: 'tags', placeholder: 'State keys this concept can read or write' },
    ],
  },
};

function TextField({ label, value, onCommit, textarea, placeholder }) {
  const [draft, setDraft] = React.useState(value ?? '');
  React.useEffect(() => setDraft(value ?? ''), [value]);
  const commit = () => { if (draft !== (value ?? '')) onCommit(draft); };
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <div className="isect">
      <SectionLabel>{label}</SectionLabel>
      <Tag
        className="field-input" value={draft} placeholder={placeholder}
        rows={textarea ? 3 : undefined}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter' && !textarea) e.target.blur(); }}
      />
    </div>
  );
}

// Visual distinction between the two data worlds.
function InstanceBadge({ templateId }) {
  return (
    <div className="scopebadge instance">
      Game instance{templateId && <> of <span className="mono">{templateId}</span></>} — edits affect only this game.
    </div>
  );
}
function TemplateBadge() {
  return <div className="scopebadge template">Master template — edits update the blueprint for future games.</div>;
}

// "Import to Active Game" with inline confirmation of the created instance id.
function ImportButton({ build, label = 'Import to Active Game' }) {
  const proj = useGame();
  const lib = useLibrary();
  const dispatch = useDispatch();
  const [done, setDone] = useState(null);
  return (
    <div className="isect">
      <button className="btn primary wide" onClick={() => {
        const result = build(lib, proj);
        if (!result) return;
        dispatch({ type: 'IMPORT_FROM_LIBRARY', ...result });
        setDone(result.createdId);
        setTimeout(() => setDone(null), 5000);
      }}>{done ? `Imported ✓ ${done}` : `⤓ ${label}`}</button>
      <div className="hint">Duplicates this template into <b>{proj.meta.name}</b> with a new instance ID.</div>
    </div>
  );
}

function SaveItemTemplateButton({ item }) {
  const s = useGame();
  const lib = useLibrary();
  const libDispatch = useLibraryDispatch();
  const [savedId, setSavedId] = useState(null);
  const save = () => {
    const id = genId(lib.items || {}, LIB_PREFIX.items);
    const sensorReqs = (item.sensorReqs || []).map((req) => {
      const sensor = s.sensors?.[req.sensorId];
      return { sensorId: sensor?.templateId || req.sensorId, note: req.note || '' };
    });
    libDispatch({
      type: 'ADD_ENTITY',
      coll: 'items',
      entity: {
        id,
        name: item.name,
        type: item.type,
        description: item.description || '',
        propNotes: item.propNotes || '',
        loreNotes: item.loreNotes || '',
        origin: item.origin || '',
        persistsAcrossTasks: !!item.persistsAcrossTasks,
        mechanicIds: [...(item.mechanicIds || [])],
        sensorReqs,
        image: item.image ?? null,
      },
    });
    setSavedId(id);
    setTimeout(() => setSavedId(null), 5000);
  };
  return (
    <div className="isect">
      <button className="btn small" onClick={save}>{savedId ? `Saved to Library ✓ ${savedId}` : 'Save item to Library'}</button>
      <div className="hint">Creates a reusable item template from this game instance. This game item stays separate.</div>
    </div>
  );
}

function NodeImageField({ label = 'Image', image, onChange }) {
  const pick = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange({ dataUrl: reader.result, name: file.name, type: file.type });
    reader.readAsDataURL(file);
  };
  return (
    <div className="isect">
      <SectionLabel>{label}</SectionLabel>
      <div className="image-inline">
        {image?.dataUrl ? <img src={image.dataUrl} alt="" /> : <span>No image</span>}
        <label className="btn small">
          {image?.dataUrl ? 'Change image' : 'Upload image'}
          <input type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        {image?.dataUrl && <button className="linkbtn danger" onClick={() => onChange(null)}>Remove</button>}
      </div>
    </div>
  );
}

// ---- Item INSTANCE: the editable record for a physical prop in this game ----
function ItemPanel({ item, viaNode }) {
  const s = useGame();
  const lib = useLibrary();
  const dispatch = useDispatch();
  const upd = (patch) => dispatch({ type: 'UPDATE_ENTITY', coll: 'items', id: item.id, patch });
  const location = item.locationId ? s.locations[item.locationId] : null;
  const holder = item.assignedTo
    ? `${s.teams[item.assignedTo.teamId]?.name ?? '?'}${item.assignedTo.playerId ? ` · ${s.players[item.assignedTo.playerId]?.name}` : ''}`
    : null;
  const unusedSensors = Object.values(s.sensors).filter((x) => !item.sensorReqs.some((r) => r.sensorId === x.id));

  return (
    <>
      {viaNode && (
        <div className="via">Node <b>{viaNode.title}</b> → item record
          <button className="linkbtn" style={{ marginLeft: 'auto' }} title="Detach this node from the item"
            onClick={() => dispatch({ type: 'UPDATE_ENTITY', coll: 'nodes', id: viaNode.id, patch: { itemId: null } })}>Unlink</button>
        </div>
      )}
      <InstanceBadge templateId={item.templateId} />
      <SaveItemTemplateButton item={item} />
      <div className="ihead">
        <ImageUploader coll="items" entity={item} />
        <div className="ihrow">
          <h3>{item.name}</h3>
          <Pill availability={item.availability} />
        </div>
        <div className="sub mono">{item.id} · {item.type}</div>
      </div>

      <TextField label="Item name" value={item.name} onCommit={(v) => upd({ name: v })} />
      <div className="isect">
        <SectionLabel>Type</SectionLabel>
        <select className="field-input" value={item.type} onChange={(e) => upd({ type: e.target.value })}>
          {Object.values(lib.itemTypes).map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          {!lib.itemTypes[item.type] && <option value={item.type}>{item.type} (deleted type)</option>}
        </select>
      </div>
      <div className="isect">
        <SectionLabel>Build status</SectionLabel>
        <BuildFlow value={item.buildStatus} onChange={(v) => upd({ buildStatus: v })} />
      </div>
      <TextField label="Description · shown to players" textarea value={item.description} onCommit={(v) => upd({ description: v })} />
      <TextField label="Real-world prop · crew only" textarea value={item.propNotes} onCommit={(v) => upd({ propNotes: v })} />
      <TextField label="Origin" textarea value={item.origin} onCommit={(v) => upd({ origin: v })} />

      <div className="isect">
        <SectionLabel>Placement</SectionLabel>
        <select
          className="field-input"
          value={item.locationId ?? ''}
          onChange={(e) => e.target.value
            ? dispatch({ type: 'DEPLOY_ITEM', itemId: item.id, locationId: e.target.value })
            : upd({ locationId: null })}
        >
          <option value="">— not placed —</option>
          {Object.values(s.locations).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        {location && <div className="hint">Placing an item sets it to <b>Deployed</b> in the database.</div>}
      </div>

      {holder && (
        <div className="isect">
          <SectionLabel>Issued to</SectionLabel>
          <div className="chips">
            <Chip color="#5CA8F5">{holder}</Chip>
            <button className="linkbtn" onClick={() => dispatch({ type: 'UNASSIGN_ITEM', itemId: item.id })}>Return to stock</button>
          </div>
        </div>
      )}

      <div className="isect">
        <SectionLabel>Linked mechanics · from Library</SectionLabel>
        <div className="chips">
          {item.mechanicIds.map((id) => lib.mechanics[id] && (
            <Chip key={id} color={ENTITY_COLORS.mechanic} title={lib.mechanics[id].summary}
              onRemove={() => upd({ mechanicIds: item.mechanicIds.filter((m) => m !== id) })}>
              {lib.mechanics[id].name}
            </Chip>
          ))}
          <select className="chip-add" value="" onChange={(e) => e.target.value && upd({ mechanicIds: [...item.mechanicIds, e.target.value] })}>
            <option value="">+ link…</option>
            {Object.values(lib.mechanics).filter((m) => !item.mechanicIds.includes(m.id)).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>

      <div className="isect">
        <SectionLabel>Sensor requirements · hardware in this game</SectionLabel>
        <div className="senslist">
          {item.sensorReqs.map(({ sensorId, note }) => {
            const sen = s.sensors[sensorId];
            if (!sen) return null;
            return (
              <div className="sensrow" key={sensorId}>
                <span className="sq" style={{ background: ENTITY_COLORS.sensor }} />
                <div><b>{sen.id}</b> <span className="dim">{sen.kind} · {sen.battery}%</span>{note && <small>{note}</small>}</div>
                <span className={`sdot ${sen.status}`} title={sen.status} />
                <button className="x" onClick={() => dispatch({ type: 'REMOVE_SENSOR_REQ', itemId: item.id, sensorId })} aria-label="Remove requirement">×</button>
              </div>
            );
          })}
          <select className="chip-add" value="" onChange={(e) => e.target.value && dispatch({ type: 'ADD_SENSOR_REQ', itemId: item.id, sensorId: e.target.value })}>
            <option value="">+ require hardware…</option>
            {unusedSensors.map((x) => <option key={x.id} value={x.id}>{x.id} — {x.kind}</option>)}
          </select>
        </div>
      </div>

      <TextField label="Lore notes" textarea value={item.loreNotes} onCommit={(v) => upd({ loreNotes: v })} />
      <div className="isect">
        <label className="checkrow">
          <input type="checkbox" checked={!!item.persistsAcrossTasks} onChange={(e) => upd({ persistsAcrossTasks: e.target.checked })} />
          <span>Persists across tasks</span>
        </label>
      </div>
    </>
  );
}

// ---- Location INSTANCE ----
function LocationPanel({ location, viaNode }) {
  const s = useGame();
  const dispatch = useDispatch();
  const upd = (patch) => dispatch({ type: 'UPDATE_ENTITY', coll: 'locations', id: location.id, patch });
  return (
    <>
      {viaNode && (
        <div className="via">Node <b>{viaNode.title}</b> → location record
          <button className="linkbtn" style={{ marginLeft: 'auto' }} title="Detach this node from the location"
            onClick={() => dispatch({ type: 'UPDATE_ENTITY', coll: 'nodes', id: viaNode.id, patch: { locationId: null } })}>Unlink</button>
        </div>
      )}
      <InstanceBadge templateId={location.templateId} />
      <div className="ihead">
        <ImageUploader coll="locations" entity={location} label="Cover image" />
        <div className="ihrow"><h3>{location.name}</h3></div>
        <div className="sub mono">{location.id}{location.zone && ` · ${location.zone}`}</div>
      </div>
      <div className="isect">
        <SectionLabel>Room schematic · map base layer</SectionLabel>
        <ImageUploader coll="locations" entity={location} field="schematic" label="Room schematic" />
      </div>
      <TextField label="Location name" value={location.name} onCommit={(v) => upd({ name: v })} />
      <TextField label="Zone / act" value={location.zone} onCommit={(v) => upd({ zone: v })} />
      <TextField label="Notes" textarea value={location.notes} onCommit={(v) => upd({ notes: v })} />
      <TextField label="Safety · crew only" textarea value={location.safety} onCommit={(v) => upd({ safety: v })} />
      <div className="isect">
        <SectionLabel>Sensors on site</SectionLabel>
        <div className="chips">
          {location.sensorIds.map((id) => s.sensors[id] && (
            <Chip key={id} color={ENTITY_COLORS.sensor} title={s.sensors[id].kind}>{id} · {s.sensors[id].status}</Chip>
          ))}
          {location.sensorIds.length === 0 && <span className="dim">none placed</span>}
        </div>
      </div>
      <div className="isect">
        <SectionLabel>Items placed here</SectionLabel>
        <div className="chips">
          {Object.values(s.items).filter((i) => i.locationId === location.id).map((i) => (
            <Chip key={i.id} color={ENTITY_COLORS.item}>{i.name}</Chip>
          ))}
        </div>
      </div>
    </>
  );
}

function PlayerPanel({ player }) {
  const s = useGame();
  const dispatch = useDispatch();
  const kit = itemsAssignedToPlayer(s, player.id);
  const hw = sensorsAssignedToPlayer(s, player.id);
  const team = s.teams[player.teamId];
  const upd = (patch) => dispatch({ type: 'UPDATE_ENTITY', coll: 'players', id: player.id, patch });
  return (
    <>
      <div className="ihead">
        <div className="ihrow"><h3>{player.name}</h3></div>
        <div className="sub">{team?.name} · {player.role}{player.flags.map((f) => ` · ${f}`)}</div>
      </div>
      <TextField label="Player name" value={player.name} onCommit={(v) => upd({
        name: v,
        initials: v.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?',
      })} />
      <TextField label="Nickname" value={player.nickname || ''} onCommit={(v) => upd({ nickname: v })} />
      <TextField label="Role" value={player.role} onCommit={(v) => upd({ role: v })} />
      <div className="isect">
        <SectionLabel>Player photo</SectionLabel>
        <ImageUploader coll="players" entity={player} label="Player photo" />
      </div>
      <div className="isect">
        <SectionLabel>Issued kit</SectionLabel>
        <div className="chips">
          {kit.map((i) => <Chip key={i.id} color={ENTITY_COLORS.item}>{i.name}</Chip>)}
          {hw.map((x) => <Chip key={x.id} color={ENTITY_COLORS.sensor}>{x.id} · {x.kind}</Chip>)}
          {kit.length + hw.length === 0 && <span className="dim">nothing issued — assign from the Teams screen</span>}
        </div>
      </div>
    </>
  );
}

function TeamPanel({ team }) {
  const s = useGame();
  const dispatch = useDispatch();
  const roster = playersOfTeam(s, team.id);
  const upd = (patch) => dispatch({ type: 'UPDATE_ENTITY', coll: 'teams', id: team.id, patch });
  return (
    <>
      <div className="ihead">
        <div className="ihrow"><span className="sq big" style={{ background: team.color }} /><h3>{team.name}</h3></div>
        <div className="sub">{roster.length} player{roster.length === 1 ? '' : 's'}</div>
      </div>
      <TextField label="Team name" value={team.name} onCommit={(v) => upd({ name: v })} />
      <TextField label="Focus" value={team.focus || ''} onCommit={(v) => upd({ focus: v })} />
      <div className="isect">
        <SectionLabel>Players</SectionLabel>
        <div className="chips">
          {roster.map((p) => <Chip key={p.id} color={team.color}>{p.name}</Chip>)}
          {roster.length === 0 && <span className="dim">No players assigned.</span>}
        </div>
      </div>
    </>
  );
}

const NODE_SWATCHES = ['#5CA8F5', '#43BF87', '#E0A23C', '#E86464', '#A87BF0', '#3EC6D6', '#E8D25C', '#F08CB4', '#8B92A6', '#000000'];
const FRAME_SWATCHES = [...NODE_SWATCHES, '#FFFFFF'];

function LinkingNodeInspector({ node, onPatch, onNavigate, onInsert }) {
  const lib = useLibrary();
  const ref = node.linkTarget || { type: 'narrative', id: null };
  const records = narrativeLinkRecords(lib, ref.type);
  const target = resolveNarrativeLink(lib, ref);
  const setType = (type) => onPatch({ linkTarget: { type, id: null } });
  const setTarget = (id) => onPatch({ linkTarget: { type: ref.type, id: id || null } });
  const go = () => {
    if (!target) return;
    if (window.confirm(`Open "${target.label}" in a source window above this canvas?`)) onNavigate?.(ref);
  };
  const insert = () => {
    if (!target) return;
    const noun = ref.type === 'narrative' ? 'node' : 'collapsed container';
    if (window.confirm(`Insert "${target.label}" here as one ${noun}?`)) onInsert?.(ref);
  };
  return (
    <>
      <div className="ihead">
        <div className="ihrow"><span className="sq big" style={{ background: '#68D7C0' }}><PrimIcon icon="link" color="#fff" size={13} /></span><h3>{target?.label || node.title}</h3></div>
        <div className="sub">Linking Node · <span className="mono">{node.id}</span></div>
      </div>
      <ISection label="Link Target" collapsed={false}>
        <SectionLabel>Target type</SectionLabel>
        <select className="field-input" value={ref.type} onChange={(e) => setType(e.target.value)}>
          {LINK_TARGET_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
        </select>
        <SectionLabel>Saved record</SectionLabel>
        <select className="field-input" value={ref.id || ''} onChange={(e) => setTarget(e.target.value)}>
          <option value="">— choose a {LINK_TARGET_TYPES.find((type) => type.id === ref.type)?.label.toLowerCase()} —</option>
          {records.map((record) => <option key={record.id} value={record.id}>{record.label}</option>)}
        </select>
        {ref.id && !target && <div className="link-missing-warning">Missing link. The source was deleted; choose a replacement.</div>}
        {target && (
          <div className="link-target-summary">
            <b>{target.label}</b>
            <small>{target.description}</small>
          </div>
        )}
      </ISection>
      <ISection label="Link Actions" collapsed={false}>
        <button className="btn wide" disabled={!target} onClick={go}>Go to source</button>
        <button className="btn primary wide" disabled={!target} onClick={insert}>Insert here</button>
        <div className="hint">Concepts and structures are inserted as one collapsed node. Their complete graph remains one level down.</div>
      </ISection>
    </>
  );
}

function NodePanel({ node, onSelect, onNavigate }) {
  const s = useGame();
  const lib = useLibrary();
  const dispatch = useDispatch();
  const upd = (patch) => dispatch({ type: 'UPDATE_ENTITY', coll: 'nodes', id: node.id, patch });
  const updEdge = (e, patch) => dispatch({ type: 'UPDATE_EDGE', from: e.from, to: e.to, patch });
  const prim = node.primitiveId ? (lib.narrative[node.primitiveId] || lib.mechPrimitives[node.primitiveId]) : null;
  const nt = NARR_NODE_TYPES[node.kind];
  const color = node.color || prim?.color || ENTITY_COLORS[node.kind] || '#8B92A6';
  const facts = s.facts || {};
  const outgoing = s.edges.filter((e) => e.from === node.id);
  const incoming = s.edges.filter((e) => e.to === node.id);
  const sets = node.sets || [];
  const setFactIds = sets.map((x) => x.factId);
  const unsetFacts = Object.values(facts).filter((f) => !setFactIds.includes(f.id));
  if (node.kind === LINKING_NODE_KIND) {
    return <LinkingNodeInspector node={node} onPatch={upd} onNavigate={onNavigate} onInsert={(ref) => {
      const inserted = buildNarrativeLinkInsertion(lib, ref, s.nodes, { x: node.x + (node.w || 280) + 50, y: node.y }, `${s.meta.prefix}-INS-`);
      if (!inserted) return;
      dispatch({ type: 'ADD_NODE', node: inserted });
      onSelect?.({ kind: 'node', id: inserted.id });
    }} />;
  }
  if (node.kind === CHARACTER_ARCHETYPE_FACET_KIND) {
    return <CharacterArchetypeFacetInspector node={node} onPatch={upd} />;
  }
  if (node.kind === CHARACTER_ARCHETYPE_COMBINATIONS_KIND) {
    return <CharacterArchetypeCombinationsInspector node={node} onPatch={upd} />;
  }
  return (
    <>
      {prim && <InstanceBadge templateId={prim.id} />}
      <div className="ihead">
        <div className="ihrow"><span className="sq big" style={{ background: color }}>{nt && <PrimIcon icon={nt.icon} color="#fff" size={13} />}</span><h3>{node.title}</h3></div>
        <div className="sub">{nt?.label ?? node.kind} node · {node.id}{prim && <> · from <b>{prim.name}</b></>}</div>
      </div>

      <div className="isect">
        <SectionLabel>Node type</SectionLabel>
        <select className="field-input" value={node.kind} onChange={(e) => upd({ kind: e.target.value })}>
          {Object.values(NARR_NODE_TYPES).map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          {!nt && <option value={node.kind}>{node.kind} (legacy / mechanical)</option>}
        </select>
        {nt && <div className="hint">{nt.blurb}</div>}
      </div>

      <TextField label="Node title" value={node.title} onCommit={(v) => upd({ title: v })} />
      <TextField label={node.kind === 'reveal' ? 'What players learn · shown / read aloud' : 'Description'} textarea value={node.body} onCommit={(v) => upd({ body: v })} />

      <div className="isect">
        <SectionLabel>Team lane</SectionLabel>
        <select className="field-input" value={node.teamId ?? ''} onChange={(e) => upd({ teamId: e.target.value || null })}>
          <option value="">Shared · all teams</option>
          {Object.values(s.teams).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {node.kind === 'timed' && (
        <div className="isect">
          <SectionLabel>Fires at (clock time)</SectionLabel>
          <input className="field-input" type="time" value={minToTime(node.startMin ?? 540)}
            onChange={(e) => { const m = timeToMin(e.target.value); if (m != null) upd({ startMin: m }); }} />
          <div className="hint">A timed event fires at this time regardless of what players are doing.</div>
        </div>
      )}

      {/* Fact changes this node records as now true / no longer true. */}
      <div className="isect">
        <SectionLabel>Records facts{node.kind === 'fact' ? '' : ' · optional'}</SectionLabel>
        <div className="senslist">
          {sets.map((x) => {
            const f = facts[x.factId];
            if (!f) return null;
            const fk = FACT_KINDS[f.kind] || { color: '#8B92A6', label: f.kind };
            return (
              <div className="sensrow" key={x.factId}>
                <span className="sq" style={{ background: fk.color }} />
                <div><b>{f.name}</b> <span className="dim">{fk.label}</span></div>
                <button className="tinytoggle" title="Toggle set / unset"
                  onClick={() => upd({ sets: sets.map((y) => (y.factId === x.factId ? { ...y, to: y.to === 'unset' ? 'set' : 'unset' } : y)) })}>
                  {x.to === 'unset' ? 'clears' : 'sets'}
                </button>
                <button className="x" onClick={() => upd({ sets: sets.filter((y) => y.factId !== x.factId) })} aria-label="Remove">×</button>
              </div>
            );
          })}
          <select className="chip-add" value="" onChange={(e) => e.target.value && upd({ sets: [...sets, { factId: e.target.value, to: 'set' }] })}>
            <option value="">+ record a fact…</option>
            {unsetFacts.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          {Object.keys(facts).length === 0 && <div className="hint">No state records are available in this game yet.</div>}
        </div>
      </div>

      {/* Outgoing branch conditions: each link out of this node carries a
          plain-language condition a GM or sensor decides, optionally tied to a
          tracked fact. This is the live-game replacement for coded branching. */}
      <div className="isect">
        <SectionLabel>Outgoing conditions{node.kind === 'branch' ? '' : ' · optional'}</SectionLabel>
        {outgoing.length === 0 && <div className="hint">No outgoing links yet — drag from the node's ○ port on the canvas.</div>}
        {outgoing.map((e, i) => {
          const target = s.nodes[e.to];
          const f = e.factId && facts[e.factId];
          const fk = f && (FACT_KINDS[f.kind] || { color: '#8B92A6' });
          return (
            <div className="condrow" key={i}>
              <div className="condhead">→ <b>{target?.title ?? e.to}</b></div>
              <input className="field-input" placeholder='Condition, e.g. "IF key retrieved"'
                defaultValue={e.label || ''} onBlur={(ev) => { if (ev.target.value !== (e.label || '')) updEdge(e, { label: ev.target.value }); }} />
              <div className="condfact">
                <select className="field-input" value={e.factId || ''} onChange={(ev) => updEdge(e, { factId: ev.target.value || null, expect: ev.target.value ? (e.expect || 'set') : null })}>
                  <option value="">— no fact gate —</option>
                  {Object.values(facts).map((ff) => <option key={ff.id} value={ff.id}>{ff.name}</option>)}
                </select>
                {e.factId && (
                  <select className="field-input narrow" value={e.expect || 'set'} onChange={(ev) => updEdge(e, { expect: ev.target.value })}>
                    <option value="set">is set</option>
                    <option value="unset">is NOT set</option>
                  </select>
                )}
                {f && <span className="factchip sm" style={{ borderColor: fk.color, color: fk.color }}><i style={{ background: fk.color }} />{f.name}</span>}
              </div>
              <button className="linkbtn" onClick={() => dispatch({ type: 'REMOVE_EDGE', from: e.from, to: e.to })}>Remove link</button>
            </div>
          );
        })}
      </div>

      {incoming.length > 0 && (
        <div className="isect">
          <SectionLabel>Reached from</SectionLabel>
          <div className="chips">
            {incoming.map((e, i) => <Chip key={i} color={color}>← {s.nodes[e.from]?.title}</Chip>)}
          </div>
        </div>
      )}

      <div className="isect">
        <SectionLabel>Node image · optional</SectionLabel>
        <ImageUploader coll="nodes" entity={node} label="Node image" />
      </div>
      <div className="isect">
        <SectionLabel>Node color</SectionLabel>
        <div className="chips">
          {NODE_SWATCHES.map((c) => (
            <button key={c} className={`swatch${color === c ? ' on' : ''}`} style={{ background: c }} onClick={() => upd({ color: c })} />
          ))}
          <button className="linkbtn" onClick={() => upd({ color: null })}>Auto</button>
        </div>
      </div>
      <div className="isect">
        <SectionLabel>Link to a record in this game</SectionLabel>
        <select className="field-input" value="" onChange={(e) => {
          const v = e.target.value;
          if (v.startsWith('item:')) upd({ itemId: v.slice(5) });
          else if (v.startsWith('loc:')) upd({ locationId: v.slice(4) });
        }}>
          <option value="">— link an item or location —</option>
          <optgroup label="Items">
            {Object.values(s.items).map((i) => <option key={i.id} value={`item:${i.id}`}>{i.name} · {i.id}</option>)}
          </optgroup>
          <optgroup label="Locations">
            {Object.values(s.locations).map((l) => <option key={l.id} value={`loc:${l.id}`}>{l.name}</option>)}
          </optgroup>
        </select>
        <div className="hint">Linked nodes show the live record here instead.</div>
      </div>
    </>
  );
}

// ---- Fact record: a tracked real-world state (the "variable" of a live game) ----
function FactPanel({ fact }) {
  const s = useGame();
  const dispatch = useDispatch();
  const upd = (patch) => dispatch({ type: 'UPDATE_ENTITY', coll: 'facts', id: fact.id, patch });
  const fk = FACT_KINDS[fact.kind] || { label: fact.kind, color: '#8B92A6' };
  // Where this fact is used across the graph.
  const setBy = Object.values(s.nodes).filter((n) => (n.sets || []).some((x) => x.factId === fact.id));
  const gatedEdges = s.edges.filter((e) => e.factId === fact.id);
  return (
    <>
      <InstanceBadge templateId={null} />
      <div className="ihead">
        <div className="ihrow"><span className="sq big" style={{ background: fk.color }}><PrimIcon icon={fk.icon} color="#fff" size={13} /></span><h3>{fact.name}</h3></div>
        <div className="sub mono">{fact.id} · {fk.label} fact</div>
      </div>
      <TextField label="Fact name" value={fact.name} onCommit={(v) => upd({ name: v })} />
      <div className="isect">
        <SectionLabel>Kind</SectionLabel>
        <select className="field-input" value={fact.kind} onChange={(e) => upd({ kind: e.target.value })}>
          {Object.values(FACT_KINDS).map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
        </select>
        <div className="hint">{fk.hint}</div>
      </div>
      <TextField label="What it means · how a GM checks it" textarea value={fact.detail} onCommit={(v) => upd({ detail: v })} />
      {fact.kind === 'sensor' && (
        <div className="isect">
          <SectionLabel>Bound hardware sensor</SectionLabel>
          <select className="field-input" value={fact.sensorId || ''} onChange={(e) => upd({ sensorId: e.target.value || null })}>
            <option value="">— none —</option>
            {Object.values(s.sensors).map((x) => <option key={x.id} value={x.id}>{x.id} — {x.kind}</option>)}
          </select>
          <div className="hint">A sensor-bound fact flips automatically when the hardware fires.</div>
        </div>
      )}
      <div className="isect">
        <SectionLabel>Set by</SectionLabel>
        <div className="chips">
          {setBy.map((n) => <Chip key={n.id} color={ENTITY_COLORS[n.kind] || fk.color}>{n.title}</Chip>)}
          {setBy.length === 0 && <span className="dim">no node records this yet</span>}
        </div>
      </div>
      <div className="isect">
        <SectionLabel>Gates {gatedEdges.length} connection{gatedEdges.length === 1 ? '' : 's'}</SectionLabel>
        <div className="chips">
          {gatedEdges.map((e, i) => <Chip key={i} color={fk.color}>{s.nodes[e.from]?.title} → {s.nodes[e.to]?.title}</Chip>)}
          {gatedEdges.length === 0 && <span className="dim">not gating any branch yet</span>}
        </div>
      </div>
    </>
  );
}

// ===========================================================================
// NARRATIVE WEAVER inspector panels. Every node and subnode follows one fixed
// section order (progressive disclosure; history collapsed):
//   Core Identity → Main Content → Composition → Type-specific →
//   Relationships / Links → Notes & Keywords → Change History
// ===========================================================================

function ISection({ label, children, collapsed = true }) {
  const [open, setOpen] = useState(!collapsed);
  return (
    <div className={`isect isec${open ? '' : ' closed'}`}>
      <button className="isechead" onClick={() => setOpen(!open)}>
        <span className="caret">{open ? '▾' : '▸'}</span>{label}
      </button>
      {open && <div className="isecbody">{children}</div>}
    </div>
  );
}

const timeAgo = (t) => {
  const m = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
};

function HistorySection({ entity }) {
  const log = [...(entity.history || [])].reverse();
  return (
    <ISection label="Change History" collapsed>
      {log.length === 0 && <div className="hint">No recorded edits yet.</div>}
      {log.map((h, i) => (
        <div className="histrow" key={i}><span className="dim">{timeAgo(h.t)}</span> — {h.fields.join(', ')}</div>
      ))}
    </ISection>
  );
}

function BoxDimensionInput({ label, value, axis, onCommit }) {
  const [draft, setDraft] = useState(String(value));
  React.useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const next = normalizeNodeBoxDimension(draft, axis, value);
    setDraft(String(next));
    if (next !== value) onCommit(next);
  };
  return (
    <label>
      <span>{label}</span>
      <input
        className="field-input"
        type="number"
        min={axis === 'height' ? 74 : 148}
        step="1"
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
            e.currentTarget.blur();
          }
        }}
      />
    </label>
  );
}

function NodeBoxSizeFields({ entity, onPatch, role }) {
  const framework = entity.kind === 'framework' ? (FRAMEWORK_TYPES[entity.frameworkId] || FRAMEWORK_TYPES.fate) : null;
  const frameworkSize = framework ? frameworkBaseSize(framework) : null;
  const defaults = frameworkSize || { width: role === 'subnode' || entity._sub ? 196 : 236, height: 130 };
  const size = effectiveNodeBoxSize(entity, {
    width: defaults.width ?? defaults.w,
    height: defaults.height ?? defaults.h,
  });
  return (
    <ISection label="Box Size" collapsed={false}>
      <div className="formgrid two">
        <BoxDimensionInput label="Width · px" value={size.width} axis="width" onCommit={(w) => onPatch({ w })} />
        <BoxDimensionInput label="Height · px" value={size.height} axis="height" onCommit={(h) => onPatch({ h })} />
      </div>
      <div className="hint">These values update with drag resizing and can also be entered precisely here.</div>
    </ISection>
  );
}

const newCharacterCardId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const emptyQuestionRow = () => ({ id: newCharacterCardId('ccq'), prompt: '', answer: '' });
const emptyTypeGroup = () => ({ id: newCharacterCardId('ccg'), label: '', selectedId: null, options: [] });
const emptyTypeOption = () => ({ id: newCharacterCardId('cco'), label: '' });

function CharacterQuestionsEditor({ questions = [], onChange, templateMode = false }) {
  const [focusId, setFocusId] = useState(null);
  const update = (id, patch) => onChange(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  const remove = (row) => {
    if (!templateMode && row.answer?.trim() && !window.confirm('Remove this answered question?')) return;
    onChange(questions.filter((q) => q.id !== row.id));
  };
  const move = (idx, dir) => {
    const next = [...questions];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };
  const add = () => {
    const row = emptyQuestionRow();
    onChange([...questions, row]);
    setFocusId(row.id);
  };
  return (
    <>
      {questions.map((row, idx) => (
        <div className="char-row" key={row.id}>
          <div className="char-row-head">
            <input className="field-input" value={row.prompt ?? ''} autoFocus={focusId === row.id} placeholder="Question prompt"
              onChange={(e) => update(row.id, { prompt: e.target.value })} onFocus={() => setFocusId(null)} />
            <button className="linkbtn" disabled={idx === 0} onClick={() => move(idx, -1)}>Up</button>
            <button className="linkbtn" disabled={idx === questions.length - 1} onClick={() => move(idx, 1)}>Down</button>
            <button className="linkbtn danger" onClick={() => remove(row)}>Remove</button>
          </div>
          {!templateMode && (
            <textarea className="field-input" rows={3} value={row.answer ?? ''} placeholder="Answer"
              onChange={(e) => update(row.id, { answer: e.target.value })} />
          )}
        </div>
      ))}
      <div className="isect"><button className="btn small" onClick={add}>+ Add question</button></div>
    </>
  );
}

function CharacterTypeGroupsEditor({ groups = [], onChange, templateMode = false }) {
  const updateGroup = (id, patch) => onChange(groups.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  const removeGroup = (id) => onChange(groups.filter((g) => g.id !== id));
  const addGroup = () => onChange([...groups, emptyTypeGroup()]);
  const moveGroup = (idx, dir) => {
    const next = [...groups];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };
  const updateOption = (group, optionId, patch) => updateGroup(group.id, {
    options: (group.options || []).map((o) => (o.id === optionId ? { ...o, ...patch } : o)),
  });
  const addOption = (group) => updateGroup(group.id, { options: [...(group.options || []), emptyTypeOption()] });
  const removeOption = (group, optionId) => updateGroup(group.id, {
    selectedId: group.selectedId === optionId ? null : group.selectedId,
    options: (group.options || []).filter((o) => o.id !== optionId),
  });
  return (
    <>
      {groups.map((group, idx) => (
        <div className="char-group" key={group.id}>
          <div className="char-row-head">
            <input className="field-input" value={group.label ?? ''} placeholder="Group label"
              onChange={(e) => updateGroup(group.id, { label: e.target.value })} />
            <button className="linkbtn" disabled={idx === 0} onClick={() => moveGroup(idx, -1)}>Up</button>
            <button className="linkbtn" disabled={idx === groups.length - 1} onClick={() => moveGroup(idx, 1)}>Down</button>
            <button className="linkbtn danger" onClick={() => removeGroup(group.id)}>Remove group</button>
          </div>
          <div className="char-options">
            {(group.options || []).map((option) => {
              const selected = !templateMode && group.selectedId === option.id;
              return (
                <span className={`char-option${selected ? ' on' : ''}`} key={option.id}>
                  <button onClick={() => !templateMode && updateGroup(group.id, { selectedId: selected ? null : option.id })}>{selected ? '✓' : '○'}</button>
                  <input value={option.label ?? ''} placeholder="Option" onChange={(e) => updateOption(group, option.id, { label: e.target.value })} />
                  <button className="x" onClick={() => removeOption(group, option.id)} aria-label="Remove option">×</button>
                </span>
              );
            })}
            <button className="chip addcat" onClick={() => addOption(group)}>+ Option</button>
          </div>
        </div>
      ))}
      <div className="isect"><button className="btn small" onClick={addGroup}>+ Add group</button></div>
    </>
  );
}

function CharacterTemplateEditor({ template, onPatch }) {
  const current = {
    questions: template?.questions || DEFAULT_CHARACTER_CARD_TEMPLATE.questions,
    typeGroups: template?.typeGroups || DEFAULT_CHARACTER_CARD_TEMPLATE.typeGroups,
  };
  return (
    <ISection label="Edit character card template" collapsed>
      <CharacterQuestionsEditor templateMode questions={current.questions} onChange={(questions) => onPatch({ questions })} />
      <CharacterTypeGroupsEditor templateMode groups={current.typeGroups} onChange={(typeGroups) => onPatch({ typeGroups })} />
      <div className="isect"><button className="linkbtn" onClick={() => onPatch(cloneCharacterCardTemplateForSettings())}>Reset to placeholder defaults</button></div>
      <div className="hint">Template edits affect future Character cards only. Existing cards keep their own copied questions and options.</div>
    </ISection>
  );
}

function CharacterArchetypeFields({ node, onChange }) {
  const enabled = !!node.archetypeEnabled;
  const toggle = (archetypeEnabled) => onChange({
    archetypeEnabled,
    archetypeDarkSideUp: node.archetypeDarkSideUp || '',
    archetypeDarkSideBack: node.archetypeDarkSideBack || '',
  });
  return (
    <ISection label="Archetype & Dark Sides">
      <label className={`checkrow archetype-toggle${enabled ? ' on' : ''}`} title="Show two connected dark-side nodes on the canvas">
        <input type="checkbox" checked={enabled} onChange={(e) => toggle(e.target.checked)} />
        <span><b>Archetype</b> <span className="archetype-help" aria-label="Archetype help">?</span></span>
      </label>
      {enabled && (
        <div className="archetype-dark-sides">
          {CHARACTER_SHADOW_SIDES.map((side) => (
            <TextField
              key={side.key}
              label={`${side.symbol} Dark side`}
              value={node[side.field] || ''}
              placeholder={side.fallback}
              onCommit={(value) => onChange({ [side.field]: value })}
            />
          ))}
          <div className="hint">These fields control the two linked dark-side nodes beside this character.</div>
        </div>
      )}
    </ISection>
  );
}

function CharacterArchetypeFacetInspector({ node, onPatch }) {
  return (
    <>
      <div className="ihead">
        <div className="ihrow"><span className="sq big" style={{ background: node.color || '#A87BF0' }}><PrimIcon icon="user" color="#fff" size={13} /></span><h3>{node.title}</h3></div>
        <div className="sub">Archetype detail · <span className="mono">{node.id}</span></div>
      </div>
      <ISection label="Title" collapsed={false}>
        <TextField label="Title" value={node.title} onCommit={(title) => onPatch({ title })} />
      </ISection>
      <ISection label="Description" collapsed={false}>
        <TextField label="Description" textarea value={node.body || ''} onCommit={(body) => onPatch({ body })} />
      </ISection>
    </>
  );
}

function CharacterArchetypeCombinationsInspector({ node, onPatch }) {
  const rows = Array.from({ length: 8 }, (_, index) => ({
    base: node.combinations?.[index]?.base ?? node.title ?? '',
    plus: node.combinations?.[index]?.plus ?? '',
    result: node.combinations?.[index]?.result ?? '',
  }));
  const updateRow = (index, field, value) => onPatch({
    combinations: rows.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row),
  });
  return (
    <>
      <div className="ihead">
        <div className="ihrow"><span className="sq big" style={{ background: node.color || '#E0A23C' }}><PrimIcon icon="layers" color="#fff" size={13} /></span><h3>{node.title}</h3></div>
        <div className="sub">Eight archetype combinations · <span className="mono">{node.id}</span></div>
      </div>
      <ISection label="Title" collapsed={false}>
        <TextField label="Title" value={node.title} onCommit={(title) => onPatch({ title })} />
      </ISection>
      <ISection label="Combinations" collapsed={false}>
        <div className="archetype-combinations inspector-combinations">
          {rows.map((row, index) => (
            <div className="archetype-combination-row" key={index}>
              <input aria-label={`Combination ${index + 1} base archetype`} value={row.base} onChange={(e) => updateRow(index, 'base', e.target.value)} />
              <span>+</span>
              <input aria-label={`Combination ${index + 1} second archetype`} placeholder="Second archetype" value={row.plus} onChange={(e) => updateRow(index, 'plus', e.target.value)} />
              <span>=</span>
              <input aria-label={`Combination ${index + 1} result archetype`} placeholder="Result" value={row.result} onChange={(e) => updateRow(index, 'result', e.target.value)} />
            </div>
          ))}
        </div>
      </ISection>
    </>
  );
}

function CharacterCardInspector({ node, onPatch, template, onTemplatePatch = null, onArchetypeChange = null }) {
  const card = normalizeCharacterCard(node, template);
  const updateArchetype = onArchetypeChange || onPatch;
  return (
    <>
      <ISection label="Title" collapsed={false}>
        <TextField label="Title" value={card.title} onCommit={(title) => onPatch({ title, name: title })} />
      </ISection>
      <ISection label="Description" collapsed={false}>
        <TextField label="Description" textarea value={card.description} onCommit={(description) => onPatch({ body: description, description })} />
      </ISection>
      <ISection label="Base Questions">
        <CharacterQuestionsEditor questions={card.questions} onChange={(questions) => onPatch({ questions })} />
      </ISection>
      <ISection label="Types & Options">
        <CharacterTypeGroupsEditor groups={card.typeGroups} onChange={(typeGroups) => onPatch({ typeGroups })} />
      </ISection>
      <CharacterArchetypeFields node={node} onChange={updateArchetype} />
      {onTemplatePatch && <CharacterTemplateEditor template={template} onPatch={onTemplatePatch} />}
    </>
  );
}

const emptyModuleValue = (field) => {
  if (field.type === 'multi' || field.type === 'nodeRefs' || field.type === 'tags') return [];
  if (field.type === 'slider') return 0;
  if (field.type === 'toggle') return '';
  if (field.type === 'toggleText') return { enabled: false, text: '' };
  return '';
};
const blankConceptModule = (moduleKey) => Object.fromEntries((CONCEPT_MODULES[moduleKey]?.fields || []).map((field) => [field.key, emptyModuleValue(field)]));
const hasConceptModuleData = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return Object.values(value).some(hasConceptModuleData);
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'boolean') return value;
  return `${value ?? ''}`.trim().length > 0;
};
const conceptModulePatch = (modules, moduleKey, fieldKey, value) => ({
  conceptModules: {
    ...(modules || {}),
    [moduleKey]: {
      ...(modules?.[moduleKey] || blankConceptModule(moduleKey)),
      [fieldKey]: value,
    },
  },
});

function ConceptSelect({ label, value, options, onChange }) {
  return (
    <div className="isect">
      <SectionLabel>{label}</SectionLabel>
      <select className="field-input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">-- unset --</option>
        {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
    </div>
  );
}

function ConceptMultiSelect({ label, value = [], options, max, onChange }) {
  const selected = Array.isArray(value) ? value : [];
  const toggle = (id) => {
    if (selected.includes(id)) onChange(selected.filter((x) => x !== id));
    else if (!max || selected.length < max) onChange([...selected, id]);
  };
  return (
    <div className="isect">
      <SectionLabel>{label}{max ? ` (max ${max})` : ''}</SectionLabel>
      <div className="chips">
        {options.map((option) => (
          <button key={option.id} className={`chip cat${selected.includes(option.id) ? ' on' : ''}`} onClick={() => toggle(option.id)}>
            {selected.includes(option.id) ? '✓ ' : ''}{option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ConceptNodeRefs({ label, value, nodes, multiple, onChange }) {
  const ids = multiple ? (Array.isArray(value) ? value : []) : (value ? [value] : []);
  const add = (id) => {
    if (!id) return;
    if (multiple) onChange(ids.includes(id) ? ids : [...ids, id]);
    else onChange(id);
  };
  return (
    <div className="isect">
      <SectionLabel>{label}</SectionLabel>
      <div className="chips">
        {ids.map((id) => nodes[id] && (
          <Chip key={id} color={ENTITY_COLORS[nodes[id].kind] || '#8B92A6'} onRemove={() => onChange(multiple ? ids.filter((x) => x !== id) : '')}>
            {nodes[id].title || nodes[id].name || id}
          </Chip>
        ))}
        <select className="chip-add" value="" onChange={(e) => { add(e.target.value); e.target.value = ''; }}>
          <option value="">+ link node...</option>
          {Object.values(nodes).filter((n) => !ids.includes(n.id)).map((n) => <option key={n.id} value={n.id}>{n.title || n.name || n.id}</option>)}
        </select>
      </div>
    </div>
  );
}

function ConceptTags({ label, value = [], placeholder, onChange }) {
  return (
    <TextField
      label={label}
      value={(Array.isArray(value) ? value : []).join(', ')}
      placeholder={placeholder}
      onCommit={(v) => onChange(v.split(',').map((x) => x.trim()).filter(Boolean))}
    />
  );
}

function ConceptModuleField({ field, value, moduleData, graphNodes, onChange }) {
  if (field.enabledWhen && !field.enabledWhen(moduleData || {})) {
    return (
      <div className="isect">
        <SectionLabel>{field.label}</SectionLabel>
        <div className="field-input readonlyfield">Set Stage before choosing shading.</div>
      </div>
    );
  }
  if (field.type === 'select') return <ConceptSelect label={field.label} value={value} options={field.options} onChange={onChange} />;
  if (field.type === 'multi') return <ConceptMultiSelect label={field.label} value={value} options={field.options} max={field.max} onChange={onChange} />;
  if (field.type === 'nodeRef') return <ConceptNodeRefs label={field.label} value={value} nodes={graphNodes} onChange={onChange} />;
  if (field.type === 'nodeRefs') return <ConceptNodeRefs label={field.label} value={value} nodes={graphNodes} multiple onChange={onChange} />;
  if (field.type === 'tags') return <ConceptTags label={field.label} value={value} placeholder={field.placeholder} onChange={onChange} />;
  if (field.type === 'slider') {
    return (
      <div className="isect">
        <SectionLabel>{field.label}</SectionLabel>
        <input className="field-input" type="range" min={field.min} max={field.max} value={Number.isFinite(Number(value)) ? Number(value) : 0} onChange={(e) => onChange(Number(e.target.value))} />
        <div className="hint"><span>{field.left}</span><span style={{ float: 'right' }}>{field.right}</span><b className="mono" style={{ display: 'block', textAlign: 'center' }}>{Number.isFinite(Number(value)) ? Number(value) : 0}</b></div>
      </div>
    );
  }
  if (field.type === 'toggle') {
    return (
      <div className="isect">
        <SectionLabel>{field.label}</SectionLabel>
        <div className="seg">
          {field.options.map((option) => <button key={option.id} className={value === option.id ? 'on' : ''} onClick={() => onChange(option.id)}>{option.label}</button>)}
        </div>
      </div>
    );
  }
  if (field.type === 'toggleText') {
    const current = value && typeof value === 'object' ? value : { enabled: false, text: '' };
    return (
      <>
        <div className="isect">
          <label className="checkrow">
            <input type="checkbox" checked={!!current.enabled} onChange={(e) => onChange({ ...current, enabled: e.target.checked })} />
            <span>{field.label}</span>
          </label>
        </div>
        {current.enabled && <TextField label="Ritual Text" value={current.text || ''} placeholder={field.placeholder} onCommit={(text) => onChange({ ...current, text })} />}
      </>
    );
  }
  return <TextField label={field.label} value={value} placeholder={field.placeholder} onCommit={onChange} />;
}

const newConceptQuestionId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const normalizeConceptQuestions = (questions = []) => questions.map((q) => ({
  id: q?.id || q?.key || newConceptQuestionId('cq'),
  prompt: q?.prompt ?? q?.label ?? '',
  choices: (q?.choices || []).map((choice) => ({
    id: choice?.id || newConceptQuestionId('cc'),
    label: choice?.label ?? choice?.text ?? '',
  })),
}));

function ConceptQuestionChoicesEditor({ questions = [], onChange }) {
  const [hoveredChoiceId, setHoveredChoiceId] = useState(null);
  const rows = normalizeConceptQuestions(questions);
  const updateQuestion = (id, patch) => onChange(rows.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  const removeQuestion = (row) => {
    const hasData = row.prompt?.trim() || row.choices?.some((choice) => choice.label?.trim());
    if (hasData && !window.confirm('Delete this question and its choices?')) return;
    onChange(rows.filter((q) => q.id !== row.id));
  };
  const addQuestion = () => onChange([...rows, { id: newConceptQuestionId('cq'), prompt: '', choices: [] }]);
  const addChoice = (row) => updateQuestion(row.id, { choices: [...(row.choices || []), { id: newConceptQuestionId('cc'), label: '' }] });
  const updateChoice = (row, choiceId, label) => updateQuestion(row.id, {
    choices: row.choices.map((choice) => (choice.id === choiceId ? { ...choice, label } : choice)),
  });
  const removeChoice = (row, choiceId) => updateQuestion(row.id, { choices: row.choices.filter((choice) => choice.id !== choiceId) });
  return (
    <ISection label="Questions & Choices">
      {rows.map((row, index) => (
        <div className="concept-question" key={row.id}>
          <div className="concept-question-head">
            <span>Question</span>
            <textarea
              className="field-input"
              rows={2}
              value={row.prompt}
              placeholder={`Question ${index + 1}`}
              onChange={(e) => updateQuestion(row.id, { prompt: e.target.value })}
            />
            <button className="linkbtn danger" onClick={() => removeQuestion(row)}>Remove</button>
          </div>
          <div className="concept-answer-label">Answers / choices</div>
          <div className="concept-choices">
            {(row.choices || []).map((choice) => (
              <div
                className="concept-choice-row"
                key={choice.id}
                onPointerEnter={() => setHoveredChoiceId(choice.id)}
                onPointerLeave={() => setHoveredChoiceId(null)}
              >
                <span>Answer</span>
                <input className="field-input" value={choice.label} placeholder="Choice" onChange={(e) => updateChoice(row, choice.id, e.target.value)} />
                <button className="x" onClick={() => removeChoice(row, choice.id)} aria-label="Remove choice">×</button>
                {hoveredChoiceId === choice.id && choice.label?.trim() && (
                  <div className="concept-choice-popover">{choice.label}</div>
                )}
              </div>
            ))}
            <button className="chip addcat" onClick={() => addChoice(row)}>+ Choice</button>
          </div>
        </div>
      ))}
      <div className="isect">
        <button className="btn small" onClick={addQuestion}>+ Add question</button>
      </div>
    </ISection>
  );
}

const normalizeReferenceFrameworkIds = (ids = []) => (
  Array.isArray(ids) ? ids.filter((id, idx) => FRAMEWORK_TYPES[id] && ids.indexOf(id) === idx) : []
);

function ConceptReferenceFrameworks({ value = [], onChange, onInsert }) {
  const selected = normalizeReferenceFrameworkIds(value);
  const available = Object.values(FRAMEWORK_TYPES).filter((fw) => !selected.includes(fw.id));
  const add = (id) => {
    if (!id || selected.includes(id)) return;
    onChange([...selected, id]);
    onInsert?.(id);
  };
  const remove = (id) => onChange(selected.filter((fwId) => fwId !== id));
  return (
    <ISection label="Reference Frameworks" collapsed>
      <div className="isect">
        <SectionLabel>Attached frameworks</SectionLabel>
        <div className="chips">
          {selected.map((id) => {
            const fw = FRAMEWORK_TYPES[id];
            return fw ? (
              <Chip key={id} color={fw.color} onRemove={() => remove(id)} title={fw.summary}>
                {fw.label}
              </Chip>
            ) : null;
          })}
          {selected.length === 0 && <span className="dim">No reference frameworks attached.</span>}
        </div>
      </div>
      <div className="isect">
        <SectionLabel>{onInsert ? 'Add framework to node field' : 'Add framework'}</SectionLabel>
        <select className="field-input" value="" onChange={(e) => { add(e.target.value); e.target.value = ''; }}>
          <option value="">+ choose a reference framework...</option>
          {available.map((fw) => <option key={fw.id} value={fw.id}>{fw.label}</option>)}
        </select>
        <div className="hint">{onInsert
          ? 'Choosing a framework also places a visible reference card into this concept node field.'
          : 'These are concept references only. They do not create canvas nodes or graph connections.'}</div>
      </div>
      {selected.length > 0 && (
        <div className="isect">
          <SectionLabel>Reference notes</SectionLabel>
          <div className="fwphase-list">
            {selected.map((id) => {
              const fw = FRAMEWORK_TYPES[id];
              if (!fw) return null;
              return (
                <div key={id} className="fwphase">
                  <span style={{ background: fw.color }}><PrimIcon icon={fw.icon} color="#fff" size={12} /></span>
                  <div>
                    <b>{fw.label}</b>
                    <p>{fw.summary}</p>
                    <small>{fw.blurb}</small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </ISection>
  );
}

function ConceptFieldsEditor({ entity, onPatch, mode = 'node', onInsertReferenceFramework = null }) {
  const patchName = (name) => onPatch(mode === 'template' ? { name } : { title: name, name });
  const patchDescription = (description) => onPatch(mode === 'template' ? { description } : { body: description, description });
  const category = mode === 'template' ? entity.category : entity.conceptKind;
  const patchCategory = (nextCategory) => onPatch(mode === 'template' ? { category: nextCategory } : { conceptKind: nextCategory });
  return (
    <>
      <ISection label="Concept Core">
        <TextField label="Name" value={entity.name ?? entity.title ?? ''} onCommit={patchName} />
        <TextField label="Description" textarea value={entity.description ?? entity.body ?? ''} onCommit={patchDescription} />
        <div className="isect">
          <SectionLabel>Category</SectionLabel>
          <select className="field-input" value={category || 'storyConcept'} onChange={(e) => patchCategory(e.target.value)}>
            {Object.values(ADDITIONAL_NODE_TYPES).map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <ConceptSelect label="Status" value={entity.status ?? 'seed'} options={CONCEPT_CORE_SELECTS.status} onChange={(status) => onPatch({ status })} />
        <TextField label="One Promise" value={entity.onePromise} placeholder="What does the player gain by encountering this concept?" onCommit={(onePromise) => onPatch({ onePromise })} />
      </ISection>
      <ConceptReferenceFrameworks
        value={entity.referenceFrameworkIds || []}
        onChange={(referenceFrameworkIds) => onPatch({ referenceFrameworkIds })}
        onInsert={onInsertReferenceFramework}
      />
    </>
  );
}

function ConceptInternalNodeFields({ node, onPatch }) {
  if (node.kind === 'conceptTitle') {
    return (
      <>
        <ISection label="Section Title">
          <TextField label="Title" value={node.title} placeholder="A heading for this group of questions" onCommit={(title) => onPatch({ title })} />
          <TextField label="Optional note" textarea value={node.body} placeholder="Short context for this section" onCommit={(body) => onPatch({ body })} />
        </ISection>
      </>
    );
  }
  if (node.kind === 'conceptQuestion') {
    return (
      <>
        <ISection label="Question">
          <TextField label="Question text" textarea value={node.title} placeholder="What question should this concept answer?" onCommit={(title) => onPatch({ title })} />
          <TextField label="Context" textarea value={node.body} placeholder="Why this question matters, or what it is testing." onCommit={(body) => onPatch({ body })} />
        </ISection>
        <div className="isect"><div className="hint">Connect this question to Concept Choice nodes to show possible answers.</div></div>
      </>
    );
  }
  if (node.kind === 'conceptChoice') {
    return (
      <>
        <ISection label="Choice">
          <TextField label="Choice text" textarea value={node.title} placeholder="Possible answer or direction" onCommit={(title) => onPatch({ title })} />
          <TextField label="Meaning / consequence" textarea value={node.body} placeholder="What this choice implies for the concept." onCommit={(body) => onPatch({ body })} />
        </ISection>
      </>
    );
  }
  return null;
}

function StoryItemInspectorFields({ node, onPatch, game = null, lib = null, graph = null }) {
  const graphNodes = graph?.nodes || game?.nodes || {};
  const storyLocations = Object.values(graphNodes).filter((n) => n.kind === 'storyLocation');
  const graphMechanics = Object.values(graphNodes).filter((n) => n.mechKind || n.kind === 'mechanic' || n.kind === 'task');
  const libraryMechanics = Object.values(lib?.mechanics || {});
  const placementIds = node.placementNodeIds || [];
  const graphMechanicIds = node.linkedMechanicNodeIds || [];
  const libraryMechanicIds = node.linkedMechanicIds || [];
  const addUnique = (arr, id) => (id && !arr.includes(id) ? [...arr, id] : arr);

  return (
    <>
      <ISection label="Story Item">
        <TextField label="Title" value={node.title} onCommit={(v) => onPatch({ title: v })} />
        <TextField label="Short Title (canvas)" value={node.shortTitle} onCommit={(v) => onPatch({ shortTitle: v })} placeholder="Short label shown on the canvas" />
        <NodeImageField image={node.image} onChange={(image) => onPatch({ image })} />
        <TextField
          label="Player Lore"
          textarea
          value={node.playerLore ?? node.playerDescription ?? node.body}
          onCommit={(v) => onPatch({ playerLore: v, playerDescription: v, body: v })}
          placeholder="Lore description shown or told to players."
        />
        <TextField
          label="Complete Lore"
          textarea
          value={node.completeLore ?? node.facilitatorDescription ?? ''}
          onCommit={(v) => onPatch({ completeLore: v })}
          placeholder="Full lore for designers."
        />
        <TextField
          label="Base Type"
          value={node.baseType ?? node.itemType ?? ''}
          onCommit={(v) => onPatch({ baseType: v })}
          placeholder="Lore category, e.g. Relic, Token, Omen, Badge..."
        />
        <TextField label="Origin" textarea value={node.origin} onCommit={(v) => onPatch({ origin: v })} />
        <TextField
          label="Gameplay Meaning"
          textarea
          value={node.gameplayMeaning ?? node.mechanicMeaning}
          onCommit={(v) => onPatch({ gameplayMeaning: v, mechanicMeaning: v })}
          placeholder="Why this item matters in play: trust, access, sacrifice, status, proof, memory..."
        />
        <label className="checkrow">
          <input type="checkbox" checked={!!node.persistsAcrossTasks} onChange={(e) => onPatch({ persistsAcrossTasks: e.target.checked })} />
          <span>Persist Across Tasks</span>
        </label>
        <div className="isect compact">
          <SectionLabel>Color</SectionLabel>
          <div className="chips">
            {NODE_SWATCHES.map((c) => <button key={c} className={`swatch${(node.color || '#3EC6D6') === c ? ' on' : ''}`} style={{ background: c }} onClick={() => onPatch({ color: c })} />)}
            <button className="linkbtn" onClick={() => onPatch({ color: null })}>Auto</button>
          </div>
        </div>
      </ISection>
    </>
  );

  return (
    <>
      <ISection label="Item Identity">
        <div className="isect">
          <SectionLabel>Base type</SectionLabel>
          <div className="field-input readonlyfield">Item</div>
        </div>
        <div className="isect">
          <SectionLabel>Subtype</SectionLabel>
          <select className="field-input" value={node.itemType || 'Key'} onChange={(e) => onPatch({ itemType: e.target.value })}>
            {STORY_ITEM_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <TextField label="Name" value={node.title} onCommit={(v) => onPatch({ title: v })} />
        <TextField label="Short Title (canvas)" value={node.shortTitle} onCommit={(v) => onPatch({ shortTitle: v })} placeholder="Short label shown on the canvas" />
        <TextField label="Image reference" value={node.imageRef} onCommit={(v) => onPatch({ imageRef: v })} placeholder="Describe or reference the intended image" />
      </ISection>

      <ISection label="Descriptions">
        <TextField
          label="Player-facing Description"
          textarea
          value={node.playerDescription ?? node.body}
          onCommit={(v) => onPatch({ playerDescription: v, body: v })}
          placeholder="Lore/flavor. Evocative, not mechanical."
        />
        <TextField
          label="Facilitator Description"
          textarea
          value={node.facilitatorDescription}
          onCommit={(v) => onPatch({ facilitatorDescription: v })}
          placeholder="Practical real-world details: material, storage, handling, reset, crew notes."
        />
        <TextField label="Origin" textarea value={node.origin} onCommit={(v) => onPatch({ origin: v })} placeholder="Flavor: where this item came from or how it is earned." />
      </ISection>

      <ISection label="Build Status">
        <BuildFlow value={node.buildStatus || 'concept'} onChange={(v) => onPatch({ buildStatus: v })} />
      </ISection>

      <ISection label="Connections & Ports">
        <div className="isect">
          <SectionLabel>Placement · Story Location nodes</SectionLabel>
          <div className="chips">
            {placementIds.map((id) => graphNodes[id] && (
              <Chip key={id} color={ENTITY_COLORS.storyLocation} onRemove={() => onPatch({ placementNodeIds: placementIds.filter((x) => x !== id) })}>
                {graphNodes[id].title}
              </Chip>
            ))}
            <select className="chip-add" value="" onChange={(e) => onPatch({ placementNodeIds: addUnique(placementIds, e.target.value) })}>
              <option value="">+ connect placement...</option>
              {storyLocations.filter((n) => !placementIds.includes(n.id)).map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}
            </select>
          </div>
          {storyLocations.length === 0 && <div className="hint">Add Story Location nodes to this graph, then connect them here.</div>}
        </div>

        <div className="isect">
          <SectionLabel>Linked Mechanics · graph nodes</SectionLabel>
          <div className="chips">
            {graphMechanicIds.map((id) => graphNodes[id] && (
              <Chip key={id} color={ENTITY_COLORS.mechanic} onRemove={() => onPatch({ linkedMechanicNodeIds: graphMechanicIds.filter((x) => x !== id) })}>
                {graphNodes[id].title}
              </Chip>
            ))}
            <select className="chip-add" value="" onChange={(e) => onPatch({ linkedMechanicNodeIds: addUnique(graphMechanicIds, e.target.value) })}>
              <option value="">+ connect graph mechanic...</option>
              {graphMechanics.filter((n) => !graphMechanicIds.includes(n.id)).map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}
            </select>
          </div>
        </div>

        {libraryMechanics.length > 0 && (
          <div className="isect">
            <SectionLabel>Linked Mechanics · library templates</SectionLabel>
            <div className="chips">
              {libraryMechanicIds.map((id) => lib?.mechanics?.[id] && (
                <Chip key={id} color={ENTITY_COLORS.mechanic} onRemove={() => onPatch({ linkedMechanicIds: libraryMechanicIds.filter((x) => x !== id) })}>
                  {lib.mechanics[id].name}
                </Chip>
              ))}
              <select className="chip-add" value="" onChange={(e) => onPatch({ linkedMechanicIds: addUnique(libraryMechanicIds, e.target.value) })}>
                <option value="">+ link library mechanic...</option>
                {libraryMechanics.filter((m) => !libraryMechanicIds.includes(m.id)).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
        )}

        <TextField label="Sensor Hooks" textarea value={node.sensorHooks} onCommit={(v) => onPatch({ sensorHooks: v })} placeholder="NFC / QR / GPS / button / other interaction hooks." />
      </ISection>

      <ISection label="Gameplay Meaning">
        <div className="isect">
          <label className="checkrow">
            <input type="checkbox" checked={!!node.noSoloSolve} onChange={(e) => onPatch({ noSoloSolve: e.target.checked })} />
            <span>Enforce No-Solo-Solve where relevant</span>
          </label>
        </div>
        <TextField
          label="Mechanic-encoded Meaning"
          textarea
          value={node.mechanicMeaning}
          onCommit={(v) => onPatch({ mechanicMeaning: v })}
          placeholder="Why this item’s mechanics match its theme: trust, access, sacrifice, status, proof, memory..."
        />
        <TextField
          label="Subnodes / Pip Decks templates"
          textarea
          value={node.attachedTemplateNotes}
          onCommit={(v) => onPatch({ attachedTemplateNotes: v })}
          placeholder="Specific subnodes or Pip Deck templates to attach."
        />
      </ISection>
    </>
  );
}

// Chips of the subnodes attached to a node, with attach / create controls.
function CompositionSection({ node }) {
  const s = useGame();
  const dispatch = useDispatch();
  const subs = Object.values(s.subnodes || {});
  const attached = subs.filter((sn) => sn.parentRef?.nodeId === node.id);
  const compatible = (t) => t.attachesTo && (t.attachesTo.includes('*') || t.attachesTo.includes(node.kind));
  const floating = subs.filter((sn) => !sn.parentRef && compatible(SUBNODE_TYPES[sn.kind] || {}));
  const attach = (id) => dispatch({ type: 'UPDATE_ENTITY', coll: 'subnodes', id, patch: { parentRef: { nodeId: node.id } } });
  const createAttached = (kind) => {
    const id = genId(s.subnodes || {}, `${s.meta.prefix}-SB-`);
    dispatch({ type: 'ADD_ENTITY', coll: 'subnodes', entity: { ...SUBNODE_BLANK(id, kind), x: node.x + 40, y: node.y + 180, parentRef: { nodeId: node.id } } });
  };
  return (
    <ISection label={`Composition · ${attached.length} attached subnode${attached.length === 1 ? '' : 's'}`}>
      <div className="senslist">
        {attached.map((sn) => {
          const t = SUBNODE_TYPES[sn.kind] || { color: '#F08CB4', label: sn.kind };
          return (
            <div className="sensrow" key={sn.id}>
              <span className="sq" style={{ background: t.color }} />
              <div><b>{sn.title}</b> <span className="dim">{t.label}</span></div>
              <button className="x" title="Detach (keeps the subnode on the canvas)"
                onClick={() => dispatch({ type: 'UPDATE_ENTITY', coll: 'subnodes', id: sn.id, patch: { parentRef: null } })}>⊘</button>
            </div>
          );
        })}
        {floating.length > 0 && (
          <select className="chip-add" value="" onChange={(e) => e.target.value && attach(e.target.value)}>
            <option value="">⚭ attach a floating subnode…</option>
            {floating.map((sn) => <option key={sn.id} value={sn.id}>{sn.title} · {SUBNODE_TYPES[sn.kind]?.label}</option>)}
          </select>
        )}
        <select className="chip-add" value="" onChange={(e) => e.target.value && createAttached(e.target.value)}>
          <option value="">+ new subnode here…</option>
          {Object.values(SUBNODE_TYPES).filter(compatible).map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>
    </ISection>
  );
}

// Outgoing conditions + fact recording + mechanic link, shared by base nodes.
function RelationshipsSection({ node, extra }) {
  const s = useGame();
  const lib = useLibrary();
  const dispatch = useDispatch();
  const upd = (patch) => dispatch({ type: 'UPDATE_ENTITY', coll: 'nodes', id: node.id, patch });
  const updEdge = (e, patch) => dispatch({ type: 'UPDATE_EDGE', from: e.from, to: e.to, patch });
  const facts = s.facts || {};
  const outgoing = s.edges.filter((e) => e.from === node.id);
  const incoming = s.edges.filter((e) => e.to === node.id);
  const sets = node.sets || [];
  const mechanicIds = node.mechanicIds || [];
  const endName = (id) => s.nodes[id]?.title || s.subnodes?.[id]?.title || id;
  return (
    <ISection label="Relationships / Links">
      <SectionLabel>Outgoing conditions</SectionLabel>
      {outgoing.length === 0 && <div className="hint">No outgoing links — drag from the ○ port on the canvas.</div>}
      {outgoing.map((e, i) => {
        const f = e.factId && facts[e.factId];
        const fk = f && (FACT_KINDS[f.kind] || { color: '#8B92A6' });
        return (
          <div className="condrow" key={i}>
            <div className="condhead">→ <b>{endName(e.to)}</b></div>
            <input className="field-input" placeholder='Condition, e.g. "IF key retrieved"'
              defaultValue={e.label || ''} onBlur={(ev) => { if (ev.target.value !== (e.label || '')) updEdge(e, { label: ev.target.value }); }} />
            <div className="condfact">
              <select className="field-input" value={e.factId || ''} onChange={(ev) => updEdge(e, { factId: ev.target.value || null, expect: ev.target.value ? (e.expect || 'set') : null })}>
                <option value="">— no fact gate —</option>
                {Object.values(facts).map((ff) => <option key={ff.id} value={ff.id}>{ff.name}</option>)}
              </select>
              {e.factId && (
                <select className="field-input narrow" value={e.expect || 'set'} onChange={(ev) => updEdge(e, { expect: ev.target.value })}>
                  <option value="set">is set</option>
                  <option value="unset">is NOT set</option>
                </select>
              )}
              {f && <span className="factchip sm" style={{ borderColor: fk.color, color: fk.color }}><i style={{ background: fk.color }} />{f.name}</span>}
            </div>
          </div>
        );
      })}
      {incoming.length > 0 && (
        <>
          <SectionLabel>Reached from</SectionLabel>
          <div className="chips">{incoming.map((e, i) => <Chip key={i} color="#8B92A6">← {endName(e.from)}</Chip>)}</div>
        </>
      )}
      <SectionLabel>Records facts</SectionLabel>
      <div className="senslist">
        {sets.map((x) => {
          const f = facts[x.factId];
          if (!f) return null;
          const fk = FACT_KINDS[f.kind] || { color: '#8B92A6', label: f.kind };
          return (
            <div className="sensrow" key={x.factId}>
              <span className="sq" style={{ background: fk.color }} />
              <div><b>{f.name}</b> <span className="dim">{fk.label}</span></div>
              <button className="tinytoggle" onClick={() => upd({ sets: sets.map((y) => (y.factId === x.factId ? { ...y, to: y.to === 'unset' ? 'set' : 'unset' } : y)) })}>
                {x.to === 'unset' ? 'clears' : 'sets'}
              </button>
              <button className="x" onClick={() => upd({ sets: sets.filter((y) => y.factId !== x.factId) })} aria-label="Remove">×</button>
            </div>
          );
        })}
        <select className="chip-add" value="" onChange={(e) => e.target.value && upd({ sets: [...sets, { factId: e.target.value, to: 'set' }] })}>
          <option value="">+ record a fact…</option>
          {Object.values(facts).filter((f) => !sets.some((x) => x.factId === f.id)).map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>
      <SectionLabel>Link to Mechanic Node</SectionLabel>
      <div className="chips">
        {mechanicIds.map((id) => lib.mechanics[id] && (
          <Chip key={id} color={ENTITY_COLORS.mechanic} onRemove={() => upd({ mechanicIds: mechanicIds.filter((m) => m !== id) })}>
            {lib.mechanics[id].name}
          </Chip>
        ))}
        <select className="chip-add" value="" onChange={(e) => e.target.value && upd({ mechanicIds: [...mechanicIds, e.target.value] })}>
          <option value="">+ link mechanic…</option>
          {Object.values(lib.mechanics).filter((m) => !mechanicIds.includes(m.id)).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      {extra}
      <div className="hint">The narrative layer stays mechanic-free — this is only a reference into the mechanic layer.</div>
    </ISection>
  );
}

// ---- Base Node (Event / Character / Story Location / Item / Quest) ----
function BaseNodePanel({ node, onSelect, onNavigate }) {
  const s = useGame();
  const lib = useLibrary();
  const dispatch = useDispatch();
  const libDispatch = useLibraryDispatch();
  const upd = (patch) => dispatch({ type: 'UPDATE_ENTITY', coll: 'nodes', id: node.id, patch });
  const t = baseTemplateMeta(node.kind);
  const color = node.color || t?.color || '#8B92A6';
  const [savedAs, setSavedAs] = useState(null);
  if (node.kind === LINKING_NODE_KIND) {
    return <LinkingNodeInspector node={node} onPatch={upd} onNavigate={onNavigate} onInsert={(ref) => {
      const inserted = buildNarrativeLinkInsertion(lib, ref, s.nodes, { x: node.x + (node.w || 280) + 50, y: node.y }, `${s.meta.prefix}-INS-`);
      if (!inserted) return;
      dispatch({ type: 'ADD_NODE', node: inserted });
      onSelect?.({ kind: 'node', id: inserted.id });
    }} />;
  }
  const saveToLibrary = () => {
    const id = genId(lib.narrative || {}, 'LIB-NAR-');
    libDispatch({
      type: 'ADD_ENTITY',
      coll: 'narrative',
      entity: {
        id, nodeClass: 'base', nodeKind: node.kind,
        name: node.title, category: node.kind, color, icon: t?.icon || 'flag',
        body: node.body || t?.blurb || '', tags: [], inputs: ['in'], outputs: ['out'],
        image: node.image ?? null,
        template: { ...JSON.parse(JSON.stringify(node)), id: undefined, x: undefined, y: undefined, history: [] },
      },
    });
    setSavedAs(id);
    setTimeout(() => setSavedAs(null), 5000);
  };
  if (node.kind === 'character') {
    return (
      <>
        <div className="ihead">
          <div className="ihrow"><span className="sq big" style={{ background: color }}>{t && <PrimIcon icon={t.icon} color="#fff" size={13} />}</span><h3>{node.title}</h3></div>
          <div className="sub">{t?.label ?? node.kind} · <span className="mono">{node.id}</span></div>
        </div>
        <CharacterCardInspector
          node={node}
          onPatch={upd}
          onArchetypeChange={(patch) => dispatch({ type: 'SYNC_CHARACTER_ARCHETYPE', id: node.id, patch })}
          template={s.meta.characterCardTemplate}
          onTemplatePatch={(characterCardTemplate) => dispatch({ type: 'SET_META', patch: { characterCardTemplate } })}
        />
      </>
    );
  }
  const archetype = Object.values(s.subnodes || {}).find((sn) => sn.kind === 'locationArchetype' && sn.parentRef?.nodeId === node.id);
  const storyConcepts = Object.values(lib.concepts || {}).filter((c) => c.category === 'storyConcept' && c.questions?.length);
  const appliedConcept = node.conceptId ? lib.concepts?.[node.conceptId] : null;
  return (
    <>
      <div className="ihead">
        <div className="ihrow"><span className="sq big" style={{ background: color }}>{t && <PrimIcon icon={t.icon} color="#fff" size={13} />}</span><h3>{node.title}</h3></div>
        <div className="sub">{t?.label ?? node.kind} · <span className="mono">{node.id}</span></div>
      </div>

      {node.kind !== 'item' && <ISection label="Core Identity">
        <TextField label={node.kind === 'item' ? 'Name' : 'Title'} value={node.title} onCommit={(v) => upd({ title: v })} />
        <SectionLabel>Base type</SectionLabel>
        {node.kind === 'item' ? (
          <div className="field-input readonlyfield">Story Item</div>
        ) : (
          <select className="field-input" value={node.kind} onChange={(e) => upd({ kind: e.target.value })}>
            {Object.values(BASE_NODE_TYPES).map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </select>
        )}
        <SectionLabel>Team lane</SectionLabel>
        <select className="field-input" value={node.teamId ?? ''} onChange={(e) => upd({ teamId: e.target.value || null })}>
          <option value="">Shared · all teams</option>
          {Object.values(s.teams).map((tm) => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
        </select>
      </ISection>}

      {node.kind !== 'item' ? <ISection label="Main Content">
        <TextField label="Description" textarea value={node.body} onCommit={(v) => upd({ body: v })} />
        <SectionLabel>Image · optional</SectionLabel>
        <ImageUploader coll="nodes" entity={node} label="Node image" />
      </ISection>

      : null}

      {node.kind === 'item' && <StoryItemInspectorFields node={node} onPatch={upd} game={s} lib={lib} graph={{ nodes: s.nodes }} />}

      {node.kind !== 'item' && <CompositionSection node={node} />}

      {node.kind === 'event' && (
        <ISection label="Type-specific · Event">
          <SectionLabel>Apply Story Concept</SectionLabel>
          <select className="field-input" value={node.conceptId ?? ''} onChange={(e) => upd({ conceptId: e.target.value || null })}>
            <option value="">— none —</option>
            {storyConcepts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {appliedConcept?.questions?.map((q) => (
            <TextField key={q.key} label={q.label} textarea
              value={node.conceptAnswers?.[q.key] ?? ''}
              onCommit={(v) => upd({ conceptAnswers: { ...(node.conceptAnswers || {}), [q.key]: v } })} />
          ))}
          {appliedConcept && <div className="hint">Answers live only in this game — the library template keeps its canonical name and questions.</div>}
        </ISection>
      )}
      {node.kind === 'storyLocation' && (
        <ISection label="Type-specific · Story Location">
          <SectionLabel>Archetype</SectionLabel>
          {archetype
            ? <div className="chips"><Chip color={SUBNODE_TYPES.locationArchetype.color}>{archetype.archetype}</Chip></div>
            : <div className="hint">No Location Archetype attached — add one in Composition to give this place a personality.</div>}
          <SectionLabel>Bound venue record</SectionLabel>
          <select className="field-input" value={node.locationId ?? ''} onChange={(e) => upd({ locationId: e.target.value || null })}>
            <option value="">— none —</option>
            {Object.values(s.locations).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </ISection>
      )}
      {false && node.kind === 'item' && (
        <ISection label="Type-specific · Item">
          <SectionLabel>Type</SectionLabel>
          <select className="field-input" value={node.itemType || 'Key'} onChange={(e) => upd({ itemType: e.target.value })}>
            {STORY_ITEM_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <TextField label="Origin" textarea value={node.origin} onCommit={(v) => upd({ origin: v })} />
          <SectionLabel>Bound prop record</SectionLabel>
          <select className="field-input" value={node.itemId ?? ''} onChange={(e) => upd({ itemId: e.target.value || null })}>
            <option value="">— none —</option>
            {Object.values(s.items).map((i) => <option key={i.id} value={i.id}>{i.name} · {i.id}</option>)}
          </select>
          {node.itemId && s.items[node.itemId] && <div className="chips" style={{ marginTop: 8 }}><Pill availability={s.items[node.itemId].availability} /></div>}
        </ISection>
      )}
      {node.kind === 'character' && (
        <ISection label="Type-specific · Character">
          <TextField label="Casting / actor notes" textarea value={node.casting} onCommit={(v) => upd({ casting: v })}
            placeholder="Author intent and key lines — real actors improvise within bounds." />
        </ISection>
      )}

      {node.kind === 'item' ? (
        <div className="savebox">
          <button className="btn primary wide" onClick={saveToLibrary}>{savedAs ? `Saved ${savedAs}` : 'Save as Base Node'}</button>
        </div>
      ) : (
        <RelationshipsSection node={node} extra={(
          <div className="savebox">
            <button className="btn primary wide" onClick={saveToLibrary}>{savedAs ? `Saved ${savedAs}` : 'Save as Base Node'}</button>
          </div>
        )} />
      )}
      {false && node.kind === 'item' && (
        <ISection label="Persistence">
          <label className="checkrow">
            <input type="checkbox" checked={!!node.persistsAcrossTasks} onChange={(e) => upd({ persistsAcrossTasks: e.target.checked })} />
            <span>Persists across tasks</span>
          </label>
        </ISection>
      )}
      <HistorySection entity={node} />
    </>
  );
}

// ---- Additional Node instance (concept container) on the game canvas ----
function ConceptPanel({ node }) {
  const s = useGame();
  const lib = useLibrary();
  const dispatch = useDispatch();
  const libDispatch = useLibraryDispatch();
  const upd = (patch) => dispatch({ type: 'UPDATE_ENTITY', coll: 'nodes', id: node.id, patch });
  const meta = ADDITIONAL_NODE_TYPES[node.conceptKind] || { label: 'Concept', color: '#E8D25C', icon: 'book' };
  const template = node.conceptId ? lib.concepts?.[node.conceptId] : null;
  const cnt = Object.keys(node.sub?.nodes || {}).length;
  const [savedAs, setSavedAs] = useState(null);
  const [savedStructureAs, setSavedStructureAs] = useState(null);
  const insertReferenceFramework = (frameworkId) => {
    const type = FRAMEWORK_TYPES[frameworkId];
    if (!type) return;
    const sub = node.sub || {};
    const subNodes = sub.nodes || {};
    const id = genId(subNodes, 'FW-');
    upd({
      referenceFrameworkIds: Array.from(new Set([...(node.referenceFrameworkIds || []), frameworkId])),
      sub: {
        ...sub,
        nodes: {
          ...subNodes,
          [id]: {
            id,
            kind: 'framework',
            frameworkId,
            title: type.title || type.label,
            x: 90 + Object.keys(subNodes).length * 24,
            y: 90 + Object.keys(subNodes).length * 18,
            body: type.summary,
            color: type.color,
          },
        },
        edges: sub.edges || [],
        frames: sub.frames || {},
        numberMarkers: sub.numberMarkers || {},
        titleMarkers: sub.titleMarkers || {},
      },
    });
  };
  const saveAsConcept = () => {
    const id = genId(lib.concepts || {}, 'LIB-CPT-N');
    libDispatch({
      type: 'ADD_ENTITY', coll: 'concepts',
      entity: {
        id, category: node.conceptKind || 'storyConcept',
        name: node.name || node.title,
        description: node.description || node.body || '',
        conceptType: node.conceptType ?? CONCEPT_UNSET,
        status: node.status ?? 'seed',
        onePromise: node.onePromise || '',
        referenceFrameworkIds: JSON.parse(JSON.stringify(node.referenceFrameworkIds || [])),
        premade: false, questions: [], example: {}, nodes: node.sub?.nodes || {}, edges: node.sub?.edges || []
      },
    });
    setSavedAs(id);
    setTimeout(() => setSavedAs(null), 5000);
  };
  const saveAsStoryStructure = () => {
    const id = genId(lib.stories || {}, 'LIB-STORY-N');
    const nodes = JSON.parse(JSON.stringify(node.sub?.nodes || {}));
    const edges = JSON.parse(JSON.stringify(node.sub?.edges || []));
    libDispatch({
      type: 'ADD_ENTITY', coll: 'stories',
      entity: {
        id,
        name: node.title,
        description: node.body || `${node.title} reusable story structure.`,
        estMinutes: 15,
        nodes,
        edges,
      },
    });
    setSavedStructureAs(id);
    setTimeout(() => setSavedStructureAs(null), 5000);
  };
  return (
    <>
      <div className="ihead">
        <div className="ihrow"><span className="sq big" style={{ background: meta.color }}><PrimIcon icon={meta.icon} color="#fff" size={13} /></span><h3>{node.title}</h3></div>
        <div className="sub">{meta.label} · {cnt} internal node{cnt === 1 ? '' : 's'}{template && <> · from <b>{template.name}</b></>}</div>
      </div>
      <ConceptFieldsEditor entity={node} onPatch={upd} onInsertReferenceFramework={insertReferenceFramework} />
      <ISection label="Canvas Display" collapsed>
        <div className="chips">
          <button className="btn" onClick={() => upd({ collapsed: !(node.collapsed !== false) ? false : true })}>
            {node.collapsed === false ? '⊟ Collapse on canvas' : '⊞ Expand on canvas'}
          </button>
        </div>
        <div className="hint">Double-click the node (or its ✎ Edit) to open the dedicated editing viewport.</div>
      </ISection>
      <ISection label="Relationships / Links">
        <button className="btn primary wide" onClick={saveAsConcept}>{savedAs ? `Saved concept ${savedAs}` : 'Save as Concept'}</button>
        <button className="btn wide" style={{ marginTop: 8 }} onClick={saveAsStoryStructure}>{savedStructureAs ? `Saved structure ${savedStructureAs}` : 'Save as Story Structure'}</button>
        <div className="chips" style={{ marginTop: 8 }}>
          <button className="linkbtn" onClick={() => {
            const frameId = genId(s.frames || {}, 'FR-');
            dispatch({ type: 'COMPOSITE_TO_FRAME', nodeId: node.id, frameId });
          }}>▭ Convert to Frame (spill contents onto canvas)</button>
        </div>
        <div className="chips" style={{ marginTop: 8 }}>
          <button className="linkbtn danger" onClick={() => {
            if (!window.confirm(`Delete concept "${node.title}" from this canvas?`)) return;
            dispatch({ type: 'DELETE_NODE', nodeId: node.id });
          }}>Delete concept node</button>
        </div>
      </ISection>
      <HistorySection entity={node} />
    </>
  );
}

// ---- Child-subnode chips + creators shared by relChange / internalState and
// individual Outcome branches. parentRef = {subnodeId, branchIndex?}.
function ChildSubnodes({ parentId, branchIndex = null, onOpen }) {
  const s = useGame();
  const dispatch = useDispatch();
  const children = Object.values(s.subnodes || {}).filter((sn) =>
    sn.parentRef?.subnodeId === parentId && (sn.parentRef.branchIndex ?? null) === branchIndex);
  const create = (kind) => {
    const parent = s.subnodes[parentId];
    const id = genId(s.subnodes || {}, `${s.meta.prefix}-SB-`);
    dispatch({
      type: 'ADD_ENTITY', coll: 'subnodes',
      entity: { ...SUBNODE_BLANK(id, kind), x: (parent?.x ?? 100) + 60, y: (parent?.y ?? 100) + 150, parentRef: { subnodeId: parentId, ...(branchIndex != null ? { branchIndex } : {}) } },
    });
  };
  return (
    <div className="chips childsubs">
      {children.map((sn) => {
        const t = SUBNODE_TYPES[sn.kind];
        return <Chip key={sn.id} color={t?.color} onClick={() => onOpen(sn.id)}
          onRemove={() => dispatch({ type: 'UPDATE_ENTITY', coll: 'subnodes', id: sn.id, patch: { parentRef: null } })}>{sn.title}</Chip>;
      })}
      <button className="linkbtn" onClick={() => create('narrativeResponse')}>+ Narrative Response</button>
      <button className="linkbtn" onClick={() => create('emotionalTone')}>+ Emotional Tone</button>
    </div>
  );
}

// ---- Subnode inspector: opens as its OWN panel (parent stays reachable) ----
function SubnodePanel({ sn, onSelect }) {
  const s = useGame();
  const lib = useLibrary();
  const dispatch = useDispatch();
  const libDispatch = useLibraryDispatch();
  const upd = (patch) => dispatch({ type: 'UPDATE_ENTITY', coll: 'subnodes', id: sn.id, patch });
  const t = SUBNODE_TYPES[sn.kind] || { label: sn.kind, color: '#F08CB4', icon: 'zap' };
  const [savedAs, setSavedAs] = useState(null);
  const saveToLibrary = () => {
    const { id: _id, x: _x, y: _y, parentRef: _parentRef, history: _history, ...template } = sn;
    const id = genId(lib.narrative || {}, 'LIB-NAR-');
    libDispatch({
      type: 'ADD_ENTITY',
      coll: 'narrative',
      entity: {
        id, nodeClass: 'subnode', subKind: sn.kind,
        name: sn.title, category: sn.kind, color: t.color, icon: t.icon,
        body: sn.notes || t.blurb || '', tags: sn.keywords || [], inputs: ['in'], outputs: ['out'],
        template,
      },
    });
    setSavedAs(id);
    setTimeout(() => setSavedAs(null), 5000);
  };
  const pr = sn.parentRef;
  const parentNode = pr?.nodeId ? s.nodes[pr.nodeId] : null;
  const parentSub = pr?.subnodeId ? s.subnodes[pr.subnodeId] : null;
  const openParent = () => {
    if (parentNode) onSelect({ kind: 'node', id: parentNode.id });
    else if (parentSub) onSelect({ kind: 'subnode', id: parentSub.id });
  };

  // Attach targets for a floating subnode.
  const nodeTargets = t.attachesTo
    ? Object.values(s.nodes).filter((n) => t.attachesTo.includes('*') ? n.kind !== 'concept' : t.attachesTo.includes(n.kind))
    : [];
  const subTargets = t.childOf ? Object.values(s.subnodes || {}).filter((x) => t.childOf.includes(x.kind) && x.id !== sn.id) : [];
  const branchTargets = t.childOf?.includes('branch')
    ? Object.values(s.subnodes || {}).filter((x) => x.kind === 'outcomeBranches')
      .flatMap((ob) => (ob.branches || []).map((b, i) => ({ value: `${ob.id}:${i}`, label: `${ob.title} → ${b.label}` })))
    : [];

  const mechSelect = (value, onChange) => (
    <select className="field-input" value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">— no mechanic link —</option>
      {Object.values(lib.mechanics).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
    </select>
  );

  const branches = sn.branches || [];
  const patchBranch = (i, p) => upd({ branches: branches.map((b, j) => (j === i ? { ...b, ...p } : b)) });

  return (
    <div className="subpanelwrap">
      <div className="subpanelbadge" style={{ borderColor: t.color, color: t.color }}>Subnode — separate panel</div>
      <div className="ihead">
        <div className="ihrow"><span className="sq big pillsq" style={{ background: t.color }}><PrimIcon icon={t.icon} color="#fff" size={13} /></span><h3>{sn.title}</h3></div>
        <div className="sub">{t.label} · <span className="mono">{sn.id}</span></div>
      </div>

      <ISection label="Core Identity">
        <TextField label="Title" value={sn.title} onCommit={(v) => upd({ title: v })} />
        <SectionLabel>Attached to</SectionLabel>
        {pr ? (
          <div className="chips">
            <Chip color={t.color} onClick={openParent}>
              {parentNode?.title || parentSub?.title || '?'}{pr.branchIndex != null && parentSub?.branches?.[pr.branchIndex] ? ` → ${parentSub.branches[pr.branchIndex].label}` : ''}
            </Chip>
            <button className="linkbtn" onClick={() => upd({ parentRef: null })}>⊘ Detach</button>
          </div>
        ) : (
          <>
            <div className="hint">Floating — physically on the canvas, not yet linked.</div>
            {nodeTargets.length > 0 && (
              <select className="chip-add" value="" onChange={(e) => e.target.value && upd({ parentRef: { nodeId: e.target.value } })}>
                <option value="">⚭ attach to a node…</option>
                {nodeTargets.map((n) => <option key={n.id} value={n.id}>{n.title} · {BASE_NODE_TYPES[n.kind]?.label ?? n.kind}</option>)}
              </select>
            )}
            {subTargets.length > 0 && (
              <select className="chip-add" value="" onChange={(e) => e.target.value && upd({ parentRef: { subnodeId: e.target.value } })}>
                <option value="">⚭ attach to a subnode…</option>
                {subTargets.map((x) => <option key={x.id} value={x.id}>{x.title} · {SUBNODE_TYPES[x.kind]?.label}</option>)}
              </select>
            )}
            {branchTargets.length > 0 && (
              <select className="chip-add" value="" onChange={(e) => {
                if (!e.target.value) return;
                const [sid, bi] = e.target.value.split(':');
                upd({ parentRef: { subnodeId: sid, branchIndex: Number(bi) } });
              }}>
                <option value="">⚭ attach to an outcome branch…</option>
                {branchTargets.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            )}
          </>
        )}
      </ISection>
      {sn.kind === 'outcomeBranches' && (
        <ISection label={`Main Content · ${branches.length} branches`}>
          <div className="frow">
            <div><SectionLabel>Branch mode</SectionLabel>
              <select className="field-input" value={sn.mode} onChange={(e) => upd({ mode: e.target.value })}>
                <option value="choice">Choice-based</option>
                <option value="performance">Performance-based</option>
                <option value="mixed">Mixed</option>
              </select></div>
            <div><SectionLabel>Selection</SectionLabel>
              <select className="field-input" value={sn.selectionType} onChange={(e) => upd({ selectionType: e.target.value })}>
                <option value="single">Single-select</option>
                <option value="multi">Multi-select</option>
              </select></div>
          </div>
          <div className="hint">Story context and flavor text belong in the parent Event / Quest — branches hold only outcomes. Merge paths by connecting branches to the same later node on the canvas.</div>
          {branches.map((b, i) => (
            <div className="branchcard" key={i}>
              <div className="branchhead">
                <span className="branchno" style={{ background: t.color }}>{i + 1}</span>
                <input className="field-input" value={b.label} placeholder="Branch label"
                  onChange={(e) => patchBranch(i, { label: e.target.value })} />
                {branches.length > 2 && <button className="x" title="Remove branch" onClick={() => upd({ branches: branches.filter((_, j) => j !== i) })}>×</button>}
              </div>
              <textarea className="field-input" rows={2} value={b.outcome} placeholder="Narrative outcome (what this path means)"
                onChange={(e) => patchBranch(i, { outcome: e.target.value })} />
              <SectionLabel>Link to Mechanic Node</SectionLabel>
              {mechSelect(b.mechanicId, (v) => patchBranch(i, { mechanicId: v }))}
              <SectionLabel>Attached subnodes</SectionLabel>
              <ChildSubnodes parentId={sn.id} branchIndex={i} onOpen={(id) => onSelect({ kind: 'subnode', id })} />
            </div>
          ))}
          {branches.length < 5 && (
            <button className="chip addcat" onClick={() => upd({ branches: [...branches, { label: `Branch ${String.fromCharCode(65 + branches.length)}`, outcome: '', mechanicId: null }] })}>
              + Add branch ({branches.length}/5)
            </button>
          )}
        </ISection>
      )}

      {sn.kind === 'relChange' && (
        <ISection label="Main Content">
          <TextField label="Relationship type" value={sn.relType} onCommit={(v) => upd({ relType: v })} placeholder="Trust, loyalty, rivalry, faction standing…" />
          <TextField label="Target(s)" value={sn.targets} onCommit={(v) => upd({ targets: v })} placeholder="Who ↔ whom" />
          <SectionLabel>Change direction (graduated)</SectionLabel>
          <select className="field-input" value={sn.direction} onChange={(e) => upd({ direction: e.target.value })}>
            {GRADUATED_OUTCOMES.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
          <TextField label="Intensity" value={sn.intensity} onCommit={(v) => upd({ intensity: v })} placeholder="mild / moderate / severe" />
          <TextField label="Trigger / cause" textarea value={sn.trigger} onCommit={(v) => upd({ trigger: v })} />
          <TextField label="Functional effects · what paths this opens or closes" textarea value={sn.effects} onCommit={(v) => upd({ effects: v })} />
          <SectionLabel>Link to Mechanic Node</SectionLabel>
          {mechSelect(sn.mechanicId, (v) => upd({ mechanicId: v }))}
          <SectionLabel>Child subnodes</SectionLabel>
          <ChildSubnodes parentId={sn.id} onOpen={(id) => onSelect({ kind: 'subnode', id })} />
        </ISection>
      )}

      {sn.kind === 'internalState' && (
        <ISection label="Main Content">
          <TextField label="State type" value={sn.stateType} onCommit={(v) => upd({ stateType: v })} placeholder="Grief, Poisoned, Boosted, Victorious, Transformed…" />
          <TextField label="Intensity / level" value={sn.level} onCommit={(v) => upd({ level: v })} />
          <TextField label="Trigger / cause" textarea value={sn.trigger} onCommit={(v) => upd({ trigger: v })} />
          <TextField label="Functional effects · what this state changes" textarea value={sn.effects} onCommit={(v) => upd({ effects: v })} />
          <SectionLabel>Link to Mechanic Node</SectionLabel>
          {mechSelect(sn.mechanicId, (v) => upd({ mechanicId: v }))}
          <SectionLabel>Child subnodes</SectionLabel>
          <ChildSubnodes parentId={sn.id} onOpen={(id) => onSelect({ kind: 'subnode', id })} />
        </ISection>
      )}

      {sn.kind === 'locationArchetype' && (
        <ISection label="Main Content">
          <SectionLabel>Archetype</SectionLabel>
          <select className="field-input" value={LOCATION_ARCHETYPES.includes(sn.archetype) ? sn.archetype : '__custom'}
            onChange={(e) => e.target.value !== '__custom' && upd({ archetype: e.target.value })}>
            {LOCATION_ARCHETYPES.map((a) => <option key={a} value={a}>{a}</option>)}
            {!LOCATION_ARCHETYPES.includes(sn.archetype) && <option value="__custom">{sn.archetype} (custom)</option>}
          </select>
          <TextField label="Custom archetype" value={sn.archetype} onCommit={(v) => v.trim() && upd({ archetype: v.trim() })} />
          <TextField label="How it flavors events & quests here" textarea value={sn.influence} onCommit={(v) => upd({ influence: v })} />
        </ISection>
      )}

      {sn.kind === 'narrativeResponse' && (
        <ISection label="Main Content">
          <TextField label="Story consequence · rich text" textarea value={sn.text} onCommit={(v) => upd({ text: v })} />
        </ISection>
      )}

      {sn.kind === 'emotionalTone' && (
        <ISection label="Main Content">
          <TextField label="Tone tags (comma separated)" value={(sn.tags || []).join(', ')}
            onCommit={(v) => upd({ tags: v.split(',').map((x) => x.trim()).filter(Boolean) })}
            placeholder="Cold Fury, Quiet Hope, Lingering Distrust" />
          <div className="chips">{(sn.tags || []).map((tag) => <Chip key={tag} color={t.color}>{tag}</Chip>)}</div>
        </ISection>
      )}

      {sn.kind === 'comment' && (
        <ISection label="Main Content">
          <TextField label="Notes" textarea value={sn.notes} onCommit={(v) => upd({ notes: v })} />
        </ISection>
      )}

      {sn.kind === 'characterState' && (
        <ISection label="Main Content">
          <TextField label="Emotional State" value={sn.emotionalState} onCommit={(v) => upd({ emotionalState: v })} placeholder="Neutral, Sad, Angry, Hostile, Allied..." />
          <TextField label="Behavioral Notes" textarea value={sn.behavioralNotes} onCommit={(v) => upd({ behavioralNotes: v })} />
          <TextField label="Effects / Dialogue Behavior" textarea value={sn.effects} onCommit={(v) => upd({ effects: v })} />
        </ISection>
      )}

      {sn.kind === 'value' && (
        <ISection label="Main Content">
          <SectionLabel>Purpose</SectionLabel>
          <div className="field-input readonlyfield">{sn.purpose || t.blurb}</div>
          <TextField label="Initial Value" value={sn.initialValue} onCommit={(v) => upd({ initialValue: v })} />
          <TextField label="Current Value" value={sn.currentValue} onCommit={(v) => upd({ currentValue: v })} />
          <TextField label="Max Value" value={sn.maxValue} onCommit={(v) => upd({ maxValue: v })} />
        </ISection>
      )}

      {sn.kind === 'lifespan' && (
        <ISection label="Main Content">
          <SectionLabel>Purpose</SectionLabel>
          <div className="field-input readonlyfield">{sn.purpose || t.blurb}</div>
          <SectionLabel>Lifespan Type</SectionLabel>
          <select className="field-input" value={sn.lifespanType || 'Task only'} onChange={(e) => upd({ lifespanType: e.target.value })}>
            {['Task only', 'Full session/game', 'Permanent / Carries between sessions', 'Custom'].map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <TextField label="Description" textarea value={sn.description} onCommit={(v) => upd({ description: v })} />
        </ISection>
      )}

      {sn.kind === 'spendUseRule' && (
        <ISection label="Main Content">
          <SectionLabel>Purpose</SectionLabel>
          <div className="field-input readonlyfield">{sn.purpose || t.blurb}</div>
          <TextField label="Usage Rules" textarea value={sn.usageRules} onCommit={(v) => upd({ usageRules: v })} />
          <TextField label="Limitations" textarea value={sn.limitations} onCommit={(v) => upd({ limitations: v })} />
        </ISection>
      )}

      <ISection label="Relationships / Links">
        <button className="btn primary wide" onClick={saveToLibrary}>{savedAs ? `Saved ${savedAs}` : 'Save to Library as subnode template'}</button>
        <div className="hint">Saving is optional. This game copy remains separate from the reusable Library template.</div>
      </ISection>

      <HistorySection entity={sn} />
      <div className="isect">
        <button className="linkbtn danger" onClick={() => { dispatch({ type: 'DELETE_SUBNODE', subnodeId: sn.id }); onSelect(null); }}>Delete subnode (and its children)</button>
      </div>
    </div>
  );
}

function FrameAppearanceFields({ frame, onPatch }) {
  const isLine = frame.shape === 'arrow' || frame.shape === 'spline';
  const supportName = frame.shape === 'spline' ? 'Spline' : frame.shape === 'arrow' ? 'Arrow' : 'Frame';
  const hasBackground = !isLine;
  const backgroundOpacity = frameBackgroundOpacity(frame.backgroundOpacity);
  return (
    <div className="isect frame-appearance-fields">
      {!frame.shape && (
        <label className="frame-sticky-toggle">
          <input
            type="checkbox"
            checked={frame.sticky === true}
            aria-label="Move contents with frame"
            onChange={(e) => onPatch({ sticky: e.target.checked })}
          />
          <span>
            <b>Move contents with frame</b>
            <small>When enabled, dragging the frame carries everything inside it.</small>
          </span>
        </label>
      )}
      <SectionLabel>{supportName} color</SectionLabel>
      <div className="chips">
        {FRAME_SWATCHES.map((c) => <button key={c} className={`swatch${(frame.color || '#8B92A6') === c ? ' on' : ''}`} style={{ background: c }} title={`Use ${c} for the ${isLine ? supportName.toLowerCase() : 'frame border'}`} onClick={() => onPatch({ color: c })} />)}
        <button className="linkbtn" onClick={() => onPatch({ color: null })}>Default</button>
      </div>
      {hasBackground && <>
        <SectionLabel>Background color</SectionLabel>
        <div className="chips">
          <button
            className={`swatch transparent${!frame.backgroundColor ? ' on' : ''}`}
            title="Transparent background"
            onClick={() => onPatch({ backgroundColor: null })}
          />
          {FRAME_SWATCHES.map((c) => <button key={c} className={`swatch${frame.backgroundColor === c ? ' on' : ''}`} style={{ background: c }} title={`Use ${c} for the background`} onClick={() => onPatch({ backgroundColor: c })} />)}
          <button className="linkbtn" onClick={() => onPatch({ backgroundColor: null })}>Transparent</button>
        </div>
        <label className={`frame-opacity-row${!frame.backgroundColor ? ' disabled' : ''}`}>
          <span>Background opacity</span>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={backgroundOpacity}
            disabled={!frame.backgroundColor}
            aria-label="Background opacity"
            onChange={(e) => onPatch({ backgroundOpacity: Number(e.target.value) })}
          />
          <output>{backgroundOpacity}%</output>
        </label>
      </>}
    </div>
  );
}

// ---- Frame: purely visual grouping ----
function FramePanel({ frame, onSelect }) {
  const s = useGame();
  const dispatch = useDispatch();
  const isPlainFrame = !frame.shape;
  const supportLabel = frame.shape === 'spline' ? 'Spline' : frame.shape === 'arrow' ? 'Arrow' : frame.shape === 'circle' ? 'Circle' : 'Frame';
  const upd = (patch) => dispatch({ type: 'UPDATE_ENTITY', coll: 'frames', id: frame.id, patch });
  return (
    <>
      <div className="ihead">
        <div className="ihrow"><span className="sq big" style={{ background: frame.color || '#8B92A6' }} /><h3>{frame.label}</h3></div>
        <div className="sub">{supportLabel} · visual support only — connections and data are unaffected</div>
      </div>
      <ISection label="Core Identity">
        <TextField label="Label" value={frame.label} onCommit={(v) => upd({ label: v })} />
      </ISection>
      <FrameAppearanceFields frame={frame} onPatch={upd} />
      {isPlainFrame && <ISection label="Convert">
        <button className="btn wide" onClick={() => {
          const nodeId = genId(s.nodes, `${s.meta.prefix}-N-`);
          dispatch({ type: 'FRAME_TO_COMPOSITE', frameId: frame.id, nodeId });
          onSelect({ kind: 'node', id: nodeId });
        }}>⧉ Convert to Composite (concept node)</button>
        <div className="hint">Everything inside moves into the new node's internal structure; boundary-crossing connections re-point to it.</div>
      </ISection>}
      <div className="isect">
        <button className="linkbtn danger" onClick={() => { dispatch({ type: 'DELETE_ENTITY', coll: 'frames', id: frame.id }); onSelect(null); }}>Delete {frame.shape || 'frame'}{!frame.shape ? ' (contents stay)' : ''}</button>
      </div>
    </>
  );
}

function FrameworkPanel({ framework, onSelect }) {
  const dispatch = useDispatch();
  const type = FRAMEWORK_TYPES[framework.frameworkId] || FRAMEWORK_TYPES.fate;
  const isValueFramework = type.layout === 'values';
  const upd = (patch) => dispatch({ type: 'UPDATE_ENTITY', coll: 'frameworks', id: framework.id, patch });
  return (
    <>
      <div className="ihead">
        <div className="ihrow">
          <span className="sq big" style={{ background: framework.color || type.color }}><PrimIcon icon={type.icon} color="#fff" size={13} /></span>
          <h3>{framework.title || type.title}</h3>
        </div>
        <div className="sub">Reference framework · not a game node · {framework.id}</div>
      </div>
      <ISection label="Reference Only">
        <div className={`fw-inspector-card${isValueFramework ? ' values' : ''}`}>
          {type.phases.map((phase, idx) => (
            <div key={phase.key}>
              <span>{idx + 1}</span>
              <b>{phase.key}</b>
              <small>{phase.name}</small>
            </div>
          ))}
        </div>
        <div className="hint">Framework cards are thinking aids while you build. They can be dragged around and deleted, but they do not connect to story nodes or affect game data.</div>
      </ISection>
      <TextField label="Framework title" value={framework.title || type.title} onCommit={(v) => upd({ title: v })} />
      <ISection label={isValueFramework ? 'Value Poles' : 'Acronym / Phases'}>
        <div className="fwphase-list">
          {type.phases.map((phase) => (
            <div key={phase.key} className={`fwphase${isValueFramework ? ' valuepole' : ''}`}>
              <span style={{ background: framework.color || type.color }}>{phase.key}</span>
              <div>
                <b>{phase.name}</b>
                <p>{phase.short}</p>
                <small>{phase.detail}</small>
              </div>
            </div>
          ))}
        </div>
      </ISection>
      <ISection label="Canvas">
        <div className="chips">
          {NODE_SWATCHES.map((c) => <button key={c} className={`swatch${(framework.color || type.color) === c ? ' on' : ''}`} style={{ background: c }} onClick={() => upd({ color: c })} />)}
          <button className="linkbtn" onClick={() => upd({ color: type.color })}>Default</button>
        </div>
        <button className="linkbtn danger" style={{ marginTop: 10 }} onClick={() => {
          dispatch({ type: 'DELETE_ENTITY', coll: 'frameworks', id: framework.id });
          onSelect(null);
        }}>Delete reference card</button>
      </ISection>
    </>
  );
}

function GraphFramePanel({ scope, id, onSelect }) {
  const s = useGame();
  const dispatch = useDispatch();
  const g = locateGraph(s, scope);
  const frame = g.frames?.[id];
  const supportLabel = frame?.shape === 'spline' ? 'Spline' : frame?.shape === 'arrow' ? 'Arrow' : frame?.shape === 'circle' ? 'Circle' : 'Frame';
  if (!frame) return <div className="empty">Frame not found.</div>;
  const upd = (patch) => dispatch({ type: 'GRAPH_UPDATE_FRAME', scope, id, patch });
  return (
    <>
      <div className="ihead">
        <div className="ihrow"><span className="sq big" style={{ background: frame.color || '#8B92A6' }} /><h3>{frame.label || supportLabel}</h3></div>
        <div className="sub">{supportLabel} · visual support only · {frame.id}</div>
      </div>
      <TextField label="Label" value={frame.label || 'Frame'} onCommit={(v) => upd({ label: v })} />
      <FrameAppearanceFields frame={frame} onPatch={upd} />
      <div className="isect">
        <button className="linkbtn danger" onClick={() => {
          dispatch({ type: 'GRAPH_DELETE_FRAME', scope, id });
          onSelect(null);
        }}>Delete {supportLabel.toLowerCase()}{!frame.shape ? ' (contents stay)' : ''}</button>
      </div>
    </>
  );
}

function NumberMarkerFields({ marker, onPatch, onDelete }) {
  const color = marker.color || '#E8D25C';
  const isLetter = marker.markerType === 'letter';
  const label = visualMarkerLabel(marker);
  const size = visualMarkerPixelSize(marker);
  const [sizeDraft, setSizeDraft] = useState(String(size));
  React.useEffect(() => setSizeDraft(String(size)), [size]);
  const setSize = (pixels) => onPatch({ scale: visualMarkerScaleFromPixels(pixels, size) });
  const commitSize = () => {
    const scale = visualMarkerScaleFromPixels(sizeDraft, size);
    const nextSize = visualMarkerPixelSize({ scale });
    setSizeDraft(String(nextSize));
    if (nextSize !== size) onPatch({ scale });
  };
  return (
    <>
      {isLetter ? (
        <div className="isect">
          <SectionLabel>Letter</SectionLabel>
          <select className="field-input" value={String(marker.value || 'A').toUpperCase()}
            onChange={(event) => onPatch({ value: event.target.value })}>
            {MARKER_LETTERS.map((letter) => <option key={letter} value={letter}>{letter}</option>)}
          </select>
        </div>
      ) : (
        <TextField label="Number" value={String(marker.value ?? 1)} onCommit={(v) => {
          const parsed = parseInt(v, 10);
          onPatch({ value: Number.isFinite(parsed) ? parsed : marker.value });
        }} />
      )}
      <div className="isect">
        <SectionLabel>Marker size</SectionLabel>
        <div className="marker-size-controls">
          <label>
            <span>Diameter · px</span>
            <input className="field-input" type="number" min={VISUAL_MARKER_MIN_SIZE} max={VISUAL_MARKER_MAX_SIZE} step="1"
              value={sizeDraft} onChange={(event) => setSizeDraft(event.target.value)} onBlur={commitSize}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  commitSize();
                  event.currentTarget.blur();
                }
              }} />
          </label>
          <input className="marker-size-slider" aria-label="Marker size slider" type="range"
            min={VISUAL_MARKER_MIN_SIZE} max={VISUAL_MARKER_MAX_SIZE} step="1"
            value={Math.max(VISUAL_MARKER_MIN_SIZE, Math.min(VISUAL_MARKER_MAX_SIZE, size))}
            onChange={(event) => setSize(Number(event.target.value))} />
        </div>
        <div className="flow marker-size-presets">
          {[['Small', 34], ['Medium', 52], ['Large', 72], ['XL', 104]].map(([name, pixels]) => (
            <button key={name} className={size === pixels ? 'now' : ''} onClick={() => setSize(pixels)}>{name}</button>
          ))}
        </div>
        <div className="hint">The circle and its letter or number scale together.</div>
      </div>
      <div className="isect">
        <SectionLabel>Marker color</SectionLabel>
        <div className="chips">
          {NODE_SWATCHES.map((c) => <button key={c} className={`swatch${color === c ? ' on' : ''}`} style={{ background: c }} onClick={() => onPatch({ color: c })} />)}
          <button className="linkbtn" onClick={() => onPatch({ color: '#E8D25C' })}>Default</button>
        </div>
      </div>
      <div className="isect">
        <button className="linkbtn danger" onClick={onDelete}>Delete {label.toLowerCase()} marker</button>
      </div>
    </>
  );
}

function NumberMarkerPanel({ marker, onSelect }) {
  const dispatch = useDispatch();
  const upd = (patch) => dispatch({ type: 'UPDATE_ENTITY', coll: 'numberMarkers', id: marker.id, patch });
  return (
    <>
      <div className="ihead">
        <div className="ihrow"><span className="sq big" style={{ background: marker.color || '#E8D25C', color: '#111' }}>{marker.value ?? 1}</span><h3>{visualMarkerLabel(marker)} marker</h3></div>
        <div className="sub">Visual symbol only Â· {marker.id}</div>
      </div>
      <NumberMarkerFields marker={marker} onPatch={upd} onDelete={() => { dispatch({ type: 'DELETE_ENTITY', coll: 'numberMarkers', id: marker.id }); onSelect(null); }} />
    </>
  );
}

function GraphNumberMarkerPanel({ scope, id, onSelect }) {
  const s = useGame();
  const dispatch = useDispatch();
  const g = locateGraph(s, scope);
  const marker = g.numberMarkers?.[id];
  if (!marker) return <div className="empty">Visual marker not found.</div>;
  const upd = (patch) => dispatch({ type: 'GRAPH_UPDATE_NUMBER_MARKER', scope, id, patch });
  return (
    <>
      <div className="ihead">
        <div className="ihrow"><span className="sq big" style={{ background: marker.color || '#E8D25C', color: '#111' }}>{marker.value ?? 1}</span><h3>{visualMarkerLabel(marker)} marker</h3></div>
        <div className="sub">Visual symbol only Â· {marker.id}</div>
      </div>
      <NumberMarkerFields marker={marker} onPatch={upd} onDelete={() => { dispatch({ type: 'GRAPH_DELETE_NUMBER_MARKER', scope, id }); onSelect(null); }} />
    </>
  );
}

function TitleMarkerFields({ marker, onPatch, onDelete }) {
  const color = marker.color || '#E9EBF3';
  return (
    <>
      <TextField label="Title text" textarea value={marker.text || 'Title'} onCommit={(v) => onPatch({ text: v || 'Title' })} />
      <TextField label="Font size" value={String(marker.fontSize ?? 28)} onCommit={(v) => {
        const parsed = parseInt(v, 10);
        onPatch({ fontSize: Number.isFinite(parsed) ? Math.max(12, Math.min(96, parsed)) : (marker.fontSize ?? 28) });
      }} />
      <div className="isect">
        <SectionLabel>Title color</SectionLabel>
        <div className="chips">
          {NODE_SWATCHES.map((c) => <button key={c} className={`swatch${color === c ? ' on' : ''}`} style={{ background: c }} onClick={() => onPatch({ color: c })} />)}
          <button className="linkbtn" onClick={() => onPatch({ color: '#E9EBF3' })}>Default</button>
        </div>
      </div>
      <div className="isect">
        <button className="linkbtn danger" onClick={onDelete}>Delete title</button>
      </div>
    </>
  );
}

function TitleMarkerPanel({ marker, onSelect }) {
  const dispatch = useDispatch();
  const upd = (patch) => dispatch({ type: 'UPDATE_ENTITY', coll: 'titleMarkers', id: marker.id, patch });
  return (
    <>
      <div className="ihead">
        <div className="ihrow"><span className="sq big" style={{ background: marker.color || '#E9EBF3', color: '#111' }}>T</span><h3>Title</h3></div>
        <div className="sub">Visual text only Ã‚Â· {marker.id}</div>
      </div>
      <TitleMarkerFields marker={marker} onPatch={upd} onDelete={() => { dispatch({ type: 'DELETE_ENTITY', coll: 'titleMarkers', id: marker.id }); onSelect(null); }} />
    </>
  );
}

function GraphTitleMarkerPanel({ scope, id, onSelect }) {
  const s = useGame();
  const dispatch = useDispatch();
  const g = locateGraph(s, scope);
  const marker = g.titleMarkers?.[id];
  if (!marker) return <div className="empty">Title not found.</div>;
  const upd = (patch) => dispatch({ type: 'GRAPH_UPDATE_TITLE_MARKER', scope, id, patch });
  return (
    <>
      <div className="ihead">
        <div className="ihrow"><span className="sq big" style={{ background: marker.color || '#E9EBF3', color: '#111' }}>T</span><h3>Title</h3></div>
        <div className="sub">Visual text only Ã‚Â· {marker.id}</div>
      </div>
      <TitleMarkerFields marker={marker} onPatch={upd} onDelete={() => { dispatch({ type: 'GRAPH_DELETE_TITLE_MARKER', scope, id }); onSelect(null); }} />
    </>
  );
}

// ---- A node inside a located graph: a surface Task, or a nested detail node
// (of a task or a narrative beat). Edits flow through the generic GRAPH_* path.
function GraphNodePanel({ scope, id, onSelect, onNavigate }) {
  const s = useGame();
  const lib = useLibrary();
  const dispatch = useDispatch();
  const libDispatch = useLibraryDispatch();
  const g = locateGraph(s, scope);
  const n = g.nodes[id];
  const [savedAs, setSavedAs] = useState(null);
  if (!n) return <div className="empty">Node not found.</div>;
  const upd = (patch) => dispatch({ type: 'GRAPH_UPDATE_NODE', scope, id, patch });
  if (n.kind === LINKING_NODE_KIND) {
    return <LinkingNodeInspector node={n} onPatch={upd} onNavigate={onNavigate} onInsert={(ref) => {
      const inserted = buildNarrativeLinkInsertion(lib, ref, g.nodes, { x: n.x + (n.w || 280) + 50, y: n.y }, 'INS-');
      if (!inserted) return;
      dispatch({ type: 'GRAPH_ADD_NODE', scope, node: inserted });
      onSelect?.({ kind: 'graphnode', scope, id: inserted.id });
    }} />;
  }
  const isBase = !!BASE_NODE_TYPES[n.kind];
  const isConceptInternalNode = !!CONCEPT_INTERNAL_NODE_TYPES[n.kind];
  const t = n.kind === 'travel'
    ? { id: 'travel', label: 'Travel Time', color: ENTITY_COLORS.travel, icon: 'clock', blurb: 'Movement time between tasks or locations.' }
    : TASK_DETAIL_TYPES[n.kind] || CONCEPT_INTERNAL_NODE_TYPES[n.kind] || baseTemplateMeta(n.kind);
  const isTask = n.kind === 'task';
  const isTravel = n.kind === 'travel';
  const isTimelineItem = isTask || isTravel;
  const isStoryboardItem = scope.coll === 'storyboardNodes';
  const isMasterAct = n.kind === 'masterAct';
  const isMechanicSchemaNode = !!n.mechKind || n.kind === 'mechanicSubnode' || !!n.physicalKind;
  const isTaskTemplate = n.mechKind === 'taskTemplate';
  const isGraphFramework = n.kind === 'framework';
  const primitiveTemplate = n.primitiveId ? lib.mechPrimitives?.[n.primitiveId] : null;
  const deprecatedPrimitive = primitiveTemplate?.deprecated ? primitiveTemplate : null;
  const typePool = isBase ? BASE_NODE_TYPES : TASK_DETAIL_TYPES;
  const color = n.color || t?.color || ENTITY_COLORS[n.kind] || (isMasterAct ? '#3EC6D6' : '#8B92A6');
  const subCount = Object.keys(n.sub?.nodes || {}).length;
  const timelineSource = isStoryboardItem ? (s.storyboardNodes || {}) : (s.taskNodes || {});
  const taskOrder = Object.values(timelineSource).filter((x) => x.kind !== 'travel').sort((a, b) => (a.startMin ?? 9999) - (b.startMin ?? 9999) || a.x - b.x);
  const taskIndex = isTimelineItem ? taskOrder.findIndex((x) => x.id === id) : -1;
  const isFirstTask = taskIndex === 0;
  const isLastTask = taskIndex === taskOrder.length - 1;
  const num = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
  const saveMasterAct = () => {
    const id = genId(lib.narrative || {}, 'LIB-NAR-');
    libDispatch({
      type: 'ADD_ENTITY',
      coll: 'narrative',
      entity: {
        id, nodeClass: 'base', nodeKind: 'masterAct',
        name: n.title, category: 'masterAct', color, icon: MASTER_ACT_TYPE.icon,
        body: n.body || MASTER_ACT_TYPE.blurb, tags: [], inputs: ['in'], outputs: ['out'],
        template: { ...JSON.parse(JSON.stringify(n)), id: undefined, x: undefined, y: undefined },
      },
    });
    setSavedAs(id);
    setTimeout(() => setSavedAs(null), 5000);
  };
  if (n.kind === 'character') {
    return (
      <>
        <div className="ihead">
          <div className="ihrow"><span className="sq big" style={{ background: color }}>{t && <PrimIcon icon={t.icon} color="#fff" size={13} />}</span><h3>{n.title}</h3></div>
          <div className="sub">{t?.label ?? n.kind}{scope.parentId || scope.parentPath ? ' · internal node' : ''} · {n.id}</div>
        </div>
        <CharacterCardInspector
          node={n}
          onPatch={upd}
          onArchetypeChange={(patch) => dispatch({ type: 'SYNC_CHARACTER_ARCHETYPE', scope, id, patch })}
          template={s.meta.characterCardTemplate}
        />
      </>
    );
  }
  if (n.kind === CHARACTER_ARCHETYPE_FACET_KIND) {
    return <CharacterArchetypeFacetInspector node={n} onPatch={upd} />;
  }
  if (n.kind === CHARACTER_ARCHETYPE_COMBINATIONS_KIND) {
    return <CharacterArchetypeCombinationsInspector node={n} onPatch={upd} />;
  }
  if (isConceptInternalNode) {
    return (
      <>
        <div className="ihead">
          <div className="ihrow"><span className="sq big" style={{ background: color }}>{t && <PrimIcon icon={t.icon} color="#fff" size={13} />}</span><h3>{n.title}</h3></div>
          <div className="sub">{t?.label ?? n.kind} Â· concept internal node Â· {n.id}</div>
        </div>
        <ConceptInternalNodeFields node={n} onPatch={upd} />
        <div className="isect">
          <SectionLabel>Node color</SectionLabel>
          <div className="chips">
            {NODE_SWATCHES.map((c) => <button key={c} className={`swatch${color === c ? ' on' : ''}`} style={{ background: c }} onClick={() => upd({ color: c })} />)}
            <button className="linkbtn" onClick={() => upd({ color: null })}>Auto</button>
          </div>
        </div>
      </>
    );
  }
  if (isGraphFramework) {
    const type = FRAMEWORK_TYPES[n.frameworkId] || FRAMEWORK_TYPES.fate;
    const frameworkColor = n.color || type.color;
    return (
      <>
        <div className="ihead">
          <div className="ihrow">
            <span className="sq big" style={{ background: frameworkColor }}><PrimIcon icon={type.icon} color="#fff" size={13} /></span>
            <h3>{n.title || type.title}</h3>
          </div>
          <div className="sub mono">{n.id} Â· reference framework</div>
        </div>
        <TextField label="Framework title" value={n.title || type.title} onCommit={(title) => upd({ title })} />
        <div className="isect">
          <SectionLabel>Summary</SectionLabel>
          <div className="hint">{type.summary}</div>
        </div>
        <div className="isect">
          <SectionLabel>{type.layout === 'values' ? 'Value Poles' : 'Acronym / Phases'}</SectionLabel>
          <div className="fwphase-list">
            {type.phases.map((phase) => (
              <div key={phase.key} className={`fwphase${type.layout === 'values' ? ' valuepole' : ''}`}>
                <span style={{ background: frameworkColor }}>{phase.key}</span>
                <div>
                  <b>{phase.name}</b>
                  <p>{phase.short}</p>
                  <small>{phase.detail}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="isect">
          <SectionLabel>Color</SectionLabel>
          <div className="chips">
            {NODE_SWATCHES.map((c) => <button key={c} className={`swatch${frameworkColor === c ? ' on' : ''}`} style={{ background: c }} onClick={() => upd({ color: c })} />)}
            <button className="linkbtn" onClick={() => upd({ color: null })}>Auto</button>
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="ihead">
        <div className="ihrow"><span className="sq big" style={{ background: color }}>{t && <PrimIcon icon={t.icon} color="#fff" size={13} />}</span><h3>{n.title}</h3></div>
        <div className="sub">{t?.label ?? (isTask ? 'Task' : n.kind)}{scope.parentId || scope.parentPath ? ' · internal node' : ''} · {n.id}</div>
      </div>
      {deprecatedPrimitive && (
        <div className="isect">
          <div className="warnbox">
            <b>Deprecated node</b>
            <p>{deprecatedPrimitive.migrationHint || 'Use the newer replacement node for future designs.'}</p>
          </div>
        </div>
      )}
      {!isTimelineItem && !isMasterAct && !isMechanicSchemaNode && n.kind !== 'item' && (
        <div className="isect">
          <SectionLabel>{isBase ? 'Base type' : 'Detail type'}</SectionLabel>
          <select className="field-input" value={n.kind} onChange={(e) => upd({ kind: e.target.value })}>
            {Object.values(typePool).map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
            {!t && <option value={n.kind}>{n.kind}</option>}
          </select>
          {t?.blurb && <div className="hint">{t.blurb}</div>}
        </div>
      )}
      {false && n.kind === 'item' && (
        <div className="isect">
          <SectionLabel>Base type</SectionLabel>
          <div className="field-input readonlyfield">Story Item</div>
        </div>
      )}
      {n.kind !== 'item' && <TextField label={isTravel ? 'Travel label' : isTask ? 'Task name' : isMasterAct ? 'Act name' : isTaskTemplate ? 'Title' : 'Title'} value={n.title} onCommit={(v) => upd({ title: v })} />}
      {n.kind !== 'item' && n.mechKind !== 'playerFacingInstruction' && <TextField label={isTravel ? 'Travel notes / route' : isTask ? 'Task description / notes' : isMasterAct ? 'Story description' : (isTaskTemplate || isMechanicSchemaNode) ? 'Description' : 'Detail'} textarea value={n.body} onCommit={(v) => upd({ body: v })} />}
      {n.kind === 'item' && <StoryItemInspectorFields node={n} onPatch={upd} game={s} lib={lib} graph={g} />}
      {false && n.kind === 'item' && (
        <div className="isect">
          <SectionLabel>Type</SectionLabel>
          <select className="field-input" value={n.itemType || 'Key'} onChange={(e) => upd({ itemType: e.target.value })}>
            {STORY_ITEM_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <TextField label="Origin" textarea value={n.origin} onCommit={(v) => upd({ origin: v })} />
        </div>
      )}
      {isMechanicSchemaNode && <MechanicsNodeFields node={n} onPatch={upd} lib={lib} graph={g} />}
      {isMasterAct && (
        <TextField
          label="Team phase / player dynamics (private)"
          textarea
          value={n.phaseNotes}
          onCommit={(v) => upd({ phaseNotes: v })}
          placeholder="What should happen within the team here: hierarchy, roles, pressure, cooperation, strengths, weaknesses..."
        />
      )}
      {isTimelineItem && (
        <div className="isect">
          <SectionLabel>Timing</SectionLabel>
          <div className="formgrid two">
            <label><span>Start</span><input className="field-input" type="time" value={minToTime(n.startMin ?? 540)}
              onChange={(e) => { const m = timeToMin(e.target.value); if (m != null) upd({ startMin: m }); }} /></label>
            <label><span>Duration min</span><input className="field-input" type="number" min="5" step="5" value={n.durationMin ?? 45}
              onChange={(e) => upd({ durationMin: Math.max(5, num(e.target.value, 45)) })} /></label>
          </div>
          <div className="hint">Drag the {isTravel ? 'travel' : 'task'} bar to move it, or drag its left/right edges on the timeline to resize it.</div>
        </div>
      )}
      {isTask && (
        <div className="isect">
          <SectionLabel>Estimated timing margin</SectionLabel>
          <div className="formgrid two">
            <label><span>Before min</span><input className="field-input" type="number" min="0" step="5" disabled={isFirstTask}
              value={isFirstTask ? 0 : (n.marginBeforeMin ?? 15)}
              onChange={(e) => upd({ marginBeforeMin: Math.max(0, num(e.target.value, 0)) })} /></label>
            <label><span>After min</span><input className="field-input" type="number" min="0" step="5" disabled={isLastTask}
              value={isLastTask ? 0 : (n.marginAfterMin ?? 15)}
              onChange={(e) => upd({ marginAfterMin: Math.max(0, num(e.target.value, 0)) })} /></label>
          </div>
          <div className="hint">First task has no front margin; final task has no back margin. The pale timeline band shows the estimated minimum-to-maximum window.</div>
        </div>
      )}
      {isTravel && (
        <div className="isect">
          <SectionLabel>Estimated travel delay</SectionLabel>
          <div className="formgrid two">
            <label><span>Delay margin min</span><input className="field-input" type="number" min="0" step="5"
              value={n.marginAfterMin ?? 15}
              onChange={(e) => upd({ marginAfterMin: Math.max(0, num(e.target.value, 0)) })} /></label>
          </div>
          <div className="hint">Travel uses one right-side margin: baseline travel time plus possible delay from walking speed, transport, wrong turns, waiting, or getting lost.</div>
        </div>
      )}
      {n.kind !== 'item' && !['action', ACTION_MECHANISM_NODE_KIND].includes(n.mechKind) && <div className="isect">
        <SectionLabel>Image · optional</SectionLabel>
        <ImageUploader entity={n} label="Node image" onImage={(img) => upd({ image: img })} />
      </div>}
      {n.kind !== 'item' && <div className="isect">
        <SectionLabel>Node color</SectionLabel>
        <div className="chips">
          {NODE_SWATCHES.map((c) => <button key={c} className={`swatch${color === c ? ' on' : ''}`} style={{ background: c }} onClick={() => upd({ color: c })} />)}
          <button className="linkbtn" onClick={() => upd({ color: null })}>Auto</button>
        </div>
      </div>}
      {isTask && <div className="isect"><div className="hint">Double-click this task on the canvas to open its detail graph{subCount > 0 ? ` (${subCount} detail node${subCount === 1 ? '' : 's'})` : ''}.</div></div>}
      {isMasterAct && (
        <div className="isect">
          <button className="btn primary wide" onClick={saveMasterAct}>{savedAs ? `Saved ${savedAs}` : 'Save as Base Node'}</button>
        </div>
      )}
      {false && n.kind === 'item' && (
        <div className="isect">
          <label className="checkrow">
            <input type="checkbox" checked={!!n.persistsAcrossTasks} onChange={(e) => upd({ persistsAcrossTasks: e.target.checked })} />
            <span>Persists across tasks</span>
          </label>
        </div>
      )}
    </>
  );
}

// ---- Library TEMPLATE panels: edit the master blueprint, import instances ----
function LibItemPanel({ template }) {
  const lib = useLibrary();
  const libDispatch = useLibraryDispatch();
  const upd = (patch) => libDispatch({ type: 'UPDATE_ENTITY', coll: 'items', id: template.id, patch });
  return (
    <>
      <TemplateBadge />
      <div className="ihead">
        <ImageUploader coll="items" entity={template} dispatchOverride={libDispatch} />
        <div className="ihrow"><h3>{template.name}</h3></div>
        <div className="sub mono">{template.id} · {template.type} · template</div>
      </div>
      <ImportButton build={(l, p) => importItem(l, p, template.id)} />
      <TextField label="Name" value={template.name} onCommit={(v) => upd({ name: v })} />
      <div className="isect">
        <SectionLabel>Type</SectionLabel>
        <select className="field-input" value={template.type} onChange={(e) => upd({ type: e.target.value })}>
          {Object.values(lib.itemTypes).map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          {!lib.itemTypes[template.type] && <option value={template.type}>{template.type} (deleted type)</option>}
        </select>
      </div>
      <TextField label="Default lore / description" textarea value={template.description} onCommit={(v) => upd({ description: v })} />
      <TextField label="Base construction · crew only" textarea value={template.propNotes} onCommit={(v) => upd({ propNotes: v })} />
      <TextField label="Origin" textarea value={template.origin} onCommit={(v) => upd({ origin: v })} />
      <div className="isect">
        <SectionLabel>Default mechanics</SectionLabel>
        <div className="chips">
          {template.mechanicIds.map((id) => lib.mechanics[id] && (
            <Chip key={id} color={ENTITY_COLORS.mechanic}
              onRemove={() => upd({ mechanicIds: template.mechanicIds.filter((m) => m !== id) })}>
              {lib.mechanics[id].name}
            </Chip>
          ))}
          <select className="chip-add" value="" onChange={(e) => e.target.value && upd({ mechanicIds: [...template.mechanicIds, e.target.value] })}>
            <option value="">+ link…</option>
            {Object.values(lib.mechanics).filter((m) => !template.mechanicIds.includes(m.id)).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>
      <div className="isect">
        <SectionLabel>Required hardware (templates)</SectionLabel>
        <div className="chips">
          {template.sensorReqs.map(({ sensorId, note }) => lib.sensors[sensorId] && (
            <Chip key={sensorId} color={ENTITY_COLORS.sensor} title={note}
              onRemove={() => upd({ sensorReqs: template.sensorReqs.filter((r) => r.sensorId !== sensorId) })}>
              {lib.sensors[sensorId].kind}
            </Chip>
          ))}
          <select className="chip-add" value="" onChange={(e) => e.target.value && upd({ sensorReqs: [...template.sensorReqs, { sensorId: e.target.value, note: '' }] })}>
            <option value="">+ require…</option>
            {Object.values(lib.sensors).filter((x) => !template.sensorReqs.some((r) => r.sensorId === x.id)).map((x) => <option key={x.id} value={x.id}>{x.kind}</option>)}
          </select>
        </div>
        <div className="hint">Importing this item also imports its hardware into the game.</div>
      </div>
      <div className="isect">
        <label className="checkrow">
          <input type="checkbox" checked={!!template.persistsAcrossTasks} onChange={(e) => upd({ persistsAcrossTasks: e.target.checked })} />
          <span>Persists across tasks</span>
        </label>
      </div>
    </>
  );
}

function LibLocationPanel({ template }) {
  const libDispatch = useLibraryDispatch();
  const upd = (patch) => libDispatch({ type: 'UPDATE_ENTITY', coll: 'locations', id: template.id, patch });
  return (
    <>
      <TemplateBadge />
      <div className="ihead">
        <ImageUploader coll="locations" entity={template} dispatchOverride={libDispatch} />
        <div className="ihrow"><h3>{template.name}</h3></div>
        <div className="sub mono">{template.id} · template</div>
      </div>
      <ImportButton build={(l, p) => importLocation(l, p, template.id)} />
      <TextField label="Name" value={template.name} onCommit={(v) => upd({ name: v })} />
      <TextField label="Notes" textarea value={template.notes} onCommit={(v) => upd({ notes: v })} />
      <TextField label="Safety checklist" textarea value={template.safety} onCommit={(v) => upd({ safety: v })} />
    </>
  );
}

function LibMechanicPanel({ template }) {
  const libDispatch = useLibraryDispatch();
  const upd = (patch) => libDispatch({ type: 'UPDATE_ENTITY', coll: 'mechanics', id: template.id, patch });
  const params = template.params ?? [];
  return (
    <>
      <TemplateBadge />
      <div className="ihead">
        <div className="ihrow"><span className="sq big" style={{ background: ENTITY_COLORS.mechanic }} /><h3>{template.name}</h3></div>
        <div className="sub mono">{template.id} · rule / mechanic</div>
      </div>
      <TextField label="Name" value={template.name} onCommit={(v) => upd({ name: v })} />
      <TextField label="How it plays" textarea value={template.summary} onCommit={(v) => upd({ summary: v })} />
      <div className="isect">
        <SectionLabel>Default parameters</SectionLabel>
        <div className="paramlist">
          {params.map((p, i) => (
            <div className="paramrow" key={i}>
              <input className="field-input plabel" value={p.label}
                onChange={(e) => upd({ params: params.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} placeholder="Parameter" />
              <input className="field-input pvalinput" value={p.value}
                onChange={(e) => upd({ params: params.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
              <button className="x" onClick={() => upd({ params: params.filter((_, j) => j !== i) })} aria-label="Remove">×</button>
            </div>
          ))}
          <button className="chip addcat" onClick={() => upd({ params: [...params, { key: `p${params.length + 1}`, label: 'New parameter', value: '1' }] })}>+ Add parameter</button>
        </div>
        <div className="hint">Games import this mechanic and micro-adjust these values locally, without changing this blueprint.</div>
      </div>
    </>
  );
}

function LibSensorPanel({ template }) {
  const libDispatch = useLibraryDispatch();
  const upd = (patch) => libDispatch({ type: 'UPDATE_ENTITY', coll: 'sensors', id: template.id, patch });
  return (
    <>
      <TemplateBadge />
      <div className="ihead">
        <div className="ihrow"><span className="sq big" style={{ background: ENTITY_COLORS.sensor }} /><h3>{template.kind}</h3></div>
        <div className="sub mono">{template.id} · hardware template</div>
      </div>
      <ImportButton build={(l, p) => importSensor(l, p, template.id)} label="Import hardware unit" />
      <TextField label="Kind" value={template.kind} onCommit={(v) => upd({ kind: v })} />
      <TextField label="Build / model notes" textarea value={template.label} onCommit={(v) => upd({ label: v })} />
      <div className="isect"><div className="hint">Instances track per-game state: battery, placement, assignment, online status.</div></div>
    </>
  );
}

function LibStoryPanel({ template, onDeleted, onOpenConcept }) {
  const lib = useLibrary();
  const libDispatch = useLibraryDispatch();
  const upd = (patch) => libDispatch({ type: 'UPDATE_ENTITY', coll: 'stories', id: template.id, patch });
  const usesBaseConcept = template.usesBaseConcept === true;
  const baseConcept = usesBaseConcept ? lib.concepts?.[template.baseConceptId] : null;
  const remove = () => {
    if (!window.confirm(`Delete story structure "${template.name}"? This cannot be undone.`)) return;
    libDispatch({ type: 'DELETE_ENTITY', coll: 'stories', id: template.id });
    onDeleted?.();
  };
  return (
    <>
      <TemplateBadge />
      <div className="ihead">
        <div className="ihrow"><span className="sq big" style={{ background: ENTITY_COLORS.story }} /><h3>{template.name}</h3></div>
        <div className="sub mono">{template.id} · story structure · {Object.keys(template.nodes).length} nodes · {template.edges.length} links</div>
      </div>
      <ImportButton build={(l, p) => importStory(l, p, template.id)} label="Import structure into game" />
      <TextField label="Name" value={template.name} onCommit={(v) => upd({ name: v })} />
      <TextField label="Description" textarea value={template.description} onCommit={(v) => upd({ description: v })} />
      <TextField label="Estimated duration (minutes)" value={String(template.estMinutes)} onCommit={(v) => upd({ estMinutes: Math.max(1, parseInt(v, 10) || template.estMinutes) })} />
      <ISection label="Base Concept (optional)" collapsed>
        <label className="optional-link-toggle">
          <input
            type="checkbox"
            checked={usesBaseConcept}
            onChange={(e) => upd(e.target.checked
              ? { usesBaseConcept: true }
              : { usesBaseConcept: false, baseConceptId: null })}
          />
          <span>
            <b>This structure is based on a concept</b>
            <small>Enable this only when the structure is a developed version of a Library concept.</small>
          </span>
        </label>
        {usesBaseConcept && <>
          <SectionLabel>Concept</SectionLabel>
          <select
            className="field-input"
            value={template.baseConceptId || ''}
            onChange={(e) => upd({ baseConceptId: e.target.value || null })}
          >
            <option value="">Select a concept...</option>
            {Object.values(lib.concepts || {}).map((concept) => (
              <option key={concept.id} value={concept.id}>{concept.name}</option>
            ))}
          </select>
          {baseConcept ? (
            <button className="btn wide" style={{ marginTop: 9 }} onClick={() => onOpenConcept?.(baseConcept.id)}>
              Open concept: {baseConcept.name}
            </button>
          ) : (
            <div className="hint">Choose the concept this story structure was developed from.</div>
          )}
        </>}
      </ISection>
      <div className="isect">
        <button className="linkbtn danger" onClick={remove}>Delete story structure</button>
      </div>
      <div className="isect"><div className="hint">Open the structure from the catalogue grid to edit its node graph — changes there update this master template.</div></div>
    </>
  );
}

// Additional Node (concept) master template in the Library.
function LibConceptPanel({ template, onDeleted }) {
  const libDispatch = useLibraryDispatch();
  const upd = (patch) => libDispatch({ type: 'UPDATE_ENTITY', coll: 'concepts', id: template.id, patch });
  const insertReferenceFramework = (frameworkId) => {
    const type = FRAMEWORK_TYPES[frameworkId];
    if (!type) return;
    const frameworks = template.frameworks || {};
    const id = genId(frameworks, 'FW-');
    upd({
      referenceFrameworkIds: Array.from(new Set([...(template.referenceFrameworkIds || []), frameworkId])),
      frameworks: {
        ...frameworks,
        [id]: {
          id,
          kind: 'framework',
          frameworkId,
          title: type.title || type.label,
          x: 100 + Object.keys(frameworks).length * 28,
          y: 100 + Object.keys(frameworks).length * 22,
          color: type.color,
        },
      },
    });
  };
  const remove = () => {
    if (!window.confirm(`Delete concept "${template.name}"? This cannot be undone.`)) return;
    libDispatch({ type: 'DELETE_ENTITY', coll: 'concepts', id: template.id });
    onDeleted?.();
  };
  const meta = ADDITIONAL_NODE_TYPES[template.category] || { label: 'Concept', color: '#E8D25C', icon: 'book' };
  return (
    <>
      <TemplateBadge />
      <div className="ihead">
        <div className="ihrow"><span className="sq big" style={{ background: meta.color }}><PrimIcon icon={meta.icon} color="#fff" size={13} /></span><h3>{template.name}</h3></div>
        <div className="sub mono">{template.id} · {meta.label}{template.premade ? ' · pre-made' : ''}</div>
      </div>
      <ConceptFieldsEditor entity={template} onPatch={upd} mode="template" onInsertReferenceFramework={insertReferenceFramework} />
      <div className="isect"><div className="hint">Open the template from the catalogue to edit its internal node structure.</div></div>
      <div className="isect">
        <button className="linkbtn danger" onClick={remove}>Delete concept</button>
      </div>
    </>
  );
}

// Mechanic node type (Game Mechanics node tree) — sensor/physical/task nodes.
function LibMechPrimitivePanel({ template }) {
  const libDispatch = useLibraryDispatch();
  const upd = (patch) => libDispatch({ type: 'UPDATE_ENTITY', coll: 'mechPrimitives', id: template.id, patch });
  const patchProbability = (patch) => {
    const { body, ...rest } = patch;
    upd({ ...rest, ...(body !== undefined ? { defaultBody: body } : {}) });
  };
  return (
    <>
      <TemplateBadge />
      <div className="ihead">
        <div className="ihrow"><span className="sq big" style={{ background: template.color }} /><h3>{template.name}</h3></div>
        <div className="sub mono">{template.id} · mechanic node</div>
      </div>
      {template.deprecated ? (
        <div className="isect">
          <div className="warnbox">
            <b>Deprecated node</b>
            <p>{template.migrationHint || 'Use the newer replacement node for future designs.'}</p>
          </div>
        </div>
      ) : (
        <ImportButton build={(l, p) => importMechPrimitive(l, p, template.id)} label="Add node to game canvas" />
      )}
      <TextField label="Name" value={template.name} onCommit={(v) => upd({ name: v })} />
      <TextField label="Default description" textarea value={template.defaultBody} onCommit={(v) => upd({ defaultBody: v })} />
      {template.mechKind === 'actionProbability' && (
        <MechanicsNodeFields node={{ ...template, body: template.defaultBody }} onPatch={patchProbability} />
      )}
      <div className="frow" style={{ padding: '13px 16px 0' }}>
        <div><SectionLabel>Est. minutes</SectionLabel>
          <input className="field-input" defaultValue={template.estMinutes}
            onBlur={(e) => upd({ estMinutes: Math.max(1, parseInt(e.target.value, 10) || template.estMinutes) })} /></div>
        <div><SectionLabel>Crew needed</SectionLabel>
          <input className="field-input" defaultValue={template.crew}
            onBlur={(e) => upd({ crew: Math.max(0, parseInt(e.target.value, 10) || 0) })} /></div>
      </div>
    </>
  );
}

function EntityRefsField({ label, value, onChange, collection, emptyLabel }) {
  const s = useGame();
  const [pending, setPending] = useState('');
  const selected = Array.isArray(value) ? value : [];
  const records = Object.values(s[collection] || {});
  const options = records.filter((record) => !selected.includes(record.id));
  const add = () => {
    if (!pending) return;
    onChange([...selected, pending]);
    setPending('');
  };
  return (
    <div className="isect compact">
      <SectionLabel>{label}</SectionLabel>
      <div className="chips">
        {selected.map((id) => {
          const record = s[collection]?.[id];
          return (
            <button key={id} className="pillbtn on" onClick={() => onChange(selected.filter((x) => x !== id))}>
              {record?.name || id} ×
            </button>
          );
        })}
        {selected.length === 0 && <span className="dim">{emptyLabel}</span>}
      </div>
      <div className="inline-add">
        <select className="field-input" value={pending} onChange={(e) => setPending(e.target.value)}>
          <option value="">Select...</option>
          {options.map((record) => <option key={record.id} value={record.id}>{record.name}</option>)}
        </select>
        <button className="btn tiny" onClick={add} disabled={!pending}>+</button>
      </div>
    </div>
  );
}

function MechanicSubnodeField({ field, value, onChange }) {
  if (field.type === 'readonly') {
    return (
      <div className="isect compact">
        <SectionLabel>{field.label}{field.required ? ' *' : ''}</SectionLabel>
        <div className="hint">{value || 'Read-only guidance is generated from the selected mechanic subnode type.'}</div>
      </div>
    );
  }
  if (field.type === 'checkbox') {
    return (
      <label className="checkrow">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        <span>{field.label}</span>
      </label>
    );
  }
  if (field.type === 'select') {
    return (
      <div className="isect compact">
        <SectionLabel>{field.label}{field.required ? ' *' : ''}</SectionLabel>
        <select className="field-input" value={value || field.options?.[0] || ''} onChange={(e) => onChange(e.target.value)}>
          {(field.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    );
  }
  if (field.type === 'multiselect') {
    const values = Array.isArray(value) ? value : [];
    return (
      <div className="isect compact">
        <SectionLabel>{field.label}{field.required ? ' *' : ''}</SectionLabel>
        <div className="chips">
          {(field.options || []).map((opt) => {
            const on = values.includes(opt);
            return (
              <button key={opt} className={`pillbtn${on ? ' on' : ''}`} onClick={() => onChange(on ? values.filter((x) => x !== opt) : [...values, opt])}>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  if (field.type === 'playerRefs') {
    return <EntityRefsField label={field.label} value={value} onChange={onChange} collection="players" emptyLabel="No players selected." />;
  }
  if (field.type === 'teamRefs') {
    return <EntityRefsField label={field.label} value={value} onChange={onChange} collection="teams" emptyLabel="No teams selected." />;
  }
  if (field.type === 'number') {
    return (
      <div className="isect compact">
        <SectionLabel>{field.label}{field.required ? ' *' : ''}{field.suffix ? ` (${field.suffix})` : ''}</SectionLabel>
        <input className="field-input" type="number" min="0" step="1" value={Number.isFinite(Number(value)) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))} />
      </div>
    );
  }
  return (
    <TextField
      label={`${field.label}${field.required ? ' *' : ''}`}
      textarea={field.type === 'textarea'}
      value={value || ''}
      onCommit={onChange}
    />
  );
}

const MECHANIC_NODE_FIELD_SECTIONS = {
  taskTemplate: [
    { key: 'estMinutes', label: 'Estimated Duration', type: 'number', required: true, suffix: 'minutes' },
    { key: 'playerCount', label: 'Player Count', type: 'range', minKey: 'minPlayers', maxKey: 'maxPlayers', required: true },
    { key: 'recommendedCrew', label: 'Recommended Crew', type: 'text' },
    { key: 'difficultyPressure', label: 'Difficulty / Pressure', type: 'select', options: ['Low', 'Medium', 'High', 'Extreme'] },
    { key: 'reusableAsLibraryTemplate', label: 'Reusable as Library Template', type: 'checkbox' },
  ],
  cooperation: [
    { key: 'cooperationStyle', label: 'Cooperation Style', type: 'select', required: true, options: ['Solo', 'Parallel', 'Relay', 'Synchronous', 'Asymmetric'] },
    { key: 'attachedSubnodeIds', label: 'Cooperation Modifiers', type: 'container', candidate: 'subnode', hint: 'Attach role, no-solo, discussion, arbitration, or another relevant gameplay modifier.' },
  ],
  physicalRestriction: [
    { key: 'restrictionType', label: 'Restriction Type', type: 'selectCustom', required: true, collection: 'mechanicRestrictionTypes', prompt: 'Restriction type name', idPrefix: 'RST-' },
    { key: 'connectTo', label: 'Connect To', type: 'references', required: true },
    { key: 'safetyRule', label: 'Safety Rule', type: 'textarea' },
    { key: 'stopCondition', label: 'Stop Condition', type: 'textarea' },
    { key: 'attachedSubnodeIds', label: 'Attached Subnodes', type: 'container', candidate: 'subnode', hint: 'Assign modifier subnodes from this graph, such as Progressive Feedback, Fail-Safe, or Escalating Pressure.' },
    { key: 'noteColor', label: 'Note Color', type: 'color' },
  ],
  propInteraction: [
    { key: 'interactionType', label: 'Interaction Type', type: 'selectCustom', required: true, collection: 'mechanicInteractionTypes', prompt: 'Interaction type name', idPrefix: 'PIT-' },
    { key: 'successCondition', label: 'Success Condition', type: 'textarea', required: true },
    { key: 'failureCondition', label: 'Failure Condition', type: 'textarea' },
    { key: 'resetProcedure', label: 'Reset Procedure', type: 'textarea' },
    { key: 'connectTo', label: 'Connect To', type: 'propReferences' },
    { key: 'attachedSubnodeIds', label: 'Attached Subnodes', type: 'container', candidate: 'subnode', hint: 'Assign modifier subnodes from this graph, such as Progressive Feedback, Fail-Safe, or Escalating Pressure.' },
    { key: 'noteColor', label: 'Note Color', type: 'color' },
  ],
  sensorNode: [
    { key: 'sensorType', label: 'Sensor Type', type: 'selectCustom', required: true, collection: 'mechanicSensorTypes', prompt: 'Sensor type name', idPrefix: 'SNT-' },
    { key: 'zoneReference', label: 'Zone Reference', type: 'text' },
    { key: 'inputRequired', label: 'Input Required', type: 'textarea', required: true, placeholder: 'Describe the input in detail, including partial vs full activation.' },
    { key: 'triggerCondition', label: 'Trigger Condition', type: 'textarea' },
    { key: 'frequencyLimitEnabled', label: 'Frequency limiting', type: 'checkbox' },
    { key: 'frequencyTriggerCount', label: 'Number of triggers', type: 'number', showWhen: (node) => !!node?.frequencyLimitEnabled },
    { key: 'frequencyTimePeriod', label: 'Time period', type: 'select', options: ['5 seconds', '30 seconds', '1 minute', '2 minutes', '5 minutes', '10 minutes'], showWhen: (node) => !!node?.frequencyLimitEnabled },
    { key: 'cooldownEnabled', label: 'Cooldown', type: 'checkbox', showWhen: (node) => !!node?.frequencyLimitEnabled },
    { key: 'cooldownDuration', label: 'Cooldown duration', type: 'select', options: ['5 seconds', '30 seconds', '1 minute', '2 minutes', '5 minutes', '10 minutes'], showWhen: (node) => !!node?.frequencyLimitEnabled && !!node?.cooldownEnabled },
    { key: 'manualOverrideFallback', label: 'Manual Override / Fallback Procedure', type: 'textarea' },
    { key: 'reliability', label: 'Reliability', type: 'select', options: ['1', '2', '3', '4', '5'], defaultValue: '3' },
    { key: 'nodeColor', label: 'Node Color', type: 'color' },
  ],
  actuatorNode: [
    { key: 'actuatorType', label: 'Actuator Type', type: 'selectCustom', required: true, collection: 'mechanicActuatorTypes', prompt: 'Actuator type name', idPrefix: 'ACT-' },
    { key: 'audioFileRef', label: 'Audio File Reference', type: 'text', showWhen: (node) => String(node?.actuatorType || '').toLowerCase() === 'sound' },
    { key: 'frequencyLimitEnabled', label: 'Frequency limiting', type: 'checkbox' },
    { key: 'frequencyTriggerCount', label: 'Number of triggers', type: 'number', showWhen: (node) => !!node?.frequencyLimitEnabled },
    { key: 'frequencyTimePeriod', label: 'Time period', type: 'select', options: ['5 seconds', '30 seconds', '1 minute', '2 minutes', '5 minutes', '10 minutes'], showWhen: (node) => !!node?.frequencyLimitEnabled },
    { key: 'cooldownEnabled', label: 'Cooldown', type: 'checkbox', showWhen: (node) => !!node?.frequencyLimitEnabled },
    { key: 'cooldownDuration', label: 'Cooldown duration', type: 'select', options: ['5 seconds', '30 seconds', '1 minute', '2 minutes', '5 minutes', '10 minutes'], showWhen: (node) => !!node?.frequencyLimitEnabled && !!node?.cooldownEnabled },
    { key: 'outputDuration', label: 'Output Duration', type: 'text' },
    { key: 'outputIntensity', label: 'Output Intensity', type: 'text' },
    { key: 'outputRhythm', label: 'Output Rhythm / Sequence', type: 'textarea' },
    { key: 'resetBehavior', label: 'Reset Behavior', type: 'textarea' },
    { key: 'manualOverrideFallback', label: 'Manual Override / Fallback Procedure', type: 'textarea' },
    { key: 'nodeColor', label: 'Node Color', type: 'color' },
  ],
  action: [],
  playerFacingInstruction: [
    { key: 'body', label: 'Player-Facing Instruction', type: 'textarea', required: true },
  ],
  actionSequence: [
    { key: 'sequenceMode', label: 'Sequence Mode', type: 'selectCustom', required: true, collection: 'mechanicSequenceModes', prompt: 'Sequence mode name', idPrefix: 'SQM-' },
    { key: 'sequenceInstruction', label: 'Sequence Instruction', type: 'textarea' },
    { key: 'attachedSubnodeIds', label: 'Sequence Modifiers', type: 'container', candidate: 'subnode', hint: 'Attach a modifier to control the economy, availability, order, prompt, or physical behavior of this sequence.' },
  ],
  characterState: [
    { key: 'emotionalState', label: 'Emotional State', type: 'selectCustom', collection: 'mechanicCharacterEmotionTypes', prompt: 'Emotional state name', idPrefix: 'CEM-' },
    { key: 'behavioralNotes', label: 'Behavioral Notes', type: 'textarea' },
    { key: 'attachedSubnodeIds', label: 'Attached Subnodes', type: 'container', candidate: 'subnode', hint: 'Assign reusable modifier subnodes from this graph, such as Value, Lifespan, Spend / Use Rule, Comment, or Readiness Status.' },
    { key: 'nodeColor', label: 'Node Color', type: 'color' },
  ],
  progressState: [
    { key: 'currentProgress', label: 'Current Progress', type: 'progress10', required: true },
    { key: 'visualStyle', label: 'Visual Style', type: 'select', options: ['Segmented bar', 'Percentage'] },
  ],
};

const mechanicNodeLabel = (n) => n?.title || n?.name || n?.id || 'Node';
const mechanicNodeMeta = (n) => {
  if (n?.kind === 'mechanicSubnode') return MECHANIC_SUBNODE_TYPES[n.subnodeKind] || {};
  return {};
};
const isPhysicalTrackCandidate = (n) => {
  if (!n) return false;
  if (n.kind === 'mechanicSubnode') return true;
  if (['physicalRestriction', 'propInteraction', 'sensorNode', 'actuatorNode'].includes(n.mechKind)) return true;
  return ['item', 'sensor', 'location'].includes(n.physicalKind);
};
const isCognitiveTrackCandidate = (n) => {
  if (!n) return false;
  if (n.kind === 'mechanicSubnode') return true;
  if (['cooperation', 'characterState'].includes(n.mechKind)) return true;
  if (n.mechKind === 'progressState') return true;
  return ['rule', 'effect', 'objective', 'power'].includes(n.kind);
};
const isSubnodeTrackCandidate = (n) => n?.kind === 'mechanicSubnode';
const cleanIdeaNames = (value) => String(value || '').split('\n').map((x) => x.trim()).filter(Boolean);

function MechanicsNodeField({ field, value, onChange, node, graph }) {
  const lib = useLibrary();
  const libDispatch = useLibraryDispatch();
  if (field.type === 'readonly') {
    return (
      <div className="isect compact">
        <SectionLabel>{field.label}{field.required ? ' *' : ''}</SectionLabel>
        <div className="readonlyfield">{value || ''}</div>
      </div>
    );
  }
  if (field.type === 'container') {
    const selected = Array.isArray(value) ? value : [];
    const allNodes = Object.values(graph?.nodes || {});
    const filter = field.candidate === 'subnode' ? isSubnodeTrackCandidate : field.candidate === 'physical' ? isPhysicalTrackCandidate : isCognitiveTrackCandidate;
    const candidates = allNodes.filter((candidate) => candidate.id !== node.id && filter(candidate));
    return (
      <div className="isect compact">
        <SectionLabel>{field.label}{field.required ? ' *' : ''}</SectionLabel>
        {field.hint && <div className="hint">{field.hint}</div>}
        {candidates.length > 0 ? (
          <div className="trackbucket">
            {candidates.map((candidate) => {
              const meta = mechanicNodeMeta(candidate);
              const on = selected.includes(candidate.id);
              return (
                <button
                  key={candidate.id}
                  className={`trackchip${on ? ' on' : ''}`}
                  onClick={() => onChange(on ? selected.filter((id) => id !== candidate.id) : [...selected, candidate.id])}
                >
                  <span className="sq" style={{ background: candidate.color || meta.color || '#8B92A6' }}>{meta.icon && <PrimIcon icon={meta.icon} color="#fff" size={10} />}</span>
                  <b>{mechanicNodeLabel(candidate)}</b>
                  <small>{candidate.subnodeKind || candidate.mechKind || candidate.physicalKind || candidate.kind}</small>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="empty mini">Add mechanic subnodes or elements to this graph, then assign them to this track.</div>
        )}
      </div>
    );
  }
  if (field.type === 'references') {
    const refs = value || {};
    const nodeIds = refs.nodeIds || [];
    const toggle = (key, id) => {
      const values = refs[key] || [];
      onChange({ ...refs, [key]: values.includes(id) ? values.filter((x) => x !== id) : [...values, id] });
    };
    return (
      <div className="isect compact">
        <SectionLabel>{field.label}{field.required ? ' *' : ''}</SectionLabel>
        <div className="hint">Connect this restriction to other nodes in this graph. Use Player or Team supporting nodes for player/team assignment.</div>
        <div className="refgroup">
          <b>Graph nodes</b>
          <div className="trackbucket">
            {Object.values(graph?.nodes || {}).filter((candidate) => candidate.id !== node.id).map((candidate) => {
              const meta = mechanicNodeMeta(candidate);
              const on = nodeIds.includes(candidate.id);
              return (
                <button key={candidate.id} className={`trackchip${on ? ' on' : ''}`} onClick={() => toggle('nodeIds', candidate.id)}>
                  <span className="sq" style={{ background: candidate.color || meta.color || '#8B92A6' }}>{meta.icon && <PrimIcon icon={meta.icon} color="#fff" size={10} />}</span>
                  <b>{mechanicNodeLabel(candidate)}</b>
                  <small>{candidate.subnodeKind || candidate.mechKind || candidate.physicalKind || candidate.kind}</small>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  if (field.type === 'playerRefs') {
    return <EntityRefsField label={field.label} value={value} onChange={onChange} collection="players" emptyLabel="No players selected." />;
  }
  if (field.type === 'teamRefs') {
    return <EntityRefsField label={field.label} value={value} onChange={onChange} collection="teams" emptyLabel="No teams selected." />;
  }
  if (field.type === 'propReferences') {
    const refs = value || {};
    const itemIds = refs.itemIds || [];
    const sensorIds = refs.sensorIds || [];
    const nodeIds = refs.nodeIds || [];
    const ideas = refs.ideas || [];
    const toggle = (key, id) => {
      const values = refs[key] || [];
      onChange({ ...refs, [key]: values.includes(id) ? values.filter((x) => x !== id) : [...values, id] });
    };
    return (
      <div className="isect compact">
        <SectionLabel>{field.label}{field.required ? ' *' : ''}</SectionLabel>
        <div className="hint">Link this interaction to props, sensors, graph nodes, or design ideas. These are references, not duplicate records.</div>
        <div className="refgroup">
          <b>Props / items</b>
          <div className="chips">
            {Object.values(lib.items || {}).map((item) => (
              <button key={item.id} className={`pillbtn${itemIds.includes(item.id) ? ' on' : ''}`} onClick={() => toggle('itemIds', item.id)}>
                {item.name}
              </button>
            ))}
          </div>
        </div>
        <div className="refgroup">
          <b>Sensors</b>
          <div className="chips">
            {Object.values(lib.sensors || {}).map((sensor) => (
              <button key={sensor.id} className={`pillbtn${sensorIds.includes(sensor.id) ? ' on' : ''}`} onClick={() => toggle('sensorIds', sensor.id)}>
                {sensor.kind}
              </button>
            ))}
          </div>
        </div>
        <div className="refgroup">
          <b>Graph nodes</b>
          <div className="trackbucket">
            {Object.values(graph?.nodes || {}).filter((candidate) => candidate.id !== node.id).map((candidate) => {
              const meta = mechanicNodeMeta(candidate);
              const on = nodeIds.includes(candidate.id);
              return (
                <button key={candidate.id} className={`trackchip${on ? ' on' : ''}`} onClick={() => toggle('nodeIds', candidate.id)}>
                  <span className="sq" style={{ background: candidate.color || meta.color || '#8B92A6' }}>{meta.icon && <PrimIcon icon={meta.icon} color="#fff" size={10} />}</span>
                  <b>{mechanicNodeLabel(candidate)}</b>
                  <small>{candidate.subnodeKind || candidate.mechKind || candidate.physicalKind || candidate.kind}</small>
                </button>
              );
            })}
          </div>
        </div>
        <TextField
          label="Linked ideas"
          textarea
          value={ideas.join('\n')}
          onCommit={(v) => onChange({ ...refs, ideas: cleanIdeaNames(v) })}
          placeholder="One idea per line..."
        />
      </div>
    );
  }
  if (field.type === 'repeatableShortText') {
    const entries = Array.isArray(value) && value.length ? value : [''];
    const updateEntry = (index, nextValue) => {
      const next = [...entries];
      next[index] = nextValue;
      onChange(next);
    };
    const removeEntry = (index) => {
      if (entries.length <= 1) return;
      onChange(entries.filter((_, entryIndex) => entryIndex !== index));
    };
    return (
      <div className="isect compact action-repeat-group">
        <SectionLabel>{field.label}</SectionLabel>
        <div className="action-repeat-list">
          {entries.map((entry, index) => (
            <div className="action-repeat-entry" key={`${field.key}-${index}`}>
              <div className="action-repeat-head">
                <span>{field.label}{entries.length > 1 ? ` ${index + 1}` : ''}</span>
                {entries.length > 1 && (
                  <button className="iconbtn danger" title={`Remove ${field.label.toLowerCase()}`} onClick={() => removeEntry(index)}>×</button>
                )}
              </div>
              <textarea
                className="field-input action-repeat-text"
                rows="2"
                maxLength="320"
                value={entry || ''}
                placeholder={field.placeholder}
                onChange={(event) => updateEntry(index, event.target.value)}
              />
            </div>
          ))}
        </div>
        <button className="btn small action-repeat-add" onClick={() => onChange([...entries, ''])}>+ {field.addLabel}</button>
      </div>
    );
  }
  if (field.type === 'selectCustom') {
    const options = Object.values(lib[field.collection] || {}).map((x) => x.label).filter(Boolean);
    const current = value || options[0] || '';
    const saveCustom = () => {
      const label = window.prompt(field.prompt || 'Custom type name', options.includes(current) ? '' : current);
      const cleaned = String(label || '').trim();
      if (!cleaned) return;
      const exists = Object.values(lib[field.collection] || {}).some((x) => x.label.toLowerCase() === cleaned.toLowerCase());
      if (!exists) {
        libDispatch({ type: 'ADD_ENTITY', coll: field.collection, entity: { id: genId(lib[field.collection] || {}, field.idPrefix || 'TYPE-'), label: cleaned, custom: true } });
      }
      onChange(cleaned);
    };
    return (
      <div className="isect compact">
        <SectionLabel>{field.label}{field.required ? ' *' : ''}</SectionLabel>
        <select className="field-input" value={options.includes(current) ? current : '__custom'} onChange={(e) => e.target.value === '__custom' ? saveCustom() : onChange(e.target.value)}>
          {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          <option value="__custom">{options.includes(current) ? '+ Save custom type...' : `${current} (custom)`}</option>
        </select>
        <button className="linkbtn" style={{ marginTop: 7 }} onClick={saveCustom}>Save custom type</button>
      </div>
    );
  }
  if (field.type === 'color') {
    return (
      <div className="isect compact">
        <SectionLabel>{field.label}</SectionLabel>
        <div className="chips">
          {NODE_SWATCHES.map((c) => <button key={c} className={`swatch${(value || node.color) === c ? ' on' : ''}`} style={{ background: c }} onClick={() => onChange(c)} />)}
          <button className="linkbtn" onClick={() => onChange(null)}>Auto</button>
        </div>
      </div>
    );
  }
  if (field.type === 'range') {
    return (
      <div className="isect compact">
        <SectionLabel>{field.label}{field.required ? ' *' : ''}</SectionLabel>
        <div className="formgrid two">
          <label><span>Min</span><input className="field-input" type="number" min="0" step="1"
            value={Number.isFinite(Number(node?.[field.minKey])) ? node[field.minKey] : 0}
            onChange={(e) => onChange({ [field.minKey]: Number(e.target.value) })} /></label>
          <label><span>Max</span><input className="field-input" type="number" min="0" step="1"
            value={Number.isFinite(Number(node?.[field.maxKey])) ? node[field.maxKey] : 0}
            onChange={(e) => onChange({ [field.maxKey]: Number(e.target.value) })} /></label>
        </div>
      </div>
    );
  }
  if (field.type === 'checkbox') {
    return (
      <label className="checkrow">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        <span>{field.label}</span>
      </label>
    );
  }
  if (field.type === 'progress10') {
    const current = Math.min(10, Math.max(1, Number(value) || 1));
    return (
      <div className="isect compact">
        <SectionLabel>{field.label}{field.required ? ' *' : ''}</SectionLabel>
        <div className="progress10" aria-label={`${current} out of 10 completed`}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((step) => (
            <button
              key={step}
              className={step <= current ? 'on' : ''}
              title={`${step} out of 10`}
              onClick={() => onChange(step)}
            />
          ))}
        </div>
        <div className="hint">{current} out of 10 sub-tasks completed · {Math.round((current / 10) * 100)}%</div>
      </div>
    );
  }
  if (field.type === 'select') {
    return (
      <div className="isect compact">
        <SectionLabel>{field.label}{field.required ? ' *' : ''}</SectionLabel>
        <select className="field-input" value={value || field.defaultValue || field.options?.[0] || ''} onChange={(e) => onChange(e.target.value)}>
          {(field.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    );
  }
  if (field.type === 'number') {
    return (
      <div className="isect compact">
        <SectionLabel>{field.label}{field.required ? ' *' : ''}{field.suffix ? ` (${field.suffix})` : ''}</SectionLabel>
        <input className="field-input" type="number" min="0" step="1" value={Number.isFinite(Number(value)) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))} />
      </div>
    );
  }
  return (
    <TextField
      label={`${field.label}${field.required ? ' *' : ''}`}
      textarea={field.type === 'textarea'}
      value={value || ''}
      onCommit={onChange}
      placeholder={field.placeholder}
    />
  );
}

function MechanicsNodeFields({ node, onPatch, lib, graph }) {
  const mechKind = node.mechKind;
  const isMechanicSubnode = node.kind === 'mechanicSubnode';
  const subMeta = isMechanicSubnode ? MECHANIC_SUBNODE_TYPES[node.subnodeKind] : null;
  const fields = isMechanicSubnode ? (subMeta?.fields || []) : (MECHANIC_NODE_FIELD_SECTIONS[mechKind] || []);
  if (isMechanicSubnode && node.subnodeKind === 'actionTypePattern') {
    return <ActionTypePatternEditor node={node} onPatch={onPatch} />;
  }
  if (!isMechanicSubnode && mechKind === 'actionProbability') {
    return <ActionProbabilityEditor node={node} onPatch={onPatch} />;
  }
  if (!isMechanicSubnode && mechKind === ACTION_MECHANISM_NODE_KIND) {
    return <ActionMechanismEditor node={node} onPatch={onPatch} />;
  }
  if (!isMechanicSubnode && !fields.length && !node.physicalKind && mechKind !== 'action') return null;
  const patchField = (field, value) => {
    if (field.type === 'range') onPatch(value);
    else if (isMechanicSubnode) onPatch({ fields: { ...(node.fields || {}), [field.key]: value } });
    else onPatch({ [field.key]: value });
  };
  return (
    <>
      {isMechanicSubnode && node.subnodeKind !== 'actionTypePattern' && (
        <ISection key={`${node.id}-purpose`} label="Purpose" collapsed={false}>
          <div className="hint">{node.body || subMeta?.purpose}</div>
        </ISection>
      )}
      {node.physicalKind && (
        <ISection key={`${node.id}-physical-reference`} label="Physical Reference" collapsed={false}>
          <div className="chips">
            {node.physicalKind === 'item' && lib.items?.[node.itemId] && <Chip color={node.color || ENTITY_COLORS.item}>{lib.items[node.itemId].name}</Chip>}
            {node.physicalKind === 'sensor' && lib.sensors?.[node.sensorId] && <Chip color={ENTITY_COLORS.sensor}>{lib.sensors[node.sensorId].kind}</Chip>}
            {node.physicalKind === 'location' && lib.locations?.[node.locationId] && <Chip color={ENTITY_COLORS.location}>{lib.locations[node.locationId].name}</Chip>}
          </div>
          <div className="hint">This mechanic node references an existing Library record instead of duplicating that item, sensor, or location.</div>
        </ISection>
      )}
      {fields.length > 0 && (
        <ISection key={`${node.id}-node-details`} label={isMechanicSubnode ? 'Focused Fields' : mechKind === 'taskTemplate' ? 'Task Template Details' : 'Node Details'} collapsed={false}>
          {fields.filter((field) => !field.showWhen || field.showWhen(node)).map((field) => (
            <MechanicsNodeField
              key={field.key}
              field={field}
              value={isMechanicSubnode ? (node.fields || {})[field.key] : node[field.key]}
              onChange={(value) => patchField(field, value)}
              node={node}
              graph={graph}
            />
          ))}
        </ISection>
      )}
      {!isMechanicSubnode && mechKind === 'action' && <ActionSystemsEditor node={node} onPatch={onPatch} />}
    </>
  );
}

function ActionSystemsEditor({ node, onPatch }) {
  const lib = useLibrary();
  const libDispatch = useLibraryDispatch();
  const mechanisms = Object.values(lib.actionPatternMechanisms || {});
  const [browserFilter, setBrowserFilter] = useState(null);
  const selectMechanism = (record) => {
    const patch = actionMechanismNodePatch(record);
    if (patch) onPatch(patch);
    setBrowserFilter(null);
  };
  const selectedMechanisms = Object.values(ACTION_PATTERN_SYSTEMS)
    .map((system) => ({ system, record: lib.actionPatternMechanisms?.[node[`${system.id}MechanismId`]] }))
    .filter((entry) => entry.record);
  const legacyDetails = {
    advantages: (node.advantages || []).filter(Boolean),
    effects: (node.effects || []).filter(Boolean),
    variations: (node.variations || []).filter(Boolean),
  };
  const hasLegacyDetails = Object.values(legacyDetails).some((entries) => entries.length);
  const readOnlyList = (label, values) => {
    const entries = (Array.isArray(values) ? values : []).map((value) => `${value || ''}`.trim()).filter(Boolean);
    if (!entries.length) return null;
    return (
      <div className="action-mechanism-readonly-field">
        <b>{label}</b>
        {entries.map((entry, index) => <span key={`${label}-${index}`}>{entry}</span>)}
      </div>
    );
  };

  return (
    <>
      <ISection key={`${node.id}-action-systems`} label="Action Systems" collapsed={false}>
        <div className="mechanism-slot-list">
          {Object.values(ACTION_PATTERN_SYSTEMS).map((system) => {
            const selected = lib.actionPatternMechanisms?.[node[`${system.id}MechanismId`]];
            return (
              <div className="mechanism-slot" key={system.id}>
                <span>{system.id}</span>
                <b title={selected?.label || 'Not selected'}>{selected?.label || 'Not selected'}</b>
                <div className="mechanism-slot-actions">
                  <button className="btn tiny" onClick={() => setBrowserFilter(system.id)}>
                    {system.id === 'token' ? 'Token' : system.id === 'order' ? 'Order' : 'Special'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </ISection>
      <ISection key={`${node.id}-action-details`} label="Selected Mechanism Details" collapsed={false}>
        {selectedMechanisms.length ? (
          <div className="action-mechanism-readonly-list">
            {selectedMechanisms.map(({ system, record }) => (
              <section key={record.id} style={{ '--accent': record.color || '#58C7A6' }}>
                {record.image?.dataUrl && (
                  <span className="action-mechanism-readonly-image">
                    <img src={record.image.dataUrl} alt="" style={{ transform: `translate(${record.imagePositionX || 0}%, ${record.imagePositionY || 0}%) scale(${record.imageScale || 1})` }} />
                  </span>
                )}
                <small>{system.label}</small>
                <strong>{record.label}</strong>
                {record.description && <p>{record.description}</p>}
                {readOnlyList('Advantage', record.advantages)}
                {readOnlyList('Effect', record.effects)}
                {readOnlyList('Variation', record.variations)}
              </section>
            ))}
          </div>
        ) : <div className="hint">Choose a Token, Order, or Special mechanism to see its details.</div>}
        {hasLegacyDetails && (
          <div className="action-mechanism-legacy">
            <b>Existing node details</b>
            <small>Preserved from this Action node’s earlier editable fields.</small>
            {readOnlyList('Advantage', legacyDetails.advantages)}
            {readOnlyList('Effect', legacyDetails.effects)}
            {readOnlyList('Variation', legacyDetails.variations)}
          </div>
        )}
        <div className="hint">Use the Token, Order, or Special buttons above to edit these details in Mechanism Browser.</div>
      </ISection>
      {browserFilter && (
        <MechanismBrowser
          initialFilter={browserFilter}
          patternMechanisms={mechanisms}
          probabilityMechanisms={Object.values(lib.actionProbabilityMechanisms || {})}
          selectedPatternIds={Object.keys(ACTION_PATTERN_SYSTEMS).map((system) => node[`${system}MechanismId`])}
          allowedKind="pattern"
          onPick={selectMechanism}
          onSave={(record) => libDispatch({ type: 'UPDATE_ENTITY', coll: record.kind === 'probability' ? 'actionProbabilityMechanisms' : 'actionPatternMechanisms', id: record.id, patch: record })}
          onClose={() => setBrowserFilter(null)}
        />
      )}
    </>
  );
}

function ActionMechanismEditor({ node, onPatch }) {
  const lib = useLibrary();
  const libDispatch = useLibraryDispatch();
  const [browsing, setBrowsing] = useState(false);
  const mechanisms = Object.values(lib.actionPatternMechanisms || {});
  const stored = lib.actionPatternMechanisms?.[node.actionMechanismId];
  const system = node.mechanismSystem || stored?.system || 'token';
  const image = node.image || stored?.image;
  const imageScale = Number(node.imageScale ?? stored?.imageScale) || 1;
  const imagePositionX = Number(node.imagePositionX ?? stored?.imagePositionX) || 0;
  const imagePositionY = Number(node.imagePositionY ?? stored?.imagePositionY) || 0;
  const detailList = (label, values) => {
    const entries = (Array.isArray(values) ? values : []).map((value) => `${value || ''}`.trim()).filter(Boolean);
    return (
      <div className="action-mechanism-readonly-field">
        <b>{label}</b>
        <span>{entries.length ? entries.map((entry, index) => <i key={`${label}-${index}`}>{entry}</i>) : <i className="dim">Not defined.</i>}</span>
      </div>
    );
  };
  const choose = (record) => {
    const patch = actionMechanismNodePatch(record);
    if (patch) onPatch(patch);
    setBrowsing(false);
  };

  return (
    <>
      <ISection key={`${node.id}-applied-mechanism`} label="Applied Mechanism" collapsed={false}>
        {image?.dataUrl && (
          <span className="action-mechanism-inspector-image">
            <img src={image.dataUrl} alt="" style={{ transform: `translate(${imagePositionX}%, ${imagePositionY}%) scale(${imageScale})` }} />
          </span>
        )}
        <div className="mechanism-applied-summary">
          <small>{node.mechanismCategory || ACTION_PATTERN_SYSTEMS[system]?.label || 'Action Mechanism'}</small>
          <strong>{node.title}</strong>
          <span>This node is the selected mechanism itself, not a generic Action container.</span>
        </div>
        <button className="btn wide" onClick={() => setBrowsing(true)}>Change Mechanism</button>
      </ISection>
      <ISection key={`${node.id}-mechanism-details`} label="Mechanism Details" collapsed={false}>
        <div className="action-mechanism-readonly-list single">
          <section style={{ '--accent': node.color || stored?.color || '#58C7A6' }}>
            {detailList('Advantage', node.advantages ?? stored?.advantages)}
            {detailList('Effect', node.effects ?? stored?.effects)}
            {detailList('Variation', node.variations ?? stored?.variations)}
          </section>
        </div>
        <div className="hint">Edit this mechanism's picture and descriptive fields in Mechanism Browser, then choose it again to refresh this node.</div>
      </ISection>
      {browsing && (
        <MechanismBrowser
          initialFilter={system}
          patternMechanisms={mechanisms}
          probabilityMechanisms={Object.values(lib.actionProbabilityMechanisms || {})}
          selectedPatternIds={[node.actionMechanismId]}
          allowedKind="pattern"
          onPick={choose}
          onSave={(record) => libDispatch({ type: 'UPDATE_ENTITY', coll: record.kind === 'probability' ? 'actionProbabilityMechanisms' : 'actionPatternMechanisms', id: record.id, patch: record })}
          onClose={() => setBrowsing(false)}
        />
      )}
    </>
  );
}

function ActionTypePatternEditor({ node, onPatch, manageLibrary = false }) {
  const lib = useLibrary();
  const libDispatch = useLibraryDispatch();
  const fields = node.fields || {};
  const mechanisms = Object.values(lib.actionPatternMechanisms || {});
  const [browserFilter, setBrowserFilter] = useState(null);
  const patchFields = (patch) => onPatch({ fields: { ...fields, ...patch } });
  const selectMechanism = (record) => {
    const catalogue = { ...(lib.actionPatternMechanisms || {}), [record.id]: record };
    const nextFields = updateActionPatternSelection(fields, record.system, record.id, catalogue);
    onPatch({
      fields: nextFields,
      body: record.description || 'Select and configure the human-readable action pattern used by this action.',
      image: record.image || null,
    });
    setBrowserFilter(null);
  };
  const addMechanism = (system) => {
    const label = String(window.prompt(`New ${ACTION_PATTERN_SYSTEMS[system].label} mechanism name`, '') || '').trim();
    if (!label) return;
    const id = genId(lib.actionPatternMechanisms || {}, 'APM-');
    libDispatch({ type: 'ADD_ENTITY', coll: 'actionPatternMechanisms', entity: { id, system, label, description: '', image: null, imageScale: 1, advantages: [''], effects: [''], variations: [''], custom: true } });
    patchFields({ [`${system}MechanismId`]: id, activeMechanismId: id });
  };
  const deleteMechanism = (mechanism) => {
    if (!window.confirm(`Delete the mechanism "${mechanism.label}"? This cannot be undone.`)) return;
    libDispatch({ type: 'DELETE_ENTITY', coll: 'actionPatternMechanisms', id: mechanism.id });
    const patch = {};
    if (fields.activeMechanismId === mechanism.id) patch.activeMechanismId = '';
    if (fields[`${mechanism.system}MechanismId`] === mechanism.id) patch[`${mechanism.system}MechanismId`] = '';
    if (Object.keys(patch).length) patchFields(patch);
  };

  return (
    <>
      <ISection key={`${node.id}-action-pattern-systems`} label="Action Systems" collapsed={false}>
        <div className="mechanism-slot-list">
          {Object.values(ACTION_PATTERN_SYSTEMS).map((system) => {
            const selectedId = fields[`${system.id}MechanismId`] || '';
            const selected = lib.actionPatternMechanisms?.[selectedId];
            return (
              <div className="mechanism-slot" key={system.id}>
                <span>{system.id}</span>
                <b title={selected?.label || 'None'}>{selected?.label || 'None'}</b>
                <div className="mechanism-slot-actions">
                  <button className="btn tiny" onClick={() => setBrowserFilter(system.id)}>{system.id === 'token' ? 'Token' : system.id === 'order' ? 'Order' : 'Special'}</button>
                  {manageLibrary && <button className="btn tiny" title={`Add ${system.label} mechanism`} onClick={() => addMechanism(system.id)}>+</button>}
                </div>
              </div>
            );
          })}
        </div>
      </ISection>
      {manageLibrary && (
        <ISection key={`${node.id}-manage-mechanisms`} label="Manage Mechanisms" collapsed={false}>
          {Object.values(ACTION_PATTERN_SYSTEMS).map((system) => (
            <div className="isect compact" key={system.id}>
              <SectionLabel>{system.label}</SectionLabel>
              <div className="trackbucket">
                {mechanisms.filter((mechanism) => mechanism.system === system.id).map((mechanism) => (
                  <div className="trackchip on" key={mechanism.id}>
                    <b>{mechanism.label}</b>
                    <button className="linkbtn danger" onClick={() => deleteMechanism(mechanism)}>Delete</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </ISection>
      )}
      {browserFilter && (
        <MechanismBrowser
          initialFilter={browserFilter}
          patternMechanisms={mechanisms}
          probabilityMechanisms={Object.values(lib.actionProbabilityMechanisms || {})}
          selectedPatternIds={Object.keys(ACTION_PATTERN_SYSTEMS).map((system) => fields[`${system}MechanismId`])}
          allowedKind="pattern"
          onPick={selectMechanism}
          onSave={(record) => libDispatch({ type: 'UPDATE_ENTITY', coll: record.kind === 'probability' ? 'actionProbabilityMechanisms' : 'actionPatternMechanisms', id: record.id, patch: record })}
          onClose={() => setBrowserFilter(null)}
        />
      )}
    </>
  );
}

function ActionProbabilityEditor({ node, onPatch }) {
  const lib = useLibrary();
  const libDispatch = useLibraryDispatch();
  const [browsing, setBrowsing] = useState(false);
  const probabilityMechanisms = Object.values(lib.actionProbabilityMechanisms || {});
  const selected = lib.actionProbabilityMechanisms?.[node.resolutionMechanismId]
    || probabilityMechanisms.find((record) => record.label === node.resolutionType)
    || probabilityMechanisms[0]
    || { id: '', label: 'Choose resolution', description: '', variations: [''], emotionalSpike: '', effects: [''], image: null, imageScale: 1, imagePositionX: 0, imagePositionY: 0 };
  const variations = Array.isArray(node.variations) && node.variations.length ? node.variations : (selected.variations || ['']);
  const effects = Array.isArray(node.effects) && node.effects.length ? node.effects : (selected.effects || ['']);
  const emotionalSpike = node.emotionalSpike ?? selected.emotionalSpike ?? '';
  const imageScale = Math.min(3, Math.max(0.5, Number(node.imageScale ?? selected.imageScale) || 1));
  const imagePositionX = Math.min(100, Math.max(-100, Number(node.imagePositionX ?? selected.imagePositionX) || 0));
  const imagePositionY = Math.min(100, Math.max(-100, Number(node.imagePositionY ?? selected.imagePositionY) || 0));
  const displayImage = node.image || selected.image;
  const choose = (record) => {
    onPatch({
      resolutionMechanismId: record.id,
      resolutionType: record.label,
      body: record.description,
      image: record.image,
      variations: [...(record.variations || [''])],
      emotionalSpike: record.emotionalSpike || '',
      effects: [...(record.effects || [''])],
      imageScale: record.imageScale || 1,
      imagePositionX: record.imagePositionX || 0,
      imagePositionY: record.imagePositionY || 0,
      color: record.color || node.color,
    });
    setBrowsing(false);
  };
  return (
    <>
      <ISection key={`${node.id}-resolution-mechanism`} label="Resolution Mechanism" collapsed={false}>
        <div className="mechanism-selection-preview">
          {displayImage?.dataUrl && <span className="mechanism-selection-image"><img src={displayImage.dataUrl} alt="" style={{ transform: `translate(${imagePositionX}%, ${imagePositionY}%) scale(${imageScale})` }} /></span>}
          <div>
            <b>{selected.label}</b>
            <small>{selected.description}</small>
          </div>
        </div>
        <button className="btn wide" onClick={() => setBrowsing(true)}>Browse Resolutions</button>
      </ISection>
      <ISection key={`${node.id}-resolution-details`} label="Resolution Details" collapsed={false}>
        <MechanicsNodeField
          field={{ key: 'variations', label: 'Variation', type: 'repeatableShortText', addLabel: 'Add variation', placeholder: 'Describe one variation in one or two sentences.' }}
          value={variations}
          onChange={(next) => onPatch({ variations: next })}
          node={node}
        />
        <TextField label="Emotional Spike" textarea value={emotionalSpike} onCommit={(value) => onPatch({ emotionalSpike: value })} />
        <MechanicsNodeField
          field={{ key: 'effects', label: 'Effect', type: 'repeatableShortText', addLabel: 'Add effect', placeholder: 'Describe one effect in one or two sentences.' }}
          value={effects}
          onChange={(next) => onPatch({ effects: next })}
          node={node}
        />
      </ISection>
      {displayImage?.dataUrl && (
        <ISection key={`${node.id}-resolution-image`} label="Image Framing" collapsed={false}>
          <SectionLabel>Image scale · {imageScale.toFixed(2)}×</SectionLabel>
          <input className="wide-range" type="range" min="0.5" max="3" step="0.05" value={imageScale}
            onChange={(event) => onPatch({ imageScale: Number(event.target.value) })} />
          <div className="hint">Scale the image within the node frame without resizing the node itself.</div>
        </ISection>
      )}
      {browsing && (
        <MechanismBrowser
          initialFilter="probability"
          patternMechanisms={Object.values(lib.actionPatternMechanisms || {})}
          probabilityMechanisms={probabilityMechanisms}
          selectedProbability={selected.id}
          allowedKind="probability"
          onPick={choose}
          onSave={(record) => libDispatch({ type: 'UPDATE_ENTITY', coll: record.kind === 'probability' ? 'actionProbabilityMechanisms' : 'actionPatternMechanisms', id: record.id, patch: record })}
          onClose={() => setBrowsing(false)}
        />
      )}
    </>
  );
}

function LibMechSubnodePanel({ template }) {
  const libDispatch = useLibraryDispatch();
  const meta = MECHANIC_SUBNODE_TYPES[template.kind] || MECHANIC_SUBNODE_TYPES.progressiveFeedback;
  const upd = (patch) => libDispatch({ type: 'UPDATE_ENTITY', coll: 'mechSubnodes', id: template.id, patch });
  const updateField = (key, value) => upd({ fields: { ...(template.fields || {}), [key]: value } });
  return (
    <>
      <TemplateBadge />
      <div className="ihead">
        <div className="ihrow">
          <span className="sq big" style={{ background: template.color || meta.color }}><PrimIcon icon={template.icon || meta.icon} color="#fff" size={13} /></span>
          <h3>{template.name || meta.label}</h3>
        </div>
        <div className="sub mono">{template.id} · mechanic subnode · {template.reusable ? 'reusable' : 'modifier'}</div>
      </div>
      <TextField label="Template name" value={template.name || meta.label} onCommit={(v) => upd({ name: v })} />
      <div className="isect">
        <SectionLabel>Subnode type</SectionLabel>
        <div className="hint">{meta.label}</div>
      </div>
      {template.kind === 'actionTypePattern' ? (
        <>
          <TextField label="Description" textarea value={template.description || ''} onCommit={(description) => upd({ description })} />
          <ActionTypePatternEditor node={template} onPatch={upd} manageLibrary />
        </>
      ) : (
        <>
          <div className="isect">
            <SectionLabel>Purpose · read-only</SectionLabel>
            <div className="hint">{template.purpose || meta.purpose}</div>
          </div>
          <ISection key={`${template.id}-focused-fields`} label="Focused Fields" collapsed={false}>
            {(meta.fields || []).map((field) => (
              <MechanicSubnodeField key={field.key} field={field} value={(template.fields || {})[field.key]} onChange={(value) => updateField(field.key, value)} />
            ))}
          </ISection>
        </>
      )}
      <ISection key={`${template.id}-attach-rules`} label="Attach Rules" collapsed={false}>
        <div className="chips">
          {(template.attachesTo || meta.attachesTo || ['*']).map((target) => <span key={target} className="pill">{target === '*' ? 'Any mechanic node' : target}</span>)}
        </div>
      </ISection>
    </>
  );
}

// Unified narrative building block (story-only): editable content + import.
function LibNarrativePanel({ template }) {
  const lib = useLibrary();
  const libDispatch = useLibraryDispatch();
  const upd = (patch) => libDispatch({ type: 'UPDATE_ENTITY', coll: 'narrative', id: template.id, patch });
  const meta = lib.narrativeCategories[template.category] ?? { label: template.category, color: '#8B92A6' };
  const color = template.color || meta.color;
  return (
    <>
      <TemplateBadge />
      <div className="ihead">
        <div className="ihrow"><span className="sq big" style={{ background: color }} /><h3>{template.name}</h3></div>
        <div className="sub mono">{template.id} · narrative · {meta.label}</div>
      </div>
      <ImportButton build={(l, p) => importNarrative(l, p, template.id)} label="Add as story node in game" />
      <TextField label="Name" value={template.name} onCommit={(v) => upd({ name: v })} />
      <div className="isect">
        <SectionLabel>Category</SectionLabel>
        <select className="field-input" value={template.category} onChange={(e) => {
          const m = lib.narrativeCategories[e.target.value];
          upd({ category: e.target.value, color: m?.color ?? template.color, icon: m?.icon ?? template.icon });
        }}>
          {Object.values(lib.narrativeCategories).map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          {!lib.narrativeCategories[template.category] && <option value={template.category}>{template.category} (deleted)</option>}
        </select>
      </div>
      <TextField label="Text · the narrative itself" textarea value={template.body} onCommit={(v) => upd({ body: v })} />
      <TextField label="Tags (comma separated)" value={(template.tags || []).join(', ')}
        onCommit={(v) => upd({ tags: v.split(',').map((t) => t.trim()).filter(Boolean) })} />
    </>
  );
}

function LibNodeTemplatePanel({ template, onDeleted }) {
  const proj = useGame();
  const dispatch = useDispatch();
  const libDispatch = useLibraryDispatch();
  const upd = (patch) => libDispatch({ type: 'UPDATE_ENTITY', coll: 'narrative', id: template.id, patch });
  const remove = () => {
    const label = template.nodeClass === 'subnode' ? 'subnode template' : 'base node template';
    if (!window.confirm(`Delete ${label} "${template.name}"? This cannot be undone.`)) return;
    libDispatch({ type: 'DELETE_ENTITY', coll: 'narrative', id: template.id });
    onDeleted?.();
  };
  const isSub = template.nodeClass === 'subnode';
  const meta = isSub
    ? (SUBNODE_TYPES[template.subKind] || { label: 'Subnode', color: '#F08CB4', icon: 'swap' })
    : (baseTemplateMeta(template.nodeKind) || { label: 'Base Node', color: '#8B92A6', icon: 'flag' });
  const color = template.color || meta.color;
  const importTemplate = () => {
    if (isSub) {
      const id = genId(proj.subnodes || {}, `${proj.meta.prefix}-SB-`);
      dispatch({
        type: 'ADD_ENTITY',
        coll: 'subnodes',
        entity: { ...SUBNODE_BLANK(id, template.subKind || 'outcomeBranches'), ...(template.template || {}), id, x: 120, y: 120, parentRef: null, history: [] },
      });
      return;
    }
    const kind = template.nodeKind || 'event';
    if (kind === 'masterAct') {
      const id = genId(proj.masterNodes || {}, 'ACT-');
      const saved = template.template ? JSON.parse(JSON.stringify(template.template)) : {};
      dispatch({
        type: 'GRAPH_ADD_NODE',
        scope: { coll: 'masterNodes' },
        node: { ...saved, id, kind, title: template.name, x: 100, y: 100, body: saved.body ?? template.body ?? '', color: template.color ?? saved.color ?? null },
      });
      return;
    }
    const id = genId(proj.nodes, `${proj.meta.prefix}-N-`);
    const saved = template.template ? JSON.parse(JSON.stringify(template.template)) : {};
    dispatch({
      type: 'ADD_NODE',
      node: {
        ...saved,
        id, primitiveId: template.id, kind, title: template.name, x: 100, y: 100, body: saved.body ?? template.body ?? '', color: template.color ?? saved.color ?? null,
        itemType: saved.itemType ?? template.itemType ?? (kind === 'item' ? 'Key' : undefined),
        origin: saved.origin ?? template.origin ?? '',
        persistsAcrossTasks: saved.persistsAcrossTasks ?? !!template.persistsAcrossTasks,
        teamId: null, sets: [], locationId: null, itemId: null, mechanicIds: [], sensorIds: [], history: [],
      },
    });
  };
  return (
    <>
      <TemplateBadge />
      <div className="ihead">
        <div className="ihrow"><span className="sq big" style={{ background: color }}><PrimIcon icon={template.icon || meta.icon} color="#fff" size={13} /></span><h3>{template.name}</h3></div>
        <div className="sub mono">{template.id} · {isSub ? 'subnode template' : 'base node template'} · {meta.label}</div>
      </div>
      <div className="isect">
        <button className="btn primary wide" onClick={importTemplate}>Import template into game</button>
        <div className="hint">Duplicates this Library template into <b>{proj.meta.name}</b>. The template stays unchanged.</div>
      </div>
      <TextField label="Name" value={template.name} onCommit={(v) => upd({ name: v })} />
      <div className="isect">
        <SectionLabel>{isSub ? 'Subnode type' : 'Base node type'}</SectionLabel>
        {isSub ? (
          <select className="field-input" value={template.subKind} onChange={(e) => {
            const m = SUBNODE_TYPES[e.target.value];
            upd({ subKind: e.target.value, category: e.target.value, color: m?.color ?? template.color, icon: m?.icon ?? template.icon });
          }}>
            {Object.values(SUBNODE_TYPES).map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        ) : template.nodeKind === 'item' ? (
          <div className="field-input readonlyfield">Story Item</div>
        ) : (
          <select className="field-input" value={template.nodeKind} onChange={(e) => {
            const m = baseTemplateMeta(e.target.value);
            upd({ nodeKind: e.target.value, category: e.target.value, color: m?.color ?? template.color, icon: m?.icon ?? template.icon });
          }}>
            {Object.values(BASE_NODE_TYPES).map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            <option value={MASTER_ACT_TYPE.id}>{MASTER_ACT_TYPE.label}</option>
          </select>
        )}
      </div>
      <TextField label="Template note" textarea value={template.body} onCommit={(v) => upd({ body: v })} />
      {!isSub && template.nodeKind === 'item' && (
        <>
          <div className="isect">
            <SectionLabel>Type</SectionLabel>
            <select className="field-input" value={template.itemType || template.template?.itemType || 'Key'} onChange={(e) => upd({ itemType: e.target.value, template: { ...(template.template || {}), itemType: e.target.value } })}>
              {STORY_ITEM_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <TextField label="Origin" textarea value={template.origin ?? template.template?.origin ?? ''} onCommit={(v) => upd({ origin: v, template: { ...(template.template || {}), origin: v } })} />
          <div className="isect">
            <label className="checkrow">
              <input type="checkbox" checked={!!(template.persistsAcrossTasks ?? template.template?.persistsAcrossTasks)} onChange={(e) => upd({ persistsAcrossTasks: e.target.checked, template: { ...(template.template || {}), persistsAcrossTasks: e.target.checked } })} />
              <span>Persists across tasks</span>
            </label>
          </div>
        </>
      )}
      <TextField label="Tags (comma separated)" value={(template.tags || []).join(', ')}
        onCommit={(v) => upd({ tags: v.split(',').map((t) => t.trim()).filter(Boolean) })} />
      <div className="isect">
        <button className="linkbtn danger" onClick={remove}>Delete {isSub ? 'subnode template' : 'base node template'}</button>
      </div>
    </>
  );
}

function LibFrameworkTypePanel({ frameworkId }) {
  const type = FRAMEWORK_TYPES[frameworkId] || FRAMEWORK_TYPES.fate;
  const isValueFramework = type.layout === 'values';
  return (
    <>
      <TemplateBadge />
      <div className="ihead">
        <div className="ihrow">
          <span className="sq big" style={{ background: type.color }}><PrimIcon icon={type.icon} color="#fff" size={13} /></span>
          <h3>{type.label}</h3>
        </div>
        <div className="sub mono">{type.id} · reference framework</div>
      </div>
      <div className="isect">
        <SectionLabel>Summary</SectionLabel>
        <div className="hint">{type.summary}</div>
      </div>
      <div className="isect">
        <SectionLabel>{isValueFramework ? 'Value Poles' : 'Acronym / Phases'}</SectionLabel>
        <div className="fwphase-list">
          {type.phases.map((phase) => (
            <div key={phase.key} className={`fwphase${isValueFramework ? ' valuepole' : ''}`}>
              <span style={{ background: type.color }}>{phase.key}</span>
              <div>
                <b>{phase.name}</b>
                <p>{phase.short}</p>
                <small>{phase.detail}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function LibBuilderNodePanel({ selection }) {
  const n = selection.node;
  const lib = useLibrary();
  const patch = selection.onPatch || (() => {});
  const isSub = n._sub;
  const isFramework = n.kind === 'framework';
  const isMechanicSchemaNode = !!n.mechKind || n.kind === 'mechanicSubnode' || !!n.physicalKind;
  const type = isFramework ? (FRAMEWORK_TYPES[n.frameworkId] || FRAMEWORK_TYPES.fate) : null;
  const isValueFramework = type?.layout === 'values';
  const color = n.color
    || (isSub ? SUBNODE_TYPES[n.kind]?.color : isFramework ? type.color : n.kind === 'concept' ? ADDITIONAL_NODE_TYPES[n.conceptKind]?.color : BASE_NODE_TYPES[n.kind]?.color)
    || '#8B92A6';
  if (n.kind === LINKING_NODE_KIND) {
    return (
      <>
        <div className="scopebadge template">Unsaved builder draft · save the structure to keep it in the Library.</div>
        <LinkingNodeInspector node={n} onPatch={patch} onNavigate={selection.onNavigate} onInsert={selection.onInsert} />
      </>
    );
  }
  if (n.kind === CHARACTER_ARCHETYPE_FACET_KIND) {
    return (
      <>
        <div className="scopebadge template">Unsaved builder draft · save the structure to keep it in the Library.</div>
        <CharacterArchetypeFacetInspector node={n} onPatch={patch} />
      </>
    );
  }
  if (n.kind === CHARACTER_ARCHETYPE_COMBINATIONS_KIND) {
    return (
      <>
        <div className="scopebadge template">Unsaved builder draft · save the structure to keep it in the Library.</div>
        <CharacterArchetypeCombinationsInspector node={n} onPatch={patch} />
      </>
    );
  }
  if (n.kind === 'character') {
    return (
      <>
        <div className="scopebadge template">Unsaved builder draft · save the structure to keep it in the Library.</div>
        <div className="ihead">
          <div className="ihrow">
            <span className="sq big" style={{ background: color }}><PrimIcon icon="user" color="#fff" size={13} /></span>
            <h3>{n.title}</h3>
          </div>
          <div className="sub mono">{n.id} · character</div>
        </div>
        <CharacterCardInspector node={n} onPatch={patch} onArchetypeChange={selection.onArchetypeChange || patch} template={DEFAULT_CHARACTER_CARD_TEMPLATE} />
      </>
    );
  }
  return (
    <>
      <div className="scopebadge template">Unsaved builder draft · save the structure to keep it in the Library.</div>
      <div className="ihead">
        <div className="ihrow">
          <span className="sq big" style={{ background: color }}><PrimIcon icon={isFramework ? type.icon : 'flag'} color="#fff" size={13} /></span>
          <h3>{n.title}</h3>
        </div>
        <div className="sub mono">{n.id} · {isSub ? 'subnode' : isFramework ? 'reference framework' : n.kind}</div>
      </div>
      {n.kind !== 'item' && <TextField label={isFramework ? 'Framework title' : 'Node title'} value={n.title} onCommit={(v) => patch({ title: v })} />}
      {n.kind !== 'item' && !isFramework && n.mechKind !== 'playerFacingInstruction' && <TextField label="Description" textarea value={n.body} onCommit={(v) => patch({ body: v })} />}
      {n.kind === 'item' && <StoryItemInspectorFields node={n} onPatch={patch} lib={lib} graph={{ nodes: { [n.id]: n } }} />}
      {false && n.kind === 'item' && (
        <>
          <div className="isect">
            <SectionLabel>Base type</SectionLabel>
            <div className="field-input readonlyfield">Story Item</div>
          </div>
          <div className="isect">
            <SectionLabel>Type</SectionLabel>
            <select className="field-input" value={n.itemType || 'Key'} onChange={(e) => patch({ itemType: e.target.value })}>
              {STORY_ITEM_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <TextField label="Origin" textarea value={n.origin} onCommit={(v) => patch({ origin: v })} />
          <div className="isect">
            <label className="checkrow">
              <input type="checkbox" checked={!!n.persistsAcrossTasks} onChange={(e) => patch({ persistsAcrossTasks: e.target.checked })} />
              <span>Persists across tasks</span>
            </label>
          </div>
        </>
      )}
      {isMechanicSchemaNode && <MechanicsNodeFields node={n} onPatch={patch} lib={lib} />}
      {isFramework && (
        <div className="isect">
          <SectionLabel>{isValueFramework ? 'Value Poles' : 'Acronym / Phases'}</SectionLabel>
          <div className="fwphase-list">
            {type.phases.map((phase) => (
              <div key={phase.key} className={`fwphase${isValueFramework ? ' valuepole' : ''}`}>
                <span style={{ background: color }}>{phase.key}</span>
                <div>
                  <b>{phase.name}</b>
                  <p>{phase.short}</p>
                  <small>{phase.detail}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {n.kind !== 'item' && <div className="isect">
        <SectionLabel>Color</SectionLabel>
        <div className="chips">
          {NODE_SWATCHES.map((c) => <button key={c} className={`swatch${color === c ? ' on' : ''}`} style={{ background: c }} onClick={() => patch({ color: c })} />)}
          <button className="linkbtn" onClick={() => patch({ color: null })}>Auto</button>
        </div>
      </div>}
    </>
  );
}

function LibBuilderFramePanel({ selection }) {
  const f = selection.frame;
  const isLine = f.shape === 'arrow' || f.shape === 'spline';
  const patch = selection.onPatch || (() => {});
  return (
    <>
      <div className="scopebadge template">Unsaved builder frame · save the structure to keep it in the Library.</div>
      <div className="ihead">
        <div className="ihrow"><span className="sq big" style={{ background: f.color || '#8B92A6' }} /><h3>{f.label || 'Frame'}</h3></div>
        <div className="sub mono">{f.id} · visual frame</div>
      </div>
      <TextField label="Frame label" value={f.label || 'Frame'} onCommit={(v) => patch({ label: v })} />
      <div className="frow" style={{ padding: '0 16px 13px' }}>
        <div><SectionLabel>{isLine ? 'Horizontal reach' : 'Width'}</SectionLabel><input className="field-input" defaultValue={f.w} onBlur={(e) => patch({ w: isLine ? (parseInt(e.target.value, 10) || f.w) : Math.max(160, parseInt(e.target.value, 10) || f.w) })} /></div>
        <div><SectionLabel>{isLine ? 'Vertical reach' : 'Height'}</SectionLabel><input className="field-input" defaultValue={f.h} onBlur={(e) => patch({ h: isLine ? (parseInt(e.target.value, 10) || f.h) : Math.max(100, parseInt(e.target.value, 10) || f.h) })} /></div>
      </div>
      <FrameAppearanceFields frame={f} onPatch={patch} />
      <div className="isect">
        <button className="linkbtn danger" onClick={() => selection.onDelete?.()}>Delete {f.shape || 'frame'}</button>
      </div>
    </>
  );
}

function LibBuilderNumberPanel({ selection }) {
  const marker = selection.marker;
  const patch = selection.onPatch || (() => {});
  return (
    <>
      <div className="scopebadge template">Unsaved builder {visualMarkerLabel(marker).toLowerCase()} · save the structure to keep it in the Library.</div>
      <div className="ihead">
        <div className="ihrow"><span className="sq big" style={{ background: marker.color || '#E8D25C', color: '#111' }}>{marker.value ?? 1}</span><h3>{visualMarkerLabel(marker)} marker</h3></div>
        <div className="sub mono">{marker.id} Â· visual symbol</div>
      </div>
      <NumberMarkerFields marker={marker} onPatch={patch} onDelete={selection.onDelete || (() => {})} />
    </>
  );
}

function LibBuilderTitlePanel({ selection }) {
  const marker = selection.marker;
  const patch = selection.onPatch || (() => {});
  return (
    <>
      <div className="scopebadge template">Unsaved builder title Ã‚Â· save the structure to keep it in the Library.</div>
      <div className="ihead">
        <div className="ihrow"><span className="sq big" style={{ background: marker.color || '#E9EBF3', color: '#111' }}>T</span><h3>Title</h3></div>
        <div className="sub mono">{marker.id} Ã‚Â· visual text</div>
      </div>
      <TitleMarkerFields marker={marker} onPatch={patch} onDelete={selection.onDelete || (() => {})} />
    </>
  );
}

const libBlankGraph = { nodes: {}, edges: [], frames: {}, numberMarkers: {}, titleMarkers: {} };

function libStructureGraphAtPath(st, path = []) {
  let graph = { nodes: st?.nodes || {}, edges: st?.edges || [], frames: st?.frames || {}, numberMarkers: st?.numberMarkers || {}, titleMarkers: st?.titleMarkers || {} };
  for (const id of path) {
    const node = graph.nodes?.[id];
    graph = {
      nodes: node?.sub?.nodes || {},
      edges: node?.sub?.edges || [],
      frames: node?.sub?.frames || {},
      numberMarkers: node?.sub?.numberMarkers || {},
      titleMarkers: node?.sub?.titleMarkers || {},
    };
  }
  return graph;
}

function libPatchSubgraphAtPath(nodes, path, nextGraph) {
  if (!path?.length) return nodes || {};
  const [head, ...rest] = path;
  const node = nodes?.[head];
  if (!node) return nodes || {};
  const currentSub = node.sub || libBlankGraph;
  if (!rest.length) {
    return {
      ...(nodes || {}),
      [head]: { ...node, sub: { ...currentSub, ...nextGraph } },
    };
  }
  return {
    ...(nodes || {}),
    [head]: {
      ...node,
      sub: {
        ...currentSub,
        nodes: libPatchSubgraphAtPath(currentSub.nodes || {}, rest, nextGraph),
      },
    },
  };
}

function LibStructFramePanel({ storyId, frameId, coll = 'stories', graphPath = [] }) {
  const lib = useLibrary();
  const libDispatch = useLibraryDispatch();
  const st = lib[coll]?.[storyId];
  const graph = libStructureGraphAtPath(st, graphPath);
  const f = graph.frames?.[frameId];
  const isLine = f?.shape === 'arrow' || f?.shape === 'spline';
  if (!f) return <div className="empty">Frame not found in this structure.</div>;
  const patchGraph = (p) => {
    if (!graphPath.length) {
      libDispatch({ type: 'UPDATE_ENTITY', coll, id: storyId, patch: p });
      return;
    }
    libDispatch({ type: 'UPDATE_ENTITY', coll, id: storyId, patch: { nodes: libPatchSubgraphAtPath(st.nodes || {}, graphPath, { ...graph, ...p }) } });
  };
  const upd = (patch) => patchGraph({ frames: { ...(graph.frames || {}), [frameId]: { ...f, ...patch } } });
  const remove = () => {
    const frames = { ...(graph.frames || {}) };
    delete frames[frameId];
    patchGraph({ frames });
  };
  return (
    <>
      <TemplateBadge />
      <div className="ihead">
        <div className="ihrow"><span className="sq big" style={{ background: f.color || '#8B92A6' }} /><h3>{f.label || 'Frame'}</h3></div>
        <div className="sub mono">{f.id} · frame in {st.name}</div>
      </div>
      <TextField label="Frame label" value={f.label || 'Frame'} onCommit={(v) => upd({ label: v })} />
      <div className="frow" style={{ padding: '0 16px 13px' }}>
        <div><SectionLabel>{isLine ? 'Horizontal reach' : 'Width'}</SectionLabel><input className="field-input" defaultValue={f.w} onBlur={(e) => upd({ w: isLine ? (parseInt(e.target.value, 10) || f.w) : Math.max(160, parseInt(e.target.value, 10) || f.w) })} /></div>
        <div><SectionLabel>{isLine ? 'Vertical reach' : 'Height'}</SectionLabel><input className="field-input" defaultValue={f.h} onBlur={(e) => upd({ h: isLine ? (parseInt(e.target.value, 10) || f.h) : Math.max(100, parseInt(e.target.value, 10) || f.h) })} /></div>
      </div>
      <FrameAppearanceFields frame={f} onPatch={upd} />
      <div className="isect">
        <button className="linkbtn danger" onClick={remove}>Delete {f.shape || 'frame'}</button>
      </div>
    </>
  );
}

function LibStructFrameworkPanel({ storyId, frameworkId, coll = 'stories' }) {
  const lib = useLibrary();
  const libDispatch = useLibraryDispatch();
  const st = lib[coll]?.[storyId];
  const fw = st?.frameworks?.[frameworkId];
  if (!fw) return <div className="empty">Framework not found in this structure.</div>;
  const type = FRAMEWORK_TYPES[fw.frameworkId] || FRAMEWORK_TYPES.fate;
  const upd = (patch) => libDispatch({
    type: 'UPDATE_ENTITY', coll, id: storyId,
    patch: { frameworks: { ...(st.frameworks || {}), [frameworkId]: { ...fw, ...patch } } },
  });
  const remove = () => {
    const frameworks = { ...(st.frameworks || {}) };
    delete frameworks[frameworkId];
    libDispatch({ type: 'UPDATE_ENTITY', coll, id: storyId, patch: { frameworks } });
  };
  return (
    <>
      <TemplateBadge />
      <div className="ihead">
        <div className="ihrow">
          <span className="sq big" style={{ background: fw.color || type.color }}><PrimIcon icon={type.icon} color="#fff" size={13} /></span>
          <h3>{fw.title || type.title}</h3>
        </div>
        <div className="sub mono">{fw.id} · reference framework in {st.name}</div>
      </div>
      <TextField label="Framework title" value={fw.title || type.title} onCommit={(v) => upd({ title: v })} />
      <div className="isect">
        <SectionLabel>{type.layout === 'values' ? 'Value Poles' : 'Acronym / Phases'}</SectionLabel>
        <div className="fwphase-list">
          {type.phases.map((phase) => (
            <div key={phase.key} className={`fwphase${type.layout === 'values' ? ' valuepole' : ''}`}>
              <span style={{ background: fw.color || type.color }}>{phase.key}</span>
              <div>
                <b>{phase.name}</b>
                <p>{phase.short}</p>
                <small>{phase.detail}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="isect">
        <button className="linkbtn danger" onClick={remove}>Delete reference card</button>
      </div>
    </>
  );
}

function LibStructNumberMarkerPanel({ storyId, markerId, coll = 'stories', graphPath = [] }) {
  const lib = useLibrary();
  const libDispatch = useLibraryDispatch();
  const st = lib[coll]?.[storyId];
  const graph = libStructureGraphAtPath(st, graphPath);
  const marker = graph.numberMarkers?.[markerId];
  if (!marker) return <div className="empty">Visual marker not found in this structure.</div>;
  const patchGraph = (p) => {
    if (!graphPath.length) {
      libDispatch({ type: 'UPDATE_ENTITY', coll, id: storyId, patch: p });
      return;
    }
    libDispatch({ type: 'UPDATE_ENTITY', coll, id: storyId, patch: { nodes: libPatchSubgraphAtPath(st.nodes || {}, graphPath, { ...graph, ...p }) } });
  };
  const upd = (patch) => patchGraph({ numberMarkers: { ...(graph.numberMarkers || {}), [markerId]: { ...marker, ...patch } } });
  const remove = () => {
    const numberMarkers = { ...(graph.numberMarkers || {}) };
    delete numberMarkers[markerId];
    patchGraph({ numberMarkers });
  };
  return (
    <>
      <TemplateBadge />
      <div className="ihead">
        <div className="ihrow"><span className="sq big" style={{ background: marker.color || '#E8D25C', color: '#111' }}>{marker.value ?? 1}</span><h3>{visualMarkerLabel(marker)} marker</h3></div>
        <div className="sub mono">{marker.id} Â· visual symbol in {st.name}</div>
      </div>
      <NumberMarkerFields marker={marker} onPatch={upd} onDelete={remove} />
    </>
  );
}

function LibStructTitleMarkerPanel({ storyId, markerId, coll = 'stories', graphPath = [] }) {
  const lib = useLibrary();
  const libDispatch = useLibraryDispatch();
  const st = lib[coll]?.[storyId];
  const graph = libStructureGraphAtPath(st, graphPath);
  const marker = graph.titleMarkers?.[markerId];
  if (!marker) return <div className="empty">Title not found in this structure.</div>;
  const patchGraph = (p) => {
    if (!graphPath.length) {
      libDispatch({ type: 'UPDATE_ENTITY', coll, id: storyId, patch: p });
      return;
    }
    libDispatch({ type: 'UPDATE_ENTITY', coll, id: storyId, patch: { nodes: libPatchSubgraphAtPath(st.nodes || {}, graphPath, { ...graph, ...p }) } });
  };
  const upd = (patch) => patchGraph({ titleMarkers: { ...(graph.titleMarkers || {}), [markerId]: { ...marker, ...patch } } });
  const remove = () => {
    const titleMarkers = { ...(graph.titleMarkers || {}) };
    delete titleMarkers[markerId];
    patchGraph({ titleMarkers });
  };
  return (
    <>
      <TemplateBadge />
      <div className="ihead">
        <div className="ihrow"><span className="sq big" style={{ background: marker.color || '#E9EBF3', color: '#111' }}>T</span><h3>Title</h3></div>
        <div className="sub mono">{marker.id} Ã‚Â· visual title in {st.name}</div>
      </div>
      <TitleMarkerFields marker={marker} onPatch={upd} onDelete={remove} />
    </>
  );
}

// A node inside a structure's master graph (library editor selection). Works
// for both story and mechanic structures via the `coll` on the selection.
function LibStructNodePanel({ storyId, nodeId, coll = 'stories', graphPath = [], onSelect, onNavigate }) {
  const lib = useLibrary();
  const libDispatch = useLibraryDispatch();
  const st = lib[coll]?.[storyId];
  const graph = libStructureGraphAtPath(st, graphPath);
  const n = graph.nodes?.[nodeId];
  if (!n) return <div className="empty">Node not found in this structure.</div>;
  const upd = (nodePatch) => {
    const nextGraph = Object.keys(nodePatch).some((key) => key === 'archetypeEnabled' || key.startsWith('archetypeDarkSide'))
      ? syncCharacterArchetypeGraph(graph, nodeId, nodePatch)
      : { ...graph, nodes: { ...(graph.nodes || {}), [nodeId]: { ...n, ...nodePatch } } };
    if (!graphPath.length) {
      libDispatch({ type: 'UPDATE_ENTITY', coll, id: storyId, patch: { nodes: nextGraph.nodes, edges: nextGraph.edges } });
      return;
    }
    libDispatch({
      type: 'UPDATE_ENTITY', coll, id: storyId,
      patch: { nodes: libPatchSubgraphAtPath(st.nodes || {}, graphPath, nextGraph) },
    });
  };
  const prim = n.primitiveId ? (lib.narrative[n.primitiveId] || lib.mechPrimitives[n.primitiveId] || lib.mechSubnodes?.[n.primitiveId]) : null;
  const conceptInternal = CONCEPT_INTERNAL_NODE_TYPES[n.kind];
  const isMechanicSchemaNode = coll === 'mechStructures' && (!!n.mechKind || n.kind === 'mechanicSubnode' || !!n.physicalKind);
  if (n.kind === LINKING_NODE_KIND) {
    return (
      <>
        <TemplateBadge />
        <LinkingNodeInspector node={n} onPatch={upd} onNavigate={onNavigate} onInsert={(ref) => {
          const inserted = buildNarrativeLinkInsertion(lib, ref, graph.nodes, { x: n.x + (n.w || 280) + 50, y: n.y }, 'INS-');
          if (!inserted) return;
          const nextGraph = { ...graph, nodes: { ...graph.nodes, [inserted.id]: inserted } };
          if (!graphPath.length) {
            libDispatch({ type: 'UPDATE_ENTITY', coll, id: storyId, patch: { nodes: nextGraph.nodes } });
          } else {
            libDispatch({ type: 'UPDATE_ENTITY', coll, id: storyId, patch: { nodes: libPatchSubgraphAtPath(st.nodes || {}, graphPath, nextGraph) } });
          }
          onSelect?.({ kind: 'lib-structnode', id: inserted.id, storyId, coll, graphPath });
        }} />
      </>
    );
  }
  if (n.kind === CHARACTER_ARCHETYPE_FACET_KIND) {
    return (
      <>
        <TemplateBadge />
        <CharacterArchetypeFacetInspector node={n} onPatch={upd} />
      </>
    );
  }
  if (n.kind === CHARACTER_ARCHETYPE_COMBINATIONS_KIND) {
    return (
      <>
        <TemplateBadge />
        <CharacterArchetypeCombinationsInspector node={n} onPatch={upd} />
      </>
    );
  }
  if (n.kind === 'character') {
    return (
      <>
        <TemplateBadge />
        <div className="ihead">
          <div className="ihrow"><span className="sq big" style={{ background: n.color || prim?.color || ENTITY_COLORS[n.kind] }}><PrimIcon icon="user" color="#fff" size={13} /></span><h3>{n.title}</h3></div>
          <div className="sub">character in <b>{st.name}</b></div>
        </div>
        <CharacterCardInspector node={n} onPatch={upd} template={DEFAULT_CHARACTER_CARD_TEMPLATE} />
      </>
    );
  }
  if (conceptInternal) {
    return (
      <>
        <TemplateBadge />
        <div className="ihead">
          <div className="ihrow">
            <span className="sq big" style={{ background: n.color || conceptInternal.color }}>
              <PrimIcon icon={conceptInternal.icon} color="#fff" size={13} />
            </span>
            <h3>{n.title}</h3>
          </div>
          <div className="sub">{conceptInternal.label} in <b>{st.name}</b></div>
        </div>
        <ConceptInternalNodeFields node={n} onPatch={upd} />
      </>
    );
  }
  return (
    <>
      <TemplateBadge />
      <div className="ihead">
        <div className="ihrow"><span className="sq big" style={{ background: n.color || prim?.color || ENTITY_COLORS[n.kind] }} /><h3>{n.title}</h3></div>
        <div className="sub">node in <b>{st.name}</b> · {n.kind}</div>
      </div>
      {n.kind !== 'item' && <TextField label="Node title" value={n.title} onCommit={(v) => upd({ title: v })} />}
      {n.kind !== 'item' && n.mechKind !== 'playerFacingInstruction' && <TextField label="Description" textarea value={n.body} onCommit={(v) => upd({ body: v })} />}
      {n.kind === 'item' && <StoryItemInspectorFields node={n} onPatch={upd} lib={lib} graph={graph} />}
      {false && n.kind === 'item' && (
        <>
          <div className="isect">
            <SectionLabel>Base type</SectionLabel>
            <div className="field-input readonlyfield">Story Item</div>
          </div>
          <div className="isect">
            <SectionLabel>Type</SectionLabel>
            <select className="field-input" value={n.itemType || 'Key'} onChange={(e) => upd({ itemType: e.target.value })}>
              {STORY_ITEM_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <TextField label="Origin" textarea value={n.origin} onCommit={(v) => upd({ origin: v })} />
          <div className="isect">
            <label className="checkrow">
              <input type="checkbox" checked={!!n.persistsAcrossTasks} onChange={(e) => upd({ persistsAcrossTasks: e.target.checked })} />
              <span>Persists across tasks</span>
            </label>
          </div>
        </>
      )}
      {isMechanicSchemaNode && <MechanicsNodeFields node={n} onPatch={upd} lib={lib} graph={graph} />}
      {n.kind !== 'item' && !['action', ACTION_MECHANISM_NODE_KIND].includes(n.mechKind) && <div className="isect">
        <SectionLabel>Node image · optional</SectionLabel>
        <ImageUploader entity={n} label="Node image" onImage={(img) => upd({ image: img })} />
      </div>}
      {prim && (
        <div className="isect">
          <SectionLabel>Built from primitive</SectionLabel>
          <div className="chips"><Chip color={prim.color}>{prim.name} · ~{prim.estMinutes} min</Chip></div>
        </div>
      )}
    </>
  );
}

function inspectorNodeSizeBinding({ selection, game, library, dispatch, libraryDispatch }) {
  const { kind, id } = selection;
  if (kind === 'node' && game.nodes?.[id]) {
    return { entity: game.nodes[id], onPatch: (patch) => dispatch({ type: 'UPDATE_ENTITY', coll: 'nodes', id, patch }) };
  }
  if (kind === 'subnode' && game.subnodes?.[id]) {
    return {
      entity: game.subnodes[id], role: 'subnode',
      onPatch: (patch) => dispatch({ type: 'UPDATE_ENTITY', coll: 'subnodes', id, patch }),
    };
  }
  if (kind === 'framework' && game.frameworks?.[id]) {
    return { entity: game.frameworks[id], onPatch: (patch) => dispatch({ type: 'UPDATE_ENTITY', coll: 'frameworks', id, patch }) };
  }
  if (kind === 'graphnode') {
    const entity = locateGraph(game, selection.scope).nodes?.[id];
    return entity ? {
      entity,
      onPatch: (patch) => dispatch({ type: 'GRAPH_UPDATE_NODE', scope: selection.scope, id, patch }),
    } : null;
  }
  if (kind === 'lib-buildernode' && selection.node) {
    return {
      entity: selection.node,
      role: selection.node._sub || selection.node.kind === 'mechanicSubnode' ? 'subnode' : undefined,
      onPatch: selection.onPatch || (() => {}),
    };
  }
  if (kind === 'lib-structnode') {
    const coll = selection.coll || 'stories';
    const structure = library[coll]?.[selection.storyId];
    const path = selection.graphPath || [];
    const graph = libStructureGraphAtPath(structure, path);
    const entity = graph.nodes?.[id];
    if (!entity) return null;
    const onPatch = (patch) => {
      const nextNodes = { ...(graph.nodes || {}), [id]: { ...entity, ...patch } };
      const structurePatch = path.length
        ? { nodes: libPatchSubgraphAtPath(structure.nodes || {}, path, { ...graph, nodes: nextNodes }) }
        : { nodes: nextNodes };
      libraryDispatch({ type: 'UPDATE_ENTITY', coll, id: selection.storyId, patch: structurePatch });
    };
    return { entity, onPatch };
  }
  if (kind === 'lib-structframework') {
    const coll = selection.coll || 'stories';
    const structure = library[coll]?.[selection.storyId];
    const entity = structure?.frameworks?.[id];
    if (!entity) return null;
    return {
      entity,
      onPatch: (patch) => libraryDispatch({
        type: 'UPDATE_ENTITY', coll, id: selection.storyId,
        patch: { frameworks: { ...(structure.frameworks || {}), [id]: { ...entity, ...patch } } },
      }),
    };
  }
  return null;
}

// The shared right-hand details panel. Project selections show game instances;
// lib-* selections show master templates with the import bridge.
export default function Inspector({ selection, onSelect, onNavigate, collapsed = false, onCollapsedChange, width = 320, onWidthChange }) {
  const s = useGame();
  const lib = useLibrary();
  const dispatch = useDispatch();
  const libDispatch = useLibraryDispatch();
  const resizeRef = React.useRef(null);
  React.useEffect(() => () => {
    resizeRef.current?.cleanup?.();
    document.body.classList.remove('inspector-resizing');
  }, []);
  const beginResize = (e) => {
    e.preventDefault();
    const pointerId = e.pointerId;
    const startX = e.clientX;
    const startWidth = width;
    const move = (moveEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      onWidthChange?.(startWidth + startX - moveEvent.clientX);
    };
    const cleanup = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };
    const finish = (finishEvent) => {
      if (finishEvent.pointerId !== pointerId) return;
      cleanup();
      resizeRef.current = null;
      document.body.classList.remove('inspector-resizing');
    };
    resizeRef.current?.cleanup?.();
    resizeRef.current = { pointerId, cleanup };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    document.body.classList.add('inspector-resizing');
  };
  const resizeHandle = (
    <div
      className="inspector-resizer"
      role="separator"
      aria-label="Resize inspector"
      aria-orientation="vertical"
      aria-valuemin="280"
      aria-valuemax="720"
      aria-valuenow={Math.round(width)}
      tabIndex={0}
      title="Drag to resize inspector"
      onPointerDown={beginResize}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); onWidthChange?.(width + 20); }
        if (e.key === 'ArrowRight') { e.preventDefault(); onWidthChange?.(width - 20); }
      }}
    />
  );
  if (collapsed) return (
    <aside className="inspector collapsed">
      <button className="inspector-toggle inspector-open" onClick={() => onCollapsedChange?.(false)} title="Open inspector" aria-label="Open inspector">‹</button>
    </aside>
  );
  const toggle = <button className="inspector-toggle inspector-close" onClick={() => onCollapsedChange?.(true)} title="Collapse inspector" aria-label="Collapse inspector">›</button>;
  if (!selection) return <aside className="inspector">{resizeHandle}{toggle}<div className="empty">Select an item, node, location or player to inspect it.</div></aside>;

  let body = null;
  const { kind, id } = selection;
  if (kind === 'item' && s.items[id]) body = <ItemPanel item={s.items[id]} />;
  else if (kind === 'fact' && s.facts?.[id]) body = <FactPanel fact={s.facts[id]} />;
  else if (kind === 'subnode' && s.subnodes?.[id]) body = <SubnodePanel sn={s.subnodes[id]} onSelect={onSelect} />;
  else if (kind === 'framework' && s.frameworks?.[id]) body = <FrameworkPanel framework={s.frameworks[id]} onSelect={onSelect} />;
  else if (kind === 'frame' && s.frames?.[id]) body = <FramePanel frame={s.frames[id]} onSelect={onSelect} />;
  else if (kind === 'numberMarker' && s.numberMarkers?.[id]) body = <NumberMarkerPanel marker={s.numberMarkers[id]} onSelect={onSelect} />;
  else if (kind === 'titleMarker' && s.titleMarkers?.[id]) body = <TitleMarkerPanel marker={s.titleMarkers[id]} onSelect={onSelect} />;
  else if (kind === 'graphframe') body = <GraphFramePanel scope={selection.scope} id={id} onSelect={onSelect} />;
  else if (kind === 'graphnumber') body = <GraphNumberMarkerPanel scope={selection.scope} id={id} onSelect={onSelect} />;
  else if (kind === 'graphtitle') body = <GraphTitleMarkerPanel scope={selection.scope} id={id} onSelect={onSelect} />;
  else if (kind === 'graphnode') body = <GraphNodePanel scope={selection.scope} id={id} onSelect={onSelect} onNavigate={onNavigate} />;
  else if (kind === 'location' && s.locations[id]) body = <LocationPanel location={s.locations[id]} />;
  else if (kind === 'player' && s.players[id]) body = <PlayerPanel player={s.players[id]} />;
  else if (kind === 'team' && s.teams[id]) body = <TeamPanel team={s.teams[id]} />;
  else if (kind === 'lib-items' && lib.items[id]) body = <LibItemPanel template={lib.items[id]} />;
  else if (kind === 'lib-locations' && lib.locations[id]) body = <LibLocationPanel template={lib.locations[id]} />;
  else if (kind === 'lib-mechanics' && lib.mechanics[id]) body = <LibMechanicPanel template={lib.mechanics[id]} />;
  else if (kind === 'lib-sensors' && lib.sensors[id]) body = <LibSensorPanel template={lib.sensors[id]} />;
  else if (kind === 'lib-stories' && lib.stories[id]) body = <LibStoryPanel
    template={lib.stories[id]}
    onDeleted={() => onSelect?.(null)}
    onOpenConcept={(conceptId) => onSelect?.({ kind: 'lib-concepts', id: conceptId, openEditor: true })}
  />;
  else if (kind === 'lib-concepts' && lib.concepts?.[id]) body = <LibConceptPanel template={lib.concepts[id]} onDeleted={() => onSelect?.(null)} />;
  else if (kind === 'lib-mechPrimitives' && lib.mechPrimitives[id]) body = <LibMechPrimitivePanel template={lib.mechPrimitives[id]} />;
  else if (kind === 'lib-mechSubnodes' && lib.mechSubnodes?.[id]) body = <LibMechSubnodePanel template={lib.mechSubnodes[id]} />;
  else if (kind === 'lib-frameworkType') body = <LibFrameworkTypePanel frameworkId={id} />;
  else if (kind === 'lib-narrative' && lib.narrative[id]) body = lib.narrative[id].nodeClass
    ? <LibNodeTemplatePanel template={lib.narrative[id]} onDeleted={() => onSelect?.(null)} />
    : <LibNarrativePanel template={lib.narrative[id]} />;
  else if (kind === 'lib-structnode') body = <LibStructNodePanel storyId={selection.storyId} nodeId={id} coll={selection.coll} graphPath={selection.graphPath || []} onSelect={onSelect} onNavigate={onNavigate} />;
  else if (kind === 'lib-structframe') body = <LibStructFramePanel storyId={selection.storyId} frameId={id} coll={selection.coll} graphPath={selection.graphPath || []} />;
  else if (kind === 'lib-structnumber') body = <LibStructNumberMarkerPanel storyId={selection.storyId} markerId={id} coll={selection.coll} graphPath={selection.graphPath || []} />;
  else if (kind === 'lib-structtitle') body = <LibStructTitleMarkerPanel storyId={selection.storyId} markerId={id} coll={selection.coll} graphPath={selection.graphPath || []} />;
  else if (kind === 'lib-structframework') body = <LibStructFrameworkPanel storyId={selection.storyId} frameworkId={id} coll={selection.coll} />;
  else if (kind === 'lib-buildernode') body = <LibBuilderNodePanel selection={{ ...selection, onNavigate }} />;
  else if (kind === 'lib-builderframe') body = <LibBuilderFramePanel selection={selection} />;
  else if (kind === 'lib-buildernumber') body = <LibBuilderNumberPanel selection={selection} />;
  else if (kind === 'lib-buildertitle') body = <LibBuilderTitlePanel selection={selection} />;
  else if (kind === 'node') {
    const r = resolveNode(s, lib, id);
    if (!r) body = null;
    // Narrative Weaver: concepts and base nodes get their fixed-order panels;
    // legacy typed kinds keep the old editor; mechanical nodes linked to an
    // item/location surface that live record instead.
    else if (r.node.kind === 'concept') body = <ConceptPanel node={r.node} />;
    else if (BASE_KINDS.includes(r.node.kind) || r.node.kind === LINKING_NODE_KIND) body = <BaseNodePanel node={r.node} onSelect={onSelect} onNavigate={onNavigate} />;
    else if (NARRATIVE_KINDS.includes(r.node.kind)) body = <NodePanel node={r.node} onSelect={onSelect} onNavigate={onNavigate} />;
    else if (r.item) body = <ItemPanel item={r.item} viaNode={r.node} />;
    else if (r.location) body = <LocationPanel location={r.location} viaNode={r.node} />;
    else body = <NodePanel node={r.node} onSelect={onSelect} onNavigate={onNavigate} />;
  }
  const boxSize = inspectorNodeSizeBinding({
    selection, game: s, library: lib, dispatch, libraryDispatch: libDispatch,
  });
  const selectionKey = [
    kind,
    id,
    selection.storyId || '',
    selection.coll || '',
    selection.scope?.coll || '',
    ...(selection.scope?.parentPath || (selection.scope?.parentId ? [selection.scope.parentId] : [])),
    ...(selection.graphPath || []),
  ].join(':');
  return (
    <aside className="inspector">
      {resizeHandle}
      {toggle}
      <React.Fragment key={selectionKey}>
        {body ?? <div className="empty">Record not found in this game.</div>}
        {body && boxSize && <NodeBoxSizeFields entity={boxSize.entity} role={boxSize.role} onPatch={boxSize.onPatch} />}
      </React.Fragment>
    </aside>
  );
}
