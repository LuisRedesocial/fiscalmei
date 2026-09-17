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
  const [messageType, setMessageType] = useState<'error' | 'success'>('error')
  const [showForm, setShowForm] = useState(false)
  
  // Formulário para mês anterior
  const [referenceMonth, setReferenceMonth] = useState('')
  const [amount, setAmount] = useState('82.05')
  const [dueDate, setDueDate] = useState('')

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

    const { data: company } = await supabase
      .from('companies')
      .select('id, cnpj')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!company) {
      router.push('/onboarding')
      return
    }

    setCompanyId(company.id)
    setCnpj(company.cnpj || '')

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
      const refMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0]

      const due = new Date(now.getFullYear(), now.getMonth() + 1, 20)
        .toISOString()
        .split('T')[0]

      const { error } = await supabase.from('das_payments').insert({
        company_id: companyId,
        reference_month: refMonth,
        amount: 82.05,
        due_date: due,
        paid: false,
      })

      if (error) {
        if (error.code === '23505') {
          throw new Error('O DAS deste mês já foi registrado.')
        }
        throw error
      }

      setMessageType('success')
      setMessage('DAS do mês atual registrado com sucesso!')
      loadData()
    } catch (error: any) {
      setMessageType('error')
      setMessage(error.message || 'Erro ao registrar DAS')
    } finally {
      setSaving(false)
    }
  }

  async function salvarMesAnterior(e: React.FormEvent) {
    e.preventDefault()
    if (!companyId) return

    setSaving(true)
    setMessage('')

    try {
      if (!referenceMonth) {
        throw new Error('Escolha o mês de referência')
      }

      const value = parseFloat(amount.replace(',', '.'))
      if (isNaN(value) || value <= 0) {
        throw new Error('Valor inválido')
      }

      // Se não informou vencimento, coloca dia 20 do mês seguinte
      let finalDueDate = dueDate
      if (!finalDueDate) {
        const [year, month] = referenceMonth.split('-')
        const due = new Date(Number(year), Number(month), 20)
        finalDueDate = due.toISOString().split('T')[0]
      }

      const { error } = await supabase.from('das_payments').insert({
        company_id: companyId,
        reference_month: referenceMonth + '-01',
        amount: value,
        due_date: finalDueDate,
        paid: false,
      })

      if (error) {
        if (error.code === '23505') {
          throw new Error('Já existe DAS registrado para este mês.')
        }
        throw error
      }

      setMessageType('success')
      setMessage('DAS de mês anterior registrado!')
      setShowForm(false)
      setReferenceMonth('')
      setAmount('82.05')
      setDueDate('')
      loadData()
    } catch (error: any) {
      setMessageType('error')
      setMessage(error.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function marcarComoPago(id: string) {
    setSaving(true)
    setMessage('')
    try {
      const { error } = await supabase
        .from('das_payments')
        .update({ paid: true, paid_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      
      setMessageType('success')
      setMessage('Marcado como pago!')
      loadData()
    } catch (error: any) {
      setMessageType('error')
      setMessage(error.message || 'Erro ao atualizar')
    } finally {
      setSaving(false)
    }
  }

  function abrirPgmeiOficial() {
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
    <div style={{ minHeight: '100vh', background: '#f3f4f6', paddingBottom: '80px' }}>
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
        
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px' }}>
            Controle do DAS
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px' }}>
            Registre o DAS do mês atual ou de meses anteriores.
          </p>

          {cnpj && (
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
              CNPJ: <strong>{formatCnpj(cnpj)}</strong>
            </p>
          )}

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
              cursor: saving ? 'not-allowed' : 'pointer',
              marginBottom: '10px'
            }}
          >
            {saving ? 'Registrando...' : 'Registrar DAS do mês atual'}
          </button>

          <button
            onClick={() => {
              setShowForm(!showForm)
              setMessage('')
            }}
            style={{ 
              width: '100%', 
              padding: '12px', 
              background: 'white', 
              color: '#374151', 
              border: '1px solid #d1d5db', 
              borderRadius: '8px', 
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {showForm ? 'Cancelar' : '+ Registrar mês anterior'}
          </button>

          {message && (
            <div style={{ 
              marginTop: '12px',
              padding: '10px', 
              borderRadius: '8px', 
              fontSize: '13px',
              background: messageType === 'success' ? '#f0fdf4' : '#fef2f2',
              color: messageType === 'success' ? '#166534' : '#b91c1c'
            }}>
              {message}
            </div>
          )}
        </div>

        {/* Formulário de mês anterior */}
        {showForm && (
          <form onSubmit={salvarMesAnterior} style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 16px' }}>
              Registrar DAS de mês anterior
            </h3>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>
                Mês de referência
              </label>
              <input
                type="month"
                value={referenceMonth}
                onChange={(e) => setReferenceMonth(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>
                Valor (R$)
              </label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>
                Data de vencimento (opcional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
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
              {saving ? 'Salvando...' : 'Salvar DAS'}
            </button>
          </form>
        )}

        {/* Lista */}
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
      </main>
    </div>
  )
}