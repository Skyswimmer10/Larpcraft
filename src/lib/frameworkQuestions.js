import { FOCUS_STARTERS, NARRATIVE_FOCUSES, defaultNarrativeFocus } from '../data/narrativeGuidance.js';
import { selectedArchetype } from './narrativeMemory.js';
import { metaProgramQuestions } from '../data/metaProgramWizard.js';

const row = (key, prompt, hint = '', extra = {}) => ({ key, prompt, hint, ...extra });
export const focusStarters = focus => (FOCUS_STARTERS[focus] || []).map(([key, prompt]) => row(key, prompt, 'Start with the situation you are actually writing. A short answer is enough.'));

const FATE = {
  character: ['What captures this character’s attention?', 'Why do others trust or listen to this character?', 'Where do they belong, and whose approval matters?', 'What feeling drives their next decision?'],
  communication: ['What should the listener notice or remember first?', 'What makes the message or speaker credible to this listener?', 'What shared identity or belonging gives the message meaning?', 'What feeling should the message evoke, and through which detail?'],
  relationship: ['What does each side pay attention to or overlook?', 'Whose voice is trusted, and why?', 'What makes the sides feel included or excluded?', 'What feeling strengthens or strains this relationship?'],
  values: ['Which value or stake needs attention?', 'Who or what makes a claim about what is right?', 'How does belonging influence the choice?', 'What feeling makes this choice matter?'],
  scene: ['What draws players toward the important part of this encounter?', 'Why do players believe this event or request has weight?', 'How are players personally or socially involved?', 'What should they feel at the key moment, and what creates that feeling?'],
  story: ['What central question holds attention across the story?', 'What makes the events and their consequences believable?', 'How does the story connect people to a group or shared identity?', 'Which moments carry the emotional change?'],
  learning: ['What should learners pay attention to?', 'Why should they trust the demonstration or evidence?', 'How does learning connect them with others?', 'What feeling supports curiosity or reflection?'],
  style: ['What does the opening or presentation make most noticeable?', 'Which voice or details make the telling credible?', 'Who does this voice invite into its audience?', 'How do wording, imagery, or delivery create the intended feeling?'],
};

const SUBJECTS = {
  character: 'this character', relationship: 'the people or groups involved', communication: 'the speaker and listener',
  values: 'the people facing this choice', scene: 'the participants in this encounter', story: 'the people whose situation changes',
  learning: 'the learners', style: 'the audience experiencing this presentation',
};

const DESCENT = {
  character: ['What is their normal life, and what is missing?', 'What knocks their life off course?', 'At their lowest point, what do they discover?', 'What do they do with what they learned?', 'How are they different after recovering?'],
  relationship: ['What is stable or missing in the relationship at the start?', 'What damages trust or cooperation?', 'At the lowest point, what do the sides realise?', 'What action starts to repair or change the relationship?', 'What new relationship becomes possible afterward?'],
  story: ['What is stable at the beginning, and what potential is unused?', 'What event disrupts that situation?', 'What is the crisis, and what becomes clear within it?', 'What choices move the story toward recovery?', 'What is different in the new situation at the end?'],
};
const VOYAGE = {
  character: ['What makes home familiar, and what is missing?', 'What do they want enough to leave home?', 'What unfamiliar situation do they enter?', 'What must they learn or change to cope?', 'What do they finally obtain?', 'What does getting it cost them?', 'What happens when they return?', 'What has changed in them, and how does it affect home?'],
  relationship: ['What familiar relationship do the sides begin with?', 'What need draws them beyond their usual roles?', 'What unfamiliar situation tests their relationship?', 'How do they learn to work with each other?', 'What do they achieve together or separately?', 'What does that achievement cost their relationship?', 'What happens when they return to familiar circumstances?', 'How have trust, roles, or closeness changed?'],
  story: ['What is home or the familiar starting situation?', 'What need starts the journey?', 'What unfamiliar world or problem is entered?', 'How do the participants adapt?', 'What desired thing do they obtain?', 'What price or difficult consequence comes with it?', 'How does the journey return to the starting world?', 'What has changed, and how does it affect that world?'],
};

const ARCHETYPE_ACTIONS = {
  King: 'create fair order, recognise others, and take responsibility',
  Warrior: 'use courage, discipline, and boundaries with restraint',
  Magician: 'use knowledge and craft, and share understanding responsibly',
  Lover: 'bring feeling, imagination, and connection while respecting boundaries',
  Mother: 'care for others while helping them become independent',
  Companion: 'build closeness while leaving room for two distinct people',
  Amazon: 'pursue a purpose independently while accepting useful help',
  'Medial Woman': 'give meaning to intuitions and turn them into responsible action',
};

