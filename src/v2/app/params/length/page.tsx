import { Topbar } from '../../../components/layout/Topbar'
import { LengthRulesManager } from '../../../components/params/LengthRulesManager'
import { loadV2LengthRules } from '../../../lib/server-data'

export default async function LengthPage() {
  const rows = await loadV2LengthRules()

  return (
    <>
      <Topbar crumb="参数设置" sub="板坯长度标准" />
      <LengthRulesManager rows={rows} />
    </>
  )
}
