// Practical writing recommendations for Larpcraft's existing references.
// These do not change library categories or claim to score a framework's validity.
export const NARRATIVE_FOCUSES = {
  character: { label: 'Character', result: 'Character', category: 'characterConcept', hint: 'Motives, behaviour, strengths, limits, and change.' },
  relationship: { label: 'Relationships & groups', result: 'Relationship / group dynamic', category: 'storyConcept', hint: 'Trust, conflict, roles, needs, and how people affect one another.' },
  communication: { label: 'Communication & dialogue', result: 'Communication / dialogue plan', category: 'functionConcept', hint: 'What is said, who hears it, what is understood, and what changes.' },
  values: { label: 'Values & moral choices', result: 'Values / dilemma', category: 'storyConcept', hint: 'What matters, competing principles, and the cost of a choice.' },
  scene: { label: 'Scene / encounter', result: 'Scene / encounter plan', category: 'storyConcept', hint: 'A playable situation, its decisions, and its consequences.' },
  story: { label: 'Story / act arc', result: 'Story / act outline', category: 'structureConcept', hint: 'Connected events, turning points, and change across an arc.' },
  learning: { label: 'Learning & discovery', result: 'Learning / discovery sequence', category: 'functionConcept', hint: 'Experience, discovery, reflection, and trying a new approach.' },
  style: { label: 'Voice & presentation', result: 'Voice / presentation guide', category: 'styleConcept', hint: 'Tone, viewpoint, imagery, and how the story reaches players.' },
};

const profile = (best, useful, reason) => ({ best, useful, reason });
export const FRAMEWORK_GUIDANCE = {
  fate: profile(['communication', 'scene'], ['relationship', 'style', 'character', 'story'], 'Shape an invitation, briefing, speech, or important reveal through attention, credibility, belonging, and feeling.'),
  kolbLearningCycle: profile(['learning'], ['scene', 'character', 'story'], 'Build an experience that leads to reflection, an idea, and a chance to try it. It is a learning cycle rather than a personality description.'),
  humanValues: profile(['values'], ['character', 'relationship', 'scene', 'story'], 'Find what someone stands to gain or lose, and make a choice emotionally meaningful.'),
  haidtMoralConflicts: profile(['values', 'relationship'], ['scene', 'story', 'character', 'communication'], 'Give opposing sides understandable principles and put those principles into conflict.'),
  descentAndRecovery: profile(['story'], ['character', 'relationship', 'scene', 'learning'], 'Shape a setback, crisis, recovery, and changed situation across several beats.'),
  homeVoyageReturn: profile(['story'], ['character', 'learning', 'relationship', 'scene'], 'Structure a journey into unfamiliar conditions, its cost, and what returns changed.'),
  storyBuildingSystem: profile(['story'], ['communication', 'scene', 'style', 'character', 'learning'], 'Check the purpose, material, people, structure, delivery, and practical use of a story before polishing it.'),
  nlpMetaModel: profile(['communication'], ['relationship', 'scene', 'character', 'style'], 'Write or unpack a statement: what is missing, assumed, or treated as an absolute, and what a question might reveal.'),
  nlpMetaPrograms: profile(['character', 'communication'], ['relationship', 'scene', 'learning'], 'Explore contrasting preferences in motivation, decisions, information, and methods, then show their effect in a situation.'),
  mmpi2CharacterProfile: profile(['character'], ['relationship', 'scene'], 'Describe several dimensions of one fictional character and how those traits affect behaviour. It is not an assessment of players.'),
  jungianFeminineArchetypes: profile(['character', 'relationship'], ['scene', 'values', 'story'], 'Explore care, connection, independence, and meaning, including how those roles support or limit relationships.'),
  jungianMasculineArchetypes: profile(['character'], ['relationship', 'scene', 'values', 'story'], 'Explore responsibility, action, knowledge, and connection through strengths, developing forms, and shadows.'),
};

