import { metaProgramProfile } from '../data/metaProgramWizard.js';

const clean = value => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '');
const sentence = value => {
  const content = clean(value);
  return content ? content[0].toLocaleUpperCase() + content.slice(1) + (/[.!?…][”"']?$/.test(content) ? '' : '.') : '';
};
const clause = value => clean(value).replace(/[.!]+$/, '');
const embedded = value => clause(value).replace(/^(The|An?|They|Their|He|His|She|Her|It|This|That|To|Ask|Reach|Follow|Compare|Find|Protect|Save|Show|Offer|Seek|Stop|Wait|Help|Build|Get|Become)\b/, word => word.toLowerCase());
const list = values => values.length < 2 ? values[0] || '' : `${values.slice(0, -1).join(', ')} and ${values.at(-1)}`;

// This is a prose formatter, not a personality assessment. Only recorded choices
// and the writer's own details contribute to the description.
export function metaProgramNarrative({ answers = {}, context = '' }) {
  const profile = metaProgramProfile(answers);
  const lines = [];
  const add = value => { const next = sentence(value); if (next && !lines.includes(next)) lines.push(next); };
  const notes = key => add(answers[key]);
  add(context);
  notes('focus:subject');
  add({
    'Strongly toward': 'They are driven by the possibilities ahead, eager to pursue what they want',
    'Mostly toward': 'They tend to follow the promise of something better, even while keeping an eye on the risks',
    Toward: 'They are drawn toward what they hope to achieve',
    Mixed: 'They weigh the promise of a better future against what they stand to lose',
    'Both / depends on the situation': 'What draws them forward and what holds them back depends on the situation',
    'Mostly away': 'They usually act to protect what matters, though a worthwhile opportunity can draw them forward',
    'Strongly away': 'Above all, they want to keep danger from reaching what matters to them',
    'Away From': 'They are driven to prevent trouble and protect what matters to them',
  }[profile.motivation]);
  notes('phase:1');
  add({ Proactive: 'Rather than wait for events to decide their course, they make the first move', Reactive: 'They watch what happens and choose their moment to respond', 'Both / depends on the situation': 'They can take the lead or wait and respond, depending on what the moment calls for' }[profile.action]);
  notes('phase:3');
  add({ 'Strongly big picture': 'Their attention goes straight to the larger picture', 'Mostly big picture': 'They look for the larger picture before turning to the details', Global: 'They make sense of events by looking at the larger picture', Mixed: 'They move between the larger picture and the details needed to make it real', 'Both / depends on the situation': 'They shift between the larger picture and close attention to detail as needed', 'Mostly detail': 'They prefer to understand the details before drawing a larger conclusion', 'Strongly detail': 'They notice the small details and want to know how each step works', Detail: 'They trust a clear understanding of the details and the steps ahead' }[profile.informationScope]);
  notes('phase:4');
  const interests = profile.interests.map(value => ({ People: 'the people around them', Places: 'their surroundings', Things: 'objects and equipment', Activities: 'what people are doing', Information: 'what can be learned' })[value]).filter(Boolean);
  if (interests.length) add(`They pay particular attention to ${list(interests)}`);
  notes('mp:interests');
  add({ Internal: 'When a decision matters, they trust their own judgment', External: 'Before committing to a decision, they look for evidence and feedback from others', 'Both / depends on the situation': 'They weigh their own judgment alongside evidence and advice from others' }[profile.evaluation]);
  notes('phase:2');
  add({ Sameness: 'With other people, they first look for common ground', Difference: 'They are quick to notice differences and question what does not fit', 'Sameness, then exceptions': 'They find common ground first, then draw attention to the exceptions', 'Both / depends on the situation': 'They may seek agreement or question the differences, depending on the conversation' }[profile.comparison]);
  notes('phase:5');
  const bothMethods = profile.execution === 'Both / depends on the situation' || profile.execution?.split(' | ').length === 2;
  add(bothMethods ? 'They value a reliable way forward, but keep alternatives within reach' : { Options: 'They prefer room to explore alternatives and find their own way forward', Procedures: 'They work best with a clear method they can follow step by step' }[profile.execution]);
  notes('phase:6');
  const roles = profile.creativeRoles.map(value => ({ Dreamer: 'imagining possibilities', Planner: 'turning ideas into a workable plan', Reviewer: 'spotting risks and improving the plan' })[value]).filter(Boolean);
  if (roles.length) add(`In a shared task, they contribute by ${list(roles)}`);
  notes('mp:creativeRole');
  const explanations = profile.explanations.map(value => ({ 'Examples and analogies': 'examples that make an idea easy to picture', 'Facts and evidence': 'facts they can check', 'Clear steps': 'clear steps they can follow' })[value]).filter(Boolean);
  if (explanations.length) add(`To get through to them, it helps to offer ${list(explanations)}`);
  notes('mp:explanations');
  add({ 'Their own view': 'In a disagreement, they begin with their own experience of what happened', 'The other person’s view': 'In a disagreement, they try to see what the other person is experiencing', 'An outside view': 'In a disagreement, they step back to consider what an outside observer would see', 'The whole group': 'In a disagreement, they consider what the outcome will mean for the whole group' }[profile.viewpoint]);
  notes('mp:viewpoint');
  const words = profile.words.map(value => ({ Images: 'images', Sounds: 'sounds', 'Feelings and sensations': 'feelings and physical sensations', 'Reasons and logic': 'reasons and logic' })[value]).filter(Boolean);
  if (words.length) add(`Their way of speaking draws on ${list(words)}`);
  notes('mp:words');
  if (clean(profile.dialogue)) {
    const dialogue = clause(clean(profile.dialogue).replace(/^[“"]|[”"]$/g, ''));
    lines.push(`“${dialogue}${/[?!…]$/.test(dialogue) ? '' : '.'}”`);
  }
  add({ 'The present moment': 'Their attention stays close to what is happening now', 'The longer timeline': 'They place the present moment within a longer chain of events', Both: 'They stay aware of the present while considering what comes next' }[profile.timeFocus]);
  notes('mp:time');
  notes('focus:change');
  if (clean(profile.scene.challenge)) add(`Their usual approach is tested when ${embedded(profile.scene.challenge)}`);
  if (clean(profile.scene.goal)) add(`For now, one thing matters: ${embedded(profile.scene.goal)}`);
  if (clean(profile.scene.response)) {
    const response = clause(profile.scene.response);
    // An instruction such as “Ask the council” reads differently from the
    // writer's complete sentence “Mira asks the council”. Keep complete prose.
    if (/^(ask|reach|follow|compare|find|protect|save|show|offer|seek|stop|wait|help|build|get|become|refuse|listen|look|leave|take|try|speak|run|hide|fight|accept|search|call|gather|return|make)\b/i.test(response)) add(`They ${response[0].toLowerCase()}${response.slice(1)}`);
    else add(response);
  }
  for (const exception of profile.exceptions) {
    if (clean(exception.when) && clean(exception.change)) add(`When ${embedded(exception.when)}, their usual pattern changes: ${embedded(exception.change)}`);
    else { add(exception.when); add(exception.change); }
    add(exception.example);
    if (clean(exception.return)) add(`What brings them back is ${embedded(exception.return)}`);
  }
  notes('mp:cause');
  if (clean(profile.scene.resource)) add(`To move forward, they need ${embedded(profile.scene.resource)}`);
  const turns = profile.turningPoints.map(value => ({ 'Their usual approach stops working': 'finding that their usual approach no longer works', 'A familiar situation offers a new choice': 'facing a familiar situation with a new choice', 'Support from another person': 'accepting support from another person', 'A discovery changes their view': 'making a discovery that changes their view' })[value]).filter(Boolean);
  if (turns.length) add(`Change may begin with ${list(turns)}`);
  notes('mp:turningPoints');
  // These are possible outcomes, not two events that necessarily both happen.
  if (clean(profile.scene.success)) add(`If they succeed, ${embedded(profile.scene.success)}`);
  if (clean(profile.scene.setback)) add(`If they fall short, ${embedded(profile.scene.setback)}`);
  return lines.join(' ');
}
