export const MECHANIC_NODE_KINDS = [
  'taskTemplate',
  'challengeCore',
  'physicalRestriction',
  'propInteraction',
  'sensorNode',
  'actuatorNode',
  'characterState',
  'progressState',
] as const;

export type MechanicNodeKind = typeof MECHANIC_NODE_KINDS[number];

export const SPECTRUM_OF_YES = [
  { id: 'yes-and', label: 'Yes, and', polarity: 3 },
  { id: 'yes', label: 'Yes', polarity: 2 },
  { id: 'yes-but', label: 'Yes, but', polarity: 1 },
  { id: 'no-but', label: 'No, but', polarity: -1 },
  { id: 'no', label: 'No', polarity: -2 },
  { id: 'no-and', label: 'No, and', polarity: -3 },
] as const;

export type SpectrumOfYesId = typeof SPECTRUM_OF_YES[number]['id'];

export type CollapseDepth = 0 | 1 | 2 | 3 | 4;

export interface MechanicGraphEdge {
  from: string;
  to: string;
  label?: string;
  color?: string | null;
  outcomeId?: SpectrumOfYesId;
  resourceId?: string | null;
  condition?: string;
}

export interface MechanicSubgraph {
  nodes: Record<string, MechanicNode>;
  edges: MechanicGraphEdge[];
  frames?: Record<string, MechanicFrame>;
}

export interface MechanicFrame {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string | null;
}

export interface ReusedPhysicalRefs {
  itemIds?: string[];
  locationIds?: string[];
  sensorIds?: string[];
  mechanicIds?: string[];
}

export interface MechanicNodeBase {
  id: string;
  kind: MechanicNodeKind;
  title: string;
  body?: string;
  x: number;
  y: number;
  color?: string | null;
  icon?: string;
  primitiveId?: string | null;
  libraryTemplateId?: string | null;
  collapsed?: boolean;
  collapseDepth?: CollapseDepth;
  tags?: string[];
  refs?: ReusedPhysicalRefs;
  sub?: MechanicSubgraph;
}

export interface TaskTemplateNode extends MechanicNodeBase {
  kind: 'taskTemplate';
  body: string;
  image?: unknown;
  estMinutes: number;
  minPlayers: number;
  maxPlayers: number;
  recommendedCrew?: string;
  difficultyPressure?: 'Low' | 'Medium' | 'High' | 'Extreme' | number;
  reusableAsLibraryTemplate?: boolean;
  sub: MechanicSubgraph;
}

export interface ChallengeCoreNode extends MechanicNodeBase {
  kind: 'challengeCore';
  goal: string;
  cooperationStyle: 'Solo' | 'Parallel' | 'Relay' | 'Synchronous' | 'Asymmetric';
  physicalTrackSubnodeIds?: string[];
  cognitiveTrackSubnodeIds?: string[];
  noteColor?: string | null;
}

export interface PhysicalRestrictionNode extends MechanicNodeBase {
  kind: 'physicalRestriction';
  body: string;
  image?: unknown;
  restrictionType: 'Blindfold' | 'Binding one hand' | 'Silence' | 'Carry load' | 'Mobility limit' | string;
  connectTo: {
    nodeIds?: string[];
  };
  safetyRule?: string;
  stopCondition?: string;
  noteColor?: string | null;
  attachedSubnodeIds?: string[];
}

export interface PropInteractionNode extends MechanicNodeBase {
  kind: 'propInteraction';
  body: string;
  image?: unknown;
  interactionType: 'Balance' | 'Carry' | 'Sort' | 'Throw' | 'Assemble' | 'Unlock' | 'Trade' | string;
  successCondition: string;
  failureCondition?: string;
  resetProcedure?: string;
  connectTo?: {
    itemIds?: string[];
    sensorIds?: string[];
    nodeIds?: string[];
    ideas?: string[];
  };
  noteColor?: string | null;
  attachedSubnodeIds?: string[];
}

export interface SensorNode extends MechanicNodeBase {
  kind: 'sensorNode';
  body: string;
  sensorType: 'Pressure' | 'NFC' | 'Motion' | 'GPS Zone' | 'Button' | string;
  zoneReference?: string;
  inputRequired: string;
  triggerCondition?: string;
  frequencyLimitEnabled?: boolean;
  frequencyTriggerCount?: number;
  frequencyTimePeriod?: '5 seconds' | '30 seconds' | '1 minute' | '2 minutes' | '5 minutes' | '10 minutes' | string;
  cooldownEnabled?: boolean;
  cooldownDuration?: '5 seconds' | '30 seconds' | '1 minute' | '2 minutes' | '5 minutes' | '10 minutes' | string;
  manualOverrideFallback?: string;
  reliability?: '1' | '2' | '3' | '4' | '5' | number;
  nodeColor?: string | null;
}

