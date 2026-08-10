import { cloneDefaultStoryDynamicsGraph } from './storyDynamics.js';
import { actionPatternMechanismId, actionPatternSystemForCode, ACTION_MECHANISMS, makeActionMechanicTemplates, makeActionPatternMechanisms } from './actionMechanics.js';
import { ACTION_PROBABILITY_RESOLUTIONS, ACTION_PROBABILITY_RESOLUTION_TYPES, actionProbabilityResolution } from './actionProbability.js';
import { CURRENT_MECHANIC_PRIMITIVE_KINDS, CURRENT_MECHANIC_SUBNODE_KINDS } from '../mechanics/nodeArchive.js';

// Two separate stores:
//
//  LIBRARY (master database, persists across games)
//    - templates for items, locations, sensors; rules & mechanics; story structures
//    - ids are LIB-*  · editing a template updates the blueprint for FUTURE games
//
//  ACTIVE PROJECT (the currently open game)
//    - instances of items/locations/sensors copied from the Library, plus the
//      quest node graph, teams and players
//    - ids are <prefix>-* (e.g. CHM-…)  · instances carry templateId and add
//      game-state fields (build status, availability, placement, assignment,
//      sensor battery) · edits affect only this game

export const LIB_REV = 29;
export const SEED_REV = 11;

// Default item types — seeds the editable lib.itemTypes collection.
export const DEFAULT_ITEM_TYPES = {
  artifact: { id: 'artifact', label: 'Artifact', color: '#E0A23C' },
  gadget: { id: 'gadget', label: 'Gadget', color: '#3EC6D6' },
  consumable: { id: 'consumable', label: 'Consumable', color: '#E88F8F' },
  key: { id: 'key', label: 'Key', color: '#E8D25C' },
  clue: { id: 'clue', label: 'Clue', color: '#5CA8F5' },
  status: { id: 'status', label: 'Status', color: '#A87BF0' },
  tool: { id: 'tool', label: 'Tool', color: '#43BF87' },
  wearable: { id: 'wearable', label: 'Wearable', color: '#F08CB4' },
};

// Location map stage: coordinates for markers/arrows live in a fixed 160×90
// space (16:9) so they stay put on any screen size, over either base layer
// (uploaded schematic image or OpenStreetMap for outdoor sites).
export const STAGE_W = 160;
export const STAGE_H = 90;
export const DEFAULT_OSM = { lat: 56.9496, lon: 24.1052, zoom: 16 };
export const locationMapDefaults = () => ({ mapKind: 'schematic', osm: { ...DEFAULT_OSM }, markers: [], arrows: [] });

// Editable categories for the unified Narrative library (merged primitives +
// elements). Users can add and delete categories. Each carries a color + icon
// used on the narrative node cards and the story-structure canvas.
export const DEFAULT_NARRATIVE_CATEGORIES = {
  'story-beat': { id: 'story-beat', label: 'Story beat', color: '#5CA8F5', icon: 'flag' },
  'plot-hook': { id: 'plot-hook', label: 'Plot hook', color: '#F08CB4', icon: 'alert' },
  'briefing-script': { id: 'briefing-script', label: 'Briefing script', color: '#5CA8F5', icon: 'flag' },
  'npc-bio': { id: 'npc-bio', label: 'NPC bio', color: '#E0A23C', icon: 'swap' },
  'rumor': { id: 'rumor', label: 'Rumor', color: '#43BF87', icon: 'zap' },
  'lore': { id: 'lore', label: 'Lore fragment', color: '#A87BF0', icon: 'cog' },
  'supporting-notes': { id: 'supporting-notes', label: 'Supporting Notes', color: '#8B92A6', icon: 'book' },
};

// Descriptive tabs shown under a Game Master Rule's core principle.
export const GM_RULE_TABS = [
  { id: 'implementation', label: 'Implementation' },
  { id: 'rationale', label: 'Rationale' },
];

// ---------------------------------------------------------------------------
// NARRATIVE v2 — a node-graph story model adapted for LIVE (not video) games.
// The professional tools this is modelled on (articy:draft, Arcweave) evaluate
// branch logic in code at runtime. A live game has no runtime engine: a human
// referee, a physical prop, or a hardware sensor decides. So "variables" become
// FACTS (real-world trackable states) and "conditions" become plain-language
// gates a GM or sensor adjudicates.
// ---------------------------------------------------------------------------

// Typed narrative node palette. Each kind renders with its own colour + icon on
// the canvas and offers type-specific fields in the inspector.
export const NARR_NODE_TYPES = {
  beat: { id: 'beat', label: 'Beat', color: '#5CA8F5', icon: 'flag', blurb: 'A scene — what happens at a place and time.' },
  reveal: { id: 'reveal', label: 'Reveal', color: '#F08CB4', icon: 'zap', blurb: 'Deliver information: a clue, an NPC line, a discovered prop.' },
  branch: { id: 'branch', label: 'Branch', color: '#E0A23C', icon: 'swap', blurb: 'A decision point. Each outgoing link carries a plain-language condition a GM or sensor decides.' },
  fact: { id: 'fact', label: 'Fact change', color: '#3EC6D6', icon: 'cog', blurb: 'Records a real-world fact as now true — key held, door open, NPC hostile.' },
  converge: { id: 'converge', label: 'Convergence', color: '#A87BF0', icon: 'pin', blurb: 'Where divergent paths rejoin — keeps the story resilient.' },
  timed: { id: 'timed', label: 'Timed event', color: '#E8D25C', icon: 'clock', blurb: 'Fires at a clock time regardless of player action.' },
  recovery: { id: 'recovery', label: 'Recovery', color: '#E86464', icon: 'cross', blurb: 'A soft-fail nudge that puts a stalled team back in play — never a dead end.' },
};

// Which node kinds belong to the STORY side (vs. the mechanical task side used
// by the Weaver timeline). Includes legacy typed kinds (story/beat/…) so older
// saves keep working, plus the Narrative Weaver base kinds and concept nodes.
export const NARRATIVE_KINDS = ['story', ...Object.keys(NARR_NODE_TYPES),
  'event', 'character', 'storyLocation', 'item', 'quest', 'concept'];

// FACTS registry: the live-game replacement for a variable system. A fact is a
// real-world state the game tracks and a GM/sensor can check at a branch.
export const FACT_KINDS = {
  knowledge: { id: 'knowledge', label: 'Knowledge', color: '#5CA8F5', icon: 'flag', hint: 'Something a team has learned — a clue, a code, a name.' },
  physical: { id: 'physical', label: 'Physical', color: '#E0A23C', icon: 'swap', hint: 'A real token / prop / door state — key held, gate open.' },
  sensor: { id: 'sensor', label: 'Sensor', color: '#3EC6D6', icon: 'zap', hint: 'Bound to a hardware sensor in this game.' },
  npc: { id: 'npc', label: 'NPC state', color: '#F08CB4', icon: 'alert', hint: 'An NPC’s disposition — allied, hostile, exposed.' },
  progress: { id: 'progress', label: 'Progress', color: '#A87BF0', icon: 'pin', hint: 'A story milestone the game has reached.' },
};
export const FACT_BLANK = (id) => ({ id, name: 'New fact', kind: 'knowledge', detail: '', sensorId: null });

// ---------------------------------------------------------------------------
// NARRATIVE WEAVER — the locked node architecture for the narrative layer.
// Everything is PRE-AUTHORED: designers build all paths up front; play only
// selects among them. Three node classes, visually distinct:
//   BASE NODES        — minimum independent story building blocks.
//   ADDITIONAL NODES  — Pip-Decks-style strategic containers ("concepts"),
//                       collapsed by default, Expand / Edit, nest ≤ 3 deep.
//   SUBNODES          — precision enrichments; may float unattached on the
//                       canvas until linked; one-click detach on the line.
// The narrative layer never contains mechanic logic — nodes carry only a
// "Link to Mechanic Node" reference into the (separate) mechanic layer.
// ---------------------------------------------------------------------------

export const BASE_NODE_TYPES = {
  event: { id: 'event', label: 'Event', color: '#5CA8F5', icon: 'zap', blurb: 'Something that happens — a scene, an encounter, a moment.' },
  character: { id: 'character', label: 'Character', color: '#E0A23C', icon: 'user', blurb: 'A person in the story — NPC, actor role, or figure.' },
  storyLocation: { id: 'storyLocation', label: 'Story Location', color: '#43BF87', icon: 'pin', blurb: 'A place as the story sees it (link it to a real venue record).' },
  item: { id: 'item', label: 'Story Item', color: '#3EC6D6', icon: 'box', blurb: 'An object that matters to the story; optionally link it to a physical prop.' },
  quest: { id: 'quest', label: 'Quest', color: '#A87BF0', icon: 'target', blurb: 'A goal players pursue across one or more events.' },
};
export const BASE_KINDS = Object.keys(BASE_NODE_TYPES);

export const LINKING_NODE_TYPE = {
  id: 'linkingNode',
  label: 'Linking Node',
  color: '#68D7C0',
  icon: 'link',
  blurb: 'Links to a saved narrative node, concept, or story structure without duplicating it until requested.',
};

// Concept-internal planning nodes. These stay out of the main base-node
// palette and only appear when editing a concept's inner graph.
export const CONCEPT_INTERNAL_NODE_TYPES = {
  conceptTitle: { id: 'conceptTitle', label: 'Section Title', color: '#E8D25C', icon: 'layers', blurb: 'A heading that visually groups concept questions.' },
  conceptQuestion: { id: 'conceptQuestion', label: 'Concept Question', color: '#5CA8F5', icon: 'book', blurb: 'A design question inside a concept; connect it to choices.' },
  conceptChoice: { id: 'conceptChoice', label: 'Concept Choice', color: '#A87BF0', icon: 'swap', blurb: 'A possible answer, angle, or path from a concept question.' },
};

export const DEFAULT_CHARACTER_CARD_TEMPLATE = {
  questions: [
    { id: 'ccq-default-1', prompt: 'What do they want, and why right now?', answer: '' },
    { id: 'ccq-default-2', prompt: 'What would they never do?', answer: '' },
    { id: 'ccq-default-3', prompt: 'What do they give a team - object, information, or permission?', answer: '' },
    { id: 'ccq-default-4', prompt: 'One sentence only this character could say.', answer: '' },
    { id: 'ccq-default-5', prompt: 'What does a team see or hear in the first ten seconds?', answer: '' },
  ],
  typeGroups: [
    {
      id: 'ccg-default-role',
      label: 'Role',
      selectedId: null,
      options: [
        { id: 'cco-default-role-1', label: 'Guide' },
        { id: 'cco-default-role-2', label: 'Antagonist' },
        { id: 'cco-default-role-3', label: 'Gatekeeper' },
        { id: 'cco-default-role-4', label: 'Ensemble' },
        { id: 'cco-default-role-5', label: 'Lore figure' },
      ],
    },
    {
      id: 'ccg-default-archetype',
      label: 'Archetype',
      selectedId: null,
      options: [
        { id: 'cco-default-arch-1', label: 'Explorer' },
        { id: 'cco-default-arch-2', label: 'Sage' },
        { id: 'cco-default-arch-3', label: 'Muse' },
        { id: 'cco-default-arch-4', label: 'Rebel' },
        { id: 'cco-default-arch-5', label: 'Defender' },
        { id: 'cco-default-arch-6', label: 'Warrior' },
      ],
    },
  ],
};

const characterCardId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const cloneQuestionRow = (q, withAnswer = false) => ({
  id: characterCardId('ccq'),
  prompt: q?.prompt ?? '',
  answer: withAnswer ? (q?.answer ?? '') : '',
});
const cloneTypeGroup = (g, withSelection = false) => {
  const options = (g?.options || []).map((o) => ({ id: characterCardId('cco'), label: o?.label ?? '' }));
  const oldSelected = withSelection ? g?.selectedId ?? null : null;
  const selectedIndex = withSelection ? (g?.options || []).findIndex((o) => o.id === oldSelected) : -1;
  return {
    id: characterCardId('ccg'),
    label: g?.label ?? '',
    options,
    selectedId: selectedIndex >= 0 ? options[selectedIndex]?.id ?? null : null,
  };
};
export const cloneCharacterCardTemplate = (template = DEFAULT_CHARACTER_CARD_TEMPLATE) => ({
  questions: (template.questions || DEFAULT_CHARACTER_CARD_TEMPLATE.questions).map((q) => cloneQuestionRow(q, false)),
  typeGroups: (template.typeGroups || DEFAULT_CHARACTER_CARD_TEMPLATE.typeGroups).map((g) => cloneTypeGroup(g, false)),
});
export const cloneCharacterCardTemplateForSettings = (template = DEFAULT_CHARACTER_CARD_TEMPLATE) => ({
  questions: (template.questions || DEFAULT_CHARACTER_CARD_TEMPLATE.questions).map((q) => ({ ...cloneQuestionRow(q, false), answer: '' })),
  typeGroups: (template.typeGroups || DEFAULT_CHARACTER_CARD_TEMPLATE.typeGroups).map((g) => cloneTypeGroup(g, false)),
});
const characterCardReserved = new Set([
  'id', 'kind', 'title', 'name', 'body', 'description', 'questions', 'typeGroups', 'x', 'y', 'color', 'teamId',
  'sets', 'locationId', 'itemId', 'mechanicIds', 'sensorIds', 'history', 'primitiveId', 'image', 'sub', 'collapsed',
  'archetypeEnabled', 'archetypeDarkSideUp', 'archetypeDarkSideBack',
]);
const characterFieldLabel = (key) => key
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/[_-]+/g, ' ')
  .replace(/\b\w/g, (m) => m.toUpperCase());
const sanitizeCharacterQuestions = (rows = []) => rows.map((q) => ({
  id: q?.id || characterCardId('ccq'),
  prompt: q?.prompt ?? '',
  answer: q?.answer ?? '',
}));
const sanitizeCharacterTypeGroups = (groups = []) => groups.map((g) => {
  const options = (g?.options || []).map((o) => ({ id: o?.id || characterCardId('cco'), label: o?.label ?? '' }));
  const selectedId = options.some((o) => o.id === g?.selectedId) ? g.selectedId : null;
  return { id: g?.id || characterCardId('ccg'), label: g?.label ?? '', options, selectedId };
});
export const normalizeCharacterCard = (node = {}, template = DEFAULT_CHARACTER_CARD_TEMPLATE) => {
  const title = node.title ?? node.name ?? '';
  const description = node.description ?? node.body ?? '';
  const hasCardData = Array.isArray(node.questions) || Array.isArray(node.typeGroups);
  if (hasCardData) {
    const seeded = cloneCharacterCardTemplate(template);
    return {
      title,
      description,
      questions: Array.isArray(node.questions) ? sanitizeCharacterQuestions(node.questions) : seeded.questions,
      typeGroups: Array.isArray(node.typeGroups) ? sanitizeCharacterTypeGroups(node.typeGroups) : seeded.typeGroups,
    };
  }
  const migratedQuestions = [];
  for (const [key, value] of Object.entries(node)) {
    if (characterCardReserved.has(key)) continue;
    if (typeof value === 'string' && value.trim()) {
      migratedQuestions.push({ id: characterCardId('ccq'), prompt: characterFieldLabel(key), answer: value });
    }
  }
  const seeded = cloneCharacterCardTemplate(template);
  return {
    title,
    description,
    questions: migratedQuestions.length ? migratedQuestions : seeded.questions,
    typeGroups: seeded.typeGroups,
  };
};

export const MASTER_ACT_TYPE = {
  id: 'masterAct', label: 'Master Act', color: '#3EC6D6', icon: 'layers',
  blurb: 'A macro story act: short, theater-like, and separate from detailed narrative nodes.',
};

export const FRAMEWORK_TYPES = {
  fate: {
    id: 'fate',
    label: 'FATE',
    title: 'FATE',
    color: '#E8D25C',
    icon: 'target',
    blurb: 'A reference framework for shaping attention, credibility, belonging, and feeling.',
    summary: 'Focus attention, establish authority, activate tribe, and engage emotion.',
    phases: [
      {
        key: 'F',
        name: 'Focus',
        short: 'Draw attention to the specific behavior, choice, or moment that matters.',
        detail: 'Focus reduces noise. In a live game, this means making the meaningful action visible enough that players know where to put their attention.',
      },
      {
        key: 'A',
        name: 'Authority',
        short: 'Show why the action has weight, consequence, or legitimacy.',
        detail: 'Authority gives the moment credibility. It can come from an NPC, a rule, a visible result, a social signal, or the world responding clearly.',
      },
      {
        key: 'T',
        name: 'Tribe',
        short: 'Connect the action to group identity, status, and shared belonging.',
        detail: 'Tribe makes behavior socially meaningful. Players are more likely to change or commit when the group recognizes the action as part of who they are together.',
      },
      {
        key: 'E',
        name: 'Emotion',
        short: 'Attach feeling so the action is remembered and cared about.',
        detail: 'Emotion turns information into motivation. Fear, pride, relief, grief, wonder, or loyalty can make the choice matter beyond pure mechanics.',
      },
    ],
  },
  kolbLearningCycle: {
    id: 'kolbLearningCycle',
    label: "Kolb's Learning Cycle",
    title: "Kolb's Learning Cycle",
    color: '#5CA8F5',
    icon: 'swap',
    layout: 'cycle',
    blurb: 'A reference framework for designing learning through experience, reflection, concepts, and experimentation.',
    summary: 'Concrete experience leads to reflective observation, abstract conceptualization, and active experimentation.',
    phases: [
      {
        key: 'CE',
        name: 'Concrete Experience',
        short: 'Players do, encounter, attempt, fail, succeed, or feel something directly.',
        detail: 'Concrete experience is the lived moment. In a game, this is the task, scene, surprise, social interaction, physical action, or emotional beat players actually go through.',
      },
      {
        key: 'RO',
        name: 'Reflective Observation',
        short: 'Players look back at what happened and notice patterns, surprises, mistakes, and feelings.',
        detail: 'Reflection turns activity into meaning. Build moments where players can compare perspectives, ask what changed, or notice why the outcome happened.',
      },
      {
        key: 'AC',
        name: 'Abstract Conceptualization',
        short: 'Players form a principle, rule, theory, tactic, or lesson from the experience.',
        detail: 'Conceptualization gives the experience a portable idea. This can be an explicit debrief insight or an in-world realization that changes how players understand the problem.',
      },
      {
        key: 'AE',
        name: 'Active Experimentation',
        short: 'Players test the new idea in the next situation and see whether it works.',
        detail: 'Experimentation closes the loop by turning learning into action. The next challenge should let players apply, revise, or stress-test what they believe they learned.',
      },
    ],
  },
  humanValues: {
    id: 'humanValues',
    label: 'Human Values',
    title: 'Human Values',
    color: '#68D7C0',
    icon: 'heart',
    layout: 'values',
    blurb: 'A reference map of emotional value poles that reliably pull human attention and feeling.',
    summary: 'Value tensions such as belonging, safety, status, freedom, love, skill, wealth, health, and survival.',
    phases: [
      {
        key: 'Together',
        name: 'Alone',
        short: 'Belonging, loyalty, exclusion, abandonment, and the need to not face the world alone.',
        detail: 'Together versus alone is one of the strongest social values. Use it when a scene is about being accepted, isolated, rescued, exiled, or choosing the group over the self.',
      },
      {
        key: 'Safety',
        name: 'Danger',
        short: 'Protection, threat, risk, fear, shelter, alarms, and exposed choices.',
        detail: 'Safety versus danger makes players care because the body reacts before the intellect does. It is useful for tension, relief, rescue, caution, and escalating stakes.',
      },
      {
        key: 'Victory',
        name: 'Defeat',
        short: 'Winning, failing, proving oneself, humiliation, comeback, and final outcome.',
        detail: 'Victory versus defeat gives a task emotional direction. It can be literal score, but it can also be pride, mission success, public failure, or a meaningful loss.',
      },
      {
        key: 'High status',
        name: 'Low status',
        short: 'Respect, command, shame, rank, recognition, social power, and loss of face.',
        detail: 'Status shifts are emotionally hot. A player may care deeply when an NPC honors them, doubts them, promotes them, humiliates them, or treats them as invisible.',
      },
      {
        key: 'Free',
        name: 'Slavery',
        short: 'Choice, escape, control, captivity, coercion, debt, and being owned by a system.',
        detail: 'Free versus slavery frames whether characters can choose their own path. It works for locked spaces, blackmail, contracts, mind control, debt, and rebellion.',
      },
      {
        key: 'Wealthy',
        name: 'Poor',
        short: 'Resources, scarcity, comfort, desperation, reward, greed, and survival pressure.',
        detail: 'Wealthy versus poor can mean money, supplies, influence, information, time, or equipment. It makes resources feel meaningful instead of abstract.',
      },
      {
        key: 'Life',
        name: 'Death',
        short: 'Survival, sacrifice, grief, urgency, rescue, mortality, and irreversible stakes.',
        detail: 'Life versus death creates immediate gravity. Use carefully in live games, especially when the tone should stay adventurous rather than traumatic.',
      },
      {
        key: 'Skilled',
        name: 'Unskilled',
        short: 'Mastery, competence, embarrassment, training, talent, and earning capability.',
        detail: 'Skilled versus unskilled lets players feel growth. It is useful when a task reveals who is capable, who needs help, and who becomes better through play.',
      },
      {
        key: 'Healthy',
        name: 'Sick',
        short: 'Strength, weakness, contamination, injury, recovery, endurance, and vulnerability.',
        detail: 'Health versus sickness can be physical, emotional, or social. It adds feeling to fatigue, poison, healing, infection, breakdown, or restoration.',
      },
      {
        key: 'Love',
        name: 'Ambivalence / Hatred',
        short: 'Attachment, indifference, rejection, rivalry, affection, betrayal, and emotional allegiance.',
        detail: 'Love through ambivalence to hatred gives relationship scenes their emotional temperature. It is useful for NPC bonds, faction attitudes, loyalty tests, and betrayals.',
      },
      {
        key: 'Friend',
        name: 'Stranger / Enemy',
        short: 'Trust, unfamiliarity, suspicion, hostility, alliance, recognition, and threat.',
        detail: 'Friend through stranger to enemy makes social meaning legible. It helps designers decide whether a person or faction should feel safe, unknown, or opposed.',
      },
    ],
  },
  haidtMoralConflicts: {
    id: 'haidtMoralConflicts',
    label: 'Haidt Moral Conflicts',
    title: 'Haidt Moral Conflicts',
    color: '#E86AA0',
    icon: 'alert',
    layout: 'values',
    blurb: 'A reference framework for six basic moral tensions adapted from Jonathan Haidt.',
    summary: 'Care, fairness, liberty, authority, loyalty, and purity conflicts as story-design pressure points.',
    phases: [
      {
        key: 'Care',
        name: 'Harm',
        short: 'Compassion, protection, injury, cruelty, rescue, and the duty to prevent suffering.',
        detail: 'Care versus harm asks who is being hurt and who is responsible for protection. It is useful when a choice turns on mercy, neglect, sacrifice, or the cost of keeping someone safe.',
      },
      {
        key: 'Fairness',
        name: 'Cheating',
        short: 'Justice, reciprocity, earned reward, exploitation, rigged rules, and broken bargains.',
        detail: 'Fairness versus cheating makes players notice whether the game world is treating people honestly. It works well for disputed rewards, corrupt systems, hidden advantages, and promises that may be broken.',
      },
      {
        key: 'Liberty',
        name: 'Oppression',
        short: 'Freedom, coercion, control, resistance, domination, and the right to choose.',
        detail: 'Liberty versus oppression frames a conflict around agency. Use it when players must decide whether to obey, rebel, free someone, or accept limits for a larger purpose.',
      },
      {
        key: 'Authority',
        name: 'Subversion',
        short: 'Order, rank, tradition, leadership, rebellion, disrespect, and undermined command.',
        detail: 'Authority versus subversion asks whether hierarchy is legitimate or corrupt. It can make orders, rituals, chain of command, and acts of defiance feel morally charged.',
      },
      {
        key: 'Loyalty',
        name: 'Betrayal',
        short: 'Alliance, belonging, duty to the group, treason, abandonment, and divided allegiance.',
        detail: 'Loyalty versus betrayal turns relationships into stakes. It is strongest when players must choose between factions, teams, promises, personal bonds, or the mission.',
      },
      {
        key: 'Purity',
        name: 'Filth',
        short: 'Sanctity, contamination, taboo, corruption, disgust, cleansing, and protected boundaries.',
        detail: 'Purity versus filth is about what a culture treats as sacred or polluted. Use it carefully for taboos, cursed objects, forbidden places, moral corruption, or ritual cleansing.',
      },
    ],
  },
  descentAndRecovery: {
    id: 'descentAndRecovery',
    label: 'Descent and Recovery Arc',
    title: 'Descent and Recovery Arc',
    color: '#F08C6A',
    icon: 'swap',
    layout: 'storyArc',
    blurb: 'A five-stage story arc that turns disruption and crisis into learning, recovery, and lasting growth.',
    summary: 'Move from unrealized potential through a trigger and crisis, then climb toward recovery and a wiser new normal.',
    phases: [
      {
        key: '1',
        name: 'Comfort Zone',
        short: 'Life is not bad, but something is missing and some potential remains unused.',
        detail: 'Establish a stable starting point that feels incomplete rather than disastrous. The character or group has room to grow, even if they do not yet recognize it.',
      },
      {
        key: '2',
        name: 'Trigger',
        short: 'A setback knocks the character down through misfortune, inattention, or an avoidable mistake.',
        detail: 'Introduce the disruption that breaks the old balance. The trigger should create a problem that cannot be solved simply by returning to the comfort zone.',
      },
      {
        key: '3',
        name: 'Crisis',
        short: 'At the lowest point, the character discovers or learns something valuable in the dark.',
        detail: 'The crisis is both danger and opportunity. Place the insight, resource, relationship, or truth needed for change inside the difficult experience itself.',
      },
      {
        key: '4',
        name: 'Recovery',
        short: 'The character applies what was learned and begins climbing back toward stability.',
        detail: 'Make growth visible through action. Recovery should test whether the new knowledge can be used effectively rather than merely understood in theory.',
      },
      {
        key: '5',
        name: 'Better Place',
        short: 'The character reaches a wiser and more resilient new normal.',
        detail: 'End with meaningful improvement rather than a simple reset. The character is better prepared and less likely to be defeated by the same kind of challenge again.',
      },
    ],
  },
  homeVoyageReturn: {
    id: 'homeVoyageReturn',
    label: 'Home, Voyage, Return',
    title: 'Home, Voyage, Return Story Circle',
    color: '#78C6A3',
    icon: 'swap',
    layout: 'storyCircle8',
    blurb: 'An eight-stage story circle that carries a hero from an incomplete home through chaos and back home transformed.',
    summary: 'Begin in safe but limited order, cross into an unfamiliar voyage, pay for what is gained, and return able to improve home.',
    phases: [
      {
        key: '1',
        name: 'Comfort Zone',
        short: 'Home is safe and familiar, but it is dull, incomplete, or wasting potential.',
        detail: 'Ask how Home is less than it could be, why the hero feels anxious for adventure, what they want, and what unfamiliar world waits beyond their present life.',
      },
      {
        key: '2',
        name: 'Need or Desire',
        short: 'The hero recognizes a want, lack, problem, or possibility that makes remaining at Home insufficient.',
        detail: 'Give the hero a concrete pull toward change. The need may be practical, social, emotional, or psychological, but it should make the familiar world feel too small.',
      },
      {
        key: '3',
        name: 'Unfamiliar Situation',
        short: 'The hero enters a strange new world through a deliberate choice, force, or accident.',
        detail: 'Clarify how the journey begins, what dangers and opportunities define the new environment, and how strongly the hero still feels the pull of Home.',
      },
      {
        key: '4',
        name: 'Adaptation',
        short: 'The hero learns the rules, skills, relationships, and perspective needed to function in the new world.',
        detail: 'The voyage should teach something Home could not. Let attempts, mistakes, allies, opposition, and discovery reshape how the hero approaches the central problem.',
      },
      {
        key: '5',
        name: 'Get What They Want',
        short: 'The hero reaches the apparent goal or obtains the thing that originally motivated the voyage.',
        detail: 'Deliver meaningful success, but do not treat acquisition as the end. What the hero gains should expose a deeper cost, responsibility, or truth.',
      },
      {
        key: '6',
        name: 'Pay a Price',
        short: 'The desired gain carries a sacrifice, consequence, reversal, or difficult recognition.',
        detail: 'Make the price proportionate to the value of the goal. It can be material, relational, moral, physical, social, or a surrender of the hero\'s former identity.',
      },
      {
        key: '7',
        name: 'Return to Comfort',
        short: 'The hero returns to the old world, bringing the voyage and its consequences back into familiar life.',
        detail: 'Ask how the hero changed during the voyage and how Home now looks different. The return should test whether the transformation survives outside the strange world.',
      },
      {
        key: '8',
        name: 'Having Changed',
        short: 'The hero completes the circle wiser, altered, and capable of making Home better.',
        detail: 'Show the difference through action. The final state should answer how the hero will improve Home and why they can no longer live exactly as they did before.',
      },
    ],
  },
  storyBuildingSystem: {
    id: 'storyBuildingSystem',
    label: 'Story Building System',
    title: 'Story Building System',
    color: '#FF8F63',
    icon: 'layers',
    layout: 'decisionPath',
    blurb: 'A diagnostic sequence for finding what a story needs next, from its central idea through delivery and combined tactics.',
    summary: 'Ask seven practical questions to identify the missing story-building discipline, then combine the useful answers into a working recipe.',
    phases: [
      {
        key: '1',
        name: 'Concept',
        question: 'Do you know why you need a story?',
        short: 'Define the central idea and the change in perspective the story should create.',
        detail: 'Stories shape how people understand themselves and the world around them. Frame the work as an adventure with a clear reason for being told.',
      },
      {
        key: '2',
        name: 'Explore',
        question: 'Do you know where to find your story?',
        short: 'Map the unfamiliar situation, uncertainty, and discoveries that give the story movement.',
        detail: 'Stories help people navigate confusing and changing situations. Explore the territory ahead and identify the route, obstacles, and discoveries worth following.',
      },
      {
        key: '3',
        name: 'Character',
        question: 'Do you know your role in the story?',
        short: 'Choose whose experience carries the story and why the audience should trust or care about them.',
        detail: 'Stories connect people through recognizable motives and relationships. Clarify who acts, what role they play, and why others should place trust in them.',
      },
      {
        key: '4',
        name: 'Function',
        question: 'Do you know what your story needs to do?',
        short: 'State the practical effect the story should have on understanding, feeling, or action.',
        detail: 'A story should perform a useful job rather than merely present information. Decide whether it must persuade, teach, warn, unite, motivate, or help people choose.',
      },
      {
        key: '5',
        name: 'Structure',
        question: 'Do you know how to plan your story?',
        short: 'Select a pattern that gives events a clear sequence, rhythm, and direction.',
        detail: 'A few durable patterns can carry an audience through complex material. Arrange the important moments so ideas build naturally and the progression feels story-shaped.',
      },
      {
        key: '6',
        name: 'Style',
        question: 'Do you know how to tell your story?',
        short: 'Choose the voice, imagery, tone, and emphasis that will make the story memorable.',
        detail: 'Style helps useful information stay with the audience. Match the telling to the people, setting, and emotion without allowing decoration to obscure the central idea.',
      },
      {
        key: '7',
        name: 'Organise',
        question: 'Do you know how to share your story?',
        short: 'Plan where, when, and how the story will reach people and support its intended use.',
        detail: 'Even a strong story needs deliberate delivery. Decide who should encounter it, in what form, at which moment, and how it fits the larger experience.',
      },
      {
        key: '8',
        name: 'Recipe',
        question: 'Which story tactics solve this problem together?',
        short: 'Combine the most useful decisions from the earlier stages into one reusable approach.',
        detail: 'Stories can change how people understand and act. Assemble the concept, exploration, character, function, structure, style, and organisation choices that best serve this specific problem.',
      },
    ],
  },
  jungianMasculineArchetypes: {
    id: 'jungianMasculineArchetypes',
    label: 'Jungian Masculine Archetypes',
    title: 'Jungian Masculine Archetypes',
    color: '#CFA56A',
    icon: 'layers',
    layout: 'archetypes',
    blurb: 'A reference framework for King, Warrior, Magician, and Lover archetypes with immature roots and shadow distortions.',
    summary: 'Four mature masculine archetypes mapped between fullness and immature/shadow expressions: King, Warrior, Magician, and Lover.',
    phases: [
      {
        key: 'King',
        name: 'Divine Child',
        adultActiveShadow: 'Tyrant',
        adultPassiveShadow: 'Weakling',
        childActiveShadow: 'High Chair Tyrant',
        childPassiveShadow: 'Weakling Prince',
        short: 'Fullness: generative order, blessing, steadiness, and rightful responsibility.',
        detail: 'The King in fullness creates order and gives life to the group. Its mature active shadow is the Tyrant; its mature passive shadow is the Weakling. Its immature root is the Divine Child, split between the High Chair Tyrant and the Weakling Prince.',
      },
      {
        key: 'Warrior',
        name: 'Hero',
        adultActiveShadow: 'Sadist',
        adultPassiveShadow: 'Masochist',
        childActiveShadow: 'Grandstander Bully',
        childPassiveShadow: 'Coward',
        short: 'Fullness: discipline, courage, endurance, boundaries, and clean decisive action.',
        detail: 'The Warrior in fullness acts with purpose and restraint. Its mature active shadow is the Sadist; its mature passive shadow is the Masochist. Its immature root is the Hero, split between the Grandstander Bully and the Coward.',
      },
      {
        key: 'Magician',
        name: 'Precocious Child',
        adultActiveShadow: 'Detached Manipulator',
        adultPassiveShadow: 'Denying Innocent One',
        childActiveShadow: 'Know-it-all Trickster',
        childPassiveShadow: 'Dummy',
        short: 'Fullness: insight, craft, hidden knowledge, initiation, and careful transformation.',
        detail: 'The Magician in fullness understands systems and reveals what others cannot yet see. Its mature active shadow is the Detached Manipulator; its mature passive shadow is the Denying Innocent One. Its immature root is the Precocious Child, split between the Know-it-all Trickster and the Dummy.',
      },
      {
        key: 'Lover',
        name: 'Oedipal Child',
        adultActiveShadow: 'Addicted Lover',
        adultPassiveShadow: 'Impotent Lover',
        childActiveShadow: "Momma's Boy",
        childPassiveShadow: 'Dreamer',
        short: 'Fullness: aliveness, empathy, sensuality, connection, beauty, and deep attachment.',
        detail: 'The Lover in fullness feels, bonds, values, and responds to the world with vivid presence. Its mature active shadow is the Addicted Lover; its mature passive shadow is the Impotent Lover. Its immature root is the Oedipal Child, split between Momma\'s Boy and the Dreamer.',
      },
    ],
  },
};

