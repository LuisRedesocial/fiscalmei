'use client'

import { useRouter } from 'next/navigation'

export default function GuiasPage() {
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', paddingBottom: '80px' }}>
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button 
          onClick={() => router.push('/dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
        >
          ←
        </button>
        <span style={{ fontWeight: 'bold', fontSize: '18px' }}>Guia MEI</span>
      </header>

      <main style={{ maxWidth: '700px', margin: '0 auto', padding: '24px 16px' }}>
        
        <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '15px' }}>
          Tutoriais práticos para manter seu MEI em dia e usar melhor o FiscalMEI.
        </p>

        {/* Tutorial 1 */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '600', margin: '0 0 12px' }}>
            1. Como lançar seu faturamento
          </h2>
          <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#374151', lineHeight: '1.7' }}>
            <li>No menu inferior, toque em <strong>Lançamentos</strong></li>
            <li>Toque em <strong>+ Novo</strong></li>
            <li>Escolha a <strong>data</strong> do faturamento (pode ser de meses anteriores)</li>
            <li>Digite o <strong>valor</strong> recebido</li>
            <li>Se quiser, escreva uma descrição (ex: “Serviço de pintura”)</li>
            <li>Toque em <strong>Salvar lançamento</strong></li>
          </ol>
          <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#6b7280' }}>
            Dica: lance sempre que receber um pagamento. Assim o limite fica atualizado.
          </p>
        </div>

        {/* Tutorial 2 */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '600', margin: '0 0 12px' }}>
            2. Como acompanhar o limite do MEI
          </h2>
          <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#374151', lineHeight: '1.7' }}>
            <li>Abra a tela <strong>Início</strong> (Dashboard)</li>
            <li>Veja a barra de progresso do limite anual (R$ 81.000)</li>
            <li>Acompanhe a cor:
              <ul style={{ marginTop: '6px' }}>
                <li><strong>Verde</strong> – dentro do limite</li>
                <li><strong>Amarelo</strong> – acima de 70%</li>
                <li><strong>Laranja</strong> – acima de 85%</li>
                <li><strong>Vermelho</strong> – acima de 95%</li>
              </ul>
            </li>
            <li>O sistema avisa automaticamente quando você atinge esses patamares</li>
          </ol>
        </div>

        {/* Tutorial 3 */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '600', margin: '0 0 12px' }}>
            3. Como registrar e pagar o DAS
          </h2>
          <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#374151', lineHeight: '1.7' }}>
            <li>No menu, toque em <strong>DAS</strong></li>
            <li>Toque em <strong>Emitir DAS no site oficial da Receita</strong> para gerar a guia</li>
            <li>Depois de pagar, volte no FiscalMEI e registre o DAS do mês</li>
            <li>Marque como <strong>Pago</strong> para manter o controle</li>
            <li>Você também pode registrar DAS de meses anteriores</li>
          </ol>
          <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#6b7280' }}>
            O vencimento do DAS é todo dia 20. O sistema avisa quando estiver perto.
          </p>
        </div>

        {/* Tutorial 4 */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '600', margin: '0 0 12px' }}>
            4. Como preencher a DASN-SIMEI
          </h2>
          <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#374151', lineHeight: '1.7' }}>
            <li>A declaração deve ser entregue até <strong>31 de maio</strong> do ano seguinte</li>
            <li>Acesse o Portal do Empreendedor ou o app MEI</li>
            <li>Informe o faturamento total do ano (use o total do FiscalMEI)</li>
            <li>Declare se teve ou não empregado</li>
            <li>Envie a declaração</li>
          </ol>
          <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#6b7280' }}>
            Atrasou? Ainda pode entregar, com multa mínima de R$ 50,00.
          </p>
        </div>

        {/* Tutorial 5 */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '600', margin: '0 0 12px' }}>
            5. Quando emitir nota fiscal (NFS-e)
          </h2>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#374151', lineHeight: '1.7' }}>
            <li><strong>Cliente empresa (CNPJ):</strong> nota é obrigatória</li>
            <li><strong>Cliente pessoa física (CPF):</strong> só se a pessoa pedir</li>
            <li>Use o sistema da sua prefeitura ou o emissor nacional</li>
            <li>Guarde as notas por pelo menos 5 anos</li>
            <li>Todo valor de nota entra no limite anual do MEI</li>
          </ul>
        </div>

        {/* Tutorial 6 */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '600', margin: '0 0 12px' }}>
            6. Reforma Tributária (IBS / CBS) – o que muda
          </h2>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#374151', lineHeight: '1.7' }}>
            <li><strong>IBS</strong> – Imposto de estados e municípios</li>
            <li><strong>CBS</strong> – Contribuição da União</li>
            <li>A mudança é gradual a partir de 2026</li>
            <li>O MEI continua com DAS simplificado na transição</li>
            <li>O FiscalMEI será atualizado conforme as regras oficiais</li>
          </ul>
        </div>

        {/* Tutorial 7 */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '600', margin: '0 0 12px' }}>
            7. Como usar o Simulador MEI → ME
          </h2>
          <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#374151', lineHeight: '1.7' }}>
            <li>No menu, toque em <strong>Simulador</strong></li>
            <li>Digite seu faturamento mensal médio</li>
            <li>Toque em <strong>Calcular</strong></li>
            <li>Compare quanto você paga como MEI e quanto pagaria no Simples Nacional</li>
          </ol>
          <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#6b7280' }}>
            É uma simulação aproximada. Para decisão real, consulte um contador.
          </p>
        </div>

        {/* Dica final */}
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '16px', fontSize: '14px', color: '#1e40af' }}>
          <strong>Dica final:</strong> Use o FiscalMEI toda semana. Quanto mais atualizado estiver o seu faturamento, mais seguro você fica em relação ao limite e à DASN.
        </div>
      </main>
    </div>
  )
}