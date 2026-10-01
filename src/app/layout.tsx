import type { Metadata } from 'next'
import BottomNav from '@/components/BottomNav'

export const metadata: Metadata = {
  title: 'Painel MEI',
  description: 'Controle o limite de faturamento do seu MEI, DAS e obrigações de forma simples.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {children}
        <BottomNav />
      </body>
    </html>
  )
}