import fs from 'node:fs'

import { getResultDownloadTarget } from '@v2/lib/result-loader'

export async function GET() {
  const target = getResultDownloadTarget()

  if (!target) {
    return new Response('未找到可下载的结果文件', { status: 404 })
  }

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
