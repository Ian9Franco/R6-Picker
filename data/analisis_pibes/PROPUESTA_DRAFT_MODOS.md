# 🎮 PROPUESTA DE MODOS DE DRAFT Y RECOMENDACIÓN POR PIBE (EXPANDIDA A 7 PICKS)

Este documento detalla la estructura lógica de los **3 Modos de Draft** propuestos para el algoritmo del **Modo Partido (`ActiveMatch`)**, expandidos a **7 picks por bando (7 Ataque / 7 Defensa)** en Draft Seguro y Experimental, y un pool de **14 operadores (70/70)** en Draft Principal.

---

## 🎯 DEFINICIÓN DE LOS 3 MODOS DE DRAFT

1. **🛡️ DRAFT SEGURO (Safe Draft - Top 7 Reales):**
   * **Lógica:** Prioridad **máxima y exclusiva** a los 7 Operadores Reales de mayor rendimiento de cada jugador (basados en volumen, Win Rate y K/D comprobado).
   * **Objetivo:** Asegurar composiciones de confort máximo para partidos de alto riesgo o definitorios.

2. **🧪 MODO EXPERIMENTAL (Experimental Mode - Top 7 Similares Exclusivos):**
   * **Lógica:** **Exclusión total (0%)** de los 7 Operadores Reales de cada jugador.
   * **Objetivo:** Recomendar **7 picks de rol/estilo similar** que el jugador ya haya jugado (**Partidas jugadas > 0**), evitando patrones repetitivos sin caer en operadores jamás jugados.

3. **⚖️ DRAFT PRINCIPAL (Main Draft - Pool Integrado de 14 Operadores):**
   * **Lógica:** Pool integrado **70% Top 7 Reales + 70% Similares (7 Fijos + 7 Similares = 14 Operadores por bando)**.
   * **REGLA DE ORO:** **Exclusión estricta de operadores con 0 partidas jugadas (PJ = 0)**. Todos los operadores del pool deben tener experiencia previa demostrada en Tracker.

---

## 📋 SUGERENCIAS EXPANDIDAS DE OPERADORES POR PIBE (7 ATAQUE / 7 DEFENSA)

### 🟢 1. EL_NOTORIOUS (`el_notorious`)
* **Perfil:** Flex Utilitario / Intel Fragger

```
+-------------------+---------------------------------------------+---------------------------------------------+
| MODO              | 💥 ATAQUE (7 OPERADORES)                     | 🛡️ DEFENSA (7 OPERADORES)                    |
+-------------------+---------------------------------------------+---------------------------------------------+
| DRAFT SEGURO      | 1. Ash (134 PJ | 50.7% WR | 1.49 KD)        | 1. Vigil (196 PJ | 59.7% WR | 1.49 KD)       |
| (Top 7 Reales)    | 2. Kali (222 PJ | 47.3% WR | 1.46 KD)       | 2. Valkyrie (250 PJ | 58.8% WR | 1.37 KD)    |
|                   | 3. Brava (50 PJ | 50.0% WR | 1.62 KD)       | 3. Kaid (408 PJ | 53.4% WR | 1.21 KD)        |
|                   | 4. Thermite (209 PJ | 45.0% WR | 1.19 KD)    | 4. Bandit (247 PJ | 57.9% WR | 1.17 KD)      |
|                   | 5. Maverick (34 PJ | 55.9% WR | 1.04 KD)    | 5. Mute (285 PJ | 58.2% WR | 1.10 KD)        |
|                   | 6. Ying (194 PJ | 45.4% WR | 1.12 KD)       | 6. Fenrir (174 PJ | 52.9% WR | 1.39 KD)     |
|                   | 7. Thatcher (328 PJ | 44.2% WR | 0.99 KD)    | 7. Pulse (48 PJ | 52.1% WR | 1.91 KD)       |
+-------------------+---------------------------------------------+---------------------------------------------+
| EXPERIMENTAL      | 1. Ram (46 PJ | 47.8% WR | 1.53 KD)         | 1. Rook (28 PJ | 75.0% WR | 1.26 KD)        |
| (Excluye Top 7,   | 2. IQ (58 PJ | 50.0% WR | 1.23 KD)          | 2. Smoke (68 PJ | 54.4% WR | 1.26 KD)       |
| >0 PJ, Similares) | 3. Fuze (88 PJ | 50.0% WR | 1.05 KD)         | 3. Maestro (90 PJ | 52.2% WR | 1.23 KD)     |
|                   | 4. Iana (42 PJ | 47.6% WR | 1.31 KD)        | 4. Castle (35 PJ | 68.6% WR | 1.17 KD)      |
|                   | 5. Ace (289 PJ | 43.6% WR | 0.87 KD)        | 5. Mozzie (32 PJ | 68.8% WR | 1.19 KD)      |
|                   | 6. Nomad (22 PJ | 54.5% WR | 1.13 KD)       | 6. Doc (7 PJ | 71.4% WR | 1.80 KD)         |
|                   | 7. Sledge (57 PJ | 40.4% WR | 1.25 KD)      | 7. Caveira (34 PJ | 61.8% WR | 1.60 KD)     |
+-------------------+---------------------------------------------+---------------------------------------------+
| DRAFT PRINCIPAL   | POOL DE 14 OPERADORES (50/50):              | POOL DE 14 OPERADORES (50/50):              |
| (Pool 14,         | • Ash, Kali, Brava, Thermite, Maverick,     | • Vigil, Valkyrie, Kaid, Bandit, Mute,      |
|  PJ > 0 siempre)  |   Ying, Thatcher                            |   Fenrir, Pulse                             |
|                   | • Ram, IQ, Fuze, Iana, Ace, Nomad, Sledge   | • Rook, Smoke, Maestro, Castle, Mozzie,     |
|                   |                                             |   Doc, Caveira                              |
+-------------------+---------------------------------------------+---------------------------------------------+
```

