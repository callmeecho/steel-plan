import type { Order, Plan, PlanSlab } from '../types/domain'
import type { LoadedPlanSnapshot, ResultStatsRow, ResultUnscheduledRow } from './result-loader'
import type { V2SectionRow, V2ThicknessRuleRow } from './server-data'

type BuildDemoSnapshotInput = {
  taskId: string
  options: {
    preferLargeSection: boolean
    allowNonStandard: boolean
    allowLongSlab: boolean
    balanceYield: boolean
    respectDueDate: boolean
  }
  orders: Order[]
  requestedOrders: Order[]
  sectionRows: V2SectionRow[]
  thicknessRules: V2ThicknessRuleRow[]
}

export function buildDemoPlanSnapshot(input: BuildDemoSnapshotInput): LoadedPlanSnapshot {
  const { taskId, options, orders, requestedOrders, sectionRows, thicknessRules } = input
  const seeded = createSeededRandom(taskId)

  const sortedOrders = [...orders].sort((a, b) => {
    if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate)
    if (a.grade !== b.grade) return a.grade.localeCompare(b.grade, 'zh-CN')
    if (a.width !== b.width) return b.width - a.width
    return b.length - a.length
  })

  const scheduledOrders = [...sortedOrders]
  const unscheduledOrders: Order[] = []

  const slabs = buildSlabs({
    taskId,
    orders: scheduledOrders,
    sectionRows,
    thicknessRules,
    seeded,
  })

  const slabWeight = slabs.reduce((sum, slab) => sum + estimateSlabWeight(slab), 0)
  const steelWeight = slabs.reduce((sum, slab) => sum + estimateSlabWeight(slab) * slab.yieldRate, 0)
  const avgYield =
    slabWeight > 0 ? slabs.reduce((sum, slab) => sum + slab.yieldRate, 0) / slabs.length : 0

  const results = slabs.map((slab) => ({
    slabNo: slab.slabNo,
    steelGrade: slab.grade,
    steelDesc: slab.steelDesc || slab.grade,
    slabThickness: slab.slabThickness,
    slabWidth: slab.slabWidth,
    slabLength: slab.slabLength,
    slabWeight: estimateSlabWeight(slab),
    rollThickness: slab.rollThickness,
    rollWidth: slab.rollWidth,
    rollLength: slab.rollLength,
    yieldRate: slab.yieldRate,
  }))

  const stats = buildStats(results)
  const unscheduled = unscheduledOrders.map((order) => toUnscheduled(order))
  const requestedOrderIds = requestedOrders.map((order) => formatOrderId(order))
  const effectiveOrderIds = sortedOrders.map((order) => formatOrderId(order))
  const requestedWeight = requestedOrders.reduce((sum, item) => sum + Number(item.weight || 0), 0)
  const effectiveWeight = sortedOrders.reduce((sum, item) => sum + Number(item.weight || 0), 0)
  const requestedGradeCount = new Set(requestedOrders.map((item) => item.grade).filter(Boolean)).size
  const effectiveGradeCount = new Set(sortedOrders.map((item) => item.grade).filter(Boolean)).size

  const scheduledSet = new Set(
    slabs.flatMap((slab) => slab.segments.map((segment) => segment.orderId).filter(Boolean)),
  )
  const unscheduledSet = new Set(unscheduled.map((item) => item.orderId).filter(Boolean))
  const actualSet = new Set([...scheduledSet, ...unscheduledSet])
  const expectedSet = new Set(effectiveOrderIds)
  const missingOrders = [...expectedSet].filter((id) => !actualSet.has(id))
  const extraOrders = [...actualSet].filter((id) => !expectedSet.has(id))

  const plan: Plan = {
    id: `PLAN-${taskId}`,
    taskId,
    name: `排产方案 ${taskId}`,
    strategy: '演示方案（Supabase快照）',
    params: options,
    kpi: {
      avgYield,
      steelWeight,
      slabWeight,
      slabCount: slabs.length,
      scheduledOrders: scheduledOrders.length,
      unscheduledOrders: unscheduledOrders.length,
      urgentHitRate: 0.8,
      dueHitRate:
        sortedOrders.length > 0 ? scheduledOrders.length / Math.max(sortedOrders.length, 1) : 0,
    },
    runtime: Math.max(2.5, Math.round((1.2 + slabs.length * 0.35) * 10) / 10),
    recommended: true,
    status: 'draft',
    slabs,
    unscheduledOrderIds: unscheduled.map((row) => row.orderId),
  }

  return {
    plan,
    sourceDir: 'supabase://optimization_plan_results',
    generatedAt: new Date().toISOString(),
    results,
    stats,
    unscheduled,
    sourceMeta: {
      requestedOrderCount: requestedOrderIds.length,
      effectiveOrderCount: effectiveOrderIds.length,
      filteredOutCount: Math.max(requestedOrderIds.length - effectiveOrderIds.length, 0),
      requestedWeightTons: Number(requestedWeight.toFixed(3)),
      effectiveWeightTons: Number(effectiveWeight.toFixed(3)),
      requestedUniqueGradeCount: requestedGradeCount,
      effectiveUniqueGradeCount: effectiveGradeCount,
    },
    consistency: {
      expectedOrderCount: expectedSet.size,
      actualOrderCount: actualSet.size,
      missingOrderCount: missingOrders.length,
      extraOrderCount: extraOrders.length,
      coverageRate:
        expectedSet.size > 0 ? Number(((expectedSet.size - missingOrders.length) / expectedSet.size).toFixed(4)) : 1,
      strictMatched: missingOrders.length === 0 && extraOrders.length === 0,
    },
  }
}

