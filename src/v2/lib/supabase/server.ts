import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 服务端组件使用的 Supabase 客户端
// 能读取 Next.js 的 cookie，获取用户会话
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // 在 Server Component 里调用 set 会报错
            // 如果你有中间件在刷新 session，这里可以忽略
          }
        },
      },
    }
  )
}