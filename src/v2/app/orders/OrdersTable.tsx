'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, RefreshCw, Search, Sparkles } from 'lucide-react'

import { Btn, Checkbox } from '../../components/ui/primitives'
import type { Order } from '../../types/domain'

type Filters = {
  search: string
  grade: string
  tMin: string
  tMax: string
  wMin: string
  wMax: string
}

const EMPTY_FILTERS: Filters = {
  search: '',
  grade: '',
  tMin: '',
  tMax: '',
  wMin: '',
  wMax: '',
}

export function OrdersTable({ orders }: { orders: Order[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [draftFilters, setDraftFilters] = useState<Filters>(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS)
  const [hasQueried, setHasQueried] = useState(false)

  const grades = useMemo(
    () => Array.from(new Set(orders.map((item) => item.grade).filter(Boolean))).sort(),
    [orders],
  )

  const filtered = useMemo(() => {
    if (!hasQueried) return [] as Order[]

    return orders.filter((item) => {
      if (
        appliedFilters.search &&
        !`${item.orderId} ${item.contract} ${item.grade}`
          .toLowerCase()
          .includes(appliedFilters.search.toLowerCase())
      ) {
        return false
      }
      if (appliedFilters.grade && item.grade !== appliedFilters.grade) return false
      if (appliedFilters.tMin && item.thickness < Number(appliedFilters.tMin)) return false
      if (appliedFilters.tMax && item.thickness > Number(appliedFilters.tMax)) return false
      if (appliedFilters.wMin && item.width < Number(appliedFilters.wMin)) return false
      if (appliedFilters.wMax && item.width > Number(appliedFilters.wMax)) return false
      return true
    })
  }, [appliedFilters, hasQueried, orders])

  const allSelected = filtered.length > 0 && filtered.every((item) => selected.has(item.id))
  const someSelected = filtered.some((item) => selected.has(item.id))

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setDraftFilters((previous) => ({ ...previous, [key]: value }))
  }

  function handleQuery() {
    setAppliedFilters(draftFilters)
    setHasQueried(true)
  }

  function handleReset() {
    setDraftFilters(EMPTY_FILTERS)
    setAppliedFilters(EMPTY_FILTERS)
    setHasQueried(false)
    setSelected(new Set())
  }

  function toggleAll() {
    const next = new Set(selected)
    if (allSelected) {
      filtered.forEach((item) => next.delete(item.id))
    } else {
      filtered.forEach((item) => next.add(item.id))
    }
    setSelected(next)
  }

  function toggleOne(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const chosen = orders.filter((item) => selected.has(item.id))
  const totalWeight = chosen.reduce((sum, item) => sum + item.weight, 0)
  const filteredTotalWeight = filtered.reduce((sum, item) => sum + item.weight, 0)

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-edge bg-white px-5 pt-4 pb-3">
        <div className="text-[18px] font-semibold tracking-tight text-ink">订单查询</div>
        <div className="flex gap-2">
          <Btn size="sm">
            <Download className="h-3 w-3" /> 导出
          </Btn>
          <Btn size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-3 w-3" /> 刷新
          </Btn>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-edge bg-white px-5 py-3 text-[12px]">
        <div className="flex min-w-[280px] items-center gap-2 rounded-lg border border-edge bg-surface-subtle px-3 py-2">
          <Search className="h-3.5 w-3.5 text-ink-tertiary" />
          <input
            className="flex-1 bg-transparent text-[12px] outline-none"
            placeholder="订单号 / 合同号 / 钢种"
            value={draftFilters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-ink-tertiary">钢种</label>
          <select
            className="rounded-lg border border-edge bg-white px-2 py-2 text-[12px]"
            value={draftFilters.grade}
            onChange={(event) => updateFilter('grade', event.target.value)}
          >
            <option value="">全部</option>
            {grades.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-ink-tertiary">厚度</label>
          <input
            className="w-16 rounded-lg border border-edge px-2 py-2 text-[12px]"
            placeholder="最小"
            value={draftFilters.tMin}
            onChange={(event) => updateFilter('tMin', event.target.value)}
          />
          <span className="text-ink-tertiary">-</span>
          <input
            className="w-16 rounded-lg border border-edge px-2 py-2 text-[12px]"
            placeholder="最大"
            value={draftFilters.tMax}
            onChange={(event) => updateFilter('tMax', event.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-ink-tertiary">宽度</label>
          <input
            className="w-16 rounded-lg border border-edge px-2 py-2 text-[12px]"
            placeholder="最小"
            value={draftFilters.wMin}
            onChange={(event) => updateFilter('wMin', event.target.value)}
          />
          <span className="text-ink-tertiary">-</span>
          <input
            className="w-16 rounded-lg border border-edge px-2 py-2 text-[12px]"
            placeholder="最大"
            value={draftFilters.wMax}
            onChange={(event) => updateFilter('wMax', event.target.value)}
          />
        </div>

        <div className="flex-1" />

        <Btn size="sm" variant="ghost" onClick={handleReset}>
          重置
        </Btn>
        <Btn size="sm" variant="primary" onClick={handleQuery}>
          <Search className="h-3 w-3" /> 查询
        </Btn>
      </div>

      {!hasQueried ? (
        <div className="grid flex-1 place-items-center bg-[#f3f6fb]">
          <div className="text-center">
            <div className="text-[16px] font-semibold text-ink-secondary">点击查询后加载订单</div>
            <div className="mt-2 text-[12px] text-ink-tertiary">
              当前可用订单数据 {orders.length} 条
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-auto pb-[120px]">
            <table className="w-full border-collapse text-[12px] tabular-nums">
              <thead className="sticky top-0 bg-surface-subtle">
                <tr className="h-10 text-left text-[11px] text-ink-tertiary">
                  <th className="w-10 pl-4">
                    <Checkbox
                      state={allSelected ? 'checked' : someSelected ? 'indeterminate' : ''}
                      onClick={toggleAll}
                    />
                  </th>
                  <th className="font-medium">订单号</th>
                  <th className="text-right font-medium">序列</th>
                  <th className="font-medium">钢种</th>
                  <th className="text-right font-medium">厚度</th>
                  <th className="text-right font-medium">宽度</th>
                  <th className="text-right font-medium">长度</th>
                  <th className="text-right font-medium">数量</th>
                  <th className="text-right font-medium">欠重量(t)</th>
                  <th className="font-medium">定尺</th>
                  <th className="font-medium">表面</th>
                  <th className="font-medium">交货期</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((item) => {
                    const checked = selected.has(item.id)

                    return (
                      <tr
                        key={item.id}
                        onClick={() => toggleOne(item.id)}
                        className={`h-9 cursor-pointer border-t border-edge ${
                          checked ? 'bg-accent-soft' : 'hover:bg-surface-hover'
                        }`}
                      >
                        <td className="pl-4">
                          <Checkbox
                            state={checked ? 'checked' : ''}
                            onClick={() => toggleOne(item.id)}
                          />
                        </td>
                        <td className="font-mono text-[11.5px]">{item.orderId}</td>
                        <td className="text-right">{item.orderSeq}</td>
                        <td className="font-mono text-[11.5px]">{item.grade}</td>
                        <td className="text-right">{item.thickness.toFixed(2)}</td>
                        <td className="text-right">{item.width}</td>
                        <td className="text-right">{item.length}</td>
                        <td className="text-right">{item.qty}</td>
                        <td className="text-right font-semibold">{item.weight.toFixed(2)}</td>
                        <td className="text-[11px] text-ink-tertiary">{item.definition}</td>
                        <td className="text-[11px] text-ink-tertiary">{item.surface}</td>
                        <td className="font-mono text-[11.5px] text-ink-tertiary">
                          {item.dueDate ? item.dueDate.slice(5) : '-'}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={12}
                      className="px-6 py-16 text-center text-[12px] text-ink-tertiary"
                    >
                      当前条件下没有查询到订单。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-3 border-t border-edge bg-white px-5 py-3 text-[11.5px] text-ink-tertiary">
            <span>
              共 <b className="font-mono text-ink">{filtered.length}</b> 条
            </span>
            <span>·</span>
            <span>
              合计欠重量 <b className="font-mono text-ink">{filteredTotalWeight.toFixed(2)}</b> t
            </span>
            <div className="flex-1" />
            <span className="font-mono text-[11px]">第 1 / 1 页</span>
          </div>
        </>
      )}

      {selected.size > 0 ? (
        <div className="pointer-events-none fixed right-0 bottom-6 left-[272px] z-40 flex justify-center px-6">
          <div className="pointer-events-auto flex items-center gap-3 rounded-lg bg-sidebar px-4 py-2 text-[12px] text-white shadow-[0_16px_40px_rgba(15,23,42,0.28)]">
            <div className="flex gap-3">
              <span>
                已选 <b className="font-mono">{selected.size}</b>
              </span>
              <span className="text-white/50">
                / 欠重量 <b className="font-mono text-white">{totalWeight.toFixed(2)}</b> t
              </span>
            </div>
            <Btn
              size="sm"
              className="!border-transparent !bg-white/10 !text-white hover:!bg-white/20"
              onClick={() => setSelected(new Set())}
            >
              清空
            </Btn>
            <Btn
              size="sm"
              variant="primary"
              onClick={() => router.push(`/generate?orderIds=${[...selected].join(',')}`)}
            >
              <Sparkles className="h-3 w-3" /> 一键组坯优化
            </Btn>
          </div>
        </div>
      ) : null}
    </div>
  )
}
