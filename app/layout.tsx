import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PocketProf AI',
  description: '24/7 Offline Academic Companion',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
