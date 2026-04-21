// 数据库表对应的 TypeScript 类型定义
// 让前端代码有类型提示和编译检查

export type UserRole = 'admin' | 'viewer'

export type SizeType = 'fixed' | 'double_fixed' | 'non_fixed'

export type OrderStatus =
  | 'pending'
  | 'imported'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface Profile {
  id: string
  display_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface SteelGrade {
  id: string
  standard_steel: string
  internal_code: string
  description: string | null
  archived_at: string | null
  archived_by: string | null
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: string
  sequence_no: string
  steel_grade_id: string | null
  plate_thickness_mm: number | null
  rolled_thickness_mm: number | null
  width_mm: number | null
  length_mm: number | null
  width_margin_mm: number | null
  size_type: SizeType | null
  quantity: number
  weight_tons: number
  cutting_type: string | null
  heat_treatment: string | null
  delivery_date: string | null
  erp_confirmed_date: string | null
  status: OrderStatus
  created_by: string | null
  created_at: string
  updated_at: string
}

// 订单带关联钢种信息（JOIN 查询时使用）
export interface OrderWithSteelGrade extends Order {
  steel_grade: SteelGrade | null
}

export interface OrderSelection {
  id: string
  user_id: string
  order_id: string
  selected_at: string
}