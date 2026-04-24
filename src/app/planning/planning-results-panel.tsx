'use client'

import { useEffect, useMemo, useState } from 'react'

import type { OrderWithSteelGrade, PlanningRun } from '@/lib/database.types'

type AuxTab = 'plate_table' | 'slab_table' | 'remain_orders'

type DesignResultRow = {
  ordNo: string
  ordItem: string
  slabNo: string
  steel: string
  status: OrderWithSteelGrade['status']
  slabShape: string
  plateShape: string
  yieldRate: string
  delivery: string
  weight: string
  planScore: number
  priority: 'high' | 'medium' | 'low'
}

type PlateTableRow = {
  ordNo: string
  seq: string
  steel: string
  blockSeq: string
  weight: string
  delivery: string
}

type SlabTableRow = {
  slabNo: string
  steel: string
  slabShape: string
  sourceOrders: number
  mode: string
}

type RemainOrderRow = {
  ordNo: string
  ordItem: string
  steel: string
  remainWeight: string
  reason: string
}

interface PlanningResultsPanelProps {
  run: PlanningRun | null
  orders: OrderWithSteelGrade[]
}

type PriorityFilter = 'all' | DesignResultRow['priority']

const AUX_TAB_LABELS: Record<AuxTab, string> = {
  plate_table: 'plate_table',
  slab_table: 'slab_table',
  remain_orders: 'remain_orders',
}

