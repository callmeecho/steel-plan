import fs from 'node:fs'
import path from 'node:path'

type ImportedOrderStore = Record<string, string[]>

const STORE_DIR = path.join(process.cwd(), '.data')
const STORE_PATH = path.join(STORE_DIR, 'v2-imported-orders.json')

function readStore(): ImportedOrderStore {
  try {
    if (!fs.existsSync(STORE_PATH)) return {}
    const raw = fs.readFileSync(STORE_PATH, 'utf8')
    if (!raw.trim()) return {}
    return JSON.parse(raw) as ImportedOrderStore
  } catch {
    return {}
  }
}

function writeStore(data: ImportedOrderStore) {
  fs.mkdirSync(STORE_DIR, { recursive: true })
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8')
}

export function setImportedOrders(userId: string, orderIds: string[]) {
  const normalized = Array.from(
    new Set(orderIds.map((item) => String(item || '').trim()).filter(Boolean)),
  )
  const store = readStore()
  store[userId] = normalized
  writeStore(store)
  return normalized.length
}

export function getImportedOrders(userId: string) {
  const store = readStore()
  return Array.isArray(store[userId]) ? store[userId] : []
}