function archetypeQuestions(framework, answers, focus) {
  const phase = selectedArchetype(framework, answers.archetype);
  const other = selectedArchetype(framework, answers.otherRole);
  const relationship = focus === 'relationship';
  const character = focus === 'character';
  const subject = character ? 'this character' : relationship ? 'the person or group on this side' : `a person or role involved in this ${NARRATIVE_FOCUSES[focus].label.toLowerCase()}`;
  const description = key => phase?.descriptions?.[key] || '';
  const shadow = (key, childKey) => [phase?.[key], description(key), phase?.[childKey], description(childKey)].filter(Boolean).join(' · ');
  return [
    row('archetype', relationship ? 'Which archetype shapes one side of this relationship?' : character ? 'Which archetype would you like to explore?' : 'Which archetype could help you understand a role in this situation?', phase ? `${phase.key}: ${description('adult')}` : 'A writing lens. Any person can express several roles.', { choices: framework.phases.map(p => p.key), choiceAnswerKey: 'archetype', textAnswerKey: 'archetype:notes' }),
    ...(relationship ? [row('otherRole', 'What role does the other side take, and what do they need from this side?', other ? `${other.key}: ${other.descriptions.adult}` : 'You can choose another archetype or describe a different role.', { choices: framework.phases.map(p => p.key), choiceAnswerKey: 'otherRole', textAnswerKey: 'otherRole:notes' })] : []),
    row('strength', phase ? relationship ? `How does the ${phase.key}${other ? ` support or clash with the ${other.key}` : ' support or clash with the other side'}? What does each side need?` : `How does ${subject}, as the ${phase.key}, ${ARCHETYPE_ACTIONS[phase.key]}?` : relationship ? 'How do these roles support each other, and where do their needs clash?' : `How does ${subject} show the healthy side of this archetype?`, [description('adult') || phase?.short, other && `Other side — ${other.key}: ${other.descriptions.adult}`].filter(Boolean).join('\n\n'), { dependsOn: ['archetype', 'otherRole'] }),
    ...(phase?.descriptions?.child || framework.phases.some(p => p.descriptions?.child) ? [row('root', phase ? `What remains of the ${phase.name} in this ${phase.key}, and where do they still need to grow?` : `What younger or less experienced side of ${subject} still shows through?`, phase?.descriptions?.child ? `${phase.name} · ${description('child')}` : 'Choose an archetype to see its developing form.', { dependsOn: ['strength'] })] : []),
    row('activeShadow', phase ? `What could push this ${phase.key} toward the ${phase.adultActiveShadow}? Who would feel the effects?` : relationship ? 'How does this role become controlling, excessive, or harmful to the other side?' : `Under pressure, how might ${subject} misuse their strength?`, shadow('adultActiveShadow', 'childActiveShadow'), { dependsOn: ['strength', 'otherRole'] }),
    row('passiveShadow', phase ? `When this ${phase.key} gives up or withdraws, how does the ${phase.adultPassiveShadow} appear? What responsibility or connection is lost?` : relationship ? 'What happens between the sides when this role withdraws or gives up?' : `When ${subject} withdraws or gives up, what does that look like?`, shadow('adultPassiveShadow', 'childPassiveShadow'), { dependsOn: ['strength', 'activeShadow'] }),
    row('shadowScene', phase ? `What scene could test this ${phase.key} between its healthy side, the ${phase.adultActiveShadow}, and the ${phase.adultPassiveShadow}? What choice could change the pattern?` : relationship ? 'What could bring out the shadow, and what boundary or action could change the pattern?' : 'What situation brings out a shadow, and what could help that role recover?', framework.id === 'jungianFeminineArchetypes' ? 'Describe an observable choice. This reference uses adult roles and Larpcraft shadow adaptations; it has no child-form system.' : 'Describe an observable choice and its consequences.', { dependsOn: ['activeShadow', 'passiveShadow'] }),
  ];
}

