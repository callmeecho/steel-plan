import { redirect } from 'next/navigation'

export default async function LegacyTaskPlansRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ taskId: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { taskId } = await params
  const { tab = 'results' } = await searchParams
  redirect(`/plans?taskId=${taskId}&tab=${tab}`)
}
