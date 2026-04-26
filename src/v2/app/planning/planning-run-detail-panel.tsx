import type { OrderWithSteelGrade, PlanningRun } from '@/lib/database.types'

interface PlanningRunDetailPanelProps {
  run: PlanningRun | null
  orders: OrderWithSteelGrade[]
}

export function PlanningRunDetailPanel({
  run,
  orders,
}: PlanningRunDetailPanelProps) {
  if (!run) {
    return (
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_-28px_rgba(15,23,42,0.28)]">
        <h2 className="text-lg font-semibold text-slate-900">任务详情</h2>
      </section>
    )
  }

  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_-28px_rgba(15,23,42,0.28)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">任务详情</h2>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
          {run.id.slice(0, 8)}...
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <InfoCard label="状态" value={getStatusLabel(run.status)} />
        <InfoCard label="模式" value={getModeLabel(run.mode)} />
        <InfoCard label="最近流转" value={formatDateTime(run.last_transition_at)} />
        <InfoCard label="创建时间" value={formatDateTime(run.created_at)} />
        <InfoCard label="更新时间" value={formatDateTime(run.updated_at)} />
        <InfoCard label="开关" value={formatFlags(run)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <Block
            title="任务概览"
            rows={[
              ['订单数量', `${run.selected_order_count} 条`],
              ['总重量', `${Number(run.total_weight_tons).toFixed(2)} t`],
              ['钢种数量', `${run.unique_grade_count} 种`],
              ['最近交付', run.nearest_delivery_date || '-'],
            ]}
          />
          <Block
            title="规则开关"
            rows={[
              ['基础流', 'regular + stitch'],
              ['short_slab', run.short_enabled ? '开' : '关'],
              ['cross_group', run.cross_group_enabled ? '开' : '关'],
              ['preference', run.preference_enabled ? '开' : '关'],
              ['test_mode', run.test_mode_enabled ? '开' : '关'],
            ]}
          />
          <Block
            title="状态说明"
            rows={[
              ['completed', '完成'],
              ['failed', '失败'],
              ['cancelled', '取消'],
            ]}
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">绑定订单</h3>
          {orders.length === 0 ? (
            <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
              暂无绑定订单
            </div>
          ) : (
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <HeaderCell>订单号</HeaderCell>
                    <HeaderCell>序列号</HeaderCell>
                    <HeaderCell>钢种</HeaderCell>
                    <HeaderCell>重量 (t)</HeaderCell>
                    <HeaderCell>状态</HeaderCell>
                    <HeaderCell>交付日期</HeaderCell>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {orders.slice(0, 12).map((order) => (
                    <tr key={order.id}>
                      <BodyCell className="font-mono text-slate-900">
                        {order.order_number}
                      </BodyCell>
                      <BodyCell>{order.sequence_no}</BodyCell>
                      <BodyCell>{order.steel_grade?.standard_steel || '未关联钢种'}</BodyCell>
                      <BodyCell>{Number(order.weight_tons).toFixed(2)}</BodyCell>
                      <BodyCell>{getOrderStatusLabel(order.status)}</BodyCell>
                      <BodyCell>{order.delivery_date || '-'}</BodyCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-2 text-base font-semibold text-slate-900">{value}</div>
    </div>
  )
}

function Block({
  title,
  rows,
}: {
  title: string
  rows: Array<[string, string]>
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-3 space-y-3">
        {rows.map(([label, value]) => (
          <div
            key={`${title}-${label}`}
            className="flex items-start justify-between gap-4 rounded-md border border-slate-100 bg-slate-50 px-3 py-2"
          >
            <div className="text-sm text-slate-500">{label}</div>
            <div className="text-right text-sm font-medium text-slate-800">{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
      {children}
    </th>
  )
}

function BodyCell({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <td className={`px-4 py-3 text-sm text-slate-700 ${className}`}>{children}</td>
}

function getModeLabel(mode: PlanningRun['mode']) {
  const labels: Record<PlanningRun['mode'], string> = {
    balanced: '均衡模式',
    'delivery-first': '交期优先',
    'grade-batch': '钢种聚合',
  }

  return labels[mode]
}

function getStatusLabel(status: PlanningRun['status']) {
  const labels: Record<PlanningRun['status'], string> = {
    draft: '草稿',
    waiting: '等待',
    executing: '执行',
    processing: '处理中',
    standby: '待确认',
    completed: '完成',
    failed: '失败',
    cancelled: '取消',
  }

  return labels[status]
}

function formatFlags(run: PlanningRun) {
  const labels = [
    run.preference_enabled ? '偏好' : null,
    run.test_mode_enabled ? '测试' : null,
    run.short_enabled ? '短板坯' : null,
    run.cross_group_enabled ? '跨组' : null,
  ].filter(Boolean)

  return labels.length > 0 ? labels.join(' / ') : '-'
}

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-'
}

function getOrderStatusLabel(status: OrderWithSteelGrade['status']) {
  const labels: Record<OrderWithSteelGrade['status'], string> = {
    pending: '待处理',
    imported: '已导入',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  }

  return labels[status]
}
