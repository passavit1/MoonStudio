import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export function GET() {
  const dataDir = path.join(process.cwd(), "data", "tiktok");
  const files = fs
    .readdirSync(dataDir)
    .filter((f) => f.endsWith(".csv") || f.endsWith(".xlsx"))
    .sort();

  return NextResponse.json({ files });
}
