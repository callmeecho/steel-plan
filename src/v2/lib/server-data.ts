import fs from 'node:fs'
import path from 'node:path'

import * as XLSX from 'xlsx'

import { createClient } from '@/lib/supabase/server'

import { MOCK_ORDERS } from './mock-supabase'
import type { Order as V2Order } from '../types/domain'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

type LegacyOrderRow = {
  oid: string | null
  number: string | number | null
  steeltype: string | null
  thickness: string | number | null
  width: string | number | null
  length: string | number | null
  sizetype: string | null
  amount: string | number | null
  cut: string | null
  weight: string | number | null
  deliverydate: string | null
}

type LocalOrderSheetRow = {
  ORD_NO?: string | number | null
  ORD_ITEM?: string | number | null
  STLDES?: string | null
  STLGRD?: string | null
  PLATE_THK?: string | number | null
  ROLL_THK?: string | number | null
  PLATE_WIDTH?: string | number | null
  PLATE_LEN?: string | number | null
  PLATE_NUM?: string | number | null
  ORD_WGT?: string | number | null
  CONSTRAINT?: string | null
  SURFACE_C?: string | number | null
  URGNT_FL?: string | null
  DEL_TO?: string | number | null
}

type LegacySectionRow = {
  selectedNumber: string | number | null
  selectednumber?: string | number | null
  thickness: string | number | null
  width: string | number | null
  isSelected: string | number | null
  isselected?: string | number | null
}

type LegacyThicknessRow = {
  num: string | number | null
  steelthicknessLow: string | number | null
  steelthicknesslow?: string | number | null
  steelthicknessHigh: string | number | null
  steelthicknesshigh?: string | number | null
  thicknessLow: string | number | null
  thicknesslow?: string | number | null
  thicknessHigh: string | number | null
  thicknesshigh?: string | number | null
}

type LegacyLengthRuleRow = {
  num: string | number | null
  STD_MIN: string | number | null
  STD_MAX: string | number | null
  FULL_MIN: string | number | null
  FULL_MAX: string | number | null
  SHORT_MIN: string | number | null
  SHORT_MAX: string | number | null
  SLAB_THK_MIN: string | number | null
  SLAB_THK_MAX: string | number | null
}

const SUPABASE_TIMEOUT_MS = 3000

export type V2SectionRow = {
  id: number
  thickness: number | null
  width: number | null
  enabled: boolean
}

export type V2ThicknessRuleRow = {
  id: number
  plateMin: number | null
  plateMax: number | null
  slabMin: number | null
  slabMax: number | null
}

export type V2LengthRuleRow = {
  id: number
  standardMin: number | null
  standardMax: number | null
  fullMin: number | null
  fullMax: number | null
  shortMin: number | null
  shortMax: number | null
  slabThicknessMin: number | null
  slabThicknessMax: number | null
}

export async function loadV2Orders() {
  const supabase = await createClient()
  const legacyRows = await withTimeout(loadLegacyOrders(supabase), [] as LegacyOrderRow[])

  if (legacyRows.length > 0) {
    const mapped = legacyRows.map(mapLegacyOrder).filter((item) => item.orderId)
    if (mapped.length > 0) return mapped
  }

  const localRows = loadLocalOrdersFromWorkbook()
  if (localRows.length > 0) return localRows

  return MOCK_ORDERS
}

export async function loadV2OrderGradeOptions() {
  const supabase = await createClient()
  const gradeSet = new Set<string>()

  const { data: steelGrades } = await withTimeout(
    Promise.resolve(
      supabase.from('steel_grades').select('standard_steel').is('archived_at', null).limit(10000),
    ),
    { data: null, error: null } as any,
  )

  if (steelGrades && Array.isArray(steelGrades)) {
    for (const row of steelGrades as Array<{ standard_steel?: string | null }>) {
      const value = String(row.standard_steel || '').trim()
      if (value) gradeSet.add(value)
    }
  }

  const legacyRows = await withTimeout(loadLegacyOrders(supabase), [] as LegacyOrderRow[])
  for (const row of legacyRows) {
    const value = String(row.steeltype || '').trim()
    if (value) gradeSet.add(value)
  }

  return Array.from(gradeSet).sort((a, b) => a.localeCompare(b, 'zh-CN'))
}

