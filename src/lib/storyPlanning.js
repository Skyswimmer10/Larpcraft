export const STORY_IMPACTS = ['Shapes protagonist’s past', 'Triggers the main conflict', 'Explains the world state', 'Backstory only', 'Revealed mid-story', 'Revealed at climax', 'Shapes villain’s motivation', 'Foreshadows a later event', 'Direct plot turning point', 'Thematic significance', 'Changes a relationship', 'Changes what players know', 'Raises the stakes', 'Pays off an earlier setup'];
export const STORY_THEMES = ['Loyalty vs truth', 'Pragmatism vs idealism', 'Justice vs mercy', 'Power and corruption', 'Identity and belonging', 'Sacrifice and its cost', 'Freedom vs security', 'Redemption', 'Revenge', 'Hope', 'Survival', 'Fate vs free will'];
export const STORY_TONES = ['Winter night', 'Festival', 'Halloween', 'Mysterious', 'Playful', 'Hopeful', 'Unsettling', 'Tragic', 'Wonder', 'Tense'];
export const uniqueStoryTags = value => [...new Set((Array.isArray(value) ? value : []).filter(tag => typeof tag === 'string').map(tag => tag.trim()).filter(Boolean))];
export const storyDirection = (value = {}, inherited = {}) => ({ themes: uniqueStoryTags(value.themes ?? inherited.themes), tones: uniqueStoryTags(value.tones ?? inherited.tones) });

const stage = (id, title, symbol, color, questions) => ({ id, title, symbol, color, questions: questions.map(([id, prompt]) => ({ id, prompt })) });
const beginning = '#8fcbb3', pressure = '#deb974', change = '#bc9add', returning = '#83bbdb';
export const PLOT_STRUCTURES = [
  { id: 'journey12', label: 'Hero’s Journey', short: '12 stages', description: 'A familiar journey from ordinary life through challenge to a changed return. Adapt the stages to a team, faction or whole event.', stages: [
    stage('ordinary', 'Ordinary World', '⌂', beginning, [['life', 'What feels normal to the players or central characters?'], ['missing', 'What need, limit or imbalance is already present?']]),
    stage('call', 'Call to Adventure', '✦', beginning, [['disruption', 'What interrupts normal life and invites action?'], ['stakes', 'Why might the players care enough to respond?']]),
    stage('refusal', 'Refusal of the Call', '?', beginning, [['hesitation', 'What makes joining the adventure difficult or unwelcome?'], ['choice', 'What meaningful choice remains if they hesitate or refuse?']]),
    stage('mentor', 'Meeting the Mentor', '☷', beginning, [['help', 'Who or what offers guidance, tools or a different perspective?'], ['cost', 'What limit, condition or cost comes with that help?']]),
    stage('threshold', 'Crossing the Threshold', '↗', pressure, [['commitment', 'What action carries them into an unfamiliar situation?'], ['rules', 'What new rule or consequence becomes clear?']]),
    stage('tests', 'Tests, Allies and Enemies', '⚑', pressure, [['tests', 'What challenges let players test their approach?'], ['people', 'Who becomes an ally, an opponent or an uncertain connection?']]),
    stage('approach', 'Approach the Innermost Cave', '⌁', pressure, [['prepare', 'What must they discover, prepare or risk before the central challenge?'], ['tension', 'Which unresolved tension follows them into it?']]),
    stage('ordeal', 'Ordeal', '◇', change, [['pressure', 'What central crisis puts their commitments under pressure?'], ['agency', 'How can different player choices change its outcome?']]),
    stage('reward', 'Reward', '☆', change, [['gain', 'What do they gain, learn or recover?'], ['price', 'What price or responsibility accompanies that gain?']]),
    stage('road', 'The Road Back', '↶', returning, [['return', 'What draws them toward a return or a final resolution?'], ['consequence', 'Which consequence of their earlier actions catches up with them?']]),
    stage('resurrection', 'Resurrection', '☀', returning, [['test', 'What final test reveals whether anything has changed?'], ['difference', 'How might they now act differently from the beginning?']]),
    stage('elixir', 'Return with the Elixir', '⌂', returning, [['lasting', 'What lasting change do they bring back to their people or world?'], ['ending', 'What can players see, do or share to experience that ending?']]),
  ] },
  { id: 'event6', label: 'Event arc', short: '6 stages', description: 'A compact event-planning variant: establish, invite, explore, pressure, decide, and see the consequences.', stages: [
    stage('ground', 'Establish the world', '⌂', beginning, [['normal', 'What situation do players enter?'], ['tension', 'What tension is already waiting beneath it?']]),
    stage('invite', 'Invite action', '✦', beginning, [['trigger', 'What asks the players to act?'], ['care', 'What gives them a personal or shared reason to care?']]),
    stage('explore', 'Explore and connect', '⚑', pressure, [['discover', 'What can they discover or try?'], ['connections', 'Which people, places or clues make those choices matter?']]),
    stage('pressure', 'Increase the pressure', '⌁', pressure, [['complication', 'What changes their understanding or makes the task harder?'], ['cost', 'What might they lose by waiting or choosing poorly?']]),
    stage('decide', 'Make the defining choice', '◇', change, [['decision', 'Which decision puts the central theme into action?'], ['outcomes', 'What different outcomes can the players bring about?']]),
    stage('aftermath', 'Experience the consequences', '☀', returning, [['change', 'What changes because of their actions?'], ['closure', 'Which threads close, and which deliberately remain open?']]),
  ] },
  { id: 'pressure5', label: 'Pressure and change', short: '5 stages', description: 'A shorter planning variant for an activity or focused story: situation, disruption, attempts, turning point, aftermath.', stages: [
    stage('situation', 'Situation', '⌂', beginning, [['start', 'What is happening when players arrive?'], ['want', 'What does someone want to preserve or change?']]),
    stage('disruption', 'Disruption', '✦', pressure, [['shift', 'What makes the current situation impossible to ignore?'], ['choice', 'What can players choose to do about it?']]),
    stage('attempts', 'Attempts and complications', '⌁', pressure, [['try', 'What approaches can players try?'], ['complication', 'How do the consequences complicate their next choice?']]),
    stage('turn', 'Turning point', '◇', change, [['turn', 'What decision or discovery changes the direction of the story?'], ['theme', 'Which value or tension does that moment expose?']]),
    stage('aftermath', 'Aftermath', '☀', returning, [['result', 'What is different after the turning point?'], ['closure', 'How will players recognise the outcome?']]),
  ] },
];

