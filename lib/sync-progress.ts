import fs from "fs";
import path from "path";

// Use a file to share state across Next.js route sandboxes (Turbopack isolates module globals)
const PROGRESS_FILE = path.join(process.cwd(), ".next", "sync-progress.json");

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

function readProgress(): ProgressUpdate | null {
  try {
    if (!fs.existsSync(PROGRESS_FILE)) return null;
    const raw = fs.readFileSync(PROGRESS_FILE, "utf-8");
    return JSON.parse(raw) as ProgressUpdate;
  } catch {
    return null;
  }
}

function writeProgress(p: ProgressUpdate) {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p), "utf-8");
  } catch (e) {
    console.error("[SyncProgress] Failed to write progress file:", e);
  }
}

function clearProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);
  } catch {}
}

// --- Cancel flag (also file-based for same reason) ---
const CANCEL_FILE = path.join(process.cwd(), ".next", "sync-cancel.flag");

export function cancelSync() {
  fs.writeFileSync(CANCEL_FILE, "1", "utf-8");
  console.log("[SyncProgress] Sync cancelled by user");
}

export function isSyncCancelled(): boolean {
  return fs.existsSync(CANCEL_FILE);
}

export function resetCancelFlag() {
  try {
    if (fs.existsSync(CANCEL_FILE)) fs.unlinkSync(CANCEL_FILE);
  } catch {}
}

// --- Progress API ---

export function initializeProgress(totalFiles: number, fileNames: string[]) {
  writeProgress({
    currentFile: "",
    processedCount: 0,
    totalCount: totalFiles,
    status: "processing",
    timestamp: Date.now(),
    processedFiles: [],
    pendingFiles: [...fileNames],
  });
  console.log("[SyncProgress] Initialized:", totalFiles, "files");
}

export function startFileProgress(fileName: string) {
  const p = readProgress();
  if (!p) return;
  p.currentFile = fileName;
  p.timestamp = Date.now();
  writeProgress(p);
  console.log("[SyncProgress] Starting file:", fileName);
}

export function updateProgress(fileName: string) {
  const p = readProgress();
  if (!p) return;
  p.currentFile = "";
  p.processedCount++;
  p.processedFiles.push(fileName);
  p.pendingFiles = p.pendingFiles.filter((f) => f !== fileName);
  p.timestamp = Date.now();
  writeProgress(p);
  console.log("[SyncProgress] Completed file:", fileName, `(${p.processedCount}/${p.totalCount})`);
}

export function completeProgress() {
  const p = readProgress();
  if (!p) return;
  p.status = "completed";
  p.currentFile = "";
  p.timestamp = Date.now();
  writeProgress(p);
  console.log("[SyncProgress] All done!");
  // Clear after 30s
  setTimeout(clearProgress, 30000);
}

export function failProgress(error: string) {
  const p = readProgress();
  if (!p) return;
  p.status = "failed";
  p.error = error;
  p.timestamp = Date.now();
  writeProgress(p);
  console.log("[SyncProgress] Failed:", error);
  setTimeout(clearProgress, 30000);
}

export function getProgress(): ProgressUpdate | null {
  return readProgress();
}
