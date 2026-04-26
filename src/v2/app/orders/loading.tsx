export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="h-6 w-28 animate-pulse rounded bg-gray-200" />
            <div className="flex items-center gap-4">
              <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 space-y-2">
          <div className="h-7 w-32 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
        </div>

        <div className="mb-6 space-y-4 rounded-lg border border-gray-200 bg-white p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SkeletonField />
            <SkeletonField />
            <SkeletonField />
          </div>
          <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 md:grid-cols-3">
            <SkeletonField />
            <SkeletonField />
            <SkeletonField />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <div className="h-4 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="divide-y divide-gray-200">
            {Array.from({ length: 8 }).map((_, rowIndex) => (
              <div key={rowIndex} className="flex gap-4 px-4 py-3">
                {Array.from({ length: 6 }).map((_, colIndex) => (
                  <div
                    key={colIndex}
                    className="h-4 flex-1 animate-pulse rounded bg-gray-100"
                    style={{ animationDelay: `${(rowIndex + colIndex) * 50}ms` }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="fixed right-4 top-4 z-50">
          <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-lg">
            <Spinner />
            <span className="text-sm text-gray-600">加载中...</span>
          </div>
        </div>
      </main>
    </div>
  )
}

function SkeletonField() {
  return (
    <div className="space-y-1">
      <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
      <div className="h-10 animate-pulse rounded bg-gray-100" />
    </div>
  )
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-blue-600"
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
