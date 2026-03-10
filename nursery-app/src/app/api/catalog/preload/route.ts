import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { parseExcelBuffer } from "@/lib/excel/reader";

const CATALOG_FILE = "price_botanik_spring_2026.xlsx";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", CATALOG_FILE);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: `Файл ${CATALOG_FILE} не найден в public/` },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);
    const result = parseExcelBuffer(fileBuffer.buffer as ArrayBuffer);

    return NextResponse.json({
      plants: result.plants,
      imported_rows: result.imported_rows,
      total_rows: result.total_rows,
      warnings: result.warnings,
    });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
