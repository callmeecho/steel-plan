'use server'

import { createTaskSnapshot } from '../../lib/task-snapshot-store'
import { buildDemoPlanSnapshot } from '../../lib/demo-plan-builder'
import { loadPlanSnapshotFromFiles } from '../../lib/result-loader'
import { runLegacyOptimizer } from '../../lib/algorithm-runner'
import { savePlanFailure, savePlanSnapshot } from '../../lib/result-store'
import {
  loadV2Orders,
  loadV2SectionRows,
  loadV2ThicknessRules,
} from '../../lib/server-data'

type GenerateTaskInput = {
  orderIds: string[]
  options: {
    preferLargeSection: boolean
    allowNonStandard: boolean
    allowLongSlab: boolean
    balanceYield: boolean
    respectDueDate: boolean
  }
}

export async function createV2Task(input: GenerateTaskInput) {
  const orders = await loadV2Orders()
  const selectedOrders = orders.filter((order) => input.orderIds.includes(order.id))
  const [sectionRows, thicknessRules] = await Promise.all([
    loadV2SectionRows(),
    loadV2ThicknessRules(),
  ])

  const enabledSections = sectionRows.filter((item) => item.enabled)
  const normalizedThicknessRules = thicknessRules.filter(
    (item) =>
      item.plateMin !== null &&
      item.plateMax !== null &&
      item.slabMin !== null &&
      item.slabMax !== null,
  )

  if (enabledSections.length === 0) {
    return {
      success: false as const,
      error: '断面类型未启用。请先在“参数设置 / 断面类型”启用至少一条规则。',
    }
  }

  if (normalizedThicknessRules.length === 0) {
    return {
      success: false as const,
      error: '厚度筛选标准为空。请先在“参数设置 / 厚度筛选标准”配置有效规则。',
    }
  }

  const eligibleOrders = selectedOrders.filter((order) =>
    normalizedThicknessRules.some(
      (rule) =>
        order.thickness >= (rule.plateMin as number) && order.thickness <= (rule.plateMax as number),
    ),
  )

  if (eligibleOrders.length === 0) {
    return {
      success: false as const,
      error: '当前选中订单与厚度筛选标准不匹配。请调整参数或重新选择订单。',
    }
  }

  const totalWeightTons = eligibleOrders.reduce((sum, item) => sum + Number(item.weight || 0), 0)
  const uniqueGradeCount = new Set(eligibleOrders.map((item) => item.grade).filter(Boolean)).size

  const snapshot = await createTaskSnapshot({
    selectedOrderIds: eligibleOrders.map((item) => item.id),
    selectedOrderCount: eligibleOrders.length,
    totalWeightTons: Number(totalWeightTons.toFixed(3)),
    uniqueGradeCount,
    options: input.options,
  })

  const executionMode = (process.env.STEEL_PLAN_EXECUTION_MODE || 'demo').toLowerCase()
  if (executionMode !== 'legacy') {
    const demoSnapshot = buildDemoPlanSnapshot({
      taskId: snapshot.id,
      options: input.options,
      orders: eligibleOrders,
      requestedOrders: selectedOrders,
      sectionRows,
      thicknessRules: normalizedThicknessRules,
    })

    try {
      await savePlanSnapshot(snapshot.id, demoSnapshot)
    } catch (error) {
      return {
        success: false as const,
        error:
          `演示结果已生成，但写入 Supabase 失败。请先执行建表 SQL。\n` +
          `${error instanceof Error ? error.message : String(error)}`,
      }
    }

    return {
      success: true as const,
      taskId: snapshot.id,
      filteredOutCount: selectedOrders.length - eligibleOrders.length,
    }
  }

  const runResult = await runLegacyOptimizer(snapshot.id)
  if (!runResult.ok) {
    const message = [
      `算法执行失败（code=${runResult.code ?? 'null'}）`,
      runResult.stderr?.trim() || 'no stderr',
    ].join('\n')
    try {
      await savePlanFailure(snapshot.id, message)
    } catch {
      // ignore persistence errors and return execution message
    }
    return {
      success: false as const,
      error: `算法执行失败，请检查 Python 环境或算法目录。\n${message}`,
    }
  }

  const fileSnapshot = await loadPlanSnapshotFromFiles()
  if (!fileSnapshot) {
    try {
      await savePlanFailure(snapshot.id, '算法执行完成，但未找到可解析的结果文件')
    } catch {
      // ignore persistence errors and return parsing message
    }
    return {
      success: false as const,
      error: '算法执行完成，但未检测到 design_result.xlsx / remain_orders.xlsx 可用结果。',
    }
  }

  const normalizedSnapshot = {
    ...fileSnapshot,
    plan: {
      ...fileSnapshot.plan,
      taskId: snapshot.id,
      params: input.options,
    },
  }

  try {
    await savePlanSnapshot(snapshot.id, normalizedSnapshot)
  } catch (error) {
    return {
      success: false as const,
      error:
        `结果已生成，但写入 Supabase 失败。请先执行建表 SQL。\n` +
        `${error instanceof Error ? error.message : String(error)}`,
    }
  }

  return {
    success: true as const,
    taskId: snapshot.id,
    filteredOutCount: selectedOrders.length - eligibleOrders.length,
  }
}