export async function loadV2SectionRows() {
  const supabase = await createClient()
  const result = await withTimeout(
    Promise.resolve(supabase.from('duanmian1').select('*').limit(1000)),
    { data: null, error: null } as any,
  )
  const { data, error } = result

  if (error || !data) return [] as V2SectionRow[]

  return (data as LegacySectionRow[]).map((row, index) => ({
    id: parseMaybeNumber(row.selectedNumber ?? row.selectednumber) ?? index + 1,
    thickness: parseMaybeNumber(row.thickness),
    width: parseMaybeNumber(row.width),
    enabled: String(row.isSelected ?? row.isselected ?? '0') === '1',
  }))
}

export async function loadV2ThicknessRules() {
  const supabase = await createClient()
  const result = await withTimeout(
    Promise.resolve(supabase.from('duanmian2').select('*').limit(1000)),
    { data: null, error: null } as any,
  )
  const { data, error } = result

  if (error || !data) return [] as V2ThicknessRuleRow[]

  return (data as LegacyThicknessRow[]).map((row) => ({
    id: parseMaybeNumber(row.num) ?? 0,
    plateMin: parseMaybeNumber(row.steelthicknessLow ?? row.steelthicknesslow),
    plateMax: parseMaybeNumber(row.steelthicknessHigh ?? row.steelthicknesshigh),
    slabMin: parseMaybeNumber(row.thicknessLow ?? row.thicknesslow),
    slabMax: parseMaybeNumber(row.thicknessHigh ?? row.thicknesshigh),
  }))
}

export async function loadV2LengthRules() {
  const supabase = await createClient()
  const result = await withTimeout(
    Promise.resolve(supabase.from('slablengthstandard').select('*').limit(1000)),
    { data: null, error: null } as any,
  )
  const { data, error } = result

  if (error || !data) return [] as V2LengthRuleRow[]

  return (data as LegacyLengthRuleRow[]).map((row) => ({
    id: parseMaybeNumber(row.num) ?? 0,
    standardMin: parseMaybeNumber(row.STD_MIN),
    standardMax: parseMaybeNumber(row.STD_MAX),
    fullMin: parseMaybeNumber(row.FULL_MIN),
    fullMax: parseMaybeNumber(row.FULL_MAX),
    shortMin: parseMaybeNumber(row.SHORT_MIN),
    shortMax: parseMaybeNumber(row.SHORT_MAX),
    slabThicknessMin: parseMaybeNumber(row.SLAB_THK_MIN),
    slabThicknessMax: parseMaybeNumber(row.SLAB_THK_MAX),
  }))
}

async function loadLegacyOrders(supabase: SupabaseClient) {
  const candidateTables = ['orderinformation_1', 'orderinformation', 'orderinfomation']

  for (const tableName of candidateTables) {
    const { data, error } = await supabase.from(tableName).select('*').limit(10000)
    if (!error && data && data.length > 0) return data as LegacyOrderRow[]
  }

  return [] as LegacyOrderRow[]
}

function loadLocalOrdersFromWorkbook() {
  const workbookPath = findFirstMatchingFile('order.xlsx')
  if (!workbookPath) return [] as V2Order[]

  try {
    const workbook = XLSX.readFile(workbookPath)
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) return [] as V2Order[]

    const rows = XLSX.utils.sheet_to_json<LocalOrderSheetRow>(workbook.Sheets[sheetName], {
      defval: null,
    })

    return rows.map(mapLocalOrderRow).filter((item) => item.orderId)
  } catch {
    return [] as V2Order[]
  }
}

function withTimeout<T>(promise: Promise<T>, fallback: T) {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), SUPABASE_TIMEOUT_MS)
    }),
  ])
}

function findFirstMatchingFile(fileName: string) {
  {
    const preferredRoots = [
      'D:\\南京钢铁\\南京钢铁后端\\双定尺模型\\ShuangDingChi_MySQL',
      'D:\\南京钢铁\\南京钢铁后端\\双定尺模型\\ShuangDingChi_MySQL跑不起来',
      'D:\\南京钢铁\\南京钢铁后端\\双定尺模型\\ShuangDingChi_MySQL2',
    ] as const

    for (const root of preferredRoots) {
      const found = walkForFile(root, fileName)
      if (found) return found
    }

    return null
  }

  const preferredRoots = [
    'D:\\南京钢铁\\南京钢铁后端\\双定尺模型\\ShuangDingChi_MySQL',
    'D:\\南京钢铁\\南京钢铁后端\\双定尺模型\\ShuangDingChi_MySQL跑不起来',
    'D:\\南京钢铁\\南京钢铁后端\\双定尺模型\\ShuangDingChi_MySQL2',
  ] as const

  for (const root of preferredRoots) {
    const found = walkForFile(root, fileName)
    if (found) return found
  }

  return null
}

