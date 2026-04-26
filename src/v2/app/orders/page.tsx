import { Topbar } from '../../components/layout/Topbar'
import { loadV2Orders } from '../../lib/server-data'
import { OrdersTable } from './OrdersTable'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const orders = await loadV2Orders()

  return (
    <>
      <Topbar crumb="订单查询" />
      <OrdersTable orders={orders} />
    </>
  )
}
