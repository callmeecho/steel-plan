export type SteelGrade = string
export type OrderStatus = '未排' | '部分已排' | '已排' | '审核中'
export type Priority = '急' | '高' | '中' | '低'
export type TaskStatus = 'draft' | 'running' | 'done' | 'failed' | 'cancelled'
export type PlanStatus = 'draft' | 'confirmed' | 'archived'
export type UserRole = 'planner' | 'supervisor' | 'admin'

export interface Order {
  id: string
  plantId: string
  orderId: string
  contract: string
  subOrder: string
  orderSeq: number
  grade: SteelGrade
  thickness: number
  rollThickness: number
  width: number
  length: number
  qty: number
  weight: number
  definition: '单尺' | '双尺'
  surface: '普通' | '酸洗'
  urgent: boolean
  priority: Priority
  status: OrderStatus
  dueDate: string
  createdAt: string
  updatedAt: string
}

export interface SectionType {
  id: number
  code: number
  thickness: number
  enabled: boolean
}

export interface ThicknessRule {
  id: number
  plateMin: number
  plateMax: number
  slabMin: number
  slabMax: number
}

export interface LengthRule {
  id: number
  grade: SteelGrade
  widthMin: number
  widthMax: number
  lengthMin: number
  lengthMax: number
}

export interface OptimizeParams {
  preferLargeSection: boolean
  allowNonStandard: boolean
  allowLongSlab: boolean
  balanceYield: boolean
  respectDueDate: boolean
}

export interface OptimizeLog {
  iter: number
  yieldRate: number
  slabCount: number
  delta: number
  isBest: boolean
  ts: string
}

export interface OptimizeTask {
  id: string
  plantId: string
  createdBy: string
  createdAt: string
  orderIds: string[]
  selectionFilter: Record<string, unknown>
  params: OptimizeParams
  status: TaskStatus
  progress: number
  currentIter: number
  bestYield: number
  logs: OptimizeLog[]
}

export interface PlanKpi {
  avgYield: number
  steelWeight: number
  slabWeight: number
  slabCount: number
  scheduledOrders: number
  unscheduledOrders: number
  urgentHitRate: number
  dueHitRate: number
}

export interface PlanSlabSegment {
  orderId: string
  thickness?: number
  width?: number
  length: number
  qty: number
  color: string
}

export interface PlanSlab {
  id: string
  planId: string
  slabNo: string
  grade: SteelGrade
  steelDesc?: string
  slabThickness: number
  slabWidth: number
  slabLength: number
  rollThickness: number
  rollWidth: number
  rollLength: number
  yieldRate: number
  segments: PlanSlabSegment[]
}

export interface Plan {
  id: string
  taskId: string
  name: string
  strategy: string
  params: OptimizeParams
  kpi: PlanKpi
  runtime: number
  recommended: boolean
  status: PlanStatus
  confirmedBy?: string
  confirmedAt?: string
  slabs: PlanSlab[]
  unscheduledOrderIds: string[]
}

export interface AuditLog {
  id: string
  actorId: string
  action: string
  targetType: string
  targetId: string
  payload: Record<string, unknown>
  ts: string
}
