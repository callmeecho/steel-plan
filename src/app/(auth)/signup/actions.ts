'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Server Action：在服务器上执行的函数
// 表单提交时直接调用，不用写 API 路由
export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const displayName = formData.get('displayName') as string

  // 基础校验
  if (!email || !password) {
    return { error: '邮箱和密码必填' }
  }
  if (password.length < 6) {
    return { error: '密码至少 6 位' }
  }

  const supabase = await createClient()

  // 调用 Supabase Auth 注册
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || email.split('@')[0],
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // 注册成功 (因为关了邮箱验证，直接登录态)
  redirect('/')
}