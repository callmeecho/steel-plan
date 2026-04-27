import fs from 'node:fs'

import { getResultDownloadTarget, loadCurrentPlanSnapshot } from '@v2/lib/result-loader'

function toCsvRow(values: Array<string | number>) {
  return values
    .map((value) => {
      const text = String(value ?? '')
      if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`
      }
      return text
    })
    .join(',')
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const taskId = url.searchParams.get('taskId') || 'current'

  const target = getResultDownloadTarget()

  if (target) {
    const fileBuffer = fs.readFileSync(target.filePath)
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': target.contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(target.fileName)}"`,
        'Cache-Control': 'no-store',
      },
    })
  }

  const snapshot = await loadCurrentPlanSnapshot(taskId)
  if (snapshot && snapshot.results.length > 0) {
    const rows = [
      [
        'slab_no',
        'steel_grade',
        'steel_desc',
        'slab_thickness',
        'slab_width',
        'slab_length',
        'roll_thickness',
        'roll_width',
        'roll_length',
        'slab_weight_t',
        'yield_rate',
      ],
      ...snapshot.results.map((item) => [
        item.slabNo,
        item.steelGrade,
        item.steelDesc,
        item.slabThickness,
        item.slabWidth,
        item.slabLength,
        item.rollThickness,
        item.rollWidth,
        item.rollLength,
        item.slabWeight,
        item.yieldRate,
      ]),
    ]

    const csv = rows.map((row) => toCsvRow(row)).join('\n')
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="plan_result_fallback.csv"',
        'Cache-Control': 'no-store',
      },
    })
  }

  return new Response('未找到可下载结果文件。请先执行一次排产并生成结果。', { status: 404 })
}
