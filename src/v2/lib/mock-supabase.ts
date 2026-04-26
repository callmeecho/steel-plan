import type {
  LengthRule,
  OptimizeParams,
  OptimizeTask,
  Order,
  Plan,
  SectionType,
  ThicknessRule,
} from '../types/domain'

const STEEL_GRADES = [
  'Q235-1-Si',
  'Q345B',
  'Q390B',
  'LR-A36',
  'LR-A',
  'LR-D',
  'LR-E',
  'AH36',
  'AH32',
  'A36(ASTM)',
  'B510L',
  'B610L',
  'A516Gr70N-1',
  'A17100MLNNA',
  'A14085GGFAH',
  'B10150JFCD',
]

function seeded(seed: number) {
  let state = seed
  return () => {
    state = (state * 9301 + 49297) % 233280
    return state / 233280
  }
}

const rand = seeded(2026)

const pick = <T,>(items: T[]): T => items[Math.floor(rand() * items.length)]

const pickWeighted = <T,>(items: T[], weights: number[]): T => {
  const total = weights.reduce((sum, value) => sum + value, 0)
  let current = rand() * total
  for (let index = 0; index < items.length; index += 1) {
    current -= weights[index]
    if (current <= 0) return items[index]
  }
  return items[items.length - 1]
}

function makeOrder(index: number): Order {
  const grade = pick(STEEL_GRADES)
  const thickness = pickWeighted([8, 10, 11, 12, 15, 20, 25, 30, 32, 40], [3, 5, 4, 6, 5, 4, 3, 3, 2, 1])
  const width = pickWeighted([1520, 1665, 1865, 1920, 1960, 2000, 2065, 2220, 2240, 2265], [2, 4, 4, 3, 3, 6, 5, 3, 2, 2])
  const length = pickWeighted([6000, 6250, 6750, 8550, 8900, 9000, 10600, 12000], [3, 2, 2, 2, 2, 3, 2, 6])
  const qty = 1 + Math.floor(rand() * 4)
  const weight = +((thickness * width * length * 7.85) / 1e9 * qty).toFixed(2)
  const contract = `${pick(['OMC', 'OMB', 'EMK'])}26${String(10000 + Math.floor(rand() * 2000)).padStart(7, '0')}`
  const subOrder = String(Math.floor(rand() * 400)).padStart(3, '0')
  const dueDate = new Date(2026, 3, 24 + Math.floor(rand() * 30) - 3)

  return {
    id: `o-${index}`,
    plantId: 'p-1',
    orderId: `${contract} ${subOrder}`,
    contract,
    subOrder,
    orderSeq: 1 + Math.floor(rand() * 350),
    grade,
    thickness,
    rollThickness: +(thickness + (rand() * 0.4 - 0.1)).toFixed(2),
    width,
    length,
    qty,
    weight,
    definition: pickWeighted(['双尺', '单尺'], [7, 3]),
    surface: rand() < 0.25 ? '酸洗' : '普通',
    urgent: rand() < 0.12,
    priority: pickWeighted(['急', '高', '中', '低'], [1, 2, 5, 2]),
    status: pickWeighted(['未排', '未排', '未排', '已排', '部分已排'], [4, 3, 2, 2, 1]),
    dueDate: `2026-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`,
    createdAt: '2026-04-24T08:00:00Z',
    updatedAt: '2026-04-24T08:00:00Z',
  }
}

