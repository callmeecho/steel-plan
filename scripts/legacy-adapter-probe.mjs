import fs from 'node:fs'
import path from 'node:path'
import XLSX from 'xlsx'

const SOURCE_FIELDS = [
  'oid',
  'number',
  'steeltype',
  'thickness',
  'width',
  'length',
  'sizetype',
  'amount',
  'cut',
  'weight',
  'heatway',
  'heatprocess',
  'deliverydate',
  'minimumthicknesstolerance',
  'sampling',
  'orderPurpose',
  'standardNumber',
  'surfaceCustomerRequirements',
  'samplingLength',
  'lengthHigh',
  'lengthLow',
]

const CORE_TARGET_FIELDS = [
  'ORD_NO',
  'ORD_ITEM',
  'STLDES',
  'STLGRD',
  'PLATE_THK',
  'PLATE_WIDTH',
  'PLATE_LEN',
  'CONSTRAINT',
  'PLATE_LEN_MIN',
  'PLATE_LEN_MAX',
  'PLATE_NUM',
  'ROLL_THK',
  'MARGIN_WIDTH',
  'STD_LEN_MIN',
  'STD_LEN_MAX',
  'FULL_LEN_MIN',
  'FULL_LEN_MAX',
  'PLATE_CUT',
  'MP_CUT',
  'SMP_METHOD',
  'SMP_LEN',
  'SURFACE_C',
  'YL_NARROW',
  'MAX_WEIGHT',
  'STLGRD_GRP',
  'STDSPEC',
  'ORD_WGT',
  'PROD_CD',
]

const MAPPED = new Map([
  ['ORD_NO', 'oid'],
  ['ORD_ITEM', 'number'],
  ['STLDES', 'steeltype'],
  ['STLGRD', 'steeltype'],
  ['PLATE_THK', 'thickness'],
  ['PLATE_WIDTH', 'width'],
  ['PLATE_LEN', 'length'],
  ['CONSTRAINT', 'sizetype'],
  ['PLATE_LEN_MIN', 'lengthLow'],
  ['PLATE_LEN_MAX', 'lengthHigh'],
  ['PLATE_NUM', 'amount'],
  ['ROLL_THK', 'thickness'],
  ['SMP_LEN', 'samplingLength'],
  ['STDSPEC', 'standardNumber'],
  ['ORD_WGT', 'weight'],
])

const DEFAULTED = new Set([
  'MARGIN_WIDTH',
  'STD_LEN_MIN',
  'STD_LEN_MAX',
  'FULL_LEN_MIN',
  'FULL_LEN_MAX',
  'PLATE_CUT',
  'MP_CUT',
  'SMP_METHOD',
  'SURFACE_C',
  'YL_NARROW',
  'MAX_WEIGHT',
  'STLGRD_GRP',
  'PROD_CD',
])

function findLegacyRoot() {
  const envDir = process.env.LEGACY_ALGO_WORKDIR
  if (envDir && fs.existsSync(envDir)) return envDir

  const candidates = [
    'D:\\南京钢铁\\南京钢铁后端\\双定尺模型\\ShuangDingChi_MySQL',
    'D:\\NISCO\\ShuangDingChi_MySQL',
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}

function readTemplateColumns(root) {
  const orderXlsx = path.join(root, 'data', 'orders', 'group_1', 'order.xlsx')
  if (!fs.existsSync(orderXlsx)) return { orderXlsx, columns: [] }

  const workbook = XLSX.readFile(orderXlsx, { cellDates: false })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return { orderXlsx, columns: [] }
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null })
  return { orderXlsx, columns: Object.keys(rows[0] || {}) }
}

function main() {
  const root = findLegacyRoot()
  if (!root) {
    console.error('❌ 未找到算法目录，请设置 LEGACY_ALGO_WORKDIR')
    process.exitCode = 1
    return
  }

  const { orderXlsx, columns } = readTemplateColumns(root)
  if (columns.length === 0) {
    console.error(`❌ 未读到模板列: ${orderXlsx}`)
    process.exitCode = 1
    return
  }

  const coreCoverage = CORE_TARGET_FIELDS.map((target) => {
    if (MAPPED.has(target)) {
      const source = MAPPED.get(target)
      const ok = SOURCE_FIELDS.includes(source)
      return { target, mode: 'mapped', source, ok }
    }
    if (DEFAULTED.has(target)) {
      return { target, mode: 'default', source: '-', ok: true }
    }
    return { target, mode: 'missing', source: '-', ok: false }
  })

  const missing = coreCoverage.filter((item) => !item.ok)
  const notInTemplate = CORE_TARGET_FIELDS.filter((field) => !columns.includes(field))

  console.log('\n===== Legacy Adapter Probe =====')
  console.log(`算法目录: ${root}`)
  console.log(`模板文件: ${orderXlsx}`)
  console.log(`模板列数: ${columns.length}`)
  console.log(`核心字段数: ${CORE_TARGET_FIELDS.length}`)
  console.log(`映射字段: ${coreCoverage.filter((item) => item.mode === 'mapped').length}`)
  console.log(`默认补齐: ${coreCoverage.filter((item) => item.mode === 'default').length}`)
  console.log(`缺失字段: ${missing.length}`)
  console.log(`模板不存在字段: ${notInTemplate.length}`)

  if (missing.length > 0) {
    console.log('\n缺失字段详情:')
    for (const item of missing) console.log(`- ${item.target}`)
  }

  if (notInTemplate.length > 0) {
    console.log('\n核心字段在模板中不存在（需二次确认）:')
    for (const item of notInTemplate) console.log(`- ${item}`)
  }

  const pass = missing.length === 0
  console.log(`\n结论: ${pass ? '✅ 可适配（字段层面）' : '❌ 不可适配（存在缺字段）'}`)
}

main()
