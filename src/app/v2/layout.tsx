import '../../v2/app/globals.css'
import { Sidebar } from '@v2/components/layout/Sidebar'
import { getLatestTaskSnapshot } from '@v2/lib/task-snapshot-store'
import { createClient } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'

function getUserInitials(name: string) {
  const trimmed = name.trim()
  if (!trimmed) {
    return 'U'
  }

  const parts = trimmed
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  const lettersOnly = trimmed.replace(/\s+/g, '')
  return lettersOnly.slice(0, 2).toUpperCase()
}

export default async function V2Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/orders')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle()

  const userName =
    profile?.display_name || user.user_metadata?.display_name || user.email || 'User'
  const userInitials = getUserInitials(userName)
  const latestTask = await getLatestTaskSnapshot()

  return (
    <div className="min-h-screen bg-[#f3f6fb] text-ink">
      <div className="grid min-h-screen grid-cols-[272px_1fr]">
        <Sidebar
          userName={userName}
          userInitials={userInitials}
          latestTaskId={latestTask?.id ?? null}
        />
        <main className="flex min-w-0 flex-col">{children}</main>
      </div>
    </div>
  )
}
