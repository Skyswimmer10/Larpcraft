import { FATE_FIELDS } from './fateWizard.js';

export const FATE_TYPES = {
  character: { label: 'Character profile', help: 'What repeatedly catches their attention, earns their trust, gives them belonging and brings out their feelings.' },
  communication: { label: 'Communication / dialogue', help: 'Words for a particular speaker and listener, grounded in what matters to the listener.' },
};
export const FATE_PURPOSE_COPY = {
  type: 'Choose a starting point', otherUses: 'Other uses', separate: 'Each purpose keeps its own answers. Switching back restores your earlier work.', savedType: 'This saved version keeps its type. Copy it as a new draft to develop another type.',
  speaker: 'Who is speaking?', listener: 'Who is listening?', speakerLink: 'Link the speaker to your game', listenerLink: 'Link the listener to your game',
  relation: 'What is their relationship?', goal: 'What does the speaker want the listener to understand, feel or do?',
  contextHelp: 'Describe where they are, what has happened and why they are talking. Names and roles are entered separately; this text is not automatically analysed.',
  profileContext: 'Describe their life or present circumstances. The profile records tendencies, not fixed reactions in every situation.',
  destination: 'Where should this be saved?', separateConversation: 'Create a separate conversation', separateProfile: 'Create a separate character profile', destinationHelp: 'A separate result becomes a node on the current canvas. You do not need to choose an act. Choose an existing item only to attach this work to it.',
  summaryHelp: 'Explain how the selected details work together. Your writing adds to the selections; it does not replace them.',
  details: 'Add a specific detail (optional)', detailHelp: 'The category is the starting idea. Explain what it means here, or leave it open for later.', genericDetail: 'What does this mean here?', selected: 'Selected ideas', selectedEmpty: 'Selected ideas will stay visible here as you write.', retained: 'Details for unchecked options are kept for later.',
  words: 'Words to say for this part (optional)', wordsHelp: 'Write actual spoken words here. Descriptions and selected ideas remain in the design notes.', listenerReply: 'A possible listener reply (optional)', replyHelp: 'This is a possible response, not a guaranteed result.', dialogue: 'Spoken dialogue', dialogueEmpty: 'Add spoken words in a step or write the conversation on the review screen. Your selected ideas and explanations are kept below.', dialogueFormat: 'Spoken dialogue', design: 'Conversation design notes', context: 'Situation', blankSpeaker: 'Speaker', blankListener: 'Listener',
  profile: 'Use an existing character profile', profilePick: 'Choose a saved FATE character profile', useProfile: 'Use as listener background', profileHelp: 'This uses your saved description as background. It does not assume the listener will comply or react in one fixed way.', known: 'Known about the listener', refreshProfile: 'Use the updated profile', changedProfile: 'The source profile has changed. Your previous background is still being used.', missingProfile: 'The source profile is no longer available. The saved background has been kept.', unlinkProfile: 'Stop using this background',
  profileQuestions: { F: 'Which of these interests could this opening connect with?', A: 'What could this speaker say or show that this listener would find credible?', T: 'Does a shared group or relationship matter in this conversation? It can be left out.', E: 'How could these feelings shape their response here? What might lead to a different response?' },
  patterns: 'Recurring emotional patterns', addPattern: 'Add an emotional pattern', situation: 'What brings this pattern out?', feelings: 'Which feelings mix here?', response: 'What do they usually do?', exception: 'When might they react differently?', removePattern: 'Remove pattern', patternHelp: 'Describe one situation, its mixture of feelings and the usual response. You can add several patterns without making them fixed rules.',
  groupNames: 'Which groups or relationships matter to them?', loyalties: 'Where do these loyalties support or conflict with each other?',
  emotions: ['Curiosity', 'Fear', 'Hope', 'Pride', 'Anger', 'Sadness', 'Relief', 'Affection', 'Wonder', 'Shame'],
  optional: 'You do not need all four categories. Leave a part empty when it does not help this profile or conversation.',
};

