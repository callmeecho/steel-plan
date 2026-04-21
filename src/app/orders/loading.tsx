// Next.js 约定文件：当 /orders 页面的异步查询在等数据时
// 浏览器会立即显示这个组件，数据好了自动切换成真实页面
// 底层用 React Suspense 实现

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航骨架 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="h-6 w-28 bg-gray-200 rounded animate-pulse" />
            <div className="flex items-center gap-4">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 标题骨架 */}
        <div className="mb-6 space-y-2">
          <div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* 筛选栏骨架 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SkeletonField />
            <SkeletonField />
            <SkeletonField />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <SkeletonField />
            <SkeletonField />
            <SkeletonField />
          </div>
        </div>

        {/* 表格骨架 */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="divide-y divide-gray-200">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-4 py-3 flex gap-4">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div
                    key={j}
                    className="h-4 bg-gray-100 rounded flex-1 animate-pulse"
                    style={{ animationDelay: `${(i + j) * 50}ms` }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* 顶部浮动加载指示器 */}
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white rounded-full shadow-lg border border-gray-200 px-4 py-2 flex items-center gap-2">
            <Spinner />
            <span className="text-sm text-gray-600">加载中</span>
          </div>
        </div>
      </main>
    </div>
  )
}

// 单个输入框骨架
function SkeletonField() {
  return (
    <div className="space-y-1">
      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
      <div className="h-10 bg-gray-100 rounded animate-pulse" />
    </div>
  )
}

// 转圈加载图标 (纯 SVG, 零依赖)
function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-blue-600"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}