'use client'

import { Download, Plus, Upload } from 'lucide-react'

import { Btn } from '../ui/primitives'

type RulePageActionsProps = {
  createLabel: string
  importLabel: string
  exportLabel?: string
  showImport?: boolean
  showExport?: boolean
  onCreate?: () => void
  onImport?: () => void
  onExport?: () => void
}

export function RulePageActions({
  createLabel,
  importLabel,
  exportLabel,
  showImport = true,
  showExport = true,
  onCreate,
  onImport,
  onExport,
}: RulePageActionsProps) {
  function notify(text: string) {
    window.alert(text)
  }

  return (
    <div className="flex items-center gap-2">
      {showImport ? (
        <Btn
          size="sm"
          onClick={() => {
            if (onImport) {
              onImport()
              return
            }
            notify(`${importLabel}功能待接入`)
          }}
        >
          <Upload className="h-3 w-3" /> {importLabel}
        </Btn>
      ) : null}

      {showExport && exportLabel ? (
        <Btn
          size="sm"
          onClick={() => {
            if (onExport) {
              onExport()
              return
            }
            notify(`${exportLabel}功能待接入`)
          }}
        >
          <Download className="h-3 w-3" /> {exportLabel}
        </Btn>
      ) : null}

      <Btn
        variant="primary"
        size="sm"
        onClick={() => {
          if (onCreate) {
            onCreate()
            return
          }
          notify(`${createLabel}功能待接入`)
        }}
      >
        <Plus className="h-3 w-3" /> {createLabel}
      </Btn>
    </div>
  )
}
