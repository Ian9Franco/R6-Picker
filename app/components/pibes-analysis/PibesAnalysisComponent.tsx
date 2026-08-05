"use client";

import React from "react";
import { User, Shield, Swords, MapPin, Award, Flame, Lightbulb, Target } from "lucide-react";

export function PibesAnalysisComponent() {
  const pibes = [
    {
      id: "el_notorious",
      name: "El_Notorious",
      color: "border-amber-500/30 bg-amber-500/5 text-amber-400",
      badge: "Flex Utilitario / Intel Fragger",
      summary: "Flex agresivo y adaptable. Destaca en frags defensivos, roaming e información activa. En ataque rinde mejor de 2nd entry o intel fragger.",
      identityAtk: ["Kali", "Thatcher", "Ash"],
      identityDef: ["Kaid", "Valkyrie", "Vigil"],
      comfortAtk: ["Thermite", "Ying", "Ace", "Ram", "Iana"],
      comfortDef: ["Mute", "Bandit", "Fenrir", "Pulse", "Mozzie"],
      avoidAtk: ["Deimos"],
      avoidDef: ["Caveira"],
      bestWrAtk: "Maverick (55.9% | 34 PJ), Nomad (54.5%), Capitão (56.5%), Ash (50.7%)",
      bestWrDef: "Rook (75.0%), Mozzie (68.8%), Castle (68.6%), Jäger (67.2%), Vigil (59.7%)",
      bestKdAtk: "Brava (1.62 K/D), Ram (1.53 K/D), Deimos (1.50 K/D), Ash (1.49 K/D), Kali (1.46 K/D)",
      bestKdDef: "Pulse (1.91 K/D), Caveira (1.60 K/D), Vigil (1.49 K/D), Fenrir (1.39 K/D), Valkyrie (1.37 K/D)",
      top5Atk: [
        { name: "Ash", stats: "134 PJ | 50.7% WR | 1.49 K/D", desc: "Entry letal y máxima efectividad en duelos" },
        { name: "Kali", stats: "222 PJ | 47.3% WR | 1.46 K/D", desc: "Icono personal de frag y despeje a distancia" },
        { name: "Brava", stats: "50 PJ | 50.0% WR | 1.62 K/D", desc: "Su K/D ofensivo más elevado y control de aparatos" },
        { name: "Thermite", stats: "209 PJ | 45.0% WR | 1.19 K/D", desc: "Hard breacher de respaldo manteniendo K/D > 1.15" },
        { name: "Maverick", stats: "34 PJ | 55.9% WR | 1.04 K/D", desc: "Su mayor tasa de victorias en brecha quirúrgica" },
      ],
      top5Def: [
        { name: "Vigil", stats: "196 PJ | 59.7% WR | 1.49 K/D", desc: "Roamer por excelencia con casi 60% WR" },
        { name: "Valkyrie", stats: "250 PJ | 58.8% WR | 1.37 K/D", desc: "Intel activa y frags letales en 250 partidas" },
        { name: "Mute", stats: "285 PJ | 58.2% WR | 1.10 K/D", desc: "Bloqueo de intel y brecha altamente consistente" },
        { name: "Bandit", stats: "247 PJ | 57.9% WR | 1.17 K/D", desc: "Anti-brecha dinámico con 57.9% WR" },
        { name: "Kaid", stats: "408 PJ | 53.4% WR | 1.21 K/D", desc: "El más jugado del perfil con solidez probada" },
      ],
      topMaps: [
        { name: "Bank", stats: "57.7% WR | 1.31 K/D (52 PJ)" },
        { name: "Chalet", stats: "56.9% WR | 1.25 K/D (72 PJ)" },
        { name: "Kanal", stats: "54.1% WR | 1.36 K/D (37 PJ)" },
      ]
    },
    {
      id: "chango_nocturno",
      name: "ChangoNocturno",
      color: "border-cyan-500/30 bg-cyan-500/5 text-cyan-400",
      badge: "Hard Support / Utility Anchor",
      summary: "Soporte estructural y ancla defensiva. Paciente, metódico y ordenado. Absorbe brechas duras y denegaciones pesadas.",
      identityAtk: ["Thermite", "Thatcher", "Fuze"],
      identityDef: ["Tubarão", "Thorn", "Kapkan"],
      comfortAtk: ["Ace", "Gridlock", "Blitz"],
      comfortDef: ["Mute", "Bandit", "Kaid", "Frost", "Tachanka", "Ela"],
      avoidAtk: ["Ash", "Amaru", "Nøkk", "Hibana"],
      avoidDef: ["Caveira", "Oryx", "Vigil"],
      bestWrAtk: "Brava (62.5%), Finka (54.5%), Hibana (53.1%), Lion (50.6%), Ace (47.5%)",
      bestWrDef: "Ela (71.1%), Rook (68.8%), Tachanka (63.2%), Frost (61.1%), Kapkan (58.9%), Tubarão (56.3%)",
      bestKdAtk: "Fuze (1.05 K/D), Lion (0.95 K/D), Hibana (0.94 K/D), Blitz (0.88 K/D), Ace (0.85 K/D)",
      bestKdDef: "Tubarão (1.25 K/D), Kapkan (1.15 K/D), Ela (1.00 K/D), Thorn (0.98 K/D), Mute (0.98 K/D)",
      top5Atk: [
        { name: "Fuze", stats: "126 PJ | 46.8% WR | 1.05 K/D", desc: "Su único atacante frecuente con K/D > 1.0" },
        { name: "Thermite", stats: "461 PJ | 45.8% WR | 0.74 K/D", desc: "Pilar estructural indiscutible con 461 partidas" },
        { name: "Lion", stats: "89 PJ | 50.6% WR | 0.95 K/D", desc: "Control global que fija al rival durante el plantado" },
        { name: "Blitz", stats: "195 PJ | 45.6% WR | 0.88 K/D", desc: "Presión frontal pesada en agresiones coordinadas" },
        { name: "Ace", stats: "141 PJ | 47.5% WR | 0.85 K/D", desc: "Brecha dura remota más ágil con mejor K/D" },
      ],
      top5Def: [
        { name: "Thorn", stats: "316 PJ | 56.0% WR | 0.98 K/D", desc: "Especialista en trampas insignia con más de 300 PJ" },
        { name: "Tubarão", stats: "167 PJ | 56.3% WR | 1.25 K/D", desc: "Su mejor K/D defensivo (1.25) frenando pushes" },
        { name: "Kapkan", stats: "95 PJ | 58.9% WR | 1.15 K/D", desc: "Su defensor más letal con trampas y 58.9% WR" },
        { name: "Mute", stats: "193 PJ | 56.0% WR | 0.98 K/D", desc: "Ancla y denegación de intel altamente constante" },
        { name: "Bandit", stats: "357 PJ | 51.3% WR | 0.92 K/D", desc: "Paredes electrificadas con la mayor muestra defensiva" },
      ],
      topMaps: [
        { name: "Outback", stats: "65.5% WR | 1.06 K/D (29 PJ)" },
        { name: "Nighthaven Labs", stats: "57.1% WR | 0.92 K/D (21 PJ)" },
        { name: "Theme Park", stats: "50.0% WR | 1.04 K/D (22 PJ)" },
      ]
    },
    {
      id: "azusa_cooper09",
      name: "AzusaCooper09",
      color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
      badge: "Frontline Support / Objective Anchor",
      summary: "Soporte de primera línea protegida (escudos) y ancla de sitio. Absorbe presión y asegura coberturas sin sobre-exponerse.",
      identityAtk: ["Montagne", "Blitz", "Thermite"],
      identityDef: ["Mute", "Tachanka", "Thorn"],
      comfortAtk: ["Thatcher", "Fuze", "Lion", "Dokkaebi", "Twitch"],
      comfortDef: ["Kaid", "Bandit", "Kapkan", "Smoke", "Castle", "Valkyrie", "Melusi"],
      avoidAtk: ["Ash", "Buck"],
      avoidDef: ["Caveira", "Oryx"],
      bestWrAtk: "Ram (66.7% | 18 PJ), Lion (50.8%), Thermite (48.7%), Iana (48.7%), Jackal (48.1%)",
      bestWrDef: "Caveira (69.6%), Valkyrie (62.8%), Castle (60.4%), Melusi (60.0%), Mute (58.6%), Smoke (58.6%)",
      bestKdAtk: "Ram (1.20 K/D), Twitch (1.13 K/D), Brava (0.93 K/D), Dokkaebi (0.87 K/D), Kali (0.87 K/D)",
      bestKdDef: "Rook (1.05 K/D), Aruni (1.00 K/D), Bandit (0.96 K/D), Kapkan (0.92 K/D), Thorn (0.86 K/D)",
      top5Atk: [
        { name: "Ram", stats: "18 PJ | 66.7% WR | 1.20 K/D", desc: "Desempeño estelar en brecha blanda y verticalidad" },
        { name: "Dokkaebi", stats: "90 PJ | 47.8% WR | 0.87 K/D", desc: "Presión de intel activa con llamadas y hackeo" },
        { name: "Thatcher", stats: "156 PJ | 46.8% WR | 0.67 K/D", desc: "Soporte desactivador para habilitar aperturas" },
        { name: "Lion", stats: "59 PJ | 50.8% WR | 0.80 K/D", desc: "Control global de movimiento en ejecución de ronda" },
        { name: "Blitz / Montagne", stats: "Blitz 200PJ / Montagne 206PJ", desc: "Absorción de espacio frontal con escudos" },
      ],
      top5Def: [
        { name: "Bandit", stats: "154 PJ | 53.9% WR | 0.96 K/D", desc: "Su defensor más balanceado entre pared y K/D" },
        { name: "Mute", stats: "186 PJ | 58.6% WR | 0.70 K/D", desc: "Su pick #1 defensivo en victorias (58.6% WR)" },
        { name: "Thorn", stats: "155 PJ | 55.5% WR | 0.86 K/D", desc: "Trampas y daño en accesos con 55.5% WR" },
        { name: "Kapkan", stats: "95 PJ | 57.4% WR | 0.92 K/D", desc: "Daño pasivo en entradas con casi 58% WR" },
        { name: "Smoke / Castle", stats: "Smoke 58.6% WR / Castle 60.4%", desc: "Denegación de tiempo y remodelación de sitio" },
      ],
      topMaps: [
        { name: "Outback", stats: "59.3% WR | 0.77 K/D (27 PJ)" },
        { name: "Calypso Casino", stats: "58.8% WR | 0.74 K/D (17 PJ)" },
        { name: "Chalet", stats: "55.2% WR | 0.75 K/D (58 PJ)" },
      ]
    }
  ];

  return (
    <div className="space-y-8 p-6 text-slate-100 font-sans max-w-7xl mx-auto">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Award className="w-7 h-7 text-amber-400" />
          Resumen & Análisis de Lógica de Cada Pibe
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Componente de referencia para evaluar perfiles tácticos, picks preferidos, 5 mejores reales (Ataque/Defensa), mejores mapas y optimización del Modo Partido.
        </p>
      </header>

      {/* Grid de Pibes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {pibes.map((pibe) => (
          <div key={pibe.id} className={`rounded-xl border p-5 flex flex-col justify-between ${pibe.color}`}>
            <div>
              <div className="flex items-center justify-between border-b border-slate-700/50 pb-3 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {pibe.name}
                  </h2>
                  <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold mt-1 inline-block">
                    {pibe.badge}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 mb-4 italic leading-relaxed">
                "{pibe.summary}"
              </p>

              {/* Picks Resumen */}
              <div className="space-y-2 text-xs bg-slate-950/60 p-3 rounded-lg border border-slate-800/60 mb-4">
                <div>
                  <span className="font-semibold text-amber-300">Identity ATK:</span> {pibe.identityAtk.join(", ")}
                </div>
                <div>
                  <span className="font-semibold text-cyan-300">Identity DEF:</span> {pibe.identityDef.join(", ")}
                </div>
                <div>
                  <span className="font-semibold text-slate-300">Comfort ATK:</span> {pibe.comfortAtk.join(", ")}
                </div>
                <div>
                  <span className="font-semibold text-slate-300">Comfort DEF:</span> {pibe.comfortDef.join(", ")}
                </div>
              </div>

              {/* Best Stats */}
              <div className="space-y-2 text-xs bg-slate-900/80 p-3 rounded-lg border border-slate-800 mb-4">
                <div className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> Mejor WR:
                </div>
                <p className="text-slate-300 text-[11px]">ATK: {pibe.bestWrAtk}</p>
                <p className="text-slate-300 text-[11px]">DEF: {pibe.bestWrDef}</p>

                <div className="text-cyan-400 font-semibold flex items-center gap-1 mt-2">
                  <Target className="w-3.5 h-3.5" /> Mejor K/D:
                </div>
                <p className="text-slate-300 text-[11px]">ATK: {pibe.bestKdAtk}</p>
                <p className="text-slate-300 text-[11px]">DEF: {pibe.bestKdDef}</p>
              </div>

              {/* Top 5 Reales ATK */}
              <div className="mb-4">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                  <Swords className="w-4 h-4" /> Top 5 Reales Ataque:
                </h3>
                <ul className="space-y-1.5 text-xs">
                  {pibe.top5Atk.map((op, i) => (
                    <li key={i} className="bg-slate-950/40 p-2 rounded border border-slate-800/40">
                      <div className="flex justify-between font-semibold text-white">
                        <span>{i + 1}. {op.name}</span>
                        <span className="text-amber-300 text-[11px]">{op.stats}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{op.desc}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Top 5 Reales DEF */}
              <div className="mb-4">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                  <Shield className="w-4 h-4" /> Top 5 Reales Defensa:
                </h3>
                <ul className="space-y-1.5 text-xs">
                  {pibe.top5Def.map((op, i) => (
                    <li key={i} className="bg-slate-950/40 p-2 rounded border border-slate-800/40">
                      <div className="flex justify-between font-semibold text-white">
                        <span>{i + 1}. {op.name}</span>
                        <span className="text-cyan-300 text-[11px]">{op.stats}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{op.desc}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Top 3 Maps */}
              <div>
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                  <MapPin className="w-4 h-4" /> Top 3 Mejores Mapas:
                </h3>
                <div className="space-y-1 text-xs">
                  {pibe.topMaps.map((m, i) => (
                    <div key={i} className="flex justify-between bg-slate-900/60 p-1.5 rounded border border-slate-800/40">
                      <span className="font-medium text-slate-200">{i + 1}. {m.name}</span>
                      <span className="text-emerald-300 font-mono text-[11px]">{m.stats}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sugerencias para el modo partido */}
      <section className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          Claves de Análisis para Mejorar el Modo Partido (`ActiveMatch`)
        </h2>
        <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside leading-relaxed">
          <li>
            <strong className="text-white">Liberar a El_Notorious:</strong> Evitar forzarlo siempre a Hard Support. Sus datos reales demuestran que gana significativamente más partidas jugándolo de intel fragger o roamer (Vigil, Valkyrie, Ash, Brava).
          </li>
          <li>
            <strong className="text-white">Aprovechar los Picks letales de ChangoNocturno:</strong> En defensa, Tubarão (1.25 K/D) y Kapkan (1.15 K/D, 58.9% WR) superan con creces su rendimiento en otros soportes pasivos.
          </li>
          <li>
            <strong className="text-white">Desatar a Ram en AzusaCooper09:</strong> Posee un 66.7% WR y 1.20 K/D con Ram en ataque. Debe ser recomendado prioritariamente en sitios verticales.
          </li>
        </ul>
      </section>
    </div>
  );
}
