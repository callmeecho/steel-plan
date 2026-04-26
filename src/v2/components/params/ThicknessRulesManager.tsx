'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import type { V2ThicknessRuleRow } from '../../lib/server-data'
import {
  createThicknessRule,
  deleteThicknessRule,
  updateThicknessRule,
} from '../../app/params/actions'
import { ParamDialog, ParamDialogActions, ParamField } from './ParamDialog'
import { RulePageActions } from './RulePageActions'

export function ThicknessRulesManager({ rows }: { rows: V2ThicknessRuleRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<V2ThicknessRuleRow | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sortedRows = useMemo(() => [...rows].sort((a, b) => a.id - b.id), [rows])

  function handleCreate(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createThicknessRule(formData)
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
    startTransition(async () => {
      const result = await updateThicknessRule(editing.id, formData)
      if ('error' in result && typeof result.error === 'string') {
        setError(result.error)
        return
      }
      setEditing(null)
      router.refresh()
    })
  }

  function handleDelete(id: number) {
    if (!confirm('确认删除这条厚度规则吗？')) return

    startTransition(async () => {
      const result = await deleteThicknessRule(id)
      if ('error' in result && typeof result.error === 'string') {
        alert(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-edge bg-white px-[18px] pt-3 pb-2.5">
        <div className="text-[16px] font-semibold">厚度筛选标准</div>
        <RulePageActions
          createLabel="新增规则"
          importLabel="导入厚度规则"
          exportLabel="导出厚度规则"
          onCreate={() => {
            setError(null)
            setCreateOpen(true)
          }}
        />
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-[12px] tabular-nums">
          <thead className="bg-surface-subtle text-left text-[11px] text-ink-tertiary">
            <tr className="h-9">
              <th className="pl-3.5">序号</th>
              <th>钢板厚度下限</th>
              <th>钢板厚度上限</th>
              <th>板坯厚度下限</th>
              <th>板坯厚度上限</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sortedRows.length > 0 ? (
              sortedRows.map((item) => (
                <tr key={`thickness-${item.id}`} className="h-9 border-t border-edge hover:bg-surface-hover">
                  <td className="pl-3.5 font-mono">{item.id}</td>
                  <td>{item.plateMin ?? '-'}</td>
                  <td>{item.plateMax ?? '-'}</td>
                  <td>{item.slabMin ?? '-'}</td>
                  <td>{item.slabMax ?? '-'}</td>
                  <td className="pr-4 text-right">
                    <button
                      className="mr-3 text-ink-tertiary hover:text-accent"
                      onClick={() => {
                        setError(null)
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
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-[12px] text-ink-tertiary">
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ParamDialog open={createOpen} title="新增厚度规则" onClose={() => setCreateOpen(false)}>
        <form action={handleCreate} className="space-y-4">
          <ParamField label="钢板厚度下限" name="plateMin" step="0.01" />
          <ParamField label="钢板厚度上限" name="plateMax" step="0.01" />
          <ParamField label="板坯厚度下限" name="slabMin" step="0.01" />
          <ParamField label="板坯厚度上限" name="slabMax" step="0.01" />
          {error ? <div className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-[12px] text-danger">{error}</div> : null}
          <ParamDialogActions loading={isPending} onClose={() => setCreateOpen(false)} submitLabel="创建规则" />
        </form>
      </ParamDialog>

      <ParamDialog open={Boolean(editing)} title="编辑厚度规则" onClose={() => setEditing(null)}>
        <form action={handleUpdate} className="space-y-4">
          <ParamField label="钢板厚度下限" name="plateMin" step="0.01" defaultValue={editing?.plateMin ?? ''} />
          <ParamField label="钢板厚度上限" name="plateMax" step="0.01" defaultValue={editing?.plateMax ?? ''} />
          <ParamField label="板坯厚度下限" name="slabMin" step="0.01" defaultValue={editing?.slabMin ?? ''} />
          <ParamField label="板坯厚度上限" name="slabMax" step="0.01" defaultValue={editing?.slabMax ?? ''} />
          {error ? <div className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-[12px] text-danger">{error}</div> : null}
          <ParamDialogActions loading={isPending} onClose={() => setEditing(null)} submitLabel="保存修改" />
        </form>
      </ParamDialog>
    </>
  )
}
