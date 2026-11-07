// Optional authoring labels, independent of questionnaire answers and protected prose.
export const ATTRIBUTE_CATEGORIES = [
  ['personality', 'Personality', '✦'], ['appearance', 'Appearance', '◈'],
  ['abilities', 'Skills & interests', '⚒'], ['philosophy', 'Philosophy & values', '◇'],
  ['custom', 'Custom', '+'],
];

export const ATTRIBUTE_PRESETS = [
  { id: 'philosophy', label: 'Philosophy schools', category: 'philosophy', kind: 'tags', options: ['Absurdism', 'Cynicism', 'Ecocentrism', 'Existentialism', 'Humanism', 'Idealism', 'Nihilism', 'Pragmatism', 'Rationalism', 'Skepticism', 'Stoicism', 'Utilitarianism', 'Virtue ethics', 'Duty ethics', 'Care ethics', 'Hedonism', 'Confucianism', 'Daoism'] },
  { id: 'ethicalPrinciple', label: 'Ethics & guiding principle', category: 'philosophy', kind: 'text' },
  { id: 'valueOrientation', label: 'Values & outlook', category: 'philosophy', kind: 'tags', options: ['Dogmatic', 'Flexible', 'Individualist', 'Collectivist', 'Traditional', 'Reformist', 'Compassionate', 'Pragmatic'] },
  { id: 'authorityStyle', label: 'Authority style', category: 'philosophy', kind: 'tags', options: ['Consensus', 'Elected leadership', 'Hereditary leadership', 'Expertise', 'Seniority', 'Command hierarchy', 'Shared leadership'] },
  { id: 'socialExpectations', label: 'Social expectations', category: 'philosophy', kind: 'text' },
  { id: 'personality', label: 'Personality', category: 'personality', kind: 'tags', options: ['Curious', 'Cautious', 'Bold', 'Patient', 'Impulsive', 'Loyal', 'Independent', 'Generous', 'Reserved', 'Sociable', 'Practical', 'Idealistic'] },
  { id: 'strengths', label: 'Strengths', category: 'personality', kind: 'tags', options: ['Courage', 'Compassion', 'Honesty', 'Patience', 'Creativity', 'Discipline', 'Humility', 'Fairness'] },
  { id: 'flaws', label: 'Flaws', category: 'personality', kind: 'tags', options: ['Pride', 'Envy', 'Stubbornness', 'Distrust', 'Recklessness', 'Greed', 'Impatience', 'Avoidance'] },
  { id: 'enneagram', label: 'Enneagram-inspired roles', category: 'personality', kind: 'tags', options: ['Reformer', 'Helper', 'Achiever', 'Individualist', 'Investigator', 'Loyalist', 'Enthusiast', 'Challenger', 'Peacemaker'] },
  { id: 'virtues', label: 'Virtues', category: 'personality', kind: 'tags', options: ['Faith', 'Hope', 'Charity', 'Fortitude', 'Justice', 'Temperance', 'Prudence'] },
  { id: 'physicalSignature', label: 'Physical signature', category: 'appearance', kind: 'tags', options: ['Tall', 'Short', 'Broad build', 'Slender build', 'Scar', 'Distinctive eyes', 'Weathered face', 'Upright posture', 'Stooped posture'] },
  { id: 'clothing', label: 'Clothing & possessions', category: 'appearance', kind: 'tags', options: ['Uniform', 'Work clothes', 'Formal clothes', 'Worn clothes', 'Jewellery', 'Signature accessory'] },
  { id: 'appearanceNote', label: 'Appearance note', category: 'appearance', kind: 'text' },
  { id: 'mannerisms', label: 'Mannerisms', category: 'appearance', kind: 'tags', options: ['Fidgets', 'Avoids eye contact', 'Holds eye contact', 'Gestures widely', 'Moves deliberately', 'Restless'] },
  { id: 'skills', label: 'Skills', category: 'abilities', kind: 'tags', options: ['Negotiation', 'Leadership', 'Crafting', 'Tracking', 'Medicine', 'Research', 'Combat', 'Performance'] },
  { id: 'interests', label: 'Interests', category: 'abilities', kind: 'tags', options: ['Art', 'Music', 'Nature', 'History', 'Technology', 'Sport', 'Travel', 'Collecting'] },
];

const clean = value => typeof value === 'string' ? value.trim() : '';
export const characterAttributeFields = node => Array.isArray(node?.characterAttributes?.fields)
  ? node.characterAttributes.fields.filter(field => field && typeof field.id === 'string' && typeof field.label === 'string') : [];

export function attributeValues(field) {
  if (field.kind === 'text') return clean(field.value) ? [clean(field.value)] : [];
  const seen = new Set();
  return (Array.isArray(field.values) ? field.values : []).map(clean).filter(value => {
    const key = value.toLocaleLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  });
}

export function newAttributeField(preset) {
  return { id: preset.id, label: preset.label, category: preset.category, kind: preset.kind, ...(preset.kind === 'text' ? { value: '' } : { values: [] }) };
}

export function toggleAttributeValue(field, value) {
  const values = attributeValues(field), trimmed = clean(value);
  const exists = values.some(item => item.toLocaleLowerCase() === trimmed.toLocaleLowerCase());
  return { ...field, values: exists ? values.filter(item => item.toLocaleLowerCase() !== trimmed.toLocaleLowerCase()) : trimmed ? [...values, trimmed] : values };
}

export function characterAttributesText(node) {
  return characterAttributeFields(node).map(field => {
    const values = attributeValues(field);
    return values.length ? `${field.label}: ${values.join(', ')}` : '';
  }).filter(Boolean).join('\n');
}

export function characterAttributeChips(node) {
  const seen = new Set();
  return characterAttributeFields(node).filter(field => field.kind !== 'text').flatMap(field => attributeValues(field).map(value => ({ label: field.label, value }))).filter(row => {
    const key = row.value.toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}
