import Link from 'next/link'

import type { PlanningRun } from '@/lib/database.types'

interface PlanningRunsPanelProps {
  runs: PlanningRun[]
  activeRunId: string | null
  currentQuery: {
    mode?: string
    preference?: string
    test_mode?: string
    short?: string
    cross_group?: string
  }
}

export function PlanningRunsPanel({
  runs,
  activeRunId,
  currentQuery,
}: PlanningRunsPanelProps) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_-28px_rgba(15,23,42,0.28)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">任务记录</h2>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
          共 {runs.length} 条
        </div>
      </div>

      {runs.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
          暂无记录
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <HeaderCell>创建时间</HeaderCell>
                <HeaderCell>状态</HeaderCell>
                <HeaderCell>模式</HeaderCell>
                <HeaderCell>订单数</HeaderCell>
                <HeaderCell>总重量 (t)</HeaderCell>
                <HeaderCell>钢种数</HeaderCell>
                <HeaderCell>开关</HeaderCell>
                <HeaderCell>查看</HeaderCell>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {runs.map((run) => {
                const active = run.id === activeRunId

                return (
                  <tr key={run.id} className={active ? 'bg-blue-50' : undefined}>
                    <BodyCell>{formatDateTime(run.created_at)}</BodyCell>
                    <BodyCell>
                      <StatusBadge status={run.status} />
                    </BodyCell>
                    <BodyCell>{getModeLabel(run.mode)}</BodyCell>
                    <BodyCell>{run.selected_order_count}</BodyCell>
                    <BodyCell>{Number(run.total_weight_tons).toFixed(2)}</BodyCell>
                    <BodyCell>{run.unique_grade_count}</BodyCell>
                    <BodyCell>{formatFlags(run)}</BodyCell>
                    <BodyCell>
                      <Link
                        href={buildRunHref(run.id, currentQuery)}
                        className={`text-sm font-medium ${
                          active ? 'text-blue-700' : 'text-blue-600 hover:text-blue-700'
                        }`}
                      >
                        {active ? '当前' : '查看'}
                      </Link>
                    </BodyCell>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
      {children}
    </th>
  )
}

function BodyCell({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-sm text-slate-700">{children}</td>
}

function StatusBadge({ status }: { status: PlanningRun['status'] }) {
  const classMap: Record<PlanningRun['status'], string> = {
    draft: 'bg-slate-100 text-slate-700',
    waiting: 'bg-amber-100 text-amber-700',
    executing: 'bg-blue-100 text-blue-700',
    processing: 'bg-cyan-100 text-cyan-700',
    standby: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    cancelled: 'bg-zinc-100 text-zinc-700',
  }

  const labelMap: Record<PlanningRun['status'], string> = {
    draft: '草稿',
    waiting: '等待',
    executing: '执行',
    processing: '处理中',
    standby: '待确认',
    completed: '完成',
    failed: '失败',
    cancelled: '取消',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${classMap[status]}`}
    >
      {labelMap[status]}
    </span>
  )
}

function getModeLabel(mode: PlanningRun['mode']) {
  const labels: Record<PlanningRun['mode'], string> = {
    balanced: '均衡模式',
    'delivery-first': '交期优先',
    'grade-batch': '钢种聚合',
  }

  return labels[mode]
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

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('zh-CN')
}

function buildRunHref(
  runId: string,
  query: PlanningRunsPanelProps['currentQuery']
) {
  const params = new URLSearchParams()

  if (query.mode) params.set('mode', query.mode)
  if (query.preference) params.set('preference', query.preference)
  if (query.test_mode) params.set('test_mode', query.test_mode)
  if (query.short) params.set('short', query.short)
  if (query.cross_group) params.set('cross_group', query.cross_group)
  params.set('run', runId)

  return `/planning?${params.toString()}`
}
