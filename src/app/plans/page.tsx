import V2PlansPage from '@v2/app/plans/page'

export default function PlansPage(props: {
  searchParams: Promise<{ taskId?: string; tab?: string }>
}) {
  return <V2PlansPage {...props} />
}
