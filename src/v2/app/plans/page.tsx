import Link from 'next/link'

import { Topbar } from '@v2/components/layout/Topbar'
import { PlansActions } from '@v2/components/plans/PlansActions'
import { loadCurrentPlanSnapshot } from '@v2/lib/result-loader'
import type { PlanSlab, PlanSlabSegment } from '@v2/types/domain'

const TAB_LABELS: Record<string, string> = {
  results: '优化结果',
  graph: '图形展示',
  unscheduled: '未排订单',
}

const PAGE_SIZE_BY_TAB: Record<string, number> = {
  results: 40,
  graph: 24,
  unscheduled: 80,
}

function formatNumber(value: number, digits = 2) {
  return Number(value || 0).toFixed(digits)
}

function toPositiveInt(value: string | undefined, fallback = 1) {
  const n = Number(value)
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : fallback
}

function buildPieceRows(segments: PlanSlabSegment[]) {
  return segments.map((segment, segmentIndex) => ({
    key: `${segment.orderId}-${segmentIndex}`,
    orderId: segment.orderId,
    thickness: segment.thickness ?? 0,
    width: segment.width ?? 0,
    length: segment.length,
    qty: Math.max(segment.qty, 1),
    displayLength: (segment.length || 0) * Math.max(segment.qty, 1),
    color: segment.color,
  }))
}

function getUsedLength(slab: PlanSlab) {
  return slab.segments.reduce((sum, segment) => sum + segment.length * segment.qty, 0)
}

function getTrackWidth(slab: PlanSlab, maxRollLength: number) {
  const ratio = slab.rollLength / Math.max(maxRollLength, 1)
  return `${Math.max(ratio * 100, 68)}%`
}

function getPieceHeight(pieceWidth: number, rollWidth: number) {
  if (pieceWidth <= 0 || rollWidth <= 0) return 58
  const ratio = pieceWidth / rollWidth
  return Math.max(34, Math.min(72, Math.round(ratio * 72)))
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  return {
    safePage,
    total,
    totalPages,
    pageSize,
    items: items.slice(start, start + pageSize),
  }
}

function makePageHref(taskId: string, tab: string, page: number) {
  return `/plans?taskId=${encodeURIComponent(taskId)}&tab=${encodeURIComponent(tab)}&page=${page}`
}

