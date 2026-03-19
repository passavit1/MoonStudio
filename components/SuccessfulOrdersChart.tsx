'use client';

import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

interface SuccessfulOrdersData {
  month: string;
  count: number;
  orderIds: string[];
  totalRevenue: number;
  totalSettlement: number;
}

interface SuccessfulOrdersChartProps {
  data: SuccessfulOrdersData[];
  currentMonthSuccesses: number;
}

export function SuccessfulOrdersChart({ data, currentMonthSuccesses }: SuccessfulOrdersChartProps) {
  const [selectedMonth, setSelectedMonth] = useState<SuccessfulOrdersData | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = (orderId: string) => {
    navigator.clipboard.writeText(orderId);
    setCopiedId(orderId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4">Successful Orders by Month</h3>
        <div className="text-center py-8 text-gray-400 italic">
          No successful orders (shipped without cancellation)
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map(d => Math.max(d.totalRevenue, d.totalSettlement, d.count * 100)));
  const chartHeight = 280;
  // Fixed for 12 months - use 100% via container
  const monthCount = 12;
  const barWidth = 20;
  const barGap = 3;
  const groupSpacing = (barWidth + barGap) * 3 + 20; // ~90px for three bars + spacing
  const svgWidth = monthCount * groupSpacing + 40;
  const topPadding = 90; // Space for labels above bars
  const bottomPadding = 70;

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-2">Successful Orders by Month</h3>
        <p className="text-xs text-gray-500 mb-4">Orders successfully shipped without cancellation • Click bars to view details</p>

        {/* Legend */}
        <div className="flex gap-6 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-400"></div>
            <span className="text-xs text-gray-600">Total Orders</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-xs text-gray-600">Total Customer Paid</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span className="text-xs text-gray-600">Total Settlement Received</span>
          </div>
        </div>

        <div className="w-full">
          <svg
            width="100%"
            height="auto"
            className="cursor-pointer w-full"
            viewBox={`0 0 ${svgWidth} ${chartHeight + topPadding + bottomPadding}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ minHeight: `${(chartHeight + topPadding + bottomPadding) * 0.6}px` }}
          >
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
              <line
                key={`grid-${idx}`}
                x1="0"
                y1={topPadding + chartHeight - chartHeight * ratio}
                x2={svgWidth}
                y2={topPadding + chartHeight - chartHeight * ratio}
                stroke="#f0f0f0"
                strokeWidth="1"
              />
            ))}

            {/* Bars */}
            {data.map((item, idx) => {
              const countBarHeight = (item.count * 100 / maxRevenue) * chartHeight;
              const revenueBarHeight = (item.totalRevenue / maxRevenue) * chartHeight;
              const settlementBarHeight = (item.totalSettlement / maxRevenue) * chartHeight;
              const groupX = idx * groupSpacing + 15;
              const countX = groupX;
              const revenueX = groupX + barWidth + barGap;
              const settlementX = groupX + (barWidth + barGap) * 2;
              const countY = topPadding + chartHeight - countBarHeight;
              const revenueY = topPadding + chartHeight - revenueBarHeight;
              const settlementY = topPadding + chartHeight - settlementBarHeight;
              const isSelected = selectedMonth?.month === item.month;

              return (
                <g key={idx} onClick={() => setSelectedMonth(item)} style={{ cursor: 'pointer' }}>
                  {/* Total Orders Bar (Gray) */}
                  <rect
                    x={countX}
                    y={countY}
                    width={barWidth}
                    height={countBarHeight}
                    fill={isSelected ? '#374151' : '#9CA3AF'}
                    rx="3"
                  />

                  {/* Customer Paid Bar (Green) */}
                  <rect
                    x={revenueX}
                    y={revenueY}
                    width={barWidth}
                    height={revenueBarHeight}
                    fill={isSelected ? '#15803D' : '#22C55E'}
                    rx="3"
                  />

                  {/* Settlement Received Bar (Blue) */}
                  <rect
                    x={settlementX}
                    y={settlementY}
                    width={barWidth}
                    height={settlementBarHeight}
                    fill={isSelected ? '#1E40AF' : '#3B82F6'}
                    rx="3"
                  />

                  {/* Count value label - ABOVE bar */}
                  {item.count > 0 && (
                    <text
                      x={countX + barWidth / 2}
                      y={topPadding - 55}
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight="bold"
                      fill="#374151"
                      pointerEvents="none"
                    >
                      {item.count}
                    </text>
                  )}

                  {/* Revenue value label - ABOVE bar */}
                  {item.totalRevenue > 0 && (
                    <text
                      x={revenueX + barWidth / 2}
                      y={topPadding - 35}
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight="bold"
                      fill="#15803D"
                      pointerEvents="none"
                    >
                      ฿{(item.totalRevenue / 1000).toFixed(1)}k
                    </text>
                  )}

                  {/* Settlement value label - ABOVE bar */}
                  {item.totalSettlement > 0 && (
                    <text
                      x={settlementX + barWidth / 2}
                      y={topPadding - 15}
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight="bold"
                      fill="#1E40AF"
                      pointerEvents="none"
                    >
                      ฿{(item.totalSettlement / 1000).toFixed(1)}k
                    </text>
                  )}

                  {/* Month label below bars */}
                  <text
                    x={groupX + barWidth + 8}
                    y={topPadding + chartHeight + 20}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="600"
                    fill="#6b7280"
                  >
                    {item.month}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Summary stats */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Total Successful Orders</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {data.reduce((sum, d) => sum + d.count, 0)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Successful Orders This Month</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{currentMonthSuccesses}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Total Customer Paid</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                ฿{(data.reduce((sum, d) => sum + d.totalRevenue, 0) / 1000).toFixed(1)}k
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Total Settlement Received</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                ฿{(data.reduce((sum, d) => sum + d.totalSettlement, 0) / 1000).toFixed(1)}k
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Details Modal - Floating Modal */}
      {selectedMonth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[70vh] overflow-hidden shadow-2xl border border-gray-100 pointer-events-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-gray-900">Successful Orders - {selectedMonth.month}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold text-green-600">{selectedMonth.count}</span> successful order(s)
                </p>
              </div>
              <button
                onClick={() => setSelectedMonth(null)}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 100px)' }}>
              <div className="p-6">
                <div className="space-y-2">
                  {selectedMonth.orderIds.map((orderId, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors group"
                    >
                      <span className="font-mono text-sm text-gray-700">{orderId}</span>
                      <button
                        onClick={() => handleCopyId(orderId)}
                        className="ml-3 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy order ID"
                      >
                        {copiedId === orderId ? (
                          <Check size={18} className="text-green-600" />
                        ) : (
                          <Copy size={18} className="text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
