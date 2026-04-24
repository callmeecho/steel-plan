'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
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

export function SearchBar({ steelGrades }: FilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [keyword, setKeyword] = useState(searchParams.get('search') || '')
  const [steelGradeId, setSteelGradeId] = useState(
    searchParams.get('steel_grade') || ''
  )

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

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const params = new URLSearchParams()

    if (keyword.trim()) params.set('search', keyword.trim())
    if (steelGradeId) params.set('steel_grade', steelGradeId)
    if (thicknessMin) params.set('thickness_min', thicknessMin)
    if (thicknessMax) params.set('thickness_max', thicknessMax)
    if (widthMin) params.set('width_min', widthMin)
    if (widthMax) params.set('width_max', widthMax)
    if (lengthMin) params.set('length_min', lengthMin)
    if (lengthMax) params.set('length_max', lengthMax)

    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname)
  }

  function reset() {
    setKeyword('')
    setSteelGradeId('')
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="订单号"
          name="search"
          type="text"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="输入订单号关键字"
        />

        <div className="space-y-1">
          <label htmlFor="steel_grade" className="block text-sm font-medium text-gray-700">
            钢种
          </label>
          <select
            id="steel_grade"
            name="steel_grade"
            value={steelGradeId}
            onChange={(event) => setSteelGradeId(event.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">全部钢种</option>
            {steelGrades.map((grade) => (
              <option key={grade.id} value={grade.id}>
                {grade.standard_steel} ({grade.internal_code})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 md:grid-cols-3">
        <RangeField
          label="厚度范围 (mm)"
          minValue={thicknessMin}
          maxValue={thicknessMax}
          onMinChange={setThicknessMin}
          onMaxChange={setThicknessMax}
        />
        <RangeField
          label="宽度范围 (mm)"
          minValue={widthMin}
          maxValue={widthMax}
          onMinChange={setWidthMin}
          onMaxChange={setWidthMax}
        />
        <RangeField
          label="长度范围 (mm)"
          minValue={lengthMin}
          maxValue={lengthMax}
          onMinChange={setLengthMin}
          onMaxChange={setLengthMax}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={reset}>
          重置筛选
        </Button>
        <Button type="submit">应用筛选</Button>
      </div>
    </form>
  )
}

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
  onMinChange: (value: string) => void
  onMaxChange: (value: string) => void
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={minValue}
          onChange={(event) => onMinChange(event.target.value)}
          placeholder="最小值"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="text-gray-400">-</span>
        <input
          type="number"
          value={maxValue}
          onChange={(event) => onMaxChange(event.target.value)}
          placeholder="最大值"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}

