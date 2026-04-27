'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import type { V2LengthRuleRow } from '../../lib/server-data'
import {
  createLengthRule,
  deleteLengthRule,
  updateLengthRule,
} from '../../app/params/actions'
import { ParamDialog, ParamDialogActions, ParamField } from './ParamDialog'
import { RulePageActions } from './RulePageActions'

function formatValue(value: number | null) {
  return value === null ? '-' : value
}

export function LengthRulesManager({ rows }: { rows: V2LengthRuleRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<V2LengthRuleRow | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sortedRows = useMemo(() => [...rows].sort((a, b) => a.id - b.id), [rows])

  function handleCreate(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createLengthRule(formData)
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
      const result = await updateLengthRule(editing.id, formData)
      if ('error' in result && typeof result.error === 'string') {
        setError(result.error)
        return
      }
      setEditing(null)
      router.refresh()
    })
  }

  function handleDelete(id: number) {
    if (!confirm('确认删除这条板坯长度标准吗？')) return

    startTransition(async () => {
      const result = await deleteLengthRule(id)
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
        <div className="text-[16px] font-semibold">板坯长度标准</div>
        <RulePageActions
          createLabel="新增标准"
          importLabel="导入长度规则"
          exportLabel="导出长度规则"
          showImport={false}
          showExport={false}
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
              <th>标准板坯长度下限</th>
              <th>标准板坯长度上限</th>
              <th>全纵板坯长度下限</th>
              <th>全纵板坯长度上限</th>
              <th>长坏料长度下限</th>
              <th>长坏料长度上限</th>
              <th>板坯厚度下限</th>
              <th>板坯厚度上限</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sortedRows.length > 0 ? (
              sortedRows.map((item) => (
                <tr key={`length-${item.id}`} className="h-9 border-t border-edge hover:bg-surface-hover">
                  <td className="pl-3.5 font-mono">{item.id}</td>
                  <td>{formatValue(item.standardMin)}</td>
                  <td>{formatValue(item.standardMax)}</td>
                  <td>{formatValue(item.fullMin)}</td>
                  <td>{formatValue(item.fullMax)}</td>
                  <td>{formatValue(item.shortMin)}</td>
                  <td>{formatValue(item.shortMax)}</td>
                  <td>{formatValue(item.slabThicknessMin)}</td>
                  <td>{formatValue(item.slabThicknessMax)}</td>
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
                <td colSpan={10} className="px-6 py-16 text-center text-[12px] text-ink-tertiary">
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ParamDialog open={createOpen} title="新增板坯长度标准" onClose={() => setCreateOpen(false)}>
        <form action={handleCreate} className="grid grid-cols-2 gap-4">
          <ParamField label="标准板坯长度下限" name="standardMin" />
          <ParamField label="标准板坯长度上限" name="standardMax" />
          <ParamField label="全纵板坯长度下限" name="fullMin" />
          <ParamField label="全纵板坯长度上限" name="fullMax" />
          <ParamField label="长坏料长度下限" name="shortMin" />
          <ParamField label="长坏料长度上限" name="shortMax" />
          <ParamField label="板坯厚度下限" name="slabThicknessMin" />
          <ParamField label="板坯厚度上限" name="slabThicknessMax" />
          <div className="col-span-2">
            {error ? (
              <div className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-[12px] text-danger">
                {error}
              </div>
            ) : null}
          </div>
          <div className="col-span-2">
            <ParamDialogActions loading={isPending} onClose={() => setCreateOpen(false)} submitLabel="创建标准" />
          </div>
        </form>
      </ParamDialog>

      <ParamDialog open={Boolean(editing)} title="编辑板坯长度标准" onClose={() => setEditing(null)}>
        <form action={handleUpdate} className="grid grid-cols-2 gap-4">
          <ParamField label="标准板坯长度下限" name="standardMin" defaultValue={editing?.standardMin ?? ''} />
          <ParamField label="标准板坯长度上限" name="standardMax" defaultValue={editing?.standardMax ?? ''} />
          <ParamField label="全纵板坯长度下限" name="fullMin" defaultValue={editing?.fullMin ?? ''} />
          <ParamField label="全纵板坯长度上限" name="fullMax" defaultValue={editing?.fullMax ?? ''} />
          <ParamField label="长坏料长度下限" name="shortMin" defaultValue={editing?.shortMin ?? ''} />
          <ParamField label="长坏料长度上限" name="shortMax" defaultValue={editing?.shortMax ?? ''} />
          <ParamField
            label="板坯厚度下限"
            name="slabThicknessMin"
            defaultValue={editing?.slabThicknessMin ?? ''}
          />
          <ParamField
            label="板坯厚度上限"
            name="slabThicknessMax"
            defaultValue={editing?.slabThicknessMax ?? ''}
          />
          <div className="col-span-2">
            {error ? (
              <div className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-[12px] text-danger">
                {error}
              </div>
            ) : null}
          </div>
          <div className="col-span-2">
            <ParamDialogActions loading={isPending} onClose={() => setEditing(null)} submitLabel="保存修改" />
          </div>
        </form>
      </ParamDialog>
    </>
  )
}

