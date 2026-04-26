'use server'

import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const displayName = formData.get('displayName') as string

  if (!displayName?.trim()) {
    return { error: '请先填写姓名。' }
  }
  if (!email || !password) {
    return { error: '邮箱和密码不能为空。' }
  }
  if (password.length < 6) {
    return { error: '密码长度至少 6 位。' }
  }

  const supabase = await createClient()
  const safeDisplayName = displayName.trim()

  const {
    data: { user },
    error,
  } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: safeDisplayName,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (user) {
    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        display_name: safeDisplayName,
        role: 'viewer',
      },
      { onConflict: 'id' }
    )

    if (profileError) {
      return { error: profileError.message }
    }
  }

  redirect('/')
}
