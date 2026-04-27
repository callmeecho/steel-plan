'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

function parseRequiredNumber(formData: FormData, key: string, label: string) {
  const raw = (formData.get(key) as string | null)?.trim()
  if (!raw) {
    return { error: `${label}不能为空。` as const }
  }

  const value = Number(raw)
  if (!Number.isFinite(value)) {
    return { error: `${label}必须是数字。` as const }
  }

  return { value }
}

function permissionError(action: string) {
  return { error: `当前账号没有权限${action}这条规则。` }
}

function revalidateParamPages() {
  revalidatePath('/params/section')
  revalidatePath('/params/thickness')
  revalidatePath('/params/length')
}

export async function createSectionRule(formData: FormData) {
  const thicknessResult = parseRequiredNumber(formData, 'thickness', '厚度')
  if ('error' in thicknessResult) return thicknessResult

  const widthResult = parseRequiredNumber(formData, 'width', '宽度')
  if ('error' in widthResult) return widthResult

  const enabled = formData.get('enabled') === 'on' ? 1 : 0

  const supabase = await createClient()
  const { error } = await supabase.from('duanmian1').insert({
    thickness: thicknessResult.value,
    width: widthResult.value,
    isselected: enabled,
  })

  if (error) {
    if (error.code === '42501') return permissionError('新增')
    return { error: error.message }
  }

  revalidateParamPages()
  return { success: true }
}

export async function updateSectionRule(id: number, formData: FormData) {
  const thicknessResult = parseRequiredNumber(formData, 'thickness', '厚度')
  if ('error' in thicknessResult) return thicknessResult

  const widthResult = parseRequiredNumber(formData, 'width', '宽度')
  if ('error' in widthResult) return widthResult

  const enabled = formData.get('enabled') === 'on' ? 1 : 0

  const supabase = await createClient()
  const { error } = await supabase
    .from('duanmian1')
    .update({
      thickness: thicknessResult.value,
      width: widthResult.value,
      isselected: enabled,
    })
    .eq('selectednumber', id)

  if (error) {
    if (error.code === '42501') return permissionError('编辑')
    return { error: error.message }
  }

  revalidateParamPages()
  return { success: true }
}

export async function toggleSectionRule(id: number, enabled: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('duanmian1')
    .update({ isselected: enabled ? 1 : 0 })
    .eq('selectednumber', id)

  if (error) {
    if (error.code === '42501') return permissionError('切换')
    return { error: error.message }
  }

  revalidateParamPages()
  return { success: true }
}

export async function applySectionSelections(selectedIds: number[]) {
  const normalizedIds = Array.from(
    new Set(selectedIds.filter((item) => Number.isFinite(item) && item > 0).map((item) => Math.floor(item))),
  )

  const supabase = await createClient()
  const resetResult = await supabase.from('duanmian1').update({ isselected: 0 }).neq('selectednumber', 0)
  if (resetResult.error) {
    if (resetResult.error.code === '42501') return permissionError('导入')
    return { error: resetResult.error.message }
  }

  if (normalizedIds.length > 0) {
    const enableResult = await supabase
      .from('duanmian1')
      .update({ isselected: 1 })
      .in('selectednumber', normalizedIds)

    if (enableResult.error) {
      if (enableResult.error.code === '42501') return permissionError('导入')
      return { error: enableResult.error.message }
    }
  }

  revalidateParamPages()
  return { success: true, appliedCount: normalizedIds.length }
}

export async function deleteSectionRule(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from('duanmian1').delete().eq('selectednumber', id)

  if (error) {
    if (error.code === '42501') return permissionError('删除')
    return { error: error.message }
  }

  revalidateParamPages()
  return { success: true }
}

export async function createThicknessRule(formData: FormData) {
  const plateMin = parseRequiredNumber(formData, 'plateMin', '钢板厚度下限')
  if ('error' in plateMin) return plateMin
  const plateMax = parseRequiredNumber(formData, 'plateMax', '钢板厚度上限')
  if ('error' in plateMax) return plateMax
  const slabMin = parseRequiredNumber(formData, 'slabMin', '板坯厚度下限')
  if ('error' in slabMin) return slabMin
  const slabMax = parseRequiredNumber(formData, 'slabMax', '板坯厚度上限')
  if ('error' in slabMax) return slabMax

  const supabase = await createClient()
  const { error } = await supabase.from('duanmian2').insert({
    steelthicknesslow: String(plateMin.value),
    steelthicknesshigh: String(plateMax.value),
    thicknesslow: String(slabMin.value),
    thicknesshigh: String(slabMax.value),
  })

  if (error) {
    if (error.code === '42501') return permissionError('新增')
    return { error: error.message }
  }

  revalidateParamPages()
  return { success: true }
}

