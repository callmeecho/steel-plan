import fs from 'node:fs'
import path from 'node:path'

export type V2TaskSnapshot = {
  id: string
  createdAt: string
  selectedOrderIds: string[]
  selectedOrderCount: number
  totalWeightTons: number
  uniqueGradeCount: number
  options: {
    preferLargeSection: boolean
    allowNonStandard: boolean
    allowLongSlab: boolean
    balanceYield: boolean
    respectDueDate: boolean
  }
}

const STORE_DIR = path.join(process.cwd(), '.data')
const STORE_PATH = path.join(STORE_DIR, 'v2-task-snapshots.json')

export async function createTaskSnapshot(input: Omit<V2TaskSnapshot, 'id' | 'createdAt'>) {
  const snapshots = readSnapshots()
  const snapshot: V2TaskSnapshot = {
    id: buildTaskId(),
    createdAt: new Date().toISOString(),
    ...input,
  }

  snapshots.unshift(snapshot)
  writeSnapshots(snapshots.slice(0, 50))
  return snapshot
}

export async function getTaskSnapshot(taskId: string) {
  return readSnapshots().find((item) => item.id === taskId) ?? null
}

export async function listTaskSnapshots() {
  return readSnapshots()
}

export async function getLatestTaskSnapshot() {
  const snapshots = readSnapshots()
  return snapshots[0] ?? null
}

function readSnapshots() {
  try {
    if (!fs.existsSync(STORE_PATH)) return [] as V2TaskSnapshot[]
    const raw = fs.readFileSync(STORE_PATH, 'utf8')
    if (!raw.trim()) return [] as V2TaskSnapshot[]
    return JSON.parse(raw) as V2TaskSnapshot[]
  } catch {
    return [] as V2TaskSnapshot[]
  }
}

function writeSnapshots(snapshots: V2TaskSnapshot[]) {
  fs.mkdirSync(STORE_DIR, { recursive: true })
  fs.writeFileSync(STORE_PATH, JSON.stringify(snapshots, null, 2), 'utf8')
}

function buildTaskId() {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `T-${stamp}-${random}`
}
