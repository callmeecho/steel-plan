import fs from 'node:fs'
import path from 'node:path'
import * as XLSX from 'xlsx'

const RESULT_DIR_CANDIDATES = [
  'D:\\南京钢铁\\南京钢铁后端\\双定尺模型\\ShuangDingChi_MySQL\\data\\results',
  'D:\\南京钢铁\\南京钢铁后端\\双定尺模型\\ShuangDingChi_MySQL跑不起来\\files',
]

function findResultDir() {
  return (
    RESULT_DIR_CANDIDATES.find((candidate) =>
      fs.existsSync(path.join(candidate, 'design_result.xlsx'))
    ) ?? null
  )
}

function readSheet(filePath) {
  if (!fs.existsSync(filePath)) return []
  const buffer = fs.readFileSync(filePath)
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return []
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null })
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function toText(value) {
  if (value === null || value === undefined) return '-'
  const text = String(value).trim()
  return text || '-'
}

function normalizeOrderId(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

function getSegmentColor(orderId) {
  const key = orderId.trim().toUpperCase()
  let hash = 0
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0
  }
  const hue = hash % 360
  const saturation = 56 + (hash % 14)
  const lightness = 50 + ((hash >> 3) % 10)
  return `hsl(${hue} ${saturation}% ${lightness}%)`
}

function buildSegment(orderId, thickness, width, length, qty) {
  if (!orderId || length <= 0 || qty <= 0) return null
  return {
    orderId,
    thickness,
    width,
    length,
    qty,
    color: getSegmentColor(orderId),
  }
}

function readExtraSegments(row) {
  const segments = []
  for (const key of Object.keys(row)) {
    const match = key.match(/^data_col_0(\.\d+)?$/)
    if (!match) continue
    const suffix = match[1] ?? ''
    const segment = buildSegment(
      normalizeOrderId(row[`data_col_0${suffix}`]),
      toNumber(row[`data_col_1${suffix}`]),
      toNumber(row[`data_col_2${suffix}`]),
      toNumber(row[`data_col_3${suffix}`]),
      toNumber(row[`data_col_4${suffix}`])
    )
    if (segment) segments.push(segment)
  }
  return segments
}

function mapDesignRow(row, index) {
  const primaryOrder = buildSegment(
    normalizeOrderId(row.ORD_INFO),
    toNumber(row.PLATE_THK),
    toNumber(row.PLATE_WIDTH),
    toNumber(row.PLATE_LEN),
    toNumber(row.PLATE_NUM)
  )

  const segments = [primaryOrder, ...readExtraSegments(row)].filter(Boolean)

  return {
    id: `slab-${index + 1}`,
    slabNo: toText(row.SLAB_NO ?? index + 1),
    steelGrade: toText(row.STLGRD),
    steelDesc: toText(row.STLDES),
    slabThickness: toNumber(row.SLAB_THK),
    slabWidth: toNumber(row.SLAB_WIDTH),
    slabLength: toNumber(row.SLAB_LEN),
    slabWeight: toNumber(row.WEIGHT),
    rollThickness: toNumber(row.ROLL_THK),
    rollWidth: toNumber(row.ROLL_WIDTH),
    rollLength: toNumber(row.ROLL_LEN),
    yieldRate: toNumber(row.EFFICIENCY),
    segments,
  }
}

function mapRemainRow(row) {
  return {
    orderId: normalizeOrderId(`${toText(row.ORD_NO)} ${toText(row.ORD_ITEM)}`),
    steelDesc: toText(row.STLDES),
    steelGrade: toText(row.STLGRD),
    plateThickness: toNumber(row.PLATE_THK),
    plateWidth: toNumber(row.PLATE_WIDTH),
    plateLength: toNumber(row.PLATE_LEN),
    qty: toNumber(row.PLATE_NUM),
    weight: toNumber(row.ORD_WGT),
    constraint: toText(row.CONSTRAINT),
  }
}

