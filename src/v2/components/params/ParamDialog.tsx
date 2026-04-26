'use client'

import type { ReactNode } from 'react'

import { Btn } from '../ui/primitives'

export function ParamDialog({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-edge bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-edge px-5 py-4">
          <h2 className="text-[16px] font-semibold text-ink">{title}</h2>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function ParamField({
  label,
  name,
  defaultValue,
  required = true,
  type = 'number',
  step,
}: {
  label: string
  name: string
  defaultValue?: string | number
  required?: boolean
  type?: string
  step?: string
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12px] font-medium text-ink-secondary">{label}</span>
      <input
        name={name}
        type={type}
        step={step}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-edge-strong px-3 py-2 text-[13px] text-ink outline-none transition focus:border-accent"
      />
    </label>
  )
}

export function ParamDialogActions({
  loading,
  onClose,
  submitLabel,
}: {
  loading: boolean
  onClose: () => void
  submitLabel: string
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Btn type="button" onClick={onClose} disabled={loading}>
        取消
      </Btn>
      <Btn type="submit" variant="primary" disabled={loading}>
        {loading ? '提交中...' : submitLabel}
      </Btn>
    </div>
  )
}
