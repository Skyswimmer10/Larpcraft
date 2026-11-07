// Reference: Pip Decks, Storyteller Tactics (2023), user-supplied archetypes.pdf.
// Descriptions are paraphrased. Starting answers and scene prompts are LARPCraft
// writing adaptations, not additional claims from the cards. Blends are ordered:
// Artist + Ruler is Trendsetter; Ruler + Artist is Patron.
const shadow = (name, description, choices) => ({ name, description, choices });
const detail = (hint, choices) => ({ hint, choices });
const mixes = entries => entries.map(([withArchetype, name]) => ({ withArchetype, name }));

export const STORY_ARCHETYPES = {
  ruler: {
    id: 'LIB-CPT-N034', label: 'Ruler', pages: [1, 2], tagline: 'Create order people can rely on.',
    overview: 'The Ruler takes responsibility for a shared world: its standards, traditions, security and direction. Their success is tied to whether the people in their care can thrive.',
    purpose: detail('Give their authority something concrete to serve. A Ruler can lead a household, a crew or a community; they need not be royalty.', ['Keep a fragile community together', 'Restore trust in a damaged institution', 'Carry a valued tradition into a new situation']),
    pressure: detail('Test the balance between responsibility and control, rather than asking for a generic crisis.', ['A loyal adviser publicly challenges their decision', 'Keeping an old rule would harm the people it protects', 'A difficult decision cannot be delegated any longer']),
    when: detail('Let leadership show through clear direction, high expectations and responsibility for the outcome.', ['Set a clear plan and take responsibility for it', 'Use a trusted tradition to steady people', 'Recognise good work and expect everyone to contribute']),
    say: detail('Their voice gives direction, sets standards or reassures through continuity. Adapt a starter into their own words.', ['We will do this together, and I will answer for the result.', 'Keep what works; change what no longer protects us.', 'I need your best judgment, not just your obedience.']),
    gift: detail('The Ruler offers others a dependable structure in which they can act and develop.', ['A clear goal and a role worth fulfilling', 'Safety through fair, consistent rules', 'A tradition that gives people a place to belong']),
    excessive: shadow('Tyrant', 'Responsibility turns into domination: the leader protects their own power instead of the people.', ['Punish an honest disagreement as disloyalty', 'Make every decision depend on personal permission', 'Protect their reputation while others bear the cost']),
    withdrawing: shadow('Abdicator', 'The leader avoids the responsibility that makes their authority useful.', ['Leave the hardest decision to an unprepared deputy', 'Remain ceremonial while a powerful adviser takes control', 'Delay action until someone else accepts the blame']),
    blends: mixes([['Sage', 'Judge'], ['Companion', 'Mentor'], ['Warrior', 'Strategist'], ['Explorer', 'Pioneer'], ['Caregiver', 'Matron'], ['Rebel', 'Revolutionary'], ['Artist', 'Patron']]),
  },
  caregiver: {
    id: 'LIB-CPT-N027', label: 'Caregiver', pages: [3, 4], tagline: 'Help another person feel safe enough to grow.',
    overview: 'The Caregiver notices needs, listens closely and creates a place of support. Their gift is care that helps others flourish, including the freedom to become more capable.',
    purpose: detail('Choose whom their care serves and what that person needs. Care can be practical, emotional or protective.', ['Help someone recover after a loss', 'Keep a vulnerable group safe through a difficult night', 'Support a learner until they can act independently']),
    pressure: detail('A useful test separates care from control, or asks what happens when attention and resources run short.', ['Someone they protect wants to take a necessary risk', 'Two people need help at the same time', 'Their familiar way of helping is no longer wanted']),
    when: detail('Make care visible through attention, comfort and pride in another person’s progress.', ['Listen before offering a solution', 'Prepare a meal or shelter without asking for repayment', 'Celebrate another person becoming more independent']),
    say: detail('Their voice makes room for feelings and offers help without deciding everything for the other person.', ['Tell me what you need; I am listening.', 'We can take the next step when you are ready.', 'How can I help without taking this away from you?']),
    gift: detail('The gift is protection and nurturing that leaves room for the recipient to grow.', ['A safe place to return to', 'Practical support with no strings attached', 'Confidence to try something beyond their current abilities']),
    excessive: shadow('Nanny', 'Protection becomes smothering: avoiding risk prevents the other person from growing.', ['Make a decision for someone who could decide for themselves', 'Treat an adult learner as incapable', 'Prevent every challenge in the name of safety']),
    withdrawing: shadow('Neglecter', 'Care is withheld and other people’s needs stop receiving attention.', ['Ignore a request because the person should cope alone', 'Offer routine help without noticing a serious change', 'Turn away from someone whose needs have become inconvenient']),
    blends: mixes([['Sage', 'Therapist'], ['Ruler', 'Surgeon'], ['Warrior', 'Advocate'], ['Lover', 'Matchmaker'], ['Magician', 'Healer'], ['Companion', 'Samaritan']]),
  },
  innocent: {
    id: 'LIB-CPT-N028', label: 'Innocent', pages: [5, 6], tagline: 'Make room for wonder and a fresh beginning.',
    overview: 'The Innocent approaches the world with openness, simplicity and hope. Their presence invites others to see without automatic cynicism, while their own confidence and strength are still developing.',
    purpose: detail('Choose the fresh beginning they represent. Innocence need not mean childhood or lack of intelligence.', ['Begin again after a community has lost hope', 'Learn how an unfamiliar world works', 'Protect a simple good that others dismiss as naive']),
    pressure: detail('Test whether openness can grow into informed trust rather than dependence or cynicism.', ['A trusted person gives them an incomplete truth', 'Their safe haven is no longer entirely safe', 'They must try something without their usual protector']),
    when: detail('Show curiosity, delight in simple things and willingness to learn.', ['Ask an honest question others are afraid to ask', 'Notice a small hopeful change everyone else missed', 'Try again without treating a first failure as the end']),
    say: detail('Their voice can be direct, curious and hopeful without being childish.', ['Could we start again, with what we actually know?', 'I have not done this before. Will you show me?', 'Why must it always stay this way?']),
    gift: detail('The Innocent offers a fresh perspective and gives others permission to care and begin again.', ['Hope without pretending the difficulty is absent', 'A chance to see familiar things freshly', 'Someone whose growth brings others together']),
    excessive: shadow('Victim', 'Vulnerability becomes dependence: the person waits for others to supply all safety and action.', ['Wait for rescue despite having a small possible action', 'Ask a protector to decide every uncertain choice', 'Treat being vulnerable as a reason they cannot contribute']),
    withdrawing: shadow('Cynic', 'Openness closes down into distrust and the assumption that hope is foolish.', ['Dismiss a sincere offer as another trick', 'Mock a beginner for trying', 'Refuse a fresh start because disappointment seems inevitable']),
    blends: mixes([['Warrior', 'Underdog'], ['Ruler', 'Apprentice'], ['Sage', 'Learner'], ['Companion', 'Playmate'], ['Jester', 'Free Spirit'], ['Caregiver', 'Sibling'], ['Artist', 'Naive/Folk Art']]),
  },
  jester: {
    id: 'LIB-CPT-N029', label: 'Jester', pages: [7, 8], tagline: 'Use play to open a different view of the situation.',
    overview: 'The Jester brings fun, chance and surprise. Play can relieve tension, include others or expose a truth that would be harder to say directly. Enjoying the game matters more than merely winning it.',
    purpose: detail('Decide what play makes possible here. The Jester need not be a professional comedian.', ['Help a tense group enjoy being together', 'Reveal an awkward truth through humour', 'Invite a cautious person to try something playful']),
    pressure: detail('Test the difference between shared fun and attention at another person’s expense.', ['A joke hurts someone who was already excluded', 'A serious moment leaves no room for their usual performance', 'They can win attention only by taking an unfair risk']),
    when: detail('Show the playful action and who is invited into it.', ['Turn a dull task into a fair game', 'Laugh at their own mistake so others can relax', 'Use a playful reversal to reveal a hidden assumption']),
    say: detail('Their voice invites participation, a surprising angle or a moment of relief.', ['Your turn. Let us see what happens if we try it differently.', 'If this is the sensible plan, I fear the silly one.', 'We can take the problem seriously without taking ourselves so seriously.']),
    gift: detail('The gift is shared play, laughter or truth made approachable.', ['Relief that lets the group keep going', 'A fair game in which an outsider can join', 'A difficult truth made easier to hear']),
    excessive: shadow('Fool', 'Play becomes showing off, harmful pranks or gambling with consequences others must carry.', ['Keep escalating a prank after someone asks them to stop', 'Risk the group’s resources for a spectacular joke', 'Make another person the target to keep the spotlight']),
    withdrawing: shadow('Bore', 'Playfulness is replaced by solemn self-importance and refusal to see another angle.', ['Dismiss every joke as beneath them', 'Insist a harmless game is a waste of time', 'Explain why everyone else is enjoying things incorrectly']),
    blends: mixes([['Caregiver', 'Therapy Clown'], ['Innocent', 'Merry Fool'], ['Warrior', 'Hacktivist'], ['Sage', 'Riddler'], ['Magician', 'Shapeshifter'], ['Rebel', 'Provocateur'], ['Explorer', 'Taboo Breaker']]),
  },
  rebel: {
    id: 'LIB-CPT-N037', label: 'Rebel', pages: [9, 10], tagline: 'Challenge a rule that prevents something better.',
    overview: 'The Rebel sees an established order that is no longer good enough and pushes for change. They expose limits, take risks and make room for alternatives that obedience would never reveal.',
    purpose: detail('Name the rule or accepted practice they oppose and the better possibility behind that opposition.', ['Break an unfair restriction on who may participate', 'Expose an institution’s protected abuse of power', 'Try a forbidden solution to a problem everyone accepts']),
    pressure: detail('Test whether defiance serves a cause, becomes personal advantage or disappears when obedience is comfortable.', ['Breaking the rule would benefit them more than the cause', 'An ally asks them to justify the harm their method could cause', 'Authority offers them an exception in exchange for silence']),
    when: detail('Show the specific boundary they challenge rather than giving them a generic angry attitude.', ['Question a rule others treat as unquestionable', 'Build a working alternative before permission arrives', 'Take a visible risk that lets others challenge the same limit']),
    say: detail('Their voice challenges resignation and invites action.', ['Who benefits from keeping this rule?', 'We can do better than asking for the same permission again.', 'If the proper route never works, let us build another route.']),
    gift: detail('The Rebel gives others a way to experiment, resist or act beyond an inherited restriction.', ['Permission to try an unapproved alternative', 'A practical tool for getting past a barrier', 'Courage to challenge an unfair expectation']),
    excessive: shadow('Cheat', 'Breaking rules becomes deception or exploitation for personal gain.', ['Claim the cause excuses taking a private reward', 'Lie to allies because the truth would limit their freedom', 'Exploit the very people they say they are liberating']),
    withdrawing: shadow('Stickler', 'The challenger retreats into rigid obedience and treats procedure as more important than its purpose.', ['Reject a helpful exception because the form is wrong', 'Defend a harmful rule simply because it is established', 'Demand permission for an action they once urged others to take']),
    blends: mixes([['Ruler', 'Usurper'], ['Caregiver', 'Tough Love'], ['Jester', 'Gambler'], ['Explorer', 'Prototyper'], ['Magician', 'Heretic'], ['Sage', 'Innovator'], ['Warrior', 'Liberator']]),
  },
  warrior: {
    id: 'LIB-CPT-N032', label: 'Warrior', pages: [11, 12], tagline: 'Commit to a cause and act when it matters.',
    overview: 'The Warrior brings courage, discipline and purposeful action. They train, accept a challenge and stand up for something worth defending. Strength becomes meaningful through the cause it serves.',
    purpose: detail('Choose what their effort serves. A Warrior can argue, organise or compete as well as physically fight.', ['Defend someone who cannot defend themselves', 'Put an injustice right through determined action', 'Meet a demanding challenge through training and discipline']),
    pressure: detail('Test the boundary between firm action, needless aggression and giving way.', ['An opponent surrenders while an ally demands punishment', 'The right action risks a relationship they value', 'A stronger opponent challenges them in front of the group']),
    when: detail('Make commitment visible through preparation, persistence and leading by example.', ['Train patiently before asking others to follow', 'Step forward when someone vulnerable is threatened', 'Keep working through a setback without humiliating anyone']),
    say: detail('Their voice turns a cause into action and helps others find resolve.', ['Stand with me. We know who we are protecting.', 'We have prepared for this; now take the next step.', 'If this matters, show me what we can do about it.']),
    gift: detail('The Warrior offers a cause, the ability to act and the discipline to sustain it.', ['Protection backed by a clear commitment', 'Training that makes others more capable', 'A shared cause and a practical plan of action']),
    excessive: shadow('Bully', 'Strength becomes intimidation, domination or force without judgment.', ['Threaten a weaker person to prove strength', 'Choose a fight when restraint would serve the cause', 'Treat an ally’s hesitation as something to punish']),
    withdrawing: shadow('Pushover', 'Necessary assertion disappears and avoiding conflict takes priority over the cause.', ['Let an unfair demand pass to avoid an argument', 'Agree to a stronger person’s plan despite knowing its cost', 'Abandon a boundary when someone challenges it']),
    blends: mixes([['Ruler', 'Captain'], ['Rebel', 'Freedom Fighter'], ['Companion', 'Comrade'], ['Caregiver', 'Guardian'], ['Explorer', 'Invader'], ['Jester', 'Spy'], ['Innocent', 'Conscientious Objector'], ['Sage', 'Campaigner']]),
  },
  lover: {
    id: 'LIB-CPT-N031', label: 'Lover', pages: [13, 14], tagline: 'Bring feeling, beauty and intimacy into the present.',
    overview: 'The Lover attends to what life feels like: pleasure, beauty, closeness and shared vulnerability. Their gift is to make experience matter in the present, rather than treating every moment as a means to an end.',
    purpose: detail('Choose the experience or closeness they seek. This archetype can express affection for life, art or friendship as well as romance.', ['Restore warmth between people who have grown distant', 'Create a shared moment of beauty during hardship', 'Allow a guarded person to experience closeness']),
    pressure: detail('Test whether pleasure and intimacy remain connected to care and consequence.', ['An irresistible pleasure conflicts with a promise', 'A close person asks for vulnerability rather than a beautiful gesture', 'A practical plan treats someone’s feelings as irrelevant']),
    when: detail('Show attention to sensation, harmony and another person’s emotional presence.', ['Notice the music, warmth or beauty others hurry past', 'Share a vulnerability that deepens trust', 'Turn an ordinary meeting into a moment worth remembering']),
    say: detail('Their voice brings attention to feeling, passion and shared experience.', ['Stay a moment. What does this feel like to you?', 'There should be something here worth loving.', 'You can tell me what you want without making it useful first.']),
    gift: detail('The Lover offers delight, intimacy and permission to feel fully alive.', ['A moment of pleasure taken seriously', 'Closeness without the need to perform a role', 'An experience that reconnects someone with feeling']),
    excessive: shadow('Hedonist', 'Pleasure becomes indulgence that ignores commitments and consequences.', ['Pursue an immediate temptation despite a promise', 'Use luxury to avoid an uncomfortable truth', 'Expect others to absorb the cost of their enjoyment']),
    withdrawing: shadow('Utilitarian', 'Feeling and beauty are reduced to calculations of usefulness.', ['Dismiss affection because it produces no practical result', 'Choose the efficient plan without listening to its human cost', 'Treat an intimate relationship as an exchange of advantages']),
    blends: mixes([['Companion', 'Go-Between'], ['Artist', 'Muse'], ['Magician', 'Intoxicant'], ['Rebel', 'Forbidden Love'], ['Caregiver', 'Party Host'], ['Explorer', 'Pleasure Seeker'], ['Jester', 'Temptation']]),
  },
  companion: {
    id: 'LIB-CPT-N038', label: 'Companion', pages: [15, 16], tagline: 'Make a place where people can belong as themselves.',
    overview: 'The Companion stands among others as an equal: loyal, down to earth and willing to do their share. They keep relationships grounded in ordinary companionship rather than status or perfection.',
    purpose: detail('Choose the circle they belong to and what belonging makes possible.', ['Help an outsider become part of a group', 'Keep old friends together through a change', 'Make a shared task feel like everyone’s contribution matters']),
    pressure: detail('Test the difference between belonging, settling for too little and looking down on others.', ['An old friend wants to grow beyond the group’s familiar habits', 'A newcomer challenges the group’s unspoken rules', 'A chance to gain status would separate them from their friends']),
    when: detail('Show loyalty, authenticity and practical sharing in a specific interaction.', ['Do an unglamorous part of the work without making a show of it', 'Make room for someone who feels out of place', 'Admit an ordinary mistake so others can be themselves']),
    say: detail('Their voice puts people on equal ground and brings grand claims back to everyday reality.', ['Sit with us. You do not have to impress anyone here.', 'We all have a part to do; I will take this one.', 'Let us say what we mean and work it out together.']),
    gift: detail('The Companion offers fellowship, acceptance and space for human imperfection.', ['A circle where someone feels included', 'Loyal practical help from an equal', 'Permission to be ordinary and imperfect']),
    excessive: shadow('Slob', 'Comfort and fitting in become complacency, lack of effort or resistance to anyone aiming higher.', ['Dismiss a friend’s ambition as showing off', 'Let others do the shared work while taking belonging for granted', 'Refuse a useful change because the familiar way is easier']),
    withdrawing: shadow('Snob', 'Equality gives way to distance, superiority or selective belonging.', ['Keep a newcomer outside because they lack the right background', 'Treat old friends as embarrassing after gaining status', 'Offer friendship only to people who improve their position']),
    blends: mixes([['Ruler', 'Networker'], ['Caregiver', 'Servant'], ['Explorer', 'Sherpa'], ['Warrior', 'Ally'], ['Sage', 'Academician'], ['Jester', 'Carnival Troupe']]),
  },
  explorer: {
    id: 'LIB-CPT-N030', label: 'Explorer', pages: [17, 18], tagline: 'Discover through experience, then help others find a way.',
    overview: 'The Explorer moves beyond the familiar to learn by being there and trying things. Curiosity and resourcefulness open a path, while experience teaches them where a map is useful and where it is incomplete.',
    purpose: detail('Give their curiosity a destination or a question to pursue. Exploration can be social, intellectual or physical.', ['Find a route no one has yet tested', 'Discover what lies beyond a familiar boundary', 'Bring back an experience that changes what the group believes']),
    pressure: detail('Test whether movement remains purposeful or becomes escape from commitment.', ['The next discovery would mean abandoning a person who depends on them', 'Their trusted map no longer matches the terrain', 'They must stay somewhere unfamiliar long enough to understand it']),
    when: detail('Show discovery through action rather than a list of places visited.', ['Try a route and report what actually happens', 'Ask what is beyond the boundary others accept', 'Travel lightly enough to change course when new evidence appears']),
    say: detail('Their voice invites movement, curiosity and first-hand discovery.', ['We will know more after we have actually tried it.', 'The map ends here. What do you think is beyond it?', 'Come and see; it is different when you are there.']),
    gift: detail('The Explorer offers direction, practical knowledge and permission to leave the familiar.', ['A route and the knowledge of its limits', 'Confidence to try an unfamiliar experience', 'A trusted guide who learns alongside the group']),
    excessive: shadow('Wanderer', 'Seeking the next experience replaces direction, roots or commitment.', ['Leave as soon as a place asks something of them', 'Chase another novelty instead of using what they discovered', 'Keep moving so they never have to choose a destination']),
    withdrawing: shadow('Homebody', 'Curiosity closes down into the comfort of what is already known.', ['Reject a new route without looking at it', 'Stay with a failing plan because it is familiar', 'Treat another person’s discovery as an unnecessary disturbance']),
    blends: mixes([['Artist', 'Translator'], ['Rebel', 'Trespasser'], ['Sage', 'Navigator'], ['Warrior', 'Vanguard'], ['Ruler', 'Settler'], ['Companion', 'Guide'], ['Caregiver', 'Basecamp']]),
  },
  artist: {
    id: 'LIB-CPT-N033', label: 'Artist', pages: [19, 20], tagline: 'Notice a pattern and give others a new way to see.',
    overview: 'The Artist looks beneath the surface and gives form to ideas that are difficult to express directly. Images, symbols, metaphor, arrangement or performance can help others perceive something they had missed.',
    purpose: detail('Choose the perspective they want to reveal. Artist is a way of seeing and expressing, not necessarily an occupation.', ['Reveal dignity in people others overlook', 'Connect ordinary things into an unexpected pattern', 'Make an imagined possibility tangible to others']),
    pressure: detail('Test the meaning of the work, rather than introducing an unrelated threat.', ['A patron offers support only if the meaning of the work changes', 'An audience admires the style but misses what the work is saying', 'Someone needs to be heard while the Artist is absorbed in technique']),
    when: detail('Show the act of noticing and expressing: what do they see, and what form do they give it?', ['Turn an overlooked detail into the centre of a work', 'Use a metaphor to connect ideas others kept separate', 'Rearrange something familiar so people see it freshly']),
    say: detail('Their voice uses images, comparison or an invitation to look again. Adapt a starter to the work you chose.', ['Look closer. There is another story in that detail.', 'Imagine these things beside each other; what changes?', 'I cannot quite say it yet, but I can show you.']),
    gift: detail('The Artist offers a new perspective, a form of expression or room for another person’s talent.', ['A fresh way to understand a familiar situation', 'A symbol that helps someone express a difficult feeling', 'Space and encouragement for someone else to create']),
    excessive: shadow('Poseur', 'Impressive style displaces meaning, practical judgment or substance.', ['Change the work to win admiration while losing its purpose', 'Dismiss practical consequences as beneath the vision', 'Use elaborate expression to conceal an empty idea']),
    withdrawing: shadow('Pedant', 'Literal or technical correctness replaces the ability to hear feeling, metaphor or meaning.', ['Correct the technique while ignoring the feeling someone expresses', 'Reject an evocative image because it is not literally exact', 'Argue about formal details until the original purpose is lost']),
    blends: mixes([['Sage', 'Storyteller'], ['Ruler', 'Trendsetter'], ['Jester', 'Entertainer'], ['Rebel', 'Iconoclast'], ['Explorer', 'Avant-Garde'], ['Warrior', 'Propagandist'], ['Magician', 'Illusionist'], ['Companion', 'Artisan']]),
  },
  magician: {
    id: 'LIB-CPT-N035', label: 'Magician', pages: [21, 22], tagline: 'Make a change others did not think possible.',
    overview: 'The Magician imagines a different state of things and makes transformation feel possible. A surprising invention, reframing or experience can open another world inside the ordinary one; literal magic is optional.',
    purpose: detail('Choose what they hope to transform and what becomes possible afterward.', ['Help someone move beyond a limitation they assumed was fixed', 'Turn an ordinary experience into a moment of wonder', 'Demonstrate a possibility the community has dismissed']),
    pressure: detail('Test the difference between genuine transformation, an impressive promise and refusing possibility.', ['Their beautiful promise is running ahead of what they can deliver', 'A failed demonstration threatens other people’s trust', 'A possibility needs patient testing rather than another dramatic reveal']),
    when: detail('Show imagination meeting a specific opportunity for change.', ['Ask a what-if question that changes the group’s approach', 'Reveal an unexpected use for an ordinary resource', 'Help someone experience a possibility rather than just describe it']),
    say: detail('Their voice opens alternatives and invites people to release an assumption.', ['What if that limit is only part of the story?', 'Try it this way before deciding it cannot work.', 'Imagine what changes if this becomes possible.']),
    gift: detail('The Magician offers transformation, possibility and a break from the assumption that everything is already settled.', ['A new way of being or acting', 'An experience that makes an unfamiliar possibility believable', 'Hope made concrete through a surprising change']),
    excessive: shadow('Illusionist', 'The appearance of transformation replaces an honest result.', ['Promise a miracle while hiding what it cannot do', 'Use spectacle to distract from a failed solution', 'Keep pursuing a dazzling possibility without testing whether it is real']),
    withdrawing: shadow('Sceptic', 'Possibility is dismissed before imagination or experimentation can do useful work.', ['Reject a new approach because it is not already proven', 'Explain away an unexpected result without investigating it', 'Insist nothing can change to avoid risking another attempt']),
    blends: mixes([['Artist', 'Visionary'], ['Ruler', 'Shaman'], ['Warrior', 'Entrepreneur'], ['Explorer', 'Scientist'], ['Sage', 'Alchemist'], ['Lover', 'Enchanter'], ['Caregiver', 'Faith Healer'], ['Innocent', 'Idealist']]),
  },
  sage: {
    id: 'LIB-CPT-N036', label: 'Sage', pages: [23, 24], tagline: 'Understand clearly and help others see what is true.',
    overview: 'The Sage seeks knowledge, evidence and understanding. They study, test a method and explain what they find. Their wisdom remains useful when they also recognise uncertainty, bias and the possibility of learning more.',
    purpose: detail('Choose the question they want to understand and who needs that understanding.', ['Find the truth behind an accepted explanation', 'Give others the tools to judge a difficult claim', 'Turn hard-earned knowledge into useful guidance']),
    pressure: detail('Test whether knowledge remains open to evidence or hardens into certainty.', ['New evidence contradicts their trusted explanation', 'Admitting uncertainty could weaken their authority', 'Someone without their credentials notices something they missed']),
    when: detail('Show study, discernment and the moment an insight becomes useful to another person.', ['Check evidence before repeating a claim', 'Explain a difficult idea so someone else can use it', 'Notice a personal bias and revise an earlier conclusion']),
    say: detail('Their voice clarifies what is known, how it is known and what still needs checking.', ['What would we need to see to know whether this is true?', 'Here is the evidence; you can check it for yourself.', 'I was certain before. This changes what I think.']),
    gift: detail('The Sage offers truth together with the tools to understand and examine it.', ['A clear explanation and the evidence behind it', 'A method someone else can use independently', 'An insight that replaces confusion with understanding']),
    excessive: shadow('Ideologue', 'An explanation becomes dogma and contrary evidence or nuance is refused.', ['Dismiss an inconvenient fact as disloyalty to the idea', 'Insist one theory explains every person and situation', 'Defend being right instead of examining what happened']),
    withdrawing: shadow('Idiot', 'The appetite for learning is replaced by wilful ignorance or a refusal to examine a limited view.', ['Repeat a claim they could easily check', 'Refuse to learn because the answer feels uncomfortable', 'Dismiss an unfamiliar perspective without trying to understand it']),
    blends: mixes([['Explorer', 'Mapmaker'], ['Ruler', 'Lawmaker'], ['Rebel', 'Reformer'], ['Warrior', 'Engineer'], ['Caregiver', 'Tutor'], ['Companion', 'Citizen'], ['Magician', 'Inventor'], ['Artist', 'Stargazer']]),
  },
};

