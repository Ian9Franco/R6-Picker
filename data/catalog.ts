export type Side = "attack" | "defense";

export type Operator = {
  name: string;
  side: Side;
  role: string;
  desc?: string;
};

export type BombSite = {
  floor: string;
  name: string;
};

export const rawAttackers: { name: string; role: string; desc?: string }[] = [
  // Brecha dura
  { name: "Thermite", role: "Brecha dura", desc: "Grandes aperturas en paredes reforzadas." },
  { name: "Hibana", role: "Brecha dura", desc: "Brecha remota y precisa en escotillas." },
  { name: "Maverick", role: "Brecha dura", desc: "Soplete silencioso y aperturas manuales." },
  { name: "Ace", role: "Brecha dura", desc: "Brecha reforzada a distancia." },

  // Brecha blanda
  { name: "Sledge", role: "Brecha blanda", desc: "Martillo para destrucción rápida." },
  { name: "Buck", role: "Brecha blanda", desc: "Escopeta inferior para juego vertical." },
  { name: "Ram", role: "Brecha blanda", desc: "Vehículo destructor de superficies." },
  { name: "Fuze", role: "Brecha blanda", desc: "Destrucción y desalojo con cargas de racimo." },

  // Entrada y combate
  { name: "Ash", role: "Entrada y combate", desc: "Entrada rápida y destrucción a distancia." },
  { name: "Zofia", role: "Entrada y combate", desc: "Entrada, explosivos y conmoción." },
  { name: "Amaru", role: "Entrada y combate", desc: "Acceso rápido por ventanas y balcones." },
  { name: "Nøkk", role: "Entrada y combate", desc: "Infiltración y aproximación sigilosa." },
  { name: "Blackbeard", role: "Entrada y combate", desc: "Combate frontal con protección personal." },
  { name: "Finka", role: "Entrada y combate", desc: "Mejora temporal para todo el equipo." },

  // Información y caza
  { name: "IQ", role: "Información", desc: "Detección de aparatos electrónicos." },
  { name: "Jackal", role: "Información", desc: "Seguimiento de huellas." },
  { name: "Dokkaebi", role: "Información", desc: "Llamadas telefónicas y acceso a cámaras." },
  { name: "Lion", role: "Información", desc: "Detección de movimiento." },
  { name: "Iana", role: "Información", desc: "Réplica holográfica para reconocimiento." },
  { name: "Zero", role: "Información", desc: "Cámaras perforantes." },
  { name: "Grim", role: "Información", desc: "Rastreo y control mediante enjambres." },
  { name: "Deimos", role: "Información", desc: "Seguimiento directo de defensores." },
  { name: "Solid Snake", role: "Información", desc: "Detección con Soliton Radar Mk. III." },

  // Antidispositivos
  { name: "Thatcher", role: "Antidispositivos", desc: "Pulsos EMP." },
  { name: "Twitch", role: "Antidispositivos", desc: "Drones eléctricos." },
  { name: "Kali", role: "Antidispositivos", desc: "Proyectiles explosivos antidispositivos." },
  { name: "Flores", role: "Antidispositivos", desc: "Drones explosivos." },
  { name: "Brava", role: "Antidispositivos", desc: "Hackeo y conversión de dispositivos." },

  // Control de zonas
  { name: "Capitão", role: "Control de zonas", desc: "Humo y fuego a distancia." },
  { name: "Nomad", role: "Control de zonas", desc: "Cargas que derriban defensores." },
  { name: "Gridlock", role: "Control de zonas", desc: "Púas para bloquear rutas." },
  { name: "Sens", role: "Control de zonas", desc: "Barreras visuales móviles." },
  { name: "Osa", role: "Control de zonas", desc: "Escudos transparentes desplegables." },
  { name: "Rauora", role: "Control de zonas", desc: "Paneles D.O.M. para controlar accesos." },

  // Escudos
  { name: "Montagne", role: "Escudos", desc: "Escudo extensible y protección." },
  { name: "Blitz", role: "Escudos", desc: "Escudo con destello en combate cercano." },

  // Ejecución
  { name: "Ying", role: "Ejecución", desc: "Proyectiles cegadores para entradas." },
  { name: "Glaz", role: "Ejecución", desc: "Visión térmica a través de humo." },

  // Flexible
  { name: "Striker", role: "Flexible", desc: "Combinación libre de dispositivos secundarios." },
];

