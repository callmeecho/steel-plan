'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  archiveSteelGrade,
  restoreSteelGrade,
  permanentlyDeleteSteelGrade,
} from './actions'

interface Props {
  gradeId: string
  gradeName: string
  isArchived: boolean
}

// 根据当前视图显示不同操作:
// - 活跃视图: 归档按钮 (软删)
// - 归档视图: 恢复 + 永久删除 (硬删, 仅无引用时可用)
export function DeleteGradeButton({ gradeId, gradeName, isArchived }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleArchive() {
    if (
      !confirm(
        `确定归档钢种 "${gradeName}" 吗?\n\n归档后此钢种不会出现在下拉列表中, 但历史订单仍然保留引用。`
      )
    ) {
      return
    }
    startTransition(async () => {
      const result = await archiveSteelGrade(gradeId)
      if (result?.error) alert(result.error)
    })
  }

  function handleRestore() {
    startTransition(async () => {
      const result = await restoreSteelGrade(gradeId)
      if (result?.error) alert(result.error)
    })
  }

  function handlePermanentDelete() {
    if (
      !confirm(
        `⚠️ 永久删除钢种 "${gradeName}"?\n\n此操作不可恢复。如果该钢种被任何订单引用, 删除将失败。`
      )
    ) {
      return
    }
    startTransition(async () => {
      const result = await permanentlyDeleteSteelGrade(gradeId)
      if (result?.error) alert(result.error)
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