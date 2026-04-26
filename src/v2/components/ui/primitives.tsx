'use client'

import { Check } from 'lucide-react'

import type { OrderStatus, Priority } from '../../types/domain'

export function Checkbox({
  state,
  onClick,
}: {
  state: 'checked' | 'indeterminate' | ''
  onClick?: () => void
}) {
  return (
    <div
      onClick={(event) => {
        event.stopPropagation()
        onClick?.()
      }}
      className={`grid h-[14px] w-[14px] cursor-pointer place-items-center rounded-[3px] border transition ${
        state === 'checked' || state === 'indeterminate'
          ? 'border-accent bg-accent'
          : 'border-edge-strong bg-white hover:border-accent'
      }`}
    >
      {state === 'checked' ? <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} /> : null}
      {state === 'indeterminate' ? <div className="h-0.5 w-1.5 bg-white" /> : null}
    </div>
  )
}

export function PriorityBadge({ p }: { p: Priority }) {
  const map: Record<Priority, string> = {
    急: 'border-danger/30 bg-danger/10 text-danger',
    高: 'border-warning/30 bg-warning/10 text-warning',
    中: 'border-edge bg-surface-subtle text-ink-secondary',
    低: 'border-edge bg-surface-subtle text-ink-tertiary',
  }

  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-px text-[10.5px] ${map[p]}`}>
      {p}
    </span>
  )
}

export function StatusBadge({ s }: { s: OrderStatus }) {
  const map: Record<OrderStatus, string> = {
    未排: 'border-edge bg-surface-subtle text-ink-secondary',
    部分已排: 'border-warning/30 bg-warning/10 text-warning',
    审核中: 'border-accent-border bg-accent-soft text-accent',
    已排: 'border-success/30 bg-success/10 text-success',
  }

  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-px text-[10.5px] ${map[s]}`}>
      {s}
    </span>
  )
}

export function Switch({
  on,
  onClick,
}: {
  on: boolean
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`h-[18px] w-8 cursor-pointer rounded-full p-0.5 transition ${
        on ? 'bg-accent' : 'bg-edge-strong'
      }`}
    >
      <div
        className={`h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-[14px]' : ''
        }`}
      />
    </div>
  )
}

export function Btn({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary' | 'success' | 'ghost'
  size?: 'sm' | 'md'
}) {
  const variantClass = {
    default: 'border-edge-strong bg-white text-ink hover:bg-surface-hover',
    primary: 'border-accent bg-accent text-white hover:bg-accent-hover',
    success: 'border-success bg-success text-white hover:opacity-90',
    ghost: 'border-transparent bg-transparent text-ink-secondary hover:bg-surface-hover',
  }[variant]

  const sizeClass = size === 'sm' ? 'px-2.5 py-1 text-[11.5px]' : 'px-3 py-1.5 text-[12px]'

  return (
    <button
      {...props}
      className={`inline-flex items-center gap-1.5 rounded border font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClass} ${sizeClass} ${className}`}
    >
      {children}
    </button>
  )
}