export const rawDefenders: { name: string; role: string; desc?: string }[] = [
  // Anclas y apoyo
  { name: "Doc", role: "Anclas y apoyo", desc: "Curación y supervivencia." },
  { name: "Rook", role: "Anclas y apoyo", desc: "Protección y apoyo pasivo." },
  { name: "Smoke", role: "Anclas y apoyo", desc: "Bloqueo del objetivo y negación de plantado." },
  { name: "Tachanka", role: "Anclas y apoyo", desc: "Negación de zona con fuego." },
  { name: "Echo", role: "Anclas y apoyo", desc: "Vigilancia y bloqueo de plantado." },
  { name: "Maestro", role: "Anclas y apoyo", desc: "Cámaras, daño y control remoto." },
  { name: "Warden", role: "Anclas y apoyo", desc: "Resistencia a humo y cegadoras." },
  { name: "Clash", role: "Anclas y apoyo", desc: "Escudo, información y ralentización." },
  { name: "Thunderbird", role: "Anclas y apoyo", desc: "Curación de área." },
  { name: "Sentry", role: "Anclas y apoyo", desc: "Defensor flexible y apoyo secundario." },

  // Información
  { name: "Pulse", role: "Información", desc: "Detección a través de superficies." },
  { name: "Valkyrie", role: "Información", desc: "Cámaras adicionales." },
  { name: "Mira", role: "Información", desc: "Líneas de visión protegidas." },
  { name: "Mozzie", role: "Información", desc: "Captura drones atacantes." },
  { name: "Solis", role: "Información", desc: "Detección de dispositivos electrónicos." },
  { name: "Skopós", role: "Información", desc: "Control remoto de dos carcasas robóticas." },

  // Trampas
  { name: "Kapkan", role: "Trampas", desc: "Trampas explosivas en accesos." },
  { name: "Frost", role: "Trampas", desc: "Cepos incapacitantes." },
  { name: "Lesion", role: "Trampas", desc: "Minas venenosas y ralentización." },
  { name: "Ela", role: "Trampas", desc: "Minas de conmoción." },
  { name: "Goyo", role: "Trampas", desc: "Dispositivos incendiarios." },
  { name: "Thorn", role: "Trampas", desc: "Cargas explosivas de proximidad." },
  { name: "Fenrir", role: "Trampas", desc: "Minas de gas que limitan visión." },
  { name: "Denari", role: "Trampas", desc: "Redes de láser T.R.I.P." },

  // Bloqueo de accesos
  { name: "Castle", role: "Bloqueo de accesos", desc: "Barricadas reforzadas." },
  { name: "Melusi", role: "Bloqueo de accesos", desc: "Ralentización y aviso de proximidad." },
  { name: "Aruni", role: "Bloqueo de accesos", desc: "Puertas láser y remodelación." },
  { name: "Azami", role: "Bloqueo de accesos", desc: "Barreras Kiba para coberturas." },

  // Antidispositivos
  { name: "Mute", role: "Antidispositivos", desc: "Inhibe drones y dispositivos." },
  { name: "Bandit", role: "Antidispositivos", desc: "Electrifica paredes y alambres." },
  { name: "Kaid", role: "Antidispositivos", desc: "Electrifica paredes y escotillas." },
  { name: "Tubarão", role: "Antidispositivos", desc: "Congela y desactiva dispositivos." },
  { name: "Jäger", role: "Antidispositivos", desc: "Intercepta proyectiles." },
  { name: "Wamai", role: "Antidispositivos", desc: "Captura y desvía proyectiles." },

  // Roamers
  { name: "Caveira", role: "Roamers", desc: "Sigilo, interrogatorios e información." },
  { name: "Vigil", role: "Roamers", desc: "Ocultación frente a drones." },
  { name: "Alibi", role: "Roamers", desc: "Señuelos e identificación." },
  { name: "Oryx", role: "Roamers", desc: "Movilidad y embestidas verticales." },
];

export const attackers: Operator[] = rawAttackers.map((op) => ({
  ...op,
  side: "attack",
}));

export const defenders: Operator[] = rawDefenders.map((op) => ({
  ...op,
  side: "defense",
}));

export const operators: Operator[] = [...attackers, ...defenders];

export const maps = [
  "Bank", "Border", "Calypso Casino", "Chalet", "Clubhouse", "Coastline", "Consulate", "Emerald Plains", "Fortress", "Kafe Dostoyevsky", "Lair", "Nighthaven Labs", "Oregon", "Outback", "Stadium Bravo", "Stadium Alpha", "Close Quarter", "Favela", "Hereford Base", "House", "Kanal", "Presidential Plane", "Skyscraper", "Theme Park", "Tower", "Villa", "Yacht"
] as const;

