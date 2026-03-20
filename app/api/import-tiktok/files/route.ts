import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export function GET() {
  const tiktokDir = path.join(process.cwd(), "data", "tiktok");
  const externalDir = path.join(process.cwd(), "data", "external");

  let files: string[] = [];

  // Get TikTok files
  const tiktokFiles = fs
    .readdirSync(tiktokDir)
    .filter((f) => f.endsWith(".csv") || f.endsWith(".xlsx"))
    .sort();

  files = [...files, ...tiktokFiles];

  // Get external files
  if (fs.existsSync(externalDir)) {
    const externalFiles = fs
      .readdirSync(externalDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => `[External] ${f}`)
      .sort();

    files = [...files, ...externalFiles];
  }

  return NextResponse.json({ files });
}
