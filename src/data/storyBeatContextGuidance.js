// Optional follow-ups belong to the selected opener, not a new story system.
// Text is deliberately authored: changing a choice never guesses at prose.
const icons = ['search', 'users', 'book', 'alert'];
const tones = ['blue', 'teal', 'violet', 'amber'];
const options = rows => rows.map(([id, label, text], i) => ({ id, label, text, icon: icons[i % icons.length], tone: tones[i % tones.length] }));
const prompt = (id, label, rows, multiple = false) => ({ id, label, options: options(rows), multiple });

const families = {
  information: {
    subject: 'the information',
    difficulties: [
      ['witnesses', 'Conflicting witnesses', 'Two witnesses give conflicting accounts of the information'],
      ['evidence', 'Missing evidence', 'The evidence needed to verify the information is missing'],
      ['trusted', 'Trusted messenger', '{other} trusts the messenger despite doubts about the account'],
      ['benefits', 'Someone benefits', '{beneficiary} benefits from keeping the truth unclear'],
    ],
    actions: [
      ['messenger', 'Question the messenger', 'Players can question {messenger} about where the information came from'],
      ['compare', 'Compare accounts', 'Players can compare the conflicting accounts to find what differs'],
      ['evidence', 'Find evidence', 'Players can search for evidence that confirms or challenges the account'],
      ['confront', 'Confront the subject', 'Players can ask {actor} to respond to the account'],
    ],
    outcomes: [
      ['cleared', 'Clear their name', '{actor} could be cleared of suspicion'],
      ['suspicion', 'Suspicion spreads', 'Suspicion about {actor} could spread to others'],
      ['source', 'Expose the source', 'The source of the information could become known to {other}'],
      ['hidden', 'Source stays hidden', 'The source of the information could remain unknown to {other}'],
    ],
  },
  bargain: {
    subject: 'the request or agreement',
    difficulties: [
      ['price', 'Hidden price', 'The agreement carries a cost that {other} did not expect'],
      ['ability', 'Cannot deliver', '{actor} cannot provide what the agreement requires'],
      ['terms', 'Disputed terms', '{actor} and {other} disagree about what was promised'],
      ['third', 'Cost falls elsewhere', 'Keeping the agreement would harm {beneficiary}'],
    ],
    actions: [
      ['terms', 'Clarify the terms', 'Players can ask {actor} and {other} to state what each expects'],
      ['offer', 'Propose another offer', 'Players can propose different terms for the agreement'],
      ['means', 'Find what is missing', 'Players can help obtain what is needed to keep the agreement'],
      ['refuse', 'Refuse the bargain', 'Players can refuse to support the agreement and explain why'],
    ],
    outcomes: [
      ['kept', 'Agreement kept', '{actor} and {other} could fulfil the agreement'],
      ['changed', 'Terms renegotiated', '{actor} and {other} could accept different terms'],
      ['broken', 'Agreement breaks', 'The agreement between {actor} and {other} could break down'],
      ['debt', 'A new debt', '{other} could owe {actor} a new favour'],
    ],
  },
  conflict: {
    subject: 'the dispute',
    difficulties: [
      ['claims', 'Both claims seem fair', '{actor} and {other} each have a defensible claim'],
      ['audience', 'Public pressure', 'An audience expects {actor} to stand by the claim'],
      ['proof', 'Evidence challenged', '{other} challenges the evidence behind the claim'],
      ['cost', 'Winning hurts someone', 'A victory for {actor} would come at {other}’s expense'],
    ],
    actions: [
      ['hear', 'Hear both sides', 'Players can hear {actor} and {other} separately before judging the dispute'],
      ['test', 'Test the claims', 'Players can look for evidence that distinguishes the competing claims'],
      ['mediate', 'Mediate', 'Players can propose a settlement between {actor} and {other}'],
      ['side', 'Choose a side', 'Players can support one claim and accept the consequences for the other side'],
    ],
    outcomes: [
      ['settle', 'Reach a settlement', '{actor} and {other} could settle their dispute'],
      ['win', 'One claim prevails', '{actor}’s claim could prevail over {other}’s'],
      ['escalate', 'Conflict escalates', 'The dispute between {actor} and {other} could escalate'],
      ['delay', 'Decision postponed', 'The dispute could remain unresolved while further evidence is sought'],
    ],
  },
  possession: {
    subject: 'the dispute over {item}',
    difficulties: [
      ['claims', 'Two valid claims', '{actor} and {other} both have a plausible claim to {item}'],
      ['custodian', 'Custodian refuses', '{custodian} refuses to hand over {item}'],
      ['condition', 'Item has changed', '{item} is no longer in the condition {other} expects'],
      ['deadline', 'Needed elsewhere', '{item} is needed elsewhere before the claim can be settled'],
    ],
    actions: [
      ['trace', 'Trace the item', 'Players can trace who last held {item}'],
      ['ownership', 'Check the claim', 'Players can seek evidence of who has a right to {item}'],
      ['exchange', 'Negotiate an exchange', 'Players can negotiate an exchange for {item}'],
      ['recover', 'Recover the item', 'Players can try to recover {item} for {other}'],
    ],
    outcomes: [
      ['return', 'Item returned', '{item} could be returned to {other}'],
      ['kept', 'Holder keeps it', '{actor} could keep {item}'],
      ['shared', 'Shared use agreed', '{actor} and {other} could agree to share the use of {item}'],
      ['lost', 'Item remains missing', '{item} could remain unavailable to both {actor} and {other}'],
    ],
  },
  loyalty: {
    subject: 'the question of loyalty',
    difficulties: [
      ['promise', 'Two promises conflict', '{actor} cannot honour both commitments at once'],
      ['test', 'Proof of loyalty demanded', '{other} demands a concrete act of loyalty from {actor}'],
      ['secret', 'Loyalty must stay secret', '{actor} cannot openly explain the reason for the allegiance'],
      ['cost', 'Someone pays the cost', 'Keeping faith with {other} would harm {beneficiary}'],
    ],
    actions: [
      ['understand', 'Understand each bond', 'Players can ask {actor} what each allegiance means to them'],
      ['alternative', 'Find another way', 'Players can seek a way for {actor} to honour both commitments'],
      ['support', 'Offer support', 'Players can help {actor} bear the cost of choosing an allegiance'],
      ['test', 'Challenge the demand', 'Players can question whether {other}’s demand is fair'],
    ],
    outcomes: [
      ['kept', 'Bond strengthened', 'The bond between {actor} and {other} could grow stronger'],
      ['broken', 'Bond broken', 'The bond between {actor} and {other} could break'],
      ['balanced', 'Commitments reconciled', '{actor} could find a way to reconcile the commitments'],
      ['cost', 'Loyalty creates a debt', '{actor}’s choice could leave a new obligation to {other}'],
    ],
  },
  disruption: {
    subject: 'the disruption',
    difficulties: [
      ['cause', 'Cause is unclear', '{actor} does not yet know why the plan failed'],
      ['backup', 'Backup also fails', 'The fallback available to {actor} cannot solve the problem'],
      ['time', 'Time is running out', '{actor} has little time to respond before the disruption spreads'],
      ['cost', 'Workaround has a cost', 'The available workaround would place a new burden on {other}'],
    ],
    actions: [
      ['cause', 'Find the cause', 'Players can investigate why the disruption occurred'],
      ['repair', 'Attempt a repair', 'Players can help {actor} restore what stopped working'],
      ['substitute', 'Find an alternative', 'Players can find a substitute for what {actor} lost'],
      ['contain', 'Limit the damage', 'Players can help {other} avoid the disruption’s further effects'],
    ],
    outcomes: [
      ['restored', 'Plan restored', '{actor} could resume the original plan'],
      ['adapted', 'A different plan', '{actor} could adopt a different plan'],
      ['spread', 'Disruption spreads', 'The disruption could spread to {other}'],
      ['contained', 'Damage contained', 'The immediate damage could be contained without restoring the original plan'],
    ],
  },
  pressure: {
    subject: 'the pressure to act',
    difficulties: [
      ['window', 'Opportunity is brief', '{actor} has only a short opportunity to act'],
      ['rival', 'Another claim competes', '{other} needs the same limited resource as {actor}'],
      ['cost', 'Action has a price', 'Acting would require {actor} to give up another commitment'],
      ['uncertain', 'Consequences unclear', '{actor} cannot yet tell what taking the opportunity will cost'],
    ],
    actions: [
      ['check', 'Check the risk', 'Players can investigate the risk before {actor} acts'],
      ['help', 'Provide the means', 'Players can help obtain what {actor} needs to act'],
      ['negotiate', 'Negotiate time', 'Players can ask {other} for more time or different terms'],
      ['choose', 'Choose a priority', 'Players can help {actor} decide which commitment to protect'],
    ],
    outcomes: [
      ['met', 'Need is met', '{actor} could obtain what is needed'],
      ['missed', 'Opportunity passes', '{actor} could lose the opportunity to act'],
      ['cost', 'Success has a cost', '{actor} could succeed at the cost of another commitment'],
      ['new', 'A new possibility', 'The response could reveal a different opportunity for {actor}'],
    ],
  },
  encounter: {
    subject: 'the encounter',
    difficulties: [
      ['meaning', 'Signs are misleading', 'The signs at {place} support more than one explanation'],
      ['guard', 'Someone blocks inquiry', '{custodian} prevents the players from examining what they found'],
      ['urgent', 'Someone needs help now', '{other} needs help before the players can investigate further'],
      ['trap', 'A hidden risk', 'Interacting with what the players found could expose them to danger'],
    ],
    actions: [
      ['inspect', 'Examine the scene', 'Players can examine {place} for clues about what happened'],
      ['ask', 'Ask who was involved', 'Players can ask {actor} to explain the encounter'],
      ['follow', 'Follow a clue', 'Players can follow a clue from the encounter to {other}'],
      ['help', 'Offer immediate help', 'Players can offer help to {other} before investigating further'],
    ],
    outcomes: [
      ['understood', 'Meaning uncovered', 'The players could discover what happened at {place}'],
      ['contact', 'A new contact', 'The encounter could connect the players with {other}'],
      ['risk', 'Danger revealed', 'The encounter could reveal a danger at {place}'],
      ['unanswered', 'Clue remains open', 'The meaning of the encounter could remain unresolved'],
    ],
  },
};

