'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import type { SteelGrade } from '@/lib/database.types'

import { DeleteGradeButton } from './delete-grade-button'
import { GradeFormDialog } from './grade-form-dialog'

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

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                标准钢种
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                内部编码
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                描述
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {isArchivedView ? '归档时间' : '创建时间'}
              </th>
              {isAdmin && (
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
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
                  {isArchivedView ? '当前没有归档钢种。' : '当前没有在用钢种。'}
                </td>
              </tr>
            ) : (
              steelGrades.map((grade) => (
                <tr key={grade.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {grade.standard_steel}
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-600">
                    {grade.internal_code}
                  </td>
                  <td className="max-w-md truncate px-4 py-3 text-gray-600">
                    {grade.description || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(
                      (isArchivedView ? grade.archived_at : grade.created_at) || ''
                    ).toLocaleDateString('zh-CN')}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {!isArchivedView && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(grade)}
                          >
                            编辑
                          </Button>
                        )}
                        <DeleteGradeButton
                          gradeId={grade.id}
                          gradeName={grade.standard_steel}
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
