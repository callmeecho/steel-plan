'use client'

import { Download, RefreshCw } from 'lucide-react'

import { Btn } from '../ui/primitives'

type TaskActionButtonsProps = {
  taskId: string
  sourceDir: string | null
}

export function TaskActionButtons({
  taskId: _taskId,
  sourceDir: _sourceDir,
}: TaskActionButtonsProps) {
  function handleRefresh() {
    window.location.reload()
  }

  function handleDownload() {
    window.location.href = '/api/result-download'
  }

  return (
    <div className="flex items-center gap-2">
      <Btn size="sm" onClick={handleRefresh}>
        <RefreshCw className="h-3 w-3" /> 刷新结果
      </Btn>
      <Btn size="sm" onClick={handleDownload}>
        <Download className="h-3 w-3" /> 下载结果
      </Btn>
    </div>
  )
}
