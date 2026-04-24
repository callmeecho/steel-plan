'use client'

import { useTransition } from 'react'

import { Button } from '@/components/ui/button'

import {
  archiveSteelGrade,
  permanentlyDeleteSteelGrade,
  restoreSteelGrade,
} from './actions'

interface Props {
  gradeId: string
  gradeName: string
  isArchived: boolean
}

export function DeleteGradeButton({ gradeId, gradeName, isArchived }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleArchive() {
    const confirmed = confirm(
      `确认归档钢种“${gradeName}”吗？\n\n归档后它会从在用列表中移除，但不会影响已经引用该钢种的订单数据。`
    )

    if (!confirmed) {
      return
    }

    startTransition(async () => {
      const result = await archiveSteelGrade(gradeId)
      if ('error' in result) {
        alert(result.error)
      }
    })
  }

  function handleRestore() {
    startTransition(async () => {
      const result = await restoreSteelGrade(gradeId)
      if ('error' in result) {
        alert(result.error)
      }
    })
  }

  function handlePermanentDelete() {
    const confirmed = confirm(
      `确认永久删除钢种“${gradeName}”吗？\n\n这个操作不可恢复。如果该钢种仍被订单引用，系统会阻止删除。`
    )

    if (!confirmed) {
      return
    }

    startTransition(async () => {
      const result = await permanentlyDeleteSteelGrade(gradeId)
      if ('error' in result) {
        alert(result.error)
      }
    })
  }

  if (isArchived) {
    return (
      <>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleRestore}
          disabled={isPending}
        >
          恢复
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={handlePermanentDelete}
          disabled={isPending}
        >
          永久删除
        </Button>
      </>
    )
  }

  return (
    <Button
      size="sm"
      variant="danger"
      onClick={handleArchive}
      disabled={isPending}
    >
      归档
    </Button>
  )
}
