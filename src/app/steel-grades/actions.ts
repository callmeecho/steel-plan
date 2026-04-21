'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// 创建钢种
export async function createSteelGrade(formData: FormData) {
  const standard_steel = (formData.get('standard_steel') as string)?.trim()
  const internal_code = (formData.get('internal_code') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null

  if (!standard_steel || !internal_code) {
    return { error: '国标钢种和内部代码必填' }
  }

  const supabase = await createClient()

  const { error } = await supabase.from('steel_grades').insert({
    standard_steel,
    internal_code,
    description,
  })

  if (error) {
    if (error.code === '42501') return { error: '无权限: 只有 admin 可以新增' }
    if (error.code === '23505') return { error: '内部代码已存在' }
    return { error: error.message }
  }

  revalidatePath('/steel-grades')
  return { success: true }
}

// 更新钢种
export async function updateSteelGrade(id: string, formData: FormData) {
  const standard_steel = (formData.get('standard_steel') as string)?.trim()
  const internal_code = (formData.get('internal_code') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null

  if (!standard_steel || !internal_code) {
    return { error: '国标钢种和内部代码必填' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('steel_grades')
    .update({ standard_steel, internal_code, description })
    .eq('id', id)

  if (error) {
    if (error.code === '42501') return { error: '无权限' }
    if (error.code === '23505') return { error: '内部代码已存在' }
    return { error: error.message }
  }

  revalidatePath('/steel-grades')
  return { success: true }
}

// 归档钢种 (软删除)
// 钢种保留在数据库, 但字典查询会过滤掉, 历史订单仍然能看到名称
export async function archiveSteelGrade(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: '未登录' }

  const { error } = await supabase
    .from('steel_grades')
    .update({
      archived_at: new Date().toISOString(),
      archived_by: user.id,
    })
    .eq('id', id)

  if (error) {
    if (error.code === '42501') return { error: '无权限' }
    return { error: error.message }
  }

  revalidatePath('/steel-grades')
  return { success: true }
}

// 恢复已归档的钢种
export async function restoreSteelGrade(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('steel_grades')
    .update({
      archived_at: null,
      archived_by: null,
    })
    .eq('id', id)

  if (error) {
    if (error.code === '42501') return { error: '无权限' }
    return { error: error.message }
  }

  revalidatePath('/steel-grades')
  return { success: true }
}

// 永久删除 (硬删除) - 仅当无订单引用时才会成功
// 外键 on delete restrict 会在有引用时拒绝
export async function permanentlyDeleteSteelGrade(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('steel_grades').delete().eq('id', id)

  if (error) {
    if (error.code === '42501') return { error: '无权限' }
    if (error.code === '23503') {
      return {
        error: '该钢种已被订单引用, 无法永久删除。请使用"归档"保留历史数据。',
      }
    }
    return { error: error.message }
  }

  revalidatePath('/steel-grades')
  return { success: true }
}