'use client'

import { usePathname, useRouter } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  const items = [
    { label: 'Início', path: '/dashboard', icon: '🏠' },
    { label: 'Lançamentos', path: '/lancamentos', icon: '📋' },
    { label: 'DAS', path: '/das', icon: '📄' },
    { label: 'Simulador', path: '/simulador', icon: '🧮' },
  ]

  // Não mostra o menu em login, onboarding e página inicial
  if (pathname === '/login' || pathname === '/onboarding' || pathname === '/') {
    return null
  }

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'white',
      borderTop: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '8px 0 calc(8px + env(safe-area-inset-bottom))',
      zIndex: 50,
    }}>
      {items.map((item) => {
        const isActive = pathname === item.path
        return (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              cursor: 'pointer',
              padding: '6px 12px',
              color: isActive ? '#2563eb' : '#6b7280',
              fontSize: '12px',
              fontWeight: isActive ? '600' : '400',
            }}
          >
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}