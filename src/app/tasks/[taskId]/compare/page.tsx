import { redirect } from 'next/navigation'

export default async function TaskCompareRedirectPage({
  params,
}: {
  params: Promise<{ taskId: string }>
}) {
  const { taskId } = await params
  redirect(`/plans?taskId=${taskId}&tab=results`)
}