export async function updateThicknessRule(id: number, formData: FormData) {
  const plateMin = parseRequiredNumber(formData, 'plateMin', '钢板厚度下限')
  if ('error' in plateMin) return plateMin
  const plateMax = parseRequiredNumber(formData, 'plateMax', '钢板厚度上限')
  if ('error' in plateMax) return plateMax
  const slabMin = parseRequiredNumber(formData, 'slabMin', '板坯厚度下限')
  if ('error' in slabMin) return slabMin
  const slabMax = parseRequiredNumber(formData, 'slabMax', '板坯厚度上限')
  if ('error' in slabMax) return slabMax

  const supabase = await createClient()
  const { error } = await supabase
    .from('duanmian2')
    .update({
      steelthicknesslow: String(plateMin.value),
      steelthicknesshigh: String(plateMax.value),
      thicknesslow: String(slabMin.value),
      thicknesshigh: String(slabMax.value),
    })
    .eq('num', id)

  if (error) {
    if (error.code === '42501') return permissionError('编辑')
    return { error: error.message }
  }

  revalidateParamPages()
  return { success: true }
}

export async function deleteThicknessRule(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from('duanmian2').delete().eq('num', id)

  if (error) {
    if (error.code === '42501') return permissionError('删除')
    return { error: error.message }
  }

  revalidateParamPages()
  return { success: true }
}

export async function createLengthRule(formData: FormData) {
  const standardMin = parseRequiredNumber(formData, 'standardMin', '标准板坯长度下限')
  if ('error' in standardMin) return standardMin
  const standardMax = parseRequiredNumber(formData, 'standardMax', '标准板坯长度上限')
  if ('error' in standardMax) return standardMax
  const fullMin = parseRequiredNumber(formData, 'fullMin', '全纵板坯长度下限')
  if ('error' in fullMin) return fullMin
  const fullMax = parseRequiredNumber(formData, 'fullMax', '全纵板坯长度上限')
  if ('error' in fullMax) return fullMax
  const shortMin = parseRequiredNumber(formData, 'shortMin', '长坏料长度下限')
  if ('error' in shortMin) return shortMin
  const shortMax = parseRequiredNumber(formData, 'shortMax', '长坏料长度上限')
  if ('error' in shortMax) return shortMax
  const slabThicknessMin = parseRequiredNumber(formData, 'slabThicknessMin', '板坯厚度下限')
  if ('error' in slabThicknessMin) return slabThicknessMin
  const slabThicknessMax = parseRequiredNumber(formData, 'slabThicknessMax', '板坯厚度上限')
  if ('error' in slabThicknessMax) return slabThicknessMax

  const supabase = await createClient()
  const { error } = await supabase.from('slablengthstandard').insert({
    STD_MIN: String(standardMin.value),
    STD_MAX: String(standardMax.value),
    FULL_MIN: String(fullMin.value),
    FULL_MAX: String(fullMax.value),
    SHORT_MIN: String(shortMin.value),
    SHORT_MAX: String(shortMax.value),
    SLAB_THK_MIN: String(slabThicknessMin.value),
    SLAB_THK_MAX: String(slabThicknessMax.value),
  })

  if (error) {
    if (error.code === '42501') return permissionError('新增')
    return { error: error.message }
  }

  revalidateParamPages()
  return { success: true }
}

export async function updateLengthRule(id: number, formData: FormData) {
  const standardMin = parseRequiredNumber(formData, 'standardMin', '标准板坯长度下限')
  if ('error' in standardMin) return standardMin
  const standardMax = parseRequiredNumber(formData, 'standardMax', '标准板坯长度上限')
  if ('error' in standardMax) return standardMax
  const fullMin = parseRequiredNumber(formData, 'fullMin', '全纵板坯长度下限')
  if ('error' in fullMin) return fullMin
  const fullMax = parseRequiredNumber(formData, 'fullMax', '全纵板坯长度上限')
  if ('error' in fullMax) return fullMax
  const shortMin = parseRequiredNumber(formData, 'shortMin', '长坏料长度下限')
  if ('error' in shortMin) return shortMin
  const shortMax = parseRequiredNumber(formData, 'shortMax', '长坏料长度上限')
  if ('error' in shortMax) return shortMax
  const slabThicknessMin = parseRequiredNumber(formData, 'slabThicknessMin', '板坯厚度下限')
  if ('error' in slabThicknessMin) return slabThicknessMin
  const slabThicknessMax = parseRequiredNumber(formData, 'slabThicknessMax', '板坯厚度上限')
  if ('error' in slabThicknessMax) return slabThicknessMax

  const supabase = await createClient()
  const { error } = await supabase
    .from('slablengthstandard')
    .update({
      STD_MIN: String(standardMin.value),
      STD_MAX: String(standardMax.value),
      FULL_MIN: String(fullMin.value),
      FULL_MAX: String(fullMax.value),
      SHORT_MIN: String(shortMin.value),
      SHORT_MAX: String(shortMax.value),
      SLAB_THK_MIN: String(slabThicknessMin.value),
      SLAB_THK_MAX: String(slabThicknessMax.value),
    })
    .eq('num', id)

  if (error) {
    if (error.code === '42501') return permissionError('编辑')
    return { error: error.message }
  }

  revalidateParamPages()
  return { success: true }
}

export async function deleteLengthRule(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from('slablengthstandard').delete().eq('num', id)

  if (error) {
    if (error.code === '42501') return permissionError('删除')
    return { error: error.message }
  }

  revalidateParamPages()
  return { success: true }
}
