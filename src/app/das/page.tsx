'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function DasPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [cnpj, setCnpj] = useState('')
  const [dasList, setDasList] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // Valor aproximado do DAS (pode ajustar depois)
  const valorDas = 82.05

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: company } = await supabase
      .from('companies')
      .select('id, cnpj')
      .eq('user_id', user.id)
      .single()

    if (!company) {
      router.push('/onboarding')
      return
    }

    setCompanyId(company.id)
    setCnpj(company.cnpj || '')

    // Busca os DAS já registrados
    const { data } = await supabase
      .from('das_payments')
      .select('*')
      .eq('company_id', company.id)
      .order('reference_month', { ascending: false })

    setDasList(data || [])
    setLoading(false)
  }

  async function gerarDasDoMes() {
    if (!companyId) return
    setSaving(true)
    setMessage('')

    try {
      const now = new Date()
      const referenceMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0]

      // Vencimento é dia 20 do mês seguinte
      const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 20)
        .toISOString()
        .split('T')[0]

      const { error } = await supabase.from('das_payments').insert({
        company_id: companyId,
        reference_month: referenceMonth,
        amount: valorDas,
        due_date: dueDate,
        paid: false,
      })

      if (error) {
        if (error.code === '23505') {
          setMessage('O DAS deste mês já foi gerado.')
        } else {
          throw error
        }
      } else {
        setMessage('DAS do mês gerado com sucesso!')
        loadData()
      }
    } catch (error: any) {
      setMessage(error.message || 'Erro ao gerar DAS')
    } finally {
      setSaving(false)
    }
  }

  async function marcarComoPago(id: string) {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('das_payments')
        .update({ paid: true, paid_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      loadData()
    } catch (error: any) {
      setMessage(error.message || 'Erro ao atualizar')
    } finally {
      setSaving(false)
    }
  }

  function abrirPgmeiOficial() {
    // Abre o site oficial do PGMEI
    window.open(
      'https://www8.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/pgmei.app/Identificacao',
      '_blank'
    )
  }

  function formatMoney(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  function formatMonth(dateStr: string) {
    const date = new Date(dateStr + 'T12:00:00')
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  function formatCnpj(value: string) {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    )
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
          <button 
            onClick={() => router.push('/dashboard')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
          >
            ←
          </button>
          <span style={{ fontWeight: 'bold', fontSize: '18px' }}>DAS</span>
        </div>
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>
        
        {/* Card principal */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px' }}>
            Controle do DAS
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px' }}>
            Gere o controle interno e emita a guia oficial no site da Receita Federal.
          </p>

          {cnpj && (
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
              CNPJ: <strong>{formatCnpj(cnpj)}</strong>
            </p>
          )}

          {/* Botão oficial - destaque */}
          <button
            onClick={abrirPgmeiOficial}
            style={{ 
              width: '100%', 
              padding: '14px', 
              background: '#059669', 
              color: 'white', 
              border: 'none', 
              borderRadius: '10px', 
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              marginBottom: '12px'
            }}
          >
            Emitir DAS no site oficial da Receita
          </button>

          <button
            onClick={gerarDasDoMes}
            disabled={saving}
            style={{ 
              width: '100%', 
              padding: '12px', 
              background: saving ? '#93c5fd' : '#2563eb', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Gerando...' : 'Registrar DAS do mês (controle interno)'}
          </button>

          {message && (
            <div style={{ 
              marginTop: '12px',
              padding: '10px', 
              borderRadius: '8px', 
              fontSize: '13px',
              background: message.includes('sucesso') ? '#f0fdf4' : '#fef2f2',
              color: message.includes('sucesso') ? '#166534' : '#b91c1c'
            }}>
              {message}
            </div>
          )}
        </div>

        {/* Lista de DAS */}
        {dasList.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', color: '#6b7280' }}>
            <p style={{ margin: 0 }}>Nenhum DAS registrado ainda.</p>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
            {dasList.map((das) => (
              <div 
                key={das.id} 
                style={{ 
                  padding: '16px 20px', 
                  borderBottom: '1px solid #f3f4f6',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: '500', fontSize: '15px', textTransform: 'capitalize' }}>
                    {formatMonth(das.reference_month)}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
                    Vencimento: {new Date(das.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: '600' }}>
                    {formatMoney(Number(das.amount))}
                  </p>
                </div>

                {das.paid ? (
                  <span style={{ 
                    background: '#dcfce7', 
                    color: '#166534', 
                    padding: '6px 12px', 
                    borderRadius: '999px', 
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    Pago
                  </span>
                ) : (
                  <button
                    onClick={() => marcarComoPago(das.id)}
                    disabled={saving}
                    style={{ 
                      padding: '8px 14px', 
                      background: '#2563eb', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '8px', 
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Marcar pago
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
		<div style={{ height: '80px' }}></div>
      </main>
    </div>
  )
}