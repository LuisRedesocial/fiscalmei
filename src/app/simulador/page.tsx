'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SimuladorPage() {
  const router = useRouter()
  const [faturamentoMensal, setFaturamentoMensal] = useState('')
  const [temFuncionario, setTemFuncionario] = useState(false)
  const [resultado, setResultado] = useState<any>(null)

  function calcular() {
    const valor = parseFloat(faturamentoMensal.replace(',', '.'))
    if (isNaN(valor) || valor <= 0) {
      alert('Digite um valor válido')
      return
    }

    // Valores aproximados 2026
    const dasMei = 86.05 // valor médio (serviço)
    
    // Simples Nacional - anexo III (serviços) - alíquota aproximada inicial
    // Cálculo simplificado para MVP
    let aliquotaSimples = 0.06 // 6% inicial (aproximado)
    
    if (valor * 12 > 180000) aliquotaSimples = 0.112
    if (valor * 12 > 360000) aliquotaSimples = 0.135
    if (valor * 12 > 720000) aliquotaSimples = 0.16

    const impostoSimplesMensal = valor * aliquotaSimples
    const diferencaMensal = impostoSimplesMensal - dasMei
    const diferencaAnual = diferencaMensal * 12

    setResultado({
      dasMei,
      impostoSimplesMensal,
      diferencaMensal,
      diferencaAnual,
      aliquotaSimples: (aliquotaSimples * 100).toFixed(1),
    })
  }

  function formatMoney(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', paddingBottom: '80px' }}>
      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button 
          onClick={() => router.push('/dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
        >
          ←
        </button>
        <span style={{ fontWeight: 'bold', fontSize: '18px' }}>Simulador MEI → ME</span>
      </header>

      <main style={{ maxWidth: '500px', margin: '0 auto', padding: '24px 16px' }}>
        
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px' }}>
            Quanto você pagaria saindo do MEI?
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 20px' }}>
            Simulação aproximada. Consulte um contador para valores oficiais.
          </p>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
              Faturamento mensal médio (R$)
            </label>
            <input
              type="text"
              value={faturamentoMensal}
              onChange={(e) => setFaturamentoMensal(e.target.value)}
              placeholder="Ex: 5000"
              style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={temFuncionario}
                onChange={(e) => setTemFuncionario(e.target.checked)}
              />
              Já tem ou pretende ter funcionário
            </label>
          </div>

          <button
            onClick={calcular}
            style={{ 
              width: '100%', 
              padding: '14px', 
              background: '#2563eb', 
              color: 'white', 
              border: 'none', 
              borderRadius: '10px', 
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer'
            }}
          >
            Calcular
          </button>
        </div>

        {/* Resultado */}
        {resultado && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 16px' }}>
              Resultado da simulação
            </h3>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '14px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#166534' }}>Como MEI você paga</p>
                <p style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 'bold', color: '#166534' }}>
                  {formatMoney(resultado.dasMei)}/mês
                </p>
              </div>

              <div style={{ background: '#fef3c7', borderRadius: '8px', padding: '14px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#92400e' }}>
                  No Simples Nacional (aprox. {resultado.aliquotaSimples}%)
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 'bold', color: '#92400e' }}>
                  {formatMoney(resultado.impostoSimplesMensal)}/mês
                </p>
              </div>

              <div style={{ background: resultado.diferencaMensal > 0 ? '#fef2f2' : '#f0fdf4', borderRadius: '8px', padding: '14px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: resultado.diferencaMensal > 0 ? '#b91c1c' : '#166534' }}>
                  Diferença mensal
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 'bold', color: resultado.diferencaMensal > 0 ? '#b91c1c' : '#166534' }}>
                  {resultado.diferencaMensal > 0 ? '+' : ''}{formatMoney(resultado.diferencaMensal)}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
                  Diferença anual: {formatMoney(resultado.diferencaAnual)}
                </p>
              </div>
            </div>

            <p style={{ marginTop: '16px', fontSize: '12px', color: '#9ca3af', lineHeight: '1.4' }}>
              Esta é uma simulação simplificada. Os valores reais do Simples Nacional dependem do anexo, folha de pagamento e outras variáveis. Consulte sempre um contador.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}