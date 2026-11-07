// Display-only identities: authored library records and their artwork stay intact.
export const FRAMEWORK_SYMBOLS = {
  larpcraftGroupFoundations: 'companion',
  fate: 'fate', kolbLearningCycle: 'kolb', humanValues: 'values', haidtMoralConflicts: 'moral-conflicts',
  descentAndRecovery: 'recovery', homeVoyageReturn: 'home-voyage', storyBuildingSystem: 'story-building',
  nlpMetaPrograms: 'preferences', nlpMetaModel: 'language', mmpi2CharacterProfile: 'profile',
  jungianFeminineArchetypes: 'feminine-archetypes', jungianMasculineArchetypes: 'masculine-archetypes',
};

const concepts = [
  ['LIB-CPT-DRAGON', 'dragon-city', 'Dragon & the City'],
  ['LIB-CPT-HERO', 'hero-guide', 'Hero & Guide'],
  ['LIB-CPT-N003', 'universal', 'Universal stories'],
  ['LIB-CPT-N004', 'curiosity', 'Curious tales'],
  ['LIB-CPT-N005', 'three-conflicts', 'Three great conflicts'],
  ['LIB-CPT-N006', 'good-evil', 'Good and evil'],
  ['LIB-CPT-N007', 'old', 'Shock of the old'],
  ['LIB-CPT-N008', 'secrets', 'Secrets and puzzles'],
  ['LIB-CPT-N009', 'rules-rebels', 'Rules cheats and rebels'],
  ['LIB-CPT-N010', 'order-chaos', 'Order and chaos'],
  ['LIB-CPT-N011', 'life', 'Circle of life'],
  ['LIB-CPT-N012', 'curiosity', 'Curious tales'],
  ['LIB-CPT-N013', 'hole', 'Man in a hole'],
  ['LIB-CPT-N014', 'happy', 'Happy ever after'],
  ['LIB-CPT-N015', 'voyage', 'Voyage and return'],
  ['LIB-CPT-N016', 'pride', 'Pride and fall'],
  ['LIB-CPT-N017', 'downfall', 'Downfall'],
  ['LIB-CPT-N018', 'riches', 'Rags to riches'],
  ['LIB-CPT-N019', 'five-ts', "Five T's"],
  ['LIB-CPT-N020', 'hard-choice', 'No easy way'],
  ['LIB-CPT-N021', 'fail', 'Epic fail'],
  ['LIB-CPT-N022', 'innovation', 'Innovation curve'],
  ['LIB-CPT-N023', 'sales', 'Simple sales stories'],
  ['LIB-CPT-N024', 'icebreaker', 'Icebreaker stories'],
  ['LIB-CPT-N025', 'pitch', 'Pitch perfect'],
  ['LIB-CPT-N026', 'conversation', 'Story ish conversations'],
  ['LIB-CPT-N027', 'caregiver', 'The caregiver'],
  ['LIB-CPT-N028', 'innocent', 'The innocent'],
  ['LIB-CPT-N029', 'jester', 'The Jester'],
  ['LIB-CPT-N030', 'explorer', 'The explorer'],
  ['LIB-CPT-N031', 'lover', 'The lover'],
  ['LIB-CPT-N032', 'warrior', 'The Warrior'],
  ['LIB-CPT-N033', 'artist', 'Artist'],
  ['LIB-CPT-N034', 'ruler', 'The ruler'],
  ['LIB-CPT-N035', 'magician', 'The Magician'],
  ['LIB-CPT-N036', 'sage', 'Sage'],
  ['LIB-CPT-N037', 'rebel', 'The Rebel'],
  ['LIB-CPT-N038', 'companion', 'The companion'],
  ['LIB-CPT-N039', 'drive', 'Drive stories'],
  ['LIB-CPT-N040', 'expert', 'Trust me an expert'],
  ['LIB-CPT-N041', 'motivation', "What's my motivation"],
  ['LIB-CPT-N042', 'chase', 'Cut to the chase'],
  ['LIB-CPT-N043', 'explain', 'Which about'],
  ['LIB-CPT-N044', 'hero-guide', 'Hero and the Guide'],
];
export const CONCEPT_SYMBOLS = Object.fromEntries(concepts.map(([id, symbol]) => [id, symbol]));
const normalize = value => (value || '').toLowerCase().replace(/&/g, 'and').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const byName = Object.fromEntries(concepts.map(([, symbol, name]) => [normalize(name), symbol]));
const categorySymbols = { characterConcept: 'profile', storyConcept: 'universal', structureConcept: 'story-building', functionConcept: 'conversation', styleConcept: 'artist' };

export function narrativeSymbol(source, type) {
  if (source?.id === 'larpcraftGroupFoundations') return 'companion';
  if (type === 'framework') return FRAMEWORK_SYMBOLS[source?.id] || 'story-building';
  const id = source?.conceptId || source?.id;
  const origin = source?.narrativeWizard;
  return CONCEPT_SYMBOLS[id] || CONCEPT_SYMBOLS[origin?.sourceId]
    || (origin?.sourceType === 'framework' && FRAMEWORK_SYMBOLS[origin.sourceId])
    || byName[normalize(source?.name || source?.title)]
    || categorySymbols[source?.category || source?.conceptKind] || 'universal';
}
