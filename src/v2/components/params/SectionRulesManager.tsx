'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import type { V2SectionRow } from '../../lib/server-data'
import {
  applySectionSelections,
  createSectionRule,
  deleteSectionRule,
  updateSectionRule,
} from '../../app/params/actions'
import { Switch } from '../ui/primitives'
import { ParamDialog, ParamDialogActions, ParamField } from './ParamDialog'
import { RulePageActions } from './RulePageActions'

export function SectionRulesManager({ rows }: { rows: V2SectionRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<V2SectionRow | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const sortedRows = useMemo(() => [...rows].sort((a, b) => a.id - b.id), [rows])
  const [draftSelected, setDraftSelected] = useState<Set<number>>(new Set())

  useEffect(() => {
    setDraftSelected(new Set(sortedRows.filter((row) => row.enabled).map((row) => row.id)))
  }, [sortedRows])

  const selectedCount = draftSelected.size

  function handleCreate(formData: FormData) {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await createSectionRule(formData)
      if ('error' in result && typeof result.error === 'string') {
        setError(result.error)
        return
      }
      setCreateOpen(false)
      router.refresh()
    })
  }

  function handleUpdate(formData: FormData) {
    if (!editing) return

    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await updateSectionRule(editing.id, formData)
      if ('error' in result && typeof result.error === 'string') {
        setError(result.error)
        return
      }
      setEditing(null)
      router.refresh()
    })
  }

  function handleDelete(id: number) {
    if (!confirm('确认删除这条断面类型吗？')) return

    setSuccess(null)
    startTransition(async () => {
      const result = await deleteSectionRule(id)
      if ('error' in result && typeof result.error === 'string') {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  function handleDraftToggle(id: number, enabled: boolean) {
    setSuccess(null)
    setDraftSelected((prev) => {
      const next = new Set(prev)
      if (enabled) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function handleImportSelected() {
    setError(null)
    setSuccess(null)
    const selectedIds = [...draftSelected]

    startTransition(async () => {
      const result = await applySectionSelections(selectedIds)
      if ('error' in result && typeof result.error === 'string') {
        setError(result.error)
        return
      }
      const appliedCount = 'appliedCount' in result ? result.appliedCount : selectedIds.length
      setSuccess(`选择已保存（共 ${appliedCount} 条断面）`)
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-edge bg-white px-[18px] pt-3 pb-2.5">
        <div className="text-[16px] font-semibold">断面类型</div>
        <RulePageActions
          createLabel="新增断面"
          importLabel="保存选择"
          showExport={false}
          onImport={handleImportSelected}
          onCreate={() => {
            setError(null)
            setSuccess(null)
            setCreateOpen(true)
          }}
        />
      </div>

      {success ? (
        <div className="mx-[18px] mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="px-[18px] pb-2 pt-3 text-[12px] text-ink-secondary">
        已选 {selectedCount} 条数据
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-[12px] tabular-nums">
          <thead className="bg-surface-subtle text-left text-[11px] text-ink-tertiary">
            <tr className="h-9">
              <th className="pl-3.5">选中</th>
              <th>编号</th>
              <th>厚度 (mm)</th>
              <th>宽度 (mm)</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sortedRows.length > 0 ? (
              sortedRows.map((item) => {
                const checked = draftSelected.has(item.id)
                return (
                  <tr key={`section-${item.id}`} className="h-9 border-t border-edge hover:bg-surface-hover">
                    <td className="pl-3.5">
                      <Switch on={checked} onClick={() => handleDraftToggle(item.id, !checked)} />
                    </td>
                    <td className="font-mono">{item.id}</td>
                    <td className="font-semibold">{item.thickness ?? '-'}</td>
                    <td>{item.width ?? '-'}</td>
                    <td className="pr-4 text-right">
                      <button
                        className="mr-3 text-ink-tertiary hover:text-accent"
                        onClick={() => {
                          setError(null)
                          setSuccess(null)
                          setEditing(item)
                        }}
                      >
                        <Pencil className="inline h-3 w-3" />
                      </button>
                      <button className="text-ink-tertiary hover:text-danger" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="inline h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-[12px] text-ink-tertiary">
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ParamDialog open={createOpen} title="新增断面" onClose={() => setCreateOpen(false)}>
        <form action={handleCreate} className="space-y-4">
          <ParamField label="厚度 (mm)" name="thickness" />
          <ParamField label="宽度 (mm)" name="width" />
          <label className="flex items-center gap-2 text-[12px] text-ink-secondary">
            <input name="enabled" type="checkbox" defaultChecked />
            启用当前断面
          </label>
          {error ? (
            <div className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-[12px] text-danger">
              {error}
            </div>
          ) : null}
          <ParamDialogActions loading={isPending} onClose={() => setCreateOpen(false)} submitLabel="创建断面" />
        </form>
      </ParamDialog>

      <ParamDialog open={Boolean(editing)} title="编辑断面" onClose={() => setEditing(null)}>
        <form action={handleUpdate} className="space-y-4">
          <ParamField label="厚度 (mm)" name="thickness" defaultValue={editing?.thickness ?? ''} />
          <ParamField label="宽度 (mm)" name="width" defaultValue={editing?.width ?? ''} />
          <label className="flex items-center gap-2 text-[12px] text-ink-secondary">
            <input name="enabled" type="checkbox" defaultChecked={editing?.enabled ?? false} />
            启用当前断面
          </label>
          {error ? (
            <div className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-[12px] text-danger">
              {error}
            </div>
          ) : null}
          <ParamDialogActions loading={isPending} onClose={() => setEditing(null)} submitLabel="保存修改" />
        </form>
      </ParamDialog>
    </>
  )
}