function walkForFile(startDir: string, targetName: string): string | null {
  const stack = [startDir]

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current) continue

    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(current, { withFileTypes: true })
    } catch {
      continue
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name)
      if (entry.isFile() && entry.name.toLowerCase() === targetName.toLowerCase()) return fullPath
      if (entry.isDirectory()) stack.push(fullPath)
    }
  }

  return null
}

function mapLegacyOrder(row: LegacyOrderRow): V2Order {
  const orderNo = String(row.oid || '').trim()
  const sequenceNo = String(row.number || '').trim()
  const dueDate = row.deliverydate || '2026-04-25'
  const sizeType = String(row.sizetype || '').trim()

  return {
    id: `${orderNo}-${sequenceNo}`,
    plantId: 'hot-roll-1',
    orderId: orderNo,
    contract: orderNo,
    subOrder: sequenceNo,
    orderSeq: parseMaybeNumber(row.number) ?? 0,
    grade: String(row.steeltype || '').trim() || '-',
    thickness: parseMaybeNumber(row.thickness) ?? 0,
    rollThickness: parseMaybeNumber(row.thickness) ?? 0,
    width: parseMaybeNumber(row.width) ?? 0,
    length: parseMaybeNumber(row.length) ?? 0,
    qty: parseMaybeNumber(row.amount) ?? 0,
    weight: parseMaybeNumber(row.weight) ?? 0,
    definition: normalizeDefinition(sizeType),
    surface: '普通',
    urgent: false,
    priority: '中',
    status: '未排',
    dueDate,
    createdAt: dueDate,
    updatedAt: dueDate,
  }
}

function mapLocalOrderRow(row: LocalOrderSheetRow): V2Order {
  const orderNo = String(row.ORD_NO || '').trim()
  const sequenceNo = String(row.ORD_ITEM || '').trim()
  const dueDate = normalizeDate(row.DEL_TO) ?? '2026-04-25'
  const constraint = String(row.CONSTRAINT || '').trim()
  const urgentFlag = String(row.URGNT_FL || '').trim()

  return {
    id: `${orderNo}-${sequenceNo}`,
    plantId: 'hot-roll-1',
    orderId: orderNo,
    contract: orderNo,
    subOrder: sequenceNo,
    orderSeq: parseMaybeNumber(row.ORD_ITEM) ?? 0,
    grade: String(row.STLDES || row.STLGRD || '').trim() || '-',
    thickness: parseMaybeNumber(row.PLATE_THK) ?? 0,
    rollThickness: parseMaybeNumber(row.ROLL_THK) ?? parseMaybeNumber(row.PLATE_THK) ?? 0,
    width: parseMaybeNumber(row.PLATE_WIDTH) ?? 0,
    length: parseMaybeNumber(row.PLATE_LEN) ?? 0,
    qty: parseMaybeNumber(row.PLATE_NUM) ?? 0,
    weight: parseMaybeNumber(row.ORD_WGT) ?? 0,
    definition: normalizeDefinition(constraint),
    surface: String(row.SURFACE_C || '0') === '1' ? '酸洗' : '普通',
    urgent: Boolean(urgentFlag),
    priority: urgentFlag ? '高' : '中',
    status: '未排',
    dueDate,
    createdAt: dueDate,
    updatedAt: dueDate,
  }
}

function normalizeDate(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return null
  const text = String(value).trim()
  if (/^\d{8}$/.test(text)) {
    return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`
  }
  return text
}

function parseMaybeNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeDefinition(source: string) {
  const normalized = String(source || '').trim().toLowerCase()

  if (
    normalized.includes('双') ||
    normalized.includes('雙') ||
    normalized.includes('double') ||
    normalized.includes('dual')
  ) {
    return '双定尺' as const
  }

  if (
    normalized.includes('单') ||
    normalized.includes('單') ||
    normalized.includes('single')
  ) {
    return '单定尺' as const
  }

  return '单定尺' as const
}
