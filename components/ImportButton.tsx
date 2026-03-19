"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, CheckCircle, Clock, X, Trash2, AlertCircle } from "lucide-react";

type FileStatus = "pending" | "processing" | "done";

interface ProgressUpdate {
  currentFile: string;
  processedCount: number;
  totalCount: number;
  status: "processing" | "completed" | "failed" | "idle";
  processedFiles: string[];
  error?: string;
}

async function fetchFileList(): Promise<string[]> {
  const res = await fetch("/api/import-tiktok/files");
  const data = await res.json();
  return data.files as string[];
}

async function cancelSync() {
  await fetch("/api/import-tiktok/cancel", { method: "POST" });
}

async function resetDatabase() {
  const res = await fetch("/api/reset-db", { method: "POST" });
  const data = await res.json();
  if (data.success) {
    window.location.reload();
  } else {
    alert("Failed to reset database: " + (data.error || "Unknown error"));
  }
}

export function ImportButton() {
  const [syncing, setSyncing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const [fileStatuses, setFileStatuses] = useState<Record<string, FileStatus>>({});
  const [syncStatus, setSyncStatus] = useState<"idle" | "processing" | "completed" | "failed">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingRef = useRef(false);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    pollingRef.current = false;
  };

  const handleImport = async () => {
    setSyncing(true);
    setShowModal(true);
    setErrorMsg(null);
    setSyncStatus("idle");
    stopPolling();

    // 1. Load file list AND start sync at the same time
    let fileList: string[] = [];
    try {
      [fileList] = await Promise.all([
        fetchFileList(),
        fetch("/api/import-tiktok", { method: "POST" }).catch(() => {}),
      ]);
    } catch {
      setErrorMsg("ไม่สามารถโหลดรายชื่อไฟล์ได้");
      setSyncing(false);
      return;
    }

    setFiles(fileList);
    const initial: Record<string, FileStatus> = {};
    fileList.forEach((f) => (initial[f] = "pending"));
    setFileStatuses(initial);
    setSyncStatus("processing");

    // 2. Poll progress every 300ms — skip if previous still running
    pollRef.current = setInterval(async () => {
      if (pollingRef.current) return;
      pollingRef.current = true;
      try {
        const res = await fetch("/api/import-tiktok/progress");
        const data = (await res.json()) as ProgressUpdate;

        // Always update file statuses from whatever data we have
        if (data.processedFiles.length > 0 || data.currentFile) {
          setFileStatuses((prev) => {
            const updated = { ...prev };
            data.processedFiles.forEach((f) => {
              if (updated[f] !== undefined) updated[f] = "done";
            });
            if (data.currentFile && updated[data.currentFile] !== undefined) {
              updated[data.currentFile] = "processing";
            }
            return updated;
          });
        }

        if (data.status === "completed") {
          stopPolling();
          // Mark ALL files as done (in case we missed intermediate states)
          setFileStatuses((prev) => {
            const updated = { ...prev };
            Object.keys(updated).forEach((f) => (updated[f] = "done"));
            return updated;
          });
          setSyncStatus("completed");
          setSyncing(false);
          setTimeout(() => window.location.reload(), 2000);
        } else if (data.status === "failed") {
          stopPolling();
          setSyncStatus("failed");
          setErrorMsg(data.error || "Import failed");
          setSyncing(false);
        }
      } catch {
        // network error — keep polling
      } finally {
        pollingRef.current = false;
      }
    }, 300);
  };

  const handleClose = () => {
    setShowModal(false);
    stopPolling();
  };

  const handleReset = async () => {
    if (!confirm("⚠️ This will delete ALL orders, items, and import history. Are you sure?")) return;
    setResetting(true);
    await resetDatabase();
    setResetting(false);
  };

  const doneCount = Object.values(fileStatuses).filter((s) => s === "done").length;
  const total = files.length;
  const progressPercent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          onClick={handleImport}
          disabled={syncing}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {syncing ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
          {syncing ? "Importing..." : "Import TikTok Data"}
        </button>

        <button
          onClick={handleReset}
          disabled={resetting || syncing}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          title="Reset database"
        >
          {resetting ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
          {resetting ? "Resetting..." : "Reset DB"}
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 max-h-[80vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Syncing TikTok Data</h2>
              <div className="flex gap-2">
                {syncStatus === "processing" && (
                  <button
                    onClick={cancelSync}
                    className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                )}
                {syncStatus !== "processing" && (
                  <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            {total > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 font-medium">
                    {syncStatus === "completed" ? "เสร็จสิ้น" :
                     syncStatus === "failed" ? "ล้มเหลว" : "กำลังนำเข้า..."}
                  </span>
                  <span className="text-gray-500">{doneCount}/{total} ไฟล์</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      syncStatus === "completed" ? "bg-green-500" :
                      syncStatus === "failed" ? "bg-red-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* File list */}
            <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
              {files.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-purple-600" size={28} />
                </div>
              ) : (
                files.map((file) => {
                  const status = fileStatuses[file] ?? "pending";
                  return (
                    <div key={file} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-gray-50">
                      {status === "done" && (
                        <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                      )}
                      {status === "processing" && (
                        <Loader2 size={18} className="animate-spin text-blue-500 flex-shrink-0" />
                      )}
                      {status === "pending" && (
                        <Clock size={18} className="text-gray-300 flex-shrink-0" />
                      )}
                      <span className={`text-sm truncate ${
                        status === "done" ? "text-gray-500 line-through" :
                        status === "processing" ? "text-blue-700 font-medium" :
                        "text-gray-600"
                      }`}>
                        {file}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Status messages */}
            {syncStatus === "completed" && (
              <div className="mt-4 flex items-center gap-2 bg-green-50 text-green-800 rounded-lg px-3 py-2 text-sm">
                <CheckCircle size={16} />
                นำเข้าข้อมูลเสร็จสิ้น! กำลังรีโหลด...
              </div>
            )}
            {syncStatus === "failed" && errorMsg && (
              <div className="mt-4 flex items-start gap-2 bg-red-50 text-red-800 rounded-lg px-3 py-2 text-sm">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
