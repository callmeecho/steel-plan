'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, RefreshCw, Search, Upload } from 'lucide-react'

import { Btn, Checkbox } from '../../components/ui/primitives'
import type { Order } from '../../types/domain'
import { replaceOrderSelections } from './actions'

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

const PAGE_SIZE = 20

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[\s\-_/\\]+/g, '').trim()
}

function formatSequence(subOrder: string, orderSeq: number) {
  const raw = String(subOrder || '').trim()
  if (/^\d+$/.test(raw)) return raw.padStart(3, '0')
  if (raw) return raw
  return String(orderSeq || 0).padStart(3, '0')
}

type OrdersTableProps = {
  orders: Order[]
  gradeOptions?: string[]
}

export function OrdersTable({ orders, gradeOptions = [] }: OrdersTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [draftFilters, setDraftFilters] = useState<Filters>(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS)
  const [hasQueried, setHasQueried] = useState(false)
  const [page, setPage] = useState(1)
  const [importNote, setImportNote] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  const grades = useMemo(() => {
    const fromOrders = orders.map((item) => item.grade).filter(Boolean)
    return Array.from(new Set([...gradeOptions, ...fromOrders])).sort((a, b) =>
      a.localeCompare(b, 'zh-CN'),
    )
  }, [gradeOptions, orders])

  const filtered = useMemo(() => {
    if (!hasQueried) return [] as Order[]

    return orders.filter((item) => {
      if (appliedFilters.search) {
        const query = normalizeSearchText(appliedFilters.search)
        const haystack = normalizeSearchText(
          [
            item.orderId,
            item.contract,
            item.subOrder,
            String(item.orderSeq),
            item.grade,
            String(item.thickness),
            String(item.width),
            String(item.length),
          ].join(' '),
        )
        if (!haystack.includes(query)) return false
      }

      if (appliedFilters.grade && item.grade !== appliedFilters.grade) return false
      if (appliedFilters.tMin && item.thickness < Number(appliedFilters.tMin)) return false
      if (appliedFilters.tMax && item.thickness > Number(appliedFilters.tMax)) return false
      if (appliedFilters.wMin && item.width < Number(appliedFilters.wMin)) return false
      if (appliedFilters.wMax && item.width > Number(appliedFilters.wMax)) return false
      return true
    })
  }, [appliedFilters, hasQueried, orders])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const allSelected = paged.length > 0 && paged.every((item) => selected.has(item.id))
  const someSelected = paged.some((item) => selected.has(item.id))
  const allFilteredSelected = filtered.length > 0 && filtered.every((item) => selected.has(item.id))

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setDraftFilters((previous) => ({ ...previous, [key]: value }))
  }

  function handleQuery() {
    setAppliedFilters(draftFilters)
    setHasQueried(true)
    setPage(1)
    setImportNote(null)
  }

  function handleReset() {
    setDraftFilters(EMPTY_FILTERS)
    setAppliedFilters(EMPTY_FILTERS)
    setHasQueried(false)
    setSelected(new Set())
    setPage(1)
    setImportNote(null)
  }

  async function handleImportOrders() {
    if (selected.size === 0 || importing) return
    setImporting(true)
    const result = await replaceOrderSelections([...selected])
    setImporting(false)

    if ('error' in result) {
      setImportNote(`导入失败：${result.error}`)
      return
    }
    setImportNote(`已导入 ${result.inserted} 条订单。`)
  }

  function handleToggleSelectAllFiltered() {
    if (!hasQueried || filtered.length === 0) return
    if (allFilteredSelected) {
      setSelected(new Set())
      return
    }
    setSelected(new Set(filtered.map((item) => item.id)))
  }

  function toggleAllCurrentPage() {
    const next = new Set(selected)
    if (allSelected) paged.forEach((item) => next.delete(item.id))
    else paged.forEach((item) => next.add(item.id))
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
      <div className="flex items-center justify-between border-b border-edge bg-white px-5 pb-3 pt-4">
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
        <Btn
          size="sm"
          variant="ghost"
          onClick={handleToggleSelectAllFiltered}
          disabled={!hasQueried || filtered.length === 0}
        >
          {allFilteredSelected ? '取消全选' : '全选'}
        </Btn>
        <Btn size="sm" variant="primary" onClick={handleQuery}>
          <Search className="h-3 w-3" /> 查询
        </Btn>
      </div>

      {!hasQueried ? (
        <div className="grid flex-1 place-items-center bg-[#f3f6fb]">
          <div className="text-center">
            <div className="text-[16px] font-semibold text-ink-secondary">点击查询后加载订单</div>
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
                      onClick={toggleAllCurrentPage}
                    />
                  </th>
                  <th className="font-medium">订单号</th>
                  <th className="w-[104px] pr-8 text-right font-medium">序列</th>
                  <th className="pl-8 font-medium">钢种</th>
                  <th className="text-right font-medium">厚度</th>
                  <th className="text-right font-medium">宽度</th>
                  <th className="text-right font-medium">长度</th>
                  <th className="text-right font-medium">数量</th>
                  <th className="pr-8 text-right font-medium">欠重量 (t)</th>
                  <th className="pl-8 font-medium">定尺区分</th>
                  <th className="font-medium">表面</th>
                  <th className="font-medium">交货期</th>
                </tr>
              </thead>
              <tbody>
                {paged.length > 0 ? (
                  paged.map((item) => {
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
                          <Checkbox state={checked ? 'checked' : ''} onClick={() => toggleOne(item.id)} />
                        </td>
                        <td className="font-mono text-[11.5px]">{item.orderId}</td>
                        <td className="w-[104px] pr-8 text-right tabular-nums">
                          {formatSequence(item.subOrder, item.orderSeq)}
                        </td>
                        <td className="pl-8 font-mono text-[11.5px]">{item.grade}</td>
                        <td className="text-right">{item.thickness.toFixed(2)}</td>
                        <td className="text-right">{item.width}</td>
                        <td className="text-right">{item.length}</td>
                        <td className="text-right">{item.qty}</td>
                        <td className="pr-8 text-right font-semibold">{item.weight.toFixed(2)}</td>
                        <td className="pl-8 text-[11px] text-ink-tertiary">{item.definition}</td>
                        <td className="text-[11px] text-ink-tertiary">{item.surface}</td>
                        <td className="font-mono text-[11.5px] text-ink-tertiary">
                          {item.dueDate ? item.dueDate.slice(5) : '-'}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={12} className="px-6 py-16 text-center text-[12px] text-ink-tertiary">
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

            <div className="ml-auto flex items-center gap-2">
              <Btn size="sm" variant="ghost" onClick={() => setPage(1)} disabled={page <= 1}>
                首页
              </Btn>
              <Btn
                size="sm"
                variant="ghost"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
              >
                上一页
              </Btn>
              <span className="font-mono text-[11px] text-ink-secondary">
                第 {page} / {totalPages} 页
              </span>
              <Btn
                size="sm"
                variant="ghost"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
              >
                下一页
              </Btn>
              <Btn size="sm" variant="ghost" onClick={() => setPage(totalPages)} disabled={page >= totalPages}>
                末页
              </Btn>
            </div>
          </div>
        </>
      )}

      {selected.size > 0 ? (
        <div className="pointer-events-none fixed bottom-6 left-[272px] right-0 z-40 flex justify-center px-6">
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
              disabled={importing}
              onClick={() => {
                void handleImportOrders()
              }}
            >
              <Upload className="h-3 w-3" /> 一键导入订单
            </Btn>
          </div>
        </div>
      ) : null}

      {importNote ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0f172a]/35 px-4">
          <div className="w-full max-w-[480px] rounded-xl border border-edge bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.3)]">
            <div className="text-[16px] font-semibold text-ink">订单导入结果</div>
            <div className="mt-2 text-[13px] text-ink-secondary">{importNote}</div>
            <div className="mt-4 flex justify-end">
              <Btn size="sm" variant="primary" onClick={() => setImportNote(null)}>
                确定
              </Btn>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

