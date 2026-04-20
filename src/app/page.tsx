import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Steel Plan</h1>
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900">欢迎回来</h2>
          <p className="mt-2 text-gray-600">
            你已成功登录 Steel Plan 钢铁生产订单管理系统。
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/orders"
              className="block rounded-lg border border-gray-200 p-6 hover:border-blue-500 hover:shadow-sm transition"
            >
              <h3 className="font-semibold text-gray-900">订单查询</h3>
              <p className="mt-1 text-sm text-gray-600">查看、筛选、批量处理订单</p>
            </Link>
            <Link
              href="/steel-grades"
              className="block rounded-lg border border-gray-200 p-6 hover:border-blue-500 hover:shadow-sm transition"
            >
              <h3 className="font-semibold text-gray-900">钢种管理</h3>
              <p className="mt-1 text-sm text-gray-600">维护钢种字典</p>
            </Link>
            <Link
              href="/dashboard"
              className="block rounded-lg border border-gray-200 p-6 hover:border-blue-500 hover:shadow-sm transition"
            >
              <h3 className="font-semibold text-gray-900">数据看板</h3>
              <p className="mt-1 text-sm text-gray-600">订单统计与趋势分析</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}