export interface ActuatorNode extends MechanicNodeBase {
  kind: 'actuatorNode';
  body: string;
  actuatorType: 'Light' | 'Sound' | 'Movement' | 'Lock' | 'Display' | 'Message' | string;
  audioFileRef?: string;
  frequencyLimitEnabled?: boolean;
  frequencyTriggerCount?: number;
  frequencyTimePeriod?: '5 seconds' | '30 seconds' | '1 minute' | '2 minutes' | '5 minutes' | '10 minutes' | string;
  cooldownEnabled?: boolean;
  cooldownDuration?: '5 seconds' | '30 seconds' | '1 minute' | '2 minutes' | '5 minutes' | '10 minutes' | string;
  outputDuration?: string;
  outputIntensity?: string;
  outputRhythm?: string;
  resetBehavior?: string;
  manualOverrideFallback?: string;
  nodeColor?: string | null;
}

export interface CharacterStateNode extends MechanicNodeBase {
  kind: 'characterState';
  body: string;
  emotionalState?: 'Neutral' | 'Sad' | 'Angry' | 'Joyful' | 'Confused' | 'Hostile' | 'Allied' | string;
  behavioralNotes?: string;
  nodeColor?: string | null;
  attachedSubnodeIds?: string[];
}

export interface ProgressStateNode extends MechanicNodeBase {
  kind: 'progressState';
  body: string;
  currentProgress: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | number;
  visualStyle?: 'Segmented bar' | 'Percentage' | string;
}

export type MechanicNode =
  | TaskTemplateNode
  | ChallengeCoreNode
  | PhysicalRestrictionNode
  | PropInteractionNode
  | SensorNode
  | ActuatorNode
  | CharacterStateNode
  | ProgressStateNode;

export interface MechanicLibraryTemplate {
  id: string;
  name: string;
  description: string;
  estMinutes: number;
  nodeKind: MechanicNodeKind;
  nodes: Record<string, MechanicNode>;
  edges: MechanicGraphEdge[];
  frames?: Record<string, MechanicFrame>;
  tags?: string[];
}

export const MECHANIC_NODE_TYPE_META: Record<MechanicNodeKind, {
  label: string;
  color: string;
  icon: string;
  blurb: string;
}> = {
  taskTemplate: {
    label: 'Task Template',
    color: '#8B7BF5',
    icon: 'layers',
    blurb: 'Reusable collapsed container that opens into a full editable mechanics graph.',
  },
  challengeCore: {
    label: 'Challenge Core',
    color: '#A87BF0',
    icon: 'cog',
    blurb: 'Central task engine: goal, physical/cognitive tracks, and cooperation style. Advanced behavior comes from attached subnodes.',
  },
  physicalRestriction: {
    label: 'Physical Restriction',
    color: '#E86464',
    icon: 'cross',
    blurb: 'Body, movement, communication, or carrying limitation with safety rules.',
  },
  propInteraction: {
    label: 'Prop Interaction',
    color: '#E0A23C',
    icon: 'swap',
    blurb: 'How players manipulate real props without duplicating item/artifact records.',
  },
  sensorNode: {
    label: 'Sensor Node',
    color: '#3EC6D6',
    icon: 'zap',
    blurb: 'Gameplay sensor that defines what input is detected and when it activates.',
  },
  actuatorNode: {
    label: 'Actuator Node',
    color: '#5CA8F5',
    icon: 'flag',
    blurb: 'Gameplay output that defines what effect happens in the world.',
  },
  characterState: {
    label: 'Character State',
    color: '#F08CB4',
    icon: 'user',
    blurb: 'Pre-programmed character or NPC state for dialogue trees and AI agent behavior.',
  },
  progressState: {
    label: 'Progress State',
    color: '#A87BF0',
    icon: 'pin',
    blurb: 'Supporting visual task completion tracker on a 1 to 10 scale.',
  },
};

