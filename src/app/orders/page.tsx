import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Button } from '@/components/ui/button'
import type { OrderWithSteelGrade } from '@/lib/database.types'
import { createClient } from '@/lib/supabase/server'

import { logout } from '../actions'
import { OrderCheckbox } from './order-checkbox'
import { Pagination } from './pagination'
import { SearchBar } from './search-bar'
import { SelectionPanel } from './selection-panel'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 15

type SearchParams = Promise<{
  page?: string
  search?: string
  steel_grade?: string
  thickness_min?: string
  thickness_max?: string
  width_min?: string
  width_max?: string
  length_min?: string
  length_max?: string
}>

type LegacyOrderRow = {
  oid: string | null
  number: string | number | null
  steeltype: string | null
  thickness: string | number | null
  width: string | number | null
  length: string | number | null
  sizetype: string | null
  amount: string | number | null
  cut: string | null
  weight: string | number | null
  heatway: string | null
  heatprocess: string | null
  deliverydate: string | null
}

type LegacyOrderView = {
  id: string
  orderNo: string
  sequenceNo: string
  steelType: string
  thickness: number | null
  width: number | null
  length: number | null
  sizeType: string
  quantity: number | null
  weight: number | null
  cut: string
  deliveryDate: string | null
}

type SteelOption = {
  id: string
  standard_steel: string
  internal_code: string
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
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

  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || '1', 10))
  const search = params.search?.trim() || ''
  const steelType = params.steel_grade?.trim() || ''
  const thicknessMin = parseNumberOrUndefined(params.thickness_min)
  const thicknessMax = parseNumberOrUndefined(params.thickness_max)
  const widthMin = parseNumberOrUndefined(params.width_min)
  const widthMax = parseNumberOrUndefined(params.width_max)
  const lengthMin = parseNumberOrUndefined(params.length_min)
  const lengthMax = parseNumberOrUndefined(params.length_max)

  const legacyRows = await loadLegacyOrders(supabase)
  const useLegacySource = legacyRows !== null

  if (useLegacySource) {
    const allRows = legacyRows.map(normalizeLegacyRow)

    const filteredRows = allRows.filter((row) => {
      if (search) {
        const key = `${row.orderNo}${row.sequenceNo}`.toLowerCase()
        if (!key.includes(search.toLowerCase())) return false
      }
      if (steelType && row.steelType !== steelType) return false
      if (thicknessMin !== undefined && (row.thickness ?? -Infinity) < thicknessMin) return false
      if (thicknessMax !== undefined && (row.thickness ?? Infinity) > thicknessMax) return false
      if (widthMin !== undefined && (row.width ?? -Infinity) < widthMin) return false
      if (widthMax !== undefined && (row.width ?? Infinity) > widthMax) return false
      if (lengthMin !== undefined && (row.length ?? -Infinity) < lengthMin) return false
      if (lengthMax !== undefined && (row.length ?? Infinity) > lengthMax) return false
      return true
    })

    const totalCount = filteredRows.length
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
    const from = (currentPage - 1) * PAGE_SIZE
    const pageRows = filteredRows.slice(from, from + PAGE_SIZE)

    const steelOptions = Array.from(
      new Set(allRows.map((item) => item.steelType).filter(Boolean))
    ).map((name) => ({
      id: name,
      standard_steel: name,
      internal_code: '',
    }))

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-xl font-bold text-gray-900">
                中板组坯决策平台
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <Link href="/orders" className="font-medium text-blue-600">
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
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
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

        <main className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">订单管理</h1>
            <p className="mt-1 text-sm text-gray-600">
              数据源：orderinfomation；共 {totalCount} 条记录，当前第 {currentPage} / {totalPages} 页。
            </p>
          </div>

          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
            <SearchBar steelGrades={steelOptions} />
          </div>

          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            当前为算法订单主表视图（orderinfomation）。该视图不参与“勾选进入任务准备”。
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <Th>订单号</Th>
                    <Th>序号</Th>
                    <Th>钢种</Th>
                    <Th>厚度 (mm)</Th>
                    <Th>宽度 (mm)</Th>
                    <Th>长度 (mm)</Th>
                    <Th>定尺类型</Th>
                    <Th>数量</Th>
                    <Th>重量 (t)</Th>
                    <Th>切边</Th>
                    <Th>交付日期</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pageRows.length > 0 ? (
                    pageRows.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <Td className="font-mono text-gray-900">{order.orderNo}</Td>
                        <Td>{order.sequenceNo}</Td>
                        <Td>{order.steelType || '-'}</Td>
                        <Td>{formatMaybeNumber(order.thickness)}</Td>
                        <Td>{formatMaybeNumber(order.width)}</Td>
                        <Td>{formatMaybeNumber(order.length)}</Td>
                        <Td>{order.sizeType || '-'}</Td>
                        <Td>{formatMaybeNumber(order.quantity)}</Td>
                        <Td>{formatMaybeNumber(order.weight, 3)}</Td>
                        <Td>{order.cut || '-'}</Td>
                        <Td>{order.deliveryDate || '-'}</Td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                        当前筛选条件下没有找到订单。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6">
            <Pagination currentPage={currentPage} totalPages={totalPages} />
          </div>
        </main>
      </div>
    )
  }

  const { data: steelGrades } = await supabase
    .from('steel_grades')
    .select('id, standard_steel, internal_code')
    .order('standard_steel', { ascending: true })

  const { data: selections } = await supabase
    .from('order_selections')
    .select('order_id')

  const selectedOrderIds = new Set((selections ?? []).map((item) => item.order_id))

  let query = supabase
    .from('orders')
    .select(
      `
        *,
        steel_grade:steel_grades (
          id,
          standard_steel,
          internal_code
        )
      `,
      { count: 'exact' }
    )

  if (search) query = query.ilike('order_number', `%${search}%`)
  if (steelType) query = query.eq('steel_grade_id', steelType)
  if (thicknessMin !== undefined) query = query.gte('plate_thickness_mm', thicknessMin)
  if (thicknessMax !== undefined) query = query.lte('plate_thickness_mm', thicknessMax)
  if (widthMin !== undefined) query = query.gte('width_mm', widthMin)
  if (widthMax !== undefined) query = query.lte('width_mm', widthMax)
  if (lengthMin !== undefined) query = query.gte('length_mm', lengthMin)
  if (lengthMax !== undefined) query = query.lte('length_mm', lengthMax)

  let idsQuery = supabase.from('orders').select('id')
  if (search) idsQuery = idsQuery.ilike('order_number', `%${search}%`)
  if (steelType) idsQuery = idsQuery.eq('steel_grade_id', steelType)
  if (thicknessMin !== undefined) idsQuery = idsQuery.gte('plate_thickness_mm', thicknessMin)
  if (thicknessMax !== undefined) idsQuery = idsQuery.lte('plate_thickness_mm', thicknessMax)
  if (widthMin !== undefined) idsQuery = idsQuery.gte('width_mm', widthMin)
  if (widthMax !== undefined) idsQuery = idsQuery.lte('width_mm', widthMax)
  if (lengthMin !== undefined) idsQuery = idsQuery.gte('length_mm', lengthMin)
  if (lengthMax !== undefined) idsQuery = idsQuery.lte('length_mm', lengthMax)

  const { data: allFilteredRows } = await idsQuery.limit(10000)
  const allFilteredOrderIds = (allFilteredRows ?? []).map((item) => item.id)

  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  const {
    data: orders,
    count,
    error,
  } = await query
    .order('created_at', { ascending: false })
    .range(from, to)
    .returns<OrderWithSteelGrade[]>()

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">读取订单失败：{error.message}</p>
      </div>
    )
  }

  const totalCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const currentPageOrderIds = (orders ?? []).map((order) => order.id)

  let selectedTotalWeight = 0
  if (selectedOrderIds.size > 0) {
    const { data: selectedWeights } = await supabase
      .from('orders')
      .select('weight_tons')
      .in('id', Array.from(selectedOrderIds))

    selectedTotalWeight = (selectedWeights ?? []).reduce(
      (sum, item) => sum + Number(item.weight_tons || 0),
      0
    )
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
              <Link href="/orders" className="font-medium text-blue-600">
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
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
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

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">订单管理</h1>
          <p className="mt-1 text-sm text-gray-600">
            共 {totalCount} 条记录，当前第 {currentPage} / {totalPages} 页。
          </p>
        </div>

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <SearchBar steelGrades={steelGrades ?? []} />
        </div>

        <SelectionPanel
          selectedCount={selectedOrderIds.size}
          selectedTotalWeight={selectedTotalWeight}
          currentPageOrderIds={currentPageOrderIds}
          allFilteredOrderIds={allFilteredOrderIds}
        />

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <Th>
                    <span className="sr-only">选择</span>
                  </Th>
                  <Th>订单号</Th>
                  <Th>序列号</Th>
                  <Th>钢种</Th>
                  <Th>厚度 (mm)</Th>
                  <Th>宽度 (mm)</Th>
                  <Th>长度 (mm)</Th>
                  <Th>数量</Th>
                  <Th>重量 (t)</Th>
                  <Th>交付日期</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders && orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <Td>
                        <OrderCheckbox
                          orderId={order.id}
                          checked={selectedOrderIds.has(order.id)}
                        />
                      </Td>
                      <Td className="font-mono text-gray-900">{order.order_number}</Td>
                      <Td>{order.sequence_no}</Td>
                      <Td>
                        {order.steel_grade ? (
                          <span>
                            <span className="font-medium text-gray-900">
                              {order.steel_grade.standard_steel}
                            </span>
                            {order.steel_grade.internal_code ? (
                              <span className="ml-1 text-gray-500">
                                ({order.steel_grade.internal_code})
                              </span>
                            ) : null}
                          </span>
                        ) : (
                          <span className="text-gray-400">未关联钢种</span>
                        )}
                      </Td>
                      <Td>{order.plate_thickness_mm ?? '-'}</Td>
                      <Td>{order.width_mm ?? '-'}</Td>
                      <Td>{order.length_mm ?? '-'}</Td>
                      <Td>{order.quantity}</Td>
                      <Td>{Number(order.weight_tons).toFixed(2)}</Td>
                      <Td>{order.delivery_date ?? '-'}</Td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                      当前筛选条件下没有找到订单。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6">
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </div>
      </main>
    </div>
  )
}

