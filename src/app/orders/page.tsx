import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Pagination } from './pagination'
import { logout } from '../actions'
import type { OrderWithSteelGrade } from '@/lib/database.types'
import { SearchBar } from './search-bar'
import { SelectionPanel } from './selection-panel'
import { OrderCheckbox } from './order-checkbox'

// 禁用此页面的缓存，保证筛选参数变化时总是重新查询
export const dynamic = 'force-dynamic'

// 每页显示的订单数
const PAGE_SIZE = 15

// searchParams 类型: Next.js 15+ 传入的是 Promise
type SearchParams = Promise<{
    page?: string
    search?: string
    steel_grade?: string
    status?: string
    thickness_min?: string
    thickness_max?: string
    width_min?: string
    width_max?: string
    length_min?: string
    length_max?: string
}>
export default async function OrdersPage({
    searchParams,
}: {
    searchParams: SearchParams
}) {
    const supabase = await createClient()

    // 鉴权
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // 取当前用户 profile (显示用户名和角色)
    const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, role')
        .eq('id', user.id)
        .single()

    // 解析分页参数 (Next.js 15+ 要 await)
    const params = await searchParams
    const currentPage = Math.max(1, parseInt(params.page || '1', 10))
    const search = params.search?.trim() || ''
    const steelGradeId = params.steel_grade?.trim() || ''
    const status = params.status?.trim() || ''

    // 尺寸范围参数 (字符串转数字, 无效值保持 undefined 不参与筛选)
    const thicknessMin = parseNumberOrUndefined(params.thickness_min)
    const thicknessMax = parseNumberOrUndefined(params.thickness_max)
    const widthMin = parseNumberOrUndefined(params.width_min)
    const widthMax = parseNumberOrUndefined(params.width_max)
    const lengthMin = parseNumberOrUndefined(params.length_min)
    const lengthMax = parseNumberOrUndefined(params.length_max)
    const from = (currentPage - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    // 查钢种字典（给筛选栏下拉用）
    const { data: steelGrades } = await supabase
        .from('steel_grades')
        .select('id, standard_steel, internal_code')
        .order('standard_steel', { ascending: true })

    // 查当前用户已选中的订单 id 集合 (RLS 自动限定本人)
    const { data: selections } = await supabase
    .from('order_selections')
    .select('order_id')

    const selectedOrderIds = new Set((selections ?? []).map((s) => s.order_id))

    // 查订单 + 关联钢种 + 分页 + 计数
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

    // 按订单号模糊搜索
    if (search) {
        query = query.ilike('order_number', `%${search}%`)
    }

    // 按钢种精确过滤
    if (steelGradeId) {
        query = query.eq('steel_grade_id', steelGradeId)
    }

    // 按状态精确过滤
    if (status) {
        query = query.eq('status', status)
    }

    // 厚度范围筛选
    if (thicknessMin !== undefined) {
        query = query.gte('plate_thickness_mm', thicknessMin)
    }
    if (thicknessMax !== undefined) {
        query = query.lte('plate_thickness_mm', thicknessMax)
    }

    // 宽度范围筛选
    if (widthMin !== undefined) {
        query = query.gte('width_mm', widthMin)
    }
    if (widthMax !== undefined) {
        query = query.lte('width_mm', widthMax)
    }

    // 长度范围筛选
    if (lengthMin !== undefined) {
        query = query.gte('length_mm', lengthMin)
    }
    if (lengthMax !== undefined) {
        query = query.lte('length_mm', lengthMax)
    }
    // 构建一个 "不分页、只要 id" 的查询, 给 "全选" 按钮用
// 共享所有筛选条件, 复用同一套过滤逻辑
let idsQuery = supabase.from('orders').select('id')
if (search) idsQuery = idsQuery.ilike('order_number', `%${search}%`)
if (steelGradeId) idsQuery = idsQuery.eq('steel_grade_id', steelGradeId)
if (status) idsQuery = idsQuery.eq('status', status)
if (thicknessMin !== undefined) idsQuery = idsQuery.gte('plate_thickness_mm', thicknessMin)
if (thicknessMax !== undefined) idsQuery = idsQuery.lte('plate_thickness_mm', thicknessMax)
if (widthMin !== undefined) idsQuery = idsQuery.gte('width_mm', widthMin)
if (widthMax !== undefined) idsQuery = idsQuery.lte('width_mm', widthMax)
if (lengthMin !== undefined) idsQuery = idsQuery.gte('length_mm', lengthMin)
if (lengthMax !== undefined) idsQuery = idsQuery.lte('length_mm', lengthMax)

const { data: allFilteredRows } = await idsQuery.limit(10000)
const allFilteredOrderIds = (allFilteredRows ?? []).map((r) => r.id)
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
                <p className="text-red-600">加载订单失败: {error.message}</p>
            </div>
        )
    }

    const totalCount = count ?? 0
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