export const MECHANIC_SUBNODE_KINDS = [
  'progressiveFeedback',
  'failSafeScaffolding',
  'escalatingPressure',
  'cooperativeEthosRole',
  'noSoloEnforcer',
  'arbitration',
  'teamDiscussionPrompt',
  'facilitatorNote',
  'triggerDelay',
  'frequencyControl',
  'multipleOutputLogic',
  'conditionalActivation',
  'value',
  'lifespan',
  'spendUseRule',
  'spectrumOfYesOutcomes',
  'readinessStatus',
  'player',
  'team',
  'comment',
  'coreMechanicModifier',
] as const;

export type MechanicSubnodeKind = typeof MECHANIC_SUBNODE_KINDS[number];

export interface MechanicSubnodeBase {
  id: string;
  kind: MechanicSubnodeKind;
  name: string;
  purpose: string;
  color?: string;
  icon?: string;
  attachesTo?: Array<MechanicNodeKind | '*'>;
  collapsed?: boolean;
  collapseDepth?: CollapseDepth;
}

export interface ProgressiveFeedbackMod extends MechanicSubnodeBase {
  kind: 'progressiveFeedback';
  feedbackType: string[];
  triggerCondition: string;
  effectDescription: string;
  strengthIntensity?: 'subtle' | 'moderate' | 'strong' | 'dramatic';
  canStack?: boolean;
}

export interface FailSafeScaffoldingMod extends MechanicSubnodeBase {
  kind: 'failSafeScaffolding';
  hintLevels: {
    count: number;
    trigger: 'time' | 'failed-attempts' | 'facilitator-call' | 'player-request' | 'custom';
  };
  easierAlternativePath?: {
    enabled: boolean;
    description?: string;
  };
  partialCreditRule?: string;
  skipOption?: {
    enabled: boolean;
    condition?: string;
    consequence?: string;
  };
  gracePeriodMinutes?: number;
}

export interface EscalatingPressureMod extends MechanicSubnodeBase {
  kind: 'escalatingPressure';
  pressureType: string[];
  baseDurationMinutes: number;
  escalationTrigger: string;
  escalationEffect: string;
  canBePaused?: boolean;
}

export interface CooperativeEthosRoleMod extends MechanicSubnodeBase {
  kind: 'cooperativeEthosRole';
  cooperationStyle: 'differentiated-roles' | 'synchronized-action' | 'relay' | 'parallel-tracks' | 'shared-planning';
  roleSuggestions?: string;
  ethosTone: 'calm-trust' | 'urgent-coordination' | 'playful-chaos' | 'mutual-support' | 'leadership-rotation';
  ethosToneGuidance: string;
  teamDiscussionPrompt?: string;
}

export interface NoSoloEnforcerMod extends MechanicSubnodeBase {
  kind: 'noSoloEnforcer';
  enforcementType: string[];
  minimumPlayers: number;
}

export interface ArbitrationMod extends MechanicSubnodeBase {
  kind: 'arbitration';
  varianceHandling: 'strict' | 'small-tolerance' | 'generous-tolerance' | 'facilitator-judgment';
  toleranceDescription?: string;
  partialCreditRule?: string;
  facilitatorOverride?: boolean;
  logging?: boolean;
}

export interface TeamDiscussionPromptMod extends MechanicSubnodeBase {
  kind: 'teamDiscussionPrompt';
  discussionPrompt: string;
  whenToUse?: 'before-task' | 'during-task' | 'after-task' | 'between-attempts';
  facilitatorNote?: string;
}

export interface FacilitatorNoteMod extends MechanicSubnodeBase {
  kind: 'facilitatorNote';
  facilitatorGuidance: string;
}

export interface TriggerDelayMod extends MechanicSubnodeBase {
  kind: 'triggerDelay';
  purpose: string;
  delayDuration: string;
  delayType?: 'Fixed' | 'Random' | 'Variable';
}

export interface FrequencyControlMod extends MechanicSubnodeBase {
  kind: 'frequencyControl';
  purpose: string;
  maxTriggersPerSession: string;
  cooldown?: string;
  deprecated?: boolean;
}

export interface MultipleOutputLogicMod extends MechanicSubnodeBase {
  kind: 'multipleOutputLogic';
  purpose: string;
  inputConditions: string;
  correspondingOutputs: string;
  defaultOutput?: string;
}

export interface ConditionalActivationMod extends MechanicSubnodeBase {
  kind: 'conditionalActivation';
  purpose: string;
  requiredConditions: string;
  logicType?: 'AND' | 'OR';
}

