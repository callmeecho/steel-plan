import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

import { logout } from './actions'

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, role')
    .eq('id', user.id)
    .single()

  const displayName =
    profile?.display_name ||
    user.user_metadata?.display_name ||
    user.email?.split('@')[0] ||
    '用户'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-gray-900">中板组坯决策平台</h1>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/orders" className="text-gray-600 hover:text-gray-900">
                订单管理
              </Link>
              <Link href="/parameters" className="text-gray-600 hover:text-gray-900">
                参数设置
              </Link>
              <Link href="/planning" className="text-gray-600 hover:text-gray-900">
                任务准备
              </Link>
              <Link href="/steel-grades" className="text-gray-600 hover:text-gray-900">
                钢种管理
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                数据看板
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {profile?.display_name || user.email}
              <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                {profile?.role || 'viewer'}
              </span>
            </span>
            <form action={logout}>
              <Button variant="ghost" size="sm" type="submit">
                退出登录
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">欢迎回来，{displayName}</h2>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-5">
            <ModuleCard href="/orders" title="订单管理" icon={<OrdersIcon />} />
            <ModuleCard href="/parameters" title="参数设置" icon={<ParamsIcon />} />
            <ModuleCard href="/planning" title="任务准备" icon={<PlanningIcon />} />
            <ModuleCard href="/steel-grades" title="钢种管理" icon={<GradesIcon />} />
            <ModuleCard href="/dashboard" title="数据看板" icon={<DashboardIcon />} />
          </div>
        </div>
      </main>
    </div>
  )
}

function ModuleCard({
  href,
  title,
  icon,
}: {
  href: string
  title: string
  icon: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-gray-200 p-8 transition hover:border-blue-500 hover:shadow-sm"
    >
      <div className="mb-6 flex justify-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          {icon}
        </div>
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
    </Link>
  )
}

function OrdersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path
        d="M7 4.75h10A2.25 2.25 0 0 1 19.25 7v10A2.25 2.25 0 0 1 17 19.25H7A2.25 2.25 0 0 1 4.75 17V7A2.25 2.25 0 0 1 7 4.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8 9.25h8M8 12h8M8 14.75h5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function PlanningIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
      <path
        d="M6.75 6.75h10.5M6.75 12h6.5M6.75 17.25h4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M17.25 11.5 19 13.25l-3.5 3.5H13.75V15l3.5-3.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect
        x="4.75"
        y="4.75"
        width="14.5"
        height="14.5"
        rx="2.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  )
}

function ParamsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
      <path
        d="M12 3.75a2 2 0 0 1 2 2v.55a5.7 5.7 0 0 1 1.76.73l.38-.38a2 2 0 0 1 2.83 0l.53.53a2 2 0 0 1 0 2.83l-.38.38c.33.54.58 1.13.73 1.76h.55a2 2 0 0 1 2 2v.75a2 2 0 0 1-2 2h-.55a5.7 5.7 0 0 1-.73 1.76l.38.38a2 2 0 0 1 0 2.83l-.53.53a2 2 0 0 1-2.83 0l-.38-.38a5.7 5.7 0 0 1-1.76.73v.55a2 2 0 0 1-2 2h-.75a2 2 0 0 1-2-2v-.55a5.7 5.7 0 0 1-1.76-.73l-.38.38a2 2 0 0 1-2.83 0l-.53-.53a2 2 0 0 1 0-2.83l.38-.38a5.7 5.7 0 0 1-.73-1.76h-.55a2 2 0 0 1-2-2v-.75a2 2 0 0 1 2-2h.55c.15-.63.4-1.22.73-1.76l-.38-.38a2 2 0 0 1 0-2.83l.53-.53a2 2 0 0 1 2.83 0l.38.38A5.7 5.7 0 0 1 10 6.3v-.55a2 2 0 0 1 2-2h.001Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function GradesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
      <path
        d="M12 4.75 18.5 8.5V15.5L12 19.25 5.5 15.5V8.5L12 4.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M12 10V19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M5.5 8.5 12 12l6.5-3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
      <path
        d="M6.75 18.25h10.5A1.75 1.75 0 0 0 19 16.5v-9A1.75 1.75 0 0 0 17.25 5.75H6.75A1.75 1.75 0 0 0 5 7.5v9c0 .967.783 1.75 1.75 1.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8.5 15.5V13M12 15.5V10M15.5 15.5V8.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

