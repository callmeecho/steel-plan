import type { ReactNode } from 'react'

interface Props {
  totalOrders: number
  totalWeight: number
  pendingCount: number
  completionRate: number
}

export function KpiCards({
  totalOrders,
  totalWeight,
  pendingCount,
  completionRate,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card
        label="订单总数"
        value={totalOrders.toLocaleString()}
        suffix="条"
        accent="text-blue-600"
      />
      <Card
        label="订单总重量"
        value={totalWeight.toFixed(2)}
        suffix="t"
        accent="text-indigo-600"
      />
      <Card
        label="待处理订单"
        value={pendingCount.toLocaleString()}
        suffix="条"
        accent="text-amber-600"
      />
      <Card
        label="完成率"
        value={completionRate.toFixed(1)}
        suffix="%"
        accent="text-green-600"
      />
    </div>
  )
}

function Card({
  label,
  value,
  suffix,
  accent,
}: {
  label: string
  value: ReactNode
  suffix?: string
  accent: string
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-gray-500">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={`text-3xl font-bold ${accent}`}>{value}</span>
        {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
      </div>
    </div>
  )
}
