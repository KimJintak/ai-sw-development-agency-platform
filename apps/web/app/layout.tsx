import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Agency Platform',
  description: 'AI-Powered Software Development Agency Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
