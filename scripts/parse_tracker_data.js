import fs from "fs";
import path from "path";
import { parseTrackerText } from "../data/trackerParser.ts";

/**
 * Script de soporte para procesar archivos de estadísticas crudas de Tracker en la terminal.
 */
function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.log("Uso: node scripts/parse_tracker_data.js <ruta-al-archivo-txt>");
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`El archivo ${absolutePath} no existe.`);
    process.exit(1);
  }

  const rawContent = fs.readFileSync(absolutePath, "utf-8");
  const parsed = parseTrackerText(rawContent);

  console.log("=== RESULTADO DEL PARSEO ===");
  console.log(JSON.stringify(parsed, null, 2));
}

main();
