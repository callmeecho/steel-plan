'use server'

import { createTaskSnapshot } from '../../lib/task-snapshot-store'
import { loadV2Orders } from '../../lib/server-data'

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

  const totalWeightTons = selectedOrders.reduce((sum, item) => sum + Number(item.weight || 0), 0)
  const uniqueGradeCount = new Set(selectedOrders.map((item) => item.grade).filter(Boolean)).size

  const snapshot = await createTaskSnapshot({
    selectedOrderIds: input.orderIds,
    selectedOrderCount: selectedOrders.length,
    totalWeightTons: Number(totalWeightTons.toFixed(3)),
    uniqueGradeCount,
    options: input.options,
  })

  return { success: true as const, taskId: snapshot.id }
}
