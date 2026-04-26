import LoginPageClient from './page-client'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const params = await searchParams

  return <LoginPageClient next={params.next || '/orders'} />
}
