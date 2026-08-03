/**
 * roles.ts
 * --------
 * Tipos canónicos de roles tácticos usados en el motor de recomendación.
 * Si agregás un rol nuevo acá, también agregalo en operator-roles.json.
 */

// ─── Roles de Ataque ─────────────────────────────────────────────────────────

export const ATTACK_ROLES = [
  "hard-breach",   // Brecha dura: Thermite, Hibana, Ace, Maverick
  "soft-breach",   // Brecha blanda: Sledge, Buck, Fuze, Ram
  "entry-frag",    // Entrada agresiva: Ash, Zofia, Deimos, Buck
  "anti-gadget",   // Antidispositivos: Thatcher, Twitch, Brava, Flores
  "intel",         // Información: IQ, Dokkaebi, Zero, Lion, Deimos
  "zone-control",  // Control de zona: Gridlock, Capitão, Nomad, Sens
  "support",       // Soporte: Finka, Lion, Sens
] as const;

// ─── Roles de Defensa ────────────────────────────────────────────────────────

export const DEFENSE_ROLES = [
  "objective-anchor", // Ancla del objetivo: Smoke, Echo, Maestro, Doc
  "anti-gadget-def",  // Antidispositivos: Bandit, Kaid, Mute, Jäger
  "roamer",           // Roamer: Caveira, Vigil, Alibi, Oryx
  "intel-def",        // Información: Valkyrie, Mozzie, Pulse, Mira
  "trap-setter",      // Trampas: Lesion, Kapkan, Frost, Ela, Thorn
  "access-denial",    // Bloqueo de accesos: Castle, Aruni, Melusi, Azami, Mira
  "support-def",      // Soporte defensivo: Rook, Thunderbird
  "zone-deny",        // Negación de zona: Tachanka, Goyo, Fenrir
] as const;

export type AttackRole = (typeof ATTACK_ROLES)[number];
export type DefenseRole = (typeof DEFENSE_ROLES)[number];
export type TacticalRole = AttackRole | DefenseRole;

// ─── Etiquetas en español para mostrar en UI ─────────────────────────────────

export const ROLE_LABELS: Record<TacticalRole, string> = {
  "hard-breach":      "Brecha dura",
  "soft-breach":      "Brecha blanda",
  "entry-frag":       "Entry Fragger",
  "anti-gadget":      "Anti-gadget",
  "intel":            "Información",
  "zone-control":     "Control de zona",
  "support":          "Soporte",
  "objective-anchor": "Ancla del objetivo",
  "anti-gadget-def":  "Anti-gadget",
  "roamer":           "Roamer",
  "intel-def":        "Información",
  "trap-setter":      "Trampas",
  "access-denial":    "Bloqueo de accesos",
  "support-def":      "Soporte defensivo",
  "zone-deny":        "Negación de zona",
};

// ─── Tipos para el contexto de recomendación ─────────────────────────────────

export type SiteRequirements = {
  /** Roles tácticos que idealmente deben estar cubiertos en ataque */
  attack: AttackRole[];
  /** Roles tácticos que idealmente deben estar cubiertos en defensa */
  defense: DefenseRole[];
};
