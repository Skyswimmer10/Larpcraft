import { FOCUS_STARTERS } from './narrativeGuidance.js';

export const META_PROGRAM_STEPS = [
  { title: 'What drives them?', short: 'Drives', hint: 'Choose what draws their attention and how they get started.' },
  { title: 'How do they work with others?', short: 'Working together', hint: 'Explore decisions, differences, and ways of getting things done.' },
  { title: 'How do they communicate?', short: 'Communication', hint: 'Choose useful ways to explain something and try a line of dialogue.' },
  { title: 'What tests or changes them?', short: 'Scene test', hint: 'Put these choices into a situation. Decide what stays steady and what changes.' },
];

const option = (value, label, help = '') => ({ value, label, help });
const field = (key, step, prompt, control = 'text', options = [], extra = {}) => ({
  key, step, prompt, control, options,
  ...(options.length ? { choiceAnswerKey: `${key}:choice`, choices: options.map(item => item.value) } : {}),
  ...extra,
});

export const MOTIVATION_OPTIONS = [
  option('Strongly toward', 'Strongly toward opportunities'),
  option('Mostly toward', 'Mostly toward opportunities'),
  option('Mixed', 'A mix of opportunities and risks'),
  option('Mostly away', 'Mostly avoiding risks'),
  option('Strongly away', 'Strongly avoiding risks'),
];
export const SCOPE_OPTIONS = [
  option('Strongly big picture', 'Strongly prefers the big picture'),
  option('Mostly big picture', 'Mostly prefers the big picture'),
  option('Mixed', 'Moves between overview and detail'),
  option('Mostly detail', 'Mostly prefers details'),
  option('Strongly detail', 'Strongly prefers details'),
];

export function exceptionIds(answers) {
  return [...new Set((answers['mp:exceptionIds'] || '').split('|').filter(id => /^e\d+$/.test(id)))];
}

export function addMetaProgramException(answers) {
  const used = Object.keys(answers).map(key => /^mp:exception:e(\d+):/.exec(key)?.[1]).filter(Boolean).map(Number);
  const ids = exceptionIds(answers);
  const next = `e${Math.max(0, ...used, ...ids.map(id => Number(id.slice(1)))) + 1}`;
  return { 'mp:exceptionIds': [...ids, next].join('|') };
}

