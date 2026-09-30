'use client'

import { usePathname, useRouter } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  // Não mostra o menu nas páginas de login e onboarding
  if (pathname === '/login' || pathname === '/onboarding' || pathname === '/') {
    return null
  }

  const items = [
    { label: 'Início', path: '/dashboard', icon: '🏠' },
    { label: 'Lançamentos', path: '/lancamentos', icon: '📋' },
    { label: 'DAS', path: '/das', icon: '📄' },
    { label: 'Guia MEI', path: '/guias', icon: '📚' },
    { label: 'Simulador', path: '/simulador', icon: '🧮' },
  ]

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
      padding: '8px 0',
      zIndex: 50,
      boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
    }}>
      {items.map((item) => {
        const isActive = pathname === item.path
        return (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 8px',
              color: isActive ? '#2563eb' : '#6b7280',
              fontSize: '11px',
              fontWeight: isActive ? '600' : '400',
              minWidth: '60px'
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