---

### 🔵 2. CHANGONOCTURENO (`chango_nocturno`)
* **Perfil:** Hard Support / Utility Anchor

```
+-------------------+---------------------------------------------+---------------------------------------------+
| MODO              | 💥 ATAQUE (7 OPERADORES)                     | 🛡️ DEFENSA (7 OPERADORES)                    |
+-------------------+---------------------------------------------+---------------------------------------------+
| DRAFT SEGURO      | 1. Fuze (126 PJ | 46.8% WR | 1.05 KD)       | 1. Thorn (316 PJ | 56.0% WR | 0.98 KD)       |
| (Top 7 Reales)    | 2. Thermite (461 PJ | 45.8% WR | 0.74 KD)    | 2. Tubarão (167 PJ | 56.3% WR | 1.25 KD)     |
|                   | 3. Lion (89 PJ | 50.6% WR | 0.95 KD)        | 3. Kapkan (95 PJ | 58.9% WR | 1.15 KD)       |
|                   | 4. Blitz (195 PJ | 45.6% WR | 0.88 KD)       | 4. Mute (193 PJ | 56.0% WR | 0.98 KD)        |
|                   | 5. Ace (141 PJ | 47.5% WR | 0.85 KD)         | 5. Bandit (357 PJ | 51.3% WR | 0.92 KD)      |
|                   | 6. Thatcher (241 PJ | 40.7% WR | 0.75 KD)    | 6. Ela (45 PJ | 71.1% WR | 1.00 KD)         |
|                   | 7. Hibana (49 PJ | 53.1% WR | 0.94 KD)      | 7. Frost (54 PJ | 61.1% WR | 0.97 KD)       |
+-------------------+---------------------------------------------+---------------------------------------------+
| EXPERIMENTAL      | 1. Gridlock (136 PJ | 44.1% WR | 0.76 KD)   | 1. Kaid (151 PJ | 53.0% WR | 0.65 KD)       |
| (Excluye Top 7,   | 2. Dokkaebi (67 PJ | 41.8% WR | 0.77 KD)    | 2. Mira (46 PJ | 52.2% WR | 0.83 KD)        |
| >0 PJ, Similares) | 3. Brava (16 PJ | 62.5% WR | 0.67 KD)       | 3. Maestro (93 PJ | 54.8% WR | 0.66 KD)      |
|                   | 4. Ying (71 PJ | 35.2% WR | 0.77 KD)        | 4. Alibi (18 PJ | 61.1% WR | 0.91 KD)       |
|                   | 5. Nomad (50 PJ | 42.0% WR | 0.57 KD)       | 5. Rook (16 PJ | 68.8% WR | 0.83 KD)        |
|                   | 6. Capitão (117 PJ | 41.9% WR | 0.47 KD)     | 6. Tachanka (76 PJ | 63.2% WR | 0.45 KD)     |
|                   | 7. Twitch (6 PJ | 33.3% WR | 1.25 KD)       | 7. Wamai (35 PJ | 51.4% WR | 0.57 KD)       |
+-------------------+---------------------------------------------+---------------------------------------------+
| DRAFT PRINCIPAL   | POOL DE 14 OPERADORES (50/50):              | POOL DE 14 OPERADORES (50/50):              |
| (Pool 14,         | • Fuze, Thermite, Lion, Blitz, Ace,         | • Thorn, Tubarão, Kapkan, Mute, Bandit,     |
|  PJ > 0 siempre)  |   Thatcher, Hibana                          |   Ela, Frost                                |
|                   | • Gridlock, Dokkaebi, Brava, Ying, Nomad,   | • Kaid, Mira, Maestro, Alibi, Rook,         |
|                   |   Capitão, Twitch                           |   Tachanka, Wamai                           |
+-------------------+---------------------------------------------+---------------------------------------------+
```

