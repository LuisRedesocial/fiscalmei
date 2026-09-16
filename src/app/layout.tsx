import type { Metadata } from 'next'
import BottomNav from '@/components/BottomNav'

export const metadata: Metadata = {
  title: 'FiscalMEI',
  description: 'Controle o limite do MEI e evite multas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        {children}
        <BottomNav />
      </body>
    </html>
  )
}