export function metaProgramQuestions(source, answers = {}, focus = 'character') {
  const starters = (FOCUS_STARTERS[focus] || FOCUS_STARTERS.character).map(([key, prompt]) => field(key, 0, prompt, 'text', [], { section: 'context' }));
  const rows = [
    field('phase:1', 0, 'What usually motivates them in this situation?', 'spectrum', MOTIVATION_OPTIONS, {
      ends: ['Pursue opportunities', 'Avoid risks'], hint: 'They can want a reward and avoid a problem at the same time. Choose a leaning only if it helps your story.',
      aliases: { Toward: 1, 'Away From': 3, 'Both / depends on the situation': 2 },
      choices: [...MOTIVATION_OPTIONS.map(item => item.value), 'Toward', 'Away From', 'Both / depends on the situation'],
    }),
    field('phase:3', 0, 'How do they get started?', 'single', [
      option('Proactive', 'Take the initiative', 'Begin or offer a plan without waiting to be asked.'),
      option('Reactive', 'Observe and respond', 'Wait for information, a request, or a useful moment.'),
      option('Both / depends on the situation', 'It depends', 'Describe which situations call for each approach.'),
    ]),
    field('phase:4', 0, 'How much detail helps them understand?', 'spectrum', SCOPE_OPTIONS, {
      ends: ['Big picture', 'Specific details'], hint: 'This is the amount of information they want, not whether they follow a procedure.',
      aliases: { Global: 1, Detail: 3, 'Both / depends on the situation': 2 },
      choices: [...SCOPE_OPTIONS.map(item => item.value), 'Global', 'Detail', 'Both / depends on the situation'],
    }),
    field('mp:interests', 0, 'What do they notice or care about first?', 'multi', [
      option('People', 'People', 'Relationships and who is involved.'), option('Places', 'Places', 'The surroundings and what is changing there.'),
      option('Things', 'Things', 'Objects, tools, and resources.'), option('Activities', 'Activities', 'What people are doing or trying to do.'),
      option('Information', 'Information', 'Clues, knowledge, and explanations.'),
    ]),
    field('phase:2', 1, 'How do they judge a decision?', 'single', [
      option('Internal', 'Their own judgment', 'Compare it with personal standards and experience.'),
      option('External', 'Feedback and evidence', 'Look for responses, results, or an outside check.'),
      option('Both / depends on the situation', 'Use both', 'Their own judgment and an outside check can work together.'),
    ], { hint: 'This describes how they evaluate a decision. Their moral beliefs can be explored separately.' }),
    field('phase:5', 1, 'What do they notice when comparing ideas?', 'single', [
      option('Sameness', 'Common ground', 'Start with what matches or stays familiar.'),
      option('Difference', 'Differences', 'Start with what has changed or does not match.'),
      option('Sameness, then exceptions', 'Common ground, then exceptions', 'Recognise the pattern, then notice what breaks it.'),
      option('Both / depends on the situation', 'It depends', 'Use a different approach for a different task.'),
    ]),
    field('phase:6', 1, 'What helps them get things done?', 'multi', [
      option('Options', 'Explore alternatives', 'Compare possible ways to reach the goal.'),
      option('Procedures', 'Follow a method', 'Use a reliable sequence or an agreed plan.'),
    ], { hint: 'Choose either or both. Exploring options does not require breaking rules.', choices: ['Options', 'Procedures', 'Options | Procedures', 'Both / depends on the situation'] }),
    field('mp:creativeRole', 1, 'How could they help with a shared task?', 'multi', [
      option('Dreamer', 'Imagine possibilities', 'Suggest what could be possible.'), option('Planner', 'Make a workable plan', 'Turn an idea into actions and resources.'),
      option('Reviewer', 'Check and improve it', 'Find risks, gaps, and ways to improve the plan.'),
    ], { section: 'creativity', hint: 'Optional creativity roles inspired by Dreamer, Realist, and Critic. A person can use all three at different points in a task.' }),
    field('mp:explanations', 2, 'What kinds of explanation help here?', 'multi', [
      option('Examples and analogies', 'Examples and analogies', 'Make the idea familiar through a comparison.'),
      option('Facts and evidence', 'Facts and evidence', 'Show what supports the claim.'),
      option('Clear steps', 'Clear steps', 'Explain what to do next.'),
    ], { hint: 'Choose more than one if useful. These are different formats, not ends of a single scale.' }),
    field('mp:viewpoint', 2, 'Whose view do they start from in a disagreement?', 'single', [
      option('Their own view', 'Their own view', 'What they experience, need, or believe.'),
      option('The other person’s view', 'The other person’s view', 'What the other person might experience or need.'),
      option('An outside view', 'An outside view', 'Watch how both sides affect the interaction.'),
      option('The whole group', 'The whole group', 'Consider the wider relationships and consequences.'),
    ], { hint: 'They can move between viewpoints. None of these choices makes someone stubborn, cold, or easily swayed.' }),
    field('mp:dialogue', 2, 'What might they actually say?', 'text', [], { placeholder: 'Write a line they could say in this situation.' }),
    field('mp:words', 2, 'Which kinds of words might colour their dialogue?', 'multi', [
      option('Images', 'Images', '“I see what you mean.”'), option('Sounds', 'Sounds', '“That sounds promising.”'),
      option('Feelings and sensations', 'Feelings and sensations', '“Something feels wrong.”'), option('Reasons and logic', 'Reasons and logic', '“Let’s think this through.”'),
    ], { section: 'voice', hint: 'An optional writing palette. It does not assign a fixed sensory type to a person.' }),
    field('mp:challenge', 3, 'What problem tests their usual approach?', 'text', [], { placeholder: 'A concrete obstacle, disagreement, or difficult choice.' }),
    field('mp:goal', 3, 'What do they want to achieve in this scene?', 'text'),
    field('mp:response', 3, 'What do they do when their usual approach is tested?', 'text', [], { placeholder: 'Write an action other people could notice.' }),
    field('mp:time', 3, 'Where is their attention in this scene?', 'single', [
      option('The present moment', 'The present moment', 'What is happening and needed now.'),
      option('The longer timeline', 'The longer timeline', 'How this fits with earlier events and later consequences.'),
      option('Both', 'Move between both', 'The immediate situation and the wider plan both matter.'),
    ], { section: 'time', hint: 'A story choice about attention. It does not decide whether someone plans well or feels strongly.' }),
    field('mp:cause', 3, 'What causes or keeps this problem going?', 'text', [], { section: 'score', placeholder: 'A current situation, habit, relationship, or past event.' }),
    field('mp:resource', 3, 'What help, skill, or resource could make a difference?', 'text', [], { section: 'score' }),
    field('mp:success', 3, 'What could change if they succeed?', 'text', [], { section: 'score' }),
    field('mp:setback', 3, 'What could change if they fail or only partly succeed?', 'text', [], { section: 'score' }),
    field('mp:turningPoints', 3, 'What could open the way to change?', 'multi', [
      option('Their usual approach stops working', 'Their usual approach stops working'),
      option('A familiar situation offers a new choice', 'A familiar situation offers a new choice'),
      option('Support from another person', 'Support from another person'),
      option('A discovery changes their view', 'A discovery changes their view'),
    ], { section: 'score' }),
  ];
  for (const [index, id] of exceptionIds(answers).entries()) {
    for (const [suffix, prompt, placeholder] of [
      ['when', 'When does this exception happen?', 'For example, when an ally is threatened or a deadline is near.'],
      ['change', 'What changes in their behaviour?', 'Describe the change you want; no automatic flip is assumed.'],
      ['example', 'How would other people notice?', 'An action or line of dialogue.'],
      ['return', 'What lets them return to their usual approach?', 'Optional: a condition, support, or choice.'],
    ]) rows.push(field(`mp:exception:${id}:${suffix}`, 3, `Exception ${index + 1}: ${prompt}`, 'text', [], { section: 'exception', exceptionId: id, fieldLabel: prompt, placeholder }));
  }
  return [...starters, ...rows].map(row => {
    const phase = row.key.startsWith('phase:') ? source.phases?.find(phase => row.key === `phase:${phase.key}`) : null;
    return { ...row, hint: row.hint || phase?.detail || '', ...(phase ? { reference: phase.short } : {}) };
  });
}

