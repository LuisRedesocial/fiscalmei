import { YearRevenueSummary } from '@/types/database';

export const MEI_LIMIT_2026 = 81000;
export const MEI_TOLERANCE_PERCENT = 20;
export const MEI_TOLERANCE_LIMIT = MEI_LIMIT_2026 * (1 + MEI_TOLERANCE_PERCENT / 100); // 97200

export type LimitStatus = 'safe' | 'warning' | 'danger' | 'exceeded' | 'critical';

export interface LimitAnalysis {
  totalFaturado: number;
  limiteAnual: number;
  percentualUsado: number;
  saldoRestante: number;
  status: LimitStatus;
  statusLabel: string;
  statusColor: string;
  projection: {
    dailyAverage: number;
    projectedAnnual: number;
    willExceed: boolean;
    estimatedExceedMonth: string | null;
  };
}

/**
 * Analisa o uso do limite do MEI com base no resumo do ano.
 */
export function analyzeLimit(summary: YearRevenueSummary, daysPassedInYear: number): LimitAnalysis {
  const totalFaturado = Number(summary.total_faturado) || 0;
  const limiteAnual = Number(summary.limite_anual) || MEI_LIMIT_2026;
  const percentualUsado = limiteAnual > 0 ? (totalFaturado / limiteAnual) * 100 : 0;
  const saldoRestante = Math.max(0, limiteAnual - totalFaturado);

  let status: LimitStatus = 'safe';
  let statusLabel = 'Dentro do limite';
  let statusColor = 'green';

  if (percentualUsado >= 100) {
    status = 'exceeded';
    statusLabel = 'Limite estourado';
    statusColor = 'red';
  } else if (percentualUsado >= 95) {
    status = 'critical';
    statusLabel = 'Crítico – acima de 95%';
    statusColor = 'red';
  } else if (percentualUsado >= 85) {
    status = 'danger';
    statusLabel = 'Atenção – acima de 85%';
    statusColor = 'orange';
  } else if (percentualUsado >= 70) {
    status = 'warning';
    statusLabel = 'Alerta – acima de 70%';
    statusColor = 'yellow';
  }

  // Projeção
  const safeDays = Math.max(daysPassedInYear, 1);
  const dailyAverage = totalFaturado / safeDays;
  const projectedAnnual = dailyAverage * 365;
  const willExceed = projectedAnnual > limiteAnual;

  let estimatedExceedMonth: string | null = null;
  if (willExceed && dailyAverage > 0) {
    const remainingToLimit = limiteAnual - totalFaturado;
    const daysToExceed = Math.ceil(remainingToLimit / dailyAverage);
    const exceedDate = new Date();
    exceedDate.setDate(exceedDate.getDate() + daysToExceed);
    estimatedExceedMonth = exceedDate.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });
  }

  return {
    totalFaturado,
    limiteAnual,
    percentualUsado: Math.round(percentualUsado * 100) / 100,
    saldoRestante,
    status,
    statusLabel,
    statusColor,
    projection: {
      dailyAverage: Math.round(dailyAverage * 100) / 100,
      projectedAnnual: Math.round(projectedAnnual * 100) / 100,
      willExceed,
      estimatedExceedMonth,
    },
  };
}

/**
 * Decide quais alertas de limite devem ser disparados.
 * Retorna apenas os tipos que ainda não foram enviados este ano.
 */
export function getPendingLimitAlerts(
  percentualUsado: number,
  alreadySentTypes: string[]
): AlertType[] {
  const pending: AlertType[] = [];

  const checks: { threshold: number; type: AlertType }[] = [
    { threshold: 70, type: 'limit_70' },
    { threshold: 85, type: 'limit_85' },
    { threshold: 95, type: 'limit_95' },
    { threshold: 100, type: 'limit_100' },
  ];

  for (const check of checks) {
    if (percentualUsado >= check.threshold && !alreadySentTypes.includes(check.type)) {
      pending.push(check.type);
    }
  }

  return pending;
}

export type AlertType = 'limit_70' | 'limit_85' | 'limit_95' | 'limit_100';

/**
 * Verifica se o usuário ainda está no período de trial válido.
 */
export function isTrialActive(trialEndsAt: string | null, status: string): boolean {
  if (status === 'active') return true;
  if (status !== 'trial' || !trialEndsAt) return false;
  return new Date(trialEndsAt) > new Date();
}

/**
 * Dias restantes de trial.
 */
export function daysLeftInTrial(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
