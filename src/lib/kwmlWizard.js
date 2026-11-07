import { KWML_KEYS, KWML_BALANCED, KWML_ENERGIES, KWML_LEANS, KWML_INTENSITIES, KWML_STAGES, kwmlKey, kwmlList, kwmlPrimary, kwmlPrimaryKeys, kwmlSecondaries, kwmlActive, kwmlDirections, kwmlPairChoices } from '../data/kwml.js';

const text = value => typeof value === 'string' ? value.trim() : '';
const unique = values => [...new Set(values)];
const list = values => values.length < 2 ? values[0] || '' : `${values.slice(0, -1).join(', ')} and ${values.at(-1)}`;
export function kwmlInitialAnswers(answers = {}) {
  const next = { ...answers };
  if (next['kwml:revision']) return next;
  const primary = kwmlPrimary(answers);
  next['kwml:revision'] = '1';
  if (primary && primary !== KWML_BALANCED) next['kwml:legacyPrimary'] = primary;
  if (!next['kwml:concept'] && answers['focus:subject']) next['kwml:concept'] = answers['focus:subject'];
  return next;
}
export function kwmlSelectPrimary(answers, primary) {
  if (![...KWML_KEYS, KWML_BALANCED].includes(primary)) return {};
  // Hidden energy banks remain untouched so switching back restores the work.
  return { archetype: primary };
}
export function kwmlToggleSecondary(answers, key) {
  if (!KWML_KEYS.includes(key) || key === kwmlPrimary(answers) || kwmlPrimary(answers) === KWML_BALANCED) return {};
  const values = kwmlSecondaries(answers);
  if (!values.includes(key) && values.length >= 2) return {};
  return { 'kwml:secondary': (values.includes(key) ? values.filter(value => value !== key) : [...values, key]).join(' | ') };
}
export function kwmlStrengths(answers, energy) {
  return unique(kwmlList(answers[kwmlKey(energy, 'strengths')])).filter(value => KWML_ENERGIES[energy].strengths.includes(value));
}
export function kwmlStrengthOptions(answers) {
  return kwmlActive(answers).flatMap(energy => kwmlStrengths(answers, energy).map(value => `${energy}: ${value}`));
}
export function kwmlHighlightedStrengths(answers) {
  const available = kwmlStrengthOptions(answers);
  return answers['kwml:highlights'] === undefined ? available : kwmlList(answers['kwml:highlights']).filter(value => available.includes(value));
}
export const kwmlSelectedDirections = answers => kwmlDirections(answers).filter(option => kwmlList(answers['kwml:directions']).includes(option.label));
export const kwmlSelectedPairs = answers => kwmlPairChoices(answers).filter(option => kwmlList(answers['kwml:pairs']).includes(option.label));
export function kwmlRiskOptions(answers) {
  return unique([...kwmlActive(answers).flatMap(energy => ['active', 'passive'].map(side => `${energy} · ${KWML_ENERGIES[energy][side].name}: ${KWML_ENERGIES[energy][side].description}`)),
    ...kwmlSelectedDirections(answers).filter(option => option.side !== 'mature').map(option => `Interaction · ${option.label}`),
    ...kwmlSelectedPairs(answers).filter(option => option.side !== 'mature').map(option => `Interaction · ${option.label}`)]);
}
export const kwmlSelectedRisks = answers => kwmlList(answers['kwml:risks']).filter(value => kwmlRiskOptions(answers).includes(value));
export function kwmlSaveAnswers(answers) {
  return { ...answers, 'kwml:revision': '1', 'kwml:secondary': kwmlSecondaries(answers).join(' | '),
    'kwml:directions': kwmlSelectedDirections(answers).map(row => row.label).join(' | '),
    'kwml:pairs': kwmlSelectedPairs(answers).map(row => row.label).join(' | '),
    'kwml:highlights': kwmlHighlightedStrengths(answers).join(' | '),
    'kwml:risks': kwmlSelectedRisks(answers).join(' | '),
    'kwml:hook': answers['kwml:hook'] === undefined ? kwmlSuggestedHook(answers) : answers['kwml:hook'],
  };
}
export function kwmlSuggestedHook(answers) {
  const primary = kwmlPrimary(answers);
  return primary === KWML_BALANCED ? 'A valued connection needs a wise decision, a practical change and a defended boundary. Which energy takes the lead, and which one must support it?' : KWML_ENERGIES[primary]?.hook || '';
}

