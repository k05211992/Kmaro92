import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BizClass Alerts — Smart business class deal notifications',
  description:
    'Set up alerts for business class flights. Get notified when prices drop or hit your budget.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
