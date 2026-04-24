'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'

const MODE_OPTIONS = [
  { value: 'balanced', title: '均衡模式' },
  { value: 'delivery-first', title: '交期优先' },
  { value: 'grade-batch', title: '钢种聚合' },
]

const EXECUTION_OPTIONS = [
  { key: 'preference', label: '偏好评分' },
  { key: 'test_mode', label: '测试模式' },
  { key: 'short', label: '短板坯分支' },
  { key: 'cross_group', label: '跨组组合' },
]

export function PlanningConfigurator() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentMode = searchParams.get('mode') || 'balanced'

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())

    if (!value) {
      params.delete(key)
    } else {
      params.set(key, value)
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.push(nextUrl)
  }

  function toggleOption(key: string) {
    const enabled = searchParams.get(key) === '1'
    updateParam(key, enabled ? null : '1')
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_-28px_rgba(15,23,42,0.28)]">
        <h2 className="text-lg font-semibold text-slate-900">任务模式</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {MODE_OPTIONS.map((option) => {
            const active = currentMode === option.value

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => updateParam('mode', option.value)}
                className={`rounded-xl border p-4 text-left transition ${
                  active
                    ? 'border-blue-600 bg-blue-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-900">{option.title}</span>
                  {active && (
                    <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                      当前
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_-28px_rgba(15,23,42,0.28)]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">执行开关</h2>
          <Button type="button" variant="ghost" onClick={() => router.push(pathname)}>
            清空
          </Button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {EXECUTION_OPTIONS.map((option) => {
            const active = searchParams.get(option.key) === '1'

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => toggleOption(option.key)}
                className={`rounded-xl border p-4 text-left transition ${
                  active
                    ? 'border-emerald-600 bg-emerald-50'
                    : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-900">{option.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {active ? '开启' : '关闭'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
