'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { Button } from '@/components/ui/button'
import type { PlanningMode } from '@/lib/database.types'

import { createPlanningRun } from './actions'

interface CreateRunButtonProps {
  mode: PlanningMode
  preferenceEnabled: boolean
  testModeEnabled: boolean
  shortEnabled: boolean
  crossGroupEnabled: boolean
  disabled?: boolean
}

export function CreateRunButton({
  mode,
  preferenceEnabled,
  testModeEnabled,
  shortEnabled,
  crossGroupEnabled,
  disabled = false,
}: CreateRunButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await createPlanningRun({
        mode,
        preferenceEnabled,
        testModeEnabled,
        shortEnabled,
        crossGroupEnabled,
      })

      if (!result.success) {
        alert(result.error)
        return
      }

      router.refresh()
    })
  }

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={handleClick}
      loading={isPending}
      disabled={disabled || isPending}
    >
      保存任务记录
    </Button>
  )
}
