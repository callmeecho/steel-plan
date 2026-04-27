import { Topbar } from '../../components/layout/Topbar'
import { loadV2OrderGradeOptions, loadV2Orders } from '../../lib/server-data'
import { OrdersTable } from './OrdersTable'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const [orders, gradeOptions] = await Promise.all([loadV2Orders(), loadV2OrderGradeOptions()])

  return (
    <>
      <Topbar crumb="订单查询" />
      <OrdersTable orders={orders} gradeOptions={gradeOptions} />
    </>
  )
}