---

### 🟡 3. AZUSACOOPER09 (`azusa_cooper09`)
* **Perfil:** Frontline Support / Objective Anchor

```
+-------------------+---------------------------------------------+---------------------------------------------+
| MODO              | 💥 ATAQUE (7 OPERADORES)                     | 🛡️ DEFENSA (7 OPERADORES)                    |
+-------------------+---------------------------------------------+---------------------------------------------+
| DRAFT SEGURO      | 1. Ram (18 PJ | 66.7% WR | 1.20 KD)         | 1. Bandit (154 PJ | 53.9% WR | 0.96 KD)      |
| (Top 7 Reales)    | 2. Dokkaebi (90 PJ | 47.8% WR | 0.87 KD)    | 2. Mute (186 PJ | 58.6% WR | 0.70 KD)        |
|                   | 3. Thatcher (156 PJ | 46.8% WR | 0.67 KD)    | 3. Thorn (155 PJ | 55.5% WR | 0.86 KD)       |
|                   | 4. Lion (59 PJ | 50.8% WR | 0.80 KD)        | 4. Kapkan (68 PJ | 57.4% WR | 0.92 KD)       |
|                   | 5. Blitz (200 PJ | 44.0% WR | 0.66 KD)       | 5. Smoke (58 PJ | 58.6% WR | 0.86 KD)        |
|                   | 6. Twitch (35 PJ | 45.7% WR | 1.13 KD)      | 6. Kaid (165 PJ | 53.9% WR | 0.66 KD)       |
|                   | 7. Brava (46 PJ | 47.8% WR | 0.93 KD)       | 7. Rook (31 PJ | 58.1% WR | 1.05 KD)        |
+-------------------+---------------------------------------------+---------------------------------------------+
| EXPERIMENTAL      | 1. Montagne (206 PJ | 43.2% WR | 0.35 KD)   | 1. Castle (48 PJ | 60.4% WR | 0.66 KD)      |
| (Excluye Top 7,   | 2. Thermite (117 PJ | 48.7% WR | 0.59 KD)   | 2. Melusi (45 PJ | 60.0% WR | 0.50 KD)      |
| >0 PJ, Similares) | 3. Fuze (136 PJ | 44.9% WR | 0.63 KD)       | 3. Ela (44 PJ | 59.1% WR | 0.72 KD)         |
|                   | 4. Iana (39 PJ | 48.7% WR | 0.72 KD)        | 4. Mira (60 PJ | 51.7% WR | 0.81 KD)        |
|                   | 5. Kali (34 PJ | 38.2% WR | 0.87 KD)        | 5. Tachanka (129 PJ | 55.8% WR | 0.58 KD)    |
|                   | 6. Finka (74 PJ | 41.9% WR | 0.64 KD)       | 6. Denari (62 PJ | 56.5% WR | 0.72 KD)      |
|                   | 7. Amaru (20 PJ | 40.0% WR | 0.88 KD)       | 7. Mozzie (57 PJ | 54.4% WR | 0.72 KD)      |
+-------------------+---------------------------------------------+---------------------------------------------+
| DRAFT PRINCIPAL   | POOL DE 14 OPERADORES (50/50):              | POOL DE 14 OPERADORES (50/50):              |
| (Pool 14,         | • Ram, Dokkaebi, Thatcher, Lion, Blitz,     | • Bandit, Mute, Thorn, Kapkan, Smoke,       |
|  PJ > 0 siempre)  |   Twitch, Brava                             |   Kaid, Rook                                |
|                   | • Montagne, Thermite, Fuze, Iana, Kali,     | • Castle, Melusi, Ela, Mira, Tachanka,      |
|                   |   Finka, Amaru                              |   Denari, Mozzie                            |
+-------------------+---------------------------------------------+---------------------------------------------+
```

---
