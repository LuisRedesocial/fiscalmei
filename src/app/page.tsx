'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Verifica se já fez o onboarding
        const { data: company } = await supabase
          .from('companies')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (company) {
          router.replace('/dashboard')
        } else {
          router.replace('/onboarding')
        }
      } else {
        router.replace('/login')
      }
    }

    checkUser()
  }, [])

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#f3f4f6'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ 
          width: '48px', 
          height: '48px', 
          background: '#2563eb', 
          borderRadius: '12px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '20px' }}>F</span>
        </div>
        <p style={{ color: '#6b7280', margin: 0 }}>Carregando FiscalMEI...</p>
      </div>
    </div>
  )
}