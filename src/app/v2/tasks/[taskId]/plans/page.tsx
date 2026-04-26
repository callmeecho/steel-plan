import { redirect } from 'next/navigation'

export default async function V2TaskPlansRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ taskId: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { taskId } = await params
  const { tab = 'results' } = await searchParams

  redirect(`/v2/plans?taskId=${taskId}&tab=${tab}`)
}
