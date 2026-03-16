'use client';

import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

interface CancelledOrdersData {
  month: string;
  count: number;
  orderIds: string[];
}

interface CancelledOrdersChartProps {
  data: CancelledOrdersData[];
}

export function CancelledOrdersChart({ data }: CancelledOrdersChartProps) {
  const [selectedMonth, setSelectedMonth] = useState<CancelledOrdersData | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = (orderId: string) => {
    navigator.clipboard.writeText(orderId);
    setCopiedId(orderId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4">Failed Shipments by Month</h3>
        <div className="text-center py-8 text-gray-400 italic">
          No failed shipments (cancelled with shipped time)
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count));
  const chartHeight = 200;

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-2">Failed Shipments by Month</h3>
        <p className="text-xs text-gray-500 mb-6">Orders cancelled/returned AFTER shipping • Click bars to view details</p>

        <div className="flex gap-6 items-end">
          <svg
            width="100%"
            height={chartHeight + 40}
            className="flex-1 cursor-pointer"
            viewBox={`0 0 ${data.length * 80} ${chartHeight + 40}`}
          >
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
              <line
                key={`grid-${idx}`}
                x1="0"
                y1={chartHeight - chartHeight * ratio}
                x2={data.length * 80}
                y2={chartHeight - chartHeight * ratio}
                stroke="#f0f0f0"
                strokeWidth="1"
              />
            ))}

            {/* Bars */}
            {data.map((item, idx) => {
              const barHeight = (item.count / maxCount) * chartHeight;
              const x = idx * 80 + 20;
              const y = chartHeight - barHeight;
              const isSelected = selectedMonth?.month === item.month;

              return (
                <g key={idx} onClick={() => setSelectedMonth(item)} style={{ cursor: 'pointer' }}>
                  {/* Bar */}
                  <rect
                    x={x}
                    y={y}
                    width="40"
                    height={barHeight}
                    fill={isSelected ? '#DC2626' : '#4472C4'}
                    rx="4"
                  />
                  {/* Value label */}
                  <text
                    x={x + 20}
                    y={y - 8}
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="bold"
                    fill="#1f2937"
                  >
                    {item.count}
                  </text>
                  {/* Month label */}
                  <text
                    x={x + 20}
                    y={chartHeight + 20}
                    textAnchor="middle"
                    fontSize="12"
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
              <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Total Failed Shipments</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {data.reduce((sum, d) => sum + d.count, 0)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Months with Failures</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{data.length}</p>
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
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-blue-25 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-gray-900">Failed Shipments - {selectedMonth.month}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold text-red-600">{selectedMonth.count}</span> cancelled/returned order(s)
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
