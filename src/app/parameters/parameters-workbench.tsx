'use client'

import { useMemo, useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'

type TabKey = 'section' | 'thickness' | 'length'

type SectionType = {
  id: string
  thicknessMm: number
  widthMm: number
}

type ThicknessRule = {
  id: string
  plateMin: number
  plateMax: number
  slabMin: number
  slabMax: number
}

type LengthRule = {
  id: string
  slabMin: number
  slabMax: number
  targetLength: number
  allowLonger: boolean
}

const TAB_LABELS: Record<TabKey, string> = {
  section: '断面类型',
  thickness: '厚度筛选标准',
  length: '板坯长度标准',
}

const INITIAL_SECTION_TYPES: SectionType[] = [
  { id: 'st-180-1665', thicknessMm: 180, widthMm: 1665 },
  { id: 'st-180-1865', thicknessMm: 180, widthMm: 1865 },
  { id: 'st-220-2065', thicknessMm: 220, widthMm: 2065 },
  { id: 'st-260-2265', thicknessMm: 260, widthMm: 2265 },
]

const INITIAL_THICKNESS_RULES: ThicknessRule[] = [
  { id: 'tr-1', plateMin: 0, plateMax: 7.99, slabMin: 0, slabMax: 181 },
  { id: 'tr-2', plateMin: 7.99, plateMax: 13.99, slabMin: 219, slabMax: 221 },
  { id: 'tr-3', plateMin: 13.99, plateMax: 10000, slabMin: 219, slabMax: 261 },
]

const INITIAL_LENGTH_RULES: LengthRule[] = [
  { id: 'lr-1', slabMin: 5200, slabMax: 6900, targetLength: 6000, allowLonger: false },
  { id: 'lr-2', slabMin: 6901, slabMax: 9200, targetLength: 8000, allowLonger: true },
  { id: 'lr-3', slabMin: 9201, slabMax: 13000, targetLength: 10600, allowLonger: true },
]

export function ParametersWorkbench() {
  const [activeTab, setActiveTab] = useState<TabKey>('section')
  const [sectionTypes, setSectionTypes] = useState(INITIAL_SECTION_TYPES)
  const [thicknessRules, setThicknessRules] = useState(INITIAL_THICKNESS_RULES)
  const [lengthRules, setLengthRules] = useState(INITIAL_LENGTH_RULES)

  const sectionSummary = useMemo(
    () => `${sectionTypes.length} 条`,
    [sectionTypes.length]
  )
  const thicknessSummary = useMemo(
    () => `${thicknessRules.length} 条`,
    [thicknessRules.length]
  )
  const lengthSummary = useMemo(
    () => `${lengthRules.length} 条`,
    [lengthRules.length]
  )

  function handleAddSectionType() {
    const thicknessInput = window.prompt('输入厚度 (mm)', '220')
    const widthInput = window.prompt('输入宽度 (mm)', '2065')
    const thickness = Number(thicknessInput)
    const width = Number(widthInput)

    if (!Number.isFinite(thickness) || !Number.isFinite(width)) {
      return
    }

    setSectionTypes((current) => [
      ...current,
      {
        id: `st-${thickness}-${width}-${Date.now()}`,
        thicknessMm: thickness,
        widthMm: width,
      },
    ])
  }

  function handleAddThicknessRule() {
    const plateMin = Number(window.prompt('钢板厚度下限', '0'))
    const plateMax = Number(window.prompt('钢板厚度上限', '10'))
    const slabMin = Number(window.prompt('板坯厚度下限', '180'))
    const slabMax = Number(window.prompt('板坯厚度上限', '220'))

    if (
      !Number.isFinite(plateMin) ||
      !Number.isFinite(plateMax) ||
      !Number.isFinite(slabMin) ||
      !Number.isFinite(slabMax)
    ) {
      return
    }

    setThicknessRules((current) => [
      ...current,
      {
        id: `tr-${Date.now()}`,
        plateMin,
        plateMax,
        slabMin,
        slabMax,
      },
    ])
  }

  function handleAddLengthRule() {
    const slabMin = Number(window.prompt('板坯长度下限', '5200'))
    const slabMax = Number(window.prompt('板坯长度上限', '6900'))
    const targetLength = Number(window.prompt('目标板坯长度', '6000'))

    if (
      !Number.isFinite(slabMin) ||
      !Number.isFinite(slabMax) ||
      !Number.isFinite(targetLength)
    ) {
      return
    }

    setLengthRules((current) => [
      ...current,
      {
        id: `lr-${Date.now()}`,
        slabMin,
        slabMax,
        targetLength,
        allowLonger: false,
      },
    ])
  }

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.35)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
            参数设置
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">规则配置工作台</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <SummaryPill label="断面类型" value={sectionSummary} />
          <SummaryPill label="厚度规则" value={thicknessSummary} />
          <SummaryPill label="长度规则" value={lengthSummary} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {(['section', 'thickness', 'length'] as TabKey[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === tab
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'section' ? (
          <ParameterCard
            title="断面类型"
            actionLabel="新增断面类型"
            onAction={handleAddSectionType}
          >
            <SimpleTable
              columns={['厚度 (mm)', '宽度 (mm)', '操作']}
              rows={sectionTypes.map((item) => [
                `${item.thicknessMm}`,
                `${item.widthMm}`,
                <DeleteButton
                  key={item.id}
                  onClick={() =>
                    setSectionTypes((current) =>
                      current.filter((row) => row.id !== item.id)
                    )
                  }
                />,
              ])}
            />
          </ParameterCard>
        ) : null}

        {activeTab === 'thickness' ? (
          <ParameterCard
            title="厚度筛选标准"
            actionLabel="新增厚度范围"
            onAction={handleAddThicknessRule}
          >
            <SimpleTable
              columns={['钢板厚度下限', '钢板厚度上限', '板坯厚度下限', '板坯厚度上限', '操作']}
              rows={thicknessRules.map((item) => [
                formatNumber(item.plateMin),
                formatNumber(item.plateMax),
                formatNumber(item.slabMin),
                formatNumber(item.slabMax),
                <DeleteButton
                  key={item.id}
                  onClick={() =>
                    setThicknessRules((current) =>
                      current.filter((row) => row.id !== item.id)
                    )
                  }
                />,
              ])}
            />
          </ParameterCard>
        ) : null}

        {activeTab === 'length' ? (
          <ParameterCard
            title="板坯长度标准"
            actionLabel="新增长度标准"
            onAction={handleAddLengthRule}
          >
            <SimpleTable
              columns={['板坯长度下限', '板坯长度上限', '目标板坯长度', '允许长坯', '操作']}
              rows={lengthRules.map((item) => [
                formatNumber(item.slabMin),
                formatNumber(item.slabMax),
                formatNumber(item.targetLength),
                item.allowLonger ? '是' : '否',
                <div key={item.id} className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setLengthRules((current) =>
                        current.map((row) =>
                          row.id === item.id
                            ? { ...row, allowLonger: !row.allowLonger }
                            : row
                        )
                      )
                    }
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                  >
                    切换
                  </button>
                  <DeleteButton
                    onClick={() =>
                      setLengthRules((current) =>
                        current.filter((row) => row.id !== item.id)
                      )
                    }
                  />
                </div>,
              ])}
            />
          </ParameterCard>
        ) : null}
      </div>
    </section>
  )
}

function ParameterCard({
  title,
  actionLabel,
  onAction,
  children,
}: {
  title: string
  actionLabel: string
  onAction: () => void
  children: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-4">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <Button type="button" onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function SimpleTable({
  columns,
  rows,
}: {
  columns: string[]
  rows: Array<Array<string | ReactNode>>
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
        暂无数据
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {rows.map((row, index) => (
              <tr key={`row-${index}`}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={`cell-${index}-${cellIndex}`}
                    className="px-3 py-2 text-sm text-slate-700"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
    >
      删除
    </button>
  )
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
      {label}: {value}
    </span>
  )
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(2)
}
