import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Button } from '@/components/ui/button'
import type {
  OrderWithSteelGrade,
  PlanningMode,
  PlanningRun,
} from '@/lib/database.types'
import { createClient } from '@/lib/supabase/server'

import { logout } from '../actions'
import { CreateRunButton } from './create-run-button'
import { PlanningConfigurator } from './planning-configurator'
import { PlanningResultsPanel } from './planning-results-panel'
import { PlanningRunDetailPanel } from './planning-run-detail-panel'
import { PlanningRunsPanel } from './planning-runs-panel'
import { TaskExecutionConsole } from './task-execution-console'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{
  mode?: string
  preference?: string
  test_mode?: string
  short?: string
  cross_group?: string
  run?: string
}>

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, role')
    .eq('id', user.id)
    .single()

  const { data: selections } = await supabase
    .from('order_selections')
    .select('order_id')
    .eq('user_id', user.id)
    .order('selected_at', { ascending: false })

  const selectedIds = (selections ?? []).map((item) => item.order_id)

  const { data: selectedOrders } =
    selectedIds.length > 0
      ? await supabase
          .from('orders')
          .select(
            `
              *,
              steel_grade:steel_grades (
                id,
                standard_steel,
                internal_code
              )
            `
          )
          .in('id', selectedIds)
          .returns<OrderWithSteelGrade[]>()
      : { data: [] as OrderWithSteelGrade[] }

  const orders = selectedOrders ?? []
  const hasOrders = orders.length > 0
  const totalWeight = orders.reduce(
    (sum, order) => sum + Number(order.weight_tons || 0),
    0
  )
  const uniqueGrades = new Set(
    orders
      .map((order) => order.steel_grade?.standard_steel)
      .filter((value): value is string => Boolean(value))
  )
  const nearestDeliveryDate = orders
    .map((order) => order.delivery_date)
    .filter((value): value is string => Boolean(value))
    .sort()[0]

  const gradeSummary = Array.from(
    orders.reduce<Map<string, { count: number; weight: number }>>((map, order) => {
      const gradeName = order.steel_grade?.standard_steel || '未关联钢种'
      const current = map.get(gradeName) || { count: 0, weight: 0 }
      current.count += 1
      current.weight += Number(order.weight_tons || 0)
      map.set(gradeName, current)
      return map
    }, new Map())
  )
    .map(([grade, summary]) => ({ grade, ...summary }))
    .sort((a, b) => b.count - a.count)

  const statusSummary = Array.from(
    orders.reduce<Map<string, number>>((map, order) => {
      const current = map.get(order.status) || 0
      map.set(order.status, current + 1)
      return map
    }, new Map())
  )

  const enabledRules = [
    ['preference', '偏好评分'],
    ['test_mode', '测试模式'],
    ['short', '短板坯分支'],
    ['cross_group', '跨组组合'],
  ]
    .filter(([key]) => params[key as keyof typeof params] === '1')
    .map(([, label]) => label)

  const modeLabelMap: Record<string, string> = {
    balanced: '均衡模式',
    'delivery-first': '交期优先',
    'grade-batch': '钢种聚合',
  }
  const modeLabel = modeLabelMap[params.mode || 'balanced'] || '均衡模式'
  const currentMode = (params.mode || 'balanced') as PlanningMode

  const { data: planningRuns, error: planningRunsError } = await supabase
    .from('planning_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(8)
    .returns<PlanningRun[]>()

  const runs =
    planningRunsError && planningRunsError.code === 'PGRST205'
      ? []
      : (planningRuns ?? [])
  const activeRun = runs.find((run) => run.id === params.run) ?? runs[0] ?? null

  type PlanningRunOrderRow = {
    order: OrderWithSteelGrade | null
  }

  const { data: linkedRows } =
    activeRun && !(planningRunsError && planningRunsError.code === 'PGRST205')
      ? await supabase
          .from('planning_run_orders')
          .select(
            `
              order:orders (
                *,
                steel_grade:steel_grades (
                  id,
                  standard_steel,
                  internal_code
                )
              )
            `
          )
          .eq('planning_run_id', activeRun.id)
          .returns<PlanningRunOrderRow[]>()
      : { data: [] as PlanningRunOrderRow[] }

  const linkedOrders = (linkedRows ?? [])
    .map((item) => item.order)
    .filter((item): item is OrderWithSteelGrade => Boolean(item))

  const resultOrders = linkedOrders.length > 0 ? linkedOrders : orders

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-slate-950">
              中板组坯决策平台
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/orders" className="text-slate-600 hover:text-slate-950">
                订单管理
              </Link>
              <Link href="/parameters" className="text-slate-600 hover:text-slate-950">
                参数设置
              </Link>
              <Link href="/planning" className="font-medium text-blue-600">
                任务准备
              </Link>
              <Link href="/steel-grades" className="text-slate-600 hover:text-slate-950">
                钢种管理
              </Link>
              <Link href="/dashboard" className="text-slate-600 hover:text-slate-950">
                数据看板
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              {profile?.display_name || user.email}
              <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                {profile?.role || 'viewer'}
              </span>
            </span>
            <form action={logout}>
              <Button variant="ghost" size="sm" type="submit">
                退出登录
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
              任务准备工作台
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">任务准备</h1>
          </div>
          <div className="flex items-center gap-3">
            <CreateRunButton
              mode={currentMode}
              preferenceEnabled={params.preference === '1'}
              testModeEnabled={params.test_mode === '1'}
              shortEnabled={params.short === '1'}
              crossGroupEnabled={params.cross_group === '1'}
              disabled={!hasOrders}
            />
            <Link href="/orders">
              <Button variant="secondary">返回订单页</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="已选订单" value={`${orders.length}`} helper="条" />
          <SummaryCard label="总重量" value={totalWeight.toFixed(2)} helper="t" />
          <SummaryCard label="涉及钢种" value={`${uniqueGrades.size}`} helper="种" />
          <SummaryCard label="最近交付" value={nearestDeliveryDate || '-'} helper="" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
          <PlanningConfigurator />
          <TaskExecutionConsole
            selectedCount={orders.length}
            uniqueGradeCount={uniqueGrades.size}
            nearestDeliveryDate={nearestDeliveryDate || null}
            modeLabel={modeLabel}
            enabledRules={enabledRules}
            runtimeFlags={{
              preference: params.preference === '1',
              testMode: params.test_mode === '1',
              short: params.short === '1',
              crossGroup: params.cross_group === '1',
            }}
            activeRun={activeRun}
          />
        </div>

        <PlanningResultsPanel run={activeRun} orders={resultOrders} />

        <PlanningRunsPanel
          runs={runs}
          activeRunId={activeRun?.id ?? null}
          currentQuery={{
            mode: params.mode,
            preference: params.preference,
            test_mode: params.test_mode,
            short: params.short,
            cross_group: params.cross_group,
          }}
        />

        <PlanningRunDetailPanel run={activeRun} orders={linkedOrders} />

        {planningRunsError?.code === 'PGRST205' && (
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            请先执行数据库脚本：`database/2026-04-22_planning_runs.sql`
          </section>
        )}

        {!hasOrders ? (
          <section className="rounded-[24px] border border-dashed border-slate-300 bg-white p-12 text-center">
            <h2 className="text-xl font-semibold text-slate-900">暂无已选订单</h2>
            <div className="mt-5">
              <Link href="/orders">
                <Button>前往订单页</Button>
              </Link>
            </div>
          </section>
        ) : (
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.35)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
                  任务快照
                </div>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">当前任务快照</h2>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                {modeLabel}
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">钢种分布</h3>
                <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <HeaderCell>钢种</HeaderCell>
                        <HeaderCell>订单数</HeaderCell>
                        <HeaderCell>重量 (t)</HeaderCell>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {gradeSummary.map((item) => (
                        <tr key={item.grade}>
                          <BodyCell>{item.grade}</BodyCell>
                          <BodyCell>{item.count}</BodyCell>
                          <BodyCell>{item.weight.toFixed(2)}</BodyCell>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">状态分布</h3>
                <div className="mt-3 space-y-3">
                  {statusSummary.map(([status, count]) => (
                    <div
                      key={status}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="text-sm text-slate-500">
                        {getOrderStatusLabel(status)}
                      </div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {count} 条
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-900">已选订单</h3>
              <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
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
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <BodyCell className="font-mono text-slate-900">
                          {order.order_number}
                        </BodyCell>
                        <BodyCell>{order.sequence_no}</BodyCell>
                        <BodyCell>
                          {order.steel_grade?.standard_steel || '未关联钢种'}
                        </BodyCell>
                        <BodyCell>{Number(order.weight_tons).toFixed(2)}</BodyCell>
                        <BodyCell>{getOrderStatusLabel(order.status)}</BodyCell>
                        <BodyCell>{order.delivery_date || '-'}</BodyCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper: string
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.28)]">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-3xl font-semibold text-slate-950">{value}</span>
        {helper ? <span className="pb-1 text-sm text-slate-500">{helper}</span> : null}
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

function getOrderStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: '待处理',
    imported: '已导入',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  }

  return labels[status] || status
}
