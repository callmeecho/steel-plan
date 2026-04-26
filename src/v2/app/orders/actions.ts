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