// 当前页订单 id (给"选中本页"按钮用)
const currentPageOrderIds = (orders ?? []).map((o) => o.id)

// 已选订单的总重量: 从 order_selections 里拿出所有已选 id
// 再查对应订单的 weight_tons, 加总
let selectedTotalWeight = 0
if (selectedOrderIds.size > 0) {
  const { data: selectedWeights } = await supabase
    .from('orders')
    .select('weight_tons')
    .in('id', Array.from(selectedOrderIds))
  selectedTotalWeight = (selectedWeights ?? []).reduce(
    (sum, o) => sum + Number(o.weight_tons || 0),
    0
  )
}

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 顶部导航 */}
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="text-xl font-bold text-gray-900">
                            Steel Plan
                        </Link>
                        <nav className="flex items-center gap-4 text-sm">
                            <Link href="/orders" className="text-blue-600 font-medium">
                                订单查询
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
                                登出
                            </Button>
                        </form>
                    </div>
                </div>
            </header>

            {/* 主体 */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">订单查询</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        共 {totalCount} 条订单 · 第 {currentPage} / {totalPages} 页
                    </p>
                </div>

                {/* 搜索栏 */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                    <SearchBar steelGrades={steelGrades ?? []} />
                </div>


                {/* 已选订单面板 */}
                <SelectionPanel
                selectedCount={selectedOrderIds.size}
                selectedTotalWeight={selectedTotalWeight}
                currentPageOrderIds={currentPageOrderIds}
                allFilteredOrderIds={allFilteredOrderIds}
                />

                {/* 表格 */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <Th>
                                    <span className="sr-only">选择</span>
                                    </Th>
                                    <Th>订单号</Th>
                                    <Th>序列</Th>
                                    <Th>钢种</Th>
                                    <Th>厚度(mm)</Th>
                                    <Th>宽度(mm)</Th>
                                    <Th>长度(mm)</Th>
                                    <Th>数量</Th>
                                    <Th>重量(t)</Th>
                                    <Th>状态</Th>
                                    <Th>交货日期</Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {orders && orders.length > 0 ? (
                                    orders.map((o) => (
                                        <tr key={o.id} className="hover:bg-gray-50">
                                                <Td>
                                                <OrderCheckbox
                                                    orderId={o.id}
                                                    checked={selectedOrderIds.has(o.id)}
                                                />
                                                </Td>
                                            <Td className="font-mono text-gray-900">{o.order_number}</Td>
                                            <Td>{o.sequence_no}</Td>
                                            <Td>
                                                {o.steel_grade ? (
                                                    <span>
                                                        <span className="font-medium text-gray-900">
                                                            {o.steel_grade.standard_steel}
                                                        </span>
                                                        <span className="ml-1 text-gray-500">
                                                            ({o.steel_grade.internal_code})
                                                        </span>
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </Td>
                                            <Td>{o.plate_thickness_mm ?? '—'}</Td>
                                            <Td>{o.width_mm ?? '—'}</Td>
                                            <Td>{o.length_mm ?? '—'}</Td>
                                            <Td>{o.quantity}</Td>
                                            <Td>{Number(o.weight_tons).toFixed(2)}</Td>
                                            <Td>
                                                <StatusBadge status={o.status} />
                                            </Td>
                                            <Td>{o.delivery_date ?? '—'}</Td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                                            暂无订单数据
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 分页 */}
                <div className="mt-6">
                    <Pagination currentPage={currentPage} totalPages={totalPages} />
                </div>
            </main>
        </div>
    )
}

// 抽出表头/单元格小组件，复用且好看
function Th({ children }: { children: React.ReactNode }) {
    return (
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
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
        <td className={`px-4 py-3 text-sm text-gray-700 whitespace-nowrap ${className}`}>
            {children}
        </td>
    )
}

// 订单状态徽章
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; className: string }> = {
        pending: { label: '待处理', className: 'bg-gray-100 text-gray-700' },
        imported: { label: '已导入', className: 'bg-blue-100 text-blue-700' },
        in_progress: { label: '处理中', className: 'bg-yellow-100 text-yellow-700' },
        completed: { label: '完成', className: 'bg-green-100 text-green-700' },
        cancelled: { label: '取消', className: 'bg-red-100 text-red-700' },
    }
    const conf = map[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' }
    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${conf.className}`}
        >
            {conf.label}
        </span>
    )
}

// 把字符串安全地转成数字，空字符串/NaN 返回 undefined
function parseNumberOrUndefined(value: string | undefined): number | undefined {
    if (!value) return undefined
    const n = Number(value)
    return Number.isFinite(n) ? n : undefined
}