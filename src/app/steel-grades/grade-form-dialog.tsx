'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { SteelGrade } from '@/lib/database.types'
import { createSteelGrade, updateSteelGrade } from './actions'

interface Props {
  open: boolean
  onClose: () => void
  grade: SteelGrade | null // null = 新增, 有值 = 编辑
}

// 新增/编辑钢种的模态框
// 复用同一个表单 UI, 根据 grade 是否存在判断模式
export function GradeFormDialog({ open, onClose, grade }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isEdit = grade !== null

  // 弹窗每次打开时清掉之前的错误
  useEffect(() => {
    if (open) setError(null)
  }, [open])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = isEdit
      ? await updateSteelGrade(grade.id, formData)
      : await createSteelGrade(formData)

    setLoading(false)

    if (result?.error) {
      setError(result.error)
      return
    }
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? '编辑钢种' : '新增钢种'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="国标钢种"
            name="standard_steel"
            type="text"
            required
            placeholder="如 Q235B"
            defaultValue={grade?.standard_steel ?? ''}
          />
          <Input
            label="内部代码"
            name="internal_code"
            type="text"
            required
            placeholder="如 Q235B-STD"
            defaultValue={grade?.internal_code ?? ''}
          />
          <div className="space-y-1">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              描述 (可选)
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={grade?.description ?? ''}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="钢种用途、特性等说明"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" loading={loading}>
              {isEdit ? '保存' : '创建'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}