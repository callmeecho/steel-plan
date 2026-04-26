import Link from 'next/link'

import { Topbar } from '../../../../components/layout/Topbar'
import { TaskActionButtons } from '../../../../components/tasks/TaskActionButtons'
import { buildMockPlan } from '../../../../lib/mock-plan'
import { loadCurrentPlanSnapshot } from '../../../../lib/result-loader'
import { getTaskSnapshot } from '../../../../lib/task-snapshot-store'
import type { PlanSlab, PlanSlabSegment } from '../../../../types/domain'

function formatNumber(value: number, digits = 2) {
  return Number(value || 0).toFixed(digits)
}

function buildPieceRows(segments: PlanSlabSegment[]) {
  return segments.flatMap((segment, segmentIndex) =>
    Array.from({ length: Math.max(segment.qty, 0) }, (_, pieceIndex) => ({
      key: `${segment.orderId}-${segmentIndex}-${pieceIndex}`,
      orderId: segment.orderId,
      thickness: segment.thickness ?? 0,
      width: segment.width ?? 0,
      length: segment.length,
      color: segment.color,
      pieceIndex: pieceIndex + 1,
    }))
  )
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

const TAB_LABELS: Record<string, string> = {
  results: '优化结果',
  graph: '图形展示',
  stats: '板坯统计',
  unscheduled: '未排订单',
}

export default async function PlansPage({
  params,
  searchParams,
}: {
  params: Promise<{ taskId: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { taskId } = await params
  const { tab = 'graph' } = await searchParams
  const snapshot = await loadCurrentPlanSnapshot()
  const taskSnapshot = taskId === 'current' ? null : await getTaskSnapshot(taskId)
  const plan = snapshot?.plan ?? buildMockPlan()
  const slabs = Array.isArray(plan.slabs) ? plan.slabs : []
  const maxRollLength =
    slabs.length > 0 ? Math.max(...slabs.map((item) => item.rollLength), 1) : 1
  const completionRate =
    plan.kpi.scheduledOrders + plan.kpi.unscheduledOrders > 0
      ? (plan.kpi.scheduledOrders /
          (plan.kpi.scheduledOrders + plan.kpi.unscheduledOrders)) *
        100
      : 0

  return (
    <>
      <Topbar crumb="计划方案" sub={TAB_LABELS[tab] || TAB_LABELS.graph} />

      <div className="flex items-center justify-between border-b border-edge bg-white px-[18px] pt-3 pb-2.5">
        <div>
          <div className="text-[16px] font-semibold">计划方案</div>
          <div className="mt-0.5 text-[11.5px] text-ink-tertiary">
            {snapshot
              ? `来源 ${snapshot.sourceDir} / 结果时间 ${snapshot.generatedAt?.replace('T', ' ').slice(0, 19)}`
              : '当前未检测到结果文件'}
          </div>
        </div>
        <TaskActionButtons
          taskId={taskSnapshot?.id ?? taskId}
          sourceDir={snapshot?.sourceDir ?? null}
        />
      </div>

      <div className="grid grid-cols-4 gap-3 border-b border-edge bg-white px-[18px] py-3">
        {[
          ['平均成材率', `${formatNumber(plan.kpi.avgYield * 100)}%`, `当前板坯 ${plan.kpi.slabCount} 块`],
          ['钢板总重量', `${formatNumber(plan.kpi.steelWeight)} t`, `已排 ${plan.kpi.scheduledOrders} 条订单`],
          ['板坯总重量', `${formatNumber(plan.kpi.slabWeight)} t`, `共 ${plan.kpi.slabCount} 块板坯`],
          ['订单完成度', `${formatNumber(completionRate, 1)}%`, `未排 ${plan.kpi.unscheduledOrders} 条`],
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
            href={`?tab=${key}`}
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
            {slabs.map((slab, index) => {
              const pieces = buildPieceRows(slab.segments || [])
              const usedLength = getUsedLength(slab)
              const fillRate = usedLength / Math.max(slab.rollLength, 1)
              const maxPieceHeight = Math.max(
                ...pieces.map((piece) => getPieceHeight(piece.width, slab.rollWidth)),
                58
              )
              const usedAreaWidth = `${Math.min(fillRate * 100, 100)}%`

              return (
                <div
                  key={slab.id}
                  className="rounded-lg border border-edge bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                >
                  <div className="mb-3 flex items-start gap-4">
                    <div className="w-10 shrink-0 pt-0.5 text-center font-mono text-[15px] font-semibold text-ink">
                      #{index + 1}
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
                        已排 {formatNumber(usedLength, 0)} / {formatNumber(slab.rollLength, 0)}
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
                                    width: `${(piece.length / Math.max(usedLength, 1)) * 100}%`,
                                    minWidth: '66px',
                                    height: `${getPieceHeight(piece.width, slab.rollWidth)}px`,
                                  }}
                                  title={`${piece.orderId} / ${piece.length} x 1 / 宽 ${formatNumber(piece.width, 0)}`}
                                >
                                  <div className="w-full leading-tight">
                                    <div className="truncate font-mono text-[11px] font-semibold">
                                      {piece.orderId}
                                    </div>
                                    <div className="mt-0.5 text-[10px]">
                                      {piece.pieceIndex}
                                    </div>
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

                        <div className="mt-2 flex justify-between font-mono text-[10px] text-ink-tertiary">
                          <span>0</span>
                          <span>{formatNumber(slab.rollLength / 2, 0)}</span>
                          <span>{formatNumber(slab.rollLength, 0)} mm</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      {slab.segments.map((segment, segmentIndex) => (
                        <div
                          key={`${segment.orderId}-${segmentIndex}`}
                          className="inline-flex items-center gap-2 rounded-full border border-edge bg-white px-2.5 py-1 text-[10px] text-ink-secondary"
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: segment.color }}
                          />
                          <span className="font-mono text-ink">{segment.orderId}</span>
                          <span>
                            {formatNumber(segment.length, 0)} x {segment.qty}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}

        {tab === 'results' ? (
          <div className="overflow-auto p-[18px]">
            <table className="w-full text-[12px] tabular-nums">
              <thead className="bg-surface-subtle text-left text-[11px] text-ink-tertiary">
                <tr className="h-9">
                  <th className="pl-3.5">板坯号</th>
                  <th>钢种</th>
                  <th>钢种说明</th>
                  <th>板坯厚</th>
                  <th>板坯宽</th>
                  <th>板坯长</th>
                  <th>轧件厚</th>
                  <th>轧件宽</th>
                  <th>轧件长</th>
                  <th>板坯重量 (t)</th>
                  <th>成材率</th>
                </tr>
              </thead>
              <tbody>
                {(snapshot?.results ?? []).slice(0, 200).map((row) => (
                  <tr
                    key={row.slabNo}
                    className="h-9 border-t border-edge hover:bg-surface-hover"
                  >
                    <td className="pl-3.5 font-mono">{row.slabNo}</td>
                    <td>{row.steelGrade}</td>
                    <td>{row.steelDesc}</td>
                    <td>{row.slabThickness}</td>
                    <td>{row.slabWidth}</td>
                    <td>{row.slabLength}</td>
                    <td>{formatNumber(row.rollThickness)}</td>
                    <td>{row.rollWidth}</td>
                    <td>{formatNumber(row.rollLength, 0)}</td>
                    <td>{formatNumber(row.slabWeight, 3)}</td>
                    <td className="font-medium text-success">
                      {formatNumber(row.yieldRate * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {tab === 'stats' ? (
          <div className="overflow-auto p-[18px]">
            <table className="w-full text-[12px] tabular-nums">
              <thead className="bg-surface-subtle text-left text-[11px] text-ink-tertiary">
                <tr className="h-9">
                  <th className="pl-3.5">断面</th>
                  <th>板坯厚</th>
                  <th>板坯宽</th>
                  <th>板坯数</th>
                  <th>板坯总重 (t)</th>
                  <th>钢板总重 (t)</th>
                  <th>平均成材率</th>
                </tr>
              </thead>
              <tbody>
                {(snapshot?.stats ?? []).map((row) => (
                  <tr
                    key={row.key}
                    className="h-9 border-t border-edge hover:bg-surface-hover"
                  >
                    <td className="pl-3.5 font-mono">{row.key}</td>
                    <td>{row.slabThickness}</td>
                    <td>{row.slabWidth}</td>
                    <td>{row.slabCount}</td>
                    <td>{formatNumber(row.slabWeight, 3)}</td>
                    <td>{formatNumber(row.steelWeight, 3)}</td>
                    <td className="font-medium text-success">
                      {formatNumber(row.avgYield * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {tab === 'unscheduled' ? (
          <div className="overflow-auto p-[18px]">
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
                {(snapshot?.unscheduled ?? []).map((row) => (
                  <tr
                    key={row.orderId}
                    className="h-9 border-t border-edge hover:bg-surface-hover"
                  >
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
