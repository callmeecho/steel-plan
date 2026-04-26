import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

import { logout } from './actions'

const modules = [
  { href: '/orders', title: '订单查询' },
  { href: '/parameters', title: '参数设置' },
  { href: '/planning', title: '方案生成' },
  { href: '/dashboard', title: '计划方案' },
  { href: '/steel-grades', title: '钢种管理' },
]

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
    <div className="v2-shell min-h-screen">
      <div className="v2-grid min-h-screen lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-r border-white/10 bg-slate-950/90 px-6 py-7">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-lg font-bold text-blue-300">
                组
              </div>
              <div>
                <div className="text-xl font-semibold text-white">中板组坯决策优化</div>
                <div className="mt-1 text-xs uppercase tracking-[0.28em] text-slate-400">
                  Medium Plate Assembly
                </div>
              </div>
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            {modules.map((module, index) => (
              <NavItem
                key={module.href}
                href={module.href}
                label={module.title}
                active={index === 0}
              />
            ))}
          </nav>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">角色</div>
            <div className="mt-1 text-sm font-medium text-slate-200">
              {profile?.role || 'viewer'}
            </div>
          </div>
        </aside>

        <main className="px-6 py-6 lg:px-8">
          <header className="rounded-[28px] border border-white/10 bg-[var(--panel)] px-6 py-5 shadow-2xl shadow-black/20">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-sm text-slate-400">首页</div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  欢迎回来，{displayName}
                </h1>
              </div>

              <form action={logout}>
                <Button
                  type="submit"
                  className="border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                >
                  退出登录
                </Button>
              </form>
            </div>
          </header>

          <section className="mt-6 rounded-[28px] border border-white/10 bg-[var(--panel)] p-6 shadow-2xl shadow-black/15">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {modules.map((module) => (
                <Link
                  key={module.href}
                  href={module.href}
                  className="rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-6 text-lg font-semibold text-white transition hover:border-blue-400/40 hover:bg-white/[0.07]"
                >
                  {module.title}
                </Link>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

function NavItem({
  href,
  label,
  active = false,
}: {
  href: string
  label: string
  active?: boolean
}) {
  return (
    <Link
      href={href}
      className={[
        'flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition',
        active
          ? 'bg-white/10 text-white'
          : 'text-slate-300 hover:bg-white/6 hover:text-white',
      ].join(' ')}
    >
      {label}
    </Link>
  )
}
