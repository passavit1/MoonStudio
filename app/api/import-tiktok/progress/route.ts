import { getProgress, subscribe } from "@/lib/sync-progress";

export const dynamic = "force-dynamic";

export function GET() {
  const currentProgress = getProgress();

  // If no sync is in progress, return current state immediately
  if (!currentProgress || currentProgress.status !== "processing") {
    return new Response(
      JSON.stringify({
        currentFile: "",
        processedCount: 0,
        totalCount: 0,
        status: "idle",
        processedFiles: [],
        pendingFiles: [],
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      }
    );
  }

  // Stream progress updates via Server-Sent Events
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial progress
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify(currentProgress)}\n\n`
        )
      );

      // Subscribe to progress updates
      const unsubscribe = subscribe((progress) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(progress)}\n\n`)
          );

          // Close stream when completed or failed
          if (progress.status !== "processing") {
            setTimeout(() => controller.close(), 1000);
          }
        } catch (error) {
          console.error("Error streaming progress:", error);
          controller.close();
        }
      });

      // Handle client disconnect
      return () => {
        unsubscribe();
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