export function storyPlanning(value = {}) {
  return { ...value, direction: value.direction || {}, activeStructure: PLOT_STRUCTURES.some(row => row.id === value.activeStructure) ? value.activeStructure : 'journey12', plans: value.plans || {} };
}

// Merge against current state so blur + navigation in one interaction cannot
// overwrite the last answer with an older rendered snapshot.
export function updateStoryPlanning(value, change) {
  const next = storyPlanning(value);
  if (change.direction) return { ...next, direction: { ...next.direction, ...change.direction } };
  if (change.activeStructure) return PLOT_STRUCTURES.some(row => row.id === change.activeStructure) ? { ...next, activeStructure: change.activeStructure } : next;
  const structure = PLOT_STRUCTURES.find(row => row.id === change.structure);
  const part = structure?.stages.find(row => row.id === change.stage);
  if (!part) return next;
  const plan = next.plans[structure.id] || {}, updated = { ...plan };
  if (change.question && part.questions.some(row => row.id === change.question)) updated.answers = { ...plan.answers, [part.id]: { ...plan.answers?.[part.id], [change.question]: change.value } };
  if ('link' in change) updated.links = { ...plan.links, [part.id]: change.link };
  return { ...next, plans: { ...next.plans, [structure.id]: updated } };
}

export function storyPlanningTargets(game) {
  const result = [];
  const walk = (nodes, coll, parentPath = [], names = []) => {
    for (const node of Object.values(nodes || {})) {
      const title = node.title || node.name || node.id;
      if (!node.mechKind && ['masterAct', 'storyBeat', 'event', 'quest'].includes(node.kind)) result.push({ coll, parentPath, nodeId: node.id, title, node, label: [coll === 'masterNodes' ? 'Master Story' : 'Narrative', ...names, title].join(' / ') });
      if (node.sub?.nodes) walk(node.sub.nodes, coll, [...parentPath, node.id], [...names, title]);
    }
  };
  for (const coll of ['masterNodes', 'nodes']) walk(game?.[coll], coll);
  return result;
}
export const storyPlanningRefKey = ref => ref ? JSON.stringify([ref.coll, ref.parentPath || [], ref.nodeId]) : '';
export function storyPlanningPreview(value) {
  const data = storyPlanning(value), structure = PLOT_STRUCTURES.find(row => row.id === data.activeStructure), answers = data.plans[structure.id]?.answers || {};
  return structure.stages.map(stage => ({ ...stage, passages: stage.questions.map(question => ({ ...question, answer: answers[stage.id]?.[question.id] || '' })).filter(row => row.answer.trim()) })).filter(stage => stage.passages.length);
}
