'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { ChevronDown, FileText, LayoutGrid, Play, Settings } from 'lucide-react'

type NavItem = {
  id: string
  label: string
  href: string
  icon: React.ReactNode
  children?: Array<{ label: string; href: string }>
}

type SidebarProps = {
  userName: string
  userInitials: string
  latestTaskId: string | null
}

function getBasePath(href: string) {
  return href.split('?')[0]
}

function isHrefActive(pathname: string, currentQuery: string, href: string) {
  const [base, query = ''] = href.split('?')
  if (pathname !== base) return false
  if (!query) return true
  return currentQuery === query
}

function BrandMark() {
  return (
    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-blue-500 to-blue-700 shadow-[0_12px_28px_-18px_rgba(37,99,235,0.85)]">
      <div className="relative h-7 w-7">
        <div className="absolute inset-x-0 top-0 h-1.5 rounded-full bg-white/95" />
        <div className="absolute inset-y-0 left-0 w-1.5 rounded-full bg-white/95" />
        <div className="absolute right-0 top-0 h-full w-1.5 rounded-full bg-white/70" />
        <div className="absolute bottom-0 left-0 h-1.5 w-full rounded-full bg-white/70" />
      </div>
    </div>
  )
}

export function Sidebar({ userName, userInitials, latestTaskId }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    params: true,
    plans: true,
  })

  const currentTaskId = latestTaskId ?? 'current'
  const currentQuery = searchParams.toString()

  const navItems: NavItem[] = useMemo(
    () => [
      {
        id: 'orders',
        label: '订单查询',
        href: '/orders',
        icon: <FileText className="h-4 w-4" />,
      },
      {
        id: 'params',
        label: '参数设置',
        href: '/params/section',
        icon: <Settings className="h-4 w-4" />,
        children: [
          { label: '断面类型', href: '/params/section' },
          { label: '厚度筛选标准', href: '/params/thickness' },
          { label: '板坯长度标准', href: '/params/length' },
        ],
      },
      {
        id: 'generate',
        label: '方案生成',
        href: '/generate',
        icon: <Play className="h-4 w-4" />,
      },
      {
        id: 'plans',
        label: '计划方案',
        href: `/plans?taskId=${currentTaskId}&tab=graph`,
        icon: <LayoutGrid className="h-4 w-4" />,
        children: [
          { label: '优化结果', href: `/plans?taskId=${currentTaskId}&tab=results` },
          { label: '图形展示', href: `/plans?taskId=${currentTaskId}&tab=graph` },
          { label: '板坯统计', href: `/plans?taskId=${currentTaskId}&tab=stats` },
          { label: '未排订单', href: `/plans?taskId=${currentTaskId}&tab=unscheduled` },
        ],
      },
    ],
    [currentTaskId],
  )

  return (
    <aside className="flex w-[272px] min-w-[272px] flex-col overflow-hidden bg-sidebar text-white">
      <div className="border-b border-white/10 px-6 py-5">
        <div className="flex items-center gap-4">
          <BrandMark />
          <div className="min-w-0">
            <div className="truncate text-[15px] font-semibold leading-tight text-white">
              中板组坯决策优化
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
              Medium Plate Assembly
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const hasChildren = Boolean(item.children?.length)
          const active =
            pathname.startsWith(getBasePath(item.href)) ||
            item.children?.some((child) => pathname.startsWith(getBasePath(child.href)))

          const expanded = hasChildren ? (openGroups[item.id] ?? active ?? false) : false
          const itemActive = !hasChildren && isHrefActive(pathname, currentQuery, item.href)

          return (
            <div key={item.id} className="mb-1.5">
              <Link
                href={item.href}
                onClick={(event) => {
                  if (!hasChildren) return
                  event.preventDefault()
                  setOpenGroups((previous) => ({
                    ...previous,
                    [item.id]: !expanded,
                  }))
                }}
                className={[
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-[14px] transition',
                  itemActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/80 hover:bg-white/5 hover:text-white',
                ].join(' ')}
              >
                <span className="opacity-80">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {hasChildren ? (
                  <ChevronDown className={`h-4 w-4 transition ${expanded ? '' : '-rotate-90'}`} />
                ) : null}
              </Link>

              {hasChildren && expanded ? (
                <div className="mt-1 space-y-1">
                  {item.children?.map((child) => {
                    const childActive = isHrefActive(pathname, currentQuery, child.href)
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={[
                          'block rounded-xl py-2 pl-12 pr-4 text-[13px] transition',
                          childActive
                            ? 'bg-accent/30 text-white'
                            : 'text-white/60 hover:bg-white/5 hover:text-white/90',
                        ].join(' ')}
                      >
                        {child.label}
                      </Link>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-[10.5px] text-white/65">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            PROD
          </div>
          <span className="font-mono text-[11px] text-white/45">v2.4.1</span>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] text-white/75" title={userName}>
              {userName}
            </div>
          </div>
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-[11px] font-semibold text-white">
            {userInitials}
          </div>
        </div>
      </div>
    </aside>
  )
}
