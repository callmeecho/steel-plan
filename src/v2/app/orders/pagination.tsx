'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'

interface PaginationProps {
  currentPage: number
  totalPages: number
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`${pathname}?${params.toString()}`)
  }

  function getVisiblePages(): number[] {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1)
    }

    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
    return Array.from({ length: 5 }, (_, index) => start + index)
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
        {pages.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => goToPage(page)}
          >
            {page}
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
