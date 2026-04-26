'use client'

import { CircleHelp } from 'lucide-react'

export function HintTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex cursor-help text-ink-tertiary">
      <CircleHelp className="h-3.5 w-3.5" />
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-64 -translate-x-1/2 rounded-md border border-edge bg-white px-3 py-2 text-[11px] font-normal leading-5 text-ink shadow-lg group-hover:block">
        {text}
      </span>
    </span>
  )
}