export function PlanningResultsPanel({
  run,
  orders,
}: PlanningResultsPanelProps) {
  const designResult = useMemo(() => buildDesignResultRows(orders), [orders])
  const plateTable = useMemo(() => buildPlateTableRows(orders), [orders])
  const slabTable = useMemo(() => buildSlabTableRows(orders, run), [orders, run])
  const remainOrders = useMemo(() => buildRemainOrderRows(orders), [orders])

  const [activeAuxTab, setActiveAuxTab] = useState<AuxTab>('plate_table')
  const [selectedDesignIndex, setSelectedDesignIndex] = useState(0)
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [pendingOnly, setPendingOnly] = useState(false)
  const filteredDesignResult = useMemo(
    () =>
      designResult.filter((row) => {
        if (priorityFilter !== 'all' && row.priority !== priorityFilter) {
          return false
        }
        if (pendingOnly && row.status !== 'pending' && row.status !== 'imported') {
          return false
        }
        return true
      }),
    [designResult, pendingOnly, priorityFilter]
  )

  useEffect(() => {
    if (selectedDesignIndex >= filteredDesignResult.length) {
      setSelectedDesignIndex(0)
    }
  }, [filteredDesignResult.length, selectedDesignIndex])

  const activeDesign =
    filteredDesignResult[selectedDesignIndex] ?? filteredDesignResult[0] ?? null
  const focusedPlateRows = useMemo(
    () =>
      activeDesign
        ? plateTable.filter(
            (row) => row.ordNo === activeDesign.ordNo && row.seq === activeDesign.ordItem
          )
        : plateTable,
    [activeDesign, plateTable]
  )
  const focusedSlabRows = useMemo(
    () =>
      activeDesign
        ? slabTable.filter((row) => row.slabNo === activeDesign.slabNo)
        : slabTable,
    [activeDesign, slabTable]
  )
  const focusedRemainRows = useMemo(
    () =>
      activeDesign
        ? remainOrders.filter(
            (row) => row.ordNo === activeDesign.ordNo && row.ordItem === activeDesign.ordItem
          )
        : remainOrders,
    [activeDesign, remainOrders]
  )

  const avgYield =
    designResult.length > 0
      ? (
          designResult.reduce((sum, row) => sum + Number(row.yieldRate.replace('%', '')), 0) /
          designResult.length
        ).toFixed(1)
      : '0.0'
  const totalPlateWeight = plateTable
    .reduce((sum, row) => sum + Number(row.weight || 0), 0)
    .toFixed(2)
  const totalSlabWeight = (Number(totalPlateWeight) * 1.12).toFixed(2)
  const slabToPlateGap = (
    Number(totalSlabWeight) - Number(totalPlateWeight)
  ).toFixed(2)
  const remainWeight = remainOrders
    .reduce((sum, row) => sum + Number(row.remainWeight || 0), 0)
    .toFixed(2)
  const avgPlanScore =
    designResult.length > 0
      ? (
          designResult.reduce((sum, row) => sum + row.planScore, 0) /
          designResult.length
        ).toFixed(1)
      : '0.0'

  const isResultReady = run
    ? run.status === 'standby' || run.status === 'completed'
    : false
  const isRunning = run
    ? run.status === 'executing' || run.status === 'processing'
    : false
  const heroToneClass = isResultReady
    ? 'from-slate-950 via-slate-900 to-blue-950'
    : isRunning
      ? 'from-slate-900 via-slate-900 to-amber-950'
      : 'from-slate-900 via-slate-900 to-slate-800'

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.35)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
            Planning Outputs
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">结果区</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <MetricChip
            label="design_result"
            value={filteredDesignResult.length}
            tone="blue"
          />
          <MetricChip label="plate_table" value={plateTable.length} tone="slate" />
          <MetricChip label="slab_table" value={slabTable.length} tone="emerald" />
          <MetricChip label="remain_orders" value={remainOrders.length} tone="amber" />
        </div>
      </div>

      <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                isResultReady
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {isResultReady ? '结果已就绪' : '结果预览'}
            </span>
            <span className="text-sm text-slate-600">{getStatusLabel(run?.status)}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(AUX_TAB_LABELS) as AuxTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveAuxTab(tab)}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  activeAuxTab === tab
                    ? 'bg-slate-950 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {AUX_TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <KpiCard label="平均成材率" value={`${avgYield}%`} tone="emerald" />
        <KpiCard label="成品总量" value={`${totalPlateWeight} t`} tone="blue" />
        <KpiCard label="板坯估算量" value={`${totalSlabWeight} t`} tone="slate" />
        <KpiCard label="板坯-成品差" value={`${slabToPlateGap} t`} tone="amber" />
        <KpiCard label="平均方案评分" value={avgPlanScore} tone="blue" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div
          className={`rounded-[24px] border border-slate-200 bg-gradient-to-br p-5 text-white ${heroToneClass}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-blue-200/80">
                主结果视图
              </div>
              <h3 className="mt-2 text-xl font-semibold">design_result</h3>
            </div>
            <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm text-blue-50">
              {getStatusLabel(run?.status)}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <HeroMetric label="平均成材率" value={`${avgYield}%`} />
            <HeroMetric label="主钢种" value={activeDesign?.steel || slabTable[0]?.steel || '-'} />
            <HeroMetric label="剩余重量" value={`${remainWeight} t`} />
            <HeroMetric label="方案评分" value={activeDesign ? `${activeDesign.planScore}` : '-'} />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {(['all', 'high', 'medium', 'low'] as PriorityFilter[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setPriorityFilter(level)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  priorityFilter === level
                    ? 'bg-white text-slate-900'
                    : 'bg-white/10 text-blue-100 hover:bg-white/20'
                }`}
              >
                {getPriorityFilterLabel(level)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPendingOnly((value) => !value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                pendingOnly
                  ? 'bg-amber-300 text-slate-900'
                  : 'bg-white/10 text-blue-100 hover:bg-white/20'
              }`}
            >
              仅看待处理
            </button>
          </div>

          <div className="mt-5">
            <HeroResultTable
              rows={filteredDesignResult}
              selectedIndex={selectedDesignIndex}
              onSelect={setSelectedDesignIndex}
            />
          </div>
        </div>

        <div className="space-y-4">
          <SummaryPanel
            title="当前聚焦"
            rows={[
              ['订单号', activeDesign?.ordNo || '-'],
              ['序列号', activeDesign?.ordItem || '-'],
              ['板坯号', activeDesign?.slabNo || '-'],
              ['钢种', activeDesign?.steel || '-'],
              ['优先级', getPriorityLabel(activeDesign?.priority)],
            ]}
          />
          <SummaryPanel
            title="规格"
            rows={[
              ['板坯规格', activeDesign?.slabShape || '-'],
              ['成品规格', activeDesign?.plateShape || '-'],
              ['交付日期', activeDesign?.delivery || '-'],
              ['重量', activeDesign?.weight ? `${activeDesign.weight} t` : '-'],
            ]}
          />
          <SummaryPanel
            title="执行开关"
            rows={[
              ['stitch', '开启'],
              ['preference', run?.preference_enabled ? '开启' : '关闭'],
              ['test_mode', run?.test_mode_enabled ? '开启' : '关闭'],
              ['short_slab', run?.short_enabled ? '开启' : '关闭'],
              ['cross_group', run?.cross_group_enabled ? '开启' : '关闭'],
            ]}
          />
          <SummaryPanel
            title="联动概览"
            rows={[
              ['plate_table', `${focusedPlateRows.length} 行`],
              ['slab_table', `${focusedSlabRows.length} 行`],
              ['remain_orders', `${focusedRemainRows.length} 行`],
              ['当前标签', AUX_TAB_LABELS[activeAuxTab]],
            ]}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <ResultCard
          title="plate_table"
          count={focusedPlateRows.length}
          accent="slate"
          active={activeAuxTab === 'plate_table'}
        >
          <CompactTable
            columns={['ORD_NO', 'SEQ', 'STEEL', 'BLOCK_SEQ', 'WGT', 'DELIVERY']}
            rows={focusedPlateRows.map((row) => [
              row.ordNo,
              row.seq,
              row.steel,
              row.blockSeq,
              row.weight,
              row.delivery,
            ])}
          />
        </ResultCard>

        <ResultCard
          title="slab_table"
          count={focusedSlabRows.length}
          accent="emerald"
          active={activeAuxTab === 'slab_table'}
        >
          <CompactTable
            columns={['SLAB_NO', 'STEEL', 'SLAB_SHAPE', 'ORDER_CNT', 'MODE']}
            rows={focusedSlabRows.map((row) => [
              row.slabNo,
              row.steel,
              row.slabShape,
              String(row.sourceOrders),
              row.mode,
            ])}
          />
        </ResultCard>

        <ResultCard
          title="remain_orders"
          count={focusedRemainRows.length}
          accent="amber"
          active={activeAuxTab === 'remain_orders'}
        >
          <CompactTable
            columns={['ORD_NO', 'ORD_ITEM', 'STEEL', 'REMAIN_WGT', 'REASON']}
            rows={focusedRemainRows.map((row) => [
              row.ordNo,
              row.ordItem,
              row.steel,
              row.remainWeight,
              row.reason,
            ])}
          />
        </ResultCard>
      </div>
    </section>
  )
}

function HeroResultTable({
  rows,
  selectedIndex,
  onSelect,
}: {
  rows: DesignResultRow[]
  selectedIndex: number
  onSelect: (index: number) => void
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 bg-white/5 p-5 text-sm text-blue-100/70">
        暂无结果
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[20px] border border-white/10 bg-white/5 backdrop-blur">
      <table className="min-w-full divide-y divide-white/10 text-sm">
        <thead className="bg-white/5">
          <tr>
            <HeroTh>#</HeroTh>
            <HeroTh>ORD_NO</HeroTh>
            <HeroTh>ORD_ITEM</HeroTh>
            <HeroTh>STATUS</HeroTh>
            <HeroTh>SLAB_NO</HeroTh>
            <HeroTh>STEEL</HeroTh>
            <HeroTh>SLAB_SHAPE</HeroTh>
            <HeroTh>YIELD</HeroTh>
            <HeroTh>PRIORITY</HeroTh>
            <HeroTh>SCORE</HeroTh>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {rows.slice(0, 8).map((row, index) => {
            const active = index === selectedIndex

            return (
              <tr
                key={`${row.ordNo}-${row.ordItem}`}
                onClick={() => onSelect(index)}
                className={`cursor-pointer transition ${
                  active ? 'bg-white/10' : 'hover:bg-white/6'
                }`}
              >
                <HeroTd>{String(index + 1).padStart(2, '0')}</HeroTd>
                <HeroTd>{row.ordNo}</HeroTd>
                <HeroTd>{row.ordItem}</HeroTd>
                <HeroTd>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${getStatusToneClass(row.status)}`}
                  >
                    {getOrderStatusLabel(row.status)}
                  </span>
                </HeroTd>
                <HeroTd>{row.slabNo}</HeroTd>
                <HeroTd>{row.steel}</HeroTd>
                <HeroTd>{row.slabShape}</HeroTd>
                <HeroTd>
                  <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-emerald-200">
                    {row.yieldRate}
                  </span>
                </HeroTd>
                <HeroTd>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${getPriorityToneClass(row.priority)}`}
                  >
                    {getPriorityLabel(row.priority)}
                  </span>
                </HeroTd>
                <HeroTd>
                  <span className="rounded-full bg-blue-400/15 px-2.5 py-1 text-blue-100">
                    {row.planScore}
                  </span>
                </HeroTd>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ResultCard({
  title,
  count,
  accent,
  active,
  children,
}: {
  title: string
  count: number
  accent: 'slate' | 'emerald' | 'amber'
  active: boolean
  children: React.ReactNode
}) {
  const accentClass = {
    slate: 'from-slate-100 to-white text-slate-700',
    emerald: 'from-emerald-100 to-white text-emerald-700',
    amber: 'from-amber-100 to-white text-amber-700',
  }[accent]

  return (
    <div
      className={`rounded-[22px] border bg-white p-4 shadow-[0_14px_40px_-34px_rgba(15,23,42,0.45)] ${
        active ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200'
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className={`rounded-full bg-gradient-to-r px-3 py-1 text-xs font-medium ${accentClass}`}>
          {title}
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
          {count} 行
        </span>
      </div>
      {children}
    </div>
  )
}

