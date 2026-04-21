import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { logout } from '../actions'
import { SteelGradesTable } from './steel-grades-table'

// 禁用缓存, 保证 CRUD 后立刻反映最新数据
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

  // 查所有钢种 + 关联订单数 (用聚合查询)
  // 注意: RLS 策略允许所有已登录用户读取
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
        <p className="text-red-600">加载钢种失败: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Steel Plan
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/orders" className="text-gray-600 hover:text-gray-900">
                订单查询
              </Link>
              <Link href="/steel-grades" className="text-blue-600 font-medium">
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
                登出
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
<div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-2xl font-bold text-gray-900">钢种管理</h1>
    <p className="mt-1 text-sm text-gray-600">
      共 {steelGrades?.length || 0} 个
      {view === 'archived' ? '已归档钢种' : '活跃钢种'}
      {!isAdmin && (
        <span className="ml-2 text-amber-600">· 只读模式</span>
      )}
    </p>
  </div>
  <div className="flex gap-2">
    <Link
      href="/steel-grades"
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
        view === 'active'
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      活跃
    </Link>
    <Link
      href="/steel-grades?view=archived"
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
        view === 'archived'
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      已归档
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