async function loadLegacyOrders(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const candidateTables = ['orderinfomation', 'orderinformation']

  for (const tableName of candidateTables) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(10000)

    if (!error && data) {
      return data as LegacyOrderRow[]
    }
  }

  return null
}

function normalizeLegacyRow(row: LegacyOrderRow): LegacyOrderView {
  const orderNo = String(row.oid || '').trim()
  const sequenceNo = String(row.number || '').trim()

  return {
    id: `${orderNo}-${sequenceNo}`,
    orderNo,
    sequenceNo,
    steelType: String(row.steeltype || '').trim(),
    thickness: parseMaybeNumber(row.thickness),
    width: parseMaybeNumber(row.width),
    length: parseMaybeNumber(row.length),
    sizeType: String(row.sizetype || '').trim(),
    quantity: parseMaybeNumber(row.amount),
    weight: parseMaybeNumber(row.weight),
    cut: String(row.cut || '').trim(),
    deliveryDate: row.deliverydate,
  }
}

function parseNumberOrUndefined(value: string | undefined): number | undefined {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseMaybeNumber(value: string | number | null): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function formatMaybeNumber(value: number | null, digits = 0) {
  if (value === null) return '-'
  if (digits <= 0) return Number.isInteger(value) ? String(value) : value.toFixed(2)
  return value.toFixed(digits)
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
      {children}
    </th>
  )
}

function Td({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <td className={`whitespace-nowrap px-4 py-3 text-sm text-gray-700 ${className}`}>
      {children}
    </td>
  )
}

