"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  BarChart3,
  ChevronDown,
  ChevronUp,
  EyeOff,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface UnsettledOrder {
  orderId: string;
  status: string;
  orderAmount: number;
  cancelationType: string | null;
  shippedTime: string | null;
  createdTime: string;
  key: string;
}

interface UnmatchedTransaction {
  file: string;
  orderId: string;
  type: string;
  settlementAmount: number;
  settledTime: string;
  key: string;
}

interface DismissedItem {
  id: number;
  type: string;
  key: string;
  note: string | null;
  dismissedAt: string;
}

interface ReconciliationData {
  summary: {
    unsettledCount: number;
    unmatchedCount: number;
    totalOrders: number;
    dismissedCount: number;
  };
  unsettledOrders: {
    description: string;
    count: number;
    orders: UnsettledOrder[];
  };
  unmatchedTransactions: {
    description: string;
    count: number;
    transactions: UnmatchedTransaction[];
  };
}

type Tab = "active" | "approved";

export default function SettlementReconciliationPage() {
  const [tab, setTab] = useState<Tab>("active");
  const [data, setData] = useState<ReconciliationData | null>(null);
  const [dismissed, setDismissed] = useState<DismissedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissedLoading, setDismissedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandUnsettled, setExpandUnsettled] = useState(true);
  const [expandUnmatched, setExpandUnmatched] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  type SortDir = "asc" | "desc";
  type UnsettledSortKey = "createdTime" | "orderAmount";
  type UnmatchedSortKey = "file" | "settlementAmount" | "settledTime";

  const [unsettledSort, setUnsettledSort] = useState<{ key: UnsettledSortKey; dir: SortDir }>({ key: "createdTime", dir: "desc" });
  const [unmatchedSort, setUnmatchedSort] = useState<{ key: UnmatchedSortKey; dir: SortDir }>({ key: "file", dir: "asc" });

  const toggleUnsettledSort = (key: UnsettledSortKey) => {
    setUnsettledSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  };

  const toggleUnmatchedSort = (key: UnmatchedSortKey) => {
    setUnmatchedSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  };

  const sortedUnsettled = data
    ? [...data.unsettledOrders.orders].sort((a, b) => {
        const dir = unsettledSort.dir === "asc" ? 1 : -1;
        if (unsettledSort.key === "createdTime") {
          return dir * (new Date(a.createdTime).getTime() - new Date(b.createdTime).getTime());
        }
        return dir * (a.orderAmount - b.orderAmount);
      })
    : [];

  const sortedUnmatched = data
    ? [...data.unmatchedTransactions.transactions].sort((a, b) => {
        const dir = unmatchedSort.dir === "asc" ? 1 : -1;
        if (unmatchedSort.key === "file") return dir * a.file.localeCompare(b.file);
        if (unmatchedSort.key === "settlementAmount") return dir * (a.settlementAmount - b.settlementAmount);
        if (unmatchedSort.key === "settledTime") return dir * ((a.settledTime || "").localeCompare(b.settledTime || ""));
        return 0;
      })
    : [];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/settlement-reconciliation");
      if (!res.ok) throw new Error("Failed to fetch reconciliation data");
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDismissed = useCallback(async () => {
    setDismissedLoading(true);
    try {
      const res = await fetch("/api/reports/settlement-reconciliation/dismissed");
      if (res.ok) {
        const result = await res.json();
        setDismissed(result.items);
      }
    } finally {
      setDismissedLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load dismissed list when tab is switched to it
  useEffect(() => {
    if (tab === "approved") {
      fetchDismissed();
    }
  }, [tab, fetchDismissed]);

  const approveItem = async (type: string, key: string) => {
    setActioning(key);
    try {
      const res = await fetch("/api/reports/settlement-reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, key }),
      });
      if (!res.ok) throw new Error("Failed to approve");
      await fetchData();
      // Refresh dismissed list too if it's already been loaded
      if (tab === "approved") await fetchDismissed();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActioning(null);
    }
  };

  const undoApproval = async (key: string) => {
    setActioning(key);
    try {
      const res = await fetch(
        `/api/reports/settlement-reconciliation?key=${encodeURIComponent(key)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to undo");
      // Optimistically remove from list then refresh both
      setDismissed((prev) => prev.filter((i) => i.key !== key));
      await fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActioning(null);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(amount);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const dismissedCount = data?.summary.dismissedCount ?? dismissed.length;

  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => {
    if (!active) return <ArrowUpDown size={13} className="text-gray-400 ml-1 inline" />;
    return dir === "asc"
      ? <ArrowUp size={13} className="text-purple-600 ml-1 inline" />
      : <ArrowDown size={13} className="text-purple-600 ml-1 inline" />;
  };

  return (
    <div className="container-safe">
      <main className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/reports"
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Back to Reports"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-600 rounded-xl text-white shadow-lg shadow-purple-200">
              <BarChart3 size={28} />
            </div>
            <div>
              <h1 className="page-title">Settlement Reconciliation</h1>
              <p className="page-subtitle">Track unsettled orders & unmatched transactions across all time</p>
            </div>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => { fetchData(); if (tab === "approved") fetchDismissed(); }}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-medium transition-colors text-sm"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card">
              <div className="text-sm font-semibold text-gray-600 mb-2">Total Orders</div>
              <div className="text-2xl font-bold text-gray-900">
                {data.summary.totalOrders.toLocaleString()}
              </div>
            </div>

            <div className={`card ${data.summary.unsettledCount > 0 ? "bg-yellow-50 border-yellow-200" : ""}`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className={data.summary.unsettledCount > 0 ? "text-yellow-600" : "text-gray-400"} />
                <span className="text-sm font-semibold text-gray-600">Unsettled Orders</span>
              </div>
              <div className={`text-2xl font-bold ${data.summary.unsettledCount > 0 ? "text-yellow-700" : "text-green-600"}`}>
                {data.summary.unsettledCount}
              </div>
            </div>

            <div className={`card ${data.summary.unmatchedCount > 0 ? "bg-red-50 border-red-200" : ""}`}>
              <div className="flex items-center gap-2 mb-2">
                {data.summary.unmatchedCount > 0 ? (
                  <AlertCircle size={16} className="text-red-600" />
                ) : (
                  <CheckCircle size={16} className="text-green-600" />
                )}
                <span className="text-sm font-semibold text-gray-600">Unmatched Transactions</span>
              </div>
              <div className={`text-2xl font-bold ${data.summary.unmatchedCount > 0 ? "text-red-700" : "text-green-600"}`}>
                {data.summary.unmatchedCount}
              </div>
            </div>

            <button
              onClick={() => setTab("approved")}
              className={`card text-left transition-colors hover:bg-gray-100 ${tab === "approved" ? "ring-2 ring-purple-400" : ""}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <EyeOff size={16} className="text-gray-400" />
                <span className="text-sm font-semibold text-gray-600">Manually Approved</span>
              </div>
              <div className="text-2xl font-bold text-gray-500">{dismissedCount}</div>
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-1">
            <button
              onClick={() => setTab("active")}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                tab === "active"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Active Issues
              {data && (data.summary.unsettledCount + data.summary.unmatchedCount) > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 font-bold">
                  {data.summary.unsettledCount + data.summary.unmatchedCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab("approved")}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                tab === "approved"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Manually Approved
              {dismissedCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 font-bold">
                  {dismissedCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="card bg-red-50 border-red-200">
            <p className="text-red-800 font-semibold">Error: {error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && !data && (
          <div className="card text-center py-12">
            <p className="text-gray-500">Loading reconciliation data...</p>
          </div>
        )}

        {/* ── TAB: ACTIVE ISSUES ── */}
        {tab === "active" && data && (
          <>
            {/* Status banner */}
            <div className={`card ${data.summary.unmatchedCount === 0 && data.summary.unsettledCount === 0 ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}`}>
              <div className={`flex items-center gap-2 font-semibold ${data.summary.unmatchedCount === 0 && data.summary.unsettledCount === 0 ? "text-green-700" : "text-yellow-700"}`}>
                {data.summary.unmatchedCount === 0 && data.summary.unsettledCount === 0 ? (
                  <><CheckCircle size={20} /> All transactions matched and settled</>
                ) : (
                  <>
                    <AlertCircle size={20} />
                    {[
                      data.summary.unsettledCount > 0 && `${data.summary.unsettledCount} unsettled order(s)`,
                      data.summary.unmatchedCount > 0 && `${data.summary.unmatchedCount} unmatched transaction(s)`,
                    ].filter(Boolean).join(" · ")}{" "}need attention
                  </>
                )}
              </div>
            </div>

            {/* Unsettled Orders */}
            <div className="card">
              <button
                onClick={() => setExpandUnsettled(!expandUnsettled)}
                className="w-full px-6 py-4 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="text-left">
                  <h2 className="text-lg font-bold text-gray-900">
                    Unsettled Orders ({data.unsettledOrders.count})
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">{data.unsettledOrders.description}</p>
                </div>
                {expandUnsettled ? <ChevronUp size={24} className="text-gray-500 ml-4 flex-shrink-0" /> : <ChevronDown size={24} className="text-gray-500 ml-4 flex-shrink-0" />}
              </button>

              {expandUnsettled && (
                data.unsettledOrders.count === 0 ? (
                  <div className="p-8 text-center text-gray-500">All orders have settlement data</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="table-header border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Order ID</th>
                          <th
                            className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:text-purple-600 select-none"
                            onClick={() => toggleUnsettledSort("orderAmount")}
                          >
                            Order Amount<SortIcon active={unsettledSort.key === "orderAmount"} dir={unsettledSort.dir} />
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                          <th
                            className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:text-purple-600 select-none"
                            onClick={() => toggleUnsettledSort("createdTime")}
                          >
                            Created Time<SortIcon active={unsettledSort.key === "createdTime"} dir={unsettledSort.dir} />
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedUnsettled.map((order, idx) => (
                          <tr key={order.orderId} className={`table-row ${idx === sortedUnsettled.length - 1 ? "border-b-0" : ""}`}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.orderId}</td>
                            <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">{formatCurrency(order.orderAmount)}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">{order.status}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{formatDate(order.createdTime)}</td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => approveItem("unsettled_order", order.key)}
                                disabled={actioning === order.key}
                                title="Approve manually — hides from active issues"
                                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-green-100 hover:text-green-700 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <CheckCircle size={13} />
                                {actioning === order.key ? "..." : "Approve"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>

            {/* Unmatched Transactions */}
            <div className="card">
              <button
                onClick={() => setExpandUnmatched(!expandUnmatched)}
                className="w-full px-6 py-4 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="text-left">
                  <h2 className="text-lg font-bold text-gray-900">
                    Unmatched Transactions ({data.unmatchedTransactions.count})
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">{data.unmatchedTransactions.description}</p>
                </div>
                {expandUnmatched ? <ChevronUp size={24} className="text-gray-500 ml-4 flex-shrink-0" /> : <ChevronDown size={24} className="text-gray-500 ml-4 flex-shrink-0" />}
              </button>

              {expandUnmatched && (
                data.unmatchedTransactions.count === 0 ? (
                  <div className="p-8 text-center text-gray-500">All transactions have matching orders</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="table-header border-b border-gray-100">
                        <tr>
                          <th
                            className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:text-purple-600 select-none"
                            onClick={() => toggleUnmatchedSort("file")}
                          >
                            File<SortIcon active={unmatchedSort.key === "file"} dir={unmatchedSort.dir} />
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Order ID</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                          <th
                            className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:text-purple-600 select-none"
                            onClick={() => toggleUnmatchedSort("settlementAmount")}
                          >
                            Settlement Amount<SortIcon active={unmatchedSort.key === "settlementAmount"} dir={unmatchedSort.dir} />
                          </th>
                          <th
                            className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:text-purple-600 select-none"
                            onClick={() => toggleUnmatchedSort("settledTime")}
                          >
                            Settled Time<SortIcon active={unmatchedSort.key === "settledTime"} dir={unmatchedSort.dir} />
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedUnmatched.map((trans, idx) => (
                          <tr key={trans.key} className={`table-row bg-red-50 ${idx === sortedUnmatched.length - 1 ? "border-b-0" : ""}`}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{trans.file}</td>
                            <td className="px-6 py-4 text-sm font-medium text-red-600">{trans.orderId}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{trans.type}</td>
                            <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">{formatCurrency(trans.settlementAmount)}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{trans.settledTime || "-"}</td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => approveItem("unmatched_transaction", trans.key)}
                                disabled={actioning === trans.key}
                                title="Approve manually — hides from active issues"
                                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-600 bg-red-100 hover:bg-green-100 hover:text-green-700 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <CheckCircle size={13} />
                                {actioning === trans.key ? "..." : "Approve"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>

            {/* Info */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-900 space-y-2">
                <strong>How to read this report:</strong>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Unsettled Orders:</strong> Orders in the database with no settlement amount yet (not cancelled).</li>
                  <li><strong>Unmatched Transactions:</strong> Income file entries with no matching order ID in the database.</li>
                  <li><strong>Approve:</strong> Mark as reviewed and hide from this list. Go to "Manually Approved" tab to undo.</li>
                </ul>
              </div>
            </div>
          </>
        )}

        {/* ── TAB: MANUALLY APPROVED ── */}
        {tab === "approved" && (
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <EyeOff size={20} className="text-gray-400" />
                  Manually Approved Items
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  These items were approved manually and hidden from Active Issues. Click "Undo" to restore.
                </p>
              </div>
              <button
                onClick={fetchDismissed}
                disabled={dismissedLoading}
                className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                {dismissedLoading ? "Loading..." : "Refresh"}
              </button>
            </div>

            {dismissedLoading && dismissed.length === 0 ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : dismissed.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No manually approved items</p>
                <p className="text-sm text-gray-400 mt-1">Items you approve on the Active Issues tab will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="table-header border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Key / Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Approved At</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dismissed.map((item, idx) => (
                      <tr key={item.key} className={`table-row ${idx === dismissed.length - 1 ? "border-b-0" : ""}`}>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${item.type === "unsettled_order" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                            {item.type === "unsettled_order" ? "Unsettled Order" : "Unmatched Txn"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-mono">{item.key}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(item.dismissedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => undoApproval(item.key)}
                            disabled={actioning === item.key}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-yellow-100 hover:text-yellow-700 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <RotateCcw size={12} />
                            {actioning === item.key ? "..." : "Undo"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
