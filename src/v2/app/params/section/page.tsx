import { Topbar } from '../../../components/layout/Topbar'
import { SectionRulesManager } from '../../../components/params/SectionRulesManager'
import { loadV2SectionRows } from '../../../lib/server-data'

export default async function SectionPage() {
  const data = await loadV2SectionRows()

  return (
    <>
      <Topbar crumb="参数设置" sub="断面类型" />
      <SectionRulesManager rows={data} />
    </>
  )
}
