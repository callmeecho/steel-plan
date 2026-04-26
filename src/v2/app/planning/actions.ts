'use server'

import { revalidatePath } from 'next/cache'

import type {
  OrderWithSteelGrade,
  PlanningMode,
  PlanningRun,
  PlanningRunStatus,
} from '@/lib/database.types'
import { createClient } from '@/lib/supabase/server'

type CreatePlanningRunInput = {
  mode: PlanningMode
  preferenceEnabled: boolean
  testModeEnabled: boolean
  shortEnabled: boolean
  crossGroupEnabled: boolean
}

type ActionResult =
  | { success: true; run: PlanningRun }
  | { success: false; error: string }

type StatusResult =
  | { success: true; run: PlanningRun }
  | { success: false; error: string }

export async function createPlanningRun(
  input: CreatePlanningRunInput
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: '登录已失效，请重新登录后再操作。' }
  }

  const { data: selections, error: selectionsError } = await supabase
    .from('order_selections')
    .select('order_id')
    .eq('user_id', user.id)
    .order('selected_at', { ascending: false })

  if (selectionsError) {
    return { success: false, error: selectionsError.message }
  }

  const selectedIds = (selections ?? []).map((item) => item.order_id)
  if (selectedIds.length === 0) {
    return { success: false, error: '请先在订单页勾选订单，再创建任务记录。' }
  }

  const { data: orders, error: ordersError } = await supabase
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

  if (ordersError) {
    return { success: false, error: ordersError.message }
  }

  const safeOrders = orders ?? []
  const totalWeight = safeOrders.reduce(
    (sum, order) => sum + Number(order.weight_tons || 0),
    0
  )
  const uniqueGradeCount = new Set(
    safeOrders
      .map((order) => order.steel_grade?.standard_steel)
      .filter((value): value is string => Boolean(value))
  ).size
  const nearestDeliveryDate =
    safeOrders
      .map((order) => order.delivery_date)
      .filter((value): value is string => Boolean(value))
      .sort()[0] ?? null

  const { data: run, error: runError } = await supabase
    .from('planning_runs')
    .insert({
      user_id: user.id,
      status: 'draft',
      mode: input.mode,
      preference_enabled: input.preferenceEnabled,
      test_mode_enabled: input.testModeEnabled,
      short_enabled: input.shortEnabled,
      cross_group_enabled: input.crossGroupEnabled,
      selected_order_count: selectedIds.length,
      total_weight_tons: Number(totalWeight.toFixed(2)),
      unique_grade_count: uniqueGradeCount,
      nearest_delivery_date: nearestDeliveryDate,
      last_transition_at: new Date().toISOString(),
    })
    .select('*')
    .single<PlanningRun>()

  if (runError) {
    return { success: false, error: mapPlanningRunError(runError) }
  }

  const rows = selectedIds.map((order_id) => ({
    planning_run_id: run.id,
    order_id,
  }))

  const { error: joinError } = await supabase.from('planning_run_orders').insert(rows)

  if (joinError) {
    await supabase.from('planning_runs').delete().eq('id', run.id)
    return { success: false, error: mapPlanningRunError(joinError) }
  }

  revalidatePath('/planning')
  return { success: true, run }
}

export async function updatePlanningRunStatus(
  runId: string,
  status: PlanningRunStatus
): Promise<StatusResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: '登录已失效，请重新登录后再操作。' }
  }

  const { data: existing, error: existingError } = await supabase
    .from('planning_runs')
    .select('*')
    .eq('id', runId)
    .eq('user_id', user.id)
    .single<PlanningRun>()

  if (existingError || !existing) {
    return {
      success: false,
      error: '未找到任务记录，可能已删除或不属于当前账号。',
    }
  }

  const { data: run, error } = await supabase
    .from('planning_runs')
    .update({
      status,
      last_transition_at: new Date().toISOString(),
    })
    .eq('id', runId)
    .eq('user_id', user.id)
    .select('*')
    .single<PlanningRun>()

  if (error) {
    return { success: false, error: mapPlanningRunError(error) }
  }

  revalidatePath('/planning')
  return { success: true, run }
}

function mapPlanningRunError(error: { code?: string; message: string }) {
  if (error.code === 'PGRST205' || error.message.includes('planning_runs')) {
    return '缺少 planning_runs 相关数据表，请先在 Supabase SQL Editor 执行 database/2026-04-22_planning_runs.sql。'
  }

  if (error.code === '42501') {
    return '当前账号没有写入任务记录权限，请检查 RLS 策略和角色。'
  }

  return error.message
}

