'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cleanCnpj, formatCnpj, isValidCnpj } from '@/lib/cnpj'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [totalFaturado, setTotalFaturado] = useState(0)
  const [limiteAnual, setLimiteAnual] = useState(81000)
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState('trial')
  const [loading, setLoading] = useState(true)
  const [limitAlert, setLimitAlert] = useState<string | null>(null)
  const [dasAlert, setDasAlert] = useState<string | null>(null)
  const [cnpj, setCnpj] = useState('')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [showEditCnpj, setShowEditCnpj] = useState(false)
  const [newCnpj, setNewCnpj] = useState('')
  const [savingCnpj, setSavingCnpj] = useState(false)
  const [cnpjMessage, setCnpjMessage] = useState('')
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

    const { data: userData } = await supabase
      .from('users')
      .select('trial_ends_at, subscription_status')
      .eq('id', user.id)
      .maybeSingle()

    if (userData) {
      setSubscriptionStatus(userData.subscription_status || 'trial')
      
      if (userData.trial_ends_at) {
        const ends = new Date(userData.trial_ends_at).getTime()
        const now = Date.now()
        const days = Math.max(0, Math.ceil((ends - now) / (1000 * 60 * 60 * 24)))
        setTrialDaysLeft(days)
      }
    }

    const { data: company } = await supabase
      .from('companies')
      .select('id, limite_anual, cnpj')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!company) {
      router.push('/onboarding')
      return
    }

    setCompanyId(company.id)
    setCnpj(company.cnpj || '')
    setNewCnpj(formatCnpj(company.cnpj || ''))
    const limite = Number(company.limite_anual) || 81000
    setLimiteAnual(limite)

    const year = new Date().getFullYear()
    const { data: revenues } = await supabase
      .from('revenues')
      .select('amount')
      .eq('company_id', company.id)
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`)

    const total = (revenues || []).reduce((sum, r) => sum + Number(r.amount), 0)
    setTotalFaturado(total)

    await checkLimitAlerts(user.id, company.id, total, limite)
    await checkDasAlerts(user.id, company.id)

    setLoading(false)
  }

  async function checkLimitAlerts(userId: string, companyId: string, total: number, limite: number) {
    const percentual = limite > 0 ? (total / limite) * 100 : 0

    let alertType = null
    let message = null

    if (percentual >= 95) {
      alertType = 'limit_95'
      message = `Atenção crítica! Você já atingiu ${percentual.toFixed(1)}% do limite anual do MEI.`
    } else if (percentual >= 85) {
      alertType = 'limit_85'
      message = `Atenção! Você já atingiu ${percentual.toFixed(1)}% do limite anual do MEI.`
    } else if (percentual >= 70) {
      alertType = 'limit_70'
      message = `Alerta: Você já atingiu ${percentual.toFixed(1)}% do limite anual do MEI.`
    }

    if (alertType && message) {
      setLimitAlert(message)

      const { data: existing } = await supabase
        .from('alerts')
        .select('id')
        .eq('user_id', userId)
        .eq('type', alertType)
        .gte('created_at', `${new Date().getFullYear()}-01-01`)
        .maybeSingle()

      if (!existing) {
        await supabase.from('alerts').insert({
          user_id: userId,
          company_id: companyId,
          type: alertType,
          message,
          percentage: percentual,
          sent: false
        })
      }
    }
  }

  async function checkDasAlerts(userId: string, companyId: string) {
    const { data: dasList } = await supabase
      .from('das_payments')
      .select('*')
      .eq('company_id', companyId)
      .eq('paid', false)
      .order('due_date', { ascending: true })

    if (!dasList || dasList.length === 0) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const das of dasList) {
      const due = new Date(das.due_date + 'T12:00:00')
      const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays < 0) {
        setDasAlert(`DAS de ${new Date(das.reference_month + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long' })} está vencido!`)
        break
      } else if (diffDays <= 1) {
        setDasAlert(`DAS vence amanhã ou hoje! Não esqueça de pagar.`)
        break
      } else if (diffDays <= 5) {
        setDasAlert(`DAS vence em ${diffDays} dias. Prepare o pagamento.`)
        break
      }
    }
  }

  function handleCnpjInput(value: string) {
    setNewCnpj(formatCnpj(value))
  }

  async function salvarCnpj() {
    if (!companyId) return
    setSavingCnpj(true)
    setCnpjMessage('')

    try {
      const clean = cleanCnpj(newCnpj)

      if (!isValidCnpj(clean)) {
        throw new Error('CNPJ inválido. Verifique os números digitados.')
      }

      const { error } = await supabase
        .from('companies')
        .update({ cnpj: clean })
        .eq('id', companyId)

      if (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          throw new Error('Este CNPJ já está cadastrado em outra conta.')
        }
        throw error
      }

      setCnpj(clean)
      setShowEditCnpj(false)
      setCnpjMessage('CNPJ atualizado com sucesso!')
    } catch (error: any) {
      setCnpjMessage(error.message || 'Erro ao atualizar CNPJ')
    } finally {
      setSavingCnpj(false)
    }
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
    <div style={{ minHeight: '100vh', background: '#f3f4f6', paddingBottom: '80px' }}>
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

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          Olá{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''}!
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          Acompanhe seu limite de faturamento do MEI
        </p>

        {/* CNPJ vinculado */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>CNPJ vinculado</p>
            <p style={{ margin: '2px 0 0', fontSize: '15px', fontWeight: '600' }}>
              {cnpj ? formatCnpj(cnpj) : 'Não informado'}
            </p>
          </div>
          <button
            onClick={() => {
              setShowEditCnpj(!showEditCnpj)
              setCnpjMessage('')
              setNewCnpj(formatCnpj(cnpj))
            }}
            style={{ padding: '8px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
          >
            {showEditCnpj ? 'Cancelar' : 'Alterar'}
          </button>
        </div>

        {showEditCnpj && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
              Novo CNPJ
            </label>
            <input
              type="text"
              value={newCnpj}
              onChange={(e) => handleCnpjInput(e.target.value)}
              placeholder="00.000.000/0001-00"
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', marginBottom: '12px', boxSizing: 'border-box' }}
            />
            {cnpjMessage && (
              <p style={{ fontSize: '13px', color: cnpjMessage.includes('sucesso') ? '#166534' : '#b91c1c', marginBottom: '12px' }}>
                {cnpjMessage}
              </p>
            )}
            <button
              onClick={salvarCnpj}
              disabled={savingCnpj}
              style={{ 
                width: '100%', 
                padding: '12px', 
                background: savingCnpj ? '#93c5fd' : '#2563eb', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                fontWeight: '600',
                cursor: savingCnpj ? 'not-allowed' : 'pointer'
              }}
            >
              {savingCnpj ? 'Salvando...' : 'Salvar CNPJ'}
            </button>
          </div>
        )}

        {/* Aviso do teste grátis */}
        {subscriptionStatus === 'trial' && trialDaysLeft !== null && (
          <div style={{ 
            background: trialDaysLeft <= 3 ? '#fef2f2' : '#eff6ff', 
            border: `1px solid ${trialDaysLeft <= 3 ? '#fecaca' : '#bfdbfe'}`,
            borderRadius: '12px', 
            padding: '16px', 
            marginBottom: '20px',
          }}>
            <p style={{ 
              margin: '0 0 10px', 
              fontSize: '14px',
              color: trialDaysLeft <= 3 ? '#b91c1c' : '#1e40af',
              fontWeight: '500'
            }}>
              {trialDaysLeft > 0 
                ? `Seu teste grátis termina em ${trialDaysLeft} dia${trialDaysLeft > 1 ? 's' : ''}.`
                : 'Seu teste grátis acabou.'
              }
            </p>
            <button
              onClick={() => alert('Em breve você poderá assinar o plano. Estamos finalizando a integração de pagamento.')}
              style={{
                padding: '8px 16px',
                background: trialDaysLeft <= 3 ? '#dc2626' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Quero assinar
            </button>
          </div>
        )}

        {/* Alerta de limite */}
        {limitAlert && (
          <div style={{ 
            background: percentual >= 95 ? '#fef2f2' : percentual >= 85 ? '#fff7ed' : '#fefce8',
            border: `1px solid ${percentual >= 95 ? '#fecaca' : percentual >= 85 ? '#fed7aa' : '#fef08a'}`,
            borderRadius: '12px', 
            padding: '16px', 
            marginBottom: '20px',
            fontSize: '14px',
            color: percentual >= 95 ? '#b91c1c' : percentual >= 85 ? '#c2410c' : '#a16207',
            fontWeight: '500'
          }}>
            ⚠️ {limitAlert}
          </div>
        )}

        {/* Alerta de DAS */}
        {dasAlert && (
          <div style={{ 
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px', 
            padding: '16px', 
            marginBottom: '20px',
            fontSize: '14px',
            color: '#b91c1c',
            fontWeight: '500'
          }}>
            📅 {dasAlert}
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
            cursor: 'pointer',
            marginBottom: '12px'
          }}
        >
          Controle do DAS
        </button>

        <button 
          onClick={() => router.push('/simulador')}
          style={{ 
            width: '100%', 
            padding: '16px', 
            background: 'white', 
            color: '#374151', 
            border: '1px solid #d1d5db', 
            borderRadius: '12px', 
            fontWeight: '600', 
            cursor: 'pointer',
            marginBottom: '12px'
          }}
        >
          Simulador MEI → ME
        </button>

        <button 
          onClick={() => router.push('/guias')}
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
          Guias e Checklist
        </button>
      </main>
    </div>
  )
}