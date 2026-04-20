'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signup } from './actions'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await signup(formData)

    // signup 成功会 redirect，代码不会走到这里
    // 只有出错才返回 { error }
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">创建账号</h1>
        <p className="mt-1 text-sm text-gray-600">注册后即可查看订单与生产计划</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="显示名称"
          name="displayName"
          type="text"
          placeholder="可选，默认取邮箱前缀"
        />
        <Input
          label="邮箱"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
        />
        <Input
          label="密码"
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="至少 6 位"
        />

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full">
          注册
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        已有账号？{' '}
        <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
          去登录
        </Link>
      </p>
    </div>
  )
}