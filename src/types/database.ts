export type SubscriptionStatus = 'trial' | 'active' | 'canceled' | 'expired';
export type Plan = 'monthly' | 'yearly' | null;
export type ActivityType = 'servico' | 'comercio' | 'ambos';
export type RevenueCategory = 'servico' | 'produto' | 'outro';
export type AlertType =
  | 'limit_70'
  | 'limit_85'
  | 'limit_95'
  | 'limit_100'
  | 'das_reminder'
  | 'das_due'
  | 'trial_ending';
export type AlertChannel = 'whatsapp' | 'email';
export type AlertStatus = 'sent' | 'failed' | 'read';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  whatsapp: string | null;
  created_at: string;
  updated_at: string;
  trial_ends_at: string | null;
  subscription_status: SubscriptionStatus;
  plan: Plan;
}

export interface Company {
  id: string;
  user_id: string;
  cnpj: string;
  razao_social: string | null;
  nome_fantasia: string | null;
  cnae_principal: string | null;
  data_abertura: string | null;
  tipo_atividade: ActivityType | null;
  limite_anual: number;
  created_at: string;
  updated_at: string;
}

export interface Revenue {
  id: string;
  company_id: string;
  date: string;
  amount: number;
  description: string | null;
  category: RevenueCategory;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  company_id: string;
  type: AlertType;
  channel: AlertChannel;
  sent_at: string;
  status: AlertStatus;
  payload: Record<string, unknown>;
}

export interface DasPayment {
  id: string;
  company_id: string;
  reference_month: string;
  amount: number;
  due_date: string;
  paid: boolean;
  paid_at: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'monthly' | 'yearly';
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  current_period_start: string;
  current_period_end: string;
  payment_provider: string | null;
  external_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  whatsapp_enabled: boolean;
  email_enabled: boolean;
  limit_alerts: boolean;
  das_reminders: boolean;
  days_before_das: number;
  created_at: string;
  updated_at: string;
}

export interface YearRevenueSummary {
  company_id: string;
  user_id: string;
  limite_anual: number;
  total_faturado: number;
  percentual_usado: number;
  saldo_restante: number;
}