function buildSlabs({
  taskId,
  orders,
  sectionRows,
  thicknessRules,
  seeded,
}: {
  taskId: string
  orders: Order[]
  sectionRows: V2SectionRow[]
  thicknessRules: V2ThicknessRuleRow[]
  seeded: () => number
}) {
  const MAX_ROLL_LENGTH = 42000
  const MIN_ROLL_LENGTH = 18000
  const MAX_SEGMENTS_PER_SLAB = 4
  const MAX_SEGMENT_QTY = 2

  const chunks = chunkOrders(orders, seeded, 2, 5)
  return chunks.map((chunk, index) => {
    const repr = chunk[0]
    const targetYield = clamp(0.86 + seeded() * 0.06, 0.84, 0.92)
    const usableLengthBudget = Math.max(12000, MAX_ROLL_LENGTH * targetYield - 800)

    const segmentPieces: Array<{
      orderId: string
      thickness: number
      width: number
      length: number
      qty: number
      color: string
    }> = []

    let usedLength = 0
    for (const order of chunk.slice(0, MAX_SEGMENTS_PER_SLAB)) {
      const unitLength = Math.max(500, order.length)
      const remaining = usableLengthBudget - usedLength
      if (remaining <= 0) break

      const maxQtyByLength = Math.max(1, Math.floor(remaining / unitLength))
      const preferredQty = Math.max(1, Math.min(order.qty, MAX_SEGMENT_QTY))
      const qty = Math.max(1, Math.min(preferredQty, maxQtyByLength))

      segmentPieces.push({
        orderId: formatOrderId(order),
        thickness: order.thickness,
        width: order.width,
        length: unitLength,
        qty,
        color: colorByOrderId(formatOrderId(order)),
      })

      usedLength += unitLength * qty
    }

    if (segmentPieces.length === 0) {
      const fallback = repr
      segmentPieces.push({
        orderId: formatOrderId(fallback),
        thickness: fallback.thickness,
        width: fallback.width,
        length: Math.max(500, fallback.length),
        qty: 1,
        color: colorByOrderId(formatOrderId(fallback)),
      })
      usedLength = segmentPieces[0].length
    }

    const rollLength = clamp(
      Math.max(usedLength / targetYield, usedLength + 200),
      Math.max(MIN_ROLL_LENGTH, usedLength + 120),
      MAX_ROLL_LENGTH,
    )
    const rollWidth = Math.max(...segmentPieces.map((item) => item.width)) + 40
    const rollThickness = average(chunk.map((item) => item.rollThickness || item.thickness)) + 0.15
    const slabChoice = pickSlabDimensions({
      rollWidth,
      rollThickness,
      sectionRows,
      thicknessRules,
    })

    const slabLength = Math.max(
      900,
      Math.round(
        (rollLength * rollWidth * Math.max(rollThickness, 1)) /
          Math.max(slabChoice.slabWidth * slabChoice.slabThickness, 1),
      ),
    )

    return {
      id: `slab-${taskId}-${index + 1}`,
      planId: `PLAN-${taskId}`,
      slabNo: String(index + 1),
      grade: repr.grade,
      steelDesc: repr.grade,
      slabThickness: slabChoice.slabThickness,
      slabWidth: slabChoice.slabWidth,
      slabLength,
      rollThickness,
      rollWidth,
      rollLength,
      yieldRate: clamp(usedLength / rollLength, 0.75, 0.97),
      segments: segmentPieces,
    }
  })
}

function pickSlabDimensions({
  rollWidth,
  rollThickness,
  sectionRows,
  thicknessRules,
}: {
  rollWidth: number
  rollThickness: number
  sectionRows: V2SectionRow[]
  thicknessRules: V2ThicknessRuleRow[]
}) {
  const enabled = sectionRows
    .filter((item) => item.enabled && item.thickness !== null && item.width !== null)
    .map((item) => ({
      thickness: Number(item.thickness),
      width: Number(item.width),
    }))

  if (enabled.length > 0) {
    const nearest = [...enabled].sort((a, b) => {
      const da = Math.abs(a.width - rollWidth)
      const db = Math.abs(b.width - rollWidth)
      return da - db
    })[0]

    return {
      slabThickness: Number(nearest.thickness) || 220,
      slabWidth: Number(nearest.width) || Math.round(rollWidth / 5) * 5,
    }
  }

  const matchRule = thicknessRules.find(
    (rule) =>
      rule.plateMin !== null &&
      rule.plateMax !== null &&
      rule.slabMin !== null &&
      rule.slabMax !== null &&
      rollThickness >= rule.plateMin &&
      rollThickness <= rule.plateMax,
  )

  if (matchRule && matchRule.slabMin !== null && matchRule.slabMax !== null) {
    return {
      slabThickness: Math.round((matchRule.slabMin + matchRule.slabMax) / 2),
      slabWidth: Math.round(rollWidth / 5) * 5,
    }
  }

  return {
    slabThickness: Math.max(180, Math.round(rollThickness * 10)),
    slabWidth: Math.round(rollWidth / 5) * 5,
  }
}

function chunkOrders(
  orders: Order[],
  seeded: () => number,
  minChunkSize: number,
  maxChunkSize: number,
) {
  const chunks: Order[][] = []
  const pool = [...orders]

  while (pool.length > 0) {
    const seed = pool.shift()
    if (!seed) break

    const targetSize = Math.min(
      pool.length + 1,
      Math.max(minChunkSize, Math.min(maxChunkSize, 2 + Math.floor(seeded() * 4))),
    )

    const ranked = pool
      .map((candidate, index) => {
        const widthGap = Math.abs(candidate.width - seed.width)
        const thicknessGap = Math.abs(candidate.thickness - seed.thickness)
        const gradePenalty = candidate.grade === seed.grade ? 0 : 80
        const sameOrderPenalty = candidate.orderId === seed.orderId ? 1200 : 0
        const score = widthGap + thicknessGap * 18 + gradePenalty + sameOrderPenalty
        return { index, score }
      })
      .sort((a, b) => a.score - b.score)
      .slice(0, Math.max(targetSize - 1, 0))
      .sort((a, b) => b.index - a.index)

    const chunk: Order[] = [seed]
    for (const item of ranked) {
      const picked = pool.splice(item.index, 1)[0]
      if (picked) chunk.push(picked)
    }

    chunks.push(chunk)
  }

  return chunks
}

function toUnscheduled(order: Order): ResultUnscheduledRow {
  return {
    orderId: formatOrderId(order),
    steelDesc: order.grade,
    steelGrade: order.grade,
    plateThickness: order.thickness,
    plateWidth: order.width,
    plateLength: order.length,
    qty: order.qty,
    weight: order.weight,
    constraint: order.definition,
  }
}

function buildStats(
  rows: Array<{
    slabThickness: number
    slabWidth: number
    slabWeight: number
    yieldRate: number
  }>,
) {
  const map = new Map<string, ResultStatsRow>()

  for (const row of rows) {
    const key = `${row.slabThickness} x ${row.slabWidth}`
    const current = map.get(key) ?? {
      key,
      slabThickness: row.slabThickness,
      slabWidth: row.slabWidth,
      slabCount: 0,
      slabWeight: 0,
      steelWeight: 0,
      avgYield: 0,
    }

    current.slabCount += 1
    current.slabWeight += row.slabWeight
    current.steelWeight += row.slabWeight * row.yieldRate
    current.avgYield = current.slabWeight > 0 ? current.steelWeight / current.slabWeight : 0
    map.set(key, current)
  }

  return [...map.values()].sort((a, b) => b.slabCount - a.slabCount)
}

function estimateSlabWeight(slab: PlanSlab) {
  return slab.slabThickness * slab.slabWidth * slab.slabLength * 7.85e-9
}

function formatOrderId(order: Order) {
  const seq = String(order.subOrder || order.orderSeq || '').padStart(3, '0')
  return `${order.orderId} ${seq}`.trim()
}

function average(values: number[]) {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function createSeededRandom(seedSource: string) {
  let seed = 0
  for (let index = 0; index < seedSource.length; index += 1) {
    seed = (seed * 31 + seedSource.charCodeAt(index)) >>> 0
  }

  return () => {
    seed = (1664525 * seed + 1013904223) >>> 0
    return seed / 0xffffffff
  }
}

function colorByOrderId(orderId: string) {
  const key = orderId.trim().toUpperCase()
  let hash = 0
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 33 + key.charCodeAt(i)) >>> 0
  }
  const hue = hash % 360
  const saturation = 58 + (hash % 12)
  const lightness = 46 + ((hash >> 3) % 10)
  return `hsl(${hue} ${saturation}% ${lightness}%)`
}
