'use client';

import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

interface SuccessfulOrdersData {
  month: string;
  count: number;
  orderIds: string[];
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

  const maxCount = Math.max(...data.map(d => d.count));
  const chartHeight = 200;
  const barWidth = Math.max(30, Math.min(60, 1200 / data.length));
  const barSpacing = Math.max(60, 1200 / data.length);
  const svgWidth = data.length * barSpacing + 40;
  const bottomPadding = data.length > 6 ? 60 : 40;

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-2">Successful Orders by Month</h3>
        <p className="text-xs text-gray-500 mb-6">Orders successfully shipped without cancellation • Click bars to view details</p>

        <div className="flex gap-6 items-end overflow-x-auto">
          <svg
            width={svgWidth}
            height={chartHeight + bottomPadding}
            className="flex-shrink-0 cursor-pointer"
            viewBox={`0 0 ${svgWidth} ${chartHeight + bottomPadding}`}
          >
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
              <line
                key={`grid-${idx}`}
                x1="0"
                y1={chartHeight - chartHeight * ratio}
                x2={svgWidth}
                y2={chartHeight - chartHeight * ratio}
                stroke="#f0f0f0"
                strokeWidth="1"
              />
            ))}

            {/* Bars */}
            {data.map((item, idx) => {
              const barHeight = (item.count / maxCount) * chartHeight;
              const x = idx * barSpacing + 20;
              const y = chartHeight - barHeight;
              const isSelected = selectedMonth?.month === item.month;

              return (
                <g key={idx} onClick={() => setSelectedMonth(item)} style={{ cursor: 'pointer' }}>
                  {/* Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={isSelected ? '#16A34A' : '#10B981'}
                    rx="4"
                  />

                  {/* Value label inside bar (at top) */}
                  <text
                    x={x + barWidth / 2}
                    y={y + 18}
                    textAnchor="middle"
                    fontSize={data.length > 10 ? "12" : "14"}
                    fontWeight="bold"
                    fill="white"
                  >
                    {item.count}
                  </text>

                  {/* Month label below bar */}
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight + (data.length > 6 ? 35 : 20)}
                    textAnchor="middle"
                    fontSize={data.length > 10 ? "10" : "12"}
                    fill="#6b7280"
                    transform={data.length > 6 ? `rotate(45 ${x + barWidth / 2} ${chartHeight + 35})` : undefined}
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
