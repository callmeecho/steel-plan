import type { Plan } from '../types/domain'

const COLORS = ['#5B8DEF', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#EF4444', '#6366F1']

export function buildMockPlan(): Plan {
  const slabs = Array.from({ length: 14 }, (_, index) => {
    const segments = Array.from({ length: 2 + (index % 4) }, (_, inner) => ({
      orderId: `OMC2601${String(2000 + index * 7 + inner).padStart(7, '0')} ${String(inner * 11).padStart(3, '0')}`,
      length: 6000 + (inner % 3) * 1500,
      qty: 1 + (inner % 3),
      color: COLORS[(index + inner) % COLORS.length],
    }))
    const rollLength = segments.reduce((sum, segment) => sum + segment.length * segment.qty, 0)

    return {
      id: `slab-${index}`,
      planId: 'P-C',
      slabNo: String(250000 + index * 7 + 31).padStart(6, '0'),
      grade: ['Q345B', 'LR-A36', 'AH36', 'Q235-1-Si'][index % 4],
      slabThickness: [180, 220, 260][index % 3],
      slabWidth: [1665, 1865, 2065, 2265][index % 4],
      slabLength: 2100 + (index % 5) * 50,
      rollThickness: 12 + (index % 6) * 2.5,
      rollWidth: [1665, 1865, 2065, 2265][index % 4],
      rollLength,
      yieldRate: 0.86 + (index % 8) * 0.012,
      segments,
    }
  })

  return {
    id: 'P-C',
    taskId: 'T20260425-001',
    name: '方案 C · 综合推荐',
    strategy: '交期 + 成材率平衡',
    params: {
      preferLargeSection: true,
      allowNonStandard: true,
      allowLongSlab: true,
      balanceYield: true,
      respectDueDate: true,
    },
    kpi: {
      avgYield: 0.9358,
      steelWeight: 1842,
      slabWeight: 1968,
      slabCount: slabs.length,
      scheduledOrders: 38,
      unscheduledOrders: 10,
      urgentHitRate: 1.0,
      dueHitRate: 0.97,
    },
    runtime: 45.2,
    recommended: true,
    status: 'draft',
    slabs,
    unscheduledOrderIds: [],
  }
}

export function buildMockVariants(): Plan[] {
  const base = buildMockPlan()

  return [
    {
      ...base,
      id: 'P-A',
      name: '方案 A · 成材率优先',
      strategy: '最大化成材率',
      params: { ...base.params, preferLargeSection: false, balanceYield: false, respectDueDate: false },
      kpi: {
        ...base.kpi,
        avgYield: 0.9487,
        slabCount: base.kpi.slabCount + 2,
        slabWeight: base.kpi.slabWeight * 1.08,
        urgentHitRate: 0.72,
        dueHitRate: 0.81,
      },
      runtime: 42.1,
      recommended: false,
    },
    {
      ...base,
      id: 'P-B',
      name: '方案 B · 板坯数最少',
      strategy: '最小化板坯数量',
      params: { ...base.params, allowNonStandard: false, balanceYield: true },
      kpi: {
        ...base.kpi,
        avgYield: 0.9214,
        slabCount: Math.max(8, base.kpi.slabCount - 3),
        slabWeight: base.kpi.slabWeight * 0.88,
        urgentHitRate: 0.89,
        dueHitRate: 0.94,
      },
      runtime: 38.5,
      recommended: false,
    },
    base,
  ]
}
