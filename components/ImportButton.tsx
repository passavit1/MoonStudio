"use client";

import { useState } from "react";
import { Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export function ImportButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleImport = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch("/api/import-tiktok", { method: "POST" });
      const data = await response.json();

      if (data.success) {
        setStatus({ type: "success", message: data.message });
        // Refresh page after 1.5s to show new data
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setStatus({ type: "error", message: data.error || "Import failed" });
      }
    } catch (error) {
      setStatus({ type: "error", message: "Failed to connect to the server" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleImport}
        disabled={loading}
        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
        {loading ? "Importing..." : "Import TikTok Data"}
      </button>

      {status && (
        <div className={`flex items-center gap-2 text-sm mt-1 ${status.type === "success" ? "text-green-500" : "text-red-500"}`}>
          {status.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {status.message}
        </div>
      )}
    </div>
  );
}
