'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { clearAllSelections, selectManyOrders } from './actions'

interface SelectionPanelProps {
  selectedCount: number
  selectedTotalWeight: number
  currentPageOrderIds: string[]
  allFilteredOrderIds: string[]
}

// 已选订单面板
// 显示选中数量/总重量 + 清空按钮 + 全选本页/全选全部按钮
export function SelectionPanel({
  selectedCount,
  selectedTotalWeight,
  currentPageOrderIds,
  allFilteredOrderIds,
}: SelectionPanelProps) {
  const [isPending, startTransition] = useTransition()

  function handleSelectCurrentPage() {
    startTransition(async () => {
      await selectManyOrders(currentPageOrderIds)
    })
  }

  function handleSelectAll() {
    startTransition(async () => {
      await selectManyOrders(allFilteredOrderIds)
    })
  }

  function handleClear() {
    if (!confirm('确定清空所有选中的订单吗?')) return
    startTransition(async () => {
      await clearAllSelections()
    })
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6 flex items-center justify-between flex-wrap gap-3">
      <div className="text-sm text-gray-700">
        已选 <span className="font-bold text-blue-700">{selectedCount}</span> 条订单
        <span className="ml-4 text-gray-500">
          总重量 <span className="font-bold text-gray-800">{selectedTotalWeight.toFixed(2)}</span> t
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleSelectCurrentPage}
          disabled={isPending || currentPageOrderIds.length === 0}
        >
          选中本页
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleSelectAll}
          disabled={isPending || allFilteredOrderIds.length === 0}
        >
          全选 ({allFilteredOrderIds.length})
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={handleClear}
          disabled={isPending || selectedCount === 0}
        >
          清空
        </Button>
      </div>
    </div>
  )
}