'use client'

import { useRouter } from 'next/navigation'

export default function GuiasPage() {
  const router = useRouter()

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
        <span style={{ fontWeight: 'bold', fontSize: '18px' }}>Guias e Checklist</span>
      </header>

      <main style={{ maxWidth: '700px', margin: '0 auto', padding: '24px 16px' }}>
        
        <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '15px' }}>
          Informações práticas para manter seu MEI em dia.
        </p>

        {/* DASN */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '600', margin: '0 0 12px' }}>
            📋 DASN-SIMEI (Declaração Anual)
          </h2>
          <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '12px' }}>
            Todo MEI precisa entregar a Declaração Anual até o dia <strong>31 de maio</strong> do ano seguinte.
          </p>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
            <li>Informe o faturamento total do ano anterior</li>
            <li>Declare se teve empregado ou não</li>
            <li>Pode ser feita pelo Portal do Empreendedor ou app MEI</li>
            <li>Atrasou? Pode entregar com multa (mínimo R$ 50,00)</li>
          </ul>
        </div>

        {/* NFS-e */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '600', margin: '0 0 12px' }}>
            🧾 NFS-e (Nota Fiscal de Serviço)
          </h2>
          <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '12px' }}>
            A emissão de nota fiscal é obrigatória quando o cliente é pessoa jurídica (empresa).
          </p>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
            <li>Para pessoa física: só é obrigatória se o cliente pedir</li>
            <li>Use o sistema da prefeitura da sua cidade ou o emissor nacional</li>
            <li>Guarde todas as notas emitidas por pelo menos 5 anos</li>
            <li>O valor das notas entra no cálculo do limite anual do MEI</li>
          </ul>
        </div>

        {/* Reforma Tributária */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '600', margin: '0 0 12px' }}>
            🔄 Reforma Tributária (IBS / CBS)
          </h2>
          <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '12px' }}>
            A Reforma Tributária começa a valer de forma gradual a partir de 2026.
          </p>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
            <li><strong>IBS</strong> – Imposto sobre Bens e Serviços (estados e municípios)</li>
            <li><strong>CBS</strong> – Contribuição sobre Bens e Serviços (União)</li>
            <li>O MEI continua com o DAS simplificado durante a transição</li>
            <li>Fique atento às mudanças de alíquota e obrigações acessórias</li>
            <li>O FiscalMEI será atualizado conforme as regras oficiais forem publicadas</li>
          </ul>
        </div>

        {/* Dicas extras */}
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '16px', fontSize: '14px', color: '#1e40af' }}>
          <strong>Dica:</strong> Mantenha sempre o controle do seu faturamento atualizado aqui no FiscalMEI. Isso facilita muito na hora de preencher a DASN e evita surpresas com o limite.
        </div>
      </main>
    </div>
  )
}