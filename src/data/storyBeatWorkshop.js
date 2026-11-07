export const BEAT_WORKSHOP_SECTIONS = [
  ['occasion', 'Occasion', 'clock', 'Context'], ['opener', 'Opener', 'flag', 'Context'],
  ['complication', 'Complication', 'alert', 'Action'], ['involvement', 'Players', 'users', 'Action'],
  ['consequences', 'Consequences', 'branches', 'Outcomes'], ['stakes', 'Stakes', 'heart', 'Outcomes'],
].map(([id, label, icon, group]) => ({ id, label, icon, group }));

const tones = ['blue', 'violet', 'amber', 'teal', 'rose', 'green'];
const icons = ['flag', 'users', 'box', 'clock', 'link', 'target', 'book', 'search'];
const options = rows => rows.map(([id, label, text, icon, tone], index) => ({ id, label, text, icon: icon || icons[index % icons.length], tone: tone || tones[index % tones.length] }));
export const BEAT_OCCASION_ICONS = {
  Arrival:'arrival',Delivery:'delivery',Ceremony:'candle',Reunion:'reunion',Wedding:'rings',Departure:'departure',Celebration:'celebration',Handover:'handover',
  Rescue:'life-ring',Escape:'escape',Escort:'escort',Recovery:'recover',Theft:'theft',Repair:'wrench',Search:'search',Sabotage:'sabotage',
  Appointment:'badge',Dismissal:'user-minus',Inheritance:'inheritance',Exile:'exile',Acceptance:'user-check',Retirement:'chair',Return:'return-path','Loss of status':'status-down',
  Inspection:'inspection','Court session':'gavel',Initiation:'flame','Restricted entry':'lock','Membership decision':'ballot','Ownership claim':'deed',
  'Supply allocation':'parcels','Reward sharing':'medal','Inheritance division':'split-gift','Shelter allocation':'house','Division of authority':'hierarchy','Access allocation':'key',
};

export const BEAT_OCCASIONS = [
  ['social', 'Social occasions', ['Arrival', 'Delivery', 'Ceremony', 'Reunion', 'Wedding', 'Departure', 'Celebration', 'Handover'], 'users'],
  ['undertaking', 'Undertakings', ['Rescue', 'Escape', 'Escort', 'Recovery', 'Theft', 'Repair', 'Search', 'Sabotage'], 'target'],
  ['transition', 'Transitions', ['Appointment', 'Dismissal', 'Inheritance', 'Exile', 'Acceptance', 'Retirement', 'Return', 'Loss of status'], 'swap'],
  ['rules', 'Rules & exceptions', ['Inspection', 'Court session', 'Initiation', 'Restricted entry', 'Membership decision', 'Ownership claim'], 'rules'],
  ['distribution', 'Distribution', ['Supply allocation', 'Reward sharing', 'Inheritance division', 'Shelter allocation', 'Division of authority', 'Access allocation'], 'layers'],
].map(([id, label, labels]) => ({ id, label, options: options(labels.map((name, index) => [name, name, name.toLowerCase(), BEAT_OCCASION_ICONS[name], tones[index % tones.length]])) }));
export const BEAT_COLLISIONS = options([
  ['interrupts', 'Interrupts', 'A {second} interrupts the {occasion}', 'zap', 'rose'],
  ['same-time', 'Happens at the same time', 'A {second} happens at the same time', 'clock', 'blue'],
  ['same-person', 'Needs the same person', 'A {second} needs the same person', 'user', 'violet'],
  ['same-item', 'Claims the same item', 'A {second} also makes a claim on {item}', 'box', 'amber'],
  ['blocks', 'Prevents it from proceeding', 'A {second} prevents the {occasion} from proceeding', 'cross', 'rose'],
  ['combined', 'Deliberately combined', 'The {occasion} is combined with a {second}', 'link', 'teal'],
]);

