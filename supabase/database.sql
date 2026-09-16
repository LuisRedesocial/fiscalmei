-- =====================================================
-- FiscalMEI - Schema do Banco de Dados (MVP)
-- Compatível com Supabase (PostgreSQL)
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  whatsapp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Controle de teste e assinatura
  trial_ends_at TIMESTAMPTZ,
  subscription_status TEXT DEFAULT 'trial' 
    CHECK (subscription_status IN ('trial', 'active', 'canceled', 'expired')),
  plan TEXT CHECK (plan IN ('monthly', 'yearly') OR plan IS NULL)
);

-- =====================================================
-- 2. COMPANIES (CNPJ do MEI)
-- =====================================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cnpj TEXT UNIQUE NOT NULL,
  razao_social TEXT,
  nome_fantasia TEXT,
  cnae_principal TEXT,
  data_abertura DATE,
  tipo_atividade TEXT CHECK (tipo_atividade IN ('servico', 'comercio', 'ambos')),
  limite_anual NUMERIC(12,2) DEFAULT 81000.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_user_id ON companies(user_id);
CREATE INDEX idx_companies_cnpj ON companies(cnpj);

-- =====================================================
-- 3. REVENUES (Lançamentos de faturamento)
-- =====================================================
CREATE TABLE revenues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  category TEXT DEFAULT 'outro' 
    CHECK (category IN ('servico', 'produto', 'outro')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_revenues_company_date ON revenues(company_id, date);
CREATE INDEX idx_revenues_company_id ON revenues(company_id);

-- =====================================================
-- 4. ALERTS (Histórico de alertas enviados)
-- =====================================================
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL 
    CHECK (type IN ('limit_70', 'limit_85', 'limit_95', 'limit_100', 'das_reminder', 'das_due', 'trial_ending')),
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'read')),
  payload JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_alerts_company_type ON alerts(company_id, type);
CREATE INDEX idx_alerts_sent_at ON alerts(sent_at);

-- =====================================================
-- 5. DAS_PAYMENTS (Controle de pagamento do DAS)
-- =====================================================
CREATE TABLE das_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  reference_month DATE NOT NULL, -- sempre o dia 01 do mês
  amount NUMERIC(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, reference_month)
);

CREATE INDEX idx_das_company_month ON das_payments(company_id, reference_month);

-- =====================================================
-- 6. SUBSCRIPTIONS
-- =====================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  payment_provider TEXT, -- asaas, stripe, mercadopago...
  external_id TEXT,      -- ID no provedor de pagamento
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- =====================================================
-- 7. NOTIFICATION_PREFERENCES
-- =====================================================
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  whatsapp_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  limit_alerts BOOLEAN DEFAULT TRUE,
  das_reminders BOOLEAN DEFAULT TRUE,
  days_before_das INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FUNÇÕES ÚTEIS
-- =====================================================

-- Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revenues_updated_at
  BEFORE UPDATE ON revenues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEW: Faturamento acumulado do ano corrente
-- =====================================================
CREATE OR REPLACE VIEW company_year_revenue AS
SELECT 
  c.id AS company_id,
  c.user_id,
  c.limite_anual,
  COALESCE(SUM(r.amount), 0) AS total_faturado,
  ROUND((COALESCE(SUM(r.amount), 0) / c.limite_anual) * 100, 2) AS percentual_usado,
  c.limite_anual - COALESCE(SUM(r.amount), 0) AS saldo_restante
FROM companies c
LEFT JOIN revenues r 
  ON r.company_id = c.id 
  AND EXTRACT(YEAR FROM r.date) = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY c.id, c.user_id, c.limite_anual;

-- =====================================================
-- Comentários finais
-- =====================================================
COMMENT ON TABLE users IS 'Usuários do sistema (MEIs)';
COMMENT ON TABLE companies IS 'Dados do CNPJ / MEI';
COMMENT ON TABLE revenues IS 'Lançamentos de faturamento';
COMMENT ON TABLE alerts IS 'Histórico de alertas enviados';
COMMENT ON TABLE das_payments IS 'Controle de pagamento do DAS mensal';
COMMENT ON TABLE subscriptions IS 'Assinaturas ativas e históricas';
COMMENT ON TABLE notification_preferences IS 'Preferências de notificação do usuário';
COMMENT ON VIEW company_year_revenue IS 'View com o faturamento acumulado do ano atual e percentual do limite';