const LEGACY_KEYS = new Set(['strength', 'root', 'activeShadow', 'passiveShadow', 'shadowScene', 'archetype:notes', 'focus:subject', 'focus:change', 'otherRole', 'otherRole:notes']);
export function kwmlLegacyQuestions(answers, previous = []) {
  const rows = previous.filter(row => row.key !== 'archetype' && !row.key.startsWith('kwml:') && text(answers[row.textAnswerKey || row.key]));
  const result = [...rows];
  for (const key of LEGACY_KEYS) if (text(answers[key]) && !result.some(row => row.key === key || row.textAnswerKey === key)) result.push({ key, prompt: {
    strength: 'Earlier strength writing', root: 'Earlier developing-form writing', activeShadow: 'Earlier active-shadow writing', passiveShadow: 'Earlier passive-shadow writing', shadowScene: 'Earlier scene test', 'archetype:notes': 'Earlier archetype notes', 'focus:subject': 'Earlier character context', 'focus:change': 'Earlier character pressure', otherRole: 'Earlier other role', 'otherRole:notes': 'Earlier other-role notes',
  }[key] });
  return result;
}

export function kwmlQuestionRows(answers, previous = []) {
  const rows = [], add = (key, prompt, choices, control = 'text') => rows.push({ key, prompt, ...(choices ? { choices, control } : {}) });
  add('archetype', 'Primary energy', [...KWML_KEYS, KWML_BALANCED]);
  add('kwml:concept', 'Character role or concept');
  if (kwmlPrimary(answers) !== KWML_BALANCED) add('kwml:secondary', 'Supporting energies', KWML_KEYS, 'multi');
  const primaryKeys = kwmlPrimaryKeys(answers);
  for (const energy of kwmlActive(answers)) {
    add(kwmlKey(energy, 'strengths'), `${energy}: strengths to emphasise`, KWML_ENERGIES[energy].strengths, 'multi');
    if (primaryKeys.includes(energy)) {
      add(kwmlKey(energy, 'lean'), `${energy}: current shadow lean`, KWML_LEANS);
      add(kwmlKey(energy, 'historyEnabled'), `${energy}: include a shadow moment in history?`, ['yes', 'no']);
      if (answers[kwmlKey(energy, 'historyEnabled')] === 'yes') add(kwmlKey(energy, 'history'), `${energy}: a shadow moment in the character’s history`);
    } else add(kwmlKey(energy, 'intensity'), `${energy}: supporting shadow intensity`, KWML_INTENSITIES);
  }
  add('kwml:showDistortion', 'Explore possible shadow distortions between energies?', ['yes', 'no']);
  add('kwml:directions', 'Directional effects that matter', kwmlDirections(answers).map(option => option.label), 'multi');
  add('kwml:pairs', 'Pairwise interactions that matter', kwmlPairChoices(answers).map(option => option.label), 'multi');
  add('kwml:scene', 'A scene or habit showing the energies together');
  add('kwml:highlights', 'Strengths to highlight in play', kwmlStrengthOptions(answers), 'multi');
  add('kwml:risks', 'Shadow risks that create story friction', kwmlRiskOptions(answers), 'multi');
  add('kwml:aware', 'Character is aware of their shadows?', ['yes', 'no']);
  add('kwml:stage', 'Current developmental stage', KWML_STAGES);
  add('kwml:hook', 'Possible story hook');
  return [...rows, ...kwmlLegacyQuestions(answers, previous)];
}

