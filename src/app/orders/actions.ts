'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// 切换单个订单的选中状态
// 已选则取消, 未选则添加, 幂等可重入
export async function toggleOrderSelection(orderId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: '未登录' }
  }

  // 先查是否已选
  const { data: existing } = await supabase
    .from('order_selections')
    .select('id')
    .eq('user_id', user.id)
    .eq('order_id', orderId)
    .maybeSingle()

  if (existing) {
    // 已选, 取消
    const { error } = await supabase
      .from('order_selections')
      .delete()
      .eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    // 未选, 添加
    const { error } = await supabase
      .from('order_selections')
      .insert({ user_id: user.id, order_id: orderId })
    if (error) return { error: error.message }
  }

  // 让订单页重新查询选中数据
  revalidatePath('/orders')
  return { success: true }
}

// 清空当前用户的全部选中
export async function clearAllSelections() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: '未登录' }
  }

  const { error } = await supabase
    .from('order_selections')
    .delete()
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/orders')
  return { success: true }
}

// 选中当前筛选条件下的全部订单 (跨页全选)
// 传入的是已经被筛选过的订单 id 数组
export async function selectManyOrders(orderIds: string[]) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: '未登录' }
  }

  if (orderIds.length === 0) {
    return { success: true, inserted: 0 }
  }

  // 批量插入, 用 ON CONFLICT DO NOTHING 避免重复选中报错
  // Supabase SDK 的 upsert 默认会更新, 这里只需要插入不冲突的
  const rows = orderIds.map((order_id) => ({
    user_id: user.id,
    order_id,
  }))

  const { error } = await supabase
    .from('order_selections')
    .upsert(rows, { onConflict: 'user_id,order_id', ignoreDuplicates: true })

  if (error) return { error: error.message }

  revalidatePath('/orders')
  return { success: true, inserted: orderIds.length }
}