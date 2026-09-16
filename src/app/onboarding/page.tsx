'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const [cnpj, setCnpj] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [tipoAtividade, setTipoAtividade] = useState('servico')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)

      // Verifica se já tem empresa cadastrada
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (company) {
        router.push('/dashboard')
      }
    }
    checkUser()
  }, [])

  function formatCNPJ(value: string) {
    const numbers = value.replace(/\D/g, '').slice(0, 14)
    return numbers
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }

  function formatWhatsApp(value: string) {
    const numbers = value.replace(/\D/g, '').slice(0, 11)
    if (numbers.length <= 10) {
      return numbers.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
    }
    return numbers.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return

    setLoading(true)
    setMessage('')

    try {
      const cleanCnpj = cnpj.replace(/\D/g, '')
      const cleanWhatsapp = whatsapp.replace(/\D/g, '')

      if (cleanCnpj.length !== 14) {
        throw new Error('CNPJ inválido. Digite os 14 números.')
      }

      if (cleanWhatsapp.length < 10) {
        throw new Error('WhatsApp inválido. Digite o número com DDD.')
      }

      // Atualiza o WhatsApp do usuário
      await supabase
        .from('users')
        .update({ whatsapp: cleanWhatsapp })
        .eq('id', userId)

      // Cria a empresa
      const { error } = await supabase.from('companies').insert({
        user_id: userId,
        cnpj: cleanCnpj,
        tipo_atividade: tipoAtividade,
        limite_anual: 81000,
      })

      if (error) {
        if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
          throw new Error('Este CNPJ já está cadastrado no sistema.')
        }
        if (error.message.includes('foreign key')) {
          throw new Error('Erro ao vincular usuário. Tente sair e entrar novamente.')
        }
        throw new Error(error.message)
      }

      router.push('/dashboard')
    } catch (error: any) {
      setMessage(error.message || 'Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 8px' }}>Quase lá!</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
            Precisamos de algumas informações do seu MEI
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>CNPJ</label>
            <input
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
              required
              placeholder="00.000.000/0001-00"
              style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '10px', fontSize: '15px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>WhatsApp</label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
              required
              placeholder="(11) 99999-9999"
              style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '10px', fontSize: '15px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Tipo de atividade</label>
            <select
              value={tipoAtividade}
              onChange={(e) => setTipoAtividade(e.target.value)}
              style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '10px', fontSize: '15px', boxSizing: 'border-box' }}
            >
              <option value="servico">Prestação de serviço</option>
              <option value="comercio">Comércio</option>
              <option value="ambos">Serviço e Comércio</option>
            </select>
          </div>

          {message && (
            <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', background: '#fef2f2', color: '#b91c1c' }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '14px', 
              background: loading ? '#93c5fd' : '#2563eb', 
              color: 'white', 
              border: 'none', 
              borderRadius: '10px', 
              fontSize: '16px', 
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Salvando...' : 'Continuar'}
          </button>
        </form>
      </div>
    </main>
  )
}