'use client'

import { useState } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { login } from './actions'

export default function LoginPage() {
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
    <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">登录</h1>
        <p className="mt-1 text-sm text-gray-600">使用你的账号进入系统。</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full">
          登录
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        还没有账号？{' '}
        <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-700">
          去注册
        </Link>
      </p>
    </div>
  )
}
