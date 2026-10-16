// Summaries of the material supplied by the designer. Design prompts are
// Larpcraft adaptations, not scores or validated personality assessments.
export const PLAYER_TYPE_GROUPS = [
  { id: 'bartle', name: 'Bartle · four player motivations', note: 'A multiplayer design lens: acting or interacting, with the world or with other players. Motivations can overlap and change between games or during play.', types: [
    ['achiever', 'Achiever', 'Acting on the world', 'Enjoys pursuing goals, mastering challenges, and making visible progress. Achievement need not mean defeating another player.', 'Which mechanics help players complete the game’s goals?', 'Clear objectives, milestones, optional challenges, and recognition of progress.'],
    ['explorer', 'Explorer', 'Interacting with the world', 'Enjoys discovery, experimentation, hidden places, and learning how the world works. Sharing a discovery can be part of the reward.', 'How much freedom for exploration do the mechanics provide?', 'Hidden clues, alternate routes, experiments, and discoveries worth sharing.'],
    ['socializer', 'Socializer', 'Interacting with players', 'Values relationships and shared experiences. The game provides a setting for meaningful interaction, even when winning also matters.', 'Which forms of social interaction arise from the mechanics?', 'Negotiation, shared discoveries, cooperative roles, and time for conversation.'],
    ['killer', 'Killer / Dominance', 'Acting on players', 'Seeks influence over other players or visible competitive impact. This can involve rivalry, commanding, or managing; it should not automatically be equated with griefing.', 'How do the mechanics allow dominance, leadership, or player management?', 'Agreed competitive roles, leadership opportunities, and clear limits on interference.'],
  ] },
  { id: 'playstyles', name: 'Ten play styles', note: 'The second categorization supplied for this library. Its author was not identified in the supplied excerpt. Similar labels in different models remain separate.', types: [
    ['competitor', 'Competitor', 'Competition', 'Plays to outperform other players, across different games.', 'Where can players test themselves against others?', 'Fair contests, rival objectives, and visible results.'],
    ['explorer', 'Explorer', 'Curiosity', 'Seeks adventure and pushes physical or mental boundaries.', 'What can players investigate beyond the obvious path?', 'Optional paths, unusual interactions, and open-ended discoveries.'],
    ['collector', 'Collector', 'Collection', 'Enjoys acquiring items, trophies, or knowledge and organising them into sets or histories.', 'What meaningful collection can players develop?', 'Artifact sets, clue collections, and records of discoveries.'],
    ['achiever', 'Achiever', 'Progression', 'Pursues levels of accomplishment and responds to milestones, ladders, and advancement.', 'How will progress and mastery become visible?', 'Tiered challenges, milestones, and achievements.'],
    ['joker', 'Joker', 'Playfulness', 'Plays for amusement and spontaneity. Humour can make play more social, though it may clash with a serious tone.', 'Where is playful improvisation welcome?', 'Comic roles, optional playful tasks, and space for light-hearted expression.'],
    ['artist', 'Artist', 'Creativity', 'Enjoys creative expression, making, and design.', 'What can players create or personalise?', 'Design a symbol, decorate a prop, or invent a solution.'],
    ['director', 'Director', 'Direction', 'Enjoys organising others and directing play.', 'Where can players coordinate meaningful decisions?', 'Rotating leadership, planning roles, and team coordination.'],
    ['storyteller', 'Storyteller', 'Imagination', 'Enjoys creating or inhabiting imagined worlds and stories.', 'How can player choices contribute to the fiction?', 'Character motivations, consequential choices, and collaborative scenes.'],
    ['performer', 'Performer', 'Expression', 'Enjoys presenting, acting, or putting on a show for others.', 'Where can players have an audience?', 'In-character speeches, demonstrations, and performance moments.'],
    ['craftsman', 'Craftsman', 'Construction', 'Enjoys building, crafting, engineering, and working things out.', 'What can players construct or solve through hands-on work?', 'Assemblies, repair challenges, mechanisms, and practical puzzles.'],
  ] },
].map(group => ({ ...group, types: group.types.map(([key, name, focus, description, question, design]) => ({ id: `${group.id}:${key}`, name, focus, description, question, design })) }));

export const PLAYER_TYPES = PLAYER_TYPE_GROUPS.flatMap(group => group.types);
export const PLAYER_TYPE_REFERENCES = [
  ['Quantic Foundry · nine player types', 'Acrobat, Gardener, Slayer, Skirmisher, Gladiator, Ninja, Bounty Hunter, Architect, Bard'],
  ['BrainHex · seven archetypes', 'Seeker, Survivor, Daredevil, Mastermind, Conqueror, Socialiser, Achiever'],
  ['Game Dynamics Preferences · seven types', 'Mercenary, Adventurer, Commander, Daredevil, Companion, Patterner, Explorer'],
];
