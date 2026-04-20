import type { ReactNode } from 'react'
import Link from 'next/link'

// (auth) 路由组的共享布局
// 所有登录/注册/忘记密码页面都套这个壳子
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="px-6 py-4 border-b border-gray-200 bg-white">
        <Link href="/" className="text-xl font-bold text-gray-900">
          Steel Plan
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  )
}