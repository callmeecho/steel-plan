type TopbarProps = {
  crumb?: string
  sub?: string
  breadcrumb?: string
  title?: string
  description?: string
}

export function Topbar({ crumb, sub, breadcrumb, title, description }: TopbarProps) {
  if (title || description || breadcrumb) {
    return (
      <div className="rounded-[28px] border border-edge bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm text-ink-tertiary">{breadcrumb || crumb}</p>
            {title ? (
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">{title}</h1>
            ) : null}
            {description ? (
              <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-secondary">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  return (
    <header className="flex h-12 items-center border-b border-edge bg-white px-5 text-[12px]">
      <div className="flex items-center gap-2">
        <span className="text-ink-tertiary">热轧一厂</span>
        <span className="text-ink-tertiary">/</span>
        <span className="text-ink-tertiary">{crumb}</span>
        {sub ? (
          <>
            <span className="text-ink-tertiary">/</span>
            <span className="font-medium text-ink">{sub}</span>
          </>
        ) : null}
      </div>
      <div className="ml-auto">
        <span className="font-mono text-ink-tertiary">2026-04-26 09:12</span>
      </div>
    </header>
  )
}
