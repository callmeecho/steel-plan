import { Topbar } from '../../../components/layout/Topbar'
import { ThicknessRulesManager } from '../../../components/params/ThicknessRulesManager'
import { loadV2ThicknessRules } from '../../../lib/server-data'

export default async function ThicknessPage() {
  const data = await loadV2ThicknessRules()

  return (
    <>
      <Topbar crumb="参数设置" sub="厚度筛选标准" />
      <ThicknessRulesManager rows={data} />
    </>
  )
}
