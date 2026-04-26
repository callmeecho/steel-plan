'use client'

import { Download, Plus, Upload } from 'lucide-react'

import { Btn } from '../ui/primitives'

type RulePageActionsProps = {
  createLabel: string
  importLabel: string
  exportLabel: string
  onCreate?: () => void
}

export function RulePageActions({
  createLabel,
  importLabel,
  exportLabel,
  onCreate,
}: RulePageActionsProps) {
  function notify(text: string) {
    window.alert(text)
  }

  return (
    <div className="flex items-center gap-2">
      <Btn size="sm" onClick={() => notify(`${importLabel}功能待接入`)}>
        <Upload className="h-3 w-3" /> {importLabel}
      </Btn>
      <Btn size="sm" onClick={() => notify(`${exportLabel}功能待接入`)}>
        <Download className="h-3 w-3" /> {exportLabel}
      </Btn>
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
