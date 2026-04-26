'use client'

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

interface Props {
  data: { status: string; count: number }[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: '#9ca3af' },
  imported: { label: '已导入', color: '#3b82f6' },
  in_progress: { label: '进行中', color: '#f59e0b' },
  completed: { label: '已完成', color: '#10b981' },
  cancelled: { label: '已取消', color: '#ef4444' },
}

export function StatusPieChart({ data }: Props) {
  const chartData = data.map((item) => ({
    name: STATUS_CONFIG[item.status]?.label || item.status,
    value: item.count,
    color: STATUS_CONFIG[item.status]?.color || '#9ca3af',
  }))

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">订单状态分布</h3>
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ name, percent }) =>
                `${name} ${((percent || 0) * 100).toFixed(0)}%`
              }
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