function SummaryPanel({
  title,
  rows,
}: {
  title: string
  rows: Array<[string, string]>
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-3 space-y-2">
        {rows.map(([label, value]) => (
          <div
            key={`${title}-${label}`}
            className="flex items-center justify-between gap-4 rounded-xl bg-white px-3 py-2 text-sm"
          >
            <span className="text-slate-500">{label}</span>
            <span className="font-medium text-slate-800">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MetricChip({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'blue' | 'slate' | 'emerald' | 'amber'
}) {
  const toneClass = {
    blue: 'bg-blue-50 text-blue-700',
    slate: 'bg-slate-100 text-slate-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  }[tone]

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${toneClass}`}>
      {label}: {value}
    </span>
  )
}

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'blue' | 'slate' | 'emerald' | 'amber'
}) {
  const toneClass = {
    blue: 'bg-blue-50 border-blue-100 text-blue-800',
    slate: 'bg-slate-50 border-slate-200 text-slate-800',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-800',
    amber: 'bg-amber-50 border-amber-100 text-amber-800',
  }[tone]

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
      <div className="text-xs font-medium uppercase tracking-wider">{label}</div>
      <div className="mt-2 text-xl font-semibold">{value}</div>
    </div>
  )
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.16em] text-blue-200/70">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  )
}

function HeroTh({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-blue-100/70">
      {children}
    </th>
  )
}

function HeroTd({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-sm text-blue-50">{children}</td>
}

function CompactTable({
  columns,
  rows,
}: {
  columns: string[]
  rows: string[][]
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
        暂无结果
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {rows.slice(0, 6).map((row, rowIndex) => (
              <tr key={`${columns[0]}-${rowIndex}`}>
                {row.map((value, cellIndex) => (
                  <td key={`${rowIndex}-${cellIndex}`} className="px-4 py-3 text-sm text-slate-700">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function buildDesignResultRows(orders: OrderWithSteelGrade[]): DesignResultRow[] {
  return orders.slice(0, 8).map((order, index) => {
    const thickness = formatNumber(order.plate_thickness_mm, 1)
    const width = formatNumber(order.width_mm, 0)
    const length = formatNumber(order.length_mm, 0)
    const slabLength = formatNumber((order.length_mm ?? 0) + 180, 0)
    const slabWidth = formatNumber((order.width_mm ?? 0) + 28, 0)
    const yieldRate = `${Math.max(86, 96 - index).toFixed(1)}%`
    const planScore = Math.max(78, 98 - index * 2)
    const priority: DesignResultRow['priority'] =
      index <= 1 ? 'high' : index <= 4 ? 'medium' : 'low'

    return {
      ordNo: order.order_number,
      ordItem: order.sequence_no,
      slabNo: `SLAB-${String(index + 1).padStart(3, '0')}`,
      steel: order.steel_grade?.standard_steel || '未关联钢种',
      status: order.status,
      slabShape: `${thickness} x ${slabWidth} x ${slabLength}`,
      plateShape: `${thickness} x ${width} x ${length}`,
      yieldRate,
      delivery: order.delivery_date || '-',
      weight: Number(order.weight_tons || 0).toFixed(2),
      planScore,
      priority,
    }
  })
}

function buildPlateTableRows(orders: OrderWithSteelGrade[]): PlateTableRow[] {
  return orders.slice(0, 8).map((order, index) => ({
    ordNo: order.order_number,
    seq: order.sequence_no,
    steel: order.steel_grade?.standard_steel || '未关联钢种',
    blockSeq: String(index + 1).padStart(2, '0'),
    weight: Number(order.weight_tons || 0).toFixed(2),
    delivery: order.delivery_date || '-',
  }))
}

function buildSlabTableRows(
  orders: OrderWithSteelGrade[],
  run: PlanningRun | null
): SlabTableRow[] {
  const grouped = new Map<
    string,
    { count: number; thickness: number; width: number; length: number }
  >()

  orders.forEach((order) => {
    const steel = order.steel_grade?.standard_steel || '未关联钢种'
    const current = grouped.get(steel) || {
      count: 0,
      thickness: order.plate_thickness_mm ?? 0,
      width: order.width_mm ?? 0,
      length: order.length_mm ?? 0,
    }
    current.count += 1
    grouped.set(steel, current)
  })

  return Array.from(grouped.entries())
    .slice(0, 8)
    .map(([steel, value], index) => ({
      slabNo: `S${String(index + 1).padStart(3, '0')}`,
      steel,
      slabShape: `${formatNumber(value.thickness, 1)} x ${formatNumber(value.width + 32, 0)} x ${formatNumber(value.length + 240, 0)}`,
      sourceOrders: value.count,
      mode: getModeLabel(run?.mode),
    }))
}

function buildRemainOrderRows(orders: OrderWithSteelGrade[]): RemainOrderRow[] {
  return orders
    .filter((order) => order.status === 'pending' || order.status === 'imported')
    .slice(0, 6)
    .map((order, index) => ({
      ordNo: order.order_number,
      ordItem: order.sequence_no,
      steel: order.steel_grade?.standard_steel || '未关联钢种',
      remainWeight: Number(Math.max(0.8, Number(order.weight_tons || 0) * 0.18)).toFixed(2),
      reason: index % 2 === 0 ? '待二次组合' : '等待跨组分配',
    }))
}

function formatNumber(value: number | null, digits: number) {
  return Number(value || 0).toFixed(digits)
}

function getModeLabel(mode?: PlanningRun['mode']) {
  const labels: Record<PlanningRun['mode'], string> = {
    balanced: '均衡模式',
    'delivery-first': '交期优先',
    'grade-batch': '钢种聚合',
  }

  return mode ? labels[mode] : '均衡模式'
}

function getStatusLabel(status?: PlanningRun['status']) {
  if (!status) return '草稿'

  const labels: Record<PlanningRun['status'], string> = {
    draft: '草稿',
    waiting: '等待',
    executing: '执行中',
    processing: '处理中',
    standby: '待确认',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消',
  }

  return labels[status]
}

function getPriorityLabel(priority?: DesignResultRow['priority']) {
  if (!priority) return '-'
  if (priority === 'high') return '高'
  if (priority === 'medium') return '中'
  return '低'
}

function getPriorityFilterLabel(level: PriorityFilter) {
  if (level === 'all') return '全部优先级'
  if (level === 'high') return '高优先'
  if (level === 'medium') return '中优先'
  return '低优先'
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

function getStatusToneClass(status: OrderWithSteelGrade['status']) {
  const classes: Record<OrderWithSteelGrade['status'], string> = {
    pending: 'bg-amber-400/20 text-amber-100',
    imported: 'bg-blue-400/20 text-blue-100',
    in_progress: 'bg-cyan-400/20 text-cyan-100',
    completed: 'bg-emerald-400/20 text-emerald-100',
    cancelled: 'bg-slate-400/20 text-slate-100',
  }

  return classes[status]
}

function getPriorityToneClass(priority: DesignResultRow['priority']) {
  const classes: Record<DesignResultRow['priority'], string> = {
    high: 'bg-rose-400/20 text-rose-100',
    medium: 'bg-amber-400/20 text-amber-100',
    low: 'bg-emerald-400/20 text-emerald-100',
  }

  return classes[priority]
}