export interface ValueMod extends MechanicSubnodeBase {
  kind: 'value';
  purpose: string;
  initialValue?: string | number;
  currentValue?: string | number;
  maxValue?: string | number;
}

export interface LifespanMod extends MechanicSubnodeBase {
  kind: 'lifespan';
  purpose: string;
  lifespanType: 'Task only' | 'Full session/game' | 'Permanent' | 'Custom';
  description?: string;
}

export interface SpendUseRuleMod extends MechanicSubnodeBase {
  kind: 'spendUseRule';
  purpose: string;
  usageRules: string;
  limitations?: string;
}

export interface SpectrumOfYesOutcomesMod extends MechanicSubnodeBase {
  kind: 'spectrumOfYesOutcomes';
  purpose: string;
  outcomeLevels: string;
  yesAndDescription?: string;
  yesDescription?: string;
  yesButDescription?: string;
  noButDescription?: string;
  noDescription?: string;
  noAndDescription?: string;
  defaultSelection?: Array<'Yes and' | 'Yes' | 'Yes but' | 'No but' | 'No' | 'No and'>;
}

export interface ReadinessStatusMod extends MechanicSubnodeBase {
  kind: 'readinessStatus';
  purpose: string;
  status: 'Draft' | 'In Progress' | 'Ready for Testing' | 'Ready' | 'Retired';
  notes?: string;
}

export interface PlayerSupportMod extends MechanicSubnodeBase {
  kind: 'player';
  playerIds: string[];
}

export interface TeamSupportMod extends MechanicSubnodeBase {
  kind: 'team';
  teamIds: string[];
}

export interface CommentMod extends MechanicSubnodeBase {
  kind: 'comment';
  purpose: string;
  commentText: string;
  authorDate?: string;
}

export interface CoreMechanicModifierMod extends MechanicSubnodeBase {
  kind: 'coreMechanicModifier';
  variationCategory: 'timing' | 'space' | 'body-limit' | 'information' | 'props' | 'sensors' | 'resources' | 'difficulty';
  variationDescription: string;
  canBeCombined?: boolean;
}

export type MechanicSubnode =
  | ProgressiveFeedbackMod
  | FailSafeScaffoldingMod
  | EscalatingPressureMod
  | CooperativeEthosRoleMod
  | NoSoloEnforcerMod
  | ArbitrationMod
  | TeamDiscussionPromptMod
  | FacilitatorNoteMod
  | TriggerDelayMod
  | FrequencyControlMod
  | MultipleOutputLogicMod
  | ConditionalActivationMod
  | ValueMod
  | LifespanMod
  | SpendUseRuleMod
  | SpectrumOfYesOutcomesMod
  | ReadinessStatusMod
  | PlayerSupportMod
  | TeamSupportMod
  | CommentMod
  | CoreMechanicModifierMod;

