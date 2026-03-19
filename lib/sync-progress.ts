// Global state to track sync progress across requests
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

let currentProgress: ProgressUpdate | null = null;
let subscribers: Set<(progress: ProgressUpdate) => void> = new Set();
let isCancelled = false;

export function cancelSync() {
  isCancelled = true;
  console.log("[SyncProgress] Sync cancelled by user");
}

export function isSyncCancelled(): boolean {
  return isCancelled;
}

export function resetCancelFlag() {
  isCancelled = false;
}

export function initializeProgress(totalFiles: number, fileNames: string[]) {
  currentProgress = {
    currentFile: "",
    processedCount: 0,
    totalCount: totalFiles,
    status: "processing",
    timestamp: Date.now(),
    processedFiles: [],
    pendingFiles: [...fileNames],
    error: undefined,
  };
  notifySubscribers();
}

export function updateProgress(fileName: string) {
  if (!currentProgress) return;

  currentProgress.currentFile = fileName;
  currentProgress.processedCount++;
  currentProgress.processedFiles.push(fileName);
  currentProgress.pendingFiles = currentProgress.pendingFiles.filter(
    (f) => f !== fileName
  );
  currentProgress.timestamp = Date.now();

  notifySubscribers();
}

export function completeProgress() {
  if (!currentProgress) return;

  currentProgress.status = "completed";
  currentProgress.currentFile = "";
  currentProgress.timestamp = Date.now();

  notifySubscribers();

  // Clear progress after 5 seconds
  setTimeout(() => {
    currentProgress = null;
    subscribers.clear();
  }, 5000);
}

export function failProgress(error: string) {
  if (!currentProgress) return;

  currentProgress.status = "failed";
  currentProgress.error = error;
  currentProgress.timestamp = Date.now();

  notifySubscribers();

  // Clear progress after 5 seconds
  setTimeout(() => {
    currentProgress = null;
    subscribers.clear();
  }, 5000);
}

export function getProgress(): ProgressUpdate | null {
  return currentProgress;
}

export function subscribe(callback: (progress: ProgressUpdate) => void) {
  subscribers.add(callback);
  if (currentProgress) {
    callback(currentProgress);
  }
  return () => subscribers.delete(callback);
}

function notifySubscribers() {
  if (!currentProgress) return;
  subscribers.forEach((callback) => callback(currentProgress!));
}
