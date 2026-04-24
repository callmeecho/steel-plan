'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { setOrderSelection } from './actions'

interface OrderCheckboxProps {
  orderId: string
  checked: boolean
}

export function OrderCheckbox({ orderId, checked }: OrderCheckboxProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [localChecked, setLocalChecked] = useState(checked)

  useEffect(() => {
    setLocalChecked(checked)
  }, [checked])

  function handleChange() {
    const nextChecked = !localChecked

    startTransition(async () => {
      setLocalChecked(nextChecked)

      const result = await setOrderSelection(orderId, nextChecked)

      if ('error' in result) {
        setLocalChecked(checked)
        return
      }

      router.refresh()
    })
  }

  return (
    <input
      type="checkbox"
      checked={localChecked}
      aria-busy={isPending}
      onChange={handleChange}
      className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
    />
  )
}
