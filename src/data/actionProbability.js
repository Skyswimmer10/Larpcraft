import { mechanismImage } from './mechanismVisual.js';

const COLORS = {
  Numeric: '#5CA8F5',
  Cards: '#A87BF0',
  Choice: '#E8D25C',
  Social: '#F08CB4',
  Spatial: '#43BF87',
  Physical: '#E0A23C',
  Timing: '#3EC6D6',
};

const definitions = [
  ['High Number', 'Numeric', 'Compare generated totals; the highest qualifying result wins or succeeds.'],
  ['Stat Check', 'Numeric', 'Compare a result with a character statistic or target threshold to determine success.'],
  ['Critical Hits and Failures', 'Numeric', 'Extreme results create unusually strong successes or unusually costly failures.'],
  ['Ratio/Combat Results Table', 'Numeric', 'Compare opposing strengths as a ratio, then read the resulting outcome from a table.'],
  ['Die Icons', 'Numeric', 'Resolve the attempt by counting or interpreting symbols rather than ordinary die totals.'],
  ['Card Play', 'Cards', 'Players commit or reveal cards whose values and effects determine the result.'],
  ['Rock, Paper, Scissors', 'Choice', 'Simultaneous choices resolve through a circular pattern of strengths and weaknesses.'],
  ["Prisoner's Dilemma", 'Choice', 'Each participant chooses whether to cooperate or defect, with the combined choices shaping the payoff.'],
  ['Alternate Removal', 'Choice', 'Participants alternately remove available options until the remaining state determines the outcome.'],
  ['Physical Action', 'Physical', 'Real-world accuracy, speed, coordination, or dexterity directly determines the result.'],
  ['Static Capture', 'Spatial', 'A fixed spatial relationship determines whether an area, target, or piece is captured.'],
  ['Enclosure', 'Spatial', 'An outcome is achieved by surrounding or enclosing a target, region, or opposing element.'],
  ['Minimap', 'Spatial', 'A smaller representation of the play space is used to resolve position, movement, or control.'],
  ['Force Commitment', 'Choice', 'Players secretly or openly allocate limited strength before comparing commitments.'],
  ['Voting', 'Social', 'Participants collectively determine an outcome by casting and counting preferences.'],
  ['Player Judge', 'Social', 'A player evaluates an answer, performance, or interpretation and decides the result.'],
  ['Targeted Clues', 'Social', 'Specific information is directed to selected participants to shape deduction and resolution.'],
  ['Tiebreakers', 'Numeric', 'A secondary comparison or rule determines the result when the primary method is tied.'],
  ['Dice Selection', 'Numeric', 'Players choose which dice to roll, keep, use, or assign before resolving the result.'],
  ['Action Speed', 'Timing', 'The order or speed with which actions are completed determines priority or success.'],
  ['Rerolling and Locking', 'Numeric', 'Players preserve selected results while rerolling others to improve or complete an outcome.'],
  ['Kill Steal', 'Timing', 'Credit or reward goes to the participant who completes the decisive final contribution.'],
  ['Hot Potato', 'Timing', 'A risky state or object passes between participants until a timer or trigger resolves it.'],
  ['Flicking', 'Physical', 'Players propel components with a finger flick, using the resulting position or contact as the outcome.'],
  ['Stacking and Balancing', 'Physical', 'Players build or balance physical components, with stability and placement determining success.'],
  ['Neighbor Scope', 'Spatial', 'Resolution affects or compares only adjacent participants, spaces, or elements.'],
];

const slug = (value) => value.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');

export const ACTION_PROBABILITY_RESOLUTIONS = definitions.map(([label, category, description]) => ({
  id: `APR-${slug(label)}`,
  kind: 'probability',
  label,
  category,
  description,
  variations: [''],
  emotionalSpike: '',
  effects: [''],
  imageScale: 1,
  imagePositionX: 0,
  imagePositionY: 0,
  color: COLORS[category] || '#F08CB4',
  icon: category === 'Physical' ? 'cog' : category === 'Spatial' ? 'pin' : category === 'Social' ? 'users' : 'target',
  image: mechanismImage(label, COLORS[category] || '#F08CB4', `${category} resolution`),
  custom: false,
}));

export const ACTION_PROBABILITY_RESOLUTION_TYPES = ACTION_PROBABILITY_RESOLUTIONS.map((record) => record.label);

export const actionProbabilityResolution = (label) => (
  ACTION_PROBABILITY_RESOLUTIONS.find((record) => record.label === label) || null
);
