import villaPlaybookRaw from "./villa-site-playbook.json";
import themeParkPlaybookRaw from "./theme-park-site-playbook.json";
import { type Side } from "./catalog";
import { type TacticalRole } from "./roles";

export type PlaybookStrategy = "primary" | "safe" | "breathing";
export type PlaybookSquadSize = "duo" | "trio";

export type SuggestedSitePick = {
  operator: string;
  priority: "core" | "safe" | "alternate";
  task: string;
};

export type SiteSidePlaybook = {
  doctrine: string;
  objective: string;
  approach: string[];
  keyAreas: string[];
  requiredRoles: TacticalRole[];
  avoid: string[];
  suggestedPicks: SuggestedSitePick[];
  lineups: Record<PlaybookSquadSize, Record<PlaybookStrategy, string[]>>;
  banLineups?: Record<string, Record<PlaybookSquadSize, string[]>>;
};

export type SitePlaybook = {
  id: string;
  name: string;
  aliases: string[];
  floor: string;
  attack: SiteSidePlaybook;
  defense: SiteSidePlaybook;
};

type MapPlaybook = {
  version: string;
  map: string;
  sites: SitePlaybook[];
};

const PLAYBOOKS: MapPlaybook[] = [
  villaPlaybookRaw as MapPlaybook,
  themeParkPlaybookRaw as MapPlaybook,
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(room|sala|salon|de|del|la|el)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function getSitePlaybook(mapName?: string, siteName?: string): SitePlaybook | undefined {
  if (!mapName || !siteName) return undefined;
  const map = PLAYBOOKS.find((candidate) => normalize(candidate.map) === normalize(mapName));
  if (!map) return undefined;
  const target = normalize(siteName);
  return map.sites.find((site) =>
    [site.name, ...site.aliases].some((candidate) => {
      const key = normalize(candidate);
      return key === target || key.includes(target) || target.includes(key);
    })
  );
}

export function getSiteSidePlaybook(
  mapName: string | undefined,
  siteName: string | undefined,
  side: Side
): SiteSidePlaybook | undefined {
  return getSitePlaybook(mapName, siteName)?.[side];
}

export function getPlaybookLineup(
  mapName: string | undefined,
  siteName: string | undefined,
  side: Side,
  count: number,
  strategy: PlaybookStrategy,
  availableOperatorNames?: string[]
): string[] | undefined {
  const plan = getSiteSidePlaybook(mapName, siteName, side);
  if (!plan) return undefined;
  const size: PlaybookSquadSize = count <= 2 ? "duo" : "trio";
  if (strategy === "primary" && plan.banLineups && availableOperatorNames) {
    const available = new Set(availableOperatorNames.map(normalize));
    const bannedOverride = Object.entries(plan.banLineups).find(([operator]) => !available.has(normalize(operator)));
    if (bannedOverride) return bannedOverride[1][size];
  }
  return plan.lineups[size][strategy];
}

export function getPlaybookOperatorTask(
  plan: SiteSidePlaybook | undefined,
  operatorName: string
): string | undefined {
  const key = normalize(operatorName);
  return plan?.suggestedPicks.find((pick) => normalize(pick.operator) === key)?.task;
}