export const BEAT_OPENERS = [
  ['information', 'Information', [
    ['conceal', 'Hides evidence', '{actor} conceals evidence about {item} from {other}', 'book'],
    ['reveal', 'Reveals a secret', '{actor} reveals a secret about {item}', 'search'],
    ['contradiction', 'Accounts contradict', '{actor} and {other} give contradictory accounts', 'swap'],
    ['rumour', 'A rumour spreads', 'A rumour about {actor} reaches {other}', 'users'],
  ]],
  ['bargain', 'Requests & bargains', [
    ['help', 'Asks for help', '{actor} asks {other} for help with {item}', 'users'],
    ['offer', 'An offer has a condition', '{actor} offers {item} to {other} with a condition', 'link'],
    ['debt', 'Calls in a debt', '{actor} calls in a debt owed by {other}', 'rules'],
    ['promise', 'A promise becomes difficult', '{actor} struggles to keep a promise to {other}', 'heart'],
  ]],
  ['conflict', 'Conflict', [
    ['refuse-order', 'Refuses an order', '{actor} refuses an order from {other}', 'cross'],
    ['accusation', 'Makes an accusation', '{actor} accuses {other} of wrongdoing', 'alert'],
    ['contest', 'Challenges a decision', '{actor} challenges a decision made by {other}', 'flag'],
    ['same-goal', 'Want the same thing', '{actor} and {other} both seek {item}', 'target'],
  ]],
  ['possession', 'Possession', [
    ['withhold', 'Withholds an item', '{actor} withholds {item} from {other}', 'box'],
    ['missing', 'An item disappears', '{item} disappears before it can reach {other}', 'search'],
    ['ownership', 'Ownership is disputed', '{actor} disputes {other}’s claim to {item}', 'rules'],
    ['wrong-person', 'Reaches the wrong person', '{item} reaches {actor} instead of {other}', 'swap'],
  ]],
  ['loyalty', 'Loyalty', [
    ['side', 'Must choose sides', '{actor} is asked to choose between {other} and another allegiance', 'branches'],
    ['protect', 'Protects an enemy', '{actor} protects an enemy of {other}', 'heart'],
    ['favour', 'A favour creates an obligation', '{actor}’s favour leaves {other} with an obligation', 'link'],
    ['test', 'Tests a commitment', '{actor} tests {other}’s commitment', 'target'],
  ]],
  ['disruption', 'Disruption', [
    ['resource', 'A resource becomes unavailable', '{item} becomes unavailable when {actor} needs it', 'box'],
    ['absent', 'Someone fails to arrive', '{actor} fails to arrive to meet {other}', 'clock'],
    ['plan', 'A plan stops working', '{actor}’s plan involving {item} stops working', 'cog'],
    ['access', 'Access is lost', '{actor} loses access to {place}', 'cross'],
  ]],
  ['pressure', 'Need, obstacle & opportunity', [
    ['need', 'A need becomes urgent', '{actor} urgently needs {item}', 'alert'],
    ['obstacle', 'An intention meets an obstacle', 'An obstacle prevents {actor} from reaching {item}', 'cross'],
    ['discovery', 'A discovery changes understanding', '{actor} discovers something unexpected about {item}', 'search'],
    ['clash', 'Intentions clash', '{actor} and {other} discover their intentions clash', 'swap'],
    ['obligation', 'A duty demands action', 'An obligation requires {actor} to act', 'rules'],
    ['opportunity', 'An opportunity appears', '{actor} has an opportunity to gain {item}', 'star'],
  ]],
  ['encounter', 'Encounters', [
    ['camp', 'An abandoned camp', 'The players encounter an abandoned camp at {place}', 'pin'],
    ['delivery', 'An unopened delivery', 'The players find an unopened delivery meant for {other}', 'box'],
    ['waiting', 'People wait for someone', 'A gathering waits for {actor} at {place}', 'users'],
    ['doorway', 'A guarded doorway', 'The players encounter a guarded entrance to {place}', 'cross'],
    ['meal', 'An interrupted meal', 'The players find an interrupted meal at {place}', 'clock'],
    ['instructions', 'Contradictory instructions', '{actor} and {other} give the players contradictory instructions', 'swap'],
  ]],
].map(([id, label, rows]) => ({ id, label, options: options(rows) }));

