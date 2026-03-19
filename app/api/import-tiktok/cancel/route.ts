import { NextResponse } from "next/server";
import { cancelSync } from "@/lib/sync-progress";

export async function POST() {
  try {
    cancelSync();
    console.log("[CancelAPI] Sync cancellation requested");

    return NextResponse.json({
      success: true,
      message: "Sync cancellation requested. The sync will stop at the next checkpoint.",
    });
  } catch (error: any) {
    console.error("Cancel error:", error);
    return NextResponse.json(
      { error: "Failed to cancel sync: " + error.message },
      { status: 500 }
    );
  }
}
