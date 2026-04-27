'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type PlansActionsProps = {
  taskId: string
  tab: string
}

export function PlansActions({ taskId, tab }: PlansActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    setIsRefreshing(false)
  }, [pathname, searchParams])

  function handleRefresh() {
    if (isRefreshing) return
    setIsRefreshing(true)
    router.replace(`/plans?taskId=${taskId}&tab=${tab}`)
  }

  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="inline-flex items-center gap-1 rounded border border-edge-strong bg-white px-2.5 py-1 text-[11.5px] font-medium text-ink transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isRefreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        {isRefreshing ? '加载中...' : '刷新结果'}
      </button>
      <a
        href={`/api/result-download?taskId=${encodeURIComponent(taskId)}`}
        className="inline-flex items-center rounded border border-edge-strong bg-white px-2.5 py-1 text-[11.5px] font-medium text-ink transition hover:bg-surface-hover"
      >
        下载结果
      </a>
    </div>
  )
}
