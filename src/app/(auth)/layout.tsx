import type { ReactNode } from 'react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(37,99,235,0.2),transparent_42%),radial-gradient(circle_at_80%_80%,rgba(15,23,42,0.18),transparent_38%),linear-gradient(180deg,#eef3fb_0%,#f6f8fc_100%)]" />

      <header className="relative z-10 border-b border-slate-200/80 bg-white/80 px-6 py-4 backdrop-blur">
        <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">
          中板组坯决策平台
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  )
}