const CONCEPT_GROUPS = [
  [['LIB-CPT-DRAGON'], ['story', 'scene'], ['values', 'relationship', 'communication'], 'Define a threat, something worth protecting, and alternative responses. The entities can be people, places, objects, or pressures.'],
  [['LIB-CPT-HERO', 'LIB-CPT-N044'], ['relationship', 'communication'], ['character', 'story', 'learning', 'scene'], 'Connect someone trying to achieve something with a guide who offers help, a gift, or a price.'],
  [['LIB-CPT-N003'], ['story', 'scene'], ['values', 'character', 'relationship'], 'Build recognisable situations around choice, conflict, inconsistency, courage, fairness, and change.'],
  [['LIB-CPT-N004', 'LIB-CPT-N012'], ['communication', 'learning'], ['character', 'story', 'scene'], 'Use curiosity and unanswered questions to invite discovery and reveal what someone cares about.'],
  [['LIB-CPT-N005'], ['story', 'relationship'], ['scene', 'values', 'character'], 'Choose the central conflict and how people or forces oppose one another.'],
  [['LIB-CPT-N006', 'LIB-CPT-N009', 'LIB-CPT-N010'], ['values', 'story'], ['relationship', 'scene', 'character'], 'Explore rules, moral positions, order, and the consequences of challenging them.'],
  [['LIB-CPT-N007'], ['learning', 'story'], ['values', 'communication', 'scene'], 'Explore an inherited practice or object, including its hidden purpose and what the past reveals.'],
  [['LIB-CPT-N008'], ['scene', 'learning'], ['story', 'communication', 'relationship'], 'Plan what is hidden, how it can be discovered, and how the discovery changes understanding.'],
  [['LIB-CPT-N011'], ['story', 'values'], ['character', 'learning', 'relationship'], 'Explore life stages, continuity, loss, and what is passed on.'],
  [['LIB-CPT-N013', 'LIB-CPT-N014', 'LIB-CPT-N015', 'LIB-CPT-N016', 'LIB-CPT-N017', 'LIB-CPT-N018'], ['story'], ['character', 'relationship', 'scene'], 'Arrange changes in circumstances and turning points into a story arc.'],
  [['LIB-CPT-N019'], ['story', 'communication'], ['scene', 'values', 'learning'], 'Find a timeline, turning points, tensions, temptations, and a teachable moment for a tellable story.'],
  [['LIB-CPT-N020'], ['story', 'values'], ['scene', 'character', 'relationship'], 'Build a difficult choice where each available path has a cost.'],
  [['LIB-CPT-N021'], ['story', 'learning'], ['communication', 'character', 'scene'], 'Use failure and its consequences to produce a revealing story or lesson.'],
  [['LIB-CPT-N022'], ['communication'], ['relationship', 'learning', 'story'], 'Explain an unfamiliar idea with different attitudes to risk in mind.'],
  [['LIB-CPT-N023', 'LIB-CPT-N025', 'LIB-CPT-N043'], ['communication'], ['story', 'style', 'relationship'], 'Explain an idea clearly to someone who does not already know the background.'],
  [['LIB-CPT-N024', 'LIB-CPT-N026'], ['communication', 'relationship'], ['scene', 'character', 'learning'], 'Use conversation to reveal experiences, feelings, and connections between people.'],
  [['LIB-CPT-N027', 'LIB-CPT-N028', 'LIB-CPT-N029', 'LIB-CPT-N030', 'LIB-CPT-N031', 'LIB-CPT-N032', 'LIB-CPT-N033', 'LIB-CPT-N034', 'LIB-CPT-N035', 'LIB-CPT-N036', 'LIB-CPT-N037'], ['character'], ['relationship', 'communication', 'values', 'scene'], 'Develop an archetype through behaviour, voice, what it offers others, and its excessive or withdrawn sides.'],
  [['LIB-CPT-N038'], ['relationship', 'character'], ['communication', 'scene', 'story'], 'Develop companionship and its effects on the people involved. Its current library category does not limit this use.'],
  [['LIB-CPT-N039'], ['values', 'communication'], ['character', 'relationship', 'learning'], 'Explore autonomy, mastery, and purpose, then show what makes work or a shared effort matter.'],
  [['LIB-CPT-N040'], ['communication', 'values'], ['character', 'relationship', 'story'], 'Build credibility through commitments, shared values, actions, and sacrifices.'],
  [['LIB-CPT-N041'], ['character', 'communication'], ['relationship', 'values', 'story'], 'Connect what someone wants with the reasons that make it matter to them.'],
  [['LIB-CPT-N042'], ['communication', 'style'], ['scene', 'story'], 'Regain attention through action, feeling, or meaning, and decide which background information can wait.'],
];

