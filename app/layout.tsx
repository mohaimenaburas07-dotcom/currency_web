import type { Metadata } from 'next'
import { Almarai } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const almarai = Almarai({ 
  subsets: ["arabic"],
  weight: ["300", "400", "700", "800"],
  variable: "--font-almarai"
})

export const metadata: Metadata = {
  title: 'مصرف الواحة | لوحة التحكم',
  description: 'نظام إدارة عمليات الصرف - مصرف الواحة ليبيا',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" className="bg-background" suppressHydrationWarning>
      <body className={`${almarai.className} font-sans antialiased`} suppressHydrationWarning>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
