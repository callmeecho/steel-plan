import { Suspense } from 'react'

import { createClient } from '@/lib/supabase/server'

import { GeneratePageClient } from './page-client'

export default async function GeneratePage() {
  const executionMode = (process.env.STEEL_PLAN_EXECUTION_MODE || 'demo').toLowerCase()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let importedOrderIds: string[] = []
  if (user) {
    const { data } = await supabase
      .from('imported_order_selections')
      .select('order_id')
      .eq('user_id', user.id)

    importedOrderIds = Array.from(
      new Set(
        (data ?? [])
          .map((item) => String(item.order_id || '').trim())
          .filter(Boolean),
      ),
    )
  }

  return (
    <Suspense fallback={<div className="p-6 text-sm text-ink-tertiary">加载配置中...</div>}>
      <GeneratePageClient executionMode={executionMode} importedOrderIds={importedOrderIds} />
    </Suspense>
  )
}
