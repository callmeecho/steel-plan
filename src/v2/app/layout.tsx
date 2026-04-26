import type { Metadata } from 'next'

import './globals.css'

export const metadata: Metadata = {
  title: '中板组坯优化平台',
  description: '面向中厚板排产与组坯优化的工业决策平台。',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
