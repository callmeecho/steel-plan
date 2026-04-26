'use client'

import Link from 'next/link'
import { useTransition } from 'react'

import { Button } from '@/components/ui/button'

import { clearAllSelections, selectManyOrders } from './actions'

interface SelectionPanelProps {
  selectedCount: number
  selectedTotalWeight: number
  currentPageOrderIds: string[]
  allFilteredOrderIds: string[]
}

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
    const confirmed = confirm('确认要清空当前已选订单吗？')
    if (!confirmed) {
      return
    }

    startTransition(async () => {
      await clearAllSelections()
    })
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
      <div className="text-sm text-gray-700">
        已选择 <span className="font-bold text-blue-700">{selectedCount}</span> 条订单
        <span className="ml-4 text-gray-500">
          总重量{' '}
          <span className="font-bold text-gray-800">
            {selectedTotalWeight.toFixed(2)}
          </span>{' '}
          t
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/planning">
          <Button size="sm">进入任务准备</Button>
        </Link>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleSelectCurrentPage}
          disabled={isPending || currentPageOrderIds.length === 0}
        >
          选择本页
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleSelectAll}
          disabled={isPending || allFilteredOrderIds.length === 0}
        >
          全选筛选结果 ({allFilteredOrderIds.length})
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={handleClear}
          disabled={isPending || selectedCount === 0}
        >
          清空已选
        </Button>
      </div>
    </div>
  )
}
