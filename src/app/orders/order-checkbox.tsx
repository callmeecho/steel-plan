'use client'

import { useTransition } from 'react'
import { toggleOrderSelection } from './actions'

interface OrderCheckboxProps {
  orderId: string
  checked: boolean
}

// 单行选中的 checkbox
// useTransition 让 UI 在 Server Action 执行时保持响应
export function OrderCheckbox({ orderId, checked }: OrderCheckboxProps) {
  const [isPending, startTransition] = useTransition()

  function handleChange() {
    startTransition(async () => {
      await toggleOrderSelection(orderId)
    })
  }

  return (
    <input
      type="checkbox"
      checked={checked}
      disabled={isPending}
      onChange={handleChange}
      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
    />
  )
}