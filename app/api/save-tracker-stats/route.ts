import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getMapDetails } from "@/data/trackerParser";

const IMPORTS_DIR = path.join(process.cwd(), "data", "imports");

function ensureImportsDir() {
  if (!fs.existsSync(IMPORTS_DIR)) {
    fs.mkdirSync(IMPORTS_DIR, { recursive: true });
  }
}

function normalizeMapEntry(m: any) {
  const rawName = m.trackerName || m.mapName || m.displayName || "";
  const details = getMapDetails(rawName);
  return {
    ...m,
    mapId: m.mapId || details.mapId,
    trackerName: m.trackerName || details.trackerName,
    displayName: details.displayName,
    mapName: m.mapName || details.trackerName,
  };
}

export async function GET() {
  try {
    ensureImportsDir();
    const files = fs.readdirSync(IMPORTS_DIR).filter((f) => f.endsWith(".json"));

    const result: Record<string, any> = {};
    for (const file of files) {
      try {
        const fullPath = path.join(IMPORTS_DIR, file);
        const content = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
        
        // Normalizar los mapas existentes
        let hasChanges = false;
        if (Array.isArray(content.maps)) {
          const normalizedMaps = content.maps.map((m: any) => {
            const norm = normalizeMapEntry(m);
            if (!m.mapId || !m.displayName || !m.trackerName) {
              hasChanges = true;
            }
            return norm;
          });
          content.maps = normalizedMaps;

          // Si el archivo en disco no tenía la nueva estructura, guardarlo actualizado
          if (hasChanges) {
            fs.writeFileSync(fullPath, JSON.stringify(content, null, 2), "utf-8");
          }
        }

        const key = file.replace(/\.json$/, "");
        result[key] = { ...content, fileName: file };
      } catch (e) {
        console.error(`Error leyendo ${file}:`, e);
      }
    }

    return NextResponse.json({ success: true, imports: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al listar archivos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    ensureImportsDir();
    const body = await req.json();
    const { player, side, operator, playlist, period, maps } = body;

    if (!player || !side || !operator || !maps) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const pibeId = player.toLowerCase().replace(/\s+/g, "_");
    const opClean = operator.toLowerCase().replace(/\s+/g, "_");
    const fileName = `${pibeId}_${side}_${opClean}.json`;
    const filePath = path.join(IMPORTS_DIR, fileName);

    const normalizedMaps = Array.isArray(maps) ? maps.map(normalizeMapEntry) : [];

    const fileContent = {
      player,
      playerId: pibeId,
      side,
      operator,
      playlist: playlist || "Ranked",
      period: period || "Y9S3 y posteriores",
      updatedAt: new Date().toISOString(),
      maps: normalizedMaps,
    };

    fs.writeFileSync(filePath, JSON.stringify(fileContent, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      fileName,
      message: `Archivo creado exitosamente: data/imports/${fileName}`,
    });
  } catch (error: any) {
    console.error("Error al crear archivo físico:", error);
    return NextResponse.json({ error: error.message || "Error al escribir en disco" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    ensureImportsDir();
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get("fileName");

    if (!fileName) {
      return NextResponse.json({ error: "Falta el nombre de archivo" }, { status: 400 });
    }

    const filePath = path.join(IMPORTS_DIR, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return NextResponse.json({ success: true, message: `Archivo ${fileName} eliminado.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al eliminar archivo" }, { status: 500 });
  }
}
