import { LayoutDashboard, ShoppingCart, TrendingUp, Package } from "lucide-react";
import Link from "next/link";
import { getDashboardSummary, getCancelledOrdersByMonth, getCurrentMonthFailedShipments, getSuccessfulOrdersByMonth, getCurrentMonthSuccessfulOrders } from "@/lib/analytics";
import { ImportButton } from "@/components/ImportButton";
import { CancelledOrdersChart } from "@/components/CancelledOrdersChart";
import { SuccessfulOrdersChart } from "@/components/SuccessfulOrdersChart";

export const dynamic = "force-dynamic";

export default async function Home() {
  const summary = await getDashboardSummary();
  const cancelledOrders = await getCancelledOrdersByMonth();
  const currentMonthFailures = await getCurrentMonthFailedShipments();
  const successfulOrders = await getSuccessfulOrdersByMonth();
  const currentMonthSuccesses = await getCurrentMonthSuccessfulOrders();

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 sm:p-12 font-sans">
      <main className="max-w-6xl mx-auto flex flex-col gap-10">
        
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
              <LayoutDashboard size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">MoonStudio</h1>
              <p className="text-gray-500">Sales & 3D Printing Analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/reports"
              className="px-4 py-2 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors"
            >
              Tax & Reports
            </Link>
            <Link
              href="/products"
              className="px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
            >
              View Products
            </Link>
            <ImportButton />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 text-green-600 mb-4 font-semibold uppercase text-xs tracking-wider">
              <TrendingUp size={18} />
              Total Revenue
            </div>
            <div className="text-3xl font-bold text-gray-900">
              ฿{summary.totalRevenue.toLocaleString()}
            </div>
            <p className="text-sm text-gray-400 mt-2">Overall sales across all platforms</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 text-blue-600 mb-4 font-semibold uppercase text-xs tracking-wider">
              <Package size={18} />
              Total Orders
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {summary.totalOrders.toLocaleString()}
            </div>
            <p className="text-sm text-gray-400 mt-2">Successful transactions processed</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 text-orange-500 mb-4 font-semibold uppercase text-xs tracking-wider">
              <ShoppingCart size={18} />
              Unique Products
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {summary.uniqueProductCount}
            </div>
            <p className="text-sm text-gray-400 mt-2">Active models sold this period</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6">
          {/* Successful Orders Chart */}
          <SuccessfulOrdersChart data={successfulOrders} currentMonthSuccesses={currentMonthSuccesses} />

          {/* Cancelled Orders Chart */}
          <CancelledOrdersChart data={cancelledOrders} currentMonthFailures={currentMonthFailures} />
        </div>

        {/* Product Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Top Selling Products</h3>
            <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">By Quantity</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-gray-500 uppercase text-[10px] font-bold tracking-widest">
                <tr>
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">Variation</th>
                  <th className="px-6 py-4 text-right">Units Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {summary.topProducts.length > 0 ? (
                  summary.topProducts.map((product, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                      <td className="px-6 py-4 text-gray-500">{product.variation || "-"}</td>
                      <td className="px-6 py-4 text-right font-semibold text-blue-600">{product.count}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-gray-400 italic">
                      No data available. Click "Import TikTok Data" to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
