'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

function requiredFieldsError() {
  return { error: '钢种名称和内部编码为必填项。' }
}

function permissionError(action: string) {
  return { error: `当前账号没有权限${action}钢种。` }
}

export async function createSteelGrade(formData: FormData) {
  const standard_steel = (formData.get('standard_steel') as string)?.trim()
  const internal_code = (formData.get('internal_code') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null

  if (!standard_steel || !internal_code) {
    return requiredFieldsError()
  }

  const supabase = await createClient()
  const { error } = await supabase.from('steel_grades').insert({
    standard_steel,
    internal_code,
    description,
  })

  if (error) {
    if (error.code === '42501') {
      return permissionError('新增')
    }
    if (error.code === '23505') {
      return { error: '内部编码已存在，请更换后再试。' }
    }
    return { error: error.message }
  }

  revalidatePath('/steel-grades')
  return { success: true }
}

export async function updateSteelGrade(id: string, formData: FormData) {
  const standard_steel = (formData.get('standard_steel') as string)?.trim()
  const internal_code = (formData.get('internal_code') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null

  if (!standard_steel || !internal_code) {
    return requiredFieldsError()
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('steel_grades')
    .update({ standard_steel, internal_code, description })
    .eq('id', id)

  if (error) {
    if (error.code === '42501') {
      return permissionError('编辑')
    }
    if (error.code === '23505') {
      return { error: '内部编码已存在，请更换后再试。' }
    }
    return { error: error.message }
  }

  revalidatePath('/steel-grades')
  return { success: true }
}

export async function archiveSteelGrade(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: '当前登录已失效，请重新登录后再试。' }
  }

  const { error } = await supabase
    .from('steel_grades')
    .update({
      archived_at: new Date().toISOString(),
      archived_by: user.id,
    })
    .eq('id', id)

  if (error) {
    if (error.code === '42501') {
      return permissionError('归档')
    }
    return { error: error.message }
  }

  revalidatePath('/steel-grades')
  return { success: true }
}

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
    if (error.code === '42501') {
      return permissionError('恢复')
    }
    return { error: error.message }
  }

  revalidatePath('/steel-grades')
  return { success: true }
}

export async function permanentlyDeleteSteelGrade(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('steel_grades').delete().eq('id', id)

  if (error) {
    if (error.code === '42501') {
      return permissionError('永久删除')
    }
    if (error.code === '23503') {
      return {
        error:
          '这个钢种仍被订单数据引用，暂时不能永久删除。请先确认相关订单处理完毕，或继续保留为归档状态。',
      }
    }
    return { error: error.message }
  }

  revalidatePath('/steel-grades')
  return { success: true }
}
