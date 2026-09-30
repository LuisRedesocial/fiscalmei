'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cleanCnpj, formatCnpj, isValidCnpj } from '@/lib/cnpj'

export default function OnboardingPage() {
  const [cnpj, setCnpj] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [tipoAtividade, setTipoAtividade] = useState('servico')
  const [loading, setLoading] = useState(false)
  const [consultando, setConsultando] = useState(false)
  const [message, setMessage] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [empresaInfo, setEmpresaInfo] = useState<any>(null)
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

  function formatWhatsApp(value: string) {
    const numbers = value.replace(/\D/g, '').slice(0, 11)
    if (numbers.length <= 10) {
      return numbers.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
    }
    return numbers.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
  }

  async function consultarCNPJ(cnpjValue: string) {
    const clean = cleanCnpj(cnpjValue)
    if (clean.length !== 14) {
      setEmpresaInfo(null)
      return
    }

    setConsultando(true)
    setMessage('')
    setEmpresaInfo(null)

    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`)
      
      if (!res.ok) {
        throw new Error('CNPJ não encontrado na Receita Federal')
      }

      const data = await res.json()
      
      setEmpresaInfo({
        razao_social: data.razao_social || data.nome_fantasia || '',
        nome_fantasia: data.nome_fantasia || '',
        situacao: data.descricao_situacao_cadastral || data.situacao_cadastral || '',
        cnae: data.cnae_fiscal_descricao || data.cnae_fiscal || '',
        municipio: data.municipio || '',
        uf: data.uf || ''
      })

      const cnaeText = (data.cnae_fiscal_descricao || '').toLowerCase()
      if (cnaeText.includes('comércio') || cnaeText.includes('comercio') || cnaeText.includes('varejo')) {
        setTipoAtividade('comercio')
      } else if (cnaeText.includes('serviço') || cnaeText.includes('servico')) {
        setTipoAtividade('servico')
      }

    } catch (error: any) {
      setMessage(error.message || 'Não foi possível consultar o CNPJ')
      setEmpresaInfo(null)
    } finally {
      setConsultando(false)
    }
  }

  function handleCnpjChange(value: string) {
    const formatted = formatCnpj(value)
    setCnpj(formatted)
    
    const clean = cleanCnpj(value)
    if (clean.length === 14) {
      if (!isValidCnpj(clean)) {
        setMessage('CNPJ inválido. Verifique os números digitados.')
        setEmpresaInfo(null)
        return
      }
      setMessage('')
      consultarCNPJ(clean)
    } else {
      setEmpresaInfo(null)
      setMessage('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return

    setLoading(true)
    setMessage('')

    try {
      const cleanCnpjValue = cleanCnpj(cnpj)
      const cleanWhatsapp = whatsapp.replace(/\D/g, '')

      if (!isValidCnpj(cleanCnpjValue)) {
        throw new Error('CNPJ inválido. Verifique os números digitados.')
      }

      if (cleanWhatsapp.length < 10) {
        throw new Error('WhatsApp inválido. Digite o número com DDD.')
      }

      await supabase
        .from('users')
        .update({ whatsapp: cleanWhatsapp })
        .eq('id', userId)

      const { error } = await supabase.from('companies').insert({
        user_id: userId,
        cnpj: cleanCnpjValue,
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
              onChange={(e) => handleCnpjChange(e.target.value)}
              required
              placeholder="00.000.000/0001-00"
              style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '10px', fontSize: '15px', boxSizing: 'border-box' }}
            />
            {consultando && (
              <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '6px' }}>Consultando Receita Federal...</p>
            )}
          </div>

          {empresaInfo && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '13px' }}>
              <p style={{ margin: '0 0 4px', fontWeight: '600', color: '#166534' }}>
                {empresaInfo.razao_social || empresaInfo.nome_fantasia}
              </p>
              {empresaInfo.situacao && (
                <p style={{ margin: '0 0 2px', color: '#15803d' }}>Situação: {empresaInfo.situacao}</p>
              )}
              {empresaInfo.cnae && (
                <p style={{ margin: '0 0 2px', color: '#15803d' }}>Atividade: {empresaInfo.cnae}</p>
              )}
              {(empresaInfo.municipio || empresaInfo.uf) && (
                <p style={{ margin: 0, color: '#15803d' }}>
                  {empresaInfo.municipio}{empresaInfo.uf ? ` / ${empresaInfo.uf}` : ''}
                </p>
              )}
            </div>
          )}

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
            disabled={loading || consultando}
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