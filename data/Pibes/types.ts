import { type TacticalRole, type AttackRole, type DefenseRole } from "../roles";

export type OperatorSide = "attack" | "defense";

export type OperatorProfile = {
  name: string;
  side: OperatorSide;
  roles: TacticalRole[];
  position: string;
  tempo: string;
  provides: string[];
  needs: string[];
  best_with_roles: string[];
  duo_plan: string;
  trio_plan: string;
  player_fit: string[];
  difficulty: "low" | "medium" | "high";
};

export interface RoleAffinity {
  score: number;
  method: string;
  confidence: "low" | "medium" | "high";
}

export interface MapPerformanceEntry {
  rounds?: number;
  winRate?: number;
  kd?: number;
  classification: "elite" | "strong" | "stable" | "neutral" | "weak" | "critical" | "frag-heavy";
  confidence: "low" | "medium" | "high";
  source: "tracker-derived" | "tactical-analysis" | "mixed" | "manual";
  recommendedRoles?: string[];
  avoidRoles?: string[];
  tacticalNote?: string;
}

export interface TacticalIdentity {
  summary: string;
  primaryRoles: string[];
  secondaryRoles: string[];
  postUtilityRole: string[];
  preferredTempo: string;
  preferredPosition: string[];
  playstyleTags: string[];
}

export interface PickOrderGuideline {
  preferredPosition: number;
  reason: string;
  flexible: boolean;
}

export interface ActiveSupportSide {
  requiredFunctions: string[];
  preferredTransitions: string[];
  avoidPatterns: string[];
}

export interface TryoutOpInfo {
  operatorId: string;
  side: string;
  developmentGoal: string;
  practiceFocus: string[];
}

export interface PibeProfile {
  id: string;
  displayName: string;
  tag: string;
  
  identity: TacticalIdentity;
  roleAffinity: Record<string, RoleAffinity>;

  identityOperators: string[];
  comfortOperators: string[];
  tryoutAttack: TryoutOpInfo[];
  tryoutDefense: TryoutOpInfo[];
  avoidOperators: string[];
  
  attackMains: string[];
  defenseMains: string[];
  attackRoles: AttackRole[];
  defenseRoles: DefenseRole[];

  mapPerformance: {
    attack: Record<string, MapPerformanceEntry>;
    defense: Record<string, MapPerformanceEntry>;
  };

  pickOrder: {
    attack: PickOrderGuideline;
    defense: PickOrderGuideline;
  };

  activeSupport: {
    attack: ActiveSupportSide;
    defense: ActiveSupportSide;
  };

  tacticalGuidelines: {
    attack: { do: string[]; avoid: string[] };
    defense: { do: string[]; avoid: string[] };
    general: { do: string[]; avoid: string[] };
  };
}

export interface ScoreBreakdown {
  operatorComfort: number;
  roleAffinity: number;
  compositionNeed: number;
  trackerMapPerformance: number;
  factosMapContext: number;
  activeSupportTransition: number;
  pickOrderContext: number;
  avoidPatternPenalty: number;
  penalties: number;
}

export interface ScoreExplanation {
  positive: string[];
  negative: string[];
  warnings: string[];
}

export type PlayerPick = {
  playerLabel: string;
  playerId: string;
  opName: string;
  backupOpName?: string;
  trackerHighlight?: string;
  operatorProfile: OperatorProfile;
  role: string;
  isMain?: boolean;
  isTryout?: boolean;
  isBreathing?: boolean;
  pickOrderNumber: number;
  coversRequirement?: boolean;
  coveredRole?: string;
  developmentGoal?: string;
  avoidWarning?: string;
  tacticalTask?: string;
  mapStrategyRole?: string;
  explanation: ScoreExplanation;
  scoreBreakdown: ScoreBreakdown;
  score: number;
};

export type SquadResponsibilities = {
  defuserCarrier?: string;
  primaryDrone?: string;
  firstEntry?: string;
  secondEntry?: string;
  flankWatch?: string;
  shotCaller?: string;
};

export type TacticalWarning = {
  id: string;
  severity: "low" | "medium" | "high";
  message: string;
};

export type ConfidenceInfo = {
  level: "high" | "medium" | "low";
  percentage: number;
  reasons: string[];
};

export type SquadRecommendation = {
  title: string;
  picks: PlayerPick[];
  pickOrder: string[];
  orderReason: string;
  trioPlan?: string;
  duoPlan?: string;
  responsibilities: SquadResponsibilities;
  warnings: TacticalWarning[];
  confidence: ConfidenceInfo;
  breathingType?: "none" | "scheduled" | "adaptive";
  breathingReason?: string;
};

export type RecommendationEngineOutput = {
  primary: SquadRecommendation;
  safeVariant: SquadRecommendation;
  breathingVariant?: SquadRecommendation;
};
