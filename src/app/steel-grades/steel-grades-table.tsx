'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { SteelGrade } from '@/lib/database.types'
import { GradeFormDialog } from './grade-form-dialog'
import { DeleteGradeButton } from './delete-grade-button'

interface Props {
  steelGrades: SteelGrade[]
  isAdmin: boolean
  view: 'active' | 'archived'
}

export function SteelGradesTable({ steelGrades, isAdmin, view }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGrade, setEditingGrade] = useState<SteelGrade | null>(null)

  const isArchivedView = view === 'archived'

  function openCreateDialog() {
    setEditingGrade(null)
    setDialogOpen(true)
  }

  function openEditDialog(grade: SteelGrade) {
    setEditingGrade(grade)
    setDialogOpen(true)
  }

  return (
    <>
      {isAdmin && !isArchivedView && (
        <div className="mb-4 flex justify-end">
          <Button onClick={openCreateDialog}>+ 新增钢种</Button>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                国标钢种
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                内部代码
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                描述
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {isArchivedView ? '归档时间' : '创建时间'}
              </th>
              {isAdmin && (
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {steelGrades.length === 0 ? (
              <tr>
                <td
                  colSpan={isAdmin ? 5 : 4}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {isArchivedView ? '暂无已归档钢种' : '暂无钢种数据'}
                </td>
              </tr>
            ) : (
              steelGrades.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {g.standard_steel}
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-mono">
                    {g.internal_code}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-md truncate">
                    {g.description || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(
                      (isArchivedView ? g.archived_at : g.created_at) || ''
                    ).toLocaleDateString('zh-CN')}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {!isArchivedView && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(g)}
                          >
                            编辑
                          </Button>
                        )}
                        <DeleteGradeButton
                          gradeId={g.id}
                          gradeName={g.standard_steel}
                          isArchived={isArchivedView}
                        />
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <GradeFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        grade={editingGrade}
      />
    </>
  )
}