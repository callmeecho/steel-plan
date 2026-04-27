import { Suspense } from 'react'

import { createClient } from '@/lib/supabase/server'
import { getImportedOrders } from '../../lib/imported-orders-store'

import { GeneratePageClient } from './page-client'

export default async function GeneratePage() {
  const executionMode = (process.env.STEEL_PLAN_EXECUTION_MODE || 'demo').toLowerCase()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let importedOrderIds: string[] = []
  if (user) {
    importedOrderIds = getImportedOrders(user.id)
  }

  return (
    <Suspense fallback={<div className="p-6 text-sm text-ink-tertiary">加载配置中...</div>}>
      <GeneratePageClient executionMode={executionMode} importedOrderIds={importedOrderIds} />
    </Suspense>
  )
}