// Additional Nodes: all five behave identically (collapsed card → Expand shows
// the grouped internal map on the canvas; Edit opens a dedicated viewport).
export const ADDITIONAL_NODE_TYPES = {
  storyConcept: { id: 'storyConcept', label: 'Story Concept', color: '#E8D25C', icon: 'book' },
  characterConcept: { id: 'characterConcept', label: 'Character Concept', color: '#E5B94E', icon: 'user' },
  functionConcept: { id: 'functionConcept', label: 'Function', color: '#D9A23C', icon: 'cog' },
  structureConcept: { id: 'structureConcept', label: 'Structure Concept', color: '#C98F2E', icon: 'layers' },
  styleConcept: { id: 'styleConcept', label: 'Style Concept', color: '#E8C97E', icon: 'heart' },
};

// Graduated outcomes replace binary success/failure everywhere.
export const GRADUATED_OUTCOMES = [
  { id: 'yes-and', label: 'Yes, and…' },
  { id: 'yes', label: 'Yes' },
  { id: 'yes-but', label: 'Yes, but…' },
  { id: 'no-but', label: 'No, but…' },
  { id: 'no', label: 'No' },
  { id: 'no-and', label: 'No, and…' },
];

export const LOCATION_ARCHETYPES = [
  'Dangerous Place', 'Place to Get Lost In', 'Good Place to Defend', 'Transient Location',
  'Place of Power', 'Safe Haven', 'Contested Ground', 'Forgotten Place',
];

// Subnodes: rose/magenta family, pill-ish cards, smaller than base nodes.
//   attachesTo — node kinds a subnode may parent to ('*' = any node)
//   childOf    — subnode kinds (or 'branch') this child-only subnode attaches to
export const SUBNODE_TYPES = {
  outcomeBranches: { id: 'outcomeBranches', label: 'Outcome Branches', color: '#F08CB4', icon: 'swap', attachesTo: ['event', 'quest'], blurb: 'The branching engine: 2–5 pre-authored outcome paths.' },
  relChange: { id: 'relChange', label: 'Relationship / Status Change', color: '#E86AA0', icon: 'heart', attachesTo: ['*'], blurb: 'Loyalty, rivalry, reputation, faction standing — and what it triggers.' },
  internalState: { id: 'internalState', label: 'Internal State', color: '#C77BE8', icon: 'alert', attachesTo: ['*'], blurb: 'A character’s emotional or physical condition, as a path trigger.' },
  locationArchetype: { id: 'locationArchetype', label: 'Location Archetype', color: '#E88FD2', icon: 'pin', attachesTo: ['storyLocation'], blurb: 'Gives a location personality that flavors attached events and quests.' },
  narrativeResponse: { id: 'narrativeResponse', label: 'Narrative Response', color: '#F0A8C8', icon: 'book', childOf: ['relChange', 'internalState', 'branch'], blurb: 'Rich-text story consequence.' },
  emotionalTone: { id: 'emotionalTone', label: 'Emotional Tone', color: '#F5C2DC', icon: 'zap', childOf: ['relChange', 'internalState', 'branch'], blurb: 'Light flavor tags: Cold Fury, Quiet Hope, Lingering Distrust…' },
  comment: { id: 'comment', label: 'Comment', color: '#E8D25C', icon: 'book', attachesTo: ['*'], category: 'supporting', blurb: 'Designer note or explanation attached to the narrative graph.' },
  characterState: { id: 'characterState', label: 'Character State', color: '#F08CB4', icon: 'user', attachesTo: ['character', 'event', 'quest'], category: 'supporting', blurb: 'Pre-programmed character/NPC state for dialogue trees and AI agent behavior.' },
  value: { id: 'value', label: 'Value', color: '#E8D25C', icon: 'pin', attachesTo: ['*'], blurb: 'Defines numeric or tradable value of an item or resource.' },
  lifespan: { id: 'lifespan', label: 'Lifespan', color: '#43BF87', icon: 'clock', attachesTo: ['*'], blurb: 'Defines how long this item or resource persists across tasks or sessions.' },
  spendUseRule: { id: 'spendUseRule', label: 'Spend / Use Rule', color: '#E0A23C', icon: 'swap', attachesTo: ['*'], blurb: 'Defines how this item or resource can be spent, used, or consumed.' },
};
SUBNODE_TYPES.outcomeBranches.blurb = 'Defines meaningfully different narrative outcomes from one event or choice.';

// Fresh subnode factory. Every subnode shares the common shell (position,
// parentRef, notes/keywords, history) plus kind-specific fields.
export const SUBNODE_BLANK = (id, kind) => {
  const common = { id, kind, title: SUBNODE_TYPES[kind]?.label ?? kind, x: 80, y: 80, parentRef: null, notes: '', keywords: [], history: [] };
  switch (kind) {
    case 'outcomeBranches':
      return { ...common, mode: 'choice', selectionType: 'single', branches: [
        { label: 'Branch A', outcome: '', mechanicId: null },
        { label: 'Branch B', outcome: '', mechanicId: null },
      ] };
    case 'relChange':
      return { ...common, relType: '', targets: '', direction: 'yes', intensity: '', trigger: '', effects: '', mechanicId: null };
    case 'internalState':
      return { ...common, stateType: '', level: '', trigger: '', effects: '', mechanicId: null };
    case 'locationArchetype':
      return { ...common, archetype: LOCATION_ARCHETYPES[0], influence: '' };
    case 'narrativeResponse':
      return { ...common, text: '' };
    case 'emotionalTone':
      return { ...common, tags: [] };
    case 'comment':
      return { ...common, notes: '' };
    case 'characterState':
      return { ...common, emotionalState: 'Neutral', behavioralNotes: '', effects: '' };
    case 'value':
      return {
        ...common,
        purpose: 'Defines numeric or tradable value of an item or resource.',
        initialValue: '',
        currentValue: '',
        maxValue: '',
      };
    case 'lifespan':
      return {
        ...common,
        purpose: 'Defines how long this item or resource persists across tasks or sessions.',
        lifespanType: 'Task only',
        description: '',
      };
    case 'spendUseRule':
      return {
        ...common,
        purpose: 'Defines how this item or resource can be spent, used, or consumed.',
        usageRules: '',
        limitations: '',
      };
    default:
      return common;
  }
};

// The classic "Dragon & the City" questions. The library template always keeps
// this name; per-game substitutions (dragon → debt, city → home …) are stored
// only on the game instance / event node as conceptAnswers.
export const DRAGON_QUESTIONS = [
  { key: 'dragon', label: 'Who or what is the Dragon — the looming threat?' },
  { key: 'city', label: 'What is the City — the thing worth protecting?' },
  { key: 'wants', label: 'What does the Dragon want, and why now?' },
  { key: 'weakness', label: 'What is the Dragon’s weakness — or its price?' },
  { key: 'defenders', label: 'Who stands for the City, and what must they give up?' },
  { key: 'stakes', label: 'What happens to the City if the Dragon wins?' },
];

export const HERO_GUIDE_QUESTIONS = [
  { key: 'hero', label: 'Who is the Hero — whose story is this?' },
  { key: 'guide', label: 'Who is the Guide, and why do they help?' },
  { key: 'gift', label: 'What gift, lesson or tool does the Guide give?' },
  { key: 'cost', label: 'What does the Guide withhold — or what does their help cost?' },
];

// ---------------------------------------------------------------------------
// TASKS — a hierarchical node system. The surface graph tracks tasks (linear or
// branching: task 1 → task 2 → task 3 / task 4 …). Double-clicking a task opens
// its own nested detail graph, built from these typed detail nodes: where to
// stand, how many tries, props, powers, effects. Two levels deep.
// ---------------------------------------------------------------------------
export const TASK_DETAIL_TYPES = {
  placement: { id: 'placement', label: 'Placement', color: '#43BF87', icon: 'pin', blurb: 'Where players and props stand or go.' },
  rule: { id: 'rule', label: 'Rule', color: '#E0A23C', icon: 'cog', blurb: 'How it works — tries, sizes, timings, win / lose.' },
  prop: { id: 'prop', label: 'Prop / kit', color: '#3EC6D6', icon: 'swap', blurb: 'The physical equipment this task needs.' },
  power: { id: 'power', label: 'Power', color: '#A87BF0', icon: 'zap', blurb: 'A special ability a team may use here.' },
  effect: { id: 'effect', label: 'Effect', color: '#F08CB4', icon: 'alert', blurb: 'Lights, sound, or staged special effects.' },
};
export const TASK_DETAIL_KINDS = Object.keys(TASK_DETAIL_TYPES);

