import { mechanismImage } from './mechanismVisual.js';

const COLOR = '#43BF87';

const definitions = [
  ['Victory Points from Game State', 'Award victory points for reaching or maintaining defined states in the game.'],
  ['Victory Points from Player Actions', 'Award victory points directly for specific actions completed by players.'],
  ['Temporary and Permanent Victory Points', 'Distinguish points that can still be lost from points secured permanently.'],
  ['Victory Points as a Resource', 'Let players spend, exchange, or otherwise use victory points during play.'],
  ['Hidden and Exposed Victory Point', 'Mix concealed victory-point information with scores that remain visible to everyone.'],
  ['Endgame Bonuses', 'Award additional victory points when final conditions are evaluated at the end of play.'],
  ['Race', 'The first player or team to reach a defined destination or objective wins.'],
  ['Player Elimination', 'Players leave contention as elimination conditions are met until a winner remains.'],
  ['Fixed Number of Rounds', 'End the game after a predetermined number of rounds and evaluate the winner.'],
  ['Exhausting Resources', 'End or resolve the game when a defined supply, deck, or other resource is depleted.'],
  ['Completing Targets', 'Win by completing a required set or number of objectives.'],
  ['Fixed Number of Events', 'End the game after a predetermined number of events have occurred.'],
  ['Elapsed Real Time', 'Use a real-world time limit to determine when play ends or victory is checked.'],
  ['Connections', 'Win by creating a required network, route, chain, or connection between objectives.'],
  ['Circuit Breaker, Sudden Death', 'Trigger an immediate ending when a decisive condition or threshold is reached.'],
  ['Finale', 'Resolve victory through a dedicated concluding phase after the main game.'],
  ['King of Hill', 'Win by taking and holding control of a key position or objective.'],
  ['Catch the Leader', 'Create victory pressure around reaching, stopping, or overtaking the current leader.'],
  ['Tug of War', 'Move a shared advantage back and forth until one side reaches its winning threshold.'],
  ['Highest Lowest', 'Determine victory by comparing the highest or lowest qualifying value at the end.'],
  ['Ordering', 'Determine victory by achieving or predicting a required order of players, objects, or events.'],
];

const slug = (value) => value.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');

export const VICTORY_CONDITIONS = definitions.map(([label, description]) => ({
  id: `VC-${slug(label)}`,
  kind: 'victory',
  label,
  category: 'Victory Condition',
  description,
  variations: [''],
  effects: [''],
  imageScale: 1,
  imagePositionX: 0,
  imagePositionY: 0,
  color: COLOR,
  icon: 'target',
  image: mechanismImage(label, COLOR, 'Victory condition'),
  custom: false,
}));

export const VICTORY_CONDITION_TYPES = VICTORY_CONDITIONS.map((record) => record.label);

