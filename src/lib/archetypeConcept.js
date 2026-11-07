import { ARCHETYPE_FIELDS, archetypeFieldGuidance, storyArchetype } from '../data/storyArchetypes.js';

const text = value => typeof value === 'string' ? value.trim() : '';
const clone = value => JSON.parse(JSON.stringify(value));
function atPath(source, path) {
  let graph = source.sub || source, node;
  for (const id of path || []) { node = graph.nodes?.[id]; graph = node?.sub || {}; }
  return node;
}
function fieldFor(source, row) {
  if (row.archetypeField) return row.archetypeField;
  if (row.key === 'focus:subject') return 'purpose';
  if (row.key === 'focus:change') return 'pressure';
  const node = atPath(source, row.nodePath), id = row.nodePath?.at(-1) || row.key;
  if (node?.kind === 'characterArchetypeCombinations' || /archetype-combinations$/.test(id)) return 'blends';
  if (node?.kind === 'characterShadow') return /shadow-up$/.test(id) ? 'excessive' : /shadow-back$/.test(id) ? 'withdrawing' : null;
  if (node?.kind === 'characterArchetypeFacet' || /shadow-facet-(when|say|gift)$/.test(id)) return id.split('-').at(-1);
  return null;
}

// Improve the reference while retaining bindings, question IDs, written answers,
// custom questions and the original graph. No library/game record is rewritten.
export function archetypeConceptQuestions(source, rows = [], previous = []) {
  const reference = storyArchetype(source);
  if (!reference) return clone(rows);
  const combined = [...rows, ...previous.filter(old => !rows.some(row => row.key === old.key))];
  const result = [];
  for (const [field, prompt] of ARCHETYPE_FIELDS) {
    if (field === 'blends' && !reference.blends.length) continue;
    const old = combined.find(row => fieldFor(source, row) === field);
    const guidance = archetypeFieldGuidance(reference, field);
    const key = old?.key || (field === 'purpose' ? 'focus:subject' : field === 'pressure' ? 'focus:change' : `archetype:${field}`);
    result.push({ ...clone(old || {}), key,
      prompt: ['excessive', 'withdrawing'].includes(field) ? `${reference[field].name}: ${prompt.charAt(0).toLowerCase()}${prompt.slice(1)}` : prompt,
      archetypeField: field, hint: guidance.hint, choices: guidance.choices,
      ...(field === 'blends' ? { choiceAnswerKey: old?.choiceAnswerKey || `${key}:choice` } : {}),
    });
  }
  for (const row of combined) if (row.key !== 'application' && !result.some(item => item.key === row.key)) result.push(clone(row));
  return result;
}

export function archetypeBlend(reference, value) {
  return reference.blends.find(row => value === `${reference.label} + ${row.withArchetype} = ${row.name}`) || null;
}

export function archetypeSummary({ source, title, context, questions = [], answers = {}, narrativeText }) {
  if (typeof narrativeText === 'string') return narrativeText.trim();
  const reference = storyArchetype(source);
  if (!reference) return '';
  const answer = field => {
    const row = questions.find(row => row.archetypeField === field);
    return row ? [row.choiceAnswerKey && text(answers[row.choiceAnswerKey]), text(answers[row.textAnswerKey || row.key])].filter(Boolean).join('\n\n') : '';
  };
  const sentence = (prefix, value) => value ? `${prefix}: ${value.replace(/[\s.!?]+$/u, '')}.` : '';
  const purpose = [sentence('Purpose', answer('purpose')), sentence('In action', answer('when')), sentence('Gift to others', answer('gift'))].filter(Boolean).join(' ');
  const pressures = [sentence('Under pressure', answer('pressure')), sentence(`Pushed too far (${reference.excessive.name})`, answer('excessive')), sentence(`Disconnected from their gift (${reference.withdrawing.name})`, answer('withdrawing'))].filter(Boolean).join(' ');
  return [text(title), text(context), purpose, answer('say') && `Their voice: ${answer('say')}`, pressures, answer('blends') && `Another side: ${answer('blends')}`, ...questions.filter(row => !row.archetypeField && text(answers[row.key])).map(row => `${row.prompt}\n${text(answers[row.key])}`)].filter(Boolean).join('\n\n');
}
