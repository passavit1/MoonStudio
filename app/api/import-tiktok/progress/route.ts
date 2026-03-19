import { getProgress } from "@/lib/sync-progress";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const currentProgress = getProgress();

  const response = currentProgress || {
    currentFile: "",
    processedCount: 0,
    totalCount: 0,
    status: "idle",
    timestamp: Date.now(),
    processedFiles: [],
    pendingFiles: [],
  };

  console.log("[ProgressAPI] Status:", response.status, "| File:", response.currentFile);

  return NextResponse.json(response);
}
