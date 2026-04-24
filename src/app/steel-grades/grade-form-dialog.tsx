'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { SteelGrade } from '@/lib/database.types'

import { createSteelGrade, updateSteelGrade } from './actions'

interface Props {
  open: boolean
  onClose: () => void
  grade: SteelGrade | null
}

export function GradeFormDialog({ open, onClose, grade }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const isEdit = grade !== null

  useEffect(() => {
    if (open) {
      setError(null)
    }
  }, [open])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const result = isEdit
      ? await updateSteelGrade(grade.id, formData)
      : await createSteelGrade(formData)

    setLoading(false)

    if ('error' in result) {
      setError(result.error)
      return
    }

    onClose()
  }

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-gray-200 bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? '编辑钢种' : '新增钢种'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <Input
            label="标准钢种"
            name="standard_steel"
            type="text"
            required
            placeholder="例如 Q235B"
            defaultValue={grade?.standard_steel ?? ''}
          />
          <Input
            label="内部编码"
            name="internal_code"
            type="text"
            required
            placeholder="例如 Q235B-STD"
            defaultValue={grade?.internal_code ?? ''}
          />

          <div className="space-y-1">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              描述说明
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={grade?.description ?? ''}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="补充这类钢种的备注、适用范围或管理说明。"
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
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
              {isEdit ? '保存修改' : '创建钢种'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