export function kwmlSummary({ title, context, answers = {}, questions = [], narrativeText }) {
  if (typeof narrativeText === 'string') return narrativeText.trim();
  const primary = kwmlPrimary(answers), active = kwmlActive(answers), supports = kwmlSecondaries(answers);
  const lines = [text(title), text(answers['kwml:concept']), text(context)];
  if (primary) lines.push(primary === KWML_BALANCED ? 'A balanced mix of King, Warrior, Magician and Lover.' : `${primary} is the primary energy${supports.length ? `, supported by ${list(supports)}` : ''}.`);
  const strengths = kwmlHighlightedStrengths(answers);
  if (strengths.length) lines.push(`Strengths in play: ${strengths.join('; ')}.`);
  const leans = kwmlPrimaryKeys(answers).filter(energy => KWML_LEANS.includes(answers[kwmlKey(energy, 'lean')])).map(energy => {
    const lean = answers[kwmlKey(energy, 'lean')], data = KWML_ENERGIES[energy];
    const shadow = lean.includes('active') ? data.active.name : lean.includes('passive') ? data.passive.name : lean === 'Oscillating' ? `${data.active.name} / ${data.passive.name}` : '';
    return `${energy}: ${lean}${shadow ? ` (${shadow})` : ''}`;
  });
  if (leans.length) lines.push(`Current expression: ${leans.join('; ')}.`);
  const intensities = supports.filter(energy => KWML_INTENSITIES.includes(answers[kwmlKey(energy, 'intensity')])).map(energy => `${energy}: ${answers[kwmlKey(energy, 'intensity')]}`);
  if (intensities.length) lines.push(`Supporting shadow intensity: ${intensities.join('; ')}.`);
  const effects = kwmlSelectedDirections(answers), pairs = kwmlSelectedPairs(answers);
  const mature = [...effects.filter(option => option.side === 'mature').map(option => option.label), ...pairs.filter(option => option.side === 'mature').map(option => option.label)];
  const distortions = [...effects.filter(option => option.side !== 'mature').map(option => option.label), ...pairs.filter(option => option.side !== 'mature').map(option => option.label)];
  if (mature.length) lines.push(`How the energies work together: ${mature.join(' ')}`);
  if (distortions.length) lines.push(`Possible interaction distortions under pressure: ${distortions.join(' ')}`);
  if (text(answers['kwml:scene'])) lines.push(`In action: ${text(answers['kwml:scene'])}`);
  const risks = kwmlSelectedRisks(answers);
  if (risks.length) lines.push(`Story friction: ${risks.join('; ')}`);
  if (answers['kwml:aware'] === 'yes' || answers['kwml:aware'] === 'no') lines.push(answers['kwml:aware'] === 'yes' ? 'The character is aware of their shadow patterns.' : 'The character is not aware of their shadow patterns.');
  if (KWML_STAGES.includes(answers['kwml:stage'])) lines.push(`Current development: ${answers['kwml:stage']}.`);
  for (const energy of active) if (answers[kwmlKey(energy, 'historyEnabled')] === 'yes' && text(answers[kwmlKey(energy, 'history')])) lines.push(`${energy} · history: ${text(answers[kwmlKey(energy, 'history')])}`);
  const legacy = kwmlLegacyQuestions(answers, questions);
  if (legacy.length) lines.push(`Earlier writing${answers['kwml:legacyPrimary'] ? ` (${answers['kwml:legacyPrimary']})` : ''}:\n${legacy.map(row => `${row.prompt}: ${text(answers[row.textAnswerKey || row.key])}`).join('\n')}`);
  const hook = answers['kwml:hook'] === undefined ? kwmlSuggestedHook(answers) : text(answers['kwml:hook']);
  if (hook) lines.push(`Possible story hook: ${hook}`);
  return lines.filter(Boolean).join('\n\n');
}
