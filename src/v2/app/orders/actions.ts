'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

function unauthenticatedError() {
  return { error: '登录已失效，请重新登录。' }
}

export async function setOrderSelection(orderId: string, selected: boolean) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return unauthenticatedError()
  }

  if (selected) {
    const { error } = await supabase
      .from('order_selections')
      .upsert(
        {
          user_id: user.id,
          order_id: orderId,
        },
        { onConflict: 'user_id,order_id', ignoreDuplicates: true }
      )

    if (error) {
      return { error: error.message }
    }
  } else {
    const { error } = await supabase
      .from('order_selections')
      .delete()
      .eq('user_id', user.id)
      .eq('order_id', orderId)

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath('/orders')
  revalidatePath('/planning')
  return { success: true }
}

export async function toggleOrderSelection(orderId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return unauthenticatedError()
  }

  const { data: existing } = await supabase
    .from('order_selections')
    .select('id')
    .eq('user_id', user.id)
    .eq('order_id', orderId)
    .maybeSingle()

  return setOrderSelection(orderId, !existing)
}

export async function clearAllSelections() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return unauthenticatedError()
  }

  const { error } = await supabase
    .from('order_selections')
    .delete()
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/orders')
  revalidatePath('/planning')
  return { success: true }
}

export async function selectManyOrders(orderIds: string[]) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return unauthenticatedError()
  }

  if (orderIds.length === 0) {
    return { success: true, inserted: 0 }
  }

  const rows = orderIds.map((order_id) => ({
    user_id: user.id,
    order_id,
  }))

  const { error } = await supabase
    .from('order_selections')
    .upsert(rows, { onConflict: 'user_id,order_id', ignoreDuplicates: true })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/orders')
  revalidatePath('/planning')
  return { success: true, inserted: orderIds.length }
}

export async function replaceOrderSelections(orderIds: string[]) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return unauthenticatedError()
  }

  const normalizedOrderIds = Array.from(
    new Set(orderIds.map((item) => String(item || '').trim()).filter(Boolean)),
  )

  const { error: clearError } = await supabase
    .from('imported_order_selections')
    .delete()
    .eq('user_id', user.id)

  if (clearError) {
    return { error: clearError.message }
  }

  if (normalizedOrderIds.length > 0) {
    const rows = normalizedOrderIds.map((orderId) => ({
      user_id: user.id,
      order_id: orderId,
    }))

    const { error: insertError } = await supabase
      .from('imported_order_selections')
      .insert(rows)

    if (insertError) {
      return { error: insertError.message }
    }
  }

  revalidatePath('/orders')
  revalidatePath('/planning')
  revalidatePath('/generate')
  return { success: true, inserted: normalizedOrderIds.length }
}
