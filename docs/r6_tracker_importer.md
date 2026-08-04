# R6 Tracker Statistics Importer & Parser

## Overview
Due to the absence of a public API for Rainbow Six Siege on Tracker Network, this tool allows semi-automated import of operator map performance statistics directly from the R6 Tracker desktop application or web interface.

## Supported Data Format

### Formatted Header Block (Recommended)

```text
JUGADOR: El_Notorious
BANDO: Ataque
OPERADOR: Zofia
PLAYLIST: Ranked
PERÍODO: Y9S3 y posteriores

Coastline\t42\t54.8%\t23\t19\t1.31\t48.2%\t0.63
Chalet\t38\t47.4%\t18\t20\t1.18\t45.0%\t0.58
```

### Table Columns Expected
1. **Map Name** (e.g. `Coastline`, `Chalet`, `Clubhouse`)
2. **Matches / Rounds** (e.g. `42`)
3. **Winrate %** (e.g. `54.8%`)
4. **Wins** (e.g. `23`)
5. **Losses** (e.g. `19`)
6. **K/D** (e.g. `1.31`)
7. **Headshot %** (e.g. `48.2%`)
8. **KPR** (Optional)

## Features
- **Auto-Detection**: Recognizes metadata tags (`JUGADOR`, `BANDO`, `OPERADOR`, `PLAYLIST`, `PERÍODO`).
- **Flexible Parsing**: Supports tab-separated table copying as well as line-by-line R6 Tracker text copy.
- **App Storage**: Saves stats in local storage for tactical recommendation calculations.
- **Exporting**: Allows one-click copying of normalized JSON objects for `data/player-map-operators.json`.
