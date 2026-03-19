import { getProgress, subscribe } from "@/lib/sync-progress";

export const dynamic = "force-dynamic";

export function GET() {
  const currentProgress = getProgress();

  console.log("[ProgressAPI] GET request - current status:", currentProgress?.status || "idle");

  // Stream progress updates via Server-Sent Events
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial progress (or idle state)
      const initialState = currentProgress || {
        currentFile: "",
        processedCount: 0,
        totalCount: 0,
        status: "idle",
        timestamp: Date.now(),
        processedFiles: [],
        pendingFiles: [],
      };

      console.log("[ProgressAPI] Sending initial state:", initialState.status);
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialState)}\n\n`));

      // If no sync in progress, close immediately
      if (!currentProgress || currentProgress.status !== "processing") {
        console.log("[ProgressAPI] No active sync, closing stream");
        setTimeout(() => controller.close(), 100);
        return;
      }

      // Subscribe to progress updates
      const unsubscribe = subscribe((progress) => {
        try {
          console.log("[ProgressAPI] Streaming progress:", {
            file: progress.currentFile,
            processed: progress.processedCount,
            status: progress.status,
          });
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(progress)}\n\n`));

          // Close stream when completed or failed
          if (progress.status !== "processing") {
            console.log("[ProgressAPI] Sync finished, closing stream");
            setTimeout(() => controller.close(), 500);
          }
        } catch (error) {
          console.error("[ProgressAPI] Error streaming progress:", error);
          controller.close();
        }
      });

      // Handle client disconnect
      return () => {
        console.log("[ProgressAPI] Client disconnected");
        unsubscribe();
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
