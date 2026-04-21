'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  currentPage: number
  totalPages: number
}

// 分页组件：通过 URL query 控制当前页
// 好处：刷新/分享链接都能保持当前页面状态
export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // 跳转到指定页：保留现有 query 参数，只改 page
  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`${pathname}?${params.toString()}`)
  }

  // 计算要显示的页码按钮 (最多 5 个)
  function getVisiblePages(): number[] {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
    return Array.from({ length: 5 }, (_, i) => start + i)
  }

  const pages = getVisiblePages()

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-600">
        第 {currentPage} / {totalPages} 页
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => goToPage(1)}
        >
          首页
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => goToPage(currentPage - 1)}
        >
          上一页
        </Button>
        {pages.map((p) => (
          <Button
            key={p}
            variant={p === currentPage ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => goToPage(p)}
          >
            {p}
          </Button>
        ))}
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => goToPage(currentPage + 1)}
        >
          下一页
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => goToPage(totalPages)}
        >
          末页
        </Button>
      </div>
    </div>
  )
}