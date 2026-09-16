'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [totalFaturado, setTotalFaturado] = useState(0)
  const [limiteAnual, setLimiteAnual] = useState(81000)
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState('trial')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    setUser(user)

    // Busca dados do trial
    const { data: userData } = await supabase
      .from('users')
      .select('trial_ends_at, subscription_status')
      .eq('id', user.id)
      .single()

    if (userData) {
      setSubscriptionStatus(userData.subscription_status || 'trial')
      
      if (userData.trial_ends_at) {
        const ends = new Date(userData.trial_ends_at).getTime()
        const now = Date.now()
        const days = Math.max(0, Math.ceil((ends - now) / (1000 * 60 * 60 * 24)))
        setTrialDaysLeft(days)
      }
    }

    // Busca a empresa
    const { data: company } = await supabase
      .from('companies')
      .select('id, limite_anual')
      .eq('user_id', user.id)
      .single()

    if (!company) {
      router.push('/onboarding')
      return
    }

    setLimiteAnual(Number(company.limite_anual) || 81000)

    // Soma os lançamentos do ano atual
    const year = new Date().getFullYear()
    const { data: revenues } = await supabase
      .from('revenues')
      .select('amount')
      .eq('company_id', company.id)
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`)

    const total = (revenues || []).reduce((sum, r) => sum + Number(r.amount), 0)
    setTotalFaturado(total)
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function formatMoney(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const percentual = limiteAnual > 0 ? (totalFaturado / limiteAnual) * 100 : 0
  const saldo = Math.max(0, limiteAnual - totalFaturado)

  let barColor = '#22c55e'
  let statusText = 'Dentro do limite'
  if (percentual >= 95) {
    barColor = '#ef4444'
    statusText = 'Crítico – acima de 95%'
  } else if (percentual >= 85) {
    barColor = '#f97316'
    statusText = 'Atenção – acima de 85%'
  } else if (percentual >= 70) {
    barColor = '#eab308'
    statusText = 'Alerta – acima de 70%'
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', background: '#2563eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>F</span>
          </div>
          <span style={{ fontWeight: 'bold', fontSize: '18px' }}>FiscalMEI</span>
        </div>
        
        <button 
          onClick={handleLogout}
          style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
        >
          Sair
        </button>
      </header>

      {/* Conteúdo */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          Olá{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''}!
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          Acompanhe seu limite de faturamento do MEI
        </p>

        {/* Aviso do teste grátis */}
        {subscriptionStatus === 'trial' && trialDaysLeft !== null && (
          <div style={{ 
            background: trialDaysLeft <= 3 ? '#fef2f2' : '#eff6ff', 
            border: `1px solid ${trialDaysLeft <= 3 ? '#fecaca' : '#bfdbfe'}`,
            borderRadius: '12px', 
            padding: '14px 16px', 
            marginBottom: '24px',
            fontSize: '14px',
            color: trialDaysLeft <= 3 ? '#b91c1c' : '#1e40af'
          }}>
            {trialDaysLeft > 0 
              ? `Seu teste grátis termina em ${trialDaysLeft} dia${trialDaysLeft > 1 ? 's' : ''}.`
              : 'Seu teste grátis acabou. Assine para continuar usando.'
            }
          </div>
        )}

        {/* Card do Limite */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#374151' }}>
              Limite de faturamento 2026
            </h2>
            <span style={{ fontSize: '13px', fontWeight: '500', color: barColor }}>
              {statusText}
            </span>
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
              <span>{formatMoney(totalFaturado)} de {formatMoney(limiteAnual)}</span>
              <span style={{ fontWeight: '600' }}>{percentual.toFixed(1)}%</span>
            </div>
            <div style={{ height: '14px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                width: `${Math.min(percentual, 100)}%`, 
                background: barColor, 
                borderRadius: '999px',
                transition: 'width 0.5s ease'
              }}></div>
            </div>
          </div>
          
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
            Ainda pode faturar <strong>{formatMoney(saldo)}</strong> este ano.
          </p>
        </div>

        {/* Botões de ação */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <button 
            onClick={() => router.push('/lancamentos')}
            style={{ padding: '16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}
          >
            + Lançar venda
          </button>
          <button 
            onClick={() => router.push('/lancamentos')}
            style={{ padding: '16px', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}
          >
            Ver lançamentos
          </button>
        </div>

        <button 
          onClick={() => router.push('/das')}
          style={{ 
            width: '100%', 
            padding: '16px', 
            background: 'white', 
            color: '#374151', 
            border: '1px solid #d1d5db', 
            borderRadius: '12px', 
            fontWeight: '600', 
            cursor: 'pointer' 
          }}
        >
          Controle do DAS
        </button>
		<div style={{ height: '80px' }}></div>
      </main>
    </div>
  )
}