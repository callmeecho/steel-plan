import Link from 'next/link'

import { buildMockPlan } from '@v2/lib/mock-plan'
import { loadCurrentPlanSnapshot } from '@v2/lib/result-loader'
import type { PlanSlab, PlanSlabSegment } from '@v2/types/domain'

function formatNumber(value: number, digits = 2) {
  return Number(value || 0).toFixed(digits)
}

function buildPieceRows(segments: PlanSlabSegment[]) {
  return segments.flatMap((segment, segmentIndex) =>
    Array.from({ length: Math.max(segment.qty, 0) }, (_, pieceIndex) => ({
      key: `${segment.orderId}-${segmentIndex}-${pieceIndex}`,
      orderId: segment.orderId,
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

export default async function PlanPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = 'results' } = await searchParams
  const snapshot = await loadCurrentPlanSnapshot()
  const plan = snapshot?.plan ?? buildMockPlan()
  const slabs = Array.isArray(plan.slabs) ? plan.slabs : []
  const maxRollLength =
    slabs.length > 0 ? Math.max(...slabs.map((item) => item.rollLength), 1) : 1

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1400px] px-6 py-6">
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <div className="text-lg font-semibold text-slate-900">计划方案预览</div>
              <div className="mt-1 text-sm text-slate-500">
                {snapshot
                  ? `来源 ${snapshot.sourceDir} / 结果时间 ${snapshot.generatedAt?.replace('T', ' ').slice(0, 19)}`
                  : '当前未检测到结果文件'}
              </div>
            </div>
            <Link
              href="/orders"
              className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              返回 v2
            </Link>
          </div>

          <div className="flex gap-1 border-b border-slate-200 px-5 text-sm">
            {Object.entries(TAB_LABELS).map(([key, label]) => (
              <Link
                key={key}
                href={`/plan-preview?tab=${key}`}
                className={`border-b-2 px-3 py-3 transition ${
                  tab === key
                    ? 'border-blue-600 font-medium text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {tab === 'results' ? (
            <div className="overflow-auto p-5">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
                  <tr className="h-10">
                    <th className="pl-4">板坯号</th>
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
                  {(snapshot?.results ?? []).map((row) => (
                    <tr key={row.slabNo} className="h-10 border-t border-slate-200">
                      <td className="pl-4 font-mono">{row.slabNo}</td>
                      <td>{row.steelGrade}</td>
                      <td>{row.steelDesc}</td>
                      <td>{row.slabThickness}</td>
                      <td>{row.slabWidth}</td>
                      <td>{row.slabLength}</td>
                      <td>{formatNumber(row.rollThickness)}</td>
                      <td>{row.rollWidth}</td>
                      <td>{formatNumber(row.rollLength, 0)}</td>
                      <td>{formatNumber(row.slabWeight, 3)}</td>
                      <td className="font-medium text-emerald-600">
                        {formatNumber(row.yieldRate * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === 'stats' ? (
            <div className="overflow-auto p-5">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
                  <tr className="h-10">
                    <th className="pl-4">断面</th>
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
                    <tr key={row.key} className="h-10 border-t border-slate-200">
                      <td className="pl-4 font-mono">{row.key}</td>
                      <td>{row.slabThickness}</td>
                      <td>{row.slabWidth}</td>
                      <td>{row.slabCount}</td>
                      <td>{formatNumber(row.slabWeight, 3)}</td>
                      <td>{formatNumber(row.steelWeight, 3)}</td>
                      <td className="font-medium text-emerald-600">
                        {formatNumber(row.avgYield * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === 'unscheduled' ? (
            <div className="overflow-auto p-5">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
                  <tr className="h-10">
                    <th className="pl-4">订单号</th>
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
                    <tr key={row.orderId} className="h-10 border-t border-slate-200">
                      <td className="pl-4 font-mono">{row.orderId}</td>
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

          {tab === 'graph' ? (
            <div className="space-y-3 p-5">
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
                  <div key={slab.id} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-start gap-4">
                      <div className="w-10 pt-0.5 text-center font-mono text-[15px] font-semibold text-slate-900">
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
                            <div className="text-[10px] text-slate-500">{label}</div>
                            <div className="font-mono text-slate-900">{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="mb-2 flex items-center justify-between text-[10px] text-slate-500">
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
                                    className="relative flex shrink-0 items-center justify-center overflow-hidden border border-[#2563eb] px-1.5 text-center text-[#0f172a]"
                                    style={{
                                      background: piece.color,
                                      width: `${(piece.length / Math.max(usedLength, 1)) * 100}%`,
                                      minWidth: '66px',
                                      height: `${getPieceHeight(piece.width, slab.rollWidth)}px`,
                                    }}
                                  >
                                    <div className="w-full leading-tight">
                                      <div className="truncate font-mono text-[11px] font-semibold">
                                        {piece.orderId}
                                      </div>
                                      <div className="mt-0.5 text-[10px]">{piece.pieceIndex}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex flex-1 items-center justify-center text-[11px] text-slate-500">
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
        </div>
      </div>
    </main>
  )
}
