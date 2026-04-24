import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

import { logout } from '../actions'
import { ParametersWorkbench } from './parameters-workbench'

export const dynamic = 'force-dynamic'

export default async function ParametersPage() {
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
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-slate-950">
              中板组坯决策平台
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/orders" className="text-slate-600 hover:text-slate-950">
                订单管理
              </Link>
              <Link href="/parameters" className="font-medium text-blue-600">
                参数设置
              </Link>
              <Link href="/planning" className="text-slate-600 hover:text-slate-950">
                任务准备
              </Link>
              <Link href="/steel-grades" className="text-slate-600 hover:text-slate-950">
                钢种管理
              </Link>
              <Link href="/dashboard" className="text-slate-600 hover:text-slate-950">
                数据看板
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
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

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
              Parameter Center
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">参数设置</h1>
          </div>
        </div>

        <ParametersWorkbench />
      </main>
    </div>
  )
}

