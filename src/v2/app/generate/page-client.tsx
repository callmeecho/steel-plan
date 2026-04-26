'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Play } from 'lucide-react'

import { Topbar } from '../../components/layout/Topbar'
import { HintTip } from '../../components/ui/HintTip'
import { Btn, Switch } from '../../components/ui/primitives'
import { createV2Task } from './actions'

const RULE_OPTIONS = [
  {
    key: 'preferLargeSection',
    title: '优先大断面',
    hint:
      '当订单宽度较大时，优先采用更大的可用断面，减少板坯切换并为拼板组合预留空间。',
  },
  {
    key: 'allowNonStandard',
    title: '允许非标断面设计',
    hint:
      '允许在已选断面之外补充非标断面方案，用于扩大候选解空间，但仍受现场可生产条件约束。',
  },
  {
    key: 'allowLongSlab',
    title: '是否长坏料',
    hint:
      '允许长板坯相关方案进入本次候选集，用于覆盖特定长度区间下的排产需求。',
  },
  {
    key: 'balanceYield',
    title: '跨钢种组坯',
    hint:
      '允许满足规则的跨钢种组合进入排产计算，用于提升成材率和板坯利用率。',
  },
] as const

export function GeneratePageClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderIds = (searchParams.get('orderIds') ?? '').split(',').filter(Boolean)

  const [options, setOptions] = useState({
    preferLargeSection: true,
    allowNonStandard: true,
    allowLongSlab: true,
    balanceYield: false,
    respectDueDate: true,
  })
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function toggle(key: keyof typeof options) {
    setOptions((previous) => ({ ...previous, [key]: !previous[key] }))
  }

  function handleCreateTask() {
    if (orderIds.length === 0 || isPending) return

    setError(null)
    startTransition(async () => {
      const result = await createV2Task({ orderIds, options })
      if (!result.success) {
        setError('任务创建失败，请稍后重试。')
        return
      }

      router.push(`/v2/plans?taskId=${result.taskId}&tab=results`)
    })
  }

  return (
    <>
      <Topbar crumb="方案生成" />
      <div className="border-b border-edge bg-white px-6 pt-4 pb-3">
        <div className="text-[18px] font-semibold text-ink">方案生成</div>
      </div>
      <div className="flex-1 overflow-auto bg-[#f3f6fb] p-6">
        <div className="rounded-xl border border-edge bg-white p-6 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-xl border border-edge bg-surface-subtle/60 p-5">
              <div className="mb-4 text-[14px] font-semibold text-ink">规则参数</div>
              <div className="divide-y divide-gray-200">
                {RULE_OPTIONS.map((item) => (
                  <div key={item.key} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
                    <Switch on={options[item.key]} onClick={() => toggle(item.key)} />
                    <div className="flex items-center gap-2 text-[14px] font-medium text-ink">
                      <span>{item.title}</span>
                      <HintTip text={item.hint} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-edge bg-white p-5">
                <div className="grid gap-4">
                  <div>
                    <div className="text-[12px] text-ink-tertiary">已选订单</div>
                    <div className="mt-2 font-mono text-[28px] font-semibold text-ink">
                      {orderIds.length}
                    </div>
                  </div>
                </div>
              </div>

              {error ? <div className="text-[12px] text-rose-600">{error}</div> : null}

              <div className="flex items-center justify-end gap-3">
                <Btn size="sm">保存为规则模板</Btn>
                <Btn
                  size="sm"
                  variant="primary"
                  disabled={orderIds.length === 0 || isPending}
                  onClick={handleCreateTask}
                >
                  <Play className="h-3 w-3" />
                  {isPending ? '正在创建任务...' : '开始排产'}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
