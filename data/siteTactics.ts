/**
 * siteTactics.ts
 * --------------
 * Perfiles tácticos por mapa y sitio de bomba para Rainbow Six Siege.
 * Modela las necesidades situacionales de ataque, patrones defensivos observados,
 * rutas de ataque y contras tácticas.
 */

export type TacticalNeedId =
  | "hard-breach-primary"
  | "hard-breach-secondary"
  | "anti-breach-denial"
  | "utility-clear"
  | "vertical-from-above"
  | "vertical-from-below"
  | "roam-clear"
  | "flank-control"
  | "entry-control"
  | "execute-cover"
  | "plant-support"
  | "post-plant-control"
  | "entry-pressure";

export const TACTICAL_NEED_LABELS: Record<TacticalNeedId, string> = {
  "hard-breach-primary": "Brecha Dura Principal",
  "hard-breach-secondary": "Brecha Dura Secundaria / Escotillas",
  "anti-breach-denial": "Anti-Denial (Electricidad/Mute)",
  "utility-clear": "Destrucción de Utilidad / Escudos",
  "vertical-from-above": "Juego Vertical Superior",
  "vertical-from-below": "Juego Vertical Inferior",
  "roam-clear": "Limpieza de Roamers / Caza",
  "flank-control": "Control de Flancos",
  "entry-control": "Control de Puertas y Cruces",
  "execute-cover": "Cobertura de Ejecución (Humos/Flash)",
  "plant-support": "Soporte de Plantado",
  "post-plant-control": "Post-Plantado",
  "entry-pressure": "Presión de Entrada",
};

export const NEED_OPERATORS_MAP: Record<TacticalNeedId, string[]> = {
  "hard-breach-primary": ["Thermite", "Ace", "Hibana", "Maverick"],
  "hard-breach-secondary": ["Hibana", "Maverick", "Ace", "Thermite"],
  "anti-breach-denial": ["Thatcher", "Kali", "Maverick", "Twitch", "Flores", "Zero", "Brava", "Buck"],
  "utility-clear": ["Zofia", "Ash", "Flores", "Twitch", "Brava", "Kali", "Zero", "Fuze"],
  "vertical-from-above": ["Ram", "Buck", "Sledge", "Zofia", "Ash", "Fuze"],
  "vertical-from-below": ["Buck", "Ram", "Ash", "Zofia", "Zero", "IQ", "Flores"],
  "roam-clear": ["Jackal", "Deimos", "Dokkaebi", "Lion", "Iana", "Grim"],
  "flank-control": ["Nomad", "Gridlock", "Zero", "Grim"],
  "entry-control": ["Gridlock", "Nomad", "Grim", "Rauora", "Capitao", "Ying", "Sens", "Osa"],
  "execute-cover": ["Ying", "Sens", "Capitao", "Osa", "Montagne", "Blitz"],
  "plant-support": ["Montagne", "Osa", "Gridlock", "Capitao", "Sens", "Ying", "Nomad"],
  "post-plant-control": ["Gridlock", "Capitao", "Nomad", "Zero", "Twitch"],
  "entry-pressure": ["Ash", "Zofia", "Iana", "Buck", "Ram", "Ying", "Blitz"],
};

export type DefensivePattern = {
  id: string;
  name: string;
  likelihood: "common" | "situational" | "rare";
  createsNeeds: TacticalNeedId[];
  counters: string[];
};

export type AttackRoute = {
  id: string;
  name: string;
  style: "direct" | "vertical" | "split" | "execute" | "roam-clear";
  requiredNeeds: TacticalNeedId[];
  usefulNeeds: TacticalNeedId[];
  description: string;
};

export type AttackSiteProfile = {
  mapId: string;
  siteId: string;
  displayName: string;
  defaultNeeds: {
    required: TacticalNeedId[];
    important: TacticalNeedId[];
    optional: TacticalNeedId[];
  };
  commonDefenses: DefensivePattern[];
  attackRoutes: AttackRoute[];
};

// ─── BANCO DE PERFILES DE SITIOS COMPETITIVOS ──────────────────────────────────

