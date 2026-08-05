export type Side = "attack" | "defense";

export type BombSite = {
  name: string;
  floor: string;
};

export type RoundLog = {
  roundNum: number;
  side: Side;
  result: "win" | "loss";
  operator: string;
  bombSite?: BombSite;
};

export type OperatorRecommendation = {
  playerLabel: string;
  opName: string;
  role?: string;
  coveredRole?: string;
  developmentGoal?: string;
  avoidWarning?: string;
  tacticalTask?: string;
  backupOpName?: string;
  alternativeOps?: string[];
  trackerHighlight?: string;
  isMain?: boolean;
  isTryout?: boolean;
  isBreathing?: boolean;
  pickOrderNumber?: number;
  explanation?: {
    positive?: string[];
  };
};

export type PibeProfile = {
  id: string;
  displayName: string;
  identityOperators?: string[];
  comfortOperators?: string[];
  avoidOperators?: string[];
};

export type AttackSiteProfile = {
  id: string;
  siteName: string;
  floor: string;
  attackRoutes: {
    id: string;
    name: string;
    description: string;
  }[];
  commonDefenses: {
    id: string;
    name: string;
    counters: string[];
  }[];
};

export type SquadRecommendation = {
  picks: OperatorRecommendation[];
  orderReason?: string;
  trioPlan?: string;
  duoPlan?: string;
  warnings: { message: string }[];
  tacticalComposition?: {
    doctrine: string;
    score: number;
    operatorNames: string[];
    summary: string;
  };
  responsibilities?: {
    shotCaller?: string;
    defuserCarrier?: string;
    primaryDrone?: string;
    firstEntry?: string;
    secondEntry?: string;
  };
};

export type VariantTabKey = "primary" | "safe" | "breathing" | "experimental";

export type AdaptiveEngineOutput = {
  primary: {
    confidence: { percentage: number };
  };
  experimentalVariant?: SquadRecommendation;
};
