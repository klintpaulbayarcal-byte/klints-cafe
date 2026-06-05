import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "Klint's Cafe",
  description: "Premium coffee and light meals crafted with care. Order fresh, enjoy every moment.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
