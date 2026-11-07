// The user's two Character Creation Wizard prompts define this writing model.
// These energies belong to the combined Moore/Gillette framework, independently
// of the Pip Decks single-archetype concepts and their combination vocabulary.
export const KWML_ID = 'jungianMasculineArchetypes';
export const KWML_KEYS = ['King', 'Warrior', 'Magician', 'Lover'];
export const KWML_BALANCED = 'Balanced mix';
export const KWML_ENERGIES = {
  King: {
    title: 'Centre & stewardship', icon: 'flag',
    core: 'The centre that orders the inner world and the shared world: reconciles opposites, turns raw energy into usable form and stewards others.',
    strengths: ['Hold a stable centre', 'Empower rather than dominate', 'Support life and cultural creation', 'Create calm order without suppressing instinct'],
    active: { name: 'Tyrant', description: 'An inflated, envious or abusive ruler who uses power to serve only themselves.', effect: 'Suppresses or exploits the other energies.' },
    passive: { name: 'Weakling', description: 'Abdicates responsibility, places power in others, cannot decide and grows resentful.', effect: 'Abandons the other energies, leaving them to inflate, collapse or compete.' },
    matureEffect: 'Orders and empowers the other energies.',
    interaction: 'Without a stable centre, the other energies lose a shared direction.',
    hook: 'A decision that protects the community also limits the character’s own power. Will they steward or dominate?',
  },
  Warrior: {
    title: 'Drive, boundaries & perseverance', icon: 'target',
    core: 'Disciplined aggression in service of something larger: courage, drive, boundaries, perseverance and the ability to maintain what has begun.',
    strengths: ['Fidelity to a worthy mission', 'Focused action', 'Confrontation and clear boundaries', 'Perseverance in service'],
    active: { name: 'Sadist', description: 'Aggression takes possession; vulnerability and fear cannot be acknowledged.', effect: 'Dominates or destroys what the other energies contribute.' },
    passive: { name: 'Masochist', description: 'Avoids honest self-assertion through dependence, hidden resentment or passive aggression.', effect: 'Fails to defend the other energies or becomes their servant.' },
    matureEffect: 'Protects and maintains what the other energies begin.',
    interaction: 'Maintains what the Lover starts. Gives the King defence and the Magician a way to act.',
    hook: 'A worthy mission now requires an honest boundary rather than another sacrifice. Can the character assert it without cruelty?',
  },
  Magician: {
    title: 'Knowledge & transformation', icon: 'book',
    core: 'The knower and technician of transformation: works with hidden knowledge, thresholds and contained space to turn stuck states into new life.',
    strengths: ['Insight', 'Containment and reflective space', 'Problem-solving', 'Steward knowledge for healing'],
    active: { name: 'Trickster', alias: 'Detached Manipulator', description: 'Uses knowledge or technology to manipulate people while remaining detached from the harm.', effect: 'Manipulates the other energies or detaches from them.' },
    passive: { name: 'Innocent One', alias: 'Denying Innocent One', description: 'Denies uncomfortable truths and avoids responsibility for what they know.', effect: 'Denies the other energies’ problems and leaves them unexamined.' },
    matureEffect: 'Sees through and transforms the other energies.',
    interaction: 'Supplies the means of change; without it, patterns remain unexamined or untransformed.',
    hook: 'The character can explain how to change the situation, but must reveal knowledge that also exposes their own responsibility.',
  },
  Lover: {
    title: 'Relatedness, passion & life-force', icon: 'heart',
    core: 'The source of eros, relatedness and life-force: connects, values and initiates intimacy, passion and creative bonds.',
    strengths: ['Emotional and sensory attunement', 'Begin relationships and creative bonds', 'Relatedness and intimacy', 'Reconcile opposites through feeling'],
    active: { name: 'Addict', alias: 'Addicted Lover', description: 'Is overwhelmed by the energy: compulsive seeking, idealisation and collapsed boundaries.', effect: 'Floods and destabilises the other energies.' },
    passive: { name: 'Impotent', alias: 'Impotent Lover', description: 'Loses the capacity to connect, avoids engagement and becomes dependent or emotionally depleted.', effect: 'Starves the other energies of connection and motivation.' },
    matureEffect: 'Initiates and vitalises the other energies.',
    interaction: 'Initiates what the Warrior maintains; supplies feeling and motivation beyond usefulness alone.',
    hook: 'A vivid connection offers new life, but maintaining it requires a commitment that immediate intensity cannot supply.',
  },
};