function PaginationBar({
  taskId,
  tab,
  page,
  totalPages,
  total,
  pageSize,
}: {
  taskId: string
  tab: string
  page: number
  totalPages: number
  total: number
  pageSize: number
}) {
  return (
    <div className="mb-2 flex items-center justify-between text-[11.5px] text-ink-tertiary">
      <span>
        共 <b className="text-ink">{total}</b> 条，每页 {pageSize} 条
      </span>
      <div className="flex items-center gap-2">
        <Link
          href={makePageHref(taskId, tab, 1)}
          className={`rounded border px-2 py-1 ${page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-surface-hover'}`}
        >
          首页
        </Link>
        <Link
          href={makePageHref(taskId, tab, page - 1)}
          className={`rounded border px-2 py-1 ${page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-surface-hover'}`}
        >
          上一页
        </Link>
        <span className="font-mono text-[11px]">
          第 {page} / {totalPages} 页
        </span>
        <Link
          href={makePageHref(taskId, tab, page + 1)}
          className={`rounded border px-2 py-1 ${page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-surface-hover'}`}
        >
          下一页
        </Link>
        <Link
          href={makePageHref(taskId, tab, totalPages)}
          className={`rounded border px-2 py-1 ${page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-surface-hover'}`}
        >
          末页
        </Link>
      </div>
    </div>
  )
}

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{ taskId?: string; tab?: string; page?: string; slab?: string }>
}) {
  const { taskId = 'current', tab: rawTab = 'graph', page = '1', slab: slabNo = '' } =
    await searchParams
  const tab = rawTab === 'stats' ? 'graph' : rawTab
  const currentPage = toPositiveInt(page, 1)

  const snapshot = await loadCurrentPlanSnapshot(taskId)
  const plan = snapshot?.plan ?? null
  const slabs = Array.isArray(plan?.slabs) ? plan.slabs : []

  const kpi = plan?.kpi ?? {
    avgYield: 0,
    steelWeight: 0,
    slabWeight: 0,
    slabCount: 0,
    scheduledOrders: 0,
    unscheduledOrders: 0,
  }

  const completionRate =
    kpi.scheduledOrders + kpi.unscheduledOrders > 0
      ? (kpi.scheduledOrders / (kpi.scheduledOrders + kpi.unscheduledOrders)) * 100
      : 0
  const pageSize = PAGE_SIZE_BY_TAB[tab] ?? 40
  const resultsPage = paginate(slabs, currentPage, pageSize)
  const graphPage = paginate(slabs, currentPage, pageSize)
  const statsRows = snapshot?.stats ?? []
  const unscheduledRows = snapshot?.unscheduled ?? []
  const statsPage = paginate(statsRows, currentPage, pageSize)
  const unscheduledPage = paginate(unscheduledRows, currentPage, pageSize)

  const graphSlabs = graphPage.items
  const selectedSlab =
    slabs.find((item) => item.slabNo === slabNo || item.id === slabNo) ??
    resultsPage.items[0] ??
    null
  const maxRollLength =
    graphSlabs.length > 0 ? Math.max(...graphSlabs.map((item) => item.rollLength), 1) : 1

  return (
    <>
      <Topbar crumb="计划方案" sub={TAB_LABELS[tab] || TAB_LABELS.graph} />

      <div className="flex items-center justify-between border-b border-edge bg-white px-[18px] pt-3 pb-2.5">
        <div>
          <div className="text-[16px] font-semibold">计划方案</div>
          <div className="mt-0.5 text-[11.5px] text-ink-tertiary">
            {snapshot?.generatedAt
              ? `结果时间 ${snapshot.generatedAt.replace('T', ' ').slice(0, 19)}`
              : '当前未检测到结果'}
          </div>
        </div>
        <PlansActions taskId={taskId} tab={tab} />
      </div>

      <div className="grid grid-cols-4 gap-3 border-b border-edge bg-white px-[18px] py-3">
        {[
          ['平均成材率', `${formatNumber(kpi.avgYield * 100)}%`, `当前板坯 ${kpi.slabCount} 块`],
          ['钢板总重量', `${formatNumber(kpi.steelWeight)} t`, `已排 ${kpi.scheduledOrders} 条订单`],
          ['板坯总重量', `${formatNumber(kpi.slabWeight)} t`, `共 ${kpi.slabCount} 块板坯`],
          ['订单完成度', `${formatNumber(completionRate, 1)}%`, `未排 ${kpi.unscheduledOrders} 条`],
        ].map(([label, value, sub]) => (
          <div key={label} className="rounded-md border border-edge bg-surface-subtle p-3">
            <div className="text-[10.5px] text-ink-tertiary">{label}</div>
            <div className="mt-1 font-mono text-[20px] font-semibold">{value}</div>
            <div className="mt-0.5 text-[10.5px] text-ink-tertiary">{sub}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-edge bg-white px-[18px] text-[12px]">
        {Object.entries(TAB_LABELS).map(([key, label]) => (
          <Link
            key={key}
            href={`/plans?taskId=${encodeURIComponent(taskId)}&tab=${encodeURIComponent(key)}`}
            className={`border-b-2 px-3 py-2 transition ${
              tab === key
                ? 'border-accent font-medium text-accent'
                : 'border-transparent text-ink-secondary hover:text-ink'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {tab === 'graph' ? (
          <div className="space-y-3 p-[18px]">
            <PaginationBar
              taskId={taskId}
              tab={tab}
              page={graphPage.safePage}
              totalPages={graphPage.totalPages}
              total={graphPage.total}
              pageSize={graphPage.pageSize}
            />
            {graphSlabs.map((slab, index) => {
              const pieces = buildPieceRows(slab.segments || [])
              const usedLength = getUsedLength(slab)
              const fallbackRate = usedLength / Math.max(slab.rollLength, 1)
              const fillRate = Math.max(
                0,
                Math.min(1, slab.yieldRate > 0 ? slab.yieldRate : fallbackRate),
              )
              const displayedUsedLength = slab.rollLength * fillRate
              const maxPieceHeight = Math.max(
                ...pieces.map((piece) => getPieceHeight(piece.width, slab.rollWidth)),
                58,
              )
              const usedAreaWidth = `${Math.min(fillRate * 100, 100)}%`

              return (
                <div
                  key={slab.id}
                  className="rounded-lg border border-edge bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                >
                  <div className="mb-3 flex items-start gap-4">
                    <div className="w-10 shrink-0 pt-0.5 text-center font-mono text-[15px] font-semibold text-ink">
                      #{(graphPage.safePage - 1) * graphPage.pageSize + index + 1}
                    </div>
                    <div className="grid flex-1 grid-cols-8 gap-x-4 gap-y-1 text-[11px]">
                      {[
                        ['钢种', slab.grade],
                        ['板坯厚', slab.slabThickness],
                        ['板坯宽', slab.slabWidth],
                        ['板坯长', slab.slabLength],
                        ['轧件厚', formatNumber(slab.rollThickness)],
                        ['轧件宽', slab.rollWidth],
                        ['轧件长', formatNumber(slab.rollLength, 0)],
                        ['成材率', `${formatNumber(slab.yieldRate * 100)}%`],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <div className="text-[10px] text-ink-tertiary">{label}</div>
                          <div
                            className={`font-mono ${
                              label === '成材率' ? 'font-semibold text-success' : 'text-ink'
                            }`}
                          >
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-edge bg-surface-subtle/70 px-4 py-4">
                    <div className="mb-2 flex items-center justify-between text-[10px] text-ink-tertiary">
                      <span>轧件排布示意</span>
                      <span className="font-mono">
                        已排 {formatNumber(displayedUsedLength, 0)} / {formatNumber(slab.rollLength, 0)}
                      </span>
                    </div>

                    <div className="flex justify-center">
                      <div
                        className="rounded-lg border border-[#bfd4ff] bg-[#e9f2ff] px-3 py-3"
                        style={{ width: getTrackWidth(slab, maxRollLength) }}
                      >
                        <div
                          className="flex items-center justify-center overflow-hidden rounded-md border border-white/70 bg-[#d9e9ff] px-4 py-5"
                          style={{ minHeight: `${maxPieceHeight + 40}px` }}
                        >
                          {pieces.length > 0 ? (
                            <div
                              className="flex items-center justify-center self-center"
                              style={{ width: usedAreaWidth, minWidth: '66px' }}
                            >
                              {pieces.map((piece) => (
                                <div
                                  key={piece.key}
                                  className="relative flex shrink-0 items-center justify-center overflow-hidden border border-[#2563eb] px-1.5 text-center text-[#0f172a] shadow-[inset_0_-1px_0_rgba(255,255,255,0.15)]"
                                  style={{
                                    background: piece.color,
                                    width: `${(piece.displayLength / Math.max(usedLength, 1)) * 100}%`,
                                    minWidth: '66px',
                                    height: `${getPieceHeight(piece.width, slab.rollWidth)}px`,
                                  }}
                                >
                                  <div className="w-full leading-tight">
                                    <div className="truncate font-mono text-[11px] font-semibold">
                                      {piece.orderId}
                                    </div>
                                    <div className="mt-0.5 text-[10px]">x {piece.qty}</div>
                                    {piece.width > 0 ? (
                                      <div className="text-[9px] opacity-75">
                                        W {formatNumber(piece.width, 0)}
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-1 items-center justify-center text-[11px] text-ink-tertiary">
                              当前结果未解析到订单排布数据
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}

        {tab === 'results' ? (
          <div className="overflow-auto p-[18px]">
            <PaginationBar
              taskId={taskId}
              tab={tab}
              page={resultsPage.safePage}
              totalPages={resultsPage.totalPages}
              total={resultsPage.total}
              pageSize={resultsPage.pageSize}
            />
            {slabs.length === 0 ? (
              <div className="rounded-md border border-dashed border-edge bg-white px-6 py-16 text-center text-[12px] text-ink-tertiary">
                当前未检测到优化结果
              </div>
            ) : (
              <>
              <table className="w-full min-w-[1160px] text-[12px] tabular-nums">
                <thead className="bg-surface-subtle text-left text-[11px] text-ink-tertiary">
                  <tr className="h-9">
                    <th className="pl-3.5">板坯编号</th>
                    <th>钢种</th>
                    <th>板坯厚</th>
                    <th>板坯宽</th>
                    <th>板坯长</th>
                    <th>轧件厚</th>
                    <th>轧件宽</th>
                    <th>轧件长</th>
                    <th>板坯重量</th>
                    <th>成材率</th>
                    <th className="text-right pr-3.5">明细</th>
                  </tr>
                </thead>
                <tbody>
                  {resultsPage.items.map((slab, index) => {
                    const resultRow = snapshot?.results.find((row) => row.slabNo === slab.slabNo)
                    return (
                      <tr key={slab.id} className="h-9 border-t border-edge align-top hover:bg-surface-hover">
                        <td className="pl-3.5 font-mono">
                          {(resultsPage.safePage - 1) * resultsPage.pageSize + index + 1}
                        </td>
                        <td>{slab.grade || '-'}</td>
                        <td>{slab.slabThickness || '-'}</td>
                        <td>{slab.slabWidth || '-'}</td>
                        <td>{slab.slabLength || '-'}</td>
                        <td>{formatNumber(slab.rollThickness)}</td>
                        <td>{slab.rollWidth || '-'}</td>
                        <td>{formatNumber(slab.rollLength, 0)}</td>
                        <td>{formatNumber(resultRow?.slabWeight ?? 0, 3)}</td>
                        <td className="font-medium text-success">{formatNumber(slab.yieldRate * 100)}%</td>
                        <td className="pr-3.5 text-right">
                          <Link
                            href={`/plans?taskId=${encodeURIComponent(taskId)}&tab=results&page=${resultsPage.safePage}&slab=${encodeURIComponent(slab.slabNo)}`}
                            className="rounded border border-edge px-2 py-1 text-[11px] text-ink-secondary hover:bg-surface-hover"
                          >
                            查看
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {selectedSlab ? (
                <div className="mt-3 rounded-lg border border-edge bg-white p-3">
                  <div className="mb-2 text-[12px] font-semibold">
                    板坯 {selectedSlab.slabNo} 订单明细
                  </div>
                  <table className="w-full text-[12px] tabular-nums">
                    <thead className="bg-surface-subtle text-left text-[11px] text-ink-tertiary">
                      <tr className="h-8">
                        <th className="pl-3">订单号</th>
                        <th>厚度</th>
                        <th>宽度</th>
                        <th>长度</th>
                        <th>数量</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedSlab.segments ?? []).map((segment, idx) => (
                        <tr key={`${selectedSlab.id}-detail-${idx}`} className="h-8 border-t border-edge hover:bg-surface-hover">
                          <td className="pl-3 font-mono">{segment.orderId ?? '-'}</td>
                          <td>{segment ? formatNumber(segment.thickness ?? 0) : '-'}</td>
                          <td>{segment?.width ?? '-'}</td>
                          <td>{segment?.length ?? '-'}</td>
                          <td>{segment?.qty ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              </>
            )}
          </div>
        ) : null}

        {tab === 'stats' ? (
          <div className="overflow-auto p-[18px]">
            <PaginationBar
              taskId={taskId}
              tab={tab}
              page={statsPage.safePage}
              totalPages={statsPage.totalPages}
              total={statsPage.total}
              pageSize={statsPage.pageSize}
            />
            <table className="w-full text-[12px] tabular-nums">
              <thead className="bg-surface-subtle text-left text-[11px] text-ink-tertiary">
                <tr className="h-9">
                  <th className="pl-3.5">断面</th>
                  <th>板坯厚</th>
                  <th>板坯宽</th>
                  <th>板坯数</th>
                  <th>板坯总重量 (t)</th>
                  <th>钢板总重量 (t)</th>
                  <th>平均成材率</th>
                </tr>
              </thead>
              <tbody>
                {statsPage.items.map((row) => (
                  <tr key={row.key} className="h-9 border-t border-edge hover:bg-surface-hover">
                    <td className="pl-3.5 font-mono">{row.key}</td>
                    <td>{row.slabThickness}</td>
                    <td>{row.slabWidth}</td>
                    <td>{row.slabCount}</td>
                    <td>{formatNumber(row.slabWeight, 3)}</td>
                    <td>{formatNumber(row.steelWeight, 3)}</td>
                    <td className="font-medium text-success">{formatNumber(row.avgYield * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {tab === 'unscheduled' ? (
          <div className="overflow-auto p-[18px]">
            <PaginationBar
              taskId={taskId}
              tab={tab}
              page={unscheduledPage.safePage}
              totalPages={unscheduledPage.totalPages}
              total={unscheduledPage.total}
              pageSize={unscheduledPage.pageSize}
            />
            <table className="w-full text-[12px] tabular-nums">
              <thead className="bg-surface-subtle text-left text-[11px] text-ink-tertiary">
                <tr className="h-9">
                  <th className="pl-3.5">订单号</th>
                  <th>钢种说明</th>
                  <th>钢种</th>
                  <th>厚度</th>
                  <th>宽度</th>
                  <th>长度</th>
                  <th>数量</th>
                  <th>订单重量 (t)</th>
                  <th>约束</th>
                </tr>
              </thead>
              <tbody>
                {unscheduledPage.items.map((row) => (
                  <tr key={row.orderId} className="h-9 border-t border-edge hover:bg-surface-hover">
                    <td className="pl-3.5 font-mono">{row.orderId}</td>
                    <td>{row.steelDesc}</td>
                    <td>{row.steelGrade}</td>
                    <td>{row.plateThickness}</td>
                    <td>{row.plateWidth}</td>
                    <td>{row.plateLength}</td>
                    <td>{row.qty}</td>
                    <td>{formatNumber(row.weight, 3)}</td>
                    <td>{row.constraint}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </>
  )
}