export function frameworkQuestions(framework, answers = {}, focus = defaultNarrativeFocus(framework, 'framework')) {
  if (!framework) return [];
  const scope = NARRATIVE_FOCUSES[focus] ? focus : defaultNarrativeFocus(framework, 'framework');
  if (framework.id === 'nlpMetaPrograms') return metaProgramQuestions(framework, answers, scope);
  const subject = SUBJECTS[scope];
  if (framework.layout === 'archetypes') return [...focusStarters(scope), ...archetypeQuestions(framework, answers, scope)];
  const phaseQuestions = (framework.phases || []).map((phase, index) => {
    let prompt;
    if (framework.id === 'fate') prompt = FATE[scope][index];
    if (framework.id === 'kolbLearningCycle') prompt = [
      `What direct experience starts learning or discovery for ${subject}?`,
      `How can ${subject} reflect on what happened and compare interpretations?`,
      `What idea or explanation could ${subject} form from that experience?`,
      `Where can ${subject} test that idea through a new action?`,
    ][index];
    if (framework.id === 'descentAndRecovery') prompt = (DESCENT[scope] || DESCENT.story)[index];
    if (framework.id === 'homeVoyageReturn') prompt = (VOYAGE[scope] || VOYAGE.story)[index];
    if (framework.id === 'storyBuildingSystem') {
      const object = NARRATIVE_FOCUSES[scope].result.toLowerCase();
      prompt = [
        `Why is this ${object} needed, and what is its central idea?`,
        'Which experiences, details, or unanswered questions could supply its material?',
        'Whose perspective carries it, and what does each person contribute?',
        'What should players or listeners understand, feel, or do because of it?',
        'What sequence of events or ideas makes it easy to follow?',
        'Which voice, tone, imagery, and emphasis suit it?',
        'Where, when, and through which people or medium will it reach its audience?',
        'Which choices from these answers form a useful working approach?',
      ][index];
    }
    if (framework.layout === 'values') {
      const pair = `${phase.key} / ${phase.name}`;
      prompt = {
        character: `What does “${pair}” mean to this character, and what choice puts it at risk?`,
        relationship: `Where do the sides differ about “${pair}”, and how does that affect trust, obligation, or power?`,
        communication: `How does “${pair}” change what a speaker says and what a listener hears?`,
        values: `How does “${pair}” shape the dilemma? Who benefits or suffers, and what other value competes with it?`,
        scene: `What playable choice in this encounter puts “${pair}” at stake?`,
        story: `How does “${pair}” change across the story, and which event turns it?`,
        learning: `What experience could reveal different views about “${pair}” without prescribing the answer?`,
        style: `How could the voice, imagery, or viewpoint make “${pair}” felt by the audience?`,
      }[scope];
    }
    if (framework.layout === 'languageSpectrum') {
      const pattern = phase.name.toLowerCase();
      prompt = scope === 'relationship' ? `Write something one side assumes about the other using ${pattern}. What clarifying question and answer could change their understanding?`
        : scope === 'character' ? `How might this character use ${pattern} in dialogue? Write their line, a clarifying question, and what the reply reveals.`
          : scope === 'style' ? `How could ${pattern} shape a narrator’s wording? Write the compressed version, a question about it, and a clearer version.`
            : `Write a line using ${pattern}, the question that uncovers what it means, and a possible more specific reply.`;
    }
    if (framework.layout === 'preferenceSpectra') {
      const pair = `${phase.left} / ${phase.right}`;
      prompt = scope === 'character' ? phase.question
        : scope === 'communication' ? `For “${pair}”, what approach does the listener need, and how could the speaker adapt the message? Give an example line.`
          : scope === 'relationship' ? `How do the sides differ on “${pair}”? When does that difference help, and when does it cause friction?`
            : scope === 'learning' ? `How can learners approach the experience from either end of “${pair}”, and compare what they notice?`
              : `How might different preferences for “${pair}” change the choices, instructions, or reactions in this situation?`;
    }
    if (framework.layout === 'profileDomains') prompt = scope === 'character' ? `${phase.short} Show this through a scene or behaviour.`
      : scope === 'relationship' ? `How might “${phase.name}” in one fictional person affect this relationship? Describe the other side’s response as well.`
        : `How might “${phase.name}” in one fictional participant affect this situation? Show behaviour and consequences rather than labelling the whole group.`;
    const hint = framework.layout === 'languageSpectrum'
      ? `Reference example: “${phase.example}” → “${phase.question}” → “${phase.clarified}”`
      : [phase.short, phase.children?.join(' · ')].filter(Boolean).join(' ');
    const key = `phase:${phase.key}`;
    const choices = framework.layout === 'preferenceSpectra' ? [phase.left, phase.right, 'Both / depends on the situation'] : framework.layout === 'values' ? [phase.key, phase.name, 'Both / in conflict'] : null;
    return row(key, prompt || `How could “${phase.name || phase.key}” help you develop this ${NARRATIVE_FOCUSES[scope].result.toLowerCase()}?`, hint, {
      ...(choices ? { choices, choiceAnswerKey: `${key}:choice` } : {}),
      ...(index ? { dependsOn: [`phase:${framework.phases[index - 1].key}`] } : {}),
    });
  });
  return [...focusStarters(scope), ...phaseQuestions];
}
