'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LancamentosPage() {
  const [revenues, setRevenues] = useState<any[]>([])
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'error' | 'success'>('error')
  
  // Form
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('servico')

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
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!company) {
      router.push('/onboarding')
      return
    }

    setCompanyId(company.id)

    const { data: revs } = await supabase
      .from('revenues')
      .select('*')
      .eq('company_id', company.id)
      .order('date', { ascending: false })

    setRevenues(revs || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!companyId) return

    setSaving(true)
    setMessage('')

    try {
      const value = parseFloat(amount.replace(',', '.'))
      if (isNaN(value) || value <= 0) {
        throw new Error('Digite um valor válido maior que zero')
      }

      const { error } = await supabase.from('revenues').insert({
        company_id: companyId,
        date,
        amount: value,
        description: description || null,
        category,
      })

      if (error) throw error

      setMessageType('success')
      setMessage('Lançamento salvo com sucesso!')
      setAmount('')
      setDescription('')
      setShowForm(false)
      loadData()
    } catch (error: any) {
      setMessageType('error')
      setMessage(error.message || 'Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  function formatMoney(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Carregando...</p>
      </div>
    )
  }

  const total = revenues.reduce((sum, r) => sum + Number(r.amount), 0)

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', paddingBottom: '80px' }}>
      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={() => router.push('/dashboard')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
          >
            ←
          </button>
          <span style={{ fontWeight: 'bold', fontSize: '18px' }}>Lançamentos</span>
        </div>
        
        <button 
          onClick={() => {
            setShowForm(!showForm)
            setMessage('')
          }}
          style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
        >
          {showForm ? 'Cancelar' : '+ Novo'}
        </button>
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>
        
        {/* Total */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px' }}>Total lançado</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#111827' }}>{formatMoney(total)}</p>
        </div>

        {/* Formulário */}
        {showForm && (
          <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>Valor (R$)</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="0,00"
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>Descrição (opcional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Serviço de consultoria"
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }}
              >
                <option value="servico">Serviço</option>
                <option value="produto">Produto</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            {message && (
              <div style={{ 
                padding: '10px', 
                borderRadius: '8px', 
                marginBottom: '12px', 
                fontSize: '13px',
                background: messageType === 'success' ? '#f0fdf4' : '#fef2f2',
                color: messageType === 'success' ? '#166534' : '#b91c1c'
              }}>
                {message}
              </div>
            )}

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
              {saving ? 'Salvando...' : 'Salvar lançamento'}
            </button>
          </form>
        )}

        {/* Lista de lançamentos */}
        {revenues.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', color: '#6b7280' }}>
            <p style={{ margin: 0 }}>Nenhum lançamento ainda.</p>
            <p style={{ margin: '8px 0 0', fontSize: '14px' }}>Clique em “+ Novo” para começar.</p>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
            {revenues.map((rev) => (
              <div 
                key={rev.id} 
                style={{ 
                  padding: '16px 20px', 
                  borderBottom: '1px solid #f3f4f6',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: '500', fontSize: '15px' }}>
                    {rev.description || 'Sem descrição'}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
                    {new Date(rev.date + 'T12:00:00').toLocaleDateString('pt-BR')} · {rev.category}
                  </p>
                </div>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '15px', color: '#059669' }}>
                  {formatMoney(Number(rev.amount))}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}