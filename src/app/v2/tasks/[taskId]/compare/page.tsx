import { redirect } from 'next/navigation'

export default async function V2TaskCompareRedirectPage({
  params,
}: {
  params: Promise<{ taskId: string }>
}) {
  const { taskId } = await params

  redirect(`/v2/plans?taskId=${taskId}&tab=results`)
}
