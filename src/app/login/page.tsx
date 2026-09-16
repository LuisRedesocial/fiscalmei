'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isLogin) {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error
        router.push('/onboarding')
      } else {
        // Cadastro
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        })

        if (error) throw error

        // Criar registro na tabela users
        if (data.user) {
          await supabase.from('users').insert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            trial_ends_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            subscription_status: 'trial',
          })
        }

        setMessage('Conta criada! Verifique seu e-mail ou faça login.')
        setIsLogin(true)
      }
    } catch (error: any) {
      setMessage(error.message || 'Ocorreu um erro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '48px', height: '48px', background: '#2563eb', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '20px' }}>F</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>FiscalMEI</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
            {isLogin ? 'Entre na sua conta' : 'Crie sua conta grátis'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Nome completo</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '10px', fontSize: '15px', boxSizing: 'border-box' }}
                placeholder="Seu nome"
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '10px', fontSize: '15px', boxSizing: 'border-box' }}
              placeholder="seu@email.com"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '10px', fontSize: '15px', boxSizing: 'border-box' }}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {message && (
            <div style={{ 
              padding: '12px', 
              borderRadius: '8px', 
              marginBottom: '16px', 
              fontSize: '14px',
              background: message.includes('erro') || message.includes('Error') ? '#fef2f2' : '#f0fdf4',
              color: message.includes('erro') || message.includes('Error') ? '#b91c1c' : '#166534'
            }}>
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
            {loading ? 'Aguarde...' : isLogin ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#6b7280' }}>
          {isLogin ? 'Ainda não tem conta?' : 'Já tem conta?'}{' '}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setMessage('')
            }}
            style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '600', cursor: 'pointer', padding: 0 }}
          >
            {isLogin ? 'Criar conta' : 'Fazer login'}
          </button>
        </p>
      </div>
    </main>
  )
}