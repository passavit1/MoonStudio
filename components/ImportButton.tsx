"use client";

import { useState, useEffect } from "react";
import { Upload, Loader2, CheckCircle, AlertCircle, X, Trash2 } from "lucide-react";

interface ProgressUpdate {
  currentFile: string;
  processedCount: number;
  totalCount: number;
  status: "processing" | "completed" | "failed";
  timestamp: number;
  processedFiles: string[];
  pendingFiles: string[];
  error?: string;
}

// API to cancel sync
async function cancelSync() {
  try {
    const response = await fetch("/api/import-tiktok/cancel", { method: "POST" });
    if (!response.ok) throw new Error("Failed to cancel sync");
    console.log("[ImportButton] Cancel request sent");
  } catch (error) {
    console.error("[ImportButton] Error sending cancel:", error);
  }
}

// API to reset database
async function resetDatabase() {
  try {
    const response = await fetch("/api/reset-db", { method: "POST" });
    const data = await response.json();
    if (data.success) {
      console.log("[ImportButton] Database reset successful");
      window.location.reload();
    } else {
      throw new Error(data.error || "Failed to reset database");
    }
  } catch (error) {
    console.error("[ImportButton] Reset error:", error);
    alert("Failed to reset database: " + (error as any).message);
  }
}

export function ImportButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleImport = async () => {
    setLoading(true);
    setStatus(null);
    setShowModal(true);

    console.log("[ImportButton] Starting import...");

    // Set initial progress state
    setProgress({
      currentFile: "",
      processedCount: 0,
      totalCount: 0,
      status: "processing",
      timestamp: Date.now(),
      processedFiles: [],
      pendingFiles: [],
    });

    // Start the import request FIRST
    console.log("[ImportButton] Sending import request...");
    (async () => {
      try {
        const response = await fetch("/api/import-tiktok", { method: "POST" });
        const data = await response.json();

        console.log("[ImportButton] Import response:", data);

        if (data.success) {
          setStatus({ type: "success", message: data.message });
          // Refresh page after 2s to show new data
          setTimeout(() => window.location.reload(), 2000);
        } else {
          setStatus({ type: "error", message: data.error || "Import failed" });
        }
      } catch (error) {
        console.error("[ImportButton] Import error:", error);
        setStatus({ type: "error", message: "Failed to connect to the server" });
      } finally {
        setLoading(false);
      }
    })();

    // Poll for progress updates every 500ms
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch("/api/import-tiktok/progress");
        const data = (await response.json()) as ProgressUpdate;

        console.log("[ImportButton] Progress poll:", {
          file: data.currentFile,
          processed: data.processedCount,
          total: data.totalCount,
          status: data.status,
        });

        setProgress(data);

        // Stop polling when sync is done
        if (data.status === "completed" || data.status === "failed") {
          console.log("[ImportButton] Sync complete, stopping poll");
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error("[ImportButton] Error polling progress:", error);
      }
    }, 500);
  };

  const closeModal = () => {
    setShowModal(false);
    setProgress(null);
  };

  const progressPercent = progress
    ? Math.round((progress.processedCount / progress.totalCount) * 100)
    : 0;

  const handleReset = async () => {
    if (confirm("⚠️ This will delete ALL orders, items, and import history. Are you sure?")) {
      setResetting(true);
      await resetDatabase();
      setResetting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          onClick={handleImport}
          disabled={loading}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
          {loading ? "Importing..." : "Import TikTok Data"}
        </button>

        <button
          onClick={handleReset}
          disabled={resetting || loading}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          title="Reset database - delete all data"
        >
          {resetting ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
          {resetting ? "Resetting..." : "Reset DB"}
        </button>
      </div>

      {status && (
        <div
          className={`flex items-center gap-2 text-sm mt-1 ${
            status.type === "success" ? "text-green-500" : "text-red-500"
          }`}
        >
          {status.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {status.message}
        </div>
      )}

      {/* Progress Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Syncing TikTok Data</h2>
              <div className="flex gap-2">
                {progress?.status === "processing" && (
                  <button
                    onClick={() => {
                      cancelSync();
                    }}
                    className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded font-medium text-sm transition-colors"
                  >
                    Cancel
                  </button>
                )}
                {progress?.status !== "processing" && (
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>

            {progress ? (
              <div className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">Progress</span>
                    <span className="text-gray-500">
                      {progress.processedCount}/{progress.totalCount}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        progress.status === "completed"
                          ? "bg-green-500"
                          : progress.status === "failed"
                          ? "bg-red-500"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Current File */}
                {progress.currentFile && progress.status === "processing" && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin text-blue-600" size={16} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Processing...
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {progress.currentFile}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Processed Files */}
                {progress.processedFiles.length > 0 && (
                  <div className="max-h-32 overflow-y-auto">
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      Completed ({progress.processedFiles.length})
                    </p>
                    <div className="space-y-1">
                      {progress.processedFiles.map((file) => (
                        <div key={file} className="flex items-center gap-2 text-xs">
                          <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                          <span className="text-gray-600 truncate">{file}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Files (if any) */}
                {progress.pendingFiles.length > 0 && (
                  <div className="max-h-32 overflow-y-auto">
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      Pending ({progress.pendingFiles.length})
                    </p>
                    <div className="space-y-1">
                      {progress.pendingFiles.slice(0, 5).map((file) => (
                        <div key={file} className="flex items-center gap-2 text-xs">
                          <div className="w-3.5 h-3.5 rounded-full border border-gray-300" />
                          <span className="text-gray-500 truncate">{file}</span>
                        </div>
                      ))}
                      {progress.pendingFiles.length > 5 && (
                        <p className="text-xs text-gray-400 ml-5">
                          +{progress.pendingFiles.length - 5} more...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Completion States */}
                {progress.status === "completed" && (
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="text-green-600" size={16} />
                      <span className="text-sm font-medium text-green-900">
                        Import completed successfully!
                      </span>
                    </div>
                  </div>
                )}

                {progress.status === "failed" && (
                  <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900">Import failed</p>
                        {progress.error && (
                          <p className="text-xs text-red-700 mt-1">{progress.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-purple-600" size={32} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
