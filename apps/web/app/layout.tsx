import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Agency Platform',
  description: 'AI-Powered Software Development Agency Platform',
}

const themeScript = `
(function () {
  try {
    var pref = localStorage.getItem('theme-preference') || 'system';
    var dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
  } catch {}
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
