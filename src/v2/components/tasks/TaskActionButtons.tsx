'use client'

import { Download, RefreshCw } from 'lucide-react'

import { Btn } from '../ui/primitives'

type TaskActionButtonsProps = {
  taskId: string
  sourceDir: string | null
}

export function TaskActionButtons({ taskId: _taskId, sourceDir: _sourceDir }: TaskActionButtonsProps) {
  function handleRefresh() {
    window.location.reload()
  }

  return (
    <div className="flex items-center gap-2">
      <Btn size="sm" onClick={handleRefresh}>
        <RefreshCw className="h-3 w-3" /> 刷新结果
      </Btn>
      <a
        href="/api/result-download"
        className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-edge-strong bg-white px-3 text-[11.5px] font-medium text-ink transition hover:bg-surface-hover"
      >
        <Download className="h-3 w-3" /> 下载结果
      </a>
    </div>
  )
}