export function selectedMetaOptions(row, value = '') {
  if (row.key === 'phase:6' && value === 'Both / depends on the situation') return ['Options', 'Procedures'];
  return value.split(' | ').filter(Boolean);
}

export function spectrumPosition(row, value) {
  if (!value) return null;
  const index = row.options.findIndex(option => option.value === value);
  return index >= 0 ? index : row.aliases?.[value] ?? null;
}

export function metaProgramProfile(answers) {
  const take = key => answers[`${key}:choice`] || null;
  const multi = key => (take(key) || '').split(' | ').filter(Boolean);
  return {
    version: 1, motivation: take('phase:1'), action: take('phase:3'), informationScope: take('phase:4'),
    evaluation: take('phase:2'), comparison: take('phase:5'), execution: take('phase:6'),
    interests: multi('mp:interests'), creativeRoles: multi('mp:creativeRole'), explanations: multi('mp:explanations'), words: multi('mp:words'),
    viewpoint: take('mp:viewpoint'), dialogue: answers['mp:dialogue'] || '',
    timeFocus: take('mp:time'), turningPoints: multi('mp:turningPoints'),
    notes: Object.fromEntries(Object.entries(answers).filter(([key, value]) => !key.endsWith(':choice') && key !== 'mp:exceptionIds' && value)),
    scene: { challenge: answers['mp:challenge'] || '', goal: answers['mp:goal'] || '', response: answers['mp:response'] || '', cause: answers['mp:cause'] || '', resource: answers['mp:resource'] || '', success: answers['mp:success'] || '', setback: answers['mp:setback'] || '' },
    exceptions: exceptionIds(answers).map(id => ({ id, when: answers[`mp:exception:${id}:when`] || '', change: answers[`mp:exception:${id}:change`] || '', example: answers[`mp:exception:${id}:example`] || '', return: answers[`mp:exception:${id}:return`] || '' })),
  };
}

export function metaProgramTestPrompt(answers, archetype) {
  const pieces = [];
  if (archetype) pieces.push(`the ${archetype} role`);
  if (answers['phase:1:choice']) pieces.push(`“${MOTIVATION_OPTIONS.find(option => option.value === answers['phase:1:choice'])?.label || answers['phase:1:choice']}” motivation`);
  if (answers['phase:6:choice']) pieces.push(`“${answers['phase:6:choice'].split(' | ').map(value => ({ Options: 'explore alternatives', Procedures: 'follow a method' })[value] || value).join(' + ')}” as a way to act`);
  return pieces.length ? `You recorded ${pieces.join(' and ')}. What situation would make those choices difficult, and what would they actually do?` : 'What situation would reveal this person’s preferences through a choice other people can see?';
}