export const MECHANIC_SUBNODE_TYPE_META: Record<MechanicSubnodeKind, {
  label: string;
  color: string;
  icon: string;
  purpose: string;
  reusable: boolean;
  category: 'gameplayModifiers' | 'supporting';
}> = {
  progressiveFeedback: {
    label: 'Progressive Feedback Mod',
    color: '#58C7A6',
    icon: 'zap',
    reusable: false,
    category: 'gameplayModifiers',
    purpose: 'Forces the designer to define how success in one part of the task makes the next part easier or more obvious. Creates a positive feedback loop so players feel progress.',
  },
  failSafeScaffolding: {
    label: 'Fail-Safe + Scaffolding Mod',
    color: '#E8D25C',
    icon: 'layers',
    reusable: false,
    category: 'gameplayModifiers',
    purpose: 'Provides structured ways to recover from failure or near-failure. Prevents players from feeling like total failures when they were close to succeeding.',
  },
  escalatingPressure: {
    label: 'Escalating Pressure Mod',
    color: '#E86464',
    icon: 'clock',
    reusable: false,
    category: 'gameplayModifiers',
    purpose: 'Creates growing urgency and difficulty during the task. Pressure can increase through time, physical demand, environmental changes, or other escalating factors.',
  },
  cooperativeEthosRole: {
    label: 'Cooperative Ethos / Role Mod',
    color: '#A87BF0',
    icon: 'user',
    reusable: false,
    category: 'gameplayModifiers',
    purpose: 'Defines how cooperation should emerge in the task, either through differentiated roles or synchronized team actions, and sets the expected social tone of play.',
  },
  noSoloEnforcer: {
    label: 'No-Solo Enforcer',
    color: '#F08CB4',
    icon: 'cross',
    reusable: false,
    category: 'gameplayModifiers',
    purpose: 'Structurally prevents a single player from completing the task alone by enforcing physical, spatial, or timing requirements.',
  },
  arbitration: {
    label: 'Arbitration Mod',
    color: '#5CA8F5',
    icon: 'flag',
    reusable: false,
    category: 'gameplayModifiers',
    purpose: 'Handles situations where real-world conditions create uncertainty or variance. Provides tolerance and fallback rules.',
  },
  teamDiscussionPrompt: {
    label: 'Team Discussion Prompt',
    color: '#43BF87',
    icon: 'book',
    reusable: true,
    category: 'gameplayModifiers',
    purpose: 'Allows the designer to insert a specific question or prompt that the team should discuss before, during, or after a task.',
  },
  facilitatorNote: {
    label: 'Facilitator Note',
    color: '#8B92A6',
    icon: 'pin',
    reusable: true,
    category: 'supporting',
    purpose: 'A simple, reusable note that can be attached to any task or subnode. It contains guidance for the person running the game.',
  },
  triggerDelay: {
    label: 'Trigger Delay',
    color: '#5CA8F5',
    icon: 'clock',
    reusable: true,
    category: 'gameplayModifiers',
    purpose: 'Adds a delay before the sensor or actuator activates after the trigger condition is met.',
  },
  frequencyControl: {
    label: 'Frequency Control',
    color: '#E8D25C',
    icon: 'clock',
    reusable: true,
    category: 'gameplayModifiers',
    purpose: 'Deprecated. Frequency limiting now lives inside Sensor and Actuator nodes.',
  },
  multipleOutputLogic: {
    label: 'Multi-Output Resolver',
    color: '#A87BF0',
    icon: 'swap',
    reusable: true,
    category: 'gameplayModifiers',
    purpose: 'Defines different outputs based on different input conditions.',
  },
  conditionalActivation: {
    label: 'Conditional Activation',
    color: '#E0A23C',
    icon: 'flag',
    reusable: true,
    category: 'gameplayModifiers',
    purpose: 'Requires additional conditions to be met before the sensor or actuator can activate.',
  },
  value: {
    label: 'Value',
    color: '#E8D25C',
    icon: 'pin',
    reusable: true,
    category: 'gameplayModifiers',
    purpose: 'Defines numeric or tradable value of an item or resource.',
  },
  lifespan: {
    label: 'Lifespan',
    color: '#43BF87',
    icon: 'clock',
    reusable: true,
    category: 'gameplayModifiers',
    purpose: 'Defines how long this item or resource persists.',
  },
  spendUseRule: {
    label: 'Spend / Use Rule',
    color: '#E0A23C',
    icon: 'swap',
    reusable: true,
    category: 'gameplayModifiers',
    purpose: 'Defines how this item or resource can be spent or used.',
  },
  spectrumOfYesOutcomes: {
    label: 'Spectrum of Yes Outcomes',
    color: '#8B7BF5',
    icon: 'layers',
    reusable: true,
    category: 'gameplayModifiers',
    purpose: 'Defines the graduated outcome levels for the task, from best to worst.',
  },
  readinessStatus: {
    label: 'Readiness Status',
    color: '#6FD9A7',
    icon: 'flag',
    reusable: true,
    category: 'supporting',
    purpose: 'Shows the current development or readiness state of the attached element.',
  },
  player: {
    label: 'Player',
    color: '#5CA8F5',
    icon: 'user',
    reusable: true,
    category: 'supporting',
    purpose: 'Selects one or more players from the game player database.',
  },
  team: {
    label: 'Team',
    color: '#E0A23C',
    icon: 'layers',
    reusable: true,
    category: 'supporting',
    purpose: 'Selects one or more teams from the game team database.',
  },
  comment: {
    label: 'Comment',
    color: '#E8D25C',
    icon: 'book',
    reusable: true,
    category: 'supporting',
    purpose: 'Freeform comment or designer note attached to any element.',
  },
  coreMechanicModifier: {
    label: 'Core Mechanic Modifier',
    color: '#E0A23C',
    icon: 'cog',
    reusable: false,
    category: 'gameplayModifiers',
    purpose: 'Allows the designer to deliberately change one core aspect of the task to create a meaningfully different experience or difficulty level.',
  },
};