export const MECHANIC_SUBNODE_TYPES = {
  progressiveFeedback: {
    id: 'progressiveFeedback', label: 'Progressive Feedback Mod', color: '#58C7A6', icon: 'zap',
    purpose: 'Forces the designer to define how success in one part of the task makes the next part easier or more obvious. Creates a positive feedback loop so players feel progress.',
    attachesTo: ['cooperation', 'taskTemplate'], category: 'gameplayModifiers',
    fields: [
      { key: 'feedbackType', label: 'Feedback Type', type: 'multiselect', required: true, options: ['Visual cue', 'Audio cue', 'Physical unlock', 'Information reveal', 'Reduced difficulty', 'Time bonus'] },
      { key: 'triggerCondition', label: 'Trigger Condition', type: 'text', required: true },
      { key: 'effectDescription', label: 'Effect Description', type: 'textarea', required: true },
      { key: 'strengthIntensity', label: 'Strength / Intensity', type: 'select', options: ['Subtle', 'Moderate', 'Strong', 'Dramatic'] },
      { key: 'canStack', label: 'Can Stack', type: 'checkbox' },
    ],
  },
  failSafeScaffolding: {
    id: 'failSafeScaffolding', label: 'Fail-Safe + Scaffolding Mod', color: '#E8D25C', icon: 'layers',
    purpose: 'Provides structured ways to recover from failure or near-failure. Prevents players from feeling like total failures when they were close to succeeding.',
    attachesTo: ['cooperation', 'taskTemplate'], category: 'gameplayModifiers',
    fields: [
      { key: 'hintLevelCount', label: 'Hint Levels', type: 'number', required: true },
      { key: 'hintTrigger', label: 'Hint Trigger', type: 'select', required: true, options: ['Time passed', 'Failed attempts', 'Facilitator call', 'Player request', 'Custom'] },
      { key: 'easierAlternativeEnabled', label: 'Easier Alternative Path', type: 'checkbox' },
      { key: 'easierAlternativePath', label: 'Alternative Path Notes', type: 'textarea' },
      { key: 'partialCreditRule', label: 'Partial Credit Rule', type: 'text' },
      { key: 'skipEnabled', label: 'Skip Option', type: 'checkbox' },
      { key: 'skipCondition', label: 'Skip Condition / Consequence', type: 'textarea' },
      { key: 'gracePeriodMinutes', label: 'Grace Period', type: 'number', suffix: 'minutes' },
    ],
  },
  escalatingPressure: {
    id: 'escalatingPressure', label: 'Escalating Pressure Mod', color: '#E86464', icon: 'clock',
    purpose: 'Creates growing urgency and difficulty during the task. Pressure can increase through time, physical demand, environmental changes, or other escalating factors.',
    attachesTo: ['cooperation', 'taskTemplate'], category: 'gameplayModifiers',
    fields: [
      { key: 'pressureType', label: 'Pressure Type', type: 'multiselect', required: true, options: ['Time', 'Physical demand', 'Environmental change', 'Noise/light', 'Resource drain', 'NPC pressure'] },
      { key: 'baseDurationMinutes', label: 'Base Duration', type: 'number', required: true, suffix: 'minutes' },
      { key: 'escalationTrigger', label: 'Escalation Trigger', type: 'text', required: true },
      { key: 'escalationEffect', label: 'Escalation Effect', type: 'textarea', required: true },
      { key: 'canBePaused', label: 'Can Be Paused', type: 'checkbox' },
    ],
  },
  cooperativeEthosRole: {
    id: 'cooperativeEthosRole', label: 'Cooperative Ethos / Role Mod', color: '#A87BF0', icon: 'user',
    purpose: 'Defines how cooperation should emerge in the task, either through differentiated roles or synchronized team actions, and sets the expected social tone of play.',
    attachesTo: ['cooperation', 'taskTemplate'], category: 'gameplayModifiers',
    fields: [
      { key: 'cooperationStyle', label: 'Cooperation Style', type: 'select', required: true, options: ['Differentiated roles', 'Synchronized action', 'Relay', 'Parallel tracks', 'Shared planning'] },
      { key: 'roleSuggestions', label: 'Role Suggestions', type: 'textarea' },
      { key: 'ethosTone', label: 'Ethos Tone', type: 'select', required: true, options: ['Calm trust', 'Urgent coordination', 'Playful chaos', 'Mutual support', 'Leadership rotation'] },
      { key: 'ethosToneGuidance', label: 'Ethos Tone Guidance', type: 'readonly', required: true },
      { key: 'teamDiscussionPrompt', label: 'Team Discussion Prompt', type: 'text' },
    ],
  },
  noSoloEnforcer: {
    id: 'noSoloEnforcer', label: 'No-Solo Enforcer', color: '#F08CB4', icon: 'cross',
    purpose: 'Structurally prevents a single player from completing the task alone by enforcing physical, spatial, or timing requirements.',
    attachesTo: ['cooperation', 'taskTemplate'], category: 'gameplayModifiers',
    fields: [
      { key: 'enforcementType', label: 'Enforcement Type', type: 'multiselect', required: true, options: ['Simultaneous actions', 'Physical distance', 'Different information', 'Multiple props', 'Timing split', 'Role lock'] },
      { key: 'minimumPlayers', label: 'Minimum Players', type: 'number', required: true },
    ],
  },
  arbitration: {
    id: 'arbitration', label: 'Arbitration Mod', color: '#5CA8F5', icon: 'flag',
    purpose: 'Handles situations where real-world conditions create uncertainty or variance. Provides tolerance and fallback rules.',
    attachesTo: ['cooperation', 'taskTemplate', '*'], category: 'gameplayModifiers',
    fields: [
      { key: 'varianceHandling', label: 'Variance Handling', type: 'select', required: true, options: ['Strict', 'Small tolerance', 'Generous tolerance', 'Facilitator judgment'] },
      { key: 'toleranceDescription', label: 'Tolerance Description', type: 'text' },
      { key: 'partialCreditRule', label: 'Partial Credit Rule', type: 'text' },
      { key: 'facilitatorOverride', label: 'Facilitator Override', type: 'checkbox' },
      { key: 'logging', label: 'Logging', type: 'checkbox' },
    ],
  },
  teamDiscussionPrompt: {
    id: 'teamDiscussionPrompt', label: 'Team Discussion Prompt', color: '#43BF87', icon: 'book',
    purpose: 'Allows the designer to insert a specific question or prompt that the team should discuss before, during, or after a task. This subnode is reusable across many different tasks.',
    attachesTo: ['cooperation', 'taskTemplate', '*'], reusable: true, category: 'gameplayModifiers',
    fields: [
      { key: 'discussionPrompt', label: 'Discussion Prompt', type: 'textarea', required: true },
      { key: 'whenToUse', label: 'When to Use', type: 'select', options: ['Before task', 'During task', 'After task', 'Between attempts'] },
      { key: 'facilitatorNote', label: 'Facilitator Note', type: 'text' },
    ],
  },
  facilitatorNote: {
    id: 'facilitatorNote', label: 'Facilitator Note', color: '#8B92A6', icon: 'pin',
    purpose: 'A simple, reusable note that can be attached to any task or subnode. It contains guidance for the person running the game.',
    attachesTo: ['cooperation', 'taskTemplate', '*'], reusable: true, category: 'supporting',
    fields: [
      { key: 'facilitatorGuidance', label: 'Facilitator Guidance', type: 'textarea', required: true },
    ],
  },
  triggerDelay: {
    id: 'triggerDelay', label: 'Trigger Delay', color: '#5CA8F5', icon: 'clock',
    purpose: 'Adds a delay before the sensor or actuator activates after the trigger condition is met.',
    attachesTo: ['sensorNode', 'actuatorNode', '*'], reusable: true, category: 'gameplayModifiers',
    fields: [
      { key: 'purpose', label: 'Purpose', type: 'readonly', required: true },
      { key: 'delayDuration', label: 'Delay Duration', type: 'text', required: true },
      { key: 'delayType', label: 'Delay Type', type: 'select', options: ['Fixed', 'Random', 'Variable'] },
    ],
  },
  frequencyControl: {
    id: 'frequencyControl', label: 'Frequency Control', color: '#E8D25C', icon: 'clock',
    purpose: 'Deprecated. Frequency limiting now lives inside Sensor and Actuator nodes.',
    attachesTo: ['sensorNode', 'actuatorNode', 'taskTemplate', '*'], reusable: true, category: 'gameplayModifiers',
    deprecated: true, hiddenFromPalette: true,
    fields: [
      { key: 'purpose', label: 'Purpose', type: 'readonly', required: true },
      { key: 'maxTriggersPerSession', label: 'Max Triggers per Session', type: 'text', required: true },
      { key: 'cooldown', label: 'Cooldown / Frequency Rule', type: 'text' },
    ],
  },
  multipleOutputLogic: {
    id: 'multipleOutputLogic', label: 'Multi-Output Resolver', color: '#A87BF0', icon: 'swap',
    purpose: 'Defines different outputs based on different input conditions.',
    attachesTo: ['sensorNode', 'actuatorNode', '*'], reusable: true, category: 'gameplayModifiers',
    fields: [
      { key: 'purpose', label: 'Purpose', type: 'readonly', required: true },
      { key: 'inputConditions', label: 'Input Conditions', type: 'textarea', required: true },
      { key: 'correspondingOutputs', label: 'Corresponding Outputs', type: 'textarea', required: true },
      { key: 'defaultOutput', label: 'Default Output', type: 'text' },
    ],
  },
  conditionalActivation: {
    id: 'conditionalActivation', label: 'Conditional Activation', color: '#E0A23C', icon: 'flag',
    purpose: 'Requires additional conditions to be met before the sensor or actuator can activate.',
    attachesTo: ['sensorNode', 'actuatorNode', '*'], reusable: true, category: 'gameplayModifiers',
    fields: [
      { key: 'purpose', label: 'Purpose', type: 'readonly', required: true },
      { key: 'requiredConditions', label: 'Required Conditions', type: 'textarea', required: true },
      { key: 'logicType', label: 'Logic Type', type: 'select', options: ['AND', 'OR'] },
    ],
  },
  value: {
    id: 'value', label: 'Value', color: '#E8D25C', icon: 'pin',
    purpose: 'Defines numeric or tradable value of an item or resource.',
    attachesTo: ['*'], reusable: true, category: 'gameplayModifiers',
    fields: [
      { key: 'purpose', label: 'Purpose', type: 'readonly', required: true },
      { key: 'initialValue', label: 'Initial Value', type: 'text' },
      { key: 'currentValue', label: 'Current Value', type: 'text' },
      { key: 'maxValue', label: 'Max Value', type: 'text' },
    ],
  },
  lifespan: {
    id: 'lifespan', label: 'Lifespan', color: '#43BF87', icon: 'clock',
    purpose: 'Defines how long this item or resource persists.',
    attachesTo: ['*'], reusable: true, category: 'gameplayModifiers',
    fields: [
      { key: 'purpose', label: 'Purpose', type: 'readonly', required: true },
      { key: 'lifespanType', label: 'Lifespan Type', type: 'select', required: true, options: ['Task only', 'Full session/game', 'Permanent', 'Custom'] },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  spendUseRule: {
    id: 'spendUseRule', label: 'Spend / Use Rule', color: '#E0A23C', icon: 'swap',
    purpose: 'Defines how this item or resource can be spent or used.',
    attachesTo: ['*'], reusable: true, category: 'gameplayModifiers',
    fields: [
      { key: 'purpose', label: 'Purpose', type: 'readonly', required: true },
      { key: 'usageRules', label: 'Usage Rules', type: 'textarea', required: true },
      { key: 'limitations', label: 'Limitations', type: 'textarea' },
    ],
  },
  spectrumOfYesOutcomes: {
    id: 'spectrumOfYesOutcomes', label: 'Spectrum of Yes Outcomes', color: '#8B7BF5', icon: 'layers',
    purpose: 'Defines the graduated outcome levels for the task, from best to worst.',
    attachesTo: ['cooperation', 'taskTemplate', '*'], reusable: true, category: 'gameplayModifiers',
    fields: [
      { key: 'purpose', label: 'Purpose', type: 'readonly', required: true },
      { key: 'outcomeLevels', label: 'Outcome Levels', type: 'textarea', required: true },
      { key: 'yesAndDescription', label: 'Yes and', type: 'textarea' },
      { key: 'yesDescription', label: 'Yes', type: 'textarea' },
      { key: 'yesButDescription', label: 'Yes but', type: 'textarea' },
      { key: 'noButDescription', label: 'No but', type: 'textarea' },
      { key: 'noDescription', label: 'No', type: 'textarea' },
      { key: 'noAndDescription', label: 'No and', type: 'textarea' },
      { key: 'defaultSelection', label: 'Default Selection', type: 'multiselect', options: ['Yes and', 'Yes', 'Yes but', 'No but', 'No', 'No and'] },
    ],
  },
  readinessStatus: {
    id: 'readinessStatus', label: 'Readiness Status', color: '#6FD9A7', icon: 'flag',
    purpose: 'Shows the current development or readiness state of the attached element.',
    attachesTo: ['*'], reusable: true, category: 'supporting',
    fields: [
      { key: 'purpose', label: 'Purpose', type: 'readonly', required: true },
      { key: 'status', label: 'Status', type: 'select', required: true, options: ['Draft', 'In Progress', 'Ready for Testing', 'Ready', 'Retired'] },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  player: {
    id: 'player', label: 'Player', color: '#5CA8F5', icon: 'user',
    purpose: 'Selects one or more players from the game player database.',
    attachesTo: ['*'], reusable: true, category: 'supporting',
    fields: [
      { key: 'playerIds', label: 'Players', type: 'playerRefs' },
    ],
  },
  team: {
    id: 'team', label: 'Team', color: '#E0A23C', icon: 'layers',
    purpose: 'Selects one or more teams from the game team database.',
    attachesTo: ['*'], reusable: true, category: 'supporting',
    fields: [
      { key: 'teamIds', label: 'Teams', type: 'teamRefs' },
    ],
  },
  comment: {
    id: 'comment', label: 'Comment', color: '#E8D25C', icon: 'book',
    purpose: 'Freeform comment or designer note attached to any element.',
    attachesTo: ['*'], reusable: true, category: 'supporting',
    fields: [
      { key: 'purpose', label: 'Purpose', type: 'readonly', required: true },
      { key: 'commentText', label: 'Comment Text', type: 'textarea', required: true },
      { key: 'authorDate', label: 'Author / Date', type: 'text' },
    ],
  },
  coreMechanicModifier: {
    id: 'coreMechanicModifier', label: 'Core Mechanic Modifier', color: '#E0A23C', icon: 'cog',
    purpose: 'Allows the designer to deliberately change one core aspect of the task to create a meaningfully different experience or difficulty level.',
    attachesTo: ['cooperation', 'taskTemplate'], category: 'gameplayModifiers',
    fields: [
      { key: 'variationCategory', label: 'Variation Category', type: 'select', required: true, options: ['Timing', 'Space', 'Body limit', 'Information', 'Props', 'Sensors', 'Resources', 'Difficulty'] },
      { key: 'variationDescription', label: 'Variation Description', type: 'textarea', required: true },
      { key: 'canBeCombined', label: 'Can Be Combined', type: 'checkbox' },
    ],
  },
  actionTypePattern: {
    id: 'actionTypePattern', label: 'Action Type Pattern', color: '#58C7A6', icon: 'cog',
    description: 'Choose a human-readable action pattern, then define its advantages, effects, and variations. Saved values can be recalled whenever that mechanism is selected again.',
    attachesTo: ['action', 'actionSequence', 'cooperation', 'taskTemplate', '*'], reusable: true, category: 'gameplayModifiers',
    fields: [],
  },
};

export const MECHANIC_SUBNODE_KINDS = Object.keys(MECHANIC_SUBNODE_TYPES);

// Blank factories for the Library's "+ New …" buttons and id prefixes.
export const LIB_PREFIX = {
  items: 'LIB-ITM-', locations: 'LIB-LOC-', mechanics: 'LIB-MECH-N', sensors: 'LIB-SEN-N',
  narrative: 'LIB-NAR-', mechPrimitives: 'LIB-MPRIM-', mechSubnodes: 'LIB-MSUB-', mechanicRestrictionTypes: 'RST-', mechanicInteractionTypes: 'PIT-', mechanicSensorTypes: 'SNT-', mechanicActuatorTypes: 'ACT-', stories: 'LIB-STORY-N',
  mechanicCharacterEmotionTypes: 'CEM-', mechanicSequenceModes: 'SQM-', actionPatternMechanisms: 'APM-', actionProbabilityMechanisms: 'APR-', mechStructures: 'LIB-MSTRUCT-N', gmRules: 'LIB-GMR-', concepts: 'LIB-CPT-N',
};

const mechanicSubnodeFieldDefault = (field) => {
  if (field.type === 'checkbox') return false;
  if (field.type === 'number') return field.required ? 1 : 0;
  if (field.type === 'multiselect' || field.type === 'playerRefs' || field.type === 'teamRefs') return [];
  if (field.type === 'select') return field.options?.[0] || '';
  if (field.type === 'readonly') return '';
  return '';
};

export const MECHANIC_SUBNODE_BLANK = (id, kind = 'progressiveFeedback') => {
  const t = MECHANIC_SUBNODE_TYPES[kind] || MECHANIC_SUBNODE_TYPES.progressiveFeedback;
  let fields = Object.fromEntries((t.fields || []).map((field) => [
    field.key,
    field.type === 'readonly' && field.key === 'purpose' ? t.purpose
      : t.id === 'spectrumOfYesOutcomes' && field.key === 'outcomeLevels' ? 'Yes and\nYes\nYes but\nNo but\nNo\nNo and'
        : t.id === 'spectrumOfYesOutcomes' && field.key === 'defaultSelection' ? ['Yes and', 'Yes', 'Yes but', 'No but', 'No', 'No and']
          : mechanicSubnodeFieldDefault(field),
  ]));
  if (t.id === 'actionTypePattern') {
    fields = {
      tokenMechanismId: '',
      orderMechanismId: '',
      specialMechanismId: '',
      activeMechanismId: '',
    };
  }
  return {
    id,
    kind: t.id,
    name: t.label,
    purpose: t.purpose,
    description: t.description || t.purpose || '',
    color: t.color,
    icon: t.icon,
    category: t.category || 'gameplayModifiers',
    reusable: !!t.reusable,
    deprecated: !!t.deprecated,
    hiddenFromPalette: !!t.hiddenFromPalette,
    attachesTo: t.attachesTo || ['*'],
    collapseDepth: 0,
    fields,
  };
};

export const LIB_BLANK = {
  items: (id) => ({ id, name: 'New item template', type: 'gadget', description: '', propNotes: '', loreNotes: '', origin: '', persistsAcrossTasks: false, mechanicIds: [], sensorReqs: [], image: null }),
  locations: (id) => ({ id, name: 'New location template', notes: '', safety: '', image: null }),
  mechanics: (id) => ({ id, name: 'New mechanic', summary: '', params: [] }),
  sensors: (id) => ({ id, kind: 'New sensor type', label: '' }),
  // Reusable node templates saved from the new Node Builder.
  narrative: (id) => ({ id, nodeClass: 'base', nodeKind: 'event', name: 'New event template', category: 'event', color: '#5CA8F5', icon: 'zap', body: '', tags: [], inputs: ['in'], outputs: ['out'] }),
  // Mechanic node type (sensor/physical/task) for the Game Mechanics node tree.
  mechPrimitives: (id) => ({ id, name: 'New mechanic node', mechKind: 'cooperation', baseKind: 'mechanic', color: '#A87BF0', icon: 'users', inputs: ['in'], outputs: ['out'], defaultBody: '', estMinutes: 5, crew: 0, refs: {}, collapseDepth: 0, oldNode: false }),
  mechSubnodes: (id) => ({ ...MECHANIC_SUBNODE_BLANK(id), oldNode: false }),
  mechanicRestrictionTypes: (id) => ({ id, label: 'Custom restriction', custom: true }),
  mechanicInteractionTypes: (id) => ({ id, label: 'Custom interaction', custom: true }),
  mechanicSensorTypes: (id) => ({ id, label: 'Custom sensor', custom: true }),
  mechanicActuatorTypes: (id) => ({ id, label: 'Custom actuator', custom: true }),
  mechanicCharacterEmotionTypes: (id) => ({ id, label: 'Custom emotion', custom: true }),
  mechanicSequenceModes: (id) => ({ id, label: 'Custom', custom: true }),
  actionPatternMechanisms: (id) => ({ id, system: 'special', label: 'New mechanism', description: '', image: null, imageScale: 1, imagePositionX: 0, imagePositionY: 0, advantages: [''], effects: [''], variations: [''], custom: true }),
  actionProbabilityMechanisms: (id) => ({ id, kind: 'probability', label: 'New resolution', description: '', variations: [''], emotionalSpike: '', effects: [''], image: null, imageScale: 1, imagePositionX: 0, imagePositionY: 0, custom: true }),
  stories: (id) => ({ id, name: 'New structure', description: '', estMinutes: 15, usesBaseConcept: false, baseConceptId: null, nodes: {}, edges: [], frameworks: {}, frames: {}, numberMarkers: {}, titleMarkers: {} }),
  mechStructures: (id) => ({ id, name: 'New mechanic structure', description: '', estMinutes: 10, nodes: {}, edges: [], numberMarkers: {}, titleMarkers: {} }),
  gmRules: (id) => ({ id, title: 'New game master rule', principle: '', implementation: '', rationale: '', aiRule: '' }),
  // Additional Node ("concept") template: starts completely empty — the
  // designer builds inside it, renames it, and it becomes reusable.
  concepts: (id) => ({
    id, category: 'storyConcept', name: 'New concept', description: '',
    conceptType: 'unset', status: 'seed', onePromise: '', referenceFrameworkIds: [],
    premade: false, questions: [], example: {}, nodes: {}, edges: [], frameworks: {}, frames: {}, numberMarkers: {}, titleMarkers: {}
  }),
};

const migrateChallengeCoreNode = (node) => {
  if (!node || typeof node !== 'object') return node;
  const nestedNodes = node.sub?.nodes
    ? Object.fromEntries(Object.entries(node.sub.nodes).map(([id, child]) => [id, migrateChallengeCoreNode(child)]))
    : null;
  const withNested = nestedNodes ? { ...node, sub: { ...node.sub, nodes: nestedNodes } } : node;
  if (withNested.mechKind !== 'challengeCore' && withNested.primitiveId !== 'LIB-MPRIM-CHALLENGE-CORE') return withNested;

  const attachedSubnodeIds = [...new Set([
    ...(withNested.attachedSubnodeIds || []),
    ...(withNested.physicalTrackSubnodeIds || []),
    ...(withNested.cognitiveTrackSubnodeIds || []),
  ])];
  const legacyGoal = `${withNested.goal || ''}`.trim();
  const existingBody = `${withNested.body || ''}`.trim();
  const body = legacyGoal && !existingBody.includes(legacyGoal)
    ? [existingBody, `Goal: ${legacyGoal}`].filter(Boolean).join('\n\n')
    : existingBody;
  const title = `${withNested.title || 'Cooperation'}`.replace(/Challenge Core/gi, 'Cooperation');
  const {
    goal: _goal,
    physicalTrackSubnodeIds: _physicalTrackSubnodeIds,
    cognitiveTrackSubnodeIds: _cognitiveTrackSubnodeIds,
    noteColor: _noteColor,
    ...rest
  } = withNested;
  return {
    ...rest,
    primitiveId: 'LIB-MPRIM-COOPERATION',
    mechKind: 'cooperation',
    title,
    body,
    cooperationStyle: withNested.cooperationStyle || 'Parallel',
    attachedSubnodeIds,
  };
};

const migrateActionGraph = (graph = {}, ensureInstruction = false) => {
  const sourceNodes = graph.nodes || {};
  const nodes = {};
  const edges = [...(graph.edges || [])];
  const instructionTargets = new Set(edges
    .filter((edge) => sourceNodes[edge.from]?.mechKind === 'action' && sourceNodes[edge.to]?.mechKind === 'playerFacingInstruction')
    .map((edge) => edge.from));

  for (const [nodeId, originalNode] of Object.entries(sourceNodes)) {
    let node = migrateChallengeCoreNode(originalNode);
    if (node?.sub?.nodes) node = { ...node, sub: migrateActionGraph(node.sub) };
    if (node?.kind === 'mechanicSubnode' && ['actionEconomy', 'actionFlow', 'actionAccess', 'actionPrompt', 'physicalActionPattern'].includes(node.subnodeKind)) {
      const oldFields = node.fields || {};
      const visibleName = `${oldFields.mechanism || ''}`.replace(/^ACT-\d+\s+/i, '').trim();
      const mechanism = ACTION_MECHANISMS.find((candidate) => candidate.name.toLowerCase() === visibleName.toLowerCase());
      const mechanismId = mechanism ? actionPatternMechanismId(mechanism.name) : '';
      const system = mechanism ? actionPatternSystemForCode(mechanism.code) : 'special';
      const coreRule = oldFields.rule || '';
      const budgetLimit = oldFields.budgetOrLimit || oldFields.uses || oldFields.resolutionOrder || oldFields.promptSource || oldFields.physicalRule || oldFields.accessCondition || '';
      const availability = oldFields.availabilityRule || oldFields.participationRule || oldFields.unlockOrImprovement || oldFields.choiceOrResultRule || oldFields.interpretationRule || '';
      node = {
        ...node,
        primitiveId: 'LIB-MSUB-actionTypePattern',
        subnodeKind: 'actionTypePattern',
        title: 'Action Type Pattern',
        body: node.body || MECHANIC_SUBNODE_TYPES.actionTypePattern.description,
        color: '#58C7A6',
        icon: 'cog',
        fields: {
          tokenMechanismId: system === 'token' ? mechanismId : '',
          orderMechanismId: system === 'order' ? mechanismId : '',
          specialMechanismId: system === 'special' ? mechanismId : '',
          activeMechanismId: mechanismId,
          coreRule,
          budgetLimit,
          availability,
        },
      };
    }
    if (node?.mechKind === 'action') {
      const {
        playerInstruction: _playerInstruction,
        actionMode: _actionMode,
        completionCondition: _completionCondition,
        performer: _performer,
        numberOfPlayers: _numberOfPlayers,
        advantage: _advantage,
        effect: _effect,
        variation: _variation,
        ...rest
      } = node;
      const hasLegacyDetails = Array.isArray(node.advantages) || Array.isArray(node.effects) || Array.isArray(node.variations)
        || node.advantage != null || node.effect != null || node.variation != null;
      node = {
        ...rest,
        ...(hasLegacyDetails ? {
          advantages: Array.isArray(node.advantages) && node.advantages.length ? node.advantages : [node.advantage || ''],
          effects: Array.isArray(node.effects) && node.effects.length ? node.effects : [node.effect || ''],
          variations: Array.isArray(node.variations) && node.variations.length ? node.variations : [node.variation || ''],
        } : {}),
        tokenMechanismId: node.tokenMechanismId || '',
        orderMechanismId: node.orderMechanismId || '',
        specialMechanismId: node.specialMechanismId || '',
      };
      const instruction = `${originalNode.playerInstruction || ''}`.trim();
      if ((instruction || ensureInstruction) && !instructionTargets.has(nodeId)) {
        let instructionId = `${nodeId}-INSTRUCTION`;
        let suffix = 2;
        while (sourceNodes[instructionId] || nodes[instructionId]) instructionId = `${nodeId}-INSTRUCTION-${suffix++}`;
        nodes[instructionId] = {
          id: instructionId,
          primitiveId: 'LIB-MPRIM-PLAYER-INSTRUCTION',
          kind: 'mechanic',
          mechKind: 'playerFacingInstruction',
          title: `${node.title || 'Action'} Instruction`,
          body: instruction,
          x: Number(node.x || 0) + 320,
          y: Number(node.y || 0),
          color: '#E8D25C',
        };
        edges.push({ from: nodeId, to: instructionId, label: 'present as', color: '#E8D25C' });
      }
    }
    if (node?.mechKind === 'actionSequence') {
      const { completionCondition: _completionCondition, ...rest } = node;
      node = { ...rest, sequenceMode: 'Custom' };
    }
    if (node?.mechKind === 'playerFacingInstruction') {
      node = { ...node, category: 'supporting' };
    }
    if (node?.mechKind === 'actionProbability') {
      const {
        resolutionCategory: _resolutionCategory,
        resolutionProcedure: _resolutionProcedure,
        ...currentNode
      } = node;
      node = {
        ...currentNode,
        title: !node.title || node.title === 'Action Probability' ? 'Resolution' : node.title,
        variations: Array.isArray(node.variations) && node.variations.length ? node.variations : [''],
        emotionalSpike: node.emotionalSpike || '',
        effects: Array.isArray(node.effects) && node.effects.length ? node.effects : [''],
        imageScale: Math.min(3, Math.max(0.5, Number(node.imageScale) || 1)),
        imagePositionX: Math.min(100, Math.max(-100, Number(node.imagePositionX) || 0)),
        imagePositionY: Math.min(100, Math.max(-100, Number(node.imagePositionY) || 0)),
      };
    }
    nodes[nodeId] = node;
  }
  return { ...graph, nodes, edges };
};

// Migration: preserve user-authored library data across schema bumps.
//  - additively backfills any missing collections;
//  - v6→v7 splits the old `primitives` pool into `narrative` (story nodes) and
//    `mechPrimitives` (mechanic nodes), folds `elements` into `narrative`, and
//    renames `elementTypes` → `narrativeCategories`.
export function migrateLibrary(saved) {
  if (!saved || typeof saved !== 'object' || !saved.items) return makeLibrarySeed();
  const seed = makeLibrarySeed();
  const merged = { ...saved };
  const savedRev = Number(saved.rev || 0);

  if (saved.primitives || saved.elements || saved.elementTypes) {
    const narrative = { ...(saved.narrative || {}) };
    const mechPrimitives = { ...(saved.mechPrimitives || {}) };
    for (const p of Object.values(saved.primitives || {})) {
      if (p.baseKind === 'story') {
        narrative[p.id] = { id: p.id, name: p.name, category: 'story-beat', color: p.color, icon: p.icon || 'flag', body: p.defaultBody || '', tags: [], inputs: p.inputs || [], outputs: p.outputs || ['out'] };
      } else {
        mechPrimitives[p.id] = { ...p };
      }
    }
    const cats = saved.elementTypes || {};
    for (const el of Object.values(saved.elements || {})) {
      narrative[el.id] = { id: el.id, name: el.name, category: el.etype || 'story-beat', color: cats[el.etype]?.color || '#5CA8F5', icon: cats[el.etype]?.icon || 'flag', body: el.text || '', tags: el.tags || [], inputs: ['in'], outputs: ['out'] };
    }
    merged.narrative = narrative;
    merged.mechPrimitives = mechPrimitives;
    merged.narrativeCategories = saved.narrativeCategories
      || { ...seed.narrativeCategories, ...Object.fromEntries(Object.values(cats).map((c) => [c.id, { ...c, icon: c.icon || seed.narrativeCategories[c.id]?.icon || 'flag' }])) };
    delete merged.primitives;
    delete merged.elements;
    delete merged.elementTypes;
  }

  merged.narrative = Object.fromEntries(Object.entries(merged.narrative || {}).filter(([, n]) => n.nodeClass));
  const retiredMechKinds = new Set(['sensorActuator', 'crossTaskResource']);
  const retiredMechIds = new Set([
    'LIB-MPRIM-SENSOR-ACTUATOR',
    'LIB-MPRIM-CROSS-TASK-RESOURCE',
    'LIB-MPRIM-WAYPT',
    'LIB-MPRIM-HANDOFF',
    'LIB-MPRIM-PUZZLE',
    'LIB-MPRIM-PHYS',
    'LIB-MPRIM-TIMER',
    'LIB-MPRIM-KNOWLEDGE',
    'LIB-MPRIM-PHYSICAL-STATE',
    'LIB-MPRIM-NPC-STATE',
  ]);
  merged.mechPrimitives = Object.fromEntries(Object.entries(merged.mechPrimitives || {}).filter(([id, n]) => (
    !retiredMechIds.has(id) && !retiredMechKinds.has(n?.mechKind)
  )));
  merged.stories = Object.fromEntries(Object.entries(merged.stories || {}).filter(([id, st]) =>
    !['LIB-STORY-BETRAY', 'LIB-STORY-COLDCASE'].includes(id)
    && Object.values(st.nodes || {}).every((n) => n.kind !== 'story')));

  for (const key of Object.keys(seed)) {
    if (merged[key] === undefined) merged[key] = seed[key];
  }
  merged.itemTypes = { ...seed.itemTypes, ...(merged.itemTypes || {}) };
  merged.actionPatternMechanisms = Object.fromEntries(Object.entries({
    ...(seed.actionPatternMechanisms || {}),
    ...(merged.actionPatternMechanisms || {}),
  }).map(([id, mechanism]) => {
    const seeded = seed.actionPatternMechanisms?.[id] || {};
    return [id, {
      ...seeded,
      ...mechanism,
      kind: 'pattern',
      category: mechanism.category || seeded.category || 'Action Type Pattern',
      color: mechanism.color || seeded.color || '#58C7A6',
      icon: mechanism.icon || seeded.icon || 'cog',
      image: mechanism.image || seeded.image || null,
      imageScale: Math.min(3, Math.max(0.5, Number(mechanism.imageScale ?? seeded.imageScale) || 1)),
      imagePositionX: Math.min(100, Math.max(-100, Number(mechanism.imagePositionX ?? seeded.imagePositionX) || 0)),
      imagePositionY: Math.min(100, Math.max(-100, Number(mechanism.imagePositionY ?? seeded.imagePositionY) || 0)),
      advantages: Array.isArray(mechanism.advantages) && mechanism.advantages.length ? mechanism.advantages : [''],
      effects: Array.isArray(mechanism.effects) && mechanism.effects.length ? mechanism.effects : [''],
      variations: Array.isArray(mechanism.variations) && mechanism.variations.length ? mechanism.variations : [''],
    }];
  }));
  const seededProbabilityMechanisms = Object.fromEntries(ACTION_PROBABILITY_RESOLUTIONS.map((record) => [record.id, record]));
  merged.actionProbabilityMechanisms = Object.fromEntries(Object.entries({
    ...seededProbabilityMechanisms,
    ...(merged.actionProbabilityMechanisms || {}),
  }).map(([id, mechanism]) => {
    const seeded = seededProbabilityMechanisms[id] || {};
    const {
      resolutionProcedure: _resolutionProcedure,
      ...currentMechanism
    } = mechanism;
    return [id, {
      ...seeded,
      ...currentMechanism,
      kind: 'probability',
      category: mechanism.category || seeded.category || 'Custom',
      description: mechanism.description || seeded.description || '',
      variations: Array.isArray(mechanism.variations) && mechanism.variations.length ? mechanism.variations : [''],
      emotionalSpike: mechanism.emotionalSpike || '',
      effects: Array.isArray(mechanism.effects) && mechanism.effects.length ? mechanism.effects : [''],
      image: mechanism.image || seeded.image || null,
      imageScale: Math.min(3, Math.max(0.5, Number(mechanism.imageScale ?? seeded.imageScale) || 1)),
      imagePositionX: Math.min(100, Math.max(-100, Number(mechanism.imagePositionX ?? seeded.imagePositionX) || 0)),
      imagePositionY: Math.min(100, Math.max(-100, Number(mechanism.imagePositionY ?? seeded.imagePositionY) || 0)),
    }];
  }));
  merged.mechPrimitives = Object.fromEntries(Object.entries({ ...seed.mechPrimitives, ...(merged.mechPrimitives || {}) }).map(([id, node]) => {
    if (id === 'LIB-MPRIM-SENSOR') {
      return [id, {
        ...node,
        deprecated: true,
        hiddenFromPalette: true,
        migrationHint: 'Use Sensor Node instead. This node is deprecated. Its functionality has been merged into the Sensor node.',
        defaultBody: 'This node is deprecated. Its functionality has been merged into the Sensor node.',
      }];
    }
    if (id === 'LIB-MPRIM-PROGRESS-STATE') {
      return [id, {
        ...node,
        name: node.name || 'Progress State',
        mechKind: 'progressState',
        baseKind: 'mechanic',
        category: 'supporting',
        defaultBody: node.defaultBody || 'Visual task completion tracker: shows how many of 10 steps are complete.',
        currentProgress: node.currentProgress || 1,
        visualStyle: node.visualStyle || 'Segmented bar',
        inputs: node.inputs || ['attach'],
        outputs: node.outputs || ['progress'],
      }];
    }
    if (id === 'LIB-MPRIM-CHARACTER-STATE') {
      return [id, {
        ...node,
        deprecated: true,
        hiddenFromPalette: true,
        migrationHint: 'Character State has moved to Narrative Subnodes. Use the narrative Character State subnode for future story/dialogue behavior.',
      }];
    }
    if (node?.mechKind === 'sensorNode') {
      return [id, {
        ...node,
        inputRequired: node.inputRequired || '',
        triggerCondition: node.triggerCondition || '',
        frequencyLimitEnabled: !!node.frequencyLimitEnabled,
        frequencyTriggerCount: node.frequencyTriggerCount || 1,
        frequencyTimePeriod: node.frequencyTimePeriod || '1 minute',
        cooldownEnabled: !!node.cooldownEnabled,
        cooldownDuration: node.cooldownDuration || '30 seconds',
        manualOverrideFallback: node.manualOverrideFallback || '',
        reliability: node.reliability || '3',
      }];
    }
    if (node?.mechKind === 'actuatorNode') {
      return [id, {
        ...node,
        audioFileRef: node.audioFileRef || '',
        frequencyLimitEnabled: !!node.frequencyLimitEnabled,
        frequencyTriggerCount: node.frequencyTriggerCount || 1,
        frequencyTimePeriod: node.frequencyTimePeriod || '1 minute',
        cooldownEnabled: !!node.cooldownEnabled,
        cooldownDuration: node.cooldownDuration || '30 seconds',
        manualOverrideFallback: node.manualOverrideFallback || '',
      }];
    }
    if (node?.mechKind === 'action') {
      const {
        playerInstruction: _playerInstruction,
        actionMode: _actionMode,
        completionCondition: _completionCondition,
        performer: _performer,
        numberOfPlayers: _numberOfPlayers,
        advantage: _advantage,
        effect: _effect,
        variation: _variation,
        ...rest
      } = node;
      const hasLegacyDetails = Array.isArray(node.advantages) || Array.isArray(node.effects) || Array.isArray(node.variations)
        || node.advantage != null || node.effect != null || node.variation != null;
      return [id, {
        ...rest,
        ...(hasLegacyDetails ? {
          advantages: Array.isArray(node.advantages) && node.advantages.length ? node.advantages : [node.advantage || ''],
          effects: Array.isArray(node.effects) && node.effects.length ? node.effects : [node.effect || ''],
          variations: Array.isArray(node.variations) && node.variations.length ? node.variations : [node.variation || ''],
        } : {}),
        tokenMechanismId: node.tokenMechanismId || '',
        orderMechanismId: node.orderMechanismId || '',
        specialMechanismId: node.specialMechanismId || '',
      }];
    }
    if (node?.mechKind === 'actionSequence') {
      const { completionCondition: _completionCondition, ...rest } = node;
      return [id, { ...rest, defaultBody: 'Collapsible container for a custom sequence of actions.', sequenceMode: 'Custom' }];
    }
    if (node?.mechKind === 'playerFacingInstruction') {
      return [id, { ...node, category: 'supporting' }];
    }
    if (node?.mechKind === 'actionProbability') {
      const resolution = merged.actionProbabilityMechanisms?.[node.resolutionMechanismId]
        || Object.values(merged.actionProbabilityMechanisms || {}).find((record) => record.label === node.resolutionType)
        || actionProbabilityResolution(node.resolutionType)
        || ACTION_PROBABILITY_RESOLUTIONS[0];
      const {
        resolutionCategory: _resolutionCategory,
        resolutionProcedure: _resolutionProcedure,
        ...currentNode
      } = node;
      return [id, {
        ...currentNode,
        name: node.name === 'Action Probability' || !node.name ? 'Resolution' : node.name,
        resolutionMechanismId: node.resolutionMechanismId || resolution.id,
        resolutionType: resolution.label,
        variations: Array.isArray(node.variations) && node.variations.length ? node.variations : [...(resolution.variations || [''])],
        emotionalSpike: node.emotionalSpike || resolution.emotionalSpike || '',
        effects: Array.isArray(node.effects) && node.effects.length ? node.effects : [...(resolution.effects || [''])],
        defaultBody: node.defaultBody === 'Defines how uncertainty or competing inputs are resolved into a gameplay outcome.'
          ? resolution.description
          : (node.defaultBody || resolution.description),
        image: node.image || resolution.image,
        imageScale: Math.min(3, Math.max(0.5, Number(node.imageScale ?? resolution.imageScale) || 1)),
        imagePositionX: Math.min(100, Math.max(-100, Number(node.imagePositionX ?? resolution.imagePositionX) || 0)),
        imagePositionY: Math.min(100, Math.max(-100, Number(node.imagePositionY ?? resolution.imagePositionY) || 0)),
      }];
    }
    if (node?.mechKind !== 'physicalRestriction') return [id, {
      ...node,
      oldNode: node.oldNode ?? !CURRENT_MECHANIC_PRIMITIVE_KINDS.has(node?.mechKind),
    }];
    const sourceRefs = node.connectTo || {};
    const connectTo = { nodeIds: sourceRefs.nodeIds || [] };
    return [id, {
      ...node,
      connectTo,
      oldNode: node.oldNode ?? !CURRENT_MECHANIC_PRIMITIVE_KINDS.has(node?.mechKind),
    }];
  }));
  merged.mechPrimitives = Object.fromEntries(Object.entries(merged.mechPrimitives).map(([id, node]) => [id, {
    ...node,
    oldNode: node.oldNode ?? !CURRENT_MECHANIC_PRIMITIVE_KINDS.has(node?.mechKind),
  }]));
  const retiredActionSubnodeKinds = new Set(['actionEconomy', 'actionFlow', 'actionAccess', 'actionPrompt', 'physicalActionPattern']);
  merged.mechSubnodes = Object.fromEntries(Object.entries({ ...seed.mechSubnodes, ...(merged.mechSubnodes || {}) })
    .filter(([, sn]) => !retiredActionSubnodeKinds.has(sn.kind))
    .map(([id, sn]) => {
    const type = MECHANIC_SUBNODE_TYPES[sn.kind] || {};
    const attachesTo = [...new Set((sn.attachesTo || type.attachesTo || ['*']).map((kind) => (
      kind === 'challengeCore' ? 'cooperation' : kind
    )))];
    return [id, {
      ...sn,
      name: sn.name || type.label,
      purpose: type.purpose || sn.purpose,
      category: sn.category || type.category || 'gameplayModifiers',
      deprecated: !!type.deprecated || !!sn.deprecated,
      hiddenFromPalette: !!type.hiddenFromPalette || !!sn.hiddenFromPalette,
      oldNode: sn.oldNode ?? !CURRENT_MECHANIC_SUBNODE_KINDS.has(sn.kind),
      attachesTo,
    }];
  }));
  merged.mechStructures = Object.fromEntries(Object.entries(merged.mechStructures || {}).filter(([, st]) => (
    Object.values(st.nodes || {}).every((n) => !retiredMechIds.has(n.primitiveId))
  )));
  merged.mechStructures = Object.fromEntries(Object.entries(merged.mechStructures || {}).map(([id, st]) => {
    const normalized = {
      ...st,
      nodes: Object.fromEntries(Object.entries(st.nodes || {}).map(([nodeId, originalNode]) => {
        const node = migrateChallengeCoreNode(originalNode);
        if (node?.mechKind === 'sensorNode') {
          return [nodeId, {
            ...node,
            inputRequired: node.inputRequired || '',
            triggerCondition: node.triggerCondition || '',
            frequencyLimitEnabled: !!node.frequencyLimitEnabled,
            frequencyTriggerCount: node.frequencyTriggerCount || 1,
            frequencyTimePeriod: node.frequencyTimePeriod || '1 minute',
            cooldownEnabled: !!node.cooldownEnabled,
            cooldownDuration: node.cooldownDuration || '30 seconds',
            manualOverrideFallback: node.manualOverrideFallback || '',
            reliability: node.reliability || '3',
          }];
        }
        if (node?.mechKind === 'actuatorNode') {
          return [nodeId, {
            ...node,
            audioFileRef: node.audioFileRef || '',
            frequencyLimitEnabled: !!node.frequencyLimitEnabled,
            frequencyTriggerCount: node.frequencyTriggerCount || 1,
            frequencyTimePeriod: node.frequencyTimePeriod || '1 minute',
            cooldownEnabled: !!node.cooldownEnabled,
            cooldownDuration: node.cooldownDuration || '30 seconds',
            manualOverrideFallback: node.manualOverrideFallback || '',
          }];
        }
        return [nodeId, node];
      })),
    };
    return [id, migrateActionGraph(normalized, st.templateKind === 'action')];
  }));
  if (savedRev < 13) {
    merged.stories = { ...seed.stories, ...(merged.stories || {}) };
    merged.mechStructures = { ...seed.mechStructures, ...(merged.mechStructures || {}) };
  }
  if (savedRev < 14) {
    merged.items = {
      ...(merged.items || {}),
      'LIB-ITM-MACRODROID-PHONE': seed.items['LIB-ITM-MACRODROID-PHONE'],
    };
    merged.stories = {
      ...(merged.stories || {}),
      'LIB-STORY-TURTLE-COLLECTION': seed.stories['LIB-STORY-TURTLE-COLLECTION'],
    };
    merged.mechStructures = {
      ...(merged.mechStructures || {}),
      'LIB-MSTRUCT-TURTLE-SHELL-REACTION': seed.mechStructures['LIB-MSTRUCT-TURTLE-SHELL-REACTION'],
    };
  }
  if (savedRev < 15) {
    merged.stories = {
      ...(merged.stories || {}),
      'LIB-STORY-ITEM-NODE-GRAPH': seed.stories['LIB-STORY-ITEM-NODE-GRAPH'],
    };
  }
  if (savedRev < 16) {
    merged.gmRules = {
      ...(merged.gmRules || {}),
      'LIB-GMR-TURTLE-SHELLS': seed.gmRules['LIB-GMR-TURTLE-SHELLS'],
    };
    merged.stories = {
      ...(merged.stories || {}),
      'LIB-STORY-TURTLE-SESSION': seed.stories['LIB-STORY-TURTLE-SESSION'],
    };
    merged.mechStructures = {
      ...(merged.mechStructures || {}),
      'LIB-MSTRUCT-TURTLE-COSTUME-COLLECTION': seed.mechStructures['LIB-MSTRUCT-TURTLE-COSTUME-COLLECTION'],
    };
  }
  if (savedRev < 17) {
    const actionTemplates = Object.fromEntries(Object.entries(seed.mechStructures || {}).filter(([, template]) => template.templateKind === 'action'));
    merged.mechStructures = { ...actionTemplates, ...(merged.mechStructures || {}) };
  }
  delete merged.mechPrimitives['LIB-MPRIM-CHALLENGE-CORE'];
  merged.rev = LIB_REV;
  return merged;
}

const turtleSvg = (label, color) => ({
  kind: 'svg',
  name: `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'turtle'}-reference.svg`,
  dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160"><rect width="240" height="160" rx="18" fill="#151821"/><circle cx="64" cy="78" r="34" fill="${color}" opacity=".9"/><rect x="104" y="48" width="96" height="60" rx="14" fill="${color}" opacity=".72"/><text x="120" y="136" fill="#E9EBF3" font-family="Segoe UI,Arial" font-size="18" font-weight="700">${label}</text></svg>`)}`,
});

const mechanicSubnodeInstance = (id, subnodeKind, title, x, y, fields = {}) => {
  const type = MECHANIC_SUBNODE_TYPES[subnodeKind] || {};
  return {
    id,
    primitiveId: `LIB-MSUB-${subnodeKind}`,
    kind: 'mechanicSubnode',
    subnodeKind,
    title,
    x,
    y,
    body: type.purpose || '',
    color: type.color || '#8B92A6',
    icon: type.icon || 'pin',
    category: type.category || 'gameplayModifiers',
    attachesTo: type.attachesTo || ['*'],
    fields: {
      purpose: type.purpose || '',
      ...fields,
    },
  };
};

function makeTurtleSessionStoryStructure() {
  const items = [
    ['I-SHELL', 'Shell', 'Shell', '#43BF87', 'Wearable', 'Giant, ridiculous, unmistakably turtle shell. Bulky by design.', 'Full lore: the shell makes the wearer visible as the team anchor. It is funny first, heroic second, and mechanically meaningful because the physical version carries GPS/audio behavior.'],
    ['I-MASK', 'Mask / Headband', 'Mask', '#5CA8F5', 'Wearable', 'Color-coded headband that marks the team identity immediately.', 'Full lore: the visible identity piece. It should make team progress readable at a distance.'],
    ['I-ARM', 'Arm Sweat Catchers', 'Arms', '#E0A23C', 'Wearable', 'Absurdly serious arm bands for very unserious heroics.', 'Full lore: a small costume escalation that helps players feel the collection growing.'],
    ['I-LEG', 'Leg Sweat Catchers', 'Legs', '#A87BF0', 'Wearable', 'Leg bands that make the wearer look more committed than comfortable.', 'Full lore: visual progress and comedy through accumulation.'],
    ['I-WEAPON', 'Foam Weapon', 'Weapon', '#F08CB4', 'Artifact', 'Safe turtle-themed prop weapon; impressive in photos, harmless in play.', 'Full lore: a symbolic team prop, not a combat invitation. Keep all use theatrical and safe.'],
  ];
  const nodes = Object.fromEntries(items.map(([id, title, shortTitle, color, baseType, playerLore, completeLore], index) => [id, {
    id,
    kind: 'item',
    title,
    shortTitle,
    x: 70 + (index % 3) * 290,
    y: 360 + Math.floor(index / 3) * 170,
    body: playerLore,
    playerLore,
    completeLore,
    baseType,
    origin: 'Found, scavenged, awarded, or traded during a task zone.',
    gameplayMeaning: 'Visible team identity and progression; the completed set makes the final group assembly readable and funny.',
    persistsAcrossTasks: true,
    color,
    image: turtleSvg(shortTitle, color),
  }]));
  return {
    id: 'LIB-STORY-TURTLE-SESSION',
    name: 'Shells of the City - Turtle Session Structure',
    description: 'Narrative/master overview structure for four turtle teams collecting costume pieces, crossing paths mid-session, reacting to voice-line events, and assembling for the final photo.',
    estMinutes: 120,
    nodes: {
      MA1: {
        id: 'MA1', kind: 'masterAct', title: 'Shells of the City', x: 60, y: 70,
        body: 'Broad narrative phase: Turtle Power Rising. Four teams become visually recognizable turtles as the session escalates toward a shared final assembly.',
        phaseNotes: 'Team player dynamics: shared absurdity of the bulky shell, intra-team bonding through problem-solving, inter-team visible progression when paths cross, and light competitive humor at final assembly.',
        color: '#43BF87',
      },
      GMR1: {
        id: 'GMR1', kind: 'quest', title: 'Game Master Rules', x: 420, y: 70,
        body: 'Safety breaks fiction. Physical discomfort must stay comedic and manageable. Voice reactions should feel like the world recognizing the turtles.',
        color: '#E0A23C',
      },
      TASK0: { id: 'TASK0', kind: 'task', title: 'Main Session - Costume Collection', x: 60, y: 210, startMin: 540, durationMin: 120, marginBeforeMin: 0, marginAfterMin: 0, body: 'Overall session task: teams collect, equip, cross paths, and assemble for the group photo.', color: '#5BC0BE' },
      TASK1: { id: 'TASK1', kind: 'task', title: 'Zone 1 - First Collection', x: 340, y: 210, startMin: 550, durationMin: 30, marginBeforeMin: 0, marginAfterMin: 10, body: 'First piece collection and first reliable shell reaction.', color: '#5BC0BE' },
      TRV1: { id: 'TRV1', kind: 'travel', title: 'Travel Time - First Crossing', x: 620, y: 250, startMin: 580, durationMin: 15, marginAfterMin: 10, body: 'Natural movement between zones; allow teams to notice each other progress.', color: '#E0A23C' },
      TASK2: { id: 'TASK2', kind: 'task', title: 'Zone 2 - Mid-Session Crossing', x: 880, y: 210, startMin: 600, durationMin: 35, marginBeforeMin: 10, marginAfterMin: 15, body: 'Second-stage reactions and visible inter-team comparison.', color: '#5BC0BE' },
      TRV2: { id: 'TRV2', kind: 'travel', title: 'Travel Time - Assembly Route', x: 1160, y: 250, startMin: 635, durationMin: 20, marginAfterMin: 15, body: 'Route into final shared photo area; delays are acceptable and should stay playful.', color: '#E0A23C' },
      TASK3: { id: 'TASK3', kind: 'task', title: 'Final Assembly Photo', x: 1420, y: 210, startMin: 660, durationMin: 25, marginBeforeMin: 10, marginAfterMin: 0, body: 'All turtle teams assemble for the final group photo, even if some pieces are missing.', color: '#5BC0BE' },
      L1P: { id: 'L1P', kind: 'storyLocation', title: 'Zone 1 Physical - First Collection Area', x: 980, y: 420, body: 'Physical task zone where the first costume pieces and first shell voice reaction can happen.', color: '#43BF87' },
      L1N: { id: 'L1N', kind: 'storyLocation', title: 'Narrative Lore - First Collection Area', x: 1260, y: 420, body: 'Lore layer: the city first notices the turtle identity forming.', color: '#A87BF0' },
      L2P: { id: 'L2P', kind: 'storyLocation', title: 'Zone 2 Physical - Crossing Area', x: 980, y: 580, body: 'Physical crossing zone where teams can see each other progress.', color: '#43BF87' },
      L2N: { id: 'L2N', kind: 'storyLocation', title: 'Narrative Lore - Crossing Area', x: 1260, y: 580, body: 'Lore layer: teams become aware that other turtles are also rising.', color: '#A87BF0' },
      E1: { id: 'E1', kind: 'event', title: 'Voice Reaction - First Recognition', x: 70, y: 760, body: 'Funny or useful first-stage voice line when a shell dwells in the zone.', color: '#5CA8F5' },
      E2: { id: 'E2', kind: 'event', title: 'Voice Reaction - Second Stage', x: 420, y: 760, body: 'Later or near-completion voice line with funny, lore, or useful content.', color: '#5CA8F5' },
      E3: { id: 'E3', kind: 'event', title: 'Final Group Photo Assembly', x: 780, y: 760, body: 'Culminating event: all teams meet, compare costumes, and take the final group photo.', color: '#E8D25C' },
      C1: { id: 'C1', kind: 'concept', conceptKind: 'structureConcept', title: 'Four Turtle Team Variants', x: 60, y: 570, body: 'Duplicate the piece set per team: Leonardo/blue, Raphael/red, Donatello/purple, Michelangelo/orange. Each team uses the same story structure with different color and voice tone.', color: '#8B7BF5', collapsed: false },
      ...nodes,
    },
    numberMarkers: {},
    titleMarkers: {},
    edges: [
      { from: 'MA1', to: 'TASK0', label: 'master phase contains', color: null },
      { from: 'GMR1', to: 'TASK0', label: 'rules guide', color: null },
      { from: 'TASK0', to: 'TASK1', label: 'starts with', color: null },
      { from: 'TASK1', to: 'TRV1', label: 'then move', color: null },
      { from: 'TRV1', to: 'TASK2', label: 'cross paths', color: null },
      { from: 'TASK2', to: 'TRV2', label: 'toward finale', color: null },
      { from: 'TRV2', to: 'TASK3', label: 'assemble', color: null },
      { from: 'L1P', to: 'L1N', label: 'physical to lore layer', color: null },
      { from: 'L2P', to: 'L2N', label: 'physical to lore layer', color: null },
      { from: 'TASK1', to: 'E1', label: 'first reaction', color: null },
      { from: 'TASK2', to: 'E2', label: 'second reaction', color: null },
      { from: 'TASK3', to: 'E3', label: 'culminates in', color: null },
      ...items.map(([id]) => ({ from: id, to: 'E3', label: 'visible in final photo', color: null })),
    ],
    frames: {
      F1: { id: 'F1', label: 'Master overview and timeline', x: 30, y: 40, w: 1680, h: 310, color: '#3EC6D6' },
      F2: { id: 'F2', label: 'Story Items - reusable piece set', x: 30, y: 330, w: 880, h: 390, color: '#43BF87' },
      F3: { id: 'F3', label: 'Lore locations and voice events', x: 940, y: 380, w: 760, h: 520, color: '#A87BF0' },
    },
  };
}

function makeTurtleCostumeMechanicsStructure() {
  const turtles = [
    { key: 'LEO', name: 'Leonardo', color: '#5CA8F5', tone: 'clear, leaderly, encouraging' },
    { key: 'RAPH', name: 'Raphael', color: '#E86464', tone: 'dry, punchy, impatient but protective' },
    { key: 'DON', name: 'Donatello', color: '#A87BF0', tone: 'technical, curious, problem-solving' },
    { key: 'MIKE', name: 'Michelangelo', color: '#E0A23C', tone: 'playful, hungry, chaotic and upbeat' },
  ];
  const pieces = [
    ['MASK', 'Mask / Headband', 'Artifact', 'Color-coded face identity piece.'],
    ['ARM', 'Arm Sweat Catchers', 'Artifact', 'Comedic arm bands that make progress visible.'],
    ['LEG', 'Leg Sweat Catchers', 'Artifact', 'Comedic leg bands that build the silhouette.'],
    ['WEAPON', 'Foam Weapon', 'Artifact', 'Safe theatrical prop weapon, no real combat use.'],
    ['SHELL', 'Giant Shell', 'Wearable', 'Giant, ridiculous, unmistakably turtle shell. Bulky by design.'],
  ];
  const zones = [
    { key: 'Z1', title: 'Zone 1 - First Collection', x: 1040, y: 120, zone: 'GPS-ZONE-1', delay: '20 seconds', triggers: 2 },
    { key: 'Z2', title: 'Zone 2 - Mid-Session Crossing', x: 1040, y: 560, zone: 'GPS-ZONE-2', delay: '30 seconds', triggers: 2 },
    { key: 'Z3', title: 'Final Assembly Photo', x: 1040, y: 1000, zone: 'GPS-FINAL-ASSEMBLY', delay: '15 seconds', triggers: 1 },
  ];
  const nodes = {};
  const edges = [];

  turtles.forEach((turtle, teamIndex) => {
    const baseX = 50 + teamIndex * 230;
    nodes[`TEAM-${turtle.key}`] = mechanicSubnodeInstance(`TEAM-${turtle.key}`, 'team', `Team ${turtle.name}`, baseX, 80, { teamIds: [] });
    nodes[`PLAYER-${turtle.key}`] = mechanicSubnodeInstance(`PLAYER-${turtle.key}`, 'player', `${turtle.name} Shell Wearer`, baseX, 210, { playerIds: [] });
    nodes[`COMMENT-${turtle.key}`] = mechanicSubnodeInstance(`COMMENT-${turtle.key}`, 'comment', `${turtle.name} Tone Comment`, baseX, 340, {
      commentText: `Voice tone for this team: ${turtle.tone}. Keep lines funny, occasionally useful, and never mean-spirited.`,
      authorDate: 'Seed template',
    });
    nodes[`READY-${turtle.key}`] = mechanicSubnodeInstance(`READY-${turtle.key}`, 'readinessStatus', `${turtle.name} Readiness`, baseX, 470, {
      status: 'Draft',
      notes: 'Duplicate and bind this placeholder to real team/player records when importing into a game.',
    });
    edges.push(
      { from: `TEAM-${turtle.key}`, to: `PLAYER-${turtle.key}`, label: 'designated wearer', color: null },
      { from: `TEAM-${turtle.key}`, to: `COMMENT-${turtle.key}`, label: 'voice tone', color: null },
      { from: `TEAM-${turtle.key}`, to: `READY-${turtle.key}`, label: 'production state', color: null },
    );
    pieces.forEach(([pieceKey, title, baseType, lore], pieceIndex) => {
      const id = `${pieceKey}-${turtle.key}`;
      const isShell = pieceKey === 'SHELL';
      nodes[id] = {
        id,
        kind: 'item',
        title: `${turtle.name} ${title}`,
        shortTitle: isShell ? `${turtle.name} Shell` : title.replace(' / ', ' '),
        x: baseX,
        y: 650 + pieceIndex * 135,
        body: lore,
        playerLore: lore,
        completeLore: isShell
          ? 'Facilitator construction: minimum 40 cm protrusion, covers most of back, creates noticeable movement friction without pain, internal GPS tracker space, modular EVA foam on PVC frame preferred, heavy-duty Velcro plus backup straps.'
          : 'Purely physical costume piece for visual progression, team identity, humor, and final photo readability.',
        baseType,
        origin: 'Found or scavenged in a task zone.',
        gameplayMeaning: isShell
          ? 'The only tech-enabled costume piece. Its bulk creates embodied comedic friction and its GPS tracker triggers voice-line reactions.'
          : 'Visible collection progress; connects to the shell so the costume looks increasingly complete.',
        persistsAcrossTasks: true,
        buildStatus: isShell ? 'design' : 'concept',
        color: isShell ? '#43BF87' : turtle.color,
        image: turtleSvg(isShell ? `${turtle.name} Shell` : title, isShell ? '#43BF87' : turtle.color),
      };
      edges.push(
        { from: `TEAM-${turtle.key}`, to: id, label: 'team piece', color: null },
        { from: id, to: `READY-${turtle.key}`, label: 'track build status', color: null },
      );
      if (!isShell) edges.push({ from: id, to: `SHELL-${turtle.key}`, label: 'visual completion', color: null });
    });
  });

  zones.forEach((zone, zoneIndex) => {
    const y = zone.y;
    nodes[`CC-${zone.key}`] = {
      id: `CC-${zone.key}`, primitiveId: 'LIB-MPRIM-COOPERATION', kind: 'mechanic', mechKind: 'cooperation',
      title: `${zone.title} Cooperation`, x: zone.x, y,
      body: 'Players cooperate to collect and equip costume pieces while coordinating the active shell.',
      color: '#A87BF0',
      cooperationStyle: 'Asymmetric',
      attachedSubnodeIds: [`PR-${zone.key}`, `PI-${zone.key}`, `SN-${zone.key}`, `AC-${zone.key}`, `DISC-${zone.key}`, `SPEC-${zone.key}`],
    };
    nodes[`PR-${zone.key}`] = {
      id: `PR-${zone.key}`, primitiveId: 'LIB-MPRIM-PHYSICAL-RESTRICTION', kind: 'mechanic', mechKind: 'physicalRestriction',
      title: `${zone.title} Bulky Shell Restriction`, x: zone.x + 310, y: y - 110,
      body: 'Bulky shell creates movement friction and comedic difficulty.',
      color: '#F08CB4',
      restrictionType: 'Custom',
      connectTo: { nodeIds: turtles.map((t) => `SHELL-${t.key}`) },
      safetyRule: 'Shell must never cause pain, overheating, blocked breathing, stair risk, or forced running. Safety breaks fiction immediately.',
      stopCondition: 'Remove or loosen shell if the wearer reports pain, dizziness, panic, breathing restriction, heat stress, or unsafe terrain.',
      noteColor: '#F08CB4',
      attachedSubnodeIds: [],
    };
    nodes[`PI-${zone.key}`] = {
      id: `PI-${zone.key}`, primitiveId: 'LIB-MPRIM-PROP-INTERACTION', kind: 'objective', mechKind: 'propInteraction',
      title: `${zone.title} Collect + Equip Pieces`, x: zone.x + 310, y: y + 80,
      body: 'Players collect, equip, carry, and visually assemble costume pieces.',
      color: '#E0A23C',
      interactionType: 'Custom',
      successCondition: 'Team collects and equips the available costume pieces; partial progress still counts and remains visible.',
      failureCondition: 'A piece is missed, dropped, or delayed; the team continues with partial visual progress.',
      resetProcedure: 'Crew returns dropped pieces to the zone reset point and logs missing pieces for final photo handling.',
      connectTo: { itemIds: [], sensorIds: [], nodeIds: turtles.flatMap((t) => pieces.map(([pieceKey]) => `${pieceKey}-${t.key}`)), ideas: [] },
      noteColor: '#E0A23C',
      attachedSubnodeIds: [],
    };
    nodes[`SN-${zone.key}`] = {
      id: `SN-${zone.key}`, primitiveId: 'LIB-MPRIM-SENSOR-NODE', kind: 'sensor', mechKind: 'sensorNode',
      title: `${zone.title} Shell GPS Sensor`, x: zone.x + 650, y: y - 110,
      body: 'GPS zone sensor for shells. Fires only from shell location and dwell time.',
      color: '#3EC6D6',
      sensorType: 'GPS Zone',
      zoneReference: zone.zone,
      inputRequired: `Shell tracker enters ${zone.zone} and remains present for the dwell time. Partial activation can be treated as facilitator-confirmed if GPS jitters near the boundary.`,
      triggerCondition: 'Two-stage trigger: first reaction after sustained presence; second reaction later, near task completion, or after visible progress.',
      frequencyLimitEnabled: true,
      frequencyTriggerCount: zone.triggers,
      frequencyTimePeriod: '10 minutes',
      cooldownEnabled: true,
      cooldownDuration: '2 minutes',
      manualOverrideFallback: 'Crew can manually confirm the shell is in-zone and play the intended MP3 if GPS fails.',
      reliability: '3',
      nodeColor: '#3EC6D6',
    };
    nodes[`AC-${zone.key}`] = {
      id: `AC-${zone.key}`, primitiveId: 'LIB-MPRIM-ACTUATOR-NODE', kind: 'mechanic', mechKind: 'actuatorNode',
      title: `${zone.title} Voice-Line Speaker`, x: zone.x + 980, y: y - 20,
      body: 'Sound actuator that plays MP3 voice reactions through hidden/permanent or portable speakers.',
      color: '#5CA8F5',
      actuatorType: 'Sound',
      audioFileRef: `${zone.key.toLowerCase()}-turtle-reaction.mp3`,
      frequencyLimitEnabled: true,
      frequencyTriggerCount: zone.triggers,
      frequencyTimePeriod: '10 minutes',
      cooldownEnabled: true,
      cooldownDuration: '2 minutes',
      outputDuration: 'One short MP3 line, ideally 4-12 seconds.',
      outputIntensity: 'Clearly audible in the zone without startling nearby non-players.',
      outputRhythm: 'Mix funny, lore, and useful lines. Slight turtle-specific tone variation is chosen by team instance.',
      resetBehavior: 'Ready for the next allowed trigger after cooldown.',
      manualOverrideFallback: 'Crew can play the MP3 manually from phone or backup speaker.',
      nodeColor: '#5CA8F5',
    };
    nodes[`PS-${zone.key}`] = {
      id: `PS-${zone.key}`, primitiveId: 'LIB-MPRIM-PROGRESS-STATE', kind: 'mechanic', mechKind: 'progressState',
      title: `${zone.title} Collection Progress`, x: zone.x + 650, y: y + 135,
      body: 'Overall task completion: costume pieces collected and reaction stages triggered.',
      color: '#A87BF0',
      currentProgress: zoneIndex === 0 ? 3 : zoneIndex === 1 ? 6 : 10,
      visualStyle: 'Segmented bar',
    };
    const mods = [
      ['COOP', 'cooperativeEthosRole', 'Role Split', { cooperationStyle: 'Differentiated roles', roleSuggestions: 'Wearer carries shell; collectors gather pieces; coordinator watches timing, route, and handoffs.', ethosTone: 'Playful chaos', ethosToneGuidance: 'Keep the team laughing while protecting the wearer from fatigue.', teamDiscussionPrompt: 'Who protects the shell wearer, who collects, and who watches the path?' }],
      ['NOSOLO', 'noSoloEnforcer', 'No Solo Solve', { enforcementType: ['Multiple props', 'Role lock', 'Physical distance'], minimumPlayers: 2 }],
      ['FEED', 'progressiveFeedback', 'Voice Feedback Escalation', { feedbackType: ['Audio cue', 'Information reveal'], triggerCondition: 'Dwell time sustained or piece count increases.', effectDescription: 'Voice lines become clearer, more useful, or more triumphant as the team progresses.', strengthIntensity: 'Moderate', canStack: true }],
      ['FAIL', 'failSafeScaffolding', 'Fail Forward Voice Line', { hintLevelCount: 2, hintTrigger: 'Facilitator call', easierAlternativeEnabled: true, easierAlternativePath: 'If GPS or costume handling fails, allow humorous consolation line or lore fragment and continue.', partialCreditRule: 'Partial costume progress still counts visually.', skipEnabled: false, gracePeriodMinutes: 2 }],
      ['DISC', 'teamDiscussionPrompt', 'Discussion Prompt', { discussionPrompt: 'Before moving on, ask: what is funniest about our current turtle silhouette, and what do we need next?', whenToUse: 'Between attempts', facilitatorNote: 'Use at zone entry, after first reaction, and when teams cross paths.' }],
      ['ARB', 'arbitration', 'GPS Tolerance', { varianceHandling: 'Generous tolerance', toleranceDescription: 'Treat near-boundary GPS jitter as valid if the shell wearer is physically in the intended area.', partialCreditRule: 'Manual confirmation can count.', facilitatorOverride: true, logging: false }],
      ['SPEC', 'spectrumOfYesOutcomes', 'Spectrum of Outcomes', { outcomeLevels: 'Yes and; Yes; Yes but; No but; No; No and', yesAndDescription: 'Voice line is funny/useful and team gains visible progress.', yesDescription: 'Voice line fires and piece is collected.', yesButDescription: 'Voice line fires late or with partial collection.', noButDescription: 'No trigger, but crew grants a consolation clue.', noDescription: 'No trigger and no piece yet; continue moving.', noAndDescription: 'Unsafe or chaotic handling; pause and reset safely.', defaultSelection: ['Yes and', 'Yes', 'Yes but', 'No but'] }],
      ['PRES', 'escalatingPressure', 'Light Later Pressure', { pressureType: ['Time', 'Environmental change'], baseDurationMinutes: zoneIndex === 2 ? 10 : 20, escalationTrigger: 'Later zone or long dwell without progress.', escalationEffect: 'Increase urgency lightly through music, route instruction, or a teasing voice line.', canBePaused: true }],
      ['MULTI', 'multipleOutputLogic', 'Two-Stage Voice Resolver', { inputConditions: 'Stage 1: first sustained dwell. Stage 2: later dwell, near completion, or after visible piece progress.', correspondingOutputs: 'Stage 1: recognition/funny line. Stage 2: lore/useful line or final hype line.', defaultOutput: 'Funny neutral turtle line.' }],
      ['DELAY', 'triggerDelay', 'Dwell Delay', { delayDuration: zone.delay, delayType: 'Fixed' }],
      ['FAC', 'facilitatorNote', 'Safety and Oversight', { facilitatorGuidance: 'Monitor shell fatigue, strap comfort, speaker placement, route crossings, and final photo coordination even with missing pieces.' }],
      ['COMMENT', 'comment', 'Production Open Questions', { commentText: 'Open questions: exact shell dimensions, attachment method for modular sections, voice-line count per zone, speaker placement, and comfort calibration.', authorDate: 'Seed template' }],
      ['READY', 'readinessStatus', 'Zone Readiness', { status: 'Draft', notes: 'Needs GPS field test, audio volume test, route test, and costume comfort test.' }],
    ];
    mods.forEach(([prefix, kind, title, fields], index) => {
      const id = `${prefix}-${zone.key}`;
      nodes[id] = mechanicSubnodeInstance(id, kind, `${zone.title} ${title}`, zone.x + 1320 + (index % 2) * 270, y - 190 + Math.floor(index / 2) * 120, fields);
      edges.push({ from: `CC-${zone.key}`, to: id, label: 'modifier/support', color: null });
    });
    edges.push(
      { from: `CC-${zone.key}`, to: `PR-${zone.key}`, label: 'physical restriction', color: null },
      { from: `CC-${zone.key}`, to: `PI-${zone.key}`, label: 'prop interaction', color: null },
      { from: `CC-${zone.key}`, to: `SN-${zone.key}`, label: 'zone input', color: null },
      { from: `SN-${zone.key}`, to: `DELAY-${zone.key}`, label: 'dwell time', color: null },
      { from: `DELAY-${zone.key}`, to: `MULTI-${zone.key}`, label: 'stage resolver', color: null },
      { from: `MULTI-${zone.key}`, to: `AC-${zone.key}`, label: 'play selected MP3', color: null },
      { from: `CC-${zone.key}`, to: `PS-${zone.key}`, label: 'progress indicator', color: null },
    );
    turtles.forEach((turtle) => {
      edges.push(
        { from: `TEAM-${turtle.key}`, to: `CC-${zone.key}`, label: 'runs this zone', color: null },
        { from: `SHELL-${turtle.key}`, to: `PR-${zone.key}`, label: 'creates friction', color: null },
        { from: `SHELL-${turtle.key}`, to: `SN-${zone.key}`, label: 'GPS source', color: null },
        { from: `PLAYER-${turtle.key}`, to: `SN-${zone.key}`, label: 'wearer carries shell', color: null },
      );
    });
  });

  return {
    id: 'LIB-MSTRUCT-TURTLE-COSTUME-COLLECTION',
    name: 'TMNT Costume Collection - Multi-Team Mechanics',
    description: 'Mechanics-only full-session template using existing Larcraft nodes: four teams, costume pieces, bulky shell restriction, GPS sensors, two-stage MP3 reactions, modifiers, progress, comments, facilitator notes, and readiness tags.',
    estMinutes: 120,
    nodes: {
      S1: {
        id: 'S1', primitiveId: 'LIB-MPRIM-TASK-TEMPLATE', kind: 'mechanic', mechKind: 'taskTemplate',
        title: 'TMNT Costume Collection Mechanics', x: 70, y: 110,
        body: 'Reusable mechanics container for the full multi-team turtle costume collection session. Open deeper levels to edit teams, pieces, zones, GPS triggers, audio, safety, and progress.',
        color: '#8B7BF5',
        estMinutes: 120, minPlayers: 8, maxPlayers: 28,
        recommendedCrew: 'At least one roaming facilitator plus one tech/audio owner. More crew recommended for four simultaneous teams.',
        difficultyPressure: 'Medium',
        reusableAsLibraryTemplate: true,
        sub: {
          nodes,
          edges,
          frames: {
            F1: { id: 'F1', label: 'Teams and designated shell wearers', x: 20, y: 35, w: 940, h: 560, color: '#5CA8F5' },
            F2: { id: 'F2', label: 'Costume pieces - duplicate per turtle', x: 20, y: 610, w: 940, h: 790, color: '#43BF87' },
            F3: { id: 'F3', label: 'Reusable zone challenge clusters', x: 990, y: 40, w: 1960, h: 1390, color: '#A87BF0' },
          },
        },
      },
    },
    edges: [],
    frames: {
      F1: { id: 'F1', label: 'Full-session mechanics template', x: 35, y: 55, w: 500, h: 280, color: '#8B7BF5' },
    },
  };
}

export function makeLibrarySeed() {
  return {
    rev: LIB_REV,

    // Mechanic templates carry default PARAMETERS (switch/sensor counts,
    // timings, thresholds). Importing a mechanic into a game copies these; the
    // game instance can then be micro-adjusted (e.g. 1 switch → 4) without
    // ever changing this master blueprint.
    mechanics: {
      'LIB-MECH-LOCK': { id: 'LIB-MECH-LOCK', name: 'Lockpicking minigame', summary: 'Physical pick set on a practice lock; fails raise the alarm.', params: [{ key: 'fails', label: 'Fail limit', value: '3' }, { key: 'locks', label: 'Locks to pick', value: '1' }] },
      'LIB-MECH-DECRYPT': { id: 'LIB-MECH-DECRYPT', name: 'Decryption puzzle', summary: 'Button-box cipher wheel; hint unlocks after failed tries.', params: [{ key: 'hintAfter', label: 'Hint after tries', value: '3' }, { key: 'digits', label: 'Cipher digits', value: '4' }] },
      'LIB-MECH-COMMS': { id: 'LIB-MECH-COMMS', name: 'Comms link', summary: 'Radio protocol between team units and GM console.', params: [{ key: 'channels', label: 'Channels', value: '1' }] },
      'LIB-MECH-ACCESS': { id: 'LIB-MECH-ACCESS', name: 'Access control', summary: 'One switch equals one action; all switches open the gate.', params: [{ key: 'switches', label: 'Switches required', value: '1' }] },
      'LIB-MECH-REVIVE': { id: 'LIB-MECH-REVIVE', name: 'Downed-player revive', summary: 'Medkit card ritual at a safe zone.', params: [{ key: 'seconds', label: 'Revive seconds', value: '90' }] },
      'LIB-MECH-UV': { id: 'LIB-MECH-UV', name: 'Hidden-ink clues', summary: 'UV-reactive markings on props and walls.', params: [{ key: 'clues', label: 'Clue count', value: '3' }] },
    },

    // Hardware templates: base construction only. Battery, placement and
    // assignment live on the game instance.
    sensors: {
      'LIB-SEN-NFC': { id: 'LIB-SEN-NFC', kind: 'NFC reader', label: 'NFC reader (ESP32 dock)' },
      'LIB-SEN-BTN': { id: 'LIB-SEN-BTN', kind: 'Button box', label: '4-button cipher box' },
      'LIB-SEN-MOT': { id: 'LIB-SEN-MOT', kind: 'Motion sensor', label: 'PIR motion node' },
      'LIB-SEN-PRX': { id: 'LIB-SEN-PRX', kind: 'Proximity sensor', label: 'Gate proximity loop' },
      'LIB-SEN-RF': { id: 'LIB-SEN-RF', kind: 'RF beacon', label: 'LoRa beacon RX' },
    },

    items: {
      'LIB-ITM-001': { id: 'LIB-ITM-001', name: 'Cipher-Key', type: 'artifact', description: 'An ancient-looking brass key used for unlocking a sealed room.', propNotes: 'Heavy brass key, detailed engravings. Cast a spare per game.', loreNotes: 'Rumored to be made from meteoritic iron.', mechanicIds: ['LIB-MECH-LOCK'], sensorReqs: [{ sensorId: 'LIB-SEN-NFC', note: 'confirms pickup' }], image: null },
      'LIB-ITM-002': { id: 'LIB-ITM-002', name: 'Encrypted Dataslate', type: 'artifact', description: 'A weathered military dataslate containing corrupted data. Needs to be decoded.', propNotes: 'Plastic + metal case, low-res OLED, four buttons, 2×AA.', loreNotes: 'Recovered from a crash site.', mechanicIds: ['LIB-MECH-DECRYPT', 'LIB-MECH-COMMS'], sensorReqs: [{ sensorId: 'LIB-SEN-NFC', note: 'dock detects slate' }, { sensorId: 'LIB-SEN-BTN', note: 'cipher input' }], image: null },
      'LIB-ITM-003': { id: 'LIB-ITM-003', name: 'Serum Vial', type: 'gadget', description: 'A glowing vial required for the antidote ritual.', propNotes: 'Glow vial, UV-reactive fluid.', loreNotes: '', mechanicIds: ['LIB-MECH-REVIVE'], sensorReqs: [], image: null },
      'LIB-ITM-004': { id: 'LIB-ITM-004', name: 'Old-school Key Card', type: 'artifact', description: 'An embossed magstripe card that opens sector gates.', propNotes: 'Embossed magstripe card, weathered edges.', loreNotes: '', mechanicIds: ['LIB-MECH-ACCESS'], sensorReqs: [{ sensorId: 'LIB-SEN-PRX', note: 'gate unlock check' }], image: null },
      'LIB-ITM-005': { id: 'LIB-ITM-005', name: 'Comms Unit', type: 'gadget', description: 'Team radio tuned to the operation frequency.', propNotes: 'Repainted walkie, weathered.', loreNotes: '', mechanicIds: ['LIB-MECH-COMMS'], sensorReqs: [], image: null },
      'LIB-ITM-006': { id: 'LIB-ITM-006', name: 'Signal Beacon', type: 'gadget', description: 'Extraction call-in beacon for finales.', propNotes: '3D-printed shell, ESP32 + LED ring.', loreNotes: '', mechanicIds: [], sensorReqs: [{ sensorId: 'LIB-SEN-RF', note: 'GM console receiver' }], image: null },
      'LIB-ITM-007': { id: 'LIB-ITM-007', name: 'UV Torch', type: 'gadget', description: 'Reveals hidden ink markings.', propNotes: 'Consumer UV flashlight.', loreNotes: '', mechanicIds: ['LIB-MECH-UV'], sensorReqs: [], image: null },
      'LIB-ITM-008': { id: 'LIB-ITM-008', name: 'Medkit Prop', type: 'consumable', description: 'Revive kit: bandage cards + ritual instructions.', propNotes: 'Surplus pouch, 12 bandage cards.', loreNotes: '', mechanicIds: ['LIB-MECH-REVIVE'], sensorReqs: [], image: null },
      'LIB-ITM-MACRODROID-PHONE': { id: 'LIB-ITM-MACRODROID-PHONE', name: 'MacroDroid Phone Bridge', type: 'gadget', description: 'Android phone running MacroDroid to receive the GPS trigger and play the assigned MP3 through a speaker.', propNotes: 'Phone with MacroDroid macro, charged battery, paired speaker, local MP3 files, and mobile data/GPS enabled.', loreNotes: '', mechanicIds: [], sensorReqs: [], image: null },
    },

    locations: {
      'LIB-LOC-001': { id: 'LIB-LOC-001', name: 'Warehouse hall', notes: 'Large indoor space, patrol routes, locker corridor.', safety: 'Mark fire exits; no running on mezzanines.', image: null },
      'LIB-LOC-002': { id: 'LIB-LOC-002', name: 'Gated checkpoint', notes: 'Lockable gate between zones; good act boundary.', safety: 'Crew operates the gate, never players.', image: null },
      'LIB-LOC-003': { id: 'LIB-LOC-003', name: 'Puzzle bench', notes: 'Table station for decryption / crafting mechanics.', safety: 'Tape down cable runs.', image: null },
      'LIB-LOC-004': { id: 'LIB-LOC-004', name: 'Safe zone / med bay', notes: 'Out-of-game rest area + revive station.', safety: 'Always out-of-game; real first aid kit here.', image: null },
    },

    // NARRATIVE PRIMITIVES: single, isolated node templates — the raw
    // building blocks of quest design. Each carries default input/output
    // logic handles, default metadata, and a designated color + icon.
    // NARRATIVE (Story & Narrative): one unified list of purely-story building
    // blocks — beats, plot hooks, briefing scripts, NPC bios, rumors, lore.
    // Each is a narrative node you can drop onto a story-structure canvas or
    // import into a game as a story node. No mechanic/sensor logic lives here.
    narrative: {},

    // MECHANIC PRIMITIVES (Game Mechanics node tree): the physical / sensor /
    // task node types — sensor triggers, puzzles, challenges, timers, waypoints,
    // handoffs. These are the mechanics counterpart to the narrative nodes.
    mechPrimitives: {
      'LIB-MPRIM-TASK-TEMPLATE': {
        id: 'LIB-MPRIM-TASK-TEMPLATE', name: 'Task Template', mechKind: 'taskTemplate',
        baseKind: 'mechanic', color: '#8B7BF5', icon: 'layers', inputs: ['start'], outputs: ['complete', 'branch'],
        defaultBody: 'Reusable collapsed container for a complete task graph. Expand to edit the internal mechanics.',
        estMinutes: 20, minPlayers: 3, maxPlayers: 7, crew: 0, recommendedCrew: '', refs: {}, collapseDepth: 1,
        difficultyPressure: 'Medium', reusableAsLibraryTemplate: true,
      },
      'LIB-MPRIM-COOPERATION': {
        id: 'LIB-MPRIM-COOPERATION', name: 'Cooperation', mechKind: 'cooperation',
        baseKind: 'mechanic', category: 'mechanic', color: '#A87BF0', icon: 'users', inputs: ['in'], outputs: ['out'],
        defaultBody: 'Define how players coordinate, divide roles, or act together.',
        estMinutes: 5, crew: 0, refs: {}, collapseDepth: 0, cooperationStyle: 'Parallel', attachedSubnodeIds: [],
      },
      'LIB-MPRIM-PHYSICAL-RESTRICTION': {
        id: 'LIB-MPRIM-PHYSICAL-RESTRICTION', name: 'Physical Restriction', mechKind: 'physicalRestriction',
        baseKind: 'state', color: '#E86464', icon: 'cross', inputs: ['apply'], outputs: ['restricted', 'released'],
        defaultBody: 'Applies a body, movement, communication, or carrying limitation with explicit safety and stop rules.',
        estMinutes: 1, crew: 1, refs: {}, collapseDepth: 0, restrictionType: 'Blindfold',
        connectTo: { nodeIds: [] },
        safetyRule: '', stopCondition: '', noteColor: '#E86464', attachedSubnodeIds: [],
      },
      'LIB-MPRIM-PROP-INTERACTION': {
        id: 'LIB-MPRIM-PROP-INTERACTION', name: 'Prop Interaction', mechKind: 'propInteraction',
        baseKind: 'objective', color: '#E0A23C', icon: 'swap', inputs: ['in'], outputs: ['success', 'fail', 'reset'],
        defaultBody: 'Defines how players manipulate existing physical item/artifact records: carry, balance, sort, throw, assemble, unlock, or trade.',
        estMinutes: 8, crew: 0, refs: {}, collapseDepth: 0, interactionType: 'Balance',
        successCondition: '', failureCondition: '', resetProcedure: '',
        connectTo: { itemIds: [], sensorIds: [], nodeIds: [], ideas: [] },
        noteColor: '#E0A23C', attachedSubnodeIds: [],
      },
      'LIB-MPRIM-SENSOR-NODE': {
        id: 'LIB-MPRIM-SENSOR-NODE', name: 'Sensor Node', mechKind: 'sensorNode',
        baseKind: 'sensor', color: '#3EC6D6', icon: 'zap', inputs: ['watch'], outputs: ['triggered'],
        defaultBody: 'Gameplay sensor: what it detects, what input activates it, and when it should trigger in the game.',
        estMinutes: 1, crew: 0, refs: {}, collapseDepth: 0, sensorType: 'Pressure',
        zoneReference: '', inputRequired: '', triggerCondition: '',
        frequencyLimitEnabled: false, frequencyTriggerCount: 1, frequencyTimePeriod: '1 minute',
        cooldownEnabled: false, cooldownDuration: '30 seconds',
        manualOverrideFallback: '', reliability: '3', nodeColor: '#3EC6D6',
      },
      'LIB-MPRIM-ACTUATOR-NODE': {
        id: 'LIB-MPRIM-ACTUATOR-NODE', name: 'Actuator Node', mechKind: 'actuatorNode',
        baseKind: 'mechanic', color: '#5CA8F5', icon: 'flag', inputs: ['activate'], outputs: ['effect'],
        defaultBody: 'Gameplay output: what happens in the world when this actuator fires.',
        estMinutes: 1, crew: 0, refs: {}, collapseDepth: 0, actuatorType: 'Light',
        audioFileRef: '', outputDuration: '', outputIntensity: '', outputRhythm: '', resetBehavior: '',
        frequencyLimitEnabled: false, frequencyTriggerCount: 1, frequencyTimePeriod: '1 minute',
        cooldownEnabled: false, cooldownDuration: '30 seconds',
        manualOverrideFallback: '', nodeColor: '#5CA8F5',
      },
      'LIB-MPRIM-ACTION': {
        id: 'LIB-MPRIM-ACTION', name: 'Action', mechKind: 'action', category: 'action',
        baseKind: 'mechanic', color: '#58C7A6', icon: 'zap', inputs: ['available'], outputs: ['complete'],
        defaultBody: 'One atomic physical, cognitive, or social step performed by a player or team.',
        estMinutes: 1, crew: 0, refs: {}, collapseDepth: 0,
        tokenMechanismId: '', orderMechanismId: '', specialMechanismId: '', attachedSubnodeIds: [],
      },
      'LIB-MPRIM-PLAYER-INSTRUCTION': {
        id: 'LIB-MPRIM-PLAYER-INSTRUCTION', name: 'Player-Facing Instruction', mechKind: 'playerFacingInstruction', category: 'supporting',
        baseKind: 'mechanic', color: '#E8D25C', icon: 'book', inputs: ['in'], outputs: ['out'],
        defaultBody: '', estMinutes: 1, crew: 0, refs: {}, collapseDepth: 0,
      },
      'LIB-MPRIM-ACTION-SEQUENCE': {
        id: 'LIB-MPRIM-ACTION-SEQUENCE', name: 'Action Sequence', mechKind: 'actionSequence', category: 'action',
        baseKind: 'mechanic', color: '#3EC6D6', icon: 'layers', inputs: ['start'], outputs: ['complete'],
        defaultBody: 'Collapsible container for a custom sequence of actions.',
        estMinutes: 3, crew: 0, refs: {}, collapseDepth: 1,
        sequenceMode: 'Custom', sequenceInstruction: '', attachedSubnodeIds: [],
      },
      'LIB-MPRIM-ACTION-PROBABILITY': {
        id: 'LIB-MPRIM-ACTION-PROBABILITY', name: 'Resolution', mechKind: 'actionProbability', category: 'action',
        baseKind: 'mechanic', color: '#F08CB4', icon: 'pin', inputs: ['attempt'], outputs: ['resolved'],
        defaultBody: ACTION_PROBABILITY_RESOLUTIONS[0].description,
        estMinutes: 1, crew: 0, refs: {}, collapseDepth: 0,
        resolutionMechanismId: ACTION_PROBABILITY_RESOLUTIONS[0].id,
        resolutionType: ACTION_PROBABILITY_RESOLUTION_TYPES[0], variations: [''], emotionalSpike: '', effects: [''],
        image: ACTION_PROBABILITY_RESOLUTIONS[0].image, imageScale: 1, imagePositionX: 0, imagePositionY: 0,
      },
      'LIB-MPRIM-CHARACTER-STATE': {
        id: 'LIB-MPRIM-CHARACTER-STATE', name: 'Character State', mechKind: 'characterState',
        baseKind: 'state', color: '#F08CB4', icon: 'user', inputs: ['observe'], outputs: ['respond', 'change'],
        defaultBody: 'Pre-programmed character/NPC state for dialogue trees and AI agent behavior.',
        estMinutes: 1, crew: 0, refs: {}, collapseDepth: 0, emotionalState: 'Neutral',
        behavioralNotes: '', nodeColor: '#F08CB4', attachedSubnodeIds: [],
        deprecated: true, hiddenFromPalette: true,
        migrationHint: 'Character State has moved to Narrative Subnodes. Use the narrative Character State subnode for future story/dialogue behavior.',
      },
      'LIB-MPRIM-SENSOR': {
        id: 'LIB-MPRIM-SENSOR', name: 'Sensor Trigger', baseKind: 'sensor', color: '#3EC6D6', icon: 'zap',
        inputs: ['arm'], outputs: ['fired'],
        defaultBody: 'This node is deprecated. Its functionality has been merged into the Sensor node.',
        estMinutes: 1, crew: 0, deprecated: true, hiddenFromPalette: true,
        migrationHint: 'Use Sensor Node instead. This node is deprecated. Its functionality has been merged into the Sensor node.',
      },
      'LIB-MPRIM-PROGRESS-STATE': {
        id: 'LIB-MPRIM-PROGRESS-STATE', name: 'Progress State', mechKind: 'progressState',
        baseKind: 'mechanic', category: 'supporting', color: '#A87BF0', icon: 'pin',
        inputs: ['attach'], outputs: ['progress'],
        defaultBody: 'Visual task completion tracker: shows how many of 10 steps are complete.',
        estMinutes: 1, crew: 0, currentProgress: 1, visualStyle: 'Segmented bar',
      },
    },

    // MECHANIC SUBNODES: attachable modifiers for mechanic nodes, especially
    // Cooperation and Task Template nodes. They mirror narrative subnodes:
    // separate reusable library records, then attached into a specific task
    // graph when the designer needs that modifier.
    mechSubnodes: Object.fromEntries(MECHANIC_SUBNODE_KINDS.map((kind) => {
      const id = `LIB-MSUB-${kind}`;
      return [id, MECHANIC_SUBNODE_BLANK(id, kind)];
    })),

    // Editable type systems (persist across games in the Library).
    itemTypes: { ...DEFAULT_ITEM_TYPES },
    narrativeCategories: { ...DEFAULT_NARRATIVE_CATEGORIES },
    mechanicRestrictionTypes: {
      'RST-BLINDFOLD': { id: 'RST-BLINDFOLD', label: 'Blindfold', custom: false },
      'RST-BIND-ONE-HAND': { id: 'RST-BIND-ONE-HAND', label: 'Binding one hand', custom: false },
      'RST-SILENCE': { id: 'RST-SILENCE', label: 'Silence', custom: false },
      'RST-CARRY-LOAD': { id: 'RST-CARRY-LOAD', label: 'Carry load', custom: false },
      'RST-MOBILITY-LIMIT': { id: 'RST-MOBILITY-LIMIT', label: 'Mobility limit', custom: false },
    },
    mechanicInteractionTypes: {
      'PIT-BALANCE': { id: 'PIT-BALANCE', label: 'Balance', custom: false },
      'PIT-CARRY': { id: 'PIT-CARRY', label: 'Carry', custom: false },
      'PIT-SORT': { id: 'PIT-SORT', label: 'Sort', custom: false },
      'PIT-THROW': { id: 'PIT-THROW', label: 'Throw', custom: false },
      'PIT-ASSEMBLE': { id: 'PIT-ASSEMBLE', label: 'Assemble', custom: false },
      'PIT-UNLOCK': { id: 'PIT-UNLOCK', label: 'Unlock', custom: false },
      'PIT-TRADE': { id: 'PIT-TRADE', label: 'Trade', custom: false },
    },
    mechanicSensorTypes: {
      'SNT-PRESSURE': { id: 'SNT-PRESSURE', label: 'Pressure', custom: false },
      'SNT-NFC': { id: 'SNT-NFC', label: 'NFC', custom: false },
      'SNT-MOTION': { id: 'SNT-MOTION', label: 'Motion', custom: false },
      'SNT-GPS-ZONE': { id: 'SNT-GPS-ZONE', label: 'GPS Zone', custom: false },
      'SNT-BUTTON': { id: 'SNT-BUTTON', label: 'Button', custom: false },
    },
    mechanicActuatorTypes: {
      'ACT-LIGHT': { id: 'ACT-LIGHT', label: 'Light', custom: false },
      'ACT-SOUND': { id: 'ACT-SOUND', label: 'Sound', custom: false },
      'ACT-MOVEMENT': { id: 'ACT-MOVEMENT', label: 'Movement', custom: false },
      'ACT-LOCK': { id: 'ACT-LOCK', label: 'Lock', custom: false },
      'ACT-DISPLAY': { id: 'ACT-DISPLAY', label: 'Display', custom: false },
      'ACT-MESSAGE': { id: 'ACT-MESSAGE', label: 'Message', custom: false },
    },
    mechanicCharacterEmotionTypes: {
      'CEM-NEUTRAL': { id: 'CEM-NEUTRAL', label: 'Neutral', custom: false },
      'CEM-SAD': { id: 'CEM-SAD', label: 'Sad', custom: false },
      'CEM-ANGRY': { id: 'CEM-ANGRY', label: 'Angry', custom: false },
      'CEM-JOYFUL': { id: 'CEM-JOYFUL', label: 'Joyful', custom: false },
      'CEM-CONFUSED': { id: 'CEM-CONFUSED', label: 'Confused', custom: false },
      'CEM-HOSTILE': { id: 'CEM-HOSTILE', label: 'Hostile', custom: false },
      'CEM-ALLIED': { id: 'CEM-ALLIED', label: 'Allied', custom: false },
    },
    mechanicSequenceModes: {
      'SQM-CUSTOM': { id: 'SQM-CUSTOM', label: 'Custom', custom: false },
    },
    actionPatternMechanisms: makeActionPatternMechanisms(),
    actionProbabilityMechanisms: Object.fromEntries(ACTION_PROBABILITY_RESOLUTIONS.map((record) => [record.id, record])),

    // GAME MASTER RULES: global design principles that shape the whole game.
    // Each rule leads with a short core principle (≤4 sentences), then carries
    // descriptive tabs (implementation / rationale / AI generation rule).
    gmRules: {
      'LIB-GMR-001': {
        id: 'LIB-GMR-001',
        title: 'Distributed Cooperation',
        principle: 'Core cooperative stages should distribute essential information, access, or timing across multiple players so success comes from combining actions, not from one player directing everyone else.',
        implementation: 'When generating a cooperative stage, give different players different pieces of the solution. One player might see a symbol, another might hear a sound cue, another might reach a physical sensor, and another might control timing. Start with information-splitting, then add physical separation or simultaneous triggers when the stage needs stronger cooperation. Use time pressure carefully, mainly for advanced or high-energy stages. The stage should still allow players to communicate, coordinate, and feel shared success rather than simply obeying one dominant player.',
        rationale: 'This prevents the alpha-player problem while supporting real group cohesion. Players are not just standing near each other; they each hold something the group needs. This creates participation, communication, trust, and replayable variation without requiring new hardware for every stage.',
        aiRule: 'Before finalizing a cooperative stage, check whether one player can complete it alone by holding all information, reaching all sensors, and controlling all timing. If yes, split one required element across players: information first, physical access second, timing pressure third. Ensure the split creates meaningful cooperation, not just artificial inconvenience.',
      },
      'LIB-GMR-002': {
        id: 'LIB-GMR-002',
        title: 'Fail Forward',
        principle: 'A failed objective should redirect the story, never dead-end it. Every failure state must hand players a new, playable situation — a harder path, a consequence, or a lead — so momentum and morale survive setbacks.',
        implementation: 'For each stage, author the failure branch as deliberately as the success branch. A failed puzzle might trigger an alarm that reroutes enemies, spend a resource, or unlock a slower manual bypass. Avoid outcomes that force players to stand idle or leave the game. Prefer consequences that change the board (new enemy behaviour, a locked route, a time penalty) over consequences that simply say "no".',
        rationale: 'Real-life games cannot pause and retry cleanly; a hard dead-end strands players physically and kills a session. Fail-forward design keeps everyone in motion, turns mistakes into story, and lets weaker teams still reach an ending.',
        aiRule: 'For every stage with a fail state, verify a defined next action exists on failure. If failure leads to "nothing happens" or "wait and try again", replace it with a consequence that changes the game state or opens an alternate route before finalizing.',
      },
      'LIB-GMR-TURTLE-SHELLS': {
        id: 'LIB-GMR-TURTLE-SHELLS',
        title: 'Turtle Shell Comedy Safety',
        principle: 'Bulky costume friction is allowed only while it stays funny, manageable, and clearly safe. Safety breaks fiction, and the shell wearer can stop or loosen the shell at any time.',
        implementation: 'Brief teams that the shell is a comedic movement rule, not an endurance test. Crew watch fatigue, heat, strap pressure, terrain, and route crossings. Voice reactions should feel like the world recognizing the turtles, but failed GPS or missing pieces should fail forward with a manual line, a consolation joke, or a lore fragment.',
        rationale: 'The mechanic works because the visible costume creates shared absurdity and social bonding. If discomfort becomes pain, embarrassment, or unsafe movement, the mechanic stops being playful and damages trust.',
        aiRule: 'Before approving a turtle zone, verify shell comfort, stop condition, manual GPS fallback, speaker volume, route crossing logistics, and final photo handling for incomplete costumes.',
      },
      'LIB-GMR-003': {
        id: 'LIB-GMR-003',
        title: 'Safety Breaks Fiction',
        principle: 'Player safety and consent always override the fiction. Any real-world hazard, medical need, or a player invoking a stop signal immediately pauses the in-game situation, no matter how dramatic the moment.',
        implementation: 'Every stage must define a safe-word / stop-signal response and a nearest out-of-game safe zone. Physical challenges declare their real limits (no grappling, no stairs, no blindfold near hazards) up front. Crew are briefed that enforcing safety is never "breaking immersion" — it is part of the job. Mark exits, hazards and med locations on the location map.',
        rationale: 'A single injury or ignored consent breach ends trust in the whole event. Encoding safety as a first-class rule keeps the game repeatable, insurable, and welcoming to new and vulnerable players.',
        aiRule: 'Before finalizing any stage involving physical action, restricted senses, or time pressure, confirm it names a stop-signal behaviour and a safe zone. If either is missing, add it and flag the stage for a crew safety review.',
      },
    },

    // STORY STRUCTURES: saved, editable narrative graphs — pure story arcs
    // assembled from narrative nodes (no mechanic nodes). Importing one into a
    // game creates a fully detached copy of the whole graph.
    stories: {
      'LIB-STORY-TURTLE-SESSION': makeTurtleSessionStoryStructure(),
      'LIB-STORY-ITEM-NODE-GRAPH': {
        id: 'LIB-STORY-ITEM-NODE-GRAPH',
        name: 'Item Node Graph Template',
        description: 'Reusable inspector-first Item graph: minimal canvas card, full item detail in inspector, placement ports, linked mechanics, sensor hooks, and No-Solo-Solve support.',
        estMinutes: 5,
        nodes: {
          S1: {
            id: 'S1', kind: 'item', title: 'Item Name', shortTitle: 'Item',
            x: 70, y: 150, body: 'Player-facing lore/flavor goes here. Keep it evocative, not mechanical.',
            playerDescription: 'Player-facing lore/flavor goes here. Keep it evocative, not mechanical.',
            facilitatorDescription: 'Practical real-world details: prop material, dimensions, storage, reset procedure, durability, safety, and crew handling.',
            imageRef: 'Describe or reference the intended image/prop photo.',
            itemType: 'Artifact', buildStatus: 'concept', origin: 'Flavor origin: where this item came from or how players earn it.',
            placementNodeIds: ['S2'], linkedMechanicNodeIds: ['S3'], linkedMechanicIds: [],
            sensorHooks: 'NFC / QR / GPS / button interaction notes. Example: NFC scan confirms pickup and sets item_obtained.',
            noSoloSolve: true,
            mechanicMeaning: 'Explain why the physical mechanic matches the item theme: access, trust, proof, sacrifice, status, memory, etc.',
            attachedTemplateNotes: 'Suggested: No-Solo Enforcer, Facilitator Note, Value, Lifespan, Spend / Use Rule, or a relevant Pip Deck concept.',
            persistsAcrossTasks: true,
            color: '#E0A23C',
          },
          S2: {
            id: 'S2', kind: 'storyLocation', title: 'Placement Location', x: 420, y: 70,
            body: 'Story Location where the item is placed, discovered, hidden, traded, or activated.',
            color: '#43BF87',
          },
          S3: {
            id: 'S3', kind: 'quest', title: 'Linked Mechanic', x: 420, y: 250,
            body: 'Placeholder for a mechanic reference such as Lockpicking Minigame Event, access gate, decoding ritual, or exchange rule.',
            color: '#A87BF0',
          },
          S4: {
            id: 'S4', kind: 'quest', title: 'Sensor Hook', x: 760, y: 70,
            body: 'Sensor interaction placeholder: NFC, QR, GPS, pressure, button, phone macro, or GM-confirmed state.',
            color: '#3EC6D6',
          },
          S5: {
            id: 'S5', kind: 'quest', title: 'No-Solo-Solve Rule', x: 760, y: 250,
            body: 'Use when the item should require multiple players, separated information, synchronized timing, or a role split.',
            color: '#F08CB4',
          },
        },
        edges: [
          { from: 'S1', to: 'S2', label: 'Placement port', color: null },
          { from: 'S1', to: 'S3', label: 'Linked mechanic port', color: null },
          { from: 'S1', to: 'S4', label: 'Sensor hook port', color: null },
          { from: 'S1', to: 'S5', label: 'enforce when relevant', color: null },
        ],
        frames: {
          F1: { id: 'F1', label: 'Item node graph', x: 35, y: 40, w: 1060, h: 410, color: '#E0A23C' },
        },
      },
      'LIB-STORY-TURTLE-COLLECTION': {
        id: 'LIB-STORY-TURTLE-COLLECTION',
        name: 'Ninja Turtle Costume Collection',
        description: 'Story-side reusable structure for one team collecting five turtle costume Story Items. This stays narrative-only; GPS, MacroDroid, speaker, and MP3 behavior live in the mechanics template.',
        estMinutes: 45,
        nodes: {
          S1: {
            id: 'S1', kind: 'concept', conceptKind: 'structureConcept', conceptId: null,
            title: 'Turtle Costume Collection', x: 70, y: 120,
            body: 'Duplicate this container once per team. It tracks the five costume Story Items and the story moment when the set is complete.',
            color: '#43BF87', collapsed: true, conceptAnswers: {},
            sub: {
              nodes: {
                P1: { id: 'P1', kind: 'item', title: 'Mask / Headband', x: 40, y: 80, body: 'Team identity costume piece. Story Item only.', color: '#5CA8F5', itemType: 'Wearable', origin: 'Found, earned, or awarded during play.', persistsAcrossTasks: true },
                P2: { id: 'P2', kind: 'item', title: 'Arm Sweat Catchers', x: 330, y: 80, body: 'Wearable costume piece. Story Item only.', color: '#E0A23C', itemType: 'Wearable', origin: 'Found, earned, or awarded during play.', persistsAcrossTasks: true },
                P3: { id: 'P3', kind: 'item', title: 'Leg Sweat Catchers', x: 40, y: 260, body: 'Wearable costume piece. Story Item only.', color: '#A87BF0', itemType: 'Wearable', origin: 'Found, earned, or awarded during play.', persistsAcrossTasks: true },
                P4: { id: 'P4', kind: 'item', title: 'Weapon', x: 330, y: 260, body: 'Safe turtle-themed prop weapon. Story Item only unless a physical prop record is linked separately.', color: '#F08CB4', itemType: 'Wearable', origin: 'Found, earned, or awarded during play.', persistsAcrossTasks: true },
                P5: { id: 'P5', kind: 'item', title: 'Shell', x: 620, y: 170, body: 'Special Story Item. Pair this with the NinjaTurtleShellReaction mechanics template when GPS/MP3 behavior is needed.', color: '#43BF87', itemType: 'Wearable', origin: 'Found, earned, or awarded during play; physically contains the GPS tracker.', persistsAcrossTasks: true },
                P6: { id: 'P6', kind: 'quest', title: 'Collection Tracker 0/5', x: 910, y: 90, body: 'Track which of the five costume pieces have been collected by this team.', color: '#8B7BF5' },
                P7: { id: 'P7', kind: 'event', title: 'Costume Set Complete', x: 910, y: 290, body: 'Story beat triggered when the team has the required costume set.', color: '#E8D25C' },
              },
              edges: [
                { from: 'P1', to: 'P6', label: 'counts toward', color: null },
                { from: 'P2', to: 'P6', label: 'counts toward', color: null },
                { from: 'P3', to: 'P6', label: 'counts toward', color: null },
                { from: 'P4', to: 'P6', label: 'counts toward', color: null },
                { from: 'P5', to: 'P6', label: 'active shell piece', color: null },
                { from: 'P6', to: 'P7', label: '5/5 collected', color: null },
              ],
              frames: {
                F1: { id: 'F1', label: 'Five Story Items', x: 20, y: 35, w: 820, h: 390, color: '#43BF87' },
                F2: { id: 'F2', label: 'Collection state', x: 870, y: 50, w: 330, h: 370, color: '#8B7BF5' },
              },
            },
          },
          S2: { id: 'S2', kind: 'event', title: 'Turtle Assembly Moment', x: 520, y: 130, body: 'Optional story event for bringing completed turtle teams together. Keep the mechanical GPS/audio template separate.', color: '#E8D25C' },
        },
        edges: [
          { from: 'S1', to: 'S2', label: 'when narratively complete', color: null },
        ],
        frames: {
          F1: { id: 'F1', label: 'Story-only costume collection', x: 35, y: 45, w: 430, h: 290, color: '#43BF87' },
          F2: { id: 'F2', label: 'Optional story payoff', x: 490, y: 45, w: 410, h: 290, color: '#E8D25C' },
        },
      },
    },

    // MECHANIC STRUCTURES: saved, editable graphs of mechanic nodes — the
    // mechanics counterpart to Story Structures. Same node canvas, mechanic
    // palette. Built from Mechanic Nodes.
    mechStructures: {
      ...makeActionMechanicTemplates(),
      'LIB-MSTRUCT-TURTLE-COSTUME-COLLECTION': makeTurtleCostumeMechanicsStructure(),
      'LIB-MSTRUCT-DOOR': {
        id: 'LIB-MSTRUCT-DOOR', name: 'Cooperative Door Challenge',
        description: 'A current-system example: cooperation, prop interaction, sensor input, and actuator output.',
        estMinutes: 15,
        nodes: {
          S1: { id: 'S1', primitiveId: 'LIB-MPRIM-COOPERATION', kind: 'mechanic', mechKind: 'cooperation', title: 'Door Cooperation', x: 40, y: 120, body: 'Players coordinate synchronously to open the sealed door.', color: null, cooperationStyle: 'Synchronous', attachedSubnodeIds: [] },
          S2: { id: 'S2', primitiveId: 'LIB-MPRIM-PROP-INTERACTION', kind: 'objective', mechKind: 'propInteraction', title: 'Hold the Switches', x: 360, y: 60, body: 'Players hold separate switches at the same time.', color: null, interactionType: 'Unlock', successCondition: 'All required switches are held together.', failureCondition: '', resetProcedure: '', connectTo: { itemIds: [], sensorIds: [], nodeIds: [], ideas: [] }, noteColor: '#E0A23C', attachedSubnodeIds: [] },
          S3: { id: 'S3', primitiveId: 'LIB-MPRIM-SENSOR-NODE', kind: 'sensor', mechKind: 'sensorNode', title: 'Door Sensor', x: 700, y: 120, body: 'Detects whether the switches are correctly held.', color: null, sensorType: 'Button', inputRequired: 'All switch inputs active at the same time.', triggerCondition: '', nodeColor: '#3EC6D6' },
          S4: { id: 'S4', primitiveId: 'LIB-MPRIM-ACTUATOR-NODE', kind: 'mechanic', mechKind: 'actuatorNode', title: 'Door Opens', x: 1020, y: 120, body: 'Signals that the door opens.', color: null, actuatorType: 'Lock', outputDuration: '', outputIntensity: '', outputRhythm: '', resetBehavior: '', nodeColor: '#5CA8F5' },
        },
        edges: [
          { from: 'S1', to: 'S2', label: 'assemble', color: null },
          { from: 'S2', to: 'S3', label: 'all held', color: null },
          { from: 'S3', to: 'S4', label: 'confirmed', color: null },
        ],
      },
      'LIB-MSTRUCT-TURTLE-SHELL-REACTION': {
        id: 'LIB-MSTRUCT-TURTLE-SHELL-REACTION',
        name: 'NinjaTurtleShellReaction',
        description: 'Mechanics-only reusable structure for one team shell: GPS zone dwell trigger, frequency control, MacroDroid phone bridge, and MP3 speaker output. Story tone and character meaning belong in Story Structures.',
        estMinutes: 10,
        nodes: {
          S1: {
            id: 'S1', primitiveId: 'LIB-MPRIM-TASK-TEMPLATE', kind: 'mechanic', mechKind: 'taskTemplate',
            title: 'NinjaTurtleShellReaction', x: 70, y: 110,
            body: 'Main reusable mechanics container. Instantiate once per team shell, then set zone, delay, trigger limits, and MP3 file.',
            color: '#8B7BF5',
            estMinutes: 5, minPlayers: 1, maxPlayers: 1, recommendedCrew: 'One crew member or phone macro owner to verify GPS and speaker behavior.',
            difficultyPressure: 'Low', reusableAsLibraryTemplate: true,
            sub: {
              nodes: {
                D1: { id: 'D1', kind: 'item', title: 'Mask / Headband', x: 50, y: 70, body: 'Costume Story Item. No active mechanic attached.', color: '#5CA8F5', itemType: 'Wearable', origin: 'Team costume collection.', persistsAcrossTasks: true },
                D2: { id: 'D2', kind: 'item', title: 'Arm Sweat Catchers', x: 300, y: 70, body: 'Costume Story Item. No active mechanic attached.', color: '#E0A23C', itemType: 'Wearable', origin: 'Team costume collection.', persistsAcrossTasks: true },
                D3: { id: 'D3', kind: 'item', title: 'Leg Sweat Catchers', x: 50, y: 240, body: 'Costume Story Item. No active mechanic attached.', color: '#A87BF0', itemType: 'Wearable', origin: 'Team costume collection.', persistsAcrossTasks: true },
                D4: { id: 'D4', kind: 'item', title: 'Weapon', x: 300, y: 240, body: 'Costume Story Item. No active mechanic attached.', color: '#F08CB4', itemType: 'Wearable', origin: 'Team costume collection.', persistsAcrossTasks: true },
                D5: { id: 'D5', kind: 'item', title: 'Shell', x: 570, y: 150, body: 'Only active costume piece. Physically contains the GPS tracker.', color: '#43BF87', itemType: 'Wearable', origin: 'Team costume collection; carries GPS tracker hardware.', persistsAcrossTasks: true },
                D6: {
                  id: 'D6', primitiveId: 'LIB-MPRIM-COOPERATION', kind: 'mechanic', mechKind: 'cooperation',
                  title: 'Shell Reaction Cooperation', x: 850, y: 150,
                  body: 'Defines that one player carries this team shell while its automated GPS reaction chain runs.',
                  color: '#A87BF0',
                  cooperationStyle: 'Solo',
                  attachedSubnodeIds: [],
                },
                D7: {
                  id: 'D7', primitiveId: 'LIB-MPRIM-SENSOR-NODE', kind: 'sensor', mechKind: 'sensorNode',
                  title: 'Shell GPS Tracker', x: 1160, y: 60,
                  body: 'GPS tracker inside the Shell. The trigger is based only on Shell location and dwell time.',
                  color: '#3EC6D6',
                  sensorType: 'GPS Zone',
                  zoneReference: 'Select GPS zone / geofence record',
                  inputRequired: 'Shell tracker enters the configured GPS zone.',
                  triggerCondition: 'Shell remains inside the configured GPS zone. No extra costume-state condition is required.',
                  frequencyLimitEnabled: true,
                  frequencyTriggerCount: 3,
                  frequencyTimePeriod: '10 minutes',
                  cooldownEnabled: true,
                  cooldownDuration: '2 minutes',
                  manualOverrideFallback: 'Crew can manually confirm the Shell is in the zone and trigger the MP3 reaction if GPS fails.',
                  reliability: '3',
                  nodeColor: '#3EC6D6',
                },
                D8: {
                  id: 'D8', primitiveId: 'LIB-MSUB-triggerDelay', kind: 'mechanicSubnode', subnodeKind: 'triggerDelay',
                  title: 'Dwell Delay', x: 1480, y: 60,
                  body: 'Requires the Shell to remain in the zone for X seconds before triggering audio.',
                  color: '#5CA8F5', icon: 'clock', category: 'gameplayModifiers', attachesTo: ['sensorNode', 'actuatorNode', '*'],
                  fields: {
                    purpose: 'Adds a delay before the sensor or actuator activates after the trigger condition is met.',
                    delayDuration: '30 seconds',
                    delayType: 'Fixed',
                  },
                },
                D10: {
                  id: 'D10', primitiveId: 'LIB-ITM-MACRODROID-PHONE', kind: 'objective', physicalKind: 'item', itemId: 'LIB-ITM-MACRODROID-PHONE',
                  title: 'MacroDroid Phone Bridge', x: 1810, y: 150,
                  body: 'Phone receives or evaluates the GPS trigger and runs the macro that plays the selected MP3.',
                  color: '#3EC6D6',
                  refs: { itemIds: ['LIB-ITM-MACRODROID-PHONE'], sensorIds: [], mechanicIds: [] },
                },
                D11: {
                  id: 'D11', primitiveId: 'LIB-MPRIM-ACTUATOR-NODE', kind: 'mechanic', mechKind: 'actuatorNode',
                  title: 'Play MP3 Reaction', x: 2140, y: 150,
                  body: 'Audio actuator: play one MP3 file through the paired speaker.',
                  color: '#5CA8F5',
                  actuatorType: 'Sound',
                  audioFileRef: 'reaction.mp3',
                  frequencyLimitEnabled: true,
                  frequencyTriggerCount: 3,
                  frequencyTimePeriod: '10 minutes',
                  cooldownEnabled: true,
                  cooldownDuration: '2 minutes',
                  outputDuration: 'Length of selected MP3',
                  outputIntensity: 'Speaker volume set for the play area.',
                  outputRhythm: 'Single MP3 playback. No random voice categories or narrative line selection.',
                  resetBehavior: 'Ready for the next trigger after the built-in cooldown.',
                  manualOverrideFallback: 'Crew can play the same MP3 manually from the phone or backup speaker if the actuator chain fails.',
                  nodeColor: '#5CA8F5',
                },
              },
              edges: [
                { from: 'D1', to: 'D6', label: 'costume piece', color: null },
                { from: 'D2', to: 'D6', label: 'costume piece', color: null },
                { from: 'D3', to: 'D6', label: 'costume piece', color: null },
                { from: 'D4', to: 'D6', label: 'costume piece', color: null },
                { from: 'D5', to: 'D7', label: 'contains GPS', color: null },
                { from: 'D7', to: 'D8', label: 'zone entered', color: null },
                { from: 'D8', to: 'D10', label: 'after dwell time / allowed trigger', color: null },
                { from: 'D10', to: 'D11', label: 'play MP3', color: null },
              ],
              frames: {
                F1: { id: 'F1', label: 'Costume Story Items', x: 20, y: 30, w: 800, h: 390, color: '#43BF87' },
                F2: { id: 'F2', label: 'Shell GPS trigger logic', x: 1080, y: 30, w: 720, h: 420, color: '#3EC6D6' },
                F3: { id: 'F3', label: 'Phone bridge and MP3 output', x: 1780, y: 80, w: 610, h: 310, color: '#5CA8F5' },
              },
            },
          },
        },
        edges: [],
        frames: {
          F1: { id: 'F1', label: 'Reusable mechanics container', x: 35, y: 55, w: 430, h: 260, color: '#8B7BF5' },
        },
      },
    },
    // ADDITIONAL NODE TEMPLATES ("concepts"): Pip-Decks-style containers. The
    // two premades ship filled; "Create new …" versions start completely empty.
    // The library template always keeps its canonical name — substitutions
    // (dragon → debt, city → home …) live only inside a specific game.
    concepts: {
      'LIB-CPT-DRAGON': {
        id: 'LIB-CPT-DRAGON', category: 'storyConcept', name: 'Dragon & the City', premade: true,
        description: 'The classic threat-versus-home frame: name the Dragon, name the City, and every event gains stakes. Swap in your own dragon (a debt, a rival crew, a storm) per game.',
        questions: DRAGON_QUESTIONS,
        example: {
          dragon: 'The creditor syndicate calling in the district’s debts.',
          city: 'The riverside market street where every player faction trades.',
          wants: 'The deeds to the street — tonight, before the festival crowd arrives.',
          weakness: 'Its enforcers won’t act in front of witnesses.',
          defenders: 'The stallholders’ council; they must give up their secret ledger.',
          stakes: 'The market is bought out and the community scattered.',
        },
        nodes: {
          S1: { id: 'S1', kind: 'character', title: 'The Dragon', x: 40, y: 60, body: 'The looming threat. Cast it per game: creditor, rival, storm, plague.', color: null },
          S2: { id: 'S2', kind: 'storyLocation', title: 'The City', x: 40, y: 260, body: 'What is worth protecting — a place, a community, a way of life.', color: null },
          S3: { id: 'S3', kind: 'event', title: 'First Tribute', x: 340, y: 160, body: 'The Dragon takes something small. The defenders feel the shape of the threat.', color: null },
          S4: { id: 'S4', kind: 'quest', title: 'Find the Weakness', x: 640, y: 60, body: 'Players hunt the Dragon’s price or blind spot.', color: null },
          S5: { id: 'S5', kind: 'event', title: 'The Confrontation', x: 640, y: 260, body: 'The City stands or falls. Use Outcome Branches, never pass/fail.', color: null },
        },
        edges: [
          { from: 'S1', to: 'S3', label: 'threatens', color: null },
          { from: 'S2', to: 'S3', label: 'suffers', color: null },
          { from: 'S3', to: 'S4', label: 'provokes', color: null },
          { from: 'S4', to: 'S5', label: 'armed with truth', color: null },
        ],
      },
      'LIB-CPT-HERO': {
        id: 'LIB-CPT-HERO', category: 'characterConcept', name: 'Hero & Guide', premade: true,
        description: 'A protagonist paired with a mentor figure who gives a gift — at a cost. Bind a player (or team) to the Hero role and an NPC actor to the Guide.',
        questions: HERO_GUIDE_QUESTIONS,
        example: {
          hero: 'The newest courier on the crew — the players’ own team.',
          guide: 'Quartermaster Mank, who has seen this dragon before.',
          gift: 'The old route map through the flooded tunnels.',
          cost: 'He never says what happened to the last crew he gave it to.',
        },
        nodes: {
          S1: { id: 'S1', kind: 'character', title: 'The Hero', x: 40, y: 60, body: 'Whose story is this? Bind to a player team.', color: null },
          S2: { id: 'S2', kind: 'character', title: 'The Guide', x: 40, y: 260, body: 'The mentor. Cast an NPC actor; author intent + key lines, not scripts.', color: null },
          S3: { id: 'S3', kind: 'event', title: 'The Gift', x: 340, y: 160, body: 'The Guide hands over the tool, lesson or map — and names no price.', color: null },
          S4: { id: 'S4', kind: 'event', title: 'The Price Revealed', x: 640, y: 160, body: 'What the help really cost. Attach a Relationship / Status Change.', color: null },
        },
        edges: [
          { from: 'S2', to: 'S3', label: 'offers', color: null },
          { from: 'S1', to: 'S3', label: 'accepts', color: null },
          { from: 'S3', to: 'S4', label: 'later', color: null },
        ],
      },
    },
  };
}

export function makeEmptyProject(name = 'Untitled game') {
  return {
    rev: SEED_REV,
    // Per-game backdrop images are controlled separately for the application
    // header and the main content/canvas area.
    meta: {
      name, prefix: 'GAME', createdAt: Date.now(),
      backdrops: {
        header: { image: null, opacity: 0.34 },
        content: { image: null, opacity: 0.25 },
      },
      timeline: { startMin: 540, endMin: 1020 }, timelineStep: 30, gmRuleIds: [],
      characterCardTemplate: cloneCharacterCardTemplateForSettings(),
    },
    items: {}, locations: {}, sensors: {}, mechanics: {}, facts: {}, nodes: {}, edges: [],
    subnodes: {}, frameworks: {}, frames: {}, numberMarkers: {}, titleMarkers: {},
    masterNodes: {}, masterEdges: [], masterFrames: {}, masterNumberMarkers: {}, masterTitleMarkers: {},
    storyDynamicsGraph: cloneDefaultStoryDynamicsGraph(),
    taskNodes: {}, taskEdges: [], taskFrames: {}, taskNumberMarkers: {}, taskTitleMarkers: {},
    storyboardNodes: {}, storyboardEdges: [], storyboardFrames: {}, storyboardNumberMarkers: {}, storyboardTitleMarkers: {},
    alignments: [], storyTrack: {}, teams: {}, players: {},
  };
}

function defaultMasterStory() {
  return {
    nodes: {
      'ACT-1': { id: 'ACT-1', kind: 'masterAct', title: 'Act 1 - The Briefing', x: 60, y: 60, body: 'Players receive the crash-site mission and enter Sector 7.', phaseNotes: 'Discovery phase: teams learn who thinks fast, who organizes, who takes risks, and who naturally follows.', color: null },
      'ACT-2': { id: 'ACT-2', kind: 'masterAct', title: 'Act 2 - The Key', x: 360, y: 60, body: 'The teams search the warehouse and recover the Cipher-Key.', phaseNotes: 'Role pressure phase: practical leaders, scouts, solvers, and cautious players start becoming visible.', color: null },
      'ACT-3': { id: 'ACT-3', kind: 'masterAct', title: 'Act 3 - The Decode', x: 660, y: 60, body: 'The Dataslate reveals the route and the deeper Chimera secret.', phaseNotes: 'Cooperation phase: teams must combine clues and notice whether specialists share control or hoard it.', color: null },
      'ACT-4': { id: 'ACT-4', kind: 'masterAct', title: 'Act 4 - The Turn', x: 960, y: 60, body: 'The false-flag intercept reframes who the teams can trust.', phaseNotes: 'Stress phase: trust, suspicion, and group hierarchy become explicit under uncertainty.', color: null },
      'ACT-5': { id: 'ACT-5', kind: 'masterAct', title: 'Act 5 - Extraction', x: 1260, y: 60, body: 'The teams call the beacon and escape before the operation collapses.', phaseNotes: 'Resolution phase: teams commit to a shared plan and reveal whether their earlier roles still hold.', color: null },
    },
    edges: [
      { from: 'ACT-1', to: 'ACT-2', label: 'mission begins', color: null },
      { from: 'ACT-2', to: 'ACT-3', label: 'key enables decode', color: null },
      { from: 'ACT-3', to: 'ACT-4', label: 'truth surfaces', color: null },
      { from: 'ACT-4', to: 'ACT-5', label: 'final push', color: null },
    ],
  };
}

function storyboardFromTaskGraph(taskNodes = {}, taskEdges = []) {
  const nodes = {};
  for (const n of Object.values(taskNodes || {})) {
    if (n.kind !== 'task' && n.kind !== 'travel') continue;
    const { sub, ...item } = n;
    nodes[n.id] = { ...item };
  }
  const edges = (taskEdges || []).filter((e) => nodes[e.from] && nodes[e.to]);
  return { nodes, edges };
}

// Additive project migration: preserve the open game across schema bumps by
// backfilling any collections/fields added in later revs (e.g. `facts`) instead
// of discarding user work. Corrupt/empty saves fall back to a fresh demo.
export function migrateProject(saved) {
  if (!saved || typeof saved !== 'object' || !saved.meta || !saved.nodes) return makeProjectSeed();
  const base = makeEmptyProject(saved.meta.name || 'Untitled game');
  const merged = { ...saved };
  for (const key of Object.keys(base)) {
    if (merged[key] === undefined) merged[key] = base[key];
  }
  const migratedTaskGraph = migrateActionGraph({ nodes: merged.taskNodes || {}, edges: merged.taskEdges || [] });
  merged.taskNodes = migratedTaskGraph.nodes;
  merged.taskEdges = migratedTaskGraph.edges;
  const taskNodeValues = Object.values(merged.taskNodes);
  const visibleMechanicNodes = taskNodeValues.filter((node) => node.kind !== 'travel');
  if (
    saved.taskNodes !== undefined
    && merged.meta.name === 'Operation Chimera'
    && !taskNodeValues.some((node) => node.kind === 'task')
    && visibleMechanicNodes.length <= 2
    && visibleMechanicNodes.every((node) => node.mechKind === 'action')
  ) {
    const storyboardTasks = Object.fromEntries(Object.entries(merged.storyboardNodes || {})
      .filter(([, node]) => node.kind === 'task'));
    if (Object.keys(storyboardTasks).length) {
      merged.taskNodes = { ...storyboardTasks, ...merged.taskNodes };
      const restoredIds = new Set(Object.keys(merged.taskNodes));
      const restoredEdges = (merged.storyboardEdges || []).filter((edge) => restoredIds.has(edge.from) && restoredIds.has(edge.to));
      merged.taskEdges = [...restoredEdges, ...merged.taskEdges];
    }
  }
  const plainTestActions = Object.values(merged.taskNodes).filter((node) => (
    node.mechKind === 'action'
    && node.title === 'Action'
    && node.body === 'One atomic physical, cognitive, or social step performed by a player or team.'
  ));
  const hasMacroDroidBridge = Object.values(merged.taskNodes).some((node) => node.itemId === 'LIB-ITM-MACRODROID-PHONE');
  const restoredTaskCount = Object.values(merged.taskNodes).filter((node) => node.kind === 'task').length;
  if (merged.meta.name === 'Operation Chimera' && restoredTaskCount === 4 && !hasMacroDroidBridge && plainTestActions.length === 1) {
    const testActionId = plainTestActions[0].id;
    const { [testActionId]: _temporaryAction, ...keptNodes } = merged.taskNodes;
    const macroId = 'CHM-TSK-MACRODROID';
    merged.taskNodes = {
      ...keptNodes,
      [macroId]: {
        id: macroId,
        primitiveId: 'LIB-ITM-MACRODROID-PHONE',
        kind: 'objective',
        physicalKind: 'item',
        itemId: 'LIB-ITM-MACRODROID-PHONE',
        title: 'MacroDroid Phone Bridge',
        x: 1000,
        y: 190,
        body: 'Android phone running MacroDroid to receive the GPS trigger and play the assigned MP3 through a speaker.',
        color: '#3EC6D6',
        refs: { itemIds: ['LIB-ITM-MACRODROID-PHONE'], sensorIds: [], mechanicIds: [] },
      },
    };
    merged.taskEdges = merged.taskEdges.filter((edge) => edge.from !== testActionId && edge.to !== testActionId);
  }
  for (const key of ['storyDynamicsNodes', 'storyDynamicsEdges', 'storyDynamicsFrames', 'storyDynamicsNumberMarkers', 'storyDynamicsTitleMarkers']) {
    delete merged[key];
  }
  if (!saved.masterNodes) {
    const master = defaultMasterStory();
    merged.masterNodes = master.nodes;
    merged.masterEdges = master.edges;
    const legacyAlign = { 'N-BRIEF': 'ACT-1', 'N-KEY': 'ACT-2', 'N-DECRYPT': 'ACT-3', 'N-TWIST': 'ACT-4', 'N-END': 'ACT-5' };
    merged.alignments = (merged.alignments || [])
      .map((a) => ({ ...a, story: legacyAlign[a.story] || a.story }))
      .filter((a) => merged.masterNodes[a.story]);
  }
  if (!saved.storyboardNodes) {
    const storyboard = storyboardFromTaskGraph(saved.taskNodes || {}, saved.taskEdges || []);
    merged.storyboardNodes = storyboard.nodes;
    merged.storyboardEdges = storyboard.edges;
    merged.storyboardFrames = {};
  }
  if (!merged.meta.backdrops) {
    const hero = merged.meta.hero || {};
    const image = hero.image || null;
    const opacity = hero.opacity ?? 0.25;
    merged.meta = {
      ...merged.meta,
      backdrops: {
        header: { image: hero.placement === 'content' ? null : image, opacity: hero.placement === 'content' ? 0.34 : opacity },
        content: { image, opacity },
      },
    };
  } else {
    merged.meta = {
      ...merged.meta,
      backdrops: {
        header: { image: null, opacity: 0.34, ...(merged.meta.backdrops.header || {}) },
        content: { image: null, opacity: 0.25, ...(merged.meta.backdrops.content || {}) },
      },
    };
  }
  if (!Array.isArray(merged.meta.gmRuleIds)) {
    merged.meta = { ...merged.meta, gmRuleIds: ['LIB-GMR-001', 'LIB-GMR-002', 'LIB-GMR-003'] };
  }
  if (!merged.meta.characterCardTemplate) {
    merged.meta = { ...merged.meta, characterCardTemplate: cloneCharacterCardTemplateForSettings() };
  } else {
    merged.meta = {
      ...merged.meta,
      characterCardTemplate: {
        questions: sanitizeCharacterQuestions(merged.meta.characterCardTemplate.questions || DEFAULT_CHARACTER_CARD_TEMPLATE.questions),
        typeGroups: sanitizeCharacterTypeGroups(merged.meta.characterCardTemplate.typeGroups || DEFAULT_CHARACTER_CARD_TEMPLATE.typeGroups),
      },
    };
  }
  merged.rev = SEED_REV;
  return merged;
}

// Demo game: Operation Chimera, built from the library templates above.
export function makeProjectSeed() {
  const master = defaultMasterStory();
  const dynamics = cloneDefaultStoryDynamicsGraph();
  return {
    rev: SEED_REV,
    meta: {
      name: 'Operation Chimera', prefix: 'CHM', createdAt: Date.now(),
      backdrops: {
        header: { image: null, opacity: 0.34 },
        content: { image: null, opacity: 0.25 },
      },
      timeline: { startMin: 540, endMin: 1020 }, timelineStep: 30,
      gmRuleIds: ['LIB-GMR-001', 'LIB-GMR-002', 'LIB-GMR-003'],
      characterCardTemplate: cloneCharacterCardTemplateForSettings(),
    },

    // Sensor hardware INSTANCES: template + game state (status, placement,
    // assignment, battery).
    sensors: {
      'RFID-07': { id: 'RFID-07', templateId: 'LIB-SEN-NFC', kind: 'NFC reader', label: 'Locker 12 reader', status: 'online', locationId: 'LOC-S7', assignedTo: null, battery: 92 },
      'NFC-03': { id: 'NFC-03', templateId: 'LIB-SEN-NFC', kind: 'NFC reader', label: 'Dataslate dock', status: 'online', locationId: 'LOC-S7', assignedTo: null, battery: 88 },
      'BTN-11': { id: 'BTN-11', templateId: 'LIB-SEN-BTN', kind: 'Button box', label: 'Cipher button box', status: 'offline', locationId: 'LOC-COMMS', assignedTo: null, battery: 15 },
      'MOT-04': { id: 'MOT-04', templateId: 'LIB-SEN-MOT', kind: 'Motion sensor', label: 'North door motion', status: 'offline', locationId: 'LOC-S7', assignedTo: null, battery: 0 },
      'PRX-02': { id: 'PRX-02', templateId: 'LIB-SEN-PRX', kind: 'Proximity sensor', label: 'Gate proximity', status: 'online', locationId: 'LOC-S8', assignedTo: null, battery: 76 },
      'RF-01': { id: 'RF-01', templateId: 'LIB-SEN-RF', kind: 'RF beacon', label: 'Extraction beacon RX', status: 'unplaced', locationId: null, assignedTo: null, battery: 100 },
    },

    locations: {
      'LOC-S7': {
        id: 'LOC-S7', templateId: 'LIB-LOC-001', name: 'Sector 7 Warehouse', zone: 'Act 1',
        notes: 'Main quest area. Two patrol routes, locker corridor, marked safety zone.',
        safety: 'Fire exits east + west. No running on the mezzanine.', image: null, schematic: null,
        sensorIds: ['RFID-07', 'NFC-03', 'MOT-04'],
        mapKind: 'schematic', osm: { ...DEFAULT_OSM },
        markers: [
          { id: 'M1', kind: 'item', refId: 'CHM-A-004', x: 62, y: 48 },
          { id: 'M2', kind: 'item', refId: 'CHM-A-007', x: 96, y: 30 },
          { id: 'M3', kind: 'sensor', refId: 'RFID-07', x: 66, y: 54 },
          { id: 'M4', kind: 'sensor', refId: 'NFC-03', x: 100, y: 36 },
          { id: 'M5', kind: 'sensor', refId: 'MOT-04', x: 30, y: 12 },
        ],
        arrows: [
          { id: 'A1', x1: 14, y1: 78, x2: 58, y2: 52 },
          { id: 'A2', x1: 66, y1: 50, x2: 94, y2: 34 },
        ],
      },
      'LOC-S8': {
        id: 'LOC-S8', templateId: 'LIB-LOC-002', name: 'Sector 8 Gate', zone: 'Act 2',
        notes: 'Locked until quest flag key_obtained.', safety: 'Gate is heavy — crew operates it, never players.',
        image: null, schematic: null, sensorIds: ['PRX-02'],
        mapKind: 'osm', osm: { ...DEFAULT_OSM },
        markers: [{ id: 'M1', kind: 'sensor', refId: 'PRX-02', x: 80, y: 45 }],
        arrows: [],
      },
      'LOC-COMMS': { id: 'LOC-COMMS', templateId: 'LIB-LOC-003', name: 'Comms Bench', zone: 'Act 2', notes: 'Decryption puzzle station with cipher button box.', safety: 'Cable run taped down; check before game.', image: null, schematic: null, sensorIds: ['BTN-11'], ...locationMapDefaults() },
      'LOC-MED': { id: 'LOC-MED', templateId: 'LIB-LOC-004', name: 'Med Bay (safe zone)', zone: 'All acts', notes: 'Out-of-game rest area + revive mechanic station.', safety: 'Always out-of-game. Real first aid kit lives here.', image: null, schematic: null, sensorIds: [], ...locationMapDefaults() },
    },

    // Item INSTANCES: template fields copied at import time + game state.
    items: {
      'CHM-A-004': { id: 'CHM-A-004', templateId: 'LIB-ITM-001', name: 'Cipher-Key', type: 'artifact', buildStatus: 'tested', availability: 'ready', description: 'An ancient-looking brass key used for unlocking the central server room.', propNotes: 'Heavy brass key, detailed engravings. Spare taped inside GM binder p.12.', loreNotes: 'Rumored to be made from meteoritic iron.', locationId: 'LOC-S7', mechanicIds: ['LIB-MECH-LOCK'], sensorReqs: [{ sensorId: 'RFID-07', note: 'confirms pickup, fires key_obtained' }], image: null, assignedTo: null },
      'CHM-A-007': { id: 'CHM-A-007', templateId: 'LIB-ITM-002', name: 'Encrypted Dataslate', type: 'artifact', buildStatus: 'build', availability: 'ready', description: 'A weathered military dataslate containing corrupted operational data. Needs to be decoded.', propNotes: 'Custom plastic + metal case, low-res OLED, four buttons. Battery 2×AA — swap before game.', loreNotes: "Recovered from a crash site; rumored to hold the 'Operation Chimera' flight path.", locationId: 'LOC-S7', mechanicIds: ['LIB-MECH-DECRYPT', 'LIB-MECH-COMMS'], sensorReqs: [{ sensorId: 'NFC-03', note: 'dock detects slate placement' }, { sensorId: 'BTN-11', note: 'cipher input during decryption' }], image: null, assignedTo: null },
      'CHM-G-012': { id: 'CHM-G-012', templateId: 'LIB-ITM-003', name: 'Serum Vial', type: 'gadget', buildStatus: 'packed', availability: 'ready', description: 'A glowing vial required for the antidote ritual.', propNotes: 'Glow vial, UV-reactive fluid. 3 spares in the med crate.', loreNotes: '', locationId: 'LOC-MED', mechanicIds: ['LIB-MECH-REVIVE'], sensorReqs: [], image: null, assignedTo: null },
      'CHM-A-002': { id: 'CHM-A-002', templateId: 'LIB-ITM-004', name: 'Old-school Key Card', type: 'artifact', buildStatus: 'packed', availability: 'ready', description: 'An embossed magstripe card that opens sector gates.', propNotes: 'Embossed magstripe card, weathered edges.', loreNotes: '', locationId: 'LOC-S8', mechanicIds: ['LIB-MECH-ACCESS'], sensorReqs: [{ sensorId: 'PRX-02', note: 'gate unlock check' }], image: null, assignedTo: null },
      'CHM-G-005': { id: 'CHM-G-005', templateId: 'LIB-ITM-005', name: 'Comms Unit A', type: 'gadget', buildStatus: 'tested', availability: 'missing', description: 'Team radio tuned to the operation frequency.', propNotes: 'Repainted walkie, weathered. LAST SEEN: prop crate 2.', loreNotes: '', locationId: null, mechanicIds: ['LIB-MECH-COMMS'], sensorReqs: [], image: null, assignedTo: null },
      'CHM-G-018': { id: 'CHM-G-018', templateId: 'LIB-ITM-006', name: 'Signal Beacon', type: 'gadget', buildStatus: 'build', availability: 'ready', description: 'Extraction call-in beacon for the finale.', propNotes: '3D-printed shell, ESP32 + LED ring. Needs field test.', loreNotes: '', locationId: 'LOC-S8', mechanicIds: [], sensorReqs: [{ sensorId: 'RF-01', note: 'GM console receiver' }], image: null, assignedTo: null },
      'CHM-G-001': { id: 'CHM-G-001', templateId: 'LIB-ITM-007', name: 'UV Torch', type: 'gadget', buildStatus: 'packed', availability: 'ready', description: 'Reveals hidden ink markings.', propNotes: 'Consumer UV flashlight ×4, batteries fresh.', loreNotes: '', locationId: null, mechanicIds: ['LIB-MECH-UV'], sensorReqs: [], image: null, assignedTo: null },
      'CHM-C-009': { id: 'CHM-C-009', templateId: 'LIB-ITM-008', name: 'Medkit Prop', type: 'consumable', buildStatus: 'packed', availability: 'ready', description: 'Revive kit: bandage cards + ritual instructions.', propNotes: 'Surplus pouch, 12 bandage cards.', loreNotes: '', locationId: 'LOC-MED', mechanicIds: ['LIB-MECH-REVIVE'], sensorReqs: [], image: null, assignedTo: null },
    },

    // FACTS: the real-world states this game tracks. Branch gates reference
    // these in plain language; a GM or the bound sensor decides at runtime.
    facts: {
      'F-KEY': { id: 'F-KEY', name: 'Cipher-Key retrieved', kind: 'physical', detail: 'A team physically holds the brass Cipher-Key.', sensorId: 'RFID-07' },
      'F-DECODE': { id: 'F-DECODE', name: 'Dataslate decoded', kind: 'knowledge', detail: 'A team solved the cipher and read the Chimera flight path.', sensorId: null },
      'F-GATE': { id: 'F-GATE', name: 'Sector 8 gate open', kind: 'sensor', detail: 'Gate proximity loop reports the gate has opened.', sensorId: 'PRX-02' },
      'F-ALARM': { id: 'F-ALARM', name: 'Alarm raised', kind: 'progress', detail: 'A failed breach tripped the warehouse alarm; patrols reroute.', sensorId: 'MOT-04' },
      'F-TRAITOR': { id: 'F-TRAITOR', name: 'Contact exposed as double agent', kind: 'npc', detail: 'The trusted contact has been revealed as feeding the other faction.', sensorId: null },
    },

    // Game mechanic INSTANCES: imported from the library, then micro-adjusted
    // for this specific game. Note the Server Room Door needs 4 switches here,
    // while its library blueprint (LIB-MECH-ACCESS) still defaults to 1.
    mechanics: {
      'CHM-MECH-01': { id: 'CHM-MECH-01', templateId: 'LIB-MECH-ACCESS', name: 'Server room door', summary: 'Four wall switches must be held to open the server room.', params: [{ key: 'switches', label: 'Switches required', value: '4' }] },
      'CHM-MECH-02': { id: 'CHM-MECH-02', templateId: 'LIB-MECH-DECRYPT', name: 'Dataslate decryption', summary: 'Cipher wheel on the comms bench; harder this game.', params: [{ key: 'hintAfter', label: 'Hint after tries', value: '5' }, { key: 'digits', label: 'Cipher digits', value: '6' }] },
    },

    // NARRATIVE WEAVER graph: Base Nodes (event / character / storyLocation /
    // item / quest), a collapsed Additional Node (concept), per-team lanes
    // (teamId), fact-setting nodes (sets[]) and fact-gated edges. Subnodes
    // enrich these nodes from the separate `subnodes` collection.
    nodes: {
      'N-BRIEF': {
        id: 'N-BRIEF', kind: 'event', title: 'Briefing', x: 40, y: 90, body: 'Teams receive the crash-site dossier and a sealed radio frequency.', color: null, teamId: null, sets: [], locationId: null, itemId: null, mechanicIds: [], sensorIds: [],
        // Double-click / Edit opens this node's internal detail graph.
        sub: {
          nodes: {
            D1: { id: 'D1', kind: 'event', title: 'Muster point', x: 40, y: 60, body: 'All teams gather at the loading dock, out-of-game, before the clock starts.', color: null },
            D2: { id: 'D2', kind: 'item', title: 'Dossier + sealed frequency', x: 340, y: 60, body: 'One printed dossier per team; radio frequency in a sealed envelope opened on the GM cue.', color: null },
            D3: { id: 'D3', kind: 'event', title: 'Cold-open read', x: 640, y: 60, body: 'GM reads the cold-open aloud; house lights drop to work-lights on the last line.', color: null },
          },
          edges: [{ from: 'D1', to: 'D2', label: 'hand out', color: null }, { from: 'D2', to: 'D3', label: 'then', color: null }],
        },
      },
      'N-S7': { id: 'N-S7', kind: 'storyLocation', title: 'Sector 7 Warehouse', x: 380, y: 40, body: '2 patrols · marked safety zone', color: null, teamId: null, sets: [], locationId: 'LOC-S7', itemId: null, mechanicIds: [], sensorIds: ['RFID-07', 'MOT-04'] },
      'N-KEY': { id: 'N-KEY', kind: 'quest', title: 'Retrieve Cipher-Key', x: 380, y: 300, body: 'Success unlocks Sector 8.', color: null, teamId: 'T-RAVEN', sets: [{ factId: 'F-KEY', to: 'set' }], locationId: 'LOC-S7', itemId: 'CHM-A-004', mechanicIds: ['LIB-MECH-LOCK'], sensorIds: ['RFID-07'] },
      'N-PATROL': { id: 'N-PATROL', kind: 'character', title: 'Security Patrols', x: 1060, y: 40, body: 'NPC crew: Mank +1 · Tier 2 · 7 min loop', color: null, teamId: null, sets: [], locationId: 'LOC-S7', itemId: null, mechanicIds: [], sensorIds: [] },
      'N-DECRYPT': { id: 'N-DECRYPT', kind: 'quest', title: 'Decrypt the Dataslate', x: 720, y: 360, body: 'Solve the cipher at the comms bench.', color: null, teamId: 'T-WOLF', sets: [{ factId: 'F-DECODE', to: 'set' }], locationId: 'LOC-COMMS', itemId: 'CHM-A-007', mechanicIds: ['LIB-MECH-DECRYPT'], sensorIds: ['BTN-11', 'NFC-03'] },
      'N-GATE': { id: 'N-GATE', kind: 'event', title: 'Sector 8 gate opens', x: 1060, y: 340, body: 'The gate answers — however the attempt went.', color: null, teamId: null, sets: [{ factId: 'F-GATE', to: 'set' }], locationId: 'LOC-S8', itemId: 'CHM-A-002', mechanicIds: ['LIB-MECH-ACCESS'], sensorIds: ['PRX-02'] },
      'N-TWIST': { id: 'N-TWIST', kind: 'event', title: 'False-flag intercept', x: 1060, y: 560, body: 'A radio intercept names one player team as "the decoys". Broadcast on comms at the act break.', color: null, teamId: null, sets: [{ factId: 'F-TRAITOR', to: 'set' }], locationId: null, itemId: null, mechanicIds: [], sensorIds: [] },
      'N-END': { id: 'N-END', kind: 'event', title: 'Extraction', x: 1400, y: 560, body: 'Teams call in the beacon and exfiltrate before the timer.', color: null, teamId: null, sets: [], locationId: null, itemId: null, mechanicIds: [], sensorIds: [] },
      // A collapsed Additional Node: the Dragon & the City story concept,
      // instantiated for this game (substitutions live in conceptAnswers).
      'N-CPT1': {
        id: 'N-CPT1', kind: 'concept', conceptKind: 'storyConcept', conceptId: 'LIB-CPT-DRAGON',
        title: 'Dragon & the City', x: 40, y: 430, body: '', color: null, teamId: null, sets: [], collapsed: true,
        conceptAnswers: { dragon: 'The creditor syndicate (played by the patrol crew).', city: 'The Sector 7 stallholders.' },
        sub: {
          nodes: {
            S1: { id: 'S1', kind: 'character', title: 'The Dragon', x: 40, y: 60, body: 'The looming threat. Cast it per game: creditor, rival, storm, plague.', color: null },
            S2: { id: 'S2', kind: 'storyLocation', title: 'The City', x: 40, y: 260, body: 'What is worth protecting — a place, a community, a way of life.', color: null },
            S3: { id: 'S3', kind: 'event', title: 'First Tribute', x: 340, y: 160, body: 'The Dragon takes something small. The defenders feel the shape of the threat.', color: null },
            S4: { id: 'S4', kind: 'quest', title: 'Find the Weakness', x: 640, y: 60, body: 'Players hunt the Dragon’s price or blind spot.', color: null },
            S5: { id: 'S5', kind: 'event', title: 'The Confrontation', x: 640, y: 260, body: 'The City stands or falls. Use Outcome Branches, never pass/fail.', color: null },
          },
          edges: [
            { from: 'S1', to: 'S3', label: 'threatens', color: null },
            { from: 'S2', to: 'S3', label: 'suffers', color: null },
            { from: 'S3', to: 'S4', label: 'provokes', color: null },
            { from: 'S4', to: 'S5', label: 'armed with truth', color: null },
          ],
        },
      },
    },

    // SUBNODES: precision enrichments. parentRef null = floating unattached on
    // the canvas; {nodeId} = attached to a node; {subnodeId, branchIndex?} =
    // child subnode (of a Relationship/State change, or of one Outcome branch).
    subnodes: {
      'SB-OB1': {
        id: 'SB-OB1', kind: 'outcomeBranches', title: 'Key attempt outcomes', x: 380, y: 560,
        parentRef: { nodeId: 'N-KEY' }, notes: '', keywords: [], history: [],
        mode: 'mixed', selectionType: 'single',
        branches: [
          { label: 'Clean lift (Yes, and…)', outcome: 'Key retrieved unseen; the patrol log still shows all-clear — a free head start.', mechanicId: 'LIB-MECH-LOCK' },
          { label: 'Noisy grab (Yes, but…)', outcome: 'Key retrieved, but the alarm reroutes the patrols toward the comms bench.', mechanicId: 'LIB-MECH-LOCK' },
          { label: 'Driven off (No, but…)', outcome: 'The key stays locked away, but a dropped patrol roster reveals the maintenance bypass.', mechanicId: null },
        ],
      },
      'SB-NR1': {
        id: 'SB-NR1', kind: 'narrativeResponse', title: 'Alarm aftermath', x: 700, y: 640,
        parentRef: { subnodeId: 'SB-OB1', branchIndex: 1 }, notes: '', keywords: [], history: [],
        text: 'Mank hears the alarm from the depot and quietly moves his ledger. Whoever visits him next finds him wary and the prices doubled.',
      },
      'SB-RC1': {
        id: 'SB-RC1', kind: 'relChange', title: 'Mank turns wary', x: 1060, y: 780,
        parentRef: { nodeId: 'N-TWIST' }, notes: '', keywords: [], history: [],
        relType: 'Trust', targets: 'Quartermaster Mank → the named team', direction: 'no-but', intensity: 'moderate',
        trigger: 'The intercept names the team as decoys.', effects: 'Mank stops trading with the named team unless they return his equipment first.', mechanicId: null,
      },
      'SB-ET1': {
        id: 'SB-ET1', kind: 'emotionalTone', title: 'Tone', x: 1360, y: 820,
        parentRef: { subnodeId: 'SB-RC1' }, notes: '', keywords: [], history: [],
        tags: ['Lingering Distrust', 'Quiet Hope'],
      },
      'SB-LA1': {
        id: 'SB-LA1', kind: 'locationArchetype', title: 'Warehouse identity', x: 700, y: 40,
        parentRef: { nodeId: 'N-S7' }, notes: '', keywords: [], history: [],
        archetype: 'Good Place to Defend', influence: 'Events here favor holding ground and ambush framing; quests here should reward preparation.',
      },
      // Floating, deliberately unattached — drag-link it when you decide where
      // grief lands in this run.
      'SB-IS1': {
        id: 'SB-IS1', kind: 'internalState', title: 'Grief (unassigned)', x: 1400, y: 90,
        parentRef: null, notes: 'Attach to whichever character loses the most in Act 2.', keywords: [], history: [],
        stateType: 'Grief', level: 'rising', trigger: 'The loss at the act break.', effects: 'The character refuses comms and must be met face to face.', mechanicId: null,
      },
    },

    // FRAMES: purely visual grouping. Moving a frame moves everything whose
    // center sits inside it; connections and data are unaffected.
    frames: {
      'FR-1': { id: 'FR-1', label: 'Act 1 — the key', x: 20, y: 10, w: 660, h: 700, color: '#5CA8F5' },
    },
    // Edges: `label` is the plain-language condition (a GM reads it). A gate
    // may also carry factId + expect ('set'|'unset'). Edges may start from an
    // Outcome Branches subnode — that is how branch paths merge back into
    // later nodes (multi-path merging happens on the canvas).
    edges: [
      { from: 'N-BRIEF', to: 'N-S7', label: 'game start', kindColor: 'event' },
      { from: 'N-S7', to: 'N-KEY', label: 'locker corridor', kindColor: 'storyLocation' },
      { from: 'SB-OB1', to: 'N-PATROL', label: 'Noisy grab', kindColor: 'character', factId: 'F-ALARM', expect: 'set' },
      { from: 'SB-OB1', to: 'N-DECRYPT', label: 'any key branch', kindColor: 'quest' },
      { from: 'N-KEY', to: 'N-GATE', label: 'IF Cipher-Key retrieved', kindColor: 'event', factId: 'F-KEY', expect: 'set' },
      { from: 'N-DECRYPT', to: 'N-GATE', label: 'REQUIRES decode', kindColor: 'quest', factId: 'F-DECODE', expect: 'set' },
      { from: 'N-GATE', to: 'N-TWIST', label: 'act break', kindColor: 'event' },
      { from: 'N-TWIST', to: 'N-END', label: 'the turn', kindColor: 'event', factId: 'F-TRAITOR', expect: 'set' },
    ],
    // MASTER STORY: a short macro act-track separate from the detailed
    // Narrative Weaver graph. It gives the game its theater-like backbone.
    masterNodes: master.nodes,
    masterEdges: master.edges,
    storyDynamicsGraph: dynamics,
    // Weaver alignments: macro story acts ↔ the physical tasks they are tied to.
    alignments: [
      { story: 'ACT-1', task: 'TSK-1' },
      { story: 'ACT-2', task: 'TSK-2' },
      { story: 'ACT-5', task: 'TSK-4' },
    ],
    // Weaver left-panel layout for the macro story track (nodeId → {x,y}).
    storyTrack: {
      'N-BRIEF': { x: 60, y: 40 }, 'N-KEY': { x: 60, y: 200 }, 'N-GATE': { x: 60, y: 360 },
      'N-TWIST': { x: 340, y: 40 }, 'N-END': { x: 340, y: 200 },
    },

    // TASKS: the surface task flow (linear + branching). Each task node carries
    // its own nested `sub` detail graph — double-click a task to open it and
    // spec where to stand, how many tries, props, powers, effects.
    taskNodes: {
      'TSK-1': { id: 'TSK-1', kind: 'task', title: 'Assemble at Sector 7', x: 40, y: 200, startMin: 540, durationMin: 30, body: 'All teams reach the warehouse floor and check in.', color: null },
      'TRV-1': { id: 'TRV-1', kind: 'travel', title: 'Travel to locker corridor', x: 200, y: 260, startMin: 570, durationMin: 15, marginAfterMin: 10, body: 'Move from briefing zone to bay 12. Some teams may walk, jog, detour, or get briefly lost.', color: null },
      'TSK-2': { id: 'TSK-2', kind: 'task', title: 'Retrieve the Cipher-Key', x: 360, y: 200, startMin: 600, durationMin: 45, body: 'Recover the brass key from the locker corridor.', color: null,
        sub: {
          nodes: {
            D1: { id: 'D1', kind: 'placement', title: 'Locker corridor, bay 12', x: 40, y: 60, body: 'Key sits in locker 12; approach from the south aisle only.', color: null },
            D2: { id: 'D2', kind: 'rule', title: '3 pick attempts', x: 340, y: 60, body: 'Three tries on the practice lock; a third failure raises the alarm.', color: null },
            D3: { id: 'D3', kind: 'prop', title: 'Brass key + NFC tag', x: 640, y: 60, body: 'Cast brass key with an NFC tag; the reader confirms pickup.', color: null },
          },
          edges: [{ from: 'D1', to: 'D2', label: 'on arrival', color: null }, { from: 'D2', to: 'D3', label: 'on success', color: null }],
        } },
      'TRV-2': { id: 'TRV-2', kind: 'travel', title: 'Cross to comms bench', x: 540, y: 260, startMin: 650, durationMin: 20, marginAfterMin: 15, body: 'Route choice between warehouse lanes and the comms bench. Delay covers crowds, wrong turns, and waiting for a clear path.', color: null },
      'TSK-3': { id: 'TSK-3', kind: 'task', title: 'Decode the Dataslate', x: 680, y: 90, startMin: 780, durationMin: 60, body: 'Solve the cipher at the comms bench.', color: null },
      'TSK-4': { id: 'TSK-4', kind: 'task', title: 'Score the extraction beacon', x: 680, y: 320, startMin: 900, durationMin: 45, body: 'Land the beacon in the extraction crate to call exfil.', color: null,
        sub: {
          nodes: {
            D1: { id: 'D1', kind: 'placement', title: 'Throw line: 3 m from the crate', x: 40, y: 40, body: 'Tape a throw line 3 metres from the net crate; feet behind the line.', color: null },
            D2: { id: 'D2', kind: 'rule', title: '3 attempts · must land inside', x: 340, y: 40, body: 'Three throws; the foam beacon must come to rest inside the crate. Regulation soft ball only.', color: null },
            D3: { id: 'D3', kind: 'prop', title: 'Foam beacon ×2, net crate', x: 640, y: 40, body: 'Two foam beacon props (one spare), one open-top net crate.', color: null },
            D4: { id: 'D4', kind: 'power', title: 'Raven: one re-throw', x: 340, y: 220, body: 'If Team Raven never used their lockpick kit, they may re-take one failed throw.', color: null },
            D5: { id: 'D5', kind: 'effect', title: 'Success: green ring + siren', x: 640, y: 220, body: 'On a good landing: beacon LED ring turns green and a short siren plays on comms.', color: null },
          },
          edges: [
            { from: 'D1', to: 'D2', label: 'setup', color: null },
            { from: 'D2', to: 'D3', label: 'needs', color: null },
            { from: 'D2', to: 'D4', label: 'if eligible', color: null },
            { from: 'D2', to: 'D5', label: 'on success', color: null },
          ],
        } },
    },
    taskEdges: [
      { from: 'TSK-1', to: 'TSK-2', label: 'assembled', color: null },
      { from: 'TSK-2', to: 'TSK-3', label: 'key in hand → decode', color: null },
      { from: 'TSK-2', to: 'TSK-4', label: 'or skip straight to exfil', color: null },
      { from: 'TSK-3', to: 'TSK-4', label: 'decoded', color: null },
    ],

    taskFrames: {},
    taskNumberMarkers: {},
    taskTitleMarkers: {},

    // MASTER STORYBOARD TIMELINE: stable task/travel schedule bars used by
    // Master Story only. These are deliberately detached from Mechanics Weaver
    // schematics, so editing mechanic nodes cannot move/delete the storyboard.
    storyboardNodes: {
      'TSK-1': { id: 'TSK-1', kind: 'task', title: 'Assemble at Sector 7', x: 40, y: 200, startMin: 540, durationMin: 30, body: 'All teams reach the warehouse floor and check in.', color: null },
      'TRV-1': { id: 'TRV-1', kind: 'travel', title: 'Travel to locker corridor', x: 200, y: 260, startMin: 570, durationMin: 15, marginAfterMin: 10, body: 'Move from briefing zone to bay 12. Some teams may walk, jog, detour, or get briefly lost.', color: null },
      'TSK-2': { id: 'TSK-2', kind: 'task', title: 'Retrieve the Cipher-Key', x: 360, y: 200, startMin: 600, durationMin: 45, body: 'Recover the brass key from the locker corridor.', color: null },
      'TRV-2': { id: 'TRV-2', kind: 'travel', title: 'Cross to comms bench', x: 540, y: 260, startMin: 650, durationMin: 20, marginAfterMin: 15, body: 'Route choice between warehouse lanes and the comms bench. Delay covers crowds, wrong turns, and waiting for a clear path.', color: null },
      'TSK-3': { id: 'TSK-3', kind: 'task', title: 'Decode the Dataslate', x: 680, y: 90, startMin: 780, durationMin: 60, body: 'Solve the cipher at the comms bench.', color: null },
      'TSK-4': { id: 'TSK-4', kind: 'task', title: 'Score the extraction beacon', x: 680, y: 320, startMin: 900, durationMin: 45, body: 'Land the beacon in the extraction crate to call exfil.', color: null },
    },
    storyboardEdges: [
      { from: 'TSK-1', to: 'TSK-2', label: 'assembled', color: null },
      { from: 'TSK-2', to: 'TSK-3', label: 'key in hand -> decode', color: null },
      { from: 'TSK-2', to: 'TSK-4', label: 'or skip straight to exfil', color: null },
      { from: 'TSK-3', to: 'TSK-4', label: 'decoded', color: null },
    ],
    storyboardFrames: {},
    masterFrames: {},
    storyboardNumberMarkers: {},
    masterNumberMarkers: {},
    storyboardTitleMarkers: {},
    masterTitleMarkers: {},

    teams: {
      'T-RAVEN': { id: 'T-RAVEN', name: 'Team Raven', color: '#5CA8F5', focus: 'Infiltration specialists · returning crew' },
      'T-WOLF': { id: 'T-WOLF', name: 'Team Wolfpack', color: '#E0A23C', focus: 'Puzzle-heavy playstyle · mixed experience' },
      'T-CINDER': { id: 'T-CINDER', name: 'Team Cinder', color: '#A87BF0', focus: 'First-timers · assign shepherd NPC' },
    },
    players: {
      'P-ELZA': { id: 'P-ELZA', name: 'Elza K.', initials: 'EK', role: 'Leader', teamId: 'T-RAVEN', flags: ['MED'] },
      'P-JANIS': { id: 'P-JANIS', name: 'Janis B.', initials: 'JB', role: 'Engineer', teamId: 'T-RAVEN', flags: [] },
      'P-LIENE': { id: 'P-LIENE', name: 'Liene S.', initials: 'LS', role: 'Medic', teamId: 'T-RAVEN', flags: [] },
      'P-ANNA': { id: 'P-ANNA', name: 'Anna V.', initials: 'AV', role: 'Leader', teamId: 'T-WOLF', flags: [] },
      'P-RIH': { id: 'P-RIH', name: 'Rihards D.', initials: 'RD', role: 'Decoder', teamId: 'T-WOLF', flags: [] },
      'P-KATE': { id: 'P-KATE', name: 'Kate P.', initials: 'KP', role: 'Medic', teamId: 'T-WOLF', flags: ['MED'] },
      'P-DAVIS': { id: 'P-DAVIS', name: 'Davis K.', initials: 'DK', role: 'Leader', teamId: 'T-CINDER', flags: [] },
      'P-SANITA': { id: 'P-SANITA', name: 'Sanita N.', initials: 'SN', role: 'Decoder', teamId: 'T-CINDER', flags: ['NEW'] },
    },
  };
}
