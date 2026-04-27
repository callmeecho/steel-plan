import fs from 'node:fs'
import path from 'node:path'

import * as XLSX from 'xlsx'

import type { Plan } from '../types/domain'
import { loadLatestPlanSnapshot, loadPlanSnapshotByTaskId } from './result-store'

const RESULT_DIR_CANDIDATES = [
  process.env.LEGACY_RESULT_DIR || '',
  'D:\\南京钢铁\\南京钢铁后端\\双定尺模型\\ShuangDingChi_MySQL\\data\\results',
  'D:\\南京钢铁\\南京钢铁后端\\双定尺模型\\ShuangDingChi_MySQL跑不起来\\files',
] as const

const SEGMENT_COL_PATTERN = /^data_col_0(\.\d+)?$/

type SheetRow = Record<string, string | number | null | undefined>

type LoadedSegment = {
  orderId: string
  thickness: number
  width: number
  length: number
  qty: number
  color: string
}

export type ResultTableRow = {
  slabNo: string
  steelGrade: string
  steelDesc: string
  slabThickness: number
  slabWidth: number
  slabLength: number
  slabWeight: number
  rollThickness: number
  rollWidth: number
  rollLength: number
  yieldRate: number
}

export type ResultStatsRow = {
  key: string
  slabThickness: number
  slabWidth: number
  slabCount: number
  slabWeight: number
  steelWeight: number
  avgYield: number
}

export type ResultUnscheduledRow = {
  orderId: string
  steelDesc: string
  steelGrade: string
  plateThickness: number
  plateWidth: number
  plateLength: number
  qty: number
  weight: number
  constraint: string
}

export type LoadedPlanSnapshot = {
  plan: Plan
  sourceDir: string | null
  generatedAt: string | null
  results: ResultTableRow[]
  stats: ResultStatsRow[]
  unscheduled: ResultUnscheduledRow[]
  sourceMeta?: {
    requestedOrderCount: number
    effectiveOrderCount: number
    filteredOutCount: number
    requestedWeightTons: number
    effectiveWeightTons: number
    requestedUniqueGradeCount: number
    effectiveUniqueGradeCount: number
  }
  consistency?: {
    expectedOrderCount: number
    actualOrderCount: number
    missingOrderCount: number
    extraOrderCount: number
    coverageRate: number
    strictMatched: boolean
  }
}

export type ResultDownloadTarget = {
  filePath: string
  fileName: string
  contentType: string
}

export async function loadCurrentPlanSnapshot(taskId = 'current'): Promise<LoadedPlanSnapshot | null> {
  if (taskId && taskId !== 'current') {
    const snapshot = await loadPlanSnapshotByTaskId(taskId)
    if (snapshot) return snapshot as LoadedPlanSnapshot
  } else {
    const latest = await loadLatestPlanSnapshot()
    if (latest) return latest as LoadedPlanSnapshot
  }

  const executionMode = (process.env.STEEL_PLAN_EXECUTION_MODE || 'demo').toLowerCase()
  if (executionMode === 'legacy') {
    return loadPlanSnapshotFromFiles()
  }

  return null
}

export async function loadPlanSnapshotFromFiles(): Promise<LoadedPlanSnapshot | null> {
  const sourceDir = findResultDir()
  if (!sourceDir) return null

  return buildSnapshotFromDir(sourceDir, 'LEGACY-RESULT')
}

