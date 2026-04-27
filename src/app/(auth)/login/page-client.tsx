'use client'

import { useState } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { login } from './actions'

export default function LoginPageClient({ next }: { next: string }) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await login(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-10 shadow-[0_24px_72px_-30px_rgba(15,23,42,0.42)] backdrop-blur sm:p-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">登录</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <input type="hidden" name="next" value={next} />
        <Input
          label="邮箱"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          autoComplete="email"
        />
        <Input
          label="密码"
          name="password"
          type="password"
          required
          placeholder="请输入密码"
          autoComplete="current-password"
        />

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <Button type="submit" loading={loading} className="w-full">
          登录
        </Button>
      </form>

      <p className="mt-8 text-center text-base text-slate-600">
        还没有账号？
        <Link
          href={next === '/' ? '/signup' : `/signup?next=${encodeURIComponent(next)}`}
          className="ml-1 font-medium text-blue-600 hover:text-blue-700"
        >
          去注册
        </Link>
      </p>
    </div>
  )
}
