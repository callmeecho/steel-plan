import fs from 'node:fs'
import path from 'node:path'

export default async function PlanPreviewStaticPage() {
  const filePath = path.join(process.cwd(), 'public', 'plan-preview.html')
  const html = fs.existsSync(filePath)
    ? fs.readFileSync(filePath, 'utf8')
    : '<!doctype html><html><body><p>未生成预览文件。</p></body></html>'

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