const DB = {
  orders: Array.from({ length: 48 }, (_, index) => makeOrder(index)),
  section_types: [
    { enabled: true, code: 150, thickness: 1895 },
    { enabled: true, code: 150, thickness: 1925 },
    { enabled: true, code: 180, thickness: 2265 },
    { enabled: true, code: 220, thickness: 1665 },
    { enabled: true, code: 220, thickness: 1865 },
    { enabled: true, code: 220, thickness: 2065 },
    { enabled: true, code: 220, thickness: 2265 },
    { enabled: false, code: 260, thickness: 2065 },
    { enabled: true, code: 260, thickness: 2265 },
  ].map((item, index) => ({ ...item, id: index + 1 })) as SectionType[],
  thickness_rules: [
    { id: 1, plateMin: 0, plateMax: 7.99, slabMin: 0, slabMax: 181 },
    { id: 2, plateMin: 7.99, plateMax: 13.99, slabMin: 219, slabMax: 221 },
    { id: 3, plateMin: 13.99, plateMax: 10000, slabMin: 219, slabMax: 261 },
  ] as ThicknessRule[],
  length_rules: [
    { id: 1, grade: 'LR-A36', widthMin: 1500, widthMax: 2000, lengthMin: 8000, lengthMax: 12000 },
    { id: 2, grade: 'AH36', widthMin: 1500, widthMax: 2100, lengthMin: 6000, lengthMax: 12000 },
    { id: 3, grade: 'Q235-1-Si', widthMin: 1500, widthMax: 2200, lengthMin: 6000, lengthMax: 12000 },
  ] as LengthRule[],
  optimize_tasks: [] as OptimizeTask[],
  plans: [] as Plan[],
}

export const MOCK_ORDERS = DB.orders

type TableName = keyof typeof DB
type TableRowMap = {
  orders: Order
  section_types: SectionType
  thickness_rules: ThicknessRule
  length_rules: LengthRule
  optimize_tasks: OptimizeTask
  plans: Plan
}

class Query<T> {
  constructor(private rows: T[]) {}

  eq(key: keyof T, value: unknown) {
    return new Query(this.rows.filter((row) => row[key] === value))
  }

  order(key: keyof T, options?: { ascending?: boolean }) {
    const ascending = options?.ascending ?? true
    return new Query(
      [...this.rows].sort((left, right) => ((left[key] > right[key] ? 1 : -1) * (ascending ? 1 : -1)))
    )
  }

  limit(count: number) {
    return new Query(this.rows.slice(0, count))
  }

  single() {
    return Promise.resolve({ data: this.rows[0] ?? null, error: null })
  }

  then<R>(resolve: (value: { data: T[]; error: null }) => R) {
    return Promise.resolve({ data: this.rows, error: null }).then(resolve)
  }
}

export const supabase = {
  from<K extends TableName>(table: K) {
    const rows = DB[table] as TableRowMap[K][]

    return {
      select: () => new Query(rows),
      insert: (row: TableRowMap[K]) => {
        const next = { ...row } as TableRowMap[K]
        rows.push(next)
        return Promise.resolve({ data: next, error: null })
      },
      update: (patch: Partial<TableRowMap[K]>) => ({
        eq: (key: keyof TableRowMap[K], value: unknown) => {
          rows.forEach((row) => {
            if (row[key] === value) Object.assign(row, patch)
          })
          return Promise.resolve({ data: null, error: null })
        },
      }),
      delete: () => ({
        eq: (key: keyof TableRowMap[K], value: unknown) => {
          const index = rows.findIndex((row) => row[key] === value)
          if (index >= 0) rows.splice(index, 1)
          return Promise.resolve({ data: null, error: null })
        },
      }),
    }
  },
  channel(_name: string) {
    const listeners: Array<(payload: { new: { progress: number; currentIter: number; bestYield: number; status: string } }) => void> = []

    return {
      on(_event: string, _filter: unknown, callback: (payload: { new: { progress: number; currentIter: number; bestYield: number; status: string } }) => void) {
        listeners.push(callback)
        return this
      },
      subscribe() {
        let tick = 0
        const total = 450
        const timer = setInterval(() => {
          tick += 1
          const progress = Math.min(100, (tick / total) * 100)
          listeners.forEach((callback) =>
            callback({
              new: {
                progress,
                currentIter: Math.floor(tick / 15),
                bestYield: 0.87 + Math.min(0.075, (tick / total) * 0.08),
                status: progress >= 100 ? 'done' : 'running',
              },
            })
          )
          if (progress >= 100) clearInterval(timer)
        }, 100)

        return {
          unsubscribe: () => clearInterval(timer),
        }
      },
    }
  },
}

export const MOCK_PARAMS: OptimizeParams = {
  preferLargeSection: true,
  allowNonStandard: true,
  allowLongSlab: true,
  balanceYield: false,
  respectDueDate: true,
}