export const mapBombSites: Record<string, BombSite[]> = {
  "Bank": [
    { floor: "2.º piso", name: "Salón ejecutivo / Oficina del director ejecutivo" },
    { floor: "1.er piso", name: "Sala del personal / Zona abierta" },
    { floor: "1.er piso", name: "Oficina de cajeros / Archivos" },
    { floor: "Sótano", name: "Taquillas / Sala de CCTV" }
  ],
  "Border": [
    { floor: "2.º piso", name: "Taquillas de la armería / Archivos" },
    { floor: "1.er piso", name: "Baño / Cajeros" },
    { floor: "1.er piso", name: "Sala de ventilación / Taller" },
    { floor: "1.er piso", name: "Inspección aduanera / Sala de suministros" }
  ],
  "Chalet": [
    { floor: "2.º piso", name: "Dormitorio principal / Oficina" },
    { floor: "1.er piso", name: "Bar / Sala de juegos" },
    { floor: "1.er piso", name: "Comedor / Cocina" },
    { floor: "Sótano", name: "Bodega de vinos / Garaje de motos de nieve" }
  ],
  "Clubhouse": [
    { floor: "2.º piso", name: "Sala de CCTV / Sala de dinero" },
    { floor: "2.º piso", name: "Gimnasio / Dormitorio principal" },
    { floor: "1.er piso", name: "Bar / Escenario" },
    { floor: "Sótano", name: "Iglesia / Sala de arsenal" }
  ],
  "Consulate": [
    { floor: "2.º piso", name: "Oficina del cónsul / Sala de reuniones" },
    { floor: "1.er piso", name: "Sala de exposiciones / Sala del piano" },
    { floor: "Sótano", name: "Cafetería / Garaje" }
  ],
  "Fortress": [
    { floor: "2.º piso", name: "Baño / Oficina del comandante" },
    { floor: "2.º piso", name: "Dormitorio / Sala de juegos" },
    { floor: "1.er piso", name: "Hammam / Sala de estar" },
    { floor: "1.er piso", name: "Sala de espera / Cafetería" }
  ],
  "Kafe Dostoyevsky": [
    { floor: "3.er piso", name: "Bar / Salón de cócteles" },
    { floor: "2.º piso", name: "Sala de lectura / Salón de la chimenea" },
    { floor: "2.º piso", name: "Sala de minería / Salón de la chimenea" },
    { floor: "1.er piso", name: "Servicio de cocina / Cocina" }
  ],
  "Lair": [
    { floor: "2.º piso", name: "Oficina principal / Sala R6" },
    { floor: "1.er piso", name: "Literas / Sala de reuniones informativas" },
    { floor: "Sótano", name: "Apoyo del laboratorio / Laboratorio" }
  ],
  "Nighthaven Labs": [
    { floor: "2.º piso", name: "Centro de mando / Sala de servidores" },
    { floor: "1.er piso", name: "Cocina / Cafetería" },
    { floor: "1.er piso", name: "Sala de control / Almacén" },
    { floor: "Sótano", name: "Montaje / Tanque" }
  ],
  "Emerald Plains": [
    { floor: "2.º piso", name: "Administración / Oficina del director ejecutivo" },
    { floor: "2.º piso", name: "Galería privada / Sala de reuniones" },
    { floor: "1.er piso", name: "Bar / Salón" },
    { floor: "1.er piso", name: "Comedor / Cocina" }
  ],
  "Coastline": [
    { floor: "2.º piso", name: "Salón de hookah / Sala de billar" },
    { floor: "2.º piso", name: "Ático / Teatro" },
    { floor: "1.er piso", name: "Cocina / Entrada de servicio" },
    { floor: "1.er piso", name: "Bar Azul / Bar Amanecer" }
  ],
  "Oregon": [
    { floor: "2.º piso", name: "Dormitorio infantil / Pasillo principal de dormitorios" },
    { floor: "1.er piso", name: "Cocina / Comedor" },
    { floor: "1.er piso", name: "Sala de reuniones / Cocina" },
    { floor: "Sótano", name: "Lavandería / Sala de suministros" }
  ],
  "Outback": [
    { floor: "2.º piso", name: "Lavandería / Sala de juegos" },
    { floor: "2.º piso", name: "Sala de fiestas / Oficina" },
    { floor: "1.er piso", name: "Sala de naturaleza / Sala Bushranger" },
    { floor: "1.er piso", name: "Sala del compresor / Almacén de equipamiento" }
  ],
  "Calypso Casino": [
    { floor: "2.º piso", name: "Sala de puros / Piscina" },
    { floor: "1.er piso", name: "Sala de póker / Blackjack" },
    { floor: "1.er piso", name: "Bar / Apuestas" },
    { floor: "Sótano", name: "Punto de control de la bóveda / CCTV" }
  ]
};

export const catalogMeta = {
  source: "Ubisoft Rainbow Six Siege",
  sourceUrl: "https://www.ubisoft.com/en-us/game/rainbow-six/siege/game-info",
  updatedAt: "2026-08-03",
};