export const SITE_PROFILES: Record<string, AttackSiteProfile[]> = {
  clubhouse: [
    {
      mapId: "clubhouse",
      siteId: "cctv-cash",
      displayName: "CCTV / Dinero",
      defaultNeeds: {
        required: ["hard-breach-primary", "anti-breach-denial"],
        important: ["utility-clear", "entry-pressure", "plant-support"],
        optional: ["flank-control", "execute-cover"],
      },
      commonDefenses: [
        {
          id: "main-wall-denial",
          name: "Pared principal reforzada con Kaid/Bandit",
          likelihood: "common",
          createsNeeds: ["anti-breach-denial", "hard-breach-primary"],
          counters: ["Thatcher", "Kali", "Maverick", "Twitch", "Buck"],
        },
        {
          id: "rafters-control",
          name: "Escudo/Defensa fuerte en Rafters (Garaje)",
          likelihood: "common",
          createsNeeds: ["utility-clear", "entry-pressure"],
          counters: ["Zofia", "Ash", "Flores", "Capitao", "Ying"],
        },
        {
          id: "roamer-downstairs",
          name: "Roamer extendido en Bar / Construcción",
          likelihood: "situational",
          createsNeeds: ["roam-clear", "flank-control"],
          counters: ["Dokkaebi", "Jackal", "Deimos", "Nomad"],
        },
      ],
      attackRoutes: [
        {
          id: "main-wall-direct",
          name: "Apertura Directa de Pared CCTV",
          style: "direct",
          requiredNeeds: ["hard-breach-primary", "anti-breach-denial"],
          usefulNeeds: ["utility-clear", "plant-support", "execute-cover"],
          description: "Abrir brecha principal exterior, limpiar rafters y plantar en CCTV.",
        },
        {
          id: "garage-clear",
          name: "Toma de Garaje y Presión Rafters",
          style: "split",
          requiredNeeds: ["utility-clear", "entry-pressure"],
          usefulNeeds: ["flank-control", "execute-cover"],
          description: "Avanzar por garaje para desalojar rafters antes de abrir la brecha.",
        },
        {
          id: "vertical-cash",
          name: "Presión Vertical desde Construcción",
          style: "vertical",
          requiredNeeds: ["vertical-from-below", "anti-breach-denial"],
          usefulNeeds: ["hard-breach-primary", "entry-pressure"],
          description: "Romper piso de bar/construcción para eliminar la negación de pared desde abajo.",
        },
      ],
    },
    {
      mapId: "clubhouse",
      siteId: "church-arsenal",
      displayName: "Iglesia / Armería",
      defaultNeeds: {
        required: ["hard-breach-secondary", "vertical-from-above"],
        important: ["utility-clear", "anti-breach-denial", "entry-pressure"],
        optional: ["plant-support", "roam-clear"],
      },
      commonDefenses: [
        {
          id: "hatch-denial",
          name: "Escotillas de cocina/cocineta electrificadas",
          likelihood: "common",
          createsNeeds: ["anti-breach-denial", "vertical-from-above"],
          counters: ["Thatcher", "Buck", "Ram", "Maverick"],
        },
        {
          id: "dirt-tunnel-hold",
          name: "Ancla fuerte en Túnel de Tierra",
          likelihood: "common",
          createsNeeds: ["utility-clear", "entry-pressure"],
          counters: ["Ash", "Zofia", "Flores", "Ying"],
        },
      ],
      attackRoutes: [
        {
          id: "kitchen-hatches",
          name: "Control de Piso Superior y Escotillas",
          style: "vertical",
          requiredNeeds: ["vertical-from-above", "hard-breach-secondary"],
          usefulNeeds: ["anti-breach-denial", "plant-support"],
          description: "Asegurar Cocina y Bar, abrir escotillas principales y presionar sitio desde arriba.",
        },
        {
          id: "dirt-tunnel-push",
          name: "Presión por Túnel de Tierra / Escaleras Azules",
          style: "direct",
          requiredNeeds: ["entry-pressure", "utility-clear"],
          usefulNeeds: ["flank-control", "execute-cover"],
          description: "Avanzar agresivamente por túnel de tierra para dividir la atención de la iglesia.",
        },
      ],
    },
    {
      mapId: "clubhouse",
      siteId: "gym-bedroom",
      displayName: "Gimnasio / Dormitorio",
      defaultNeeds: {
        required: ["hard-breach-primary"],
        important: ["entry-pressure", "utility-clear", "flank-control"],
        optional: ["plant-support", "roam-clear"],
      },
      commonDefenses: [
        {
          id: "balcony-denial",
          name: "Control de Pared de Gimnasio / Balcón",
          likelihood: "common",
          createsNeeds: ["hard-breach-primary", "anti-breach-denial"],
          counters: ["Ace", "Thermite", "Thatcher", "Kali"],
        },
      ],
      attackRoutes: [
        {
          id: "gym-wall-push",
          name: "Brecha Directa en Balcón de Gimnasio",
          style: "direct",
          requiredNeeds: ["hard-breach-primary", "anti-breach-denial"],
          usefulNeeds: ["utility-clear", "execute-cover"],
          description: "Tomar balcón, abrir pared de gimnasio y ejecutar plantado protegido.",
        },
      ],
    },
  ],

  chalet: [
    {
      mapId: "chalet",
      siteId: "wine-snowmobile",
      displayName: "Cava de Vino / Moto de Nieve",
      defaultNeeds: {
        required: ["hard-breach-primary", "anti-breach-denial"],
        important: ["vertical-from-above", "utility-clear", "flank-control"],
        optional: ["plant-support", "roam-clear"],
      },
      commonDefenses: [
        {
          id: "garage-wall-denial",
          name: "Pared principal de Garaje electrificada (Kaid/Bandit)",
          likelihood: "common",
          createsNeeds: ["anti-breach-denial", "hard-breach-primary"],
          counters: ["Thatcher", "Kali", "Buck", "Ram"],
        },
        {
          id: "main-stairs-roam",
          name: "Roamer en Gran Salón / Escaleras Principales",
          likelihood: "common",
          createsNeeds: ["roam-clear", "vertical-from-above"],
          counters: ["Dokkaebi", "Jackal", "Deimos", "Buck"],
        },
      ],
      attackRoutes: [
        {
          id: "snowmobile-direct",
          name: "Apertura Directa de Garaje Exterior",
          style: "direct",
          requiredNeeds: ["hard-breach-primary", "anti-breach-denial"],
          usefulNeeds: ["plant-support", "execute-cover"],
          description: "Limpiar denial exterior o verticalmente y abrir pared grande de moto de nieve.",
        },
        {
          id: "kitchen-vertical",
          name: "Presión Vertical desde Cocina",
          style: "vertical",
          requiredNeeds: ["vertical-from-above", "utility-clear"],
          usefulNeeds: ["anti-breach-denial", "roam-clear"],
          description: "Limpiar piso de arriba y abrir suelo de cocina para despejar vino y negación de pared.",
        },
      ],
    },
    {
      mapId: "chalet",
      siteId: "main-bedroom",
      displayName: "Dormitorio Principal / Piano",
      defaultNeeds: {
        required: ["hard-breach-primary", "entry-pressure"],
        important: ["flank-control", "utility-clear"],
        optional: ["execute-cover", "plant-support"],
      },
      commonDefenses: [
        {
          id: "solarium-hold",
          name: "Control agresivo de Solarium / Balcón",
          likelihood: "common",
          createsNeeds: ["entry-pressure", "flank-control"],
          counters: ["Nomad", "Gridlock", "Zofia", "Ash"],
        },
      ],
      attackRoutes: [
        {
          id: "solarium-bedroom",
          name: "Toma de Solarium y Balcón Principal",
          style: "direct",
          requiredNeeds: ["entry-pressure", "hard-breach-primary"],
          usefulNeeds: ["flank-control", "execute-cover"],
          description: "Avanzar por balcón superior, abrir pared de dormitorio y asegurar plantado.",
        },
      ],
    },
  ],

  bank: [
    {
      mapId: "bank",
      siteId: "lockers-vault",
      displayName: "Taquillas / Bóveda",
      defaultNeeds: {
        required: ["hard-breach-primary", "vertical-from-above"],
        important: ["anti-breach-denial", "roam-clear", "utility-clear"],
        optional: ["plant-support", "flank-control"],
      },
      commonDefenses: [
        {
          id: "hatch-heavy-hold",
          name: "Defensa basada en escotillas de PB y roamer en vestíbulo",
          likelihood: "common",
          createsNeeds: ["vertical-from-above", "roam-clear"],
          counters: ["Ram", "Buck", "Hibana", "Jackal"],
        },
      ],
      attackRoutes: [
        {
          id: "ground-floor-vertical",
          name: "Limpieza de Planta Baja y Escotillas",
          style: "vertical",
          requiredNeeds: ["vertical-from-above", "hard-breach-primary"],
          usefulNeeds: ["roam-clear", "anti-breach-denial"],
          description: "Dominar planta baja, abrir escotillas clave de bóveda y presionar sitio desde arriba.",
        },
      ],
    },
  ],

  oregon: [
    {
      mapId: "oregon",
      siteId: "laundry-supply",
      displayName: "Lavandería / Suministros",
      defaultNeeds: {
        required: ["hard-breach-secondary", "vertical-from-above"],
        important: ["anti-breach-denial", "utility-clear", "entry-pressure"],
        optional: ["flank-control", "plant-support"],
      },
      commonDefenses: [
        {
          id: "hatch-electric-hold",
          name: "Escotilla principal y pared de lavandería con Kaid",
          likelihood: "common",
          createsNeeds: ["anti-breach-denial", "hard-breach-secondary"],
          counters: ["Thatcher", "Kali", "Maverick", "Buck"],
        },
        {
          id: "freezer-bunker-hold",
          name: "Ancla agresivo en Bunker / Congelador",
          likelihood: "common",
          createsNeeds: ["utility-clear", "entry-pressure"],
          counters: ["Ash", "Zofia", "Flores", "Ying"],
        },
      ],
      attackRoutes: [
        {
          id: "hatch-vertical-clear",
          name: "Control de Cocina y Apertura de Escotillas",
          style: "vertical",
          requiredNeeds: ["vertical-from-above", "hard-breach-secondary"],
          usefulNeeds: ["anti-breach-denial", "plant-support"],
          description: "Limpiar planta baja, abrir escotillas de lavandería y congelador para coordinar la caída.",
        },
        {
          id: "bunker-push",
          name: "Presión por Bunker y Torres",
          style: "direct",
          requiredNeeds: ["entry-pressure", "utility-clear"],
          usefulNeeds: ["flank-control", "execute-cover"],
          description: "Avance directo por bunker para desalojar rotaciones bajas.",
        },
      ],
    },
    {
      mapId: "oregon",
      siteId: "kids-dorm",
      displayName: "Cuarto de Niños / Dormitorios",
      defaultNeeds: {
        required: ["hard-breach-primary", "entry-pressure"],
        important: ["utility-clear", "flank-control"],
        optional: ["execute-cover", "plant-support"],
      },
      commonDefenses: [
        {
          id: "attic-control",
          name: "Dominio defensivo del Ático",
          likelihood: "common",
          createsNeeds: ["entry-pressure", "utility-clear"],
          counters: ["Zofia", "Ash", "Buck", "Ying"],
        },
      ],
      attackRoutes: [
        {
          id: "attic-dorm-push",
          name: "Toma de Ático y Balcón",
          style: "direct",
          requiredNeeds: ["hard-breach-primary", "entry-pressure"],
          usefulNeeds: ["utility-clear", "flank-control"],
          description: "Limpiar ático, abrir brecha principal de dormitorios y aislar rotación de armero.",
        },
      ],
    },
  ],
};

