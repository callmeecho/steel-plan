import { Sparkles } from 'lucide-react'

import { Topbar } from '../../../../components/layout/Topbar'
import { Btn } from '../../../../components/ui/primitives'
import { TaskActionButtons } from '../../../../components/tasks/TaskActionButtons'
import { buildMockPlan } from '../../../../lib/mock-plan'
import { loadCurrentPlanSnapshot } from '../../../../lib/result-loader'
import { getTaskSnapshot } from '../../../../lib/task-snapshot-store'

function formatNumber(value: number, digits = 2) {
  return value.toFixed(digits)
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ taskId: string }>
}) {
  const { taskId } = await params
  const snapshot = await loadCurrentPlanSnapshot()
  const taskSnapshot = taskId === 'current' ? null : await getTaskSnapshot(taskId)
  const plan = snapshot?.plan ?? buildMockPlan()

  return (
    <>
      <Topbar crumb="方案对比" />
      <div className="flex items-center justify-between border-b border-edge bg-white px-[18px] pt-3 pb-2.5">
        <div>
          <div className="text-[16px] font-semibold">方案对比</div>
        </div>
        <TaskActionButtons
          taskId={taskSnapshot?.id ?? taskId}
          sourceDir={snapshot?.sourceDir ?? null}
        />
      </div>

      <div className="grid flex-1 grid-cols-[1.3fr_1fr] gap-4 overflow-auto p-[18px]">
        <div className="relative rounded-lg border border-accent bg-white p-5 ring-4 ring-accent-soft">
          <div className="absolute -top-2.5 left-3.5 inline-flex items-center gap-1 rounded bg-accent px-2 py-0.5 text-[10.5px] font-semibold tracking-wide text-white">
            <Sparkles className="h-2.5 w-2.5" /> 当前推荐
          </div>

          <div className="mb-3 border-b border-edge pb-3">
            <div className="font-mono text-[11px] tracking-wide text-ink-tertiary">{plan.id}</div>
            <div className="mt-0.5 text-[15px] font-semibold">{plan.name}</div>
            <div className="mt-1 text-[11.5px] text-ink-secondary">{plan.strategy}</div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3 text-[11.5px]">
            {[
              ['平均成材率', `${formatNumber(plan.kpi.avgYield * 100)}%`],
              ['板坯数量', `${plan.kpi.slabCount} 块`],
              ['钢板总重量', `${formatNumber(plan.kpi.steelWeight)} t`],
              ['板坯总重量', `${formatNumber(plan.kpi.slabWeight)} t`],
              ['已排订单', `${plan.kpi.scheduledOrders} 条`],
              ['未排订单', `${plan.kpi.unscheduledOrders} 条`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md bg-surface-subtle px-3 py-2">
                <div className="text-[10.5px] text-ink-tertiary">{label}</div>
                <div className="mt-1 font-mono text-[16px] font-semibold">{value}</div>
              </div>
            ))}
          </div>

          <div className="mb-4 rounded-md bg-surface-subtle px-3 py-2.5">
            <div className="mb-1.5 text-[10.5px] tracking-wide text-ink-tertiary">当前方案信息</div>
            <div className="space-y-1 text-[11.5px] text-ink-secondary">
              <div>任务号：{taskSnapshot?.id ?? taskId}</div>
              {taskSnapshot ? (
                <div>
                  已选订单：{taskSnapshot.selectedOrderCount} 条 / {taskSnapshot.uniqueGradeCount}{' '}
                  个钢种 / {formatNumber(taskSnapshot.totalWeightTons, 3)} t
                </div>
              ) : null}
              <div>结果目录：{snapshot?.sourceDir ?? '当前未检测到结果目录'}</div>
              <div>结果用途：排产规划确认后，人工回传 MES</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Btn size="sm" className="flex-1 justify-center">
              查看详情
            </Btn>
            <Btn size="sm" variant="primary" className="flex-1 justify-center">
              进入计划页
            </Btn>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-edge bg-white p-5">
            <div className="text-[14px] font-semibold">当前状态</div>
            <div className="mt-2 space-y-2 text-[11.5px] text-ink-secondary">
              <div>1. 当前已经可以承接真实结果快照。</div>
              <div>2. 方案对比页主要用于查看本次排产结果和关键指标。</div>
              <div>3. 后续如果接入多轮结果，这里再扩展成多方案横向对比。</div>
            </div>
          </div>

          <div className="rounded-lg border border-edge bg-white p-5">
            <div className="text-[14px] font-semibold">当前已接通的数据</div>
            <div className="mt-2 space-y-2 text-[11.5px] text-ink-secondary">
              <div>订单来源：订单主表</div>
              <div>规则来源：断面、厚度、板坯长度标准</div>
              <div>结果来源：排产结果与未排订单结果</div>
              <div>项目边界：只负责排产规划，不负责调度</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
