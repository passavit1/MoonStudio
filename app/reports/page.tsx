"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, TrendingUp, X } from "lucide-react";

interface MonthlyData {
  month: string;
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  lostOrders: number;
}

interface Totals {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  lostOrders: number;
}

export default function ReportsPage() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [monthDetails, setMonthDetails] = useState<any[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/reports/monthly-revenue");
        if (!res.ok) throw new Error("Failed to fetch reports");
        const data = await res.json();
        setMonthlyData(data.monthly);
        setTotals(data.totals);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleMonthClick = async (month: string) => {
    setSelectedMonth(month);
    setDetailsLoading(true);
    try {
      const res = await fetch(`/api/reports/month-details?month=${month}`);
      if (!res.ok) throw new Error("Failed to fetch month details");
      const data = await res.json();
      setMonthDetails(data.orders);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 sm:p-12 font-sans">
      <main className="max-w-5xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-600 rounded-xl text-white shadow-lg shadow-purple-200">
              <BarChart3 size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Tax & Reports
              </h1>
              <p className="text-gray-500">Monthly Revenue Summary</p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center">
            <div className="inline-block animate-spin">
              <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full"></div>
            </div>
            <p className="mt-4 text-gray-600">Loading reports...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 p-6 rounded-2xl border border-red-200">
            <p className="text-red-800 font-semibold">Error: {error}</p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Summary Cards */}
            {totals && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 text-green-600 mb-2 font-semibold text-xs uppercase tracking-wider">
                    <TrendingUp size={16} />
                    Total Revenue
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(totals.totalRevenue)}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">All time</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="text-blue-600 mb-2 font-semibold text-xs uppercase tracking-wider">
                    📊 Total Orders
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {totals.totalOrders.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">All time</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="text-green-600 mb-2 font-semibold text-xs uppercase tracking-wider">
                    ✅ Completed
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {totals.completedOrders.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {((totals.completedOrders / totals.totalOrders) * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="text-yellow-600 mb-2 font-semibold text-xs uppercase tracking-wider">
                    🚚 Pending (On The Way)
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {totals.pendingOrders.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {((totals.pendingOrders / totals.totalOrders) * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="text-red-600 mb-2 font-semibold text-xs uppercase tracking-wider">
                    📦 Lost (Shipped & Cancelled)
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {totals.lostOrders.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {((totals.lostOrders / totals.totalOrders) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            )}

            {/* Monthly Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Monthly Breakdown</h2>
              </div>

              {monthlyData.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No data available. Import orders to see reports.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Month
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Revenue
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Total Orders
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Completed
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Pending
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Lost (Shipped & Cancelled)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map((month, idx) => (
                        <tr
                          key={month.month}
                          onClick={() => handleMonthClick(month.month)}
                          className={`border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer ${
                            idx === monthlyData.length - 1 ? "border-b-0" : ""
                          }`}
                        >
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {formatMonth(month.month)}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-bold text-green-600">
                            {formatCurrency(month.totalRevenue)}
                          </td>
                          <td className="px-6 py-4 text-sm text-center text-gray-600">
                            {month.totalOrders.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-center">
                            <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                              {month.completedOrders}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-center">
                            <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">
                              {month.pendingOrders}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-center">
                            <span className="inline-block px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
                              {month.lostOrders}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Note */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-900 space-y-3">
                <div>
                  <strong>📊 About this report:</strong>
                </div>

                <div className="pl-4 border-l-2 border-blue-300 space-y-2">
                  <div>
                    <strong>💰 Revenue:</strong> Sum of Order Amount (what customer paid) from all valid orders
                  </div>

                  <div>
                    <strong>📦 Total Orders:</strong> Count of all valid orders (excludes orders cancelled before shipping)
                  </div>

                  <div>
                    <strong>✅ Completed:</strong> Orders successfully delivered to customer (Status: เสร็จสมบูรณ์ or จัดส่งแล้ว)
                  </div>

                  <div>
                    <strong>🚚 Pending:</strong> Orders on the way to customer (Status: ที่จะจัดส่ง) - waiting for delivery
                  </div>

                  <div>
                    <strong>📦 Lost (Shipped & Cancelled):</strong> Orders cancelled AFTER shipping to droppoint - you paid the shipping fee but customer didn't receive or cancelled
                  </div>

                  <div>
                    <strong>❌ Ignored:</strong> Orders cancelled BEFORE shipping (customer changed mind, no shipping fee paid) - not counted in totals
                  </div>
                </div>

                <div className="border-t border-blue-200 pt-2">
                  <strong>💡 Tip:</strong> Click on any month row to see detailed order information for that month
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Month Details Modal */}
      {selectedMonth && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {formatMonth(selectedMonth)} - Order Details
              </h2>
              <button
                onClick={() => setSelectedMonth(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {detailsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
                  </div>
                  <p className="mt-4 text-gray-600">Loading month details...</p>
                </div>
              ) : monthDetails.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No orders found for this month</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Order ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                          Revenue
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Type
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthDetails.map((order, idx) => (
                        <tr
                          key={order.externalOrderId}
                          className={`border-b border-gray-100 ${
                            idx === monthDetails.length - 1 ? "border-b-0" : ""
                          }`}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {order.externalOrderId}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs">
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                            {formatCurrency(order.orderAmount)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {order.cancelationType && order.shippedTime ? (
                              <span className="inline-block px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
                                📦 Lost
                              </span>
                            ) : order.status === "เสร็จสมบูรณ์" || order.status === "จัดส่งแล้ว" ? (
                              <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                                ✅ Completed
                              </span>
                            ) : order.status === "ที่จะจัดส่ง" ? (
                              <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">
                                🚚 Pending
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                                ❓ Unknown
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