// ─── HELPER: Buscar Perfil de Sitio por Mapa y Nombre de Sitio ────────────────

export function getAttackSiteProfile(
  matchMap: string,
  siteName: string
): AttackSiteProfile | null {
  const mapKey = matchMap.trim().toLowerCase().replace(/\s+/g, "_");
  const profiles = SITE_PROFILES[mapKey] || [];

  if (!siteName) return profiles[0] || null;

  const aliases: Record<string, string> = {
    arsenal: "armeria",
    armoury: "armeria",
    cash: "dinero",
    cava: "bodega",
    snowmobile: "motonieve",
    moto: "motonieve",
    niños: "infantil",
    ninos: "infantil",
    kids: "infantil",
  };
  const ignored = new Set(["sala", "salon", "oficina", "de", "del", "la", "el", "principal", "cuarto"]);
  const tokens = (value: string) => value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((token) => token.replace(/s$/, ""))
    .filter((token) => !ignored.has(token))
    .map((token) => aliases[token] || token);
  const targetTokens = new Set(tokens(siteName));

  const ranked = profiles
    .map((profile) => {
      const profileTokens = new Set([...tokens(profile.displayName), ...tokens(profile.siteId)]);
      const shared = Array.from(profileTokens).filter((token) => targetTokens.has(token)).length;
      const score = shared / Math.max(1, Math.min(profileTokens.size, targetTokens.size));
      return { profile, shared, score };
    })
    .sort((a, b) => b.score - a.score || b.shared - a.shared);

  const best = ranked[0];
  return best && (best.shared >= 2 || best.score >= 0.6) ? best.profile : null;
}
