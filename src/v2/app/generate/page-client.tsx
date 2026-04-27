'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Play } from 'lucide-react'

import { Topbar } from '../../components/layout/Topbar'
import { HintTip } from '../../components/ui/HintTip'
import { Btn, Switch } from '../../components/ui/primitives'
import { createV2Task } from './actions'

const RULE_OPTIONS = [
  {
    key: 'preferLargeSection',
    title: '优先大断面',
    hint: '优先选择更大的断面组合，减少切换与组坯约束冲突。',
  },
  {
    key: 'allowNonStandard',
    title: '允许非标断面设计',
    hint: '在可生产范围内扩展可选断面，增加可行解空间。',
  },
  {
    key: 'allowLongSlab',
    title: '允许长板坯方案',
    hint: '允许长板坯方案参与优化，覆盖特定长度订单。',
  },
  {
    key: 'balanceYield',
    title: '允许跨钢种组坯',
    hint: '在规则允许时进行跨钢种组合，提高整体利用率。',
  },
] as const

type GeneratePageClientProps = {
  executionMode: string
  importedOrderIds: string[]
}

export function GeneratePageClient({ executionMode: _executionMode, importedOrderIds }: GeneratePageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderIdsFromUrl = (searchParams.get('orderIds') ?? '').split(',').filter(Boolean)
  const orderIds = useMemo(
    () => (orderIdsFromUrl.length > 0 ? orderIdsFromUrl : importedOrderIds),
    [orderIdsFromUrl, importedOrderIds],
  )

  const [options, setOptions] = useState({
    preferLargeSection: true,
    allowNonStandard: true,
    allowLongSlab: true,
    balanceYield: false,
    respectDueDate: true,
  })
  const [isRunning, setIsRunning] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('准备任务上下文...')
  const [error, setError] = useState<string | null>(null)
  const [taskNote, setTaskNote] = useState<string | null>(null)

  function toggle(key: keyof typeof options) {
    setOptions((previous) => ({ ...previous, [key]: !previous[key] }))
  }

  async function handleCreateTask() {
    if (orderIds.length === 0 || isRunning) return

    setError(null)
    setTaskNote(null)
    setIsRunning(true)
    setShowProgress(true)
    setProgress(8)
    setProgressText('准备任务上下文...')

    const stageTexts = [
      '校验断面与厚度规则...',
      '筛选可参与排产订单...',
      '生成优化输入数据...',
      '执行方案计算...',
      '写入方案结果...',
    ]
    let stageIndex = 0
    const beginTs = Date.now()
    const MIN_PROGRESS_MS = 2600

    const timer = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return 92
        const next = Math.min(prev + Math.max(1, Math.round((100 - prev) / 10)), 92)
        if (next >= 20 + stageIndex * 15 && stageIndex < stageTexts.length - 1) {
          stageIndex += 1
          setProgressText(stageTexts[stageIndex])
        }
        return next
      })
    }, 280)

    try {
      const result = await createV2Task({ orderIds, options })
      const elapsed = Date.now() - beginTs
      if (elapsed < MIN_PROGRESS_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_PROGRESS_MS - elapsed))
      }

      if (!result.success) {
        setError(result.error || '任务创建失败，请稍后重试。')
        setProgress(0)
        setShowProgress(false)
        return
      }

      if ('filteredOutCount' in result && result.filteredOutCount > 0) {
        setTaskNote(`已按断面/厚度规则过滤 ${result.filteredOutCount} 条不匹配订单。`)
      }

      setProgressText('计算完成，正在跳转结果页...')
      setProgress(100)
      await new Promise((resolve) => setTimeout(resolve, 380))
      router.push(`/plans?taskId=${result.taskId}&tab=results`)
    } finally {
      window.clearInterval(timer)
      setIsRunning(false)
      setTimeout(() => setShowProgress(false), 400)
    }
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
                <div className="text-[12px] text-ink-tertiary">已导入订单</div>
                <div className="mt-2 font-mono text-[28px] font-semibold text-ink">{orderIds.length}</div>
              </div>

              {error ? <div className="text-[12px] whitespace-pre-line text-rose-600">{error}</div> : null}
              {taskNote ? <div className="text-[12px] whitespace-pre-line text-amber-700">{taskNote}</div> : null}

              <div className="flex items-center justify-end">
                <Btn
                  size="sm"
                  variant="primary"
                  disabled={orderIds.length === 0 || isRunning}
                  onClick={() => {
                    void handleCreateTask()
                  }}
                >
                  <Play className="h-3 w-3" />
                  {isRunning ? '正在计算...' : '开始排产'}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showProgress ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-[#0f172a]/35 p-4">
          <div className="w-full max-w-[460px] rounded-xl border border-edge bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.3)]">
            <div className="mb-3 flex items-center gap-2 text-[16px] font-semibold text-ink">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              正在计算排产方案
            </div>
            <div className="mb-2 text-[12px] text-ink-secondary">{progressText}</div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-subtle">
              <div
                className="h-full rounded-full bg-accent transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 text-right font-mono text-[11px] text-ink-tertiary">{progress}%</div>
          </div>
        </div>
      ) : null}
    </>
  )
}
