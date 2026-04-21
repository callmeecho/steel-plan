'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SteelGradeOption {
  id: string
  standard_steel: string
  internal_code: string
}

interface FilterBarProps {
  steelGrades: SteelGradeOption[]
}

const STATUS_OPTIONS = [
  { value: 'pending', label: '待处理' },
  { value: 'imported', label: '已导入' },
  { value: 'in_progress', label: '处理中' },
  { value: 'completed', label: '完成' },
  { value: 'cancelled', label: '取消' },
]

// 筛选栏
// 所有筛选条件写入 URL，保证可分享、可刷新、可返回
export function SearchBar({ steelGrades }: FilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // 基础筛选
  const [keyword, setKeyword] = useState(searchParams.get('search') || '')
  const [steelGradeId, setSteelGradeId] = useState(
    searchParams.get('steel_grade') || ''
  )
  const [status, setStatus] = useState(searchParams.get('status') || '')

  // 尺寸范围筛选
  const [thicknessMin, setThicknessMin] = useState(
    searchParams.get('thickness_min') || ''
  )
  const [thicknessMax, setThicknessMax] = useState(
    searchParams.get('thickness_max') || ''
  )
  const [widthMin, setWidthMin] = useState(searchParams.get('width_min') || '')
  const [widthMax, setWidthMax] = useState(searchParams.get('width_max') || '')
  const [lengthMin, setLengthMin] = useState(
    searchParams.get('length_min') || ''
  )
  const [lengthMax, setLengthMax] = useState(
    searchParams.get('length_max') || ''
  )

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()

    if (keyword.trim()) params.set('search', keyword.trim())
    if (steelGradeId) params.set('steel_grade', steelGradeId)
    if (status) params.set('status', status)

    if (thicknessMin) params.set('thickness_min', thicknessMin)
    if (thicknessMax) params.set('thickness_max', thicknessMax)
    if (widthMin) params.set('width_min', widthMin)
    if (widthMax) params.set('width_max', widthMax)
    if (lengthMin) params.set('length_min', lengthMin)
    if (lengthMax) params.set('length_max', lengthMax)

    router.push(
      params.toString() ? `${pathname}?${params.toString()}` : pathname
    )
  }

  function reset() {
    setKeyword('')
    setSteelGradeId('')
    setStatus('')
    setThicknessMin('')
    setThicknessMax('')
    setWidthMin('')
    setWidthMax('')
    setLengthMin('')
    setLengthMax('')
    router.push(pathname)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* 第一行：基础筛选 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="订单号"
          name="search"
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="支持模糊匹配"
        />

        <div className="space-y-1">
          <label
            htmlFor="steel_grade"
            className="block text-sm font-medium text-gray-700"
          >
            钢种
          </label>
          <select
            id="steel_grade"
            name="steel_grade"
            value={steelGradeId}
            onChange={(e) => setSteelGradeId(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">全部钢种</option>
            {steelGrades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.standard_steel} ({g.internal_code})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700"
          >
            订单状态
          </label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">全部状态</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 第二行：尺寸范围 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
        <RangeField
          label="厚度 (mm)"
          minValue={thicknessMin}
          maxValue={thicknessMax}
          onMinChange={setThicknessMin}
          onMaxChange={setThicknessMax}
        />
        <RangeField
          label="宽度 (mm)"
          minValue={widthMin}
          maxValue={widthMax}
          onMinChange={setWidthMin}
          onMaxChange={setWidthMax}
        />
        <RangeField
          label="长度 (mm)"
          minValue={lengthMin}
          maxValue={lengthMax}
          onMinChange={setLengthMin}
          onMaxChange={setLengthMax}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={reset}>
          重置
        </Button>
        <Button type="submit">搜索</Button>
      </div>
    </form>
  )
}

// 抽出范围输入框组件，三组尺寸共用
function RangeField({
  label,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
}: {
  label: string
  minValue: string
  maxValue: string
  onMinChange: (v: string) => void
  onMaxChange: (v: string) => void
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={minValue}
          onChange={(e) => onMinChange(e.target.value)}
          placeholder="最小"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="text-gray-400">—</span>
        <input
          type="number"
          value={maxValue}
          onChange={(e) => onMaxChange(e.target.value)}
          placeholder="最大"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}