export const BEAT_COMPLICATIONS = [
  ['resistance', 'Resistance', [
    ['proof', 'Demands proof', '{actor} demands proof before proceeding', 'search', 'blue'],
    ['refuses', 'Refuses to cooperate', '{actor} refuses to cooperate', 'cross', 'rose'],
    ['condition', 'Imposes a condition', '{actor} imposes a condition on the agreement', 'link', 'amber'],
    ['interferes', 'Actively interferes', '{actor} actively interferes with the intended action', 'zap', 'violet'],
  ]],
  ['means', 'Missing means', [
    ['person', 'A person is absent', '{other}, who is needed by {actor}, is absent', 'user'],
    ['item', 'An item is unavailable', '{item}, needed by {actor}, is unavailable', 'box'],
    ['route', 'A route is blocked', 'The route to {place} is blocked', 'pin'],
    ['supplies', 'Supplies are insufficient', 'The available supply of {item} is insufficient', 'layers'],
  ]],
  ['information', 'Uncertain information', [
    ['accounts', 'Accounts conflict', 'The available accounts conflict', 'swap'],
    ['evidence', 'Evidence is incomplete', 'The evidence concerning {item} is incomplete', 'book'],
    ['message', 'A message is misunderstood', '{actor} misunderstands a message from {other}', 'users'],
    ['disputed', 'The explanation is disputed', '{other} disputes the explanation', 'alert'],
  ]],
  ['time', 'Time pressure', [
    ['deadline', 'A deadline approaches', 'A deadline approaches before the matter is settled', 'clock'],
    ['early', 'Something arrives early', '{item} arrives earlier than expected', 'zap'],
    ['delay', 'A delay changes things', 'A delay changes what {actor} can do', 'clock'],
    ['overlap', 'Opportunities overlap', 'Two opportunities require attention at the same time', 'branches'],
  ]],
  ['commitments', 'Competing commitments', [
    ['duties', 'Two duties conflict', '{actor} faces conflicting duties', 'branches'],
    ['elsewhere', 'Needed in two places', '{actor} is needed in two places at once', 'pin'],
    ['claims', 'Two claims concern one item', 'Two claims concern {item}', 'box'],
    ['promise', 'A promise becomes costly', '{actor}’s earlier promise becomes costly to keep', 'heart'],
  ]],
  ['exposure', 'Exposure', [
    ['witness', 'A witness appears', '{other} appears as a witness and challenges the situation', 'user'],
    ['secret', 'A secret risks discovery', 'A secret kept by {actor} risks discovery', 'search'],
    ['public', 'An action becomes public', '{actor}’s action becomes public', 'users'],
    ['wrong-person', 'The wrong person learns', 'Information reaches {other}, whom {actor} wanted to exclude', 'book'],
  ]],
  ['cost', 'Cost or tradeoff', [
    ['relationship', 'A relationship is at risk', 'Proceeding puts the relationship between {actor} and {other} at risk', 'heart'],
    ['resource', 'A resource is consumed', 'Proceeding consumes {item}', 'box'],
    ['debt', 'A debt is created', 'Accepting help creates a debt to {other}', 'link'],
    ['risk', 'Someone else takes the risk', 'Proceeding transfers the risk to {other}', 'swap'],
  ]],
  ['unexpected', 'Unexpected development', [
    ['side', 'Someone changes sides', '{actor} changes sides', 'swap'],
    ['use', 'An object has another use', '{item} has another, unexpected use', 'wrench'],
    ['demand', 'Success creates a new demand', 'Success creates a new demand on {actor}', 'branches'],
    ['change', 'The situation changes', 'The situation changes while {actor} acts', 'zap'],
  ]],
].map(([id, label, rows]) => ({ id, label, options: options(rows) }));
export const BEAT_COMPLICATION_EFFECTS = options([
  ['blocks', 'Blocks', 'blocking the intended action', 'cross', 'rose'],
  ['delays', 'Delays', 'delaying what happens next', 'clock', 'amber'],
  ['redirects', 'Redirects', 'redirecting the intended action', 'swap', 'violet'],
  ['exposes', 'Exposes', 'exposing the situation to scrutiny', 'search', 'blue'],
  ['cost', 'Adds a cost', 'adding a cost to proceeding', 'link', 'teal'],
]);
export const BEAT_ENTRIES = options([
  ['asked', 'Asked directly', '{actor} asks the players to become involved', 'user'],
  ['stumble', 'Stumble across it', 'The players come across {subject}', 'pin'],
  ['witness', 'Witness it', 'The players witness what happens to {subject}', 'search'],
  ['affected', 'Become affected', 'The players are affected by {subject}', 'alert'],
  ['clue', 'Receive a clue', 'The players receive a clue about {subject}', 'book'],
  ['responsible', 'Become responsible', 'The players become responsible for a response', 'flag'],
  ['goal', 'Pursue their own goal', 'The players encounter the situation while pursuing their own goal', 'target'],
  ['benefit', 'Offered a benefit', 'The players are offered a benefit for becoming involved', 'star'],
]);
export const BEAT_INTERACTIONS = options([
  ['investigate', 'Discover / investigate', 'investigate', 'search', 'blue'],
  ['negotiate', 'Talk / persuade / negotiate', 'talk or negotiate', 'users', 'teal'],
  ['judge', 'Choose / judge', 'make a choice or judge the claims', 'rules', 'amber'],
  ['cooperate', 'Cooperate / coordinate', 'cooperate or coordinate', 'link', 'green'],
  ['overcome', 'Overcome / endure', 'overcome a difficulty or endure it', 'target', 'rose'],
  ['witness', 'Witness / interpret', 'witness or interpret what happens', 'book', 'violet'],
]);
export const BEAT_INFLUENCE = options([
  ['knowledge', 'Knowledge', 'what becomes known', 'book'],
  ['agreement', 'Agreement', 'the agreement', 'link'],
  ['access', 'Access', 'access to {place}', 'pin'],
  ['possession', 'Possession', 'who receives {item}', 'box'],
  ['resources', 'Resources', 'the available resources', 'layers'],
  ['relationships', 'Relationships', 'the relationships involved', 'heart'],
  ['timing', 'Timing', 'when the situation develops', 'clock'],
  ['other', 'Another outcome', 'another outcome', 'branches'],
]);
export const BEAT_CONDITIONS = options([
  ['proceeds', 'The opener proceeds', 'the initial happening proceeds', 'flag'],
  ['overcome', 'The complication is overcome', 'the complication is overcome', 'target'],
  ['investigate', 'Players investigate', 'players investigate', 'search'],
  ['negotiate', 'Players negotiate', 'players negotiate', 'users'],
  ['depleted', 'A resource runs out', 'a needed resource runs out', 'box'],
  ['deadline', 'A deadline passes', 'the deadline passes', 'clock'],
  ['alone', 'Players leave it alone', 'players leave the situation alone', 'pin'],
]);
export const BEAT_CONSEQUENCE_EFFECTS = options([
  ['gain', 'Gain', '{affected} gains {result}', 'star', 'green'],
  ['lose', 'Lose', '{affected} loses {result}', 'cross', 'rose'],
  ['reveal', 'Reveal', '{result} becomes known to {affected}', 'search', 'blue'],
  ['conceal', 'Conceal', '{result} remains hidden from {affected}', 'book', 'violet'],
  ['strengthen', 'Strengthen', '{result} is strengthened for {affected}', 'heart', 'green'],
  ['weaken', 'Weaken', '{result} is weakened for {affected}', 'alert', 'rose'],
  ['grant', 'Grant access', '{affected} gains access to {result}', 'pin', 'teal'],
  ['restrict', 'Restrict access', '{affected}’s access to {result} is restricted', 'cross', 'amber'],
  ['transfer', 'Transfer', '{result} changes hands, affecting {affected}', 'swap', 'violet'],
  ['create', 'Create', '{result} begins for {affected}', 'flag', 'green'],
  ['end', 'End', '{result} ends for {affected}', 'clock', 'rose'],
  ['restore', 'Protect / restore', '{result} is protected or restored for {affected}', 'heart', 'teal'],
  ['preserve', 'Preserve', '{result} is preserved for {affected}', 'layers', 'blue'],
  ['followup', 'Create a new demand', '{affected} faces a new demand concerning {result}', 'branches', 'amber'],
]);
export const BEAT_TIMING = options([['immediate', 'Immediate', 'immediately', 'zap'], ['later', 'Later', 'later', 'clock'], ['next', 'After another beat', 'after another story moment', 'branches'], ['ongoing', 'Ongoing', 'on an ongoing basis', 'link']]);
export const BEAT_VISIBILITY = options([['public', 'Public', 'publicly apparent', 'users'], ['private', 'Selected people', 'known to selected people', 'user'], ['discoverable', 'Discoverable', 'discoverable through clues', 'search'], ['organizer', 'Organizers only', 'known only to organizers', 'book']]);
export const BEAT_CHANGE_DOMAINS = options([
  ['knowledge', 'Knowledge / understanding', '', 'book', 'blue'],
  ['relationships', 'Trust / relationships', '', 'heart', 'rose'],
  ['authority', 'Power / authority', '', 'flag', 'violet'],
  ['access', 'Possession / access', '', 'box', 'amber'],
  ['goals', 'Goals / commitments', '', 'target', 'teal'],
  ['danger', 'Danger / opportunity', '', 'alert', 'green'],
]);
export const BEAT_ROLE_LABELS = { actor: 'Main person / group', other: 'Other person / group', item: 'Item / subject', place: 'Location' };
export const BEAT_ROLE_ICONS = { actor: 'user', other: 'users', item: 'box', place: 'pin' };