export const FATE_DETAIL_QUESTIONS = {
  'focus.hooks': {
    'A possible threat': 'What could they lose, and why would it matter?',
    'Something worth gaining': 'What exactly could they gain, and why would they want it?',
    'An uncertain signal': 'What is uncertain, and what makes them curious?',
  },
  'focus.channels': {
    'Spoken words': 'What exact words would the speaker say?',
    Silence: 'Where is the pause, and what does it allow the listener to notice?',
    Sound: 'What sound would they hear?', Motion: 'What movement catches their eye?',
    'Light or colour': 'What light or colour stands out?', 'An object': 'What object, and what makes it matter?',
    'Body language': 'What gesture or expression would they notice?', 'Written words': 'What do the written words say?',
  },
  'authority.source': {
    'A secret': 'What secret, and why would the listener take it seriously?',
    Expertise: 'What relevant experience or knowledge makes them believable?',
    Evidence: 'What evidence could the listener check?', 'Rank or title': 'What rank or title, and why would the listener respect it?',
    'Control of resources': 'Which resources do they control?', Force: 'What power do they have, and how might the listener resist?',
    'Moral or sacred standing': 'What belief or principle gives their words weight?', Tradition: 'Which tradition, and why does it matter to the listener?',
    'An institution': 'Which institution, and why would the listener trust it?',
  },
  'tribe.pull': {
    'Inclusion is offered': 'Which group or relationship welcomes them, and how?',
    'Exclusion is threatened': 'Which group might exclude them, and what would that mean?',
    Both: 'Where do welcome and exclusion pull in different directions?',
  },
  'tribe.statusStakes': {
    Reputation: 'Whose opinion matters, and what could change?', Protection: 'Who protects whom, and from what?',
    Resources: 'Which shared resources are involved?', 'A voice in decisions': 'Which decisions could they influence?',
    Rank: 'What role or status could change?', 'Close relationships': 'Which relationships could become closer or strained?',
  },
};
const characterFields = {
  'focus.hooks': { label: 'What repeatedly catches their attention?' },
  'focus.channels': { label: 'How do they tend to notice things?', simple: false },
  'focus.overlooked': { label: 'What do they tend to overlook?', purposes: ['character', 'relationship'], simple: true },
  'authority.source': { label: 'What kinds of authority do they trust?' },
  'authority.challengeable': { label: 'Their trust can be questioned or shaken' },
  'authority.crack': { label: 'What makes them doubt someone they trusted?' },
  'tribe.pull': { label: 'What matters to them about belonging?', options: ['Feeling accepted', 'Keeping close relationships', 'Protecting their group', 'Being independent', 'Belonging to several groups'] },
  'tribe.statusStakes': { label: 'What do these relationships give or risk?' },
  'tribe.position': { label: 'What place do they usually take in a group?', simple: true },
  'emotion.primary': { label: 'One especially common feeling (optional)', simple: false },
  'emotion.resistance': { label: 'What helps them respond differently?', simple: false },
  'emotion.response': { label: 'What behaviour shows their feelings?', simple: false },
  'emotion.direction': { simple: false },
};
export function fateFieldsFor(purpose, pillar) {
  const fields = FATE_FIELDS[pillar].filter(field => field.path !== 'authority.secondary').map(field => ({ ...field, ...(purpose === 'character' ? characterFields[field.path] : {}) }));
  if (purpose !== 'character') return fields;
  const situational = ['focus.patternBreak', 'focus.routine', 'focus.breakType', 'focus.placement', 'authority.cost', 'authority.compliance', 'authority.legitimacy', 'tribe.enforcement', 'tribe.witnesses'];
  return fields.filter(field => !situational.includes(field.path)).concat(pillar === 'T' ? [
    { path: 'tribe.groups', label: FATE_PURPOSE_COPY.groupNames, control: 'multi', options: [], simple: true, details: true },
    { path: 'tribe.loyalties', label: FATE_PURPOSE_COPY.loyalties, control: 'text', simple: true },
  ] : pillar === 'E' ? [
    { path: 'emotion.recurring', label: 'Which feelings commonly return?', control: 'multi', options: FATE_PURPOSE_COPY.emotions, simple: true, details: true },
  ] : []);
}
