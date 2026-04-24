import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

import { logout } from '../actions'
import { SteelGradesTable } from './steel-grades-table'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ view?: string }>

export default async function SteelGradesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const view = params.view === 'archived' ? 'archived' : 'active'
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

  const isAdmin = profile?.role === 'admin'

  let query = supabase.from('steel_grades').select('*')
  if (view === 'archived') {
    query = query.not('archived_at', 'is', null)
  } else {
    query = query.is('archived_at', null)
  }

  const { data: steelGrades, error } = await query.order('standard_steel', {
    ascending: true,
  })

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">读取钢种数据失败：{error.message}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-gray-900">
              中板组坯决策平台
            </Link>
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
              <Link href="/steel-grades" className="font-medium text-blue-600">
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">钢种管理</h1>
            <p className="mt-1 text-sm text-gray-600">
              当前显示 {steelGrades?.length || 0} 条
              {view === 'archived' ? '归档' : '在用'}钢种记录。
              {!isAdmin && (
                <span className="ml-2 text-amber-600">
                  当前账号不是管理员，仅可查看。
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/steel-grades"
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                view === 'active'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              在用列表
            </Link>
            <Link
              href="/steel-grades?view=archived"
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                view === 'archived'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              归档列表
            </Link>
          </div>
        </div>

        <SteelGradesTable
          steelGrades={steelGrades || []}
          isAdmin={isAdmin}
          view={view}
        />
      </main>
    </div>
  )
}

