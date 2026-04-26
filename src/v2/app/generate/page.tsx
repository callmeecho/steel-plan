import { Suspense } from 'react'

import { GeneratePageClient } from './page-client'

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-ink-tertiary">加载优化配置...</div>}>
      <GeneratePageClient />
    </Suspense>
  )
}