function buildStats(results) {
  const map = new Map()
  for (const row of results) {
    const key = `${row.slabThickness} x ${row.slabWidth}`
    const current = map.get(key) ?? {
      key,
      slabThickness: row.slabThickness,
      slabWidth: row.slabWidth,
      slabCount: 0,
      slabWeight: 0,
      steelWeight: 0,
      avgYield: 0,
    }
    current.slabCount += 1
    current.slabWeight += row.slabWeight
    current.steelWeight += row.slabWeight * row.yieldRate
    current.avgYield = current.slabWeight > 0 ? current.steelWeight / current.slabWeight : 0
    map.set(key, current)
  }
  return Array.from(map.values())
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function renderRows(rows, cells) {
  return rows
    .map((row) => `<tr>${cells.map((cell) => `<td>${escapeHtml(cell(row))}</td>`).join('')}</tr>`)
    .join('')
}

function renderGraph(results) {
  const maxRollLength = Math.max(...results.map((item) => item.rollLength), 1)

  return results
    .slice(0, 24)
    .map((slab, index) => {
      const usedLength = slab.segments.reduce((sum, segment) => sum + segment.length * segment.qty, 0)
      const fillRate = usedLength / Math.max(slab.rollLength, 1)
      const graphWidth = Math.max((slab.rollLength / maxRollLength) * 100, 68)

      const pieces = slab.segments
        .flatMap((segment, segmentIndex) =>
          Array.from({ length: Math.max(segment.qty, 0) }, (_, pieceIndex) => ({
            key: `${segment.orderId}-${segmentIndex}-${pieceIndex}`,
            orderId: segment.orderId,
            length: segment.length,
            width: segment.width,
            color: segment.color,
            pieceIndex: pieceIndex + 1,
          }))
        )
        .map((piece) => {
          const height =
            piece.width > 0 && slab.rollWidth > 0
              ? Math.max(34, Math.min(72, Math.round((piece.width / slab.rollWidth) * 72)))
              : 58
          const width = `${(piece.length / Math.max(usedLength, 1)) * 100}%`
          return `<div class="piece" style="background:${piece.color};width:${width};min-width:66px;height:${height}px">
            <div class="piece-order">${escapeHtml(piece.orderId)}</div>
            <div class="piece-seq">${piece.pieceIndex}</div>
          </div>`
        })
        .join('')

      return `<section class="slab-card">
        <div class="slab-head">
          <div class="slab-index">#${index + 1}</div>
          <div class="slab-metrics">
            <div><span>钢种</span><strong>${escapeHtml(slab.steelGrade)}</strong></div>
            <div><span>板坯厚</span><strong>${slab.slabThickness}</strong></div>
            <div><span>板坯宽</span><strong>${slab.slabWidth}</strong></div>
            <div><span>板坯长</span><strong>${slab.slabLength}</strong></div>
            <div><span>轧件厚</span><strong>${slab.rollThickness.toFixed(2)}</strong></div>
            <div><span>轧件宽</span><strong>${slab.rollWidth}</strong></div>
            <div><span>轧件长</span><strong>${slab.rollLength.toFixed(0)}</strong></div>
            <div><span>成材率</span><strong class="success">${(slab.yieldRate * 100).toFixed(2)}%</strong></div>
          </div>
        </div>
        <div class="graph-wrap">
          <div class="graph-caption"><span>轧件排布示意</span><span>已排 ${usedLength.toFixed(0)} / ${slab.rollLength.toFixed(0)}</span></div>
          <div class="graph-shell" style="width:${graphWidth}%">
            <div class="graph-track">
              <div class="graph-pieces" style="width:${Math.min(fillRate * 100, 100)}%">${pieces}</div>
            </div>
          </div>
        </div>
      </section>`
    })
    .join('')
}

function main() {
  const sourceDir = findResultDir()
  if (!sourceDir) {
    throw new Error('未找到结果目录')
  }

  const designRows = readSheet(path.join(sourceDir, 'design_result.xlsx'))
  const remainRows = readSheet(path.join(sourceDir, 'remain_orders.xlsx'))
  const results = designRows.map(mapDesignRow)
  const stats = buildStats(results)
  const unscheduled = remainRows.map(mapRemainRow).filter((item) => item.orderId)

  const generatedAt = fs.statSync(path.join(sourceDir, 'design_result.xlsx')).mtime
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>计划方案预览</title>
  <style>
    body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;background:#f8fafc;color:#0f172a}
    .page{max-width:1480px;margin:0 auto;padding:24px}
    .panel{background:#fff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden}
    .header{display:flex;justify-content:space-between;align-items:flex-start;padding:20px 24px;border-bottom:1px solid #e2e8f0}
    .title{font-size:22px;font-weight:700}
    .meta{margin-top:6px;font-size:13px;color:#64748b}
    .tabs{display:flex;gap:4px;padding:0 20px;border-bottom:1px solid #e2e8f0;background:#fff;position:sticky;top:0}
    .tab{padding:14px 12px;border-bottom:2px solid transparent;color:#64748b;text-decoration:none;font-size:14px}
    .tab.active{border-color:#2563eb;color:#2563eb;font-weight:600}
    .content{padding:20px}
    table{width:100%;border-collapse:collapse;font-size:13px}
    thead{background:#f8fafc;color:#64748b}
    th,td{padding:12px 10px;border-top:1px solid #e2e8f0;text-align:left}
    tbody tr:hover{background:#f8fafc}
    .mono{font-family:ui-monospace,SFMono-Regular,Consolas,monospace}
    .success{color:#059669}
    .slab-card{border:1px solid #e2e8f0;border-radius:14px;background:#fff;padding:16px;margin-bottom:12px}
    .slab-head{display:flex;gap:16px;margin-bottom:12px}
    .slab-index{width:40px;text-align:center;font:600 15px ui-monospace}
    .slab-metrics{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:8px 16px;font-size:11px;flex:1}
    .slab-metrics span{display:block;color:#64748b;font-size:10px;margin-bottom:2px}
    .graph-wrap{border:1px solid #e2e8f0;border-radius:14px;background:#f8fafc;padding:16px}
    .graph-caption{display:flex;justify-content:space-between;font-size:10px;color:#64748b;margin-bottom:8px}
    .graph-shell{margin:0 auto;border:1px solid #bfd4ff;background:#e9f2ff;border-radius:10px;padding:12px}
    .graph-track{min-height:110px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.7);background:#d9e9ff;border-radius:8px;padding:18px}
    .graph-pieces{display:flex;align-items:center;justify-content:center;min-width:66px}
    .piece{display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid #2563eb;overflow:hidden;color:#0f172a;padding:0 6px;text-align:center}
    .piece-order{font:600 11px ui-monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
    .piece-seq{font-size:10px;margin-top:2px}
  </style>
</head>
<body>
  <div class="page">
    <div class="panel">
      <div class="header">
        <div>
          <div class="title">计划方案预览</div>
          <div class="meta">来源 ${escapeHtml(sourceDir)} / 结果时间 ${generatedAt.toISOString().replace('T', ' ').slice(0, 19)}</div>
        </div>
      </div>
      <div class="tabs">
        <a class="tab active" href="#results">优化结果</a>
        <a class="tab" href="#graph">图形展示</a>
        <a class="tab" href="#stats">板坯统计</a>
        <a class="tab" href="#unscheduled">未排订单</a>
      </div>
      <div class="content">
        <section id="results">
          <table>
            <thead><tr><th>板坯号</th><th>钢种</th><th>钢种说明</th><th>板坯厚</th><th>板坯宽</th><th>板坯长</th><th>轧件厚</th><th>轧件宽</th><th>轧件长</th><th>板坯重量 (t)</th><th>成材率</th></tr></thead>
            <tbody>${renderRows(results, [
              (row) => `<span class="mono">${row.slabNo}</span>`,
              (row) => row.steelGrade,
              (row) => row.steelDesc,
              (row) => row.slabThickness,
              (row) => row.slabWidth,
              (row) => row.slabLength,
              (row) => row.rollThickness.toFixed(2),
              (row) => row.rollWidth,
              (row) => row.rollLength.toFixed(0),
              (row) => row.slabWeight.toFixed(3),
              (row) => `${(row.yieldRate * 100).toFixed(2)}%`,
            ])}</tbody>
          </table>
        </section>
        <section id="graph" style="margin-top:24px">${renderGraph(results)}</section>
        <section id="stats" style="margin-top:24px">
          <table>
            <thead><tr><th>断面</th><th>板坯厚</th><th>板坯宽</th><th>板坯数</th><th>板坯总重 (t)</th><th>钢板总重 (t)</th><th>平均成材率</th></tr></thead>
            <tbody>${renderRows(stats, [
              (row) => `<span class="mono">${row.key}</span>`,
              (row) => row.slabThickness,
              (row) => row.slabWidth,
              (row) => row.slabCount,
              (row) => row.slabWeight.toFixed(3),
              (row) => row.steelWeight.toFixed(3),
              (row) => `${(row.avgYield * 100).toFixed(2)}%`,
            ])}</tbody>
          </table>
        </section>
        <section id="unscheduled" style="margin-top:24px">
          <table>
            <thead><tr><th>订单号</th><th>钢种说明</th><th>钢种</th><th>厚度</th><th>宽度</th><th>长度</th><th>数量</th><th>订单重量 (t)</th><th>约束</th></tr></thead>
            <tbody>${renderRows(unscheduled, [
              (row) => `<span class="mono">${row.orderId}</span>`,
              (row) => row.steelDesc,
              (row) => row.steelGrade,
              (row) => row.plateThickness,
              (row) => row.plateWidth,
              (row) => row.plateLength,
              (row) => row.qty,
              (row) => row.weight.toFixed(3),
              (row) => row.constraint,
            ])}</tbody>
          </table>
        </section>
      </div>
    </div>
  </div>
</body>
</html>`

  fs.mkdirSync(path.join(process.cwd(), 'public'), { recursive: true })
  fs.writeFileSync(path.join(process.cwd(), 'public', 'plan-preview.html'), html, 'utf8')
  console.log('Generated public/plan-preview.html')
}

main()
