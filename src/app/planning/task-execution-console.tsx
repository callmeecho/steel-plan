'use client'

import { useEffect, useState } from 'react'

import type { PlanningRun, PlanningRunStatus } from '@/lib/database.types'

type TaskPhase =
  | 'idle'
  | 'draft'
  | 'waiting'
  | 'executing'
  | 'processing'
  | 'standby'
  | 'completed'
  | 'failed'
  | 'cancelled'

type StageId = 'snapshot' | 'margin' | 'designs' | 'selection' | 'outputs'

interface TaskExecutionConsoleProps {
  selectedCount: number
  uniqueGradeCount: number
  nearestDeliveryDate: string | null
  modeLabel: string
  enabledRules: string[]
  runtimeFlags: {
    preference: boolean
    testMode: boolean
    short: boolean
    crossGroup: boolean
  }
  activeRun: PlanningRun | null
}

const STAGES: Array<{ id: StageId; title: string; short: string }> = [
  { id: 'snapshot', title: '订单快照', short: '01' },
  { id: 'margin', title: '标准与 Margin', short: '02' },
  { id: 'designs', title: '候选方案', short: '03' },
  { id: 'selection', title: '方案筛选', short: '04' },
  { id: 'outputs', title: '结果写出', short: '05' },
]

const PHASE_LABELS: Record<TaskPhase, string> = {
  idle: '未启动',
  draft: '草稿',
  waiting: '等待',
  executing: '执行中',
  processing: '处理中',
  standby: '待确认',
  completed: '已完成',
  failed: '失败',
  cancelled: '已取消',
}

export function TaskExecutionConsole({
  selectedCount,
  uniqueGradeCount,
  nearestDeliveryDate,
  modeLabel,
  enabledRules,
  runtimeFlags,
  activeRun,
}: TaskExecutionConsoleProps) {
  const [phase, setPhase] = useState<TaskPhase>('idle')
  const [activeStage, setActiveStage] = useState<StageId | null>(null)
  const [progress, setProgress] = useState(0)
  const [lastRunAt, setLastRunAt] = useState<string | null>(null)

  useEffect(() => {
    if (activeRun) {
      const derived = deriveUiState(activeRun.status, activeRun.last_transition_at)
      setPhase(derived.phase)
      setActiveStage(derived.activeStage)
      setProgress(derived.progress)
      setLastRunAt(derived.lastRunAt)
      return
    }

    setPhase('idle')
    setActiveStage(null)
    setProgress(0)
    setLastRunAt(null)
  }, [activeRun])

  const activeIndex = activeStage
    ? STAGES.findIndex((item) => item.id === activeStage)
    : -1

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.35)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
            任务运行态
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">任务执行</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className={statusBadgeClass(phase)}>{PHASE_LABELS[phase]}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {activeRun ? activeRun.id.slice(0, 8) : '未绑定 run'}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-4">
          <div className="rounded-[24px] bg-slate-950 p-5 text-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">进度</div>
                <div className="mt-3 flex items-end gap-3">
                  <span className="text-5xl font-semibold leading-none">{progress}</span>
                  <span className="pb-1 text-sm text-slate-400">%</span>
                </div>
              </div>
              <div className="grid gap-2 text-right text-sm text-slate-300">
                <div>{modeLabel}</div>
                <div>{lastRunAt || '-'}</div>
              </div>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="grid gap-3">
            {STAGES.map((stage, index) => {
              const isActive = activeStage === stage.id
              const isDone = activeIndex > index || progress === 100

              return (
                <div
                  key={stage.id}
                  className={`grid grid-cols-[64px_1fr_auto] items-center gap-4 rounded-[20px] border px-4 py-4 transition ${
                    isActive
                      ? 'border-blue-300 bg-blue-50'
                      : isDone
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isDone
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-slate-500'
                    }`}
                  >
                    {stage.short}
                  </div>
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-slate-900">{stage.title}</div>
                  </div>
                  <div
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : isDone
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-white text-slate-500'
                    }`}
                  >
                    {isActive ? '当前' : isDone ? '完成' : '待执行'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-4">
          <SidePanel
            title="任务上下文"
            rows={[
              ['订单数', `${selectedCount}`],
              ['钢种数', `${uniqueGradeCount}`],
              ['最近交付', nearestDeliveryDate || '-'],
              ['规则', enabledRules.length > 0 ? enabledRules.join(' / ') : '-'],
            ]}
          />

          <SidePanel
            title="执行开关"
            rows={[
              ['基础流', 'regular + stitch'],
              ['preference', runtimeFlags.preference ? '开启' : '关闭'],
              ['test_mode', runtimeFlags.testMode ? '开启' : '关闭'],
              ['short_slab', runtimeFlags.short ? '开启' : '关闭'],
              ['cross_group', runtimeFlags.crossGroup ? '开启' : '关闭'],
            ]}
          />
        </div>
      </div>
    </section>
  )
}

function SidePanel({
  title,
  rows,
}: {
  title: string
  rows: Array<[string, string]>
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-3 space-y-2">
        {rows.map(([label, value]) => (
          <div
            key={`${title}-${label}`}
            className="flex items-center justify-between gap-4 rounded-xl bg-white px-3 py-2 text-sm"
          >
            <span className="text-slate-500">{label}</span>
            <span className="font-medium text-slate-800">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function statusBadgeClass(phase: TaskPhase) {
  const toneMap: Record<TaskPhase, string> = {
    idle: 'bg-slate-100 text-slate-700',
    draft: 'bg-slate-100 text-slate-700',
    waiting: 'bg-amber-100 text-amber-700',
    executing: 'bg-blue-100 text-blue-700',
    processing: 'bg-cyan-100 text-cyan-700',
    standby: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-rose-100 text-rose-700',
    cancelled: 'bg-slate-100 text-slate-700',
  }

  return `rounded-full px-3 py-1 text-xs font-medium ${toneMap[phase]}`
}

function deriveUiState(status: PlanningRunStatus, lastTransitionAt: string | null) {
  const lastRunAt = lastTransitionAt
    ? new Date(lastTransitionAt).toLocaleString('zh-CN')
    : null

  switch (status) {
    case 'draft':
      return {
        phase: 'draft' as TaskPhase,
        activeStage: 'snapshot' as StageId,
        progress: 5,
        lastRunAt,
      }
    case 'waiting':
      return {
        phase: 'waiting' as TaskPhase,
        activeStage: 'snapshot' as StageId,
        progress: 15,
        lastRunAt,
      }
    case 'executing':
      return {
        phase: 'executing' as TaskPhase,
        activeStage: 'margin' as StageId,
        progress: 38,
        lastRunAt,
      }
    case 'processing':
      return {
        phase: 'processing' as TaskPhase,
        activeStage: 'designs' as StageId,
        progress: 72,
        lastRunAt,
      }
    case 'standby':
      return {
        phase: 'standby' as TaskPhase,
        activeStage: 'outputs' as StageId,
        progress: 100,
        lastRunAt,
      }
    case 'completed':
      return {
        phase: 'completed' as TaskPhase,
        activeStage: 'outputs' as StageId,
        progress: 100,
        lastRunAt,
      }
    case 'failed':
      return {
        phase: 'failed' as TaskPhase,
        activeStage: 'selection' as StageId,
        progress: 82,
        lastRunAt,
      }
    case 'cancelled':
      return {
        phase: 'cancelled' as TaskPhase,
        activeStage: null,
        progress: 0,
        lastRunAt,
      }
  }
}