export const CONCEPT_GUIDANCE = Object.fromEntries(CONCEPT_GROUPS.flatMap(([ids, best, useful, reason]) => ids.map(id => [id, profile(best, useful, reason)])));
const CATEGORY_GUIDANCE = {
  characterConcept: profile(['character'], ['relationship', 'scene', 'communication'], 'Develop a character through this concept, or explore how it affects other people.'),
  storyConcept: profile(['story', 'scene'], ['character', 'relationship', 'values'], 'Apply this idea to a situation or story, keeping the relationships between its parts.'),
  structureConcept: profile(['story'], ['scene', 'character', 'learning'], 'Use the arrangement of events or ideas to plan change across a story.'),
  functionConcept: profile(['communication'], ['learning', 'scene', 'story'], 'Decide what this story needs to help someone understand, feel, or do.'),
  styleConcept: profile(['style', 'communication'], ['scene', 'story'], 'Choose how the story sounds, looks, and reaches its audience.'),
};

export function narrativeGuidance(source, type) {
  if (type === 'framework') return FRAMEWORK_GUIDANCE[source?.id] || profile(['story'], ['character', 'scene'], 'Use the reference as a lens for a specific story question.');
  const savedFocus = source?.narrativeFocus || source?.narrativeWizard?.focus;
  if (NARRATIVE_FOCUSES[savedFocus]) {
    const base = CATEGORY_GUIDANCE[source.category || source.conceptKind] || CATEGORY_GUIDANCE.storyConcept;
    return profile([savedFocus], [...new Set([...base.best, ...base.useful])].filter(f => f !== savedFocus), `This saved version was developed for ${NARRATIVE_FOCUSES[savedFocus].label.toLowerCase()}. ${base.reason}`);
  }
  return CONCEPT_GUIDANCE[source?.conceptId || source?.id] || CATEGORY_GUIDANCE[source?.category || source?.conceptKind] || CATEGORY_GUIDANCE.storyConcept;
}

export function narrativeFit(guidance, focus) {
  return guidance.best.includes(focus) ? 'best' : guidance.useful.includes(focus) ? 'useful' : 'other';
}

export function defaultNarrativeFocus(source, type, target) {
  if (target?.kind === 'character') return 'character';
  const targetFocus = target?.narrativeFocus || target?.narrativeWizard?.focus;
  if (NARRATIVE_FOCUSES[targetFocus]) return targetFocus;
  if (['event', 'storyLocation', 'item'].includes(target?.kind)) return 'scene';
  if (['quest', 'storyStructureContainer'].includes(target?.kind)) return 'story';
  return narrativeGuidance(source, type).best[0];
}

export const FOCUS_STARTERS = {
  character: [['focus:subject', 'Who is this character, and what do they want right now?'], ['focus:change', 'What choice or pressure could reveal or change them?']],
  relationship: [['focus:sides', 'Who are the people or groups in this relationship?'], ['focus:needs', 'What does each side want from the other?'], ['focus:change', 'What could change their trust, closeness, or power?']],
  communication: [['focus:message', 'Who is speaking to whom, and what needs to get across?'], ['focus:change', 'What should the listener understand, feel, or do afterward?']],
  values: [['focus:stake', 'What matters here, and to whom?'], ['focus:choice', 'Which values pull the choice in different directions?'], ['focus:cost', 'What is gained and given up on each path?']],
  scene: [['focus:situation', 'What is happening when players enter this scene?'], ['focus:choice', 'What can players decide or do?'], ['focus:change', 'What changes because of that choice?']],
  story: [['focus:subject', 'Whose situation changes across this story or act?'], ['focus:change', 'Where does it begin, and what should be different by the end?']],
  learning: [['focus:discovery', 'What could players discover or learn through this experience?'], ['focus:change', 'Where can they try what they have learned?']],
  style: [['focus:audience', 'Who experiences this story, and through which voice or medium?'], ['focus:feeling', 'What tone or feeling should the presentation create?']],
};