export const KWML_LEANS = [
  'Mature', 'Mild active shadow', 'Mild passive shadow',
  'Strong active shadow', 'Strong passive shadow', 'Oscillating',
];
export const KWML_INTENSITIES = ['None', 'Mild', 'Moderate'];
export const KWML_STAGES = ['Uninitiated', 'Apprentice', 'Functional', 'Stewarding'];
export const KWML_STAGE_HELP = {
  Uninitiated: 'The energy is present, but they do not yet know how to use it deliberately.',
  Apprentice: 'They are learning to use it, with help, practice and uneven results.',
  Functional: 'They can use it reliably in ordinary circumstances.',
  Stewarding: 'They use it responsibly and help others develop their own capacity.',
};

export const KWML_STEPS = [
  { id: 'foundation', label: 'Foundation', purpose: 'Name the character and choose how these energies belong together.' },
  { id: 'primary', label: 'Primary energy', purpose: 'Emphasise useful strengths and decide how this energy behaves under pressure.' },
  { id: 'supporting', label: 'Supporting energies', purpose: 'Choose what each supporting energy contributes, without writing another whole profile.' },
  { id: 'interactions', label: 'Interactions', purpose: 'Choose how the energies support, limit or distort one another.' },
  { id: 'expression', label: 'Expression & limits', purpose: 'Pick what players will notice, what creates friction and how much the character understands.' },
  { id: 'synthesis', label: 'Synthesis', purpose: 'Review an editable profile and a possible story hook, then save or export it.' },
];

export const KWML_PAIRS = [
  { keys: ['King', 'Warrior'], mature: 'Order and purposeful force: the King gives the Warrior direction; the Warrior gives the King defence.' },
  { keys: ['King', 'Magician'], mature: 'A stable centre joins insight and the means of change.', active: 'Tyrant + Trickster: knowledge and manipulation make domination more sophisticated.' },
  { keys: ['King', 'Lover'], mature: 'Generativity and stewardship stay connected to feeling and relationship.', passive: 'Weakling + Impotent: neither responsibility nor relatedness gets moving.' },
  { keys: ['Warrior', 'Magician'], mature: 'Action and knowledge let an understood change become something practical.', active: 'Sadist + Trickster: aggression and detached manipulation combine into cold cruelty.', passive: 'Masochist + Innocent One: failure to assert and denial leave the character helpless.' },
  { keys: ['Warrior', 'Lover'], mature: 'The Lover initiates connection; the Warrior maintains it through boundaries and commitment.', active: 'Sadist + Addict: aggression and unbounded intensity become destructive passion.', passive: 'Masochist + Impotent: neither assertion nor connection sustains intimacy.' },
  { keys: ['Magician', 'Lover'], mature: 'Insight and feeling bring understanding into relationship.', active: 'Trickster + Addict: manipulation uses fascination or desire to gain control.', passive: 'Innocent One + Impotent: denial and lost connection reinforce disconnection.' },
];

export const kwmlKey = (energy, field) => `kwml:${energy}:${field}`;
export const kwmlList = value => typeof value === 'string' ? value.split(' | ').map(item => item.trim()).filter(Boolean) : [];
export const kwmlPrimary = answers => [...KWML_KEYS, KWML_BALANCED].includes(answers.archetype) ? answers.archetype : '';
export const kwmlSecondaries = answers => kwmlPrimary(answers) === KWML_BALANCED ? [] : [...new Set(kwmlList(answers['kwml:secondary']))].filter(key => KWML_KEYS.includes(key) && key !== kwmlPrimary(answers)).slice(0, 2);
export const kwmlActive = answers => kwmlPrimary(answers) === KWML_BALANCED ? KWML_KEYS : [kwmlPrimary(answers), ...kwmlSecondaries(answers)].filter(Boolean);
export const kwmlPrimaryKeys = answers => kwmlPrimary(answers) === KWML_BALANCED ? KWML_KEYS : [kwmlPrimary(answers)].filter(Boolean);
export const kwmlSteps = answers => KWML_STEPS.filter(step => step.id !== 'supporting' || kwmlSecondaries(answers).length);

export function kwmlDirections(answers, includeShadows = answers['kwml:showDistortion'] === 'yes') {
  return kwmlActive(answers).flatMap(energy => {
    const data = KWML_ENERGIES[energy];
    return [{ id: `${energy}:mature`, energy, label: `${energy}: ${data.matureEffect}`, text: data.matureEffect, side: 'mature' },
      ...(includeShadows ? ['active', 'passive'].map(side => ({ id: `${energy}:${side}`, energy, label: `${data[side].name}: ${data[side].effect}`, text: data[side].effect, side })) : [])];
  });
}
export function kwmlPairChoices(answers, includeShadows = answers['kwml:showDistortion'] === 'yes') {
  const active = kwmlActive(answers);
  return KWML_PAIRS.filter(pair => pair.keys.every(key => active.includes(key))).flatMap(pair => ['mature', ...(includeShadows ? ['active', 'passive'] : [])].filter(side => pair[side]).map(side => ({ id: `${pair.keys.join('+')}:${side}`, keys: pair.keys, side, label: pair[side] })));
}
