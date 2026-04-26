import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

import { logout } from '../actions'
import { DeliveryTrendChart } from './delivery-trend-chart'
import { GradeBarChart } from './grade-bar-chart'
import { KpiCards } from './kpi-cards'
import { StatusPieChart } from './status-pie-chart'

export const dynamic = 'force-dynamic'

type StatusRow = {
  status: string | null
}

type WeightRow = {
  weight_tons: number | string | null
}

type GradeRelation = {
  standard_steel: string
}

type GradeRow = {
  steel_grade: GradeRelation | GradeRelation[] | null
}

type DeliveryRow = {
  delivery_date: string | null
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, role')
    .eq('id', user.id)
    .single()

  const [
    { count: totalOrders },
    { count: pendingCount },
    { count: completedCount },
    { data: weightData },
    { data: statusData },
    { data: gradeData },
    { data: deliveryData },
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed'),
    supabase.from('orders').select('weight_tons'),
    supabase.from('orders').select('status'),
    supabase
      .from('orders')
      .select('steel_grade:steel_grades(standard_steel)')
      .not('steel_grade_id', 'is', null),
    supabase
      .from('orders')
      .select('delivery_date')
      .gte('delivery_date', new Date().toISOString().slice(0, 10))
      .lte(
        'delivery_date',
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      )
      .not('delivery_date', 'is', null),
  ])

  const totalWeight = ((weightData as WeightRow[] | null) ?? []).reduce(
    (sum, item) => sum + Number(item.weight_tons || 0),
    0
  )

  const completionRate =
    totalOrders && totalOrders > 0
      ? ((completedCount || 0) / totalOrders) * 100
      : 0

  const statusCounts = ((statusData as StatusRow[] | null) ?? []).reduce<
    Record<string, number>
  >((acc, item) => {
    if (!item.status) {
      return acc
    }

    acc[item.status] = (acc[item.status] || 0) + 1
    return acc
  }, {})

  const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
  }))

  const gradeCounts = ((gradeData as GradeRow[] | null) ?? []).reduce<
    Record<string, number>
  >((acc, item) => {
    const relation = Array.isArray(item.steel_grade)
      ? item.steel_grade[0]
      : item.steel_grade
    const gradeName = relation?.standard_steel

    if (!gradeName) {
      return acc
    }

    acc[gradeName] = (acc[gradeName] || 0) + 1
    return acc
  }, {})

  const gradeDistribution = Object.entries(gradeCounts)
    .map(([grade, count]) => ({ grade, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const deliveryCounts = ((deliveryData as DeliveryRow[] | null) ?? []).reduce<
    Record<string, number>
  >((acc, item) => {
    if (!item.delivery_date) {
      return acc
    }

    acc[item.delivery_date] = (acc[item.delivery_date] || 0) + 1
    return acc
  }, {})

  const deliveryTrend: { date: string; count: number }[] = []
  for (let index = 0; index < 30; index += 1) {
    const currentDate = new Date()
    currentDate.setDate(currentDate.getDate() + index)

    const key = currentDate.toISOString().slice(0, 10)
    deliveryTrend.push({
      date: key,
      count: deliveryCounts[key] || 0,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-gray-900">
              中板组坯决策平台
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/orders" className="text-gray-600 hover:text-gray-900">
                订单管理
              </Link>
              <Link href="/parameters" className="text-gray-600 hover:text-gray-900">
                参数设置
              </Link>
              <Link href="/planning" className="text-gray-600 hover:text-gray-900">
                任务准备
              </Link>
              <Link href="/steel-grades" className="text-gray-600 hover:text-gray-900">
                钢种管理
              </Link>
              <Link href="/dashboard" className="font-medium text-blue-600">
                数据看板
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {profile?.display_name || user.email}
              <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                {profile?.role || 'viewer'}
              </span>
            </span>
            <form action={logout}>
              <Button variant="ghost" size="sm" type="submit">
                退出登录
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据看板</h1>
          <p className="mt-1 text-sm text-gray-600">
            从订单数量、总重量、状态分布和未来 30 天交付趋势几个维度，快速查看当前业务运行情况。
          </p>
        </div>

        <KpiCards
          totalOrders={totalOrders || 0}
          totalWeight={totalWeight}
          pendingCount={pendingCount || 0}
          completionRate={completionRate}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <StatusPieChart data={statusDistribution} />
          <GradeBarChart data={gradeDistribution} />
        </div>

        <DeliveryTrendChart data={deliveryTrend} />
      </main>
    </div>
  )
}

