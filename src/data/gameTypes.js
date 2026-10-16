export const GAME_TYPE_QUESTIONS = [
  { key: 'players', label: 'Who plays?', options: [
    ['solo', 'Solo'], ['individuals', 'Individual players'], ['teams', 'Teams'],
  ] },
  { key: 'relationship', label: 'How do they work together?', options: [
    ['cooperative', 'Cooperatively'], ['competitive', 'Competitively'], ['semiCooperative', 'Shared goal with conflicting personal goals'],
  ] },
  { key: 'outcome', label: 'How does winning or losing work?', options: [
    ['shared', 'Shared success or failure'], ['oneWinner', 'One winner'], ['winningTeam', 'Winning team'], ['oneLoser', 'One loser'], ['custom', 'Custom'],
  ] },
  { key: 'roles', label: 'Do players have different roles?', options: [
    ['same', 'Same abilities'], ['different', 'Different roles or abilities'],
  ] },
  { key: 'betweenTries', label: 'What happens between rounds or sessions?', options: [
    ['reset', 'Everything resets'], ['carryForward', 'Changes carry forward'], ['oneTry', 'Intended to be played once'],
  ] },
];

export function gameTypeSummary(node) {
  const settings = node.gameType || {};
  const rows = GAME_TYPE_QUESTIONS.flatMap(question => {
    const option = question.options.find(([value]) => value === settings[question.key]);
    return option ? [{ key: question.key, label: question.label, text: question.key === 'outcome' && settings.outcome === 'custom' ? settings.customOutcome || 'Custom outcome' : option[1] }] : [];
  });
  if (settings.hiddenRoles) rows.push({ key: 'hiddenRoles', label: 'Roles', text: 'Hidden roles' });
  if (settings.traitor) rows.push({ key: 'traitor', label: 'Roles', text: 'Hidden traitor' });
  return rows;
}
