'use client';

interface CancelledOrdersData {
  month: string;
  count: number;
}

interface CancelledOrdersChartProps {
  data: CancelledOrdersData[];
}

export function CancelledOrdersChart({ data }: CancelledOrdersChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4">Cancelled Orders by Month</h3>
        <div className="text-center py-8 text-gray-400 italic">
          No cancelled orders data available
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count));
  const chartHeight = 200;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="font-bold text-gray-900 mb-6">Cancelled Orders by Month</h3>

      <div className="flex gap-6 items-end">
        <svg
          width="100%"
          height={chartHeight + 40}
          className="flex-1"
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

            return (
              <g key={idx}>
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width="40"
                  height={barHeight}
                  fill="#4472C4"
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
            <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Total Cancelled</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {data.reduce((sum, d) => sum + d.count, 0)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Months with Cancellations</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{data.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