export function beatContextPrompts(opener, section, workshop) {
  if (!opener) return [];
  const family = families[workshop.opener.family];
  if (!family) return [];
  const rumour = opener.key === 'information/rumour';
  if (section === 'opener') {
    if (!rumour) return [];
    const distorted = workshop.opener.guidance?.[opener.key]?.accuracy === 'Distorted';
    return [prompt(distorted ? 'distortion' : 'topic', distorted ? 'What is distorted?' : 'What is the rumour about?', distorted ? [
      ['identity', 'Who was involved', 'The rumour wrongly identifies who was involved'],
      ['intention', 'Their intentions', 'The rumour misrepresents {actor}’s intentions'],
      ['blame', 'Who is responsible', 'The rumour wrongly blames {actor} for what happened'],
      ['events', 'What happened', 'The rumour changes what actually happened'],
    ] : [
      ['betrayal', 'A broken agreement', 'The rumour concerns whether {actor} broke an agreement'],
      ['past', 'A hidden past', 'The rumour concerns {actor}’s past'],
      ['intentions', 'A secret intention', 'The rumour concerns {actor}’s intentions'],
      ['deed', 'A disputed deed', 'The rumour concerns what {actor} did'],
    ])];
  }
  if (section === 'complication') return [prompt('difficulty', 'What makes this opener difficult to resolve?', family.difficulties.map(row => rumour ? row.map((value, i) => i === 2 ? value.replace(/the information/g, 'the rumour') : value) : row))];
  if (section === 'involvement') return [prompt('actions', 'What can players do about this opener? · choose any', family.actions.map(row => rumour ? row.map((value, i) => i === 2 ? value.replace(/the information/g, 'the rumour') : value) : row), true)];
  if (section === 'consequences') return [
    prompt('condition', 'Which player response leads to this possibility?', workshop.opener.family === 'information' ? [
      ['verify', 'Test the evidence', 'players test the evidence and establish what happened'],
      ['act', 'Act on the account', 'players act on the account without checking it'],
      ['agreement', 'Reach an agreement', 'players help those involved reach an agreement'],
      ['alone', 'Leave it unresolved', 'players leave the matter unresolved'],
    ] : [
      ['help', 'Help with the action', 'players help those involved carry out the intended action'],
      ['agreement', 'Reach an agreement', 'players help those involved reach an agreement'],
      ['challenge', 'Challenge the demand', 'players challenge the demand instead of complying'],
      ['alone', 'Leave it unresolved', 'players leave the matter unresolved'],
    ]),
    prompt('outcome', 'What could change as a result?', family.outcomes.map(row => rumour ? row.map((value, i) => i === 2 ? value.replace(/the information/g, 'the rumour') : value) : row)),
  ];
  if (section === 'stakes') return [prompt('risk', 'Whose position could change, and how?', [
    ['reputation', 'Reputation', '{actor}’s reputation is at stake: being trusted could give way to suspicion'],
    ['trust', 'Trust between them', 'Trust between {actor} and {other} could be strengthened or broken'],
    ['commitment', 'A commitment', '{actor}’s ability to honour a commitment to {other} is at stake'],
    ['belonging', 'A place in the group', '{actor}’s acceptance by {community} could be put at risk'],
  ])];
  if (section === 'occasion') {
    const first = workshop.occasion.selections?.[workshop.occasion.family];
    const second = workshop.occasion.collisionEnabled && workshop.occasion.second;
    if (!first) return [];
    const subject = rumour ? 'the rumour' : family.subject;
    return [prompt('connection', 'How does the occasion connect to the opener?', [
      ['during', 'Emerges during it', subject + ' comes to light during the ' + first.toLowerCase()],
      ['causes', 'Sets it in motion', 'The ' + first.toLowerCase() + ' sets ' + subject + ' in motion'],
      ...(second ? [['second', second + ' brings it', 'The ' + second.toLowerCase() + ' brings ' + subject + ' to {other}’s attention']] : []),
    ])];
  }
  return [];
}