export function storyArchetype(source) {
  if (!source) return null;
  const id = source.conceptId || source.narrativeWizard?.sourceId || source.id;
  const byId = Object.values(STORY_ARCHETYPES).find(row => row.id === id);
  if (byId) return byId;
  const key = String(source.archetypeKey || source.name || source.title || '').trim().toLowerCase().replace(/^the\s+/, '');
  return STORY_ARCHETYPES[key] || null;
}

export const ARCHETYPE_ATTRIBUTION = 'Based on the archetype cards in Pip Decks, Storyteller Tactics (2023). Descriptions are paraphrased; suggested answers and story prompts are LARPCraft adaptations. These are optional fictional character lenses.';

export const ARCHETYPE_FIELDS = [
  ['purpose', 'What draws this character into action?'],
  ['when', 'How does this side show in their behaviour?'],
  ['gift', 'What do other people receive from them?'],
  ['say', 'What might they actually say?'],
  ['pressure', 'What puts their gift or purpose under pressure?'],
  ['excessive', 'What happens when they push this side too far?'],
  ['withdrawing', 'What happens when they lose touch with this gift?'],
  ['blends', 'What does another archetype bring to this character?'],
];

export function archetypeFieldGuidance(reference, field) {
  if (field === 'blends') return {
    hint: 'Optional: choose a second lens, then adapt the combination in your own words. The order matters: the main archetype remains the foundation. A combination label is a writing prompt, not a new compulsory character type.',
    choices: reference.blends.map(row => `${reference.label} + ${row.withArchetype} = ${row.name}`),
  };
  const row = reference[field];
  return { hint: row?.description ? `${row.name}: ${row.description}` : row?.hint || '', choices: row?.choices || [] };
}
