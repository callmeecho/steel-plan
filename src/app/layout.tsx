import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '中板组坯决策平台',
  description: '基于 Next.js 与 Supabase 的中板排产与组坯优化平台。',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