export function getResultDownloadTarget(): ResultDownloadTarget | null {
  const executionMode = (process.env.STEEL_PLAN_EXECUTION_MODE || 'demo').toLowerCase()
  if (executionMode !== 'legacy') {
    return null
  }

  const sourceDir = findResultDir()
  if (!sourceDir) return null

  const preferredFiles = [
    {
      fileName: 'design_result.xlsx',
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
    {
      fileName: 'remain_orders.xlsx',
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  ]

  for (const file of preferredFiles) {
    const filePath = path.join(sourceDir, file.fileName)
    if (fs.existsSync(filePath)) {
      return {
        filePath,
        fileName: file.fileName,
        contentType: file.contentType,
      }
    }
  }

  return null
}

function findResultDir() {
  return (
    RESULT_DIR_CANDIDATES.find(
      (candidate) => candidate && fs.existsSync(path.join(candidate, 'design_result.xlsx')),
    ) ?? null
  )
}

function buildSnapshotFromDir(sourceDir: string, taskId: string): LoadedPlanSnapshot | null {
  const designRows = readSheet(path.join(sourceDir, 'design_result.xlsx'))
  if (designRows.length === 0) return null

  const remainRows = readSheet(path.join(sourceDir, 'remain_orders.xlsx'))
  const generatedAt = getGeneratedAt(path.join(sourceDir, 'design_result.xlsx'))

  const slabs = designRows.map((row, index) => mapDesignRowToSlab(row, index))
  const slabWeight = slabs.reduce((sum, slab) => sum + slab.slabWeightEstimate, 0)
  const steelWeight = slabs.reduce((sum, slab) => sum + slab.slabWeightEstimate * slab.yieldRate, 0)
  const avgYield =
    slabs.length > 0 ? slabs.reduce((sum, slab) => sum + slab.yieldRate, 0) / slabs.length : 0
  const allScheduledOrders = new Set(slabs.flatMap((slab) => slab.segments.map((segment) => segment.orderId)))
  const unscheduled = remainRows.map(mapRemainRow).filter((item) => item.orderId)
  const unscheduledOrderIds = unscheduled.map((item) => item.orderId)

  const plan: Plan = {
    id: 'REAL-CURRENT',
    taskId,
    name: '当前算法结果',
    strategy: '读取旧系统最新排产输出',
    params: {
      preferLargeSection: true,
      allowNonStandard: true,
      allowLongSlab: true,
      balanceYield: true,
      respectDueDate: true,
    },
    kpi: {
      avgYield,
      steelWeight,
      slabWeight,
      slabCount: slabs.length,
      scheduledOrders: allScheduledOrders.size,
      unscheduledOrders: unscheduled.length,
      urgentHitRate: 0,
      dueHitRate: allScheduledOrders.size + unscheduled.length > 0
        ? allScheduledOrders.size / (allScheduledOrders.size + unscheduled.length)
        : 0,
    },
    runtime: 0,
    recommended: true,
    status: 'draft',
    slabs: slabs.map(({ slabWeightEstimate: _omit, ...rest }) => rest),
    unscheduledOrderIds,
  }

  return {
    plan,
    sourceDir,
    generatedAt,
    results: slabs.map((slab) => ({
      slabNo: slab.slabNo,
      steelGrade: slab.grade,
      steelDesc: slab.steelDesc,
      slabThickness: slab.slabThickness,
      slabWidth: slab.slabWidth,
      slabLength: slab.slabLength,
      slabWeight: slab.slabWeightEstimate,
      rollThickness: slab.rollThickness,
      rollWidth: slab.rollWidth,
      rollLength: slab.rollLength,
      yieldRate: slab.yieldRate,
    })),
    stats: buildStats(slabs),
    unscheduled,
  }
}

function readSheet(filePath: string) {
  if (!fs.existsSync(filePath)) return [] as SheetRow[]

  try {
    const fileBuffer = fs.readFileSync(filePath)
    const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: false })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) return [] as SheetRow[]
    return XLSX.utils.sheet_to_json<SheetRow>(workbook.Sheets[sheetName], { defval: null })
  } catch {
    return [] as SheetRow[]
  }
}

function getGeneratedAt(filePath: string) {
  if (!fs.existsSync(filePath)) return null

  try {
    return fs.statSync(filePath).mtime.toISOString()
  } catch {
    return null
  }
}

function mapDesignRowToSlab(row: SheetRow, index: number) {
  const slabNo = String(row.SLAB_NO ?? index)
  const rollLength = toNumber(row.ROLL_LEN)
  const primaryOrderId = normalizeOrderId(row.ORD_INFO)

  const segments = [
    buildSegment(
      primaryOrderId,
      toNumber(row.PLATE_THK),
      toNumber(row.PLATE_WIDTH),
      toNumber(row.PLATE_LEN),
      toNumber(row.PLATE_NUM),
    ),
    ...readExtraSegments(row),
  ].filter((segment): segment is LoadedSegment => segment !== null)

  return {
    id: `real-slab-${slabNo}`,
    planId: 'REAL-CURRENT',
    slabNo,
    steelDesc: toText(row.STLDES),
    grade: toText(row.STLGRD),
    slabThickness: toNumber(row.SLAB_THK),
    slabWidth: toNumber(row.SLAB_WIDTH),
    slabLength: toNumber(row.SLAB_LEN),
    slabWeightEstimate: toNumber(row.WEIGHT),
    rollThickness: toNumber(row.ROLL_THK),
    rollWidth: toNumber(row.ROLL_WIDTH),
    rollLength,
    yieldRate: normalizeYieldRate(row.EFFICIENCY),
    segments: segments.map((segment) => ({
      orderId: segment.orderId,
      thickness: segment.thickness,
      width: segment.width,
      length: segment.length,
      qty: segment.qty,
      color: segment.color,
    })),
  }
}

function normalizeYieldRate(value: unknown) {
  const raw = toNumber(value)
  if (raw <= 0) return 0
  if (raw > 1 && raw <= 100) return Math.min(raw / 100, 1)
  return Math.min(raw, 1)
}

function readExtraSegments(row: SheetRow) {
  const segments: LoadedSegment[] = []

  for (const key of Object.keys(row)) {
    const match = key.match(SEGMENT_COL_PATTERN)
    if (!match) continue

    const suffix = match[1] ?? ''
    const orderId = normalizeOrderId(row[`data_col_0${suffix}`])
    const thickness = toNumber(row[`data_col_1${suffix}`])
    const width = toNumber(row[`data_col_2${suffix}`])
    const length = toNumber(row[`data_col_3${suffix}`])
    const qty = toNumber(row[`data_col_4${suffix}`])
    const segment = buildSegment(orderId, thickness, width, length, qty)

    if (segment) {
      segments.push(segment)
    }
  }

  return segments
}

function buildSegment(
  orderId: string,
  thickness: number,
  width: number,
  length: number,
  qty: number,
) {
  if (!orderId || length <= 0 || qty <= 0) return null

  return {
    orderId,
    thickness,
    width,
    length,
    qty,
    color: getSegmentColor(orderId),
  }
}

function getSegmentColor(orderId: string) {
  const key = orderId.trim().toUpperCase()
  let hash = 0

  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0
  }

  const hue = hash % 360
  const saturation = 56 + (hash % 14)
  const lightness = 50 + ((hash >> 3) % 10)

  return `hsl(${hue} ${saturation}% ${lightness}%)`
}

function buildStats(
  slabs: Array<{
    slabThickness: number
    slabWidth: number
    slabWeightEstimate: number
    yieldRate: number
  }>,
) {
  const map = new Map<string, ResultStatsRow>()

  for (const slab of slabs) {
    const key = `${slab.slabThickness} x ${slab.slabWidth}`
    const current = map.get(key) ?? {
      key,
      slabThickness: slab.slabThickness,
      slabWidth: slab.slabWidth,
      slabCount: 0,
      slabWeight: 0,
      steelWeight: 0,
      avgYield: 0,
    }

    current.slabCount += 1
    current.slabWeight += slab.slabWeightEstimate
    current.steelWeight += slab.slabWeightEstimate * slab.yieldRate
    current.avgYield = current.slabWeight > 0 ? current.steelWeight / current.slabWeight : 0
    map.set(key, current)
  }

  return Array.from(map.values()).sort((a, b) => b.slabCount - a.slabCount)
}

function mapRemainRow(row: SheetRow): ResultUnscheduledRow {
  return {
    orderId: normalizeOrderId(`${toText(row.ORD_NO)} ${toText(row.ORD_ITEM)}`),
    steelDesc: toText(row.STLDES),
    steelGrade: toText(row.STLGRD),
    plateThickness: toNumber(row.PLATE_THK),
    plateWidth: toNumber(row.PLATE_WIDTH),
    plateLength: toNumber(row.PLATE_LEN),
    qty: toNumber(row.PLATE_NUM),
    weight: toNumber(row.ORD_WGT),
    constraint: toText(row.CONSTRAINT),
  }
}

function normalizeOrderId(value: unknown) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

function toText(value: unknown) {
  if (value === null || value === undefined) return '-'
  const text = String(value).trim()
  return text || '-'